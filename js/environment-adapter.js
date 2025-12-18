// 环境适配器 - 优化GitHub Pages静态托管环境兼容性
// 专门处理静态托管环境下的存储、网络和功能适配问题

class EnvironmentAdapter {
  constructor() {
    this.environment = this.detectEnvironment();
    this.capabilities = this.detectCapabilities();
    this.storageStrategy = this.determineOptimalStorageStrategy();
    this.networkStrategy = this.determineNetworkStrategy();
    
    // 初始化适配器
    this.init();
  }

  // 精确的环境检测
  detectEnvironment() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const pathname = window.location.pathname;
    const userAgent = navigator.userAgent;

    // GitHub Pages 环境检测
    if (hostname === 'hysteriasy.github.io' || 
        (hostname.includes('github.io') && pathname.includes('Serial_story'))) {
      return {
        type: 'github_pages',
        isStatic: true,
        isOnline: true,
        supportsCORS: true,
        supportsAPI: true
      };
    }

    // 本地文件环境
    if (protocol === 'file:') {
      return {
        type: 'local_file',
        isStatic: true,
        isOnline: false,
        supportsCORS: false,
        supportsAPI: false
      };
    }

    // 本地开发服务器
    if (hostname === 'localhost' || hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return {
        type: 'local_server',
        isStatic: false,
        isOnline: true,
        supportsCORS: true,
        supportsAPI: true
      };
    }

