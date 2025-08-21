// Essays页面专用日志管理器
// 专门优化essays.html页面的控制台输出

class EssaysLogger {
  constructor() {
    this.isProduction = window.location.hostname.includes('github.io');
    this.isDebug = window.location.search.includes('debug=true');
    this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // 日志级别：0=静默, 1=错误, 2=警告, 3=调试
    this.logLevel = this.determineLogLevel();
    
    // 统计信息
    this.stats = {
      filteredMessages: 0,
      startTime: Date.now(),
      messageTypes: {
        initialization: 0,
        dataLoading: 0,
        authentication: 0,
        fileOperations: 0,
        permissions: 0
      }
    };
    
    // 消息分类模式
    this.messagePatterns = {
      initialization: [
        '初始化', '组件', '加载完成', '开始初始化', '✅', '🚀', '🎉'
      ],
      dataLoading: [
        '智能加载器', '扫描', '验证', '文件', '数据', '📁', '🔍', '📊'
      ],
      authentication: [
        '登录', '认证', '用户', '权限', '🔐', '👤', '🔄'
      ],
      fileOperations: [
        'GitHub', 'API', '404', '文件不存在', '❌', '⚠️'
      ],
      permissions: [
        '权限', '访问控制', '过滤', '🛡️', '🔒'
      ]
    };
    
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
      this.enableProductionMode();
    } else if (this.logLevel === 1) {
      this.enableErrorOnlyMode();
    } else {
      this.enableFilteredMode();
    }
    
    // 在调试模式下显示初始化信息
    if (this.logLevel >= 3) {
      console.log('📝 Essays页面日志管理器已启动', {
        环境: this.isProduction ? 'GitHub Pages' : (this.isLocalhost ? '本地开发' : '其他'),
        日志级别: this.logLevel,
        调试模式: this.isDebug
      });
    }
  }
  
  // 启用生产模式（完全静默）
  enableProductionMode() {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };
    
    // 重写console.log - 只保留关键系统消息
    console.log = (...args) => {
      const message = args.join(' ');
      if (this.isCriticalMessage(message)) {
        originalConsole.log.apply(console, args);
      } else {
        this.stats.filteredMessages++;
        this.categorizeMessage(message);
      }
    };
    
    // 重写console.info - 完全静默
    console.info = () => {
      this.stats.filteredMessages++;
    };
    
    // 保留警告和错误，但过滤已知的无害消息
    console.warn = (...args) => {
      const message = args.join(' ');
      if (this.isImportantWarning(message)) {
        originalConsole.warn.apply(console, args);
      } else {
        this.stats.filteredMessages++;
      }
    };
    
    console.error = (...args) => {
      const message = args.join(' ');
      if (this.isImportantError(message)) {
        originalConsole.error.apply(console, args);
      } else {
        this.stats.filteredMessages++;
      }
    };
  }
  
  // 启用仅错误模式
  enableErrorOnlyMode() {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };
    
    console.log = (...args) => {
      const message = args.join(' ');
      if (this.isCriticalMessage(message)) {
        originalConsole.log.apply(console, args);
      } else {
        this.stats.filteredMessages++;
      }
    };
    
    console.warn = (...args) => {
      const message = args.join(' ');
      if (this.isImportantWarning(message)) {
        originalConsole.warn.apply(console, args);
      } else {
        this.stats.filteredMessages++;
      }
    };
    
    // 保留所有错误
    console.error = originalConsole.error;
  }
  
  // 启用过滤模式（开发环境）
  enableFilteredMode() {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };
    
    // 减少重复的初始化日志
    console.log = (...args) => {
      const message = args.join(' ');
      if (this.shouldShowMessage(message)) {
        originalConsole.log.apply(console, args);
      } else {
        this.stats.filteredMessages++;
        this.categorizeMessage(message);
      }
    };
    
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  }
  
  // 判断是否为关键系统消息
  isCriticalMessage(message) {
    const criticalPatterns = [
      '登录成功',
      '登录失败', 
      '认证失败',
      '系统错误',
      '数据丢失',
      '权限错误',
      '网络连接失败',
      '❌ initHeader 函数未找到',
      '❌ initFooter 函数未找到'
    ];
    
    return criticalPatterns.some(pattern => message.includes(pattern));
  }
  
  // 判断是否为重要警告
  isImportantWarning(message) {
    // 过滤掉的警告类型
    const filteredPatterns = [
      '获取GitHub文件失败',
      '扫描路径',
      '跳过损坏的文件',
      '检查文件存在性失败',
      'Firebase 不可用',
      'iOS特定修复'
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
      'ERR_BLOCKED_BY_CLIENT',
      'Failed to load resource',
      '404 (Not Found)'
    ];
    
    return !filteredPatterns.some(pattern => message.includes(pattern));
  }
  
  // 判断是否应该显示消息
  shouldShowMessage(message) {
    // 在开发模式下，减少重复的初始化消息
    const repetitivePatterns = [
      '🚀 开始初始化',
      '✅ 页眉组件初始化完成',
      '✅ 页脚组件初始化完成',
      '🎉 essays页面组件初始化完成',
      '🔍 扫描GitHub路径',
      '📁 尝试直接扫描user-uploads目录',
      '🔄 强制刷新：已清除缓存'
    ];
    
    // 如果是重复性消息，只显示第一次
    for (const pattern of repetitivePatterns) {
      if (message.includes(pattern)) {
        const key = `shown_${pattern}`;
        if (this[key]) {
          return false; // 已经显示过，不再显示
        }
        this[key] = true;
        return true; // 第一次显示
      }
    }
    
    return true; // 其他消息正常显示
  }
  
  // 消息分类统计
  categorizeMessage(message) {
    for (const [category, patterns] of Object.entries(this.messagePatterns)) {
      if (patterns.some(pattern => message.includes(pattern))) {
        this.stats.messageTypes[category]++;
        break;
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
      console.group('📊 Essays页面日志统计');
      console.log('过滤的消息数量:', stats.filteredMessages);
      console.log('运行时间:', stats.runtime, '秒');
      console.log('消息类型分布:', stats.messageTypes);
      console.groupEnd();
    }
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  window.essaysLogger = new EssaysLogger();
  
  // 在调试模式下，页面卸载时显示统计信息
  if (window.essaysLogger.logLevel >= 3) {
    window.addEventListener('beforeunload', () => {
      window.essaysLogger.showStats();
    });
  }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EssaysLogger;
}
