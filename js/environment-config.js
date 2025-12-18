// 环境配置和检测管理器
// 统一管理不同环境下的配置和行为

class EnvironmentConfig {
  constructor() {
    this.environment = this.detectEnvironment();
    this.config = this.loadConfig();
    this.features = this.loadFeatures();

    // 设置全局环境变量
    window.ENV_CONFIG = this.config;
    window.ENV_FEATURES = this.features;

    // 设置静默模式标志
    this.silentMode = this.shouldUseSilentMode();

    this.init();
  }

  // 检查是否应该使用静默模式
  shouldUseSilentMode() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    return hostname.includes('github.io') ||
           protocol === 'file:' ||
           this.environment === 'production';
  }
  
  // 检测当前环境
  detectEnvironment() {
    const hostname = window.location.hostname;
    const search = window.location.search;
    
    if (search.includes('debug=true')) {
      return 'debug';
    }
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
      return 'development';
    }
    
    if (hostname.includes('github.io') || hostname.includes('github.com')) {
      return 'production';
    }
    
    return 'unknown';
  }
  
  // 加载环境配置
  loadConfig() {
    const baseConfig = {
      // 日志配置
      logging: {
        level: 'info',
        console: true,
        performance: false,
        network: false
      },
      
      // 性能配置
      performance: {
        enableMetrics: false,
        enableProfiling: false,
        enableMemoryTracking: false
      },
      
      // 存储配置
      storage: {
        preferredProvider: 'localStorage',
        fallbackProvider: 'memory',
        enableSync: false
      },
      
      // UI配置
      ui: {
        showDebugInfo: false,
        enableAnimations: true,
        enableTransitions: true
      }
    };
    
    // 根据环境调整配置
    switch (this.environment) {
      case 'debug':
        return {
          ...baseConfig,
          logging: {
            level: 'debug',
            console: true,
            performance: true,
            network: true
          },
          performance: {
            enableMetrics: true,
            enableProfiling: true,
            enableMemoryTracking: true
          },
          ui: {
            showDebugInfo: true,
            enableAnimations: true,
            enableTransitions: true
          }
        };
        
      case 'development':
        return {
          ...baseConfig,
          logging: {
            level: 'warn',
            console: true,
            performance: false,
            network: false
          },
          performance: {
            enableMetrics: false,
            enableProfiling: false,
            enableMemoryTracking: false
          }
        };
        
      case 'production':
        return {
          ...baseConfig,
          logging: {
            level: 'error',
            console: false,
            performance: false,
            network: false
          },
          storage: {
            preferredProvider: 'github',
            fallbackProvider: 'localStorage',
            enableSync: true
          },
          performance: {
            enableMetrics: false,
            enableProfiling: false,
            enableMemoryTracking: false
          }
        };
        
      default:
        return baseConfig;
    }
  }
  
  // 加载功能特性配置
  loadFeatures() {
    const baseFeatures = {
      // 认证功能
      auth: {
        enabled: true,
        rememberLogin: true,
        autoLogin: false
      },
      
      // 文件管理功能
      fileManagement: {
        enabled: true,
        uploadEnabled: true,
        deleteEnabled: true
      },
      
      // 统计功能
      analytics: {
        enabled: false,
        trackPageViews: false,
        trackUserActions: false
      },
      
      // 实验性功能
      experimental: {
        enabled: false,
        newFeatures: false
      }
    };
    
    // 根据环境调整功能
    switch (this.environment) {
      case 'debug':
        return {
          ...baseFeatures,
          analytics: {
            enabled: true,
            trackPageViews: true,
            trackUserActions: true
          },
          experimental: {
            enabled: true,
            newFeatures: true
          }
        };
        
      case 'development':
        return {
          ...baseFeatures,
          experimental: {
            enabled: true,
            newFeatures: false
          }
        };
        
      case 'production':
        return {
          ...baseFeatures,
          auth: {
            enabled: true,
            rememberLogin: true,
            autoLogin: true
          }
        };
        
      default:
        return baseFeatures;
    }
  }
  
  // 初始化环境配置
  init() {
    // 设置全局CSS变量
    this.setCSSVariables();

    // 配置控制台行为
    this.configureConsole();

    // 配置性能监控
    this.configurePerformance();

    // 只在调试模式或开发环境下显示环境信息
    if (this.environment === 'debug' ||
        (this.environment === 'development' && !this.silentMode)) {
      this.showEnvironmentInfo();
    }
  }
  
  // 设置CSS变量
  setCSSVariables() {
    const root = document.documentElement;
    
    // 根据环境设置不同的主题变量
    if (this.environment === 'production') {
      root.style.setProperty('--debug-opacity', '0');
      root.style.setProperty('--transition-speed', '0.3s');
    } else {
      root.style.setProperty('--debug-opacity', '0.1');
      root.style.setProperty('--transition-speed', '0.2s');
    }
  }
  
  // 配置控制台行为
  configureConsole() {
    if (!this.config.logging.console && this.environment === 'production') {
      // 在生产环境中进一步限制控制台输出
      const noop = () => {};
      
      // 保留原始方法的引用
      window._originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
      };
      
      // 只在严重错误时显示
      console.log = noop;
      console.info = noop;
      console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes('严重') || message.includes('critical')) {
          window._originalConsole.warn.apply(console, args);
        }
      };
    }
  }
  
  // 配置性能监控
  configurePerformance() {
    if (this.config.performance.enableMetrics) {
      // 启用性能监控
      this.enablePerformanceMonitoring();
    }
  }
  
  // 启用性能监控
  enablePerformanceMonitoring() {
    // 监控页面加载性能
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('📊 页面性能数据:', {
          DNS查询: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
          TCP连接: Math.round(perfData.connectEnd - perfData.connectStart),
          请求响应: Math.round(perfData.responseEnd - perfData.requestStart),
          DOM解析: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
          总加载时间: Math.round(perfData.loadEventEnd - perfData.navigationStart)
        });
      }, 1000);
    });
  }
  
  // 显示环境信息
  showEnvironmentInfo() {
    console.group('🌍 环境配置信息');
    console.log('环境类型:', this.environment);
    console.log('配置:', this.config);
    console.log('功能特性:', this.features);
    console.log('用户代理:', navigator.userAgent);
    console.log('屏幕分辨率:', `${screen.width}x${screen.height}`);
    console.log('视口大小:', `${window.innerWidth}x${window.innerHeight}`);
    console.groupEnd();
  }
  
  // 获取环境信息
  getEnvironmentInfo() {
    return {
      environment: this.environment,
      config: this.config,
      features: this.features,
      userAgent: navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  }
  
  // 检查功能是否启用
  isFeatureEnabled(featurePath) {
    const keys = featurePath.split('.');
    let current = this.features;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return false;
      }
    }
    
    return Boolean(current);
  }
  
  // 获取配置值
  getConfig(configPath) {
    const keys = configPath.split('.');
    let current = this.config;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }
}

// 自动初始化
if (typeof window !== 'undefined') {
  window.environmentConfig = new EnvironmentConfig();
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnvironmentConfig;
}
