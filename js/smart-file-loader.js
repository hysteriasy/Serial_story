// 智能文件加载系统
// 根据环境自动选择最优的数据源和加载策略

class SmartFileLoader {
  constructor() {
    this.environment = this.detectEnvironment();
    this.cache = new Map();
    this.loadingPromises = new Map(); // 防止重复加载
    
    console.log(`📁 智能文件加载器初始化 - 环境: ${this.environment}`);
  }

  // 检测运行环境
  detectEnvironment() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname === 'hysteriasy.github.io') {
      return 'github_pages';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'local_dev';
    } else if (protocol === 'file:') {
      return 'file_system';
    } else {
      return 'unknown';
    }
  }

  // 获取数据源优先级
  getDataSourcePriority() {
    switch (this.environment) {
      case 'github_pages':
        return ['github', 'localStorage', 'firebase'];
      case 'local_dev':
        return ['localStorage', 'github', 'firebase'];
      case 'file_system':
        return ['localStorage', 'firebase'];
      default:
        return ['localStorage', 'firebase', 'github'];
    }
  }

  // 智能加载文件列表
  async loadFileList(category = 'essays') {
    const cacheKey = `fileList_${category}`;
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30000) { // 30秒缓存
        return cached.data;
      }
    }

    // 防止重复加载
    if (this.loadingPromises.has(cacheKey)) {
      return await this.loadingPromises.get(cacheKey);
    }

    const loadPromise = this._performFileListLoad(category);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      
      // 缓存结果
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  // 执行实际的文件列表加载
  async _performFileListLoad(category) {
    const dataSources = this.getDataSourcePriority();
    const results = [];
    const errors = [];

    for (const source of dataSources) {
      try {
        const data = await this._loadFromSource(source, category);
        if (data && data.length > 0) {
          results.push(...data);
          console.log(`✅ 从 ${source} 加载到 ${data.length} 个文件`);
        }
      } catch (error) {
        errors.push({ source, error: error.message });
        console.warn(`⚠️ 从 ${source} 加载失败:`, error.message);
      }
    }

    // 去重和合并
    const uniqueFiles = this._deduplicateFiles(results);
    
    if (uniqueFiles.length === 0 && errors.length > 0) {
      console.error('❌ 所有数据源加载失败:', errors);
    }

    return uniqueFiles;
  }

  // 从指定数据源加载
  async _loadFromSource(source, category) {
    switch (source) {
      case 'github':
        return await this._loadFromGitHub(category);
      case 'localStorage':
        return await this._loadFromLocalStorage(category);
      case 'firebase':
        return await this._loadFromFirebase(category);
      default:
        throw new Error(`未知的数据源: ${source}`);
    }
  }

  // 从 GitHub 加载
  async _loadFromGitHub(category) {
    if (!window.dataManager || !window.dataManager.shouldUseGitHubStorage()) {
      throw new Error('GitHub 存储不可用');
    }

    const files = [];
    
    // 尝试加载文件索引
    try {
      const indexKey = `${category}_index`;
      const index = await window.dataManager.loadData(indexKey, { 
        category: 'system',
        fallbackToLocal: false 
      });
      
      if (index && index.files) {
        for (const fileId of index.files) {
          try {
            const fileData = await window.dataManager.loadData(`work_${fileId}`, { 
              category: 'works',
              fallbackToLocal: false 
            });
            if (fileData) {
              files.push({ ...fileData, id: fileId, source: 'github' });
            }
          } catch (error) {
            console.warn(`跳过损坏的文件: ${fileId}`);
          }
        }
      }
    } catch (error) {
      // 如果没有索引，尝试其他方法
      console.info('未找到文件索引，使用备用加载方法');
    }

    return files;
  }

  // 从本地存储加载
  async _loadFromLocalStorage(category) {
    const files = [];
    
    try {
      // 使用存储优化器安全访问
      const keys = window.safeLocalStorage ? 
                   window.safeLocalStorage.getAllKeys() : 
                   Object.keys(localStorage);
      
      const workKeys = keys.filter(key => key.startsWith('work_'));
      
      for (const key of workKeys) {
        try {
          const data = window.safeLocalStorage ? 
                      window.safeLocalStorage.getItem(key) : 
                      localStorage.getItem(key);
          
          if (data) {
            const fileData = JSON.parse(data);
            if (this._matchesCategory(fileData, category)) {
              const fileId = key.replace('work_', '');
              files.push({ ...fileData, id: fileId, source: 'localStorage' });
            }
          }
        } catch (error) {
          console.warn(`跳过损坏的本地文件: ${key}`);
        }
      }
    } catch (error) {
      throw new Error(`本地存储访问失败: ${error.message}`);
    }

    return files;
  }

  // 从 Firebase 加载
  async _loadFromFirebase(category) {
    if (!window.firebaseAvailable || !firebase.apps.length) {
      throw new Error('Firebase 不可用');
    }

    const files = [];
    
    try {
      // 这里需要根据实际的 Firebase 数据结构来实现
      // 暂时返回空数组
      console.info('Firebase 加载功能待实现');
    } catch (error) {
      throw new Error(`Firebase 加载失败: ${error.message}`);
    }

    return files;
  }

  // 检查文件是否匹配类别
  _matchesCategory(fileData, category) {
    if (category === 'essays') {
      return fileData.type === 'literature' || 
             fileData.category === 'essay' ||
             !fileData.type; // 兼容旧格式
    }
    return fileData.type === category || fileData.category === category;
  }

  // 去重文件
  _deduplicateFiles(files) {
    const seen = new Set();
    const unique = [];

    for (const file of files) {
      const key = file.id || file.title || JSON.stringify(file);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(file);
      }
    }

    return unique;
  }

  // 清除缓存
  clearCache() {
    this.cache.clear();
    console.log('📁 文件加载器缓存已清除');
  }

  // 获取加载统计
  getStats() {
    return {
      environment: this.environment,
      cacheSize: this.cache.size,
      activeLoads: this.loadingPromises.size,
      dataSources: this.getDataSourcePriority()
    };
  }
}

// 创建全局实例
window.smartFileLoader = new SmartFileLoader();

console.log('📁 智能文件加载器已加载');
