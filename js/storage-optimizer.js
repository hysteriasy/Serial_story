// 本地存储访问优化器
// 用于减少浏览器跟踪保护警告和提高性能

class StorageOptimizer {
  constructor() {
    this.cache = new Map();
    this.batchOperations = [];
    this.isProcessingBatch = false;
    this.lastAccessTime = new Map();
    this.accessThrottle = 100; // 增加到100ms节流，减少频繁访问

    // 跟踪保护相关
    this.trackingProtectionDetected = false;
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 3;
    this.retryDelay = 1000; // 重试延迟
    this.silentMode = false; // 静默模式，减少日志输出

    // 初始化时检查存储可用性
    this.storageAvailable = this.checkStorageAvailability();

    console.log(`📦 存储优化器初始化 - 存储可用: ${this.storageAvailable}`);

    // 如果跟踪保护处理器可用，集成它
    this.integrateTrackingProtectionHandler();
  }

  // 集成跟踪保护处理器
  integrateTrackingProtectionHandler() {
    if (window.trackingProtectionHandler) {
      console.log('📦 集成跟踪保护处理器');
      // 定期检查跟踪保护状态
      setInterval(() => {
        const status = window.trackingProtectionHandler.getStorageStatusReport();
        this.trackingProtectionDetected = status.storageBlocked;
        if (this.trackingProtectionDetected && !this.silentMode) {
          this.silentMode = true;
          console.log('📦 检测到跟踪保护，启用静默模式');
        }
      }, 30000);
    }
  }

