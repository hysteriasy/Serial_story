// 智能文件加载系统
// 根据环境自动选择最优的数据源和加载策略

class SmartFileLoader {
  constructor() {
    this.environment = this.detectEnvironment();
    this.cache = new Map();
    this.loadingPromises = new Map(); // 防止重复加载

    // 监听页面刷新需求
    this.setupRefreshListener();

    console.log(`📁 智能文件加载器初始化 - 环境: ${this.environment}`);
  }

  // 设置刷新监听器
  setupRefreshListener() {
    window.addEventListener('pageRefreshNeeded', (e) => {
      const { type, data } = e.detail;
      console.log(`📡 收到页面刷新请求: ${type}`, data);

      // 清除相关缓存
      this.clearCache();

      // 如果当前页面有文件列表，触发重新加载
      if (typeof loadEssaysList === 'function') {
        setTimeout(() => {
          loadEssaysList();
        }, 100);
      }
    });
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
    // 在file://协议下，只使用localStorage避免CORS问题
    if (window.location.protocol === 'file:') {
      return ['localStorage'];
    }

    switch (this.environment) {
      case 'github_pages':
        return ['github', 'localStorage', 'firebase'];
      case 'local_dev':
        return ['localStorage', 'localFiles', 'firebase'];
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
      case 'localFiles':
        return await this._loadFromLocalFiles(category);
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

    // 尝试加载文件索引（静默处理404错误）
    try {
      const indexKey = `${category}_index`;

      // 在生产环境中，先检查索引文件是否存在，避免404请求
      const isProduction = window.location.hostname.includes('github.io');
      if (isProduction) {
        // 生产环境中跳过索引文件加载，直接使用user-uploads扫描
        // 这避免了不必要的404请求
        throw new Error('生产环境跳过索引文件加载');
      }

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
            // 在生产环境中减少错误日志
            if (!isProduction) {
              console.warn(`跳过损坏的文件: ${fileId}`);
            }
          }
        }
      }
    } catch (error) {
      // 静默处理索引文件不存在的情况（这是正常的）
      const isProduction = window.location.hostname.includes('github.io');
      if (error.message && (error.message.includes('404') || error.message.includes('文件不存在') || error.message.includes('生产环境跳过'))) {
        // 索引文件不存在是正常情况，不输出日志
      } else if (!isProduction) {
        console.info('未找到文件索引，使用备用加载方法');
      }
    }

    // 如果索引加载失败或没有数据，尝试直接扫描user-uploads目录
    if (files.length === 0) {
      const isProduction = window.location.hostname.includes('github.io');
      const isDebug = window.location.search.includes('debug=true');

      if (!isProduction || isDebug) {
        console.log('📁 尝试直接扫描user-uploads目录...');
      }

      try {
        const uploadFiles = await this._loadFromUserUploads(category);
        files.push(...uploadFiles);
        if (uploadFiles.length > 0 && (!isProduction || isDebug)) {
          console.log(`✅ 从user-uploads目录加载到 ${uploadFiles.length} 个文件`);
        }
      } catch (error) {
        if (!isProduction || isDebug) {
          console.warn(`⚠️ 扫描user-uploads目录失败: ${error.message}`);
        }
      }
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

  // 从本地文件系统加载（用于开发环境）
  async _loadFromLocalFiles(category) {
    // 检查是否在file://协议下，如果是则跳过本地文件扫描
    if (window.location.protocol === 'file:') {
      console.log('📁 file://协议下跳过本地文件扫描，避免CORS问题');
      return [];
    }

    const files = [];

    try {
      // 根据类别确定扫描路径
      const scanPaths = this._getCategoryPaths(category);

      for (const scanPath of scanPaths) {
        try {
          console.log(`🔍 扫描本地路径: ${scanPath}`);
          const pathFiles = await this._scanLocalDirectory(scanPath);
          files.push(...pathFiles);
        } catch (error) {
          console.warn(`扫描本地路径 ${scanPath} 失败:`, error.message);
        }
      }

      return files;
    } catch (error) {
      console.error('❌ 扫描本地文件失败:', error);
      return [];
    }
  }

  // 扫描本地目录（通过fetch API）
  async _scanLocalDirectory(directoryPath) {
    const files = [];

    try {
      // 尝试获取目录列表（这在本地开发服务器中可能不工作）
      // 作为替代，我们可以尝试已知的文件
      const knownFiles = await this._getKnownLocalFiles(directoryPath);

      for (const filePath of knownFiles) {
        try {
          const response = await fetch(filePath);
          if (response.ok) {
            const content = await response.text();
            const fileData = JSON.parse(content);
            files.push({
              ...fileData,
              id: fileData.id || this._extractFileId(filePath),
              source: 'localFiles',
              filePath: filePath
            });
          }
        } catch (error) {
          console.warn(`加载本地文件失败: ${filePath}`, error.message);
        }
      }

    } catch (error) {
      console.warn(`扫描本地目录失败: ${directoryPath}`, error.message);
    }

    return files;
  }

  // 获取已知的本地文件路径
  async _getKnownLocalFiles(directoryPath) {
    const knownFiles = [];

    // 基于已知的文件结构构建文件路径
    if (directoryPath === 'user-uploads/literature/essay') {
      // 直接尝试已知的文件路径
      const knownFilePaths = [
        'user-uploads/literature/essay/hysteria/2025-08-11_essay_1754921280127.json',
        'user-uploads/literature/essay/Linlin/2025-08-11_essay_1754918793664.json'
      ];

      for (const filePath of knownFilePaths) {
        try {
          const response = await fetch(filePath, { method: 'HEAD' });
          if (response.ok) {
            knownFiles.push(filePath);
            console.log(`✅ 找到已知文件: ${filePath}`);
          } else {
            console.log(`❌ 文件不存在: ${filePath}`);
          }
        } catch (error) {
          console.log(`❌ 检查文件失败: ${filePath}`, error.message);
        }
      }
    } else if (directoryPath === 'user-uploads/literature/poetry') {
      // 直接尝试已知的poetry文件路径
      const knownPoetryPaths = [
        'user-uploads/literature/poetry/hysteria/2025-08-11_poetry_1754921380127.json',
        'user-uploads/literature/poetry/Linlin/2025-08-11_poetry_1754918893664.json',
        'user-uploads/literature/poetry/hysteria/2025-08-15_poetry_1755275214809.json'
      ];

      for (const filePath of knownPoetryPaths) {
        try {
          const response = await fetch(filePath, { method: 'HEAD' });
          if (response.ok) {
            knownFiles.push(filePath);
            const isProduction = window.location.hostname.includes('github.io');
            const isDebug = window.location.search.includes('debug=true');
            if (!isProduction || isDebug) {
              console.log(`✅ 找到已知诗歌文件: ${filePath}`);
            }
          }
        } catch (error) {
          // 文件不存在，继续
        }
      }
    }

    return knownFiles;
  }

  // 从user-uploads目录直接加载文件
  async _loadFromUserUploads(category) {
    // 检查是否有GitHub存储可用
    if (!window.githubStorage || !window.githubStorage.token) {
      console.warn('⚠️ GitHub存储不可用，尝试本地文件扫描');
      // 在GitHub Pages环境中，即使没有token也要尝试公开API
      if (this.environment === 'github_pages') {
        console.log('🌐 GitHub Pages环境，尝试使用公开API扫描...');
        return await this._loadFromGitHubPublic(category);
      }
      return await this._loadFromLocalFiles(category);
    }

    const files = [];

    try {
      // 根据类别确定扫描路径
      const scanPaths = this._getCategoryPaths(category);

      for (const scanPath of scanPaths) {
        try {
          const isProduction = window.location.hostname.includes('github.io');
          const isDebug = window.location.search.includes('debug=true');

          if (!isProduction || isDebug) {
            console.log(`🔍 扫描GitHub路径: ${scanPath}`);
          }

          const pathFiles = await this._scanDirectoryRecursively(scanPath);
          files.push(...pathFiles);
        } catch (error) {
          // 404错误是正常的（目录可能不存在）
          const isProduction = window.location.hostname.includes('github.io');
          const isDebug = window.location.search.includes('debug=true');

          if (error.status !== 404 && (!isProduction || isDebug)) {
            console.warn(`扫描路径 ${scanPath} 失败:`, error.message);
          }
        }
      }

      return files;
    } catch (error) {
      console.error('❌ 扫描user-uploads目录失败:', error);
      // 如果GitHub扫描失败，尝试本地文件
      console.log('🔄 回退到本地文件扫描...');
      return await this._loadFromLocalFiles(category);
    }
  }

  // 获取类别对应的扫描路径
  _getCategoryPaths(category) {
    if (category === 'essays') {
      return ['user-uploads/literature/essay'];
    } else if (category === 'poetry') {
      return ['user-uploads/literature/poetry'];
    }
    // 可以根据需要扩展其他类别
    return [`user-uploads/${category}`];
  }

  // 从GitHub公开API加载（无需token）
  async _loadFromGitHubPublic(category) {
    const files = [];

    try {
      // 根据类别确定扫描路径
      const scanPaths = this._getCategoryPaths(category);

      for (const scanPath of scanPaths) {
        try {
          const isProduction = window.location.hostname.includes('github.io');
          const isDebug = window.location.search.includes('debug=true');
          if (!isProduction || isDebug) {
            console.log(`🔍 使用公开API扫描GitHub路径: ${scanPath}`);
          }
          const pathFiles = await this._scanDirectoryPublic(scanPath);
          files.push(...pathFiles);
        } catch (error) {
          // 404错误是正常的（目录可能不存在）
          const isProduction = window.location.hostname.includes('github.io');
          const isDebug = window.location.search.includes('debug=true');
          if (error.status !== 404 && (!isProduction || isDebug)) {
            console.warn(`公开API扫描路径 ${scanPath} 失败:`, error.message);
          }
        }
      }

      return files;
    } catch (error) {
      console.error('❌ 公开API扫描user-uploads目录失败:', error);
      return [];
    }
  }

  // 递归扫描目录
  async _scanDirectoryRecursively(directoryPath) {
    const files = [];

    try {
      const response = await fetch(
        `https://api.github.com/repos/hysteriasy/Serial_story/contents/${directoryPath}`,
        {
          headers: {
            'Authorization': `Bearer ${window.githubStorage.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          const error = new Error('目录不存在');
          error.status = 404;
          throw error;
        }
        throw new Error(`API请求失败: ${response.status}`);
      }

      const items = await response.json();

      for (const item of items) {
        if (item.type === 'file' && item.name.endsWith('.json')) {
          // 加载文件内容
          try {
            const fileContent = await this._loadFileContent(item.path);
            if (fileContent) {
              files.push({
                ...fileContent,
                id: fileContent.id || this._extractFileId(item.name),
                source: 'github_uploads',
                filePath: item.path
              });
            }
          } catch (error) {
            const isProduction = window.location.hostname.includes('github.io');
            const isDebug = window.location.search.includes('debug=true');
            if (!isProduction || isDebug) {
              console.warn(`加载文件内容失败: ${item.path}`, error.message);
            }
          }
        } else if (item.type === 'dir') {
          // 递归扫描子目录
          try {
            const subFiles = await this._scanDirectoryRecursively(item.path);
            files.push(...subFiles);
          } catch (error) {
            const isProduction = window.location.hostname.includes('github.io');
            const isDebug = window.location.search.includes('debug=true');
            if (!isProduction || isDebug) {
              console.warn(`扫描子目录失败: ${item.path}`, error.message);
            }
          }
        }
      }

    } catch (error) {
      throw error;
    }

    return files;
  }

  // 使用公开API扫描目录
  async _scanDirectoryPublic(directoryPath) {
    const files = [];

    try {
      const response = await fetch(
        `https://api.github.com/repos/hysteriasy/Serial_story/contents/${directoryPath}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          const error = new Error('目录不存在');
          error.status = 404;
          throw error;
        }
        throw new Error(`API请求失败: ${response.status}`);
      }

      const items = await response.json();

      for (const item of items) {
        if (item.type === 'file' && item.name.endsWith('.json')) {
          // 加载文件内容
          try {
            const fileContent = await this._loadFileContentPublic(item.download_url);
            if (fileContent) {
              files.push({
                ...fileContent,
                id: fileContent.id || this._extractFileId(item.name),
                source: 'github_uploads',
                filePath: item.path
              });
            }
          } catch (error) {
            const isProduction = window.location.hostname.includes('github.io');
            const isDebug = window.location.search.includes('debug=true');
            if (!isProduction || isDebug) {
              console.warn(`加载文件内容失败: ${item.path}`, error.message);
            }
          }
        } else if (item.type === 'dir') {
          // 递归扫描子目录
          try {
            const subFiles = await this._scanDirectoryPublic(item.path);
            files.push(...subFiles);
          } catch (error) {
            const isProduction = window.location.hostname.includes('github.io');
            const isDebug = window.location.search.includes('debug=true');
            if (!isProduction || isDebug) {
              console.warn(`扫描子目录失败: ${item.path}`, error.message);
            }
          }
        }
      }

    } catch (error) {
      throw error;
    }

    return files;
  }

  // 使用公开API加载文件内容
  async _loadFileContentPublic(downloadUrl) {
    try {
      const response = await fetch(downloadUrl, {
        headers: {
          'Accept': 'application/json; charset=utf-8'
        }
      });
      if (response.ok) {
        // 确保以UTF-8编码读取文本
        const content = await response.text();
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn(`公开API加载文件内容失败: ${downloadUrl}`, error.message);
      throw error;
    }
    return null;
  }

  // 加载文件内容
  async _loadFileContent(filePath) {
    try {
      const fileData = await window.githubStorage.getFile(filePath);
      if (fileData && fileData.content) {
        // 正确处理UTF-8编码的base64内容
        const content = this._decodeBase64UTF8(fileData.content);
        return JSON.parse(content);
      }
    } catch (error) {
      if (!error.isExpected) {
        console.warn(`加载文件内容失败: ${filePath}`, error.message);
      }
      throw error;
    }
    return null;
  }

  // 正确解码base64编码的UTF-8字符串
  _decodeBase64UTF8(base64String) {
    try {
      // 使用TextDecoder正确处理UTF-8编码
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(bytes);
    } catch (error) {
      console.warn('UTF-8解码失败，尝试直接解码:', error.message);
      // 回退到简单的atob解码
      return atob(base64String);
    }
  }

  // 从文件名提取文件ID
  _extractFileId(fileName) {
    // 文件名格式: 2025-08-11_essay_1754921280127.json
    const match = fileName.match(/(\d+)\.json$/);
    return match ? match[1] : fileName.replace('.json', '');
  }

  // 检查文件是否匹配类别
  _matchesCategory(fileData, category) {
    if (category === 'essays') {
      // 严格匹配essay类别，避免混合其他文学类型
      return (fileData.mainCategory === 'literature' && fileData.subcategory === 'essay') ||
             (fileData.category === 'essay') ||
             (!fileData.mainCategory && !fileData.subcategory && !fileData.category && !fileData.type); // 兼容旧格式
    } else if (category === 'poetry') {
      // 严格匹配poetry类别
      return (fileData.mainCategory === 'literature' && fileData.subcategory === 'poetry') ||
             (fileData.category === 'poetry') ||
             (fileData.poetryType); // poetry特有字段
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
