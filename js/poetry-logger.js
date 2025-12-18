// Poetry页面专用日志管理器
// 专门优化poetry.html页面的控制台输出

class PoetryLogger {
  constructor() {
    this.isProduction = window.location.hostname.includes('github.io');
    this.isDebug = window.location.search.includes('debug=true');
    this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // 日志级别：0=静默, 1=错误, 2=警告, 3=调试
    this.logLevel = this.determineLogLevel();
    
    // 统计信息
    this.stats = {
      filteredMessages: 0,
      trackingProtectionErrors: 0,
      github404Errors: 0,
      startTime: Date.now(),
      messageTypes: {
        initialization: 0,
        dataLoading: 0,
        authentication: 0,
        fileOperations: 0,
        permissions: 0,
        firebase: 0
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
      ],
      firebase: [
        'Firebase', '降级', '不可用', '🔥', '📱'
      ]
    };
    
    // 重复消息缓存
    this.messageCache = new Map();
    this.maxCacheSize = 50;
    
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
      console.log('🎭 Poetry页面日志管理器已启动', {
        环境: this.isProduction ? 'GitHub Pages' : (this.isLocalhost ? '本地开发' : '其他'),
        日志级别: this.logLevel,
        调试模式: this.isDebug
      });
    }
  }
  
  // 启用生产模式（完全静默）
  enableProductionMode() {
    // 保存原始的 console 方法
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    // 跟踪保护消息检测（更全面的模式）
    const isTrackingProtectionMessage = (message) => {
      const trackingPatterns = [
        /tracking prevention/i,
        /blocked access to storage/i,
        /storage access denied/i,
        /privacy protection/i,
        /cross-site tracking/i,
        /third-party storage/i,
        /blocked access to storage for <URL>/i
      ];
      return trackingPatterns.some(pattern => pattern.test(message));
    };

    // 重写console.log - 只保留关键系统消息
    console.log = (...args) => {
      const message = args.join(' ');

      // 过滤跟踪保护消息
      if (isTrackingProtectionMessage(message)) {
        this.stats.filteredMessages++;
        this.stats.trackingProtectionErrors++;
        return;
      }

      if (this.isCriticalMessage(message)) {
        originalConsole.log.apply(console, args);
      } else {
        this.stats.filteredMessages++;
        this.categorizeMessage(message);
      }
    };

    // 重写console.info - 完全静默
    console.info = (...args) => {
      this.stats.filteredMessages++;
    };

    // 保留警告和错误，但过滤已知的无害消息
    console.warn = (...args) => {
      const message = args.join(' ');

      // 优先过滤跟踪保护消息
      if (isTrackingProtectionMessage(message)) {
        this.stats.filteredMessages++;
        this.stats.trackingProtectionErrors++;
        return;
      }

      if (this.isImportantWarning(message)) {
        originalConsole.warn.apply(console, args);
      } else {
        this.stats.filteredMessages++;
      }
    };

    console.error = (...args) => {
      const message = args.join(' ');

      // 优先过滤跟踪保护消息
      if (isTrackingProtectionMessage(message)) {
        this.stats.filteredMessages++;
        this.stats.trackingProtectionErrors++;
        return;
      }

      if (this.isImportantError(message)) {
        originalConsole.error.apply(console, args);
      } else {
        this.stats.filteredMessages++;
        if (message.includes('404')) {
          this.stats.github404Errors++;
        }
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

    // 跟踪保护消息检测
    const isTrackingProtectionMessage = (message) => {
      const trackingPatterns = [
        /tracking prevention/i,
        /blocked access to storage/i,
        /storage access denied/i,
        /privacy protection/i
      ];
      return trackingPatterns.some(pattern => pattern.test(message));
    };

    console.log = (...args) => {
      const message = args.join(' ');

      // 过滤跟踪保护消息
      if (isTrackingProtectionMessage(message)) {
        this.stats.filteredMessages++;
        this.stats.trackingProtectionErrors++;
        return;
      }

      if (this.isCriticalMessage(message)) {
        originalConsole.log.apply(console, args);
      } else {
        this.stats.filteredMessages++;
      }
    };

    console.warn = (...args) => {
      const message = args.join(' ');

      // 过滤跟踪保护消息
      if (isTrackingProtectionMessage(message)) {
        this.stats.filteredMessages++;
        this.stats.trackingProtectionErrors++;
        return;
      }

      if (this.isImportantWarning(message)) {
        originalConsole.warn.apply(console, args);
      } else {
        this.stats.filteredMessages++;
      }
    };

    // 保留所有错误，但过滤跟踪保护错误
    console.error = (...args) => {
      const message = args.join(' ');

      // 过滤跟踪保护消息
      if (isTrackingProtectionMessage(message)) {
        this.stats.filteredMessages++;
        this.stats.trackingProtectionErrors++;
        return;
      }

      originalConsole.error.apply(console, args);
    };
  }

  // 启用过滤模式（开发环境）
  enableFilteredMode() {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };

    // 跟踪保护消息检测
    const isTrackingProtectionMessage = (message) => {
      const trackingPatterns = [
        /tracking prevention/i,
        /blocked access to storage/i,
        /storage access denied/i,
        /privacy protection/i
      ];
      return trackingPatterns.some(pattern => pattern.test(message));
    };

    // 减少重复的初始化日志
    console.log = (...args) => {
      const message = args.join(' ');

      // 过滤跟踪保护消息
      if (isTrackingProtectionMessage(message)) {
        this.stats.filteredMessages++;
        this.stats.trackingProtectionErrors++;
        return;
      }

      if (this.shouldShowMessage(message)) {
        originalConsole.log.apply(console, args);
      } else {
        this.stats.filteredMessages++;
        this.categorizeMessage(message);
      }
    };

    // 在开发环境也过滤跟踪保护警告
    console.warn = (...args) => {
      const message = args.join(' ');

      // 过滤跟踪保护消息
      if (isTrackingProtectionMessage(message)) {
        this.stats.filteredMessages++;
        this.stats.trackingProtectionErrors++;
        return;
      }

      originalConsole.warn.apply(console, args);
    };

    // 在开发环境也过滤跟踪保护错误
    console.error = (...args) => {
      const message = args.join(' ');

      // 过滤跟踪保护消息
      if (isTrackingProtectionMessage(message)) {
        this.stats.filteredMessages++;
        this.stats.trackingProtectionErrors++;
        return;
      }

      originalConsole.error.apply(console, args);
    };
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
      'Tracking Prevention',
      'blocked access to storage',
      'storage access denied',
      'privacy protection',
      'cross-site tracking',
      '扫描路径',
      '加载文件内容失败',
      '跳过损坏的文件',
      'Firebase 不可用',
      'iOS特定修复',
      '扫描子目录失败',
      'GitHub token未配置',
      'GitHub token未设置'
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
      '404 (Not Found)',
      'poetry_index.json',
      '获取GitHub文件失败',
      '网络连接问题',
      'Firebase 初始化失败',
      'Script error.',
      'Tracking Prevention',
      'blocked access to storage'
    ];

    return !filteredPatterns.some(pattern => message.includes(pattern));
  }
  
  // 判断是否应该显示消息
  shouldShowMessage(message) {
    // 在开发模式下，减少重复的初始化消息
    const repetitivePatterns = [
      '🚀 开始初始化诗歌创作页面组件',
      '✅ 页眉组件初始化完成',
      '✅ 页脚组件初始化完成',
      '🎉 诗歌创作页面组件初始化完成',
      '✅ 智能加载器加载了',
      '📊 智能加载器返回的诗歌数据',
      '🔍 扫描GitHub路径',
      '🔍 使用公开API扫描GitHub路径',
      '✅ 找到已知诗歌文件'
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
      console.group('📊 Poetry页面日志统计');
      console.log('过滤的消息数量:', stats.filteredMessages);
      console.log('跟踪保护错误:', stats.trackingProtectionErrors);
      console.log('GitHub 404错误:', stats.github404Errors);
      console.log('运行时间:', stats.runtime, '秒');
      console.log('消息类型分布:', stats.messageTypes);
      console.groupEnd();
    }
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  window.poetryLogger = new PoetryLogger();
  
  // 在调试模式下，页面卸载时显示统计信息
  if (window.poetryLogger.logLevel >= 3) {
    window.addEventListener('beforeunload', () => {
      window.poetryLogger.showStats();
    });
  }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PoetryLogger;
}
