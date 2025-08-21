// 跟踪保护处理器
// 专门处理浏览器跟踪保护对存储访问的影响

class TrackingProtectionHandler {
  constructor() {
    this.storageBlocked = false;
    this.lastStorageTest = 0;
    this.testInterval = 300000; // 5分钟测试一次，减少日志噪音
    this.errorCount = 0;
    this.maxErrors = 5; // 最大错误次数
    this.fallbackMode = false;
    this.userNotified = false;

    // 日志级别控制
    this.logLevel = this.getLogLevel();
    this.messageCache = new Map(); // 消息去重缓存
    this.maxCacheSize = 100;

    // 存储访问统计
    this.accessStats = {
      attempts: 0,
      successes: 0,
      failures: 0,
      lastFailure: null
    };

    // 检查环境配置
    this.checkEnvironmentConfig();

    // 只在调试模式下输出初始化日志
    if (this.logLevel >= 3) {
      console.log('🛡️ 跟踪保护处理器初始化');
    }
    this.initializeHandler();
  }

  // 检查环境配置
  checkEnvironmentConfig() {
    if (window.environmentConfig) {
      const logLevel = window.environmentConfig.getConfig('logging.level');
      switch (logLevel) {
        case 'debug': this.logLevel = 3; break;
        case 'warn': this.logLevel = 2; break;
        case 'error': this.logLevel = 1; break;
        default: this.logLevel = 0; break;
      }
    }
  }

  // 获取日志级别
  getLogLevel() {
    // 0: 静默模式（生产环境）
    // 1: 错误模式（只显示错误）
    // 2: 警告模式（显示错误和警告）
    // 3: 调试模式（显示所有日志）

    if (window.location.search.includes('debug=true')) {
      return 3; // 调试模式
    }

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 2; // 本地开发环境，显示警告
    }

    if (window.location.hostname.includes('github.io')) {
      return 0; // GitHub Pages 生产环境，静默模式（减少控制台噪音）
    }

