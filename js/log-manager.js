/**
 * 日志管理器
 * 统一控制所有组件的日志输出级别，减少生产环境的冗余日志
 */

class LogManager {
  constructor() {
    this.logLevel = this.determineLogLevel();
    this.messageCache = new Map();
    this.maxCacheSize = 200;
    this.cacheTimeout = 300000; // 5分钟缓存超时
    
    // 日志级别定义
    this.levels = {
      SILENT: 0,    // 静默模式
      ERROR: 1,     // 只显示错误
      WARN: 2,      // 显示错误和警告
      INFO: 3,      // 显示信息、警告和错误
      DEBUG: 4      // 显示所有日志
    };
    
    this.init();
  }

  // 确定日志级别
  determineLogLevel() {
    // URL参数优先级最高
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('debug')) {
      return 4; // DEBUG
    }
    if (urlParams.has('verbose')) {
      return 3; // INFO
    }
    if (urlParams.has('quiet')) {
      return 1; // ERROR
    }
    if (urlParams.has('silent')) {
      return 0; // SILENT
    }

    // 根据环境自动判断
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 3; // 本地开发环境：INFO
    }
    
    if (window.location.hostname.includes('github.io')) {
      return 1; // GitHub Pages 生产环境：ERROR
    }
    
    return 2; // 其他环境：WARN
  }

  // 初始化日志管理器
  init() {
    // 设置全局日志管理器
    window.logManager = this;
    
    // 只在调试模式下输出初始化信息
    if (this.logLevel >= 4) {
      console.log(`📊 日志管理器初始化 - 级别: ${this.getLevelName(this.logLevel)}`);
    }
  }

  // 获取级别名称
  getLevelName(level) {
    const names = ['SILENT', 'ERROR', 'WARN', 'INFO', 'DEBUG'];
    return names[level] || 'UNKNOWN';
  }

  // 检查消息是否应该被过滤（去重）
  shouldFilterMessage(message, level) {
    const messageKey = `${level}:${message.substring(0, 100)}`;
    const now = Date.now();
    
    if (this.messageCache.has(messageKey)) {
      const lastTime = this.messageCache.get(messageKey);
      // 缓存时间内的重复消息被过滤
      if (now - lastTime < this.cacheTimeout) {
        return true;
      }
    }
    
    // 更新缓存
    this.messageCache.set(messageKey, now);
    
    // 清理过期缓存
    this.cleanCache();
    
    return false;
  }

  // 清理过期缓存
  cleanCache() {
    if (this.messageCache.size <= this.maxCacheSize) return;
    
    const now = Date.now();
    const entries = Array.from(this.messageCache.entries());
    
    // 删除过期条目
    entries.forEach(([key, timestamp]) => {
      if (now - timestamp > this.cacheTimeout) {
        this.messageCache.delete(key);
      }
    });
    
    // 如果还是太大，删除最旧的条目
    if (this.messageCache.size > this.maxCacheSize) {
      const sortedEntries = entries.sort((a, b) => a[1] - b[1]);
      const toDelete = sortedEntries.slice(0, this.messageCache.size - this.maxCacheSize);
      toDelete.forEach(([key]) => this.messageCache.delete(key));
    }
  }

  // 统一的日志输出方法
  log(level, component, message, ...args) {
    // 检查日志级别
    if (this.logLevel < level) return;
    
    // 检查消息去重
    if (this.shouldFilterMessage(message, level)) return;
    
    // 格式化消息
    const prefix = this.getPrefix(level, component);
    const fullMessage = `${prefix} ${message}`;
    
    // 输出到控制台
    switch (level) {
      case this.levels.ERROR:
        console.error(fullMessage, ...args);
        break;
      case this.levels.WARN:
        console.warn(fullMessage, ...args);
        break;
      case this.levels.INFO:
        console.info(fullMessage, ...args);
        break;
      case this.levels.DEBUG:
        console.log(fullMessage, ...args);
        break;
    }
  }

  // 获取日志前缀
  getPrefix(level, component) {
    const icons = {
      [this.levels.ERROR]: '❌',
      [this.levels.WARN]: '⚠️',
      [this.levels.INFO]: 'ℹ️',
      [this.levels.DEBUG]: '🔍'
    };
    
    const icon = icons[level] || '📝';
    const componentTag = component ? `[${component}]` : '';
    
    return `${icon}${componentTag}`;
  }

  // 便捷方法
  error(component, message, ...args) {
    this.log(this.levels.ERROR, component, message, ...args);
  }

  warn(component, message, ...args) {
    this.log(this.levels.WARN, component, message, ...args);
  }

  info(component, message, ...args) {
    this.log(this.levels.INFO, component, message, ...args);
  }

  debug(component, message, ...args) {
    this.log(this.levels.DEBUG, component, message, ...args);
  }

  // 特殊方法：GitHub API 404错误处理
  github404(path, component = 'GitHub') {
    // 404错误在生产环境中不输出，只在调试模式下显示
    if (this.logLevel >= 4) {
      this.debug(component, `API 404: ${path} (正常情况，目录/文件不存在)`);
    }
  }

  // 特殊方法：跟踪保护警告处理
  trackingProtection(message, component = 'TrackingProtection') {
    // 跟踪保护警告只在首次出现时显示
    const key = 'tracking_protection_warned';
    if (!sessionStorage.getItem(key)) {
      this.warn(component, '检测到浏览器跟踪保护，已启用回退模式');
      sessionStorage.setItem(key, 'true');
    }
    
    // 详细信息只在调试模式下显示
    if (this.logLevel >= 4) {
      this.debug(component, message);
    }
  }

  // 获取当前日志级别
  getCurrentLevel() {
    return this.logLevel;
  }

  // 设置日志级别
  setLevel(level) {
    this.logLevel = level;
    this.info('LogManager', `日志级别已更改为: ${this.getLevelName(level)}`);
  }

  // 获取统计信息
  getStats() {
    return {
      level: this.getLevelName(this.logLevel),
      cacheSize: this.messageCache.size,
      maxCacheSize: this.maxCacheSize
    };
  }
}

// 创建全局实例
window.logManager = new LogManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LogManager;
}

// 只在调试模式下输出加载信息
if (window.logManager.getCurrentLevel() >= 3) {
  console.log('📊 日志管理器已加载');
}
