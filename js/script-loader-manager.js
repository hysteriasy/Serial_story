/**
 * 脚本加载管理器
 * 防止重复脚本初始化，优化加载顺序
 */

class ScriptLoaderManager {
  constructor() {
    this.loadedScripts = new Set();
    this.initializationQueue = [];
    this.isInitializing = false;
    this.initializationPromises = new Map();
    
    // 组件依赖关系
    this.dependencies = {
      'AdminFileManager': ['logManager', 'directoryChecker', 'githubStorage', 'dataManager'],
      'TrackingProtectionHandler': ['logManager'],
      'GitHubStorage': ['logManager'],
      'DataManager': ['logManager', 'githubStorage'],
      'FileDeletionFix': ['adminFileManager', 'dataSyncManager']
    };
    
    this.init();
  }

  init() {
    window.scriptLoaderManager = this;
    
    // 监听脚本加载事件
    this.setupScriptLoadListeners();
    
    if (window.logManager) {
      window.logManager.debug('ScriptLoader', '脚本加载管理器已初始化');
    }
  }

  // 设置脚本加载监听器
  setupScriptLoadListeners() {
    // 监听动态加载的脚本
    const originalAppendChild = document.head.appendChild;
    document.head.appendChild = function(element) {
      if (element.tagName === 'SCRIPT' && element.src) {
        window.scriptLoaderManager.trackScript(element.src);
      }
      return originalAppendChild.call(this, element);
    };
  }

  // 跟踪脚本加载
  trackScript(src) {
    const scriptName = this.extractScriptName(src);
    if (this.loadedScripts.has(scriptName)) {
      if (window.logManager) {
        window.logManager.warn('ScriptLoader', `脚本重复加载: ${scriptName}`);
      }
      return false;
    }
    
    this.loadedScripts.add(scriptName);
    if (window.logManager) {
      window.logManager.debug('ScriptLoader', `脚本已加载: ${scriptName}`);
    }
    return true;
  }

  // 提取脚本名称
  extractScriptName(src) {
    const parts = src.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace('.js', '').replace(/[?#].*$/, '');
  }

  // 注册组件初始化
  registerComponent(name, initFunction, dependencies = []) {
    if (this.isComponentInitialized(name)) {
      if (window.logManager) {
        window.logManager.warn('ScriptLoader', `组件重复初始化: ${name}`);
      }
      return Promise.resolve();
    }

    const initPromise = this.initializeComponent(name, initFunction, dependencies);
    this.initializationPromises.set(name, initPromise);
    return initPromise;
  }

  // 检查组件是否已初始化
  isComponentInitialized(name) {
    return window[name.toLowerCase()] !== undefined || 
           window[name] !== undefined ||
           this.initializationPromises.has(name);
  }

  // 初始化组件
  async initializeComponent(name, initFunction, dependencies) {
    try {
      // 等待依赖组件初始化完成
      await this.waitForDependencies(dependencies);
      
      // 执行初始化
      const result = await initFunction();
      
      if (window.logManager) {
        window.logManager.debug('ScriptLoader', `组件初始化完成: ${name}`);
      }
      
      return result;
    } catch (error) {
      if (window.logManager) {
        window.logManager.error('ScriptLoader', `组件初始化失败: ${name}`, error);
      }
      throw error;
    }
  }

  // 等待依赖组件
  async waitForDependencies(dependencies) {
    const waitPromises = dependencies.map(dep => this.waitForComponent(dep));
    await Promise.all(waitPromises);
  }

  // 等待特定组件
  async waitForComponent(name, timeout = 10000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.isComponentAvailable(name)) {
        return;
      }
      
      // 如果有初始化Promise，等待它
      if (this.initializationPromises.has(name)) {
        try {
          await this.initializationPromises.get(name);
          return;
        } catch (error) {
          // 初始化失败，继续等待
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`等待组件超时: ${name}`);
  }

  // 检查组件是否可用
  isComponentAvailable(name) {
    return window[name.toLowerCase()] !== undefined || 
           window[name] !== undefined ||
           (name === 'logManager' && window.logManager !== undefined) ||
           (name === 'directoryChecker' && window.directoryChecker !== undefined) ||
           (name === 'githubStorage' && window.githubStorage !== undefined) ||
           (name === 'dataManager' && window.dataManager !== undefined) ||
           (name === 'adminFileManager' && window.adminFileManager !== undefined) ||
           (name === 'dataSyncManager' && window.dataSyncManager !== undefined);
  }

  // 防止重复初始化的包装器
  preventDuplicateInit(name, initFunction) {
    const key = `${name}_initialized`;
    
    if (window[key]) {
      if (window.logManager) {
        window.logManager.debug('ScriptLoader', `跳过重复初始化: ${name}`);
      }
      return;
    }
    
    window[key] = true;
    return initFunction();
  }

  // 安全的组件访问
  safeAccess(componentName, operation, fallback = null) {
    const component = window[componentName] || window[componentName.toLowerCase()];
    
    if (!component) {
      if (window.logManager) {
        window.logManager.warn('ScriptLoader', `组件不可用: ${componentName}`);
      }
      return fallback;
    }
    
    try {
      return operation(component);
    } catch (error) {
      if (window.logManager) {
        window.logManager.error('ScriptLoader', `组件操作失败: ${componentName}`, error);
      }
      return fallback;
    }
  }

  // 获取加载状态
  getLoadStatus() {
    return {
      loadedScripts: Array.from(this.loadedScripts),
      initializedComponents: Array.from(this.initializationPromises.keys()),
      availableComponents: this.getAvailableComponents()
    };
  }

  // 获取可用组件列表
  getAvailableComponents() {
    const components = [
      'logManager', 'directoryChecker', 'githubStorage', 'dataManager',
      'adminFileManager', 'dataSyncManager', 'trackingProtectionHandler',
      'fileDeletionFix'
    ];
    
    return components.filter(name => this.isComponentAvailable(name));
  }

  // 诊断组件状态
  diagnoseComponents() {
    const status = this.getLoadStatus();
    
    if (window.logManager) {
      window.logManager.info('ScriptLoader', '组件诊断报告', {
        loadedScripts: status.loadedScripts.length,
        initializedComponents: status.initializedComponents.length,
        availableComponents: status.availableComponents.length,
        details: status
      });
    }
    
    return status;
  }

  // 清理初始化状态
  cleanup() {
    this.initializationPromises.clear();
    this.loadedScripts.clear();
    
    if (window.logManager) {
      window.logManager.info('ScriptLoader', '脚本加载管理器已清理');
    }
  }
}

// 创建全局实例
window.scriptLoaderManager = new ScriptLoaderManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScriptLoaderManager;
}

// 提供全局便捷方法
window.preventDuplicateInit = function(name, initFunction) {
  return window.scriptLoaderManager.preventDuplicateInit(name, initFunction);
};

window.safeComponentAccess = function(componentName, operation, fallback = null) {
  return window.scriptLoaderManager.safeAccess(componentName, operation, fallback);
};

if (window.logManager) {
  window.logManager.debug('ScriptLoader', '脚本加载管理器已加载');
}