    return 0; // 其他环境，静默模式
  }

  // 初始化处理器
  initializeHandler() {
    // 立即检测存储可用性
    this.detectStorageAvailability();
    
    // 设置定期检测
    setInterval(() => {
      this.detectStorageAvailability();
    }, this.testInterval);
    
    // 监听存储事件
    this.setupStorageEventListeners();
    
    // 重写控制台方法以捕获跟踪保护错误
    this.setupConsoleInterception();
  }

  // 检测存储可用性
  async detectStorageAvailability() {
    const now = Date.now();
    if (now - this.lastStorageTest < this.testInterval && this.lastStorageTest > 0) {
      return !this.storageBlocked;
    }
    
    this.lastStorageTest = now;
    this.accessStats.attempts++;
    
    try {
      // 测试基本存储访问
      const testKey = '__tracking_protection_test__';
      const testValue = `test_${now}`;
      
      // 尝试写入
      localStorage.setItem(testKey, testValue);
      
      // 尝试读取
      const readValue = localStorage.getItem(testKey);
      
      // 尝试删除
      localStorage.removeItem(testKey);
      
      if (readValue === testValue) {
        this.accessStats.successes++;
        this.storageBlocked = false;
        this.errorCount = 0;
        this.fallbackMode = false;
        
        if (this.userNotified) {
          this.showStorageRestoredNotification();
          this.userNotified = false;
        }

        // 只在调试模式下输出成功日志
        if (window.location.search.includes('debug=true')) {
          console.log('🛡️ 存储访问测试成功');
        }

        return true;
      } else {
        throw new Error('存储读写不一致');
      }
    } catch (error) {
      this.accessStats.failures++;
      this.accessStats.lastFailure = new Date().toISOString();
      this.errorCount++;
      
      console.warn('🛡️ 存储访问测试失败:', error.message);
      
      if (this.errorCount >= this.maxErrors) {
        this.storageBlocked = true;
        this.fallbackMode = true;
        
        if (!this.userNotified) {
          this.showTrackingProtectionNotification();
          this.userNotified = true;
        }
      }
      
      return false;
    }
  }

  // 安全的存储访问包装器
  safeStorageAccess(operation, key, value = null) {
    try {
      this.accessStats.attempts++;
      
      let result;
      switch (operation) {
        case 'get':
          result = localStorage.getItem(key);
          break;
        case 'set':
          localStorage.setItem(key, value);
          result = true;
          break;
        case 'remove':
          localStorage.removeItem(key);
          result = true;
          break;
        case 'key':
          result = localStorage.key(value); // value 作为索引
          break;
        case 'length':
          result = localStorage.length;
          break;
        case 'clear':
          localStorage.clear();
          result = true;
          break;
        default:
          throw new Error(`不支持的操作: ${operation}`);
      }
      
      this.accessStats.successes++;
      return { success: true, data: result };
    } catch (error) {
      this.accessStats.failures++;
      this.accessStats.lastFailure = new Date().toISOString();
      
      // 检查是否是跟踪保护错误
      if (this.isTrackingProtectionError(error)) {
        this.handleTrackingProtectionError(error, operation, key);
      }
      
      return { success: false, error: error.message, fallback: this.fallbackMode };
    }
  }

  // 判断是否是跟踪保护错误
  isTrackingProtectionError(error) {
    const message = error.message.toLowerCase();
    const trackingKeywords = [
      'tracking prevention',
      'blocked access to storage',
      'storage access denied',
      'privacy protection',
      'cross-site tracking',
      'third-party storage'
    ];
    
    return trackingKeywords.some(keyword => message.includes(keyword));
  }

  // 处理跟踪保护错误
  handleTrackingProtectionError(error, operation, key) {
    console.warn(`🛡️ 跟踪保护阻止了存储访问: ${operation}(${key})`, error.message);

    this.storageBlocked = true;
    this.fallbackMode = true;

    if (!this.userNotified) {
      this.showTrackingProtectionNotification();
      this.userNotified = true;
    }
  }

  // 安全的存储操作包装器（带重试机制）
  async safeStorageOperation(operation, fallback = null, retries = 3) {
    this.accessStats.attempts++;

    const attemptOperation = async (attempt = 1) => {
      try {
        const result = await operation();
        this.accessStats.successes++;
        this.errorCount = 0; // 重置错误计数
        return result;
      } catch (error) {
        this.accessStats.failures++;
        this.accessStats.lastFailure = new Date().toISOString();
        this.errorCount++;

        // 检查是否是跟踪保护错误
        if (this.isTrackingProtectionError(error)) {
          console.warn(`🛡️ 跟踪保护阻止了存储访问 (尝试 ${attempt}/${retries}):`, error.message);
          this.handleTrackingProtectionError(error, 'storage', 'unknown');

          // 如果还有重试次数，等待一段时间后重试
          if (attempt < retries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 指数退避，最大5秒
            console.log(`⏳ ${delay}ms 后重试存储操作...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return await attemptOperation(attempt + 1);
          }

          // 所有重试都失败了，尝试回退方案
          if (fallback && typeof fallback === 'function') {
            try {
              console.log('🔄 尝试回退方案...');
              return await fallback();
            } catch (fallbackError) {
              console.error('❌ 回退操作也失败了:', fallbackError);
              return null;
            }
          }
        } else {
          console.error(`❌ 存储操作失败 (尝试 ${attempt}/${retries}):`, error);

          // 对于非跟踪保护错误，也进行有限重试
          if (attempt < retries && !error.message.includes('QuotaExceededError')) {
            const delay = 500 * attempt;
            await new Promise(resolve => setTimeout(resolve, delay));
            return await attemptOperation(attempt + 1);
          }
        }

        return null;
      }
    };

    return await attemptOperation();
  }

  // 设置存储事件监听器
  setupStorageEventListeners() {
    // 监听存储事件
    window.addEventListener('storage', (event) => {
      console.log('🛡️ 存储事件:', event.key, event.newValue ? '已设置' : '已删除');
    });
    
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // 页面变为可见时重新检测存储
        setTimeout(() => this.detectStorageAvailability(), 1000);
      }
    });
  }

  // 设置控制台拦截
  setupConsoleInterception() {
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalLog = console.log;

    // 跟踪保护相关的错误消息模式
    const trackingProtectionPatterns = [
      /tracking prevention blocked access to storage/i,
      /blocked access to storage for/i,
      /storage access denied/i,
      /privacy protection/i,
      /cross-site tracking/i,
      /third-party storage/i
    ];

    // 检查是否是跟踪保护相关的消息
    const isTrackingProtectionMessage = (message) => {
      const msgStr = String(message);
      return trackingProtectionPatterns.some(pattern => pattern.test(msgStr));
    };

    // 拦截 console.warn
    console.warn = (...args) => {
      const message = args.join(' ');

      // 检查是否是跟踪保护相关的消息
      if (isTrackingProtectionMessage(message)) {
        this.handleTrackingProtectionConsoleMessage(message, 'warn');
        return; // 静默处理跟踪保护消息
      }

      if (this.shouldFilterMessage(message)) {
        this.handleFilteredMessage(message, 'warn');
        return; // 不输出到控制台
      }
      originalWarn.apply(console, args);
    };

    // 拦截 console.error
    console.error = (...args) => {
      const message = args.join(' ');

      // 检查是否是跟踪保护相关的消息
      if (isTrackingProtectionMessage(message)) {
        this.handleTrackingProtectionConsoleMessage(message, 'error');
        return; // 静默处理跟踪保护消息
      }

      if (this.shouldFilterMessage(message)) {
        this.handleFilteredMessage(message, 'error');
        return; // 不输出到控制台
      }
      originalError.apply(console, args);
    };

    // 拦截 console.log 中的特定错误信息
    console.log = (...args) => {
      const message = args.join(' ');

      if (this.shouldFilterMessage(message)) {
        this.handleFilteredMessage(message, 'log');
        return; // 不输出到控制台
      }
      originalLog.apply(console, args);
    };

    // 拦截网络错误
    this.setupNetworkErrorInterception();
  }

  // 判断是否应该过滤消息
  shouldFilterMessage(message) {
    // 已知的正常错误模式，这些错误不需要在控制台显示
    const normalErrorPatterns = [
      // GitHub API 404 错误（文件不存在是正常情况）
      /the server responded with a status of 404.*api\.github\.com/i,
      /❌ 获取GitHub文件失败.*文件不存在/i,
      /❌ GitHub文件删除失败.*文件不存在/i,
      /Error: 文件不存在/i,

      // 用户索引文件不存在（首次使用时正常）
      /users_index\.json.*404/i,
      /data\/system\/.*users_index\.json/i,

      // 随笔和诗歌索引文件不存在（正常情况）
      /essays_index\.json.*404/i,
      /poetry_index\.json.*404/i,
      /data\/system\/.*essays_index\.json/i,
      /data\/system\/.*poetry_index\.json/i,

      // Firebase 相关的预期错误
      /Firebase未初始化/i,
      /Firebase不可用/i,
      /Firebase库未加载/i,

      // 旧格式随笔文件不存在（正常情况）
      /essay_legacy_.*文件不存在/i,
      /work_essay_legacy_.*404/i,

      // 网络请求失败（GitHub API）
      /Failed to load resource.*api\.github\.com.*404/i,
      /GET https:\/\/api\.github\.com.*404/i
    ];

    // 检查是否匹配正常错误模式
    return normalErrorPatterns.some(pattern => pattern.test(message));
  }

  // 处理跟踪保护相关的控制台消息（带去重）
  handleTrackingProtectionConsoleMessage(message, level) {
    // 消息去重处理
    const messageKey = `${level}:${message.substring(0, 100)}`;
    const now = Date.now();

    if (this.messageCache.has(messageKey)) {
      const lastTime = this.messageCache.get(messageKey);
      // 5分钟内的重复消息不再输出
      if (now - lastTime < 300000) {
        return;
      }
    }

    // 更新缓存
    this.messageCache.set(messageKey, now);

    // 清理过期缓存
    if (this.messageCache.size > this.maxCacheSize) {
      const entries = Array.from(this.messageCache.entries());
      entries.sort((a, b) => a[1] - b[1]);
      // 删除最旧的一半
      for (let i = 0; i < entries.length / 2; i++) {
        this.messageCache.delete(entries[i][0]);
      }
    }

    // 根据日志级别决定是否输出
    if (this.logLevel >= 3) {
      console.info(`🛡️ [跟踪保护] ${level.toUpperCase()}: ${message}`);
    } else if (this.logLevel >= 2 && level === 'error') {
      console.warn(`🛡️ 跟踪保护检测到存储访问问题`);
    }

    // 更新跟踪保护状态
    this.storageBlocked = true;
    this.fallbackMode = true;

    // 只在首次检测到时通知用户
    if (!this.userNotified) {
      this.showTrackingProtectionNotification();
      this.userNotified = true;
    }
  }

  // 处理被过滤的消息（优化版本）
  handleFilteredMessage(message, level) {
    // 静默记录，不输出到控制台
    this.accessStats.failures++;
    this.accessStats.lastFailure = new Date().toISOString();

    // 只在调试模式下记录过滤统计
    if (this.logLevel >= 3) {
      if (!this.filteredCount) this.filteredCount = 0;
      this.filteredCount++;

      // 每100个过滤消息报告一次（减少频率）
      if (this.filteredCount % 100 === 0) {
        console.info(`🔇 已过滤 ${this.filteredCount} 个跟踪保护/404相关消息`);
      }
    }
  }

  // 设置网络错误拦截
  setupNetworkErrorInterception() {
    // 拦截 fetch 错误
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch.apply(window, args);

        // 如果是 GitHub API 的404错误，静默处理
        if (!response.ok && response.status === 404 &&
            args[0] && (args[0].includes('api.github.com/repos/hysteriasy/Serial_story') ||
                       args[0].includes('github.com'))) {
          // 静默记录404错误
          this.handleFilteredMessage(`GitHub API 404: ${args[0]}`, 'network');

          // 创建一个静默的错误响应
          const silentResponse = new Response(
            JSON.stringify({ message: 'Not Found', documentation_url: '' }),
            {
              status: 404,
              statusText: 'Not Found',
              headers: response.headers
            }
          );
          return silentResponse;
        }

        return response;
      } catch (error) {
        // 如果是网络错误且涉及 GitHub API，静默处理
        if (error.message && args[0] && (args[0].includes('api.github.com') ||
                                        args[0].includes('github.com'))) {
          this.handleFilteredMessage(error.message, 'network');
          throw error; // 仍然抛出错误，但已经过滤了日志
        }
        throw error;
      }
    };

    // 拦截 XMLHttpRequest 错误
    this.setupXHRErrorInterception();
  }

  // 设置 XMLHttpRequest 错误拦截
  setupXHRErrorInterception() {
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._url = url;
      return originalXHROpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      const xhr = this;
      const originalOnError = xhr.onerror;
      const originalOnLoad = xhr.onload;

      xhr.onerror = function(event) {
        // 如果是 GitHub API 错误，静默处理
        if (xhr._url && (xhr._url.includes('api.github.com') || xhr._url.includes('github.com'))) {
          window.trackingProtectionHandler?.handleFilteredMessage(`XHR Error: ${xhr._url}`, 'xhr');
        }
        if (originalOnError) originalOnError.call(this, event);
      };

      xhr.onload = function(event) {
        // 如果是 GitHub API 404错误，静默处理
        if (xhr.status === 404 && xhr._url &&
            (xhr._url.includes('api.github.com') || xhr._url.includes('github.com'))) {
          window.trackingProtectionHandler?.handleFilteredMessage(`XHR 404: ${xhr._url}`, 'xhr');
        }
        if (originalOnLoad) originalOnLoad.call(this, event);
      };

      return originalXHRSend.apply(this, args);
    };
  }

  // 显示跟踪保护通知
  showTrackingProtectionNotification() {
    const notification = {
      type: 'warning',
      title: '🛡️ 浏览器隐私保护提醒',
      message: '检测到浏览器的跟踪保护功能限制了本地存储访问。系统已切换到兼容模式，部分功能可能受限。',
      actions: [
        {
          text: '了解详情',
          action: () => this.showTrackingProtectionHelp()
        },
        {
          text: '暂时忽略',
          action: () => this.dismissNotification()
        }
      ],
      persistent: true
    };
    
    this.displayNotification(notification);
  }

  // 显示存储恢复通知
  showStorageRestoredNotification() {
    const notification = {
      type: 'success',
      title: '✅ 存储访问已恢复',
      message: '本地存储访问已恢复正常，所有功能现在可以正常使用。',
      autoHide: true,
      duration: 5000
    };
    
    this.displayNotification(notification);
  }

  // 显示通知
  displayNotification(notification) {
    // 使用现有的通知系统
    if (typeof showNotification !== 'undefined') {
      showNotification(notification.message, notification.type);
    } else {
      // 创建自定义通知
      this.createCustomNotification(notification);
    }
  }

  // 创建自定义通知
  createCustomNotification(notification) {
    const notificationEl = document.createElement('div');
    notificationEl.className = `tracking-protection-notification notification-${notification.type}`;
    notificationEl.innerHTML = `
      <div class="notification-header">
        <strong>${notification.title}</strong>
        <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="notification-body">
        <p>${notification.message}</p>
        ${notification.actions ? `
          <div class="notification-actions">
            ${notification.actions.map(action => 
              `<button class="btn btn-sm" onclick="(${action.action.toString()})()">${action.text}</button>`
            ).join('')}
          </div>
        ` : ''}
      </div>
    `;
    
    // 添加样式
    notificationEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      background: ${notification.type === 'warning' ? '#fff3cd' : '#d4edda'};
      border: 1px solid ${notification.type === 'warning' ? '#ffeaa7' : '#c3e6cb'};
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10002;
      font-family: Arial, sans-serif;
    `;
    
    document.body.appendChild(notificationEl);
    
    // 自动隐藏
    if (notification.autoHide) {
      setTimeout(() => {
        if (notificationEl.parentNode) {
          notificationEl.remove();
        }
      }, notification.duration || 5000);
    }
  }

  // 显示跟踪保护帮助
  showTrackingProtectionHelp() {
    const helpModal = document.createElement('div');
    helpModal.className = 'tracking-protection-help-modal';
    helpModal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>🛡️ 浏览器跟踪保护说明</h3>
            <button class="close-btn" onclick="this.closest('.tracking-protection-help-modal').remove()">×</button>
          </div>
          <div class="modal-body">
            <h4>什么是跟踪保护？</h4>
            <p>现代浏览器的跟踪保护功能会限制网站对本地存储的访问，以保护用户隐私。</p>
            
            <h4>对本站的影响：</h4>
            <ul>
              <li>用户登录状态可能无法保持</li>
              <li>文件权限设置可能无法本地缓存</li>
              <li>部分个性化设置可能丢失</li>
            </ul>
            
            <h4>解决方案：</h4>
            <ol>
              <li><strong>添加到信任站点：</strong>将本站添加到浏览器的信任站点列表</li>
              <li><strong>调整隐私设置：</strong>在浏览器设置中降低跟踪保护级别</li>
              <li><strong>使用隐身模式：</strong>某些情况下隐身模式的限制较少</li>
              <li><strong>配置GitHub Token：</strong>使用GitHub存储可以绕过本地存储限制</li>
            </ol>
            
            <h4>当前状态：</h4>
            <p>系统已自动切换到兼容模式，核心功能仍可正常使用。</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="this.closest('.tracking-protection-help-modal').remove()">我知道了</button>
          </div>
        </div>
      </div>
    `;
    
    // 添加样式
    helpModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10003;
    `;
    
    document.body.appendChild(helpModal);
  }

  // 忽略通知
  dismissNotification() {
    const notifications = document.querySelectorAll('.tracking-protection-notification');
    notifications.forEach(notification => notification.remove());
  }

  // 获取存储状态报告
  getStorageStatusReport() {
    return {
      storageBlocked: this.storageBlocked,
      fallbackMode: this.fallbackMode,
      errorCount: this.errorCount,
      accessStats: { ...this.accessStats },
      lastTest: new Date(this.lastStorageTest).toISOString()
    };
  }

  // 强制重新检测
  async forceRedetection() {
    this.lastStorageTest = 0;
    this.errorCount = 0;
    this.userNotified = false;
    return await this.detectStorageAvailability();
  }
}

// 创建全局实例
window.trackingProtectionHandler = new TrackingProtectionHandler();

// 提供简化的全局接口
window.safeStorage = {
  get: (key) => window.trackingProtectionHandler.safeStorageAccess('get', key),
  set: (key, value) => window.trackingProtectionHandler.safeStorageAccess('set', key, value),
  remove: (key) => window.trackingProtectionHandler.safeStorageAccess('remove', key),
  key: (index) => window.trackingProtectionHandler.safeStorageAccess('key', null, index),
  get length() { 
    const result = window.trackingProtectionHandler.safeStorageAccess('length');
    return result.success ? result.data : 0;
  },
  clear: () => window.trackingProtectionHandler.safeStorageAccess('clear'),
  isBlocked: () => window.trackingProtectionHandler.storageBlocked,
  getStatus: () => window.trackingProtectionHandler.getStorageStatusReport(),
  forceRedetection: () => window.trackingProtectionHandler.forceRedetection()
};

console.log('🛡️ 跟踪保护处理器已加载');
