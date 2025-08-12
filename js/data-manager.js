// 统一数据管理器 - 根据环境自动选择存储策略
class DataManager {
  constructor() {
    this.environmentManager = window.environmentManager;
    this.githubStorage = window.githubStorage;
    this.initialized = false;
    
    // 等待环境管理器初始化
    this.init();
  }

  async init() {
    // 等待其他模块初始化
    if (!this.environmentManager) {
      setTimeout(() => this.init(), 100);
      return;
    }
    
    this.initialized = true;
    console.log('📊 数据管理器初始化完成');
  }

  // 检查是否应该使用GitHub存储
  shouldUseGitHubStorage() {
    return this.environmentManager && this.environmentManager.shouldUseGitHubStorage();
  }

  // 检查是否为线上环境
  isOnlineEnvironment() {
    return this.environmentManager && this.environmentManager.isOnlineEnvironment();
  }

  // 保存数据（自动选择存储策略）
  async saveData(key, data, options = {}) {
    const { category = 'general', isPublic = false, commitMessage = null } = options;
    
    try {
      // 线上环境优先使用GitHub存储
      if (this.shouldUseGitHubStorage() && this.githubStorage && this.githubStorage.token) {
        try {
          const filePath = this.generateGitHubPath(key, category);
          const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
          const message = commitMessage || `保存数据: ${key}`;
          
          await this.githubStorage.uploadFile(filePath, content, message);
          console.log(`✅ 数据已保存到GitHub: ${key}`);
          
          // 线上环境成功保存到GitHub后不保存到本地
          if (this.isOnlineEnvironment()) {
            return { success: true, storage: 'github', path: filePath };
          }
        } catch (error) {
          console.warn(`⚠️ GitHub保存失败，回退到本地存储: ${error.message}`);
        }
      }
      
      // 保存到本地存储
      localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
      console.log(`📱 数据已保存到本地存储: ${key}`);
      
      return { success: true, storage: 'local', key: key };
      
    } catch (error) {
      console.error(`❌ 数据保存失败: ${key}`, error);
      throw error;
    }
  }

  // 读取数据（自动选择存储策略）
  async loadData(key, options = {}) {
    const { category = 'general', fallbackToLocal = true } = options;
    
    try {
      // 线上环境优先从GitHub读取
      if (this.shouldUseGitHubStorage() && this.githubStorage && this.githubStorage.token) {
        try {
          const filePath = this.generateGitHubPath(key, category);
          const fileData = await this.githubStorage.getFile(filePath);
          
          if (fileData && fileData.content) {
            const content = atob(fileData.content);
            console.log(`✅ 从GitHub加载数据: ${key}`);
            
            try {
              return JSON.parse(content);
            } catch {
              return content; // 如果不是JSON，返回原始内容
            }
          }
        } catch (error) {
          if (error.message !== '文件不存在') {
            console.warn(`⚠️ 从GitHub读取失败: ${error.message}`);
          }
        }
      }
      
      // 从本地存储读取
      if (fallbackToLocal) {
        const localData = localStorage.getItem(key);
        if (localData) {
          console.log(`📱 从本地存储加载数据: ${key}`);
          try {
            return JSON.parse(localData);
          } catch {
            return localData; // 如果不是JSON，返回原始内容
          }
        }
      }
      
      return null;
      
    } catch (error) {
      console.error(`❌ 数据读取失败: ${key}`, error);
      throw error;
    }
  }

  // 删除数据
  async deleteData(key, options = {}) {
    const { category = 'general' } = options;

    try {
      let githubDeleteResult = null;

      // 从GitHub删除
      if (this.shouldUseGitHubStorage() && this.githubStorage && this.githubStorage.token) {
        try {
          const filePath = this.generateGitHubPath(key, category);
          githubDeleteResult = await this.githubStorage.deleteFile(filePath, `删除数据: ${key}`);

          // 只在调试模式下输出详细日志
          if (window.location.search.includes('debug=true')) {
            if (githubDeleteResult.alreadyDeleted) {
              console.log(`ℹ️ GitHub文件已不存在: ${key}`);
            } else {
              console.log(`✅ 从GitHub删除数据: ${key}`);
            }
          }
        } catch (error) {
          // 只有在非404错误时才记录警告
          if (!error.message.includes('文件不存在') && !error.message.includes('404') && error.status !== 404) {
            console.warn(`⚠️ 从GitHub删除失败: ${error.message}`);
          }
          // 404错误静默处理，这是正常情况
        }
      }

      // 从本地存储删除
      localStorage.removeItem(key);

      // 只在调试模式下输出日志
      if (window.location.search.includes('debug=true')) {
        console.log(`📱 从本地存储删除数据: ${key}`);
      }

      return {
        success: true,
        githubResult: githubDeleteResult
      };

    } catch (error) {
      console.error(`❌ 数据删除失败: ${key}`, error);
      throw error;
    }
  }