    // 其他生产环境
    return {
      type: 'production',
      isStatic: true,
      isOnline: true,
      supportsCORS: true,
      supportsAPI: true
    };
  }

  // 检测浏览器和环境能力
  detectCapabilities() {
    const capabilities = {
      localStorage: this.testLocalStorage(),
      sessionStorage: this.testSessionStorage(),
      indexedDB: this.testIndexedDB(),
      fetch: typeof fetch !== 'undefined',
      cors: this.environment.supportsCORS,
      webWorkers: typeof Worker !== 'undefined',
      serviceWorkers: 'serviceWorker' in navigator,
      trackingProtection: this.detectTrackingProtection()
    };

    return capabilities;
  }

  // 测试 localStorage 可用性
  testLocalStorage() {
    try {
      const testKey = '__env_adapter_test__';
      localStorage.setItem(testKey, 'test');
      const result = localStorage.getItem(testKey) === 'test';
      localStorage.removeItem(testKey);
      return result;
    } catch (error) {
      return false;
    }
  }

  // 测试 sessionStorage 可用性
  testSessionStorage() {
    try {
      const testKey = '__env_adapter_test__';
      sessionStorage.setItem(testKey, 'test');
      const result = sessionStorage.getItem(testKey) === 'test';
      sessionStorage.removeItem(testKey);
      return result;
    } catch (error) {
      return false;
    }
  }

  // 测试 IndexedDB 可用性
  testIndexedDB() {
    return 'indexedDB' in window && indexedDB !== null;
  }

  // 检测跟踪保护
  detectTrackingProtection() {
    // 检测常见的跟踪保护特征
    const hasTrackingProtection = !this.capabilities?.localStorage || 
                                  navigator.doNotTrack === '1' ||
                                  window.navigator.globalPrivacyControl;
    
    return hasTrackingProtection;
  }

  // 确定最优存储策略
  determineOptimalStorageStrategy() {
    const { type, isOnline } = this.environment;
    const { localStorage: hasLocalStorage, trackingProtection } = this.capabilities;

    // GitHub Pages 环境
    if (type === 'github_pages') {
      if (this.hasGitHubToken() && isOnline) {
        return 'github_primary_local_cache';
      } else {
        return hasLocalStorage ? 'local_storage_only' : 'memory_storage';
      }
    }

    // 本地文件环境
    if (type === 'local_file') {
      return hasLocalStorage ? 'local_storage_only' : 'memory_storage';
    }

    // 本地开发环境
    if (type === 'local_server') {
      return hasLocalStorage ? 'local_storage_primary' : 'memory_storage';
    }

    // 默认策略
    return hasLocalStorage ? 'local_storage_only' : 'memory_storage';
  }

  // 确定网络策略
  determineNetworkStrategy() {
    const { type, isOnline, supportsAPI } = this.environment;

    if (!isOnline || !supportsAPI) {
      return 'offline_only';
    }

    if (type === 'github_pages' && this.hasGitHubToken()) {
      return 'github_api_primary';
    }

    return 'local_only';
  }

  // 检查 GitHub Token 可用性
  hasGitHubToken() {
    try {
      const token = localStorage.getItem('github_token');
      return token && token.length > 0;
    } catch (error) {
      return false;
    }
  }

  // 初始化适配器
  init() {
    // 设置全局环境信息
    window.environmentAdapter = this;
    
    // 配置存储适配器
    this.setupStorageAdapter();
    
    // 配置网络适配器
    this.setupNetworkAdapter();
    
    // 设置错误处理
    this.setupErrorHandling();
    
    // 只在开发环境下输出详细信息
    if (this.shouldLogDetails()) {
      this.logEnvironmentInfo();
    }
  }

  // 设置存储适配器
  setupStorageAdapter() {
    window.adaptiveStorage = {
      strategy: this.storageStrategy,
      
      get: (key) => this.adaptiveGet(key),
      set: (key, value) => this.adaptiveSet(key, value),
      remove: (key) => this.adaptiveRemove(key),
      clear: () => this.adaptiveClear(),
      
      // 获取存储状态
      getStatus: () => ({
        strategy: this.storageStrategy,
        capabilities: this.capabilities,
        environment: this.environment
      })
    };
  }

  // 设置网络适配器
  setupNetworkAdapter() {
    window.adaptiveNetwork = {
      strategy: this.networkStrategy,
      
      // 适配性的网络请求
      request: (url, options) => this.adaptiveRequest(url, options),
      
      // 检查网络状态
      isOnline: () => this.environment.isOnline && navigator.onLine,
      
      // 获取网络状态
      getStatus: () => ({
        strategy: this.networkStrategy,
        isOnline: this.environment.isOnline,
        supportsAPI: this.environment.supportsAPI
      })
    };
  }

  // 设置错误处理
  setupErrorHandling() {
    // 静默处理跟踪保护相关错误
    if (this.environment.type === 'github_pages' || this.environment.type === 'local_file') {
      this.setupSilentErrorHandling();
    }
  }

  // 设置静默错误处理
  setupSilentErrorHandling() {
    const originalError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      // 过滤跟踪保护相关错误
      if (typeof message === 'string' && (
          message.includes('Tracking Prevention') ||
          message.includes('blocked access to storage') ||
          message.includes('QuotaExceededError')
      )) {
        return true; // 阻止错误显示
      }
      
      if (originalError) {
        return originalError(message, source, lineno, colno, error);
      }
      return false;
    };
  }

  // 适配性存储获取
  adaptiveGet(key) {
    try {
      switch (this.storageStrategy) {
        case 'local_storage_only':
        case 'local_storage_primary':
          return localStorage.getItem(key);
        case 'github_primary_local_cache':
          // 优先从本地缓存读取，异步同步GitHub
          return localStorage.getItem(key);
        case 'memory_storage':
          return this.memoryStorage?.[key] || null;
        default:
          return null;
      }
    } catch (error) {
      return null;
    }
  }

  // 适配性存储设置
  adaptiveSet(key, value) {
    try {
      switch (this.storageStrategy) {
        case 'local_storage_only':
        case 'local_storage_primary':
          localStorage.setItem(key, value);
          return true;
        case 'github_primary_local_cache':
          // 同时保存到本地和计划同步到GitHub
          localStorage.setItem(key, value);
          this.scheduleGitHubSync(key, value);
          return true;
        case 'memory_storage':
          if (!this.memoryStorage) this.memoryStorage = {};
          this.memoryStorage[key] = value;
          return true;
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  // 适配性存储删除
  adaptiveRemove(key) {
    try {
      switch (this.storageStrategy) {
        case 'local_storage_only':
        case 'local_storage_primary':
        case 'github_primary_local_cache':
          localStorage.removeItem(key);
          return true;
        case 'memory_storage':
          if (this.memoryStorage) {
            delete this.memoryStorage[key];
          }
          return true;
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  // 适配性存储清空
  adaptiveClear() {
    try {
      switch (this.storageStrategy) {
        case 'local_storage_only':
        case 'local_storage_primary':
        case 'github_primary_local_cache':
          localStorage.clear();
          return true;
        case 'memory_storage':
          this.memoryStorage = {};
          return true;
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  // 计划GitHub同步（防抖）
  scheduleGitHubSync(key, value) {
    if (!this.syncQueue) this.syncQueue = new Map();
    
    this.syncQueue.set(key, value);
    
    // 防抖处理，5秒后批量同步
    if (this.syncTimeout) clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.performGitHubSync();
    }, 5000);
  }

  // 执行GitHub同步
  async performGitHubSync() {
    if (!this.syncQueue || this.syncQueue.size === 0) return;
    
    try {
      // 这里可以调用GitHub存储API
      if (window.githubStorage && window.githubStorage.token) {
        // 批量同步逻辑
        console.log('🔄 执行GitHub同步...');
      }
    } catch (error) {
      // 静默处理同步错误
    } finally {
      this.syncQueue.clear();
    }
  }

  // 适配性网络请求
  async adaptiveRequest(url, options = {}) {
    if (!this.environment.isOnline) {
      throw new Error('网络不可用');
    }

    try {
      return await fetch(url, options);
    } catch (error) {
      // 在静态环境下静默处理网络错误
      if (this.environment.isStatic) {
        return null;
      }
      throw error;
    }
  }

  // 检查是否应该输出详细日志
  shouldLogDetails() {
    return this.environment.type === 'local_server' || 
           window.location.search.includes('debug=true');
  }

  // 输出环境信息
  logEnvironmentInfo() {
    console.log('🌍 环境适配器初始化完成');
    console.log('📊 环境信息:', this.environment);
    console.log('🔧 能力检测:', this.capabilities);
    console.log('💾 存储策略:', this.storageStrategy);
    console.log('🌐 网络策略:', this.networkStrategy);
  }

  // 获取完整状态
  getStatus() {
    return {
      environment: this.environment,
      capabilities: this.capabilities,
      storageStrategy: this.storageStrategy,
      networkStrategy: this.networkStrategy,
      memoryUsage: this.memoryStorage ? Object.keys(this.memoryStorage).length : 0
    };
  }
}

// 立即初始化环境适配器
window.environmentAdapter = new EnvironmentAdapter();

console.log('🚀 环境适配器已加载');
