// 生产环境日志管理器
// 专门用于GitHub Pages环境的日志优化和控制台清理

class ProductionLogger {
  constructor() {
    this.isProduction = window.location.hostname.includes('github.io');
    this.isDebug = window.location.search.includes('debug=true');
    this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // 日志级别
    this.logLevel = this.determineLogLevel();
    
    // 统计信息
    this.stats = {
      filteredLogs: 0,
      filteredWarns: 0,
      filteredErrors: 0,
      startTime: Date.now()
    };
    
    // 消息缓存，避免重复日志
    this.messageCache = new Map();
    this.maxCacheSize = 100;
    
    this.init();
  }
  
  // 确定日志级别
  determineLogLevel() {
    if (this.isDebug) return 3; // 调试模式：显示所有日志
    if (this.isLocalhost) return 2; // 开发模式：显示警告和错误
    if (this.isProduction) return 0; // 生产模式：静默模式
    return 1; // 其他环境：只显示错误
  }
  
  // 初始化日志管理器
  init() {
    if (this.logLevel === 0) {
      this.enableSilentMode();
    } else {
      this.enableFilteredMode();
    }
    
    // 在调试模式下显示初始化信息
    if (this.logLevel >= 3) {
      console.log('📊 生产环境日志管理器已启动', {
        环境: this.isProduction ? 'GitHub Pages' : (this.isLocalhost ? '本地开发' : '其他'),
        日志级别: this.logLevel,
        调试模式: this.isDebug
      });
    }
  }
  
  // 启用静默模式（生产环境）
  enableSilentMode() {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };
    
    // 重写console.log - 只保留关键系统消息
    console.log = (...args) => {
      const message = args.join(' ');
      if (this.isSystemCriticalMessage(message)) {
        originalConsole.log.apply(console, args);
      } else {
        this.stats.filteredLogs++;
      }
    };
    
    // 重写console.warn - 只保留真正的警告
    console.warn = (...args) => {
      const message = args.join(' ');
      if (this.isImportantWarning(message)) {
        originalConsole.warn.apply(console, args);
      } else {
        this.stats.filteredWarns++;
      }
    };
    
    // 重写console.error - 只保留真正的错误
    console.error = (...args) => {
      const message = args.join(' ');
      if (this.isImportantError(message)) {
        originalConsole.error.apply(console, args);
      } else {
        this.stats.filteredErrors++;
      }
    };
    
    // 重写console.info - 完全静默
    console.info = () => {
      this.stats.filteredLogs++;
    };
  }
  
  // 启用过滤模式（开发环境）
  enableFilteredMode() {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };
    
    // 过滤重复消息
    console.log = (...args) => {
      if (this.shouldShowMessage(args.join(' '), 'log')) {
        originalConsole.log.apply(console, args);
      } else {
        this.stats.filteredLogs++;
      }
    };
    
    console.warn = (...args) => {
      if (this.shouldShowMessage(args.join(' '), 'warn')) {
        originalConsole.warn.apply(console, args);
      } else {
        this.stats.filteredWarns++;
      }
    };
    
    console.error = (...args) => {
      if (this.shouldShowMessage(args.join(' '), 'error')) {
        originalConsole.error.apply(console, args);
      } else {
        this.stats.filteredErrors++;
      }
    };
  }
  
  // 判断是否为系统关键消息
  isSystemCriticalMessage(message) {
    const criticalPatterns = [
      '认证失败',
      '登录成功',
      '系统错误',
      '数据丢失',
      '权限错误',
      '网络连接失败'
    ];
    
    return criticalPatterns.some(pattern => message.includes(pattern));
  }
  
  // 判断是否为重要警告
  isImportantWarning(message) {
    // 过滤掉的警告类型
    const filteredPatterns = [
      'Tracking Prevention',
      'blocked access to storage',
      'iOS特定修复',
      '跟踪保护',
      'Firebase 不可用',
      '初始化部分失败',
      'deprecated'
    ];
    
    return !filteredPatterns.some(pattern => message.includes(pattern));
  }
  
  // 判断是否为重要错误
  isImportantError(message) {
    // 过滤掉的错误类型
    const filteredPatterns = [
      'googleads',
      'doubleclick',
      'ad_status.js',
      'ERR_NAME_NOT_RESOLVED',
      'ERR_BLOCKED_BY_CLIENT',
      'Failed to load resource',
      'Firebase 初始化失败',
      '存储访问失败'
    ];
    
    return !filteredPatterns.some(pattern => message.includes(pattern));
  }
  
  // 判断是否应该显示消息（去重）
  shouldShowMessage(message, type) {
    const key = `${type}:${message}`;
    const now = Date.now();
    
    // 检查是否为重复消息
    if (this.messageCache.has(key)) {
      const lastTime = this.messageCache.get(key);
      // 5秒内的重复消息不显示
      if (now - lastTime < 5000) {
        return false;
      }
    }
    
    // 更新缓存
    this.messageCache.set(key, now);
    
    // 清理过期缓存
    if (this.messageCache.size > this.maxCacheSize) {
      this.cleanupCache();
    }
    
    return true;
  }
  
  // 清理过期缓存
  cleanupCache() {
    const now = Date.now();
    const expireTime = 30000; // 30秒过期
    
    for (const [key, time] of this.messageCache.entries()) {
      if (now - time > expireTime) {
        this.messageCache.delete(key);
      }
    }
  }
  
  // 获取统计信息
  getStats() {
    const runtime = Date.now() - this.stats.startTime;
    return {
      ...this.stats,
      runtime: Math.round(runtime / 1000),
      environment: this.isProduction ? 'production' : (this.isLocalhost ? 'development' : 'other'),
      logLevel: this.logLevel
    };
  }
  
  // 显示统计信息（仅在调试模式下）
  showStats() {
    if (this.logLevel >= 3) {
      const stats = this.getStats();
      console.table(stats);
    }
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  window.productionLogger = new ProductionLogger();
  
  // 在调试模式下，5分钟后显示统计信息
  if (window.productionLogger.logLevel >= 3) {
    setTimeout(() => {
      window.productionLogger.showStats();
    }, 300000);
  }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductionLogger;
}