  // 检查存储可用性（增强版）
  checkStorageAvailability() {
    try {
      const testKey = '__storage_test__';
      const testValue = `test_${Date.now()}`;

      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved === testValue) {
        this.consecutiveFailures = 0;
        return true;
      } else {
        throw new Error('存储读写不一致');
      }
    } catch (error) {
      this.consecutiveFailures++;

      // 检查是否是跟踪保护错误
      if (this.isTrackingProtectionError(error)) {
        this.trackingProtectionDetected = true;
        if (!this.silentMode) {
          console.warn('🛡️ 检测到跟踪保护限制:', error.message);
          this.silentMode = true;
        }
      } else if (!this.silentMode) {
        console.warn('⚠️ 本地存储不可用:', error.message);
      }

      return false;
    }
  }

  // 判断是否是跟踪保护错误
  isTrackingProtectionError(error) {
    const message = error.message.toLowerCase();
    return message.includes('tracking prevention') ||
           message.includes('blocked access to storage') ||
           message.includes('privacy protection');
  }

  // 安全的获取操作（带缓存和节流，增强错误处理）
  safeGetItem(key) {
    if (!this.storageAvailable) {
      return null;
    }

    // 检查缓存
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // 节流检查
    const now = Date.now();
    const lastAccess = this.lastAccessTime.get(key) || 0;
    if (now - lastAccess < this.accessThrottle) {
      return this.cache.get(key) || null;
    }

    return this.retryStorageOperation(() => {
      const value = localStorage.getItem(key);
      this.cache.set(key, value);
      this.lastAccessTime.set(key, now);
      return value;
    }, 'get', key);
  }

  // 重试存储操作
  retryStorageOperation(operation, operationType, key, maxRetries = 2) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = operation();
        this.consecutiveFailures = 0;
        return result;
      } catch (error) {
        lastError = error;
        this.consecutiveFailures++;

        if (this.isTrackingProtectionError(error)) {
          this.trackingProtectionDetected = true;
          if (!this.silentMode) {
            console.warn(`🛡️ 跟踪保护阻止存储访问 (${operationType}:${key})`);
            this.silentMode = true;
          }
          break; // 跟踪保护错误不重试
        }

        if (attempt < maxRetries) {
          // 等待后重试
          const delay = this.retryDelay * (attempt + 1);
          setTimeout(() => {}, delay);
        }
      }
    }

    // 所有重试都失败了
    if (!this.silentMode || this.consecutiveFailures <= this.maxConsecutiveFailures) {
      console.warn(`⚠️ 存储操作失败 (${operationType}:${key}):`, lastError.message);
    }

    return operationType === 'get' ? null : false;
  }

  // 安全的设置操作（批量处理，增强错误处理）
  safeSetItem(key, value, immediate = false) {
    if (!this.storageAvailable) {
      if (!this.silentMode) {
        console.warn('⚠️ 存储不可用，跳过设置操作');
      }
      return false;
    }

    // 更新缓存
    this.cache.set(key, value);

    if (immediate) {
      return this.retryStorageOperation(() => {
        localStorage.setItem(key, value);
        return true;
      }, 'set', key);
    } else {
      // 添加到批量操作队列
      this.batchOperations.push({ key, value, type: 'set' });
      this.scheduleBatchProcess();
      return true;
    }
  }

  // 安全的删除操作（增强错误处理）
  safeRemoveItem(key, immediate = false) {
    if (!this.storageAvailable) {
      return false;
    }

    // 从缓存中删除
    this.cache.delete(key);
    this.lastAccessTime.delete(key);

    if (immediate) {
      return this.retryStorageOperation(() => {
        localStorage.removeItem(key);
        return true;
      }, 'remove', key);
    } else {
      // 添加到批量操作队列
      this.batchOperations.push({ key, type: 'remove' });
      this.scheduleBatchProcess();
      return true;
    }
  }

  // 执行实际的设置操作
  performSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`⚠️ 设置存储失败 (${key}):`, error.message);
      return false;
    }
  }

  // 执行实际的删除操作
  performRemoveItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`⚠️ 删除存储失败 (${key}):`, error.message);
      return false;
    }
  }

  // 调度批量处理
  scheduleBatchProcess() {
    if (this.isProcessingBatch || this.batchOperations.length === 0) {
      return;
    }

    // 使用 requestIdleCallback 或 setTimeout 来延迟处理
    const processFunction = () => this.processBatchOperations();
    
    if (window.requestIdleCallback) {
      window.requestIdleCallback(processFunction, { timeout: 1000 });
    } else {
      setTimeout(processFunction, 100);
    }
  }

  // 处理批量操作
  processBatchOperations() {
    if (this.isProcessingBatch || this.batchOperations.length === 0) {
      return;
    }

    this.isProcessingBatch = true;
    const operations = [...this.batchOperations];
    this.batchOperations = [];

    try {
      operations.forEach(op => {
        if (op.type === 'set') {
          this.performSetItem(op.key, op.value);
        } else if (op.type === 'remove') {
          this.performRemoveItem(op.key);
        }
      });
      
      if (operations.length > 0) {
        console.log(`📦 批量处理完成: ${operations.length} 个操作`);
      }
    } catch (error) {
      console.error('❌ 批量操作失败:', error);
    } finally {
      this.isProcessingBatch = false;
      
      // 如果还有待处理的操作，继续调度
      if (this.batchOperations.length > 0) {
        this.scheduleBatchProcess();
      }
    }
  }

  // 获取所有键（优化版本）
  getAllKeys() {
    if (!this.storageAvailable) {
      return [];
    }

    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      console.warn('⚠️ 获取存储键失败:', error.message);
      return [];
    }
  }

  // 批量获取数据（减少访问次数）
  batchGetItems(keys) {
    const results = {};
    
    keys.forEach(key => {
      const value = this.safeGetItem(key);
      if (value !== null) {
        results[key] = value;
      }
    });
    
    return results;
  }

  // 清理缓存
  clearCache() {
    this.cache.clear();
    this.lastAccessTime.clear();
    console.log('📦 存储缓存已清理');
  }

  // 强制处理所有待处理的操作
  flush() {
    if (this.batchOperations.length > 0) {
      this.processBatchOperations();
    }
  }

  // 获取存储统计信息
  getStorageStats() {
    if (!this.storageAvailable) {
      return { available: false };
    }

    try {
      return {
        available: true,
        itemCount: localStorage.length,
        cacheSize: this.cache.size,
        pendingOperations: this.batchOperations.length
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }
}

// 创建全局实例
window.storageOptimizer = new StorageOptimizer();

// 为向后兼容，提供简化的全局函数
window.safeLocalStorage = {
  getItem: (key) => window.storageOptimizer.safeGetItem(key),
  setItem: (key, value, immediate = false) => window.storageOptimizer.safeSetItem(key, value, immediate),
  removeItem: (key, immediate = false) => window.storageOptimizer.safeRemoveItem(key, immediate),
  getAllKeys: () => window.storageOptimizer.getAllKeys(),
  batchGet: (keys) => window.storageOptimizer.batchGetItems(keys),
  flush: () => window.storageOptimizer.flush(),
  clearCache: () => window.storageOptimizer.clearCache()
};

console.log('📦 存储优化器已加载');