  // 生成GitHub文件路径
  generateGitHubPath(key, category) {
    const timestamp = new Date().toISOString().split('T')[0];
    return `data/${category}/${timestamp}_${key}.json`;
  }

  // 保存用户数据
  async saveUserData(username, userData) {
    const key = `user_${username}`;
    return await this.saveData(key, userData, {
      category: 'users',
      commitMessage: `保存用户数据: ${username}`
    });
  }

  // 读取用户数据
  async loadUserData(username) {
    const key = `user_${username}`;
    return await this.loadData(key, { category: 'users' });
  }

  // 保存作品数据
  async saveWorkData(workId, workData) {
    const key = `work_${workId}`;
    return await this.saveData(key, workData, {
      category: 'works',
      isPublic: workData.permissions?.isPublic,
      commitMessage: `保存作品: ${workData.title || workId}`
    });
  }

  // 读取作品数据
  async loadWorkData(workId) {
    const key = `work_${workId}`;
    return await this.loadData(key, { category: 'works' });
  }

  // 保存公共作品列表
  async savePublicWorksList(category, worksList) {
    const key = `publicWorks_${category}`;
    return await this.saveData(key, worksList, {
      category: 'public',
      commitMessage: `更新公共作品列表: ${category}`
    });
  }

  // 读取公共作品列表
  async loadPublicWorksList(category) {
    const key = `publicWorks_${category}`;
    return await this.loadData(key, { category: 'public' }) || [];
  }

  // 保存用户作品列表
  async saveUserWorksList(username, worksList) {
    const key = `userWorks_${username}`;
    return await this.saveData(key, worksList, {
      category: 'users',
      commitMessage: `更新用户作品列表: ${username}`
    });
  }

  // 读取用户作品列表
  async loadUserWorksList(username) {
    const key = `userWorks_${username}`;
    return await this.loadData(key, { category: 'users' }) || [];
  }

  // 获取环境信息
  getEnvironmentInfo() {
    if (!this.environmentManager) {
      return { environment: 'unknown', strategy: 'local_storage' };
    }
    
    return {
      environment: this.environmentManager.getEnvironment(),
      strategy: this.environmentManager.getStorageStrategy(),
      isOnline: this.environmentManager.isOnlineEnvironment(),
      shouldUseGitHub: this.environmentManager.shouldUseGitHubStorage()
    };
  }

  // 同步本地数据到GitHub（用于数据迁移）
  async syncLocalToGitHub() {
    if (!this.shouldUseGitHubStorage() || !this.githubStorage || !this.githubStorage.token) {
      throw new Error('GitHub存储不可用');
    }

    console.log('🔄 开始同步本地数据到GitHub...');
    
    const syncResults = {
      users: 0,
      works: 0,
      publicLists: 0,
      errors: []
    };

    try {
      // 同步用户数据
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key.startsWith('user_')) {
          try {
            const userData = JSON.parse(localStorage.getItem(key));
            await this.saveUserData(key.replace('user_', ''), userData);
            syncResults.users++;
          } catch (error) {
            syncResults.errors.push(`用户数据同步失败 ${key}: ${error.message}`);
          }
        }
        
        if (key.startsWith('work_')) {
          try {
            const workData = JSON.parse(localStorage.getItem(key));
            await this.saveWorkData(key.replace('work_', ''), workData);
            syncResults.works++;
          } catch (error) {
            syncResults.errors.push(`作品数据同步失败 ${key}: ${error.message}`);
          }
        }
        
        if (key.startsWith('publicWorks_')) {
          try {
            const listData = JSON.parse(localStorage.getItem(key));
            await this.savePublicWorksList(key.replace('publicWorks_', ''), listData);
            syncResults.publicLists++;
          } catch (error) {
            syncResults.errors.push(`公共列表同步失败 ${key}: ${error.message}`);
          }
        }
      }
      
      console.log('✅ 数据同步完成:', syncResults);
      return syncResults;
      
    } catch (error) {
      console.error('❌ 数据同步失败:', error);
      throw error;
    }
  }
}

// 创建全局实例
window.dataManager = new DataManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataManager;
}
