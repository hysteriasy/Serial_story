// 本地存储访问优化器
// 用于减少浏览器跟踪保护警告和提高性能

class StorageOptimizer {
  constructor() {
    this.cache = new Map();
    this.batchOperations = [];
    this.isProcessingBatch = false;
    this.lastAccessTime = new Map();
    this.accessThrottle = 50; // 50ms 节流
    
    // 初始化时检查存储可用性
    this.storageAvailable = this.checkStorageAvailability();
    
    console.log(`📦 存储优化器初始化 - 存储可用: ${this.storageAvailable}`);
  }

  // 检查存储可用性
  checkStorageAvailability() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('⚠️ 本地存储不可用:', error.message);
      return false;
    }
  }

  // 安全的获取操作（带缓存和节流）
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

    try {
      const value = localStorage.getItem(key);
      this.cache.set(key, value);
      this.lastAccessTime.set(key, now);
      return value;
    } catch (error) {
      console.warn(`⚠️ 读取存储失败 (${key}):`, error.message);
      return null;
    }
  }

  // 安全的设置操作（批量处理）
  safeSetItem(key, value, immediate = false) {
    if (!this.storageAvailable) {
      console.warn('⚠️ 存储不可用，跳过设置操作');
      return false;
    }

    // 更新缓存
    this.cache.set(key, value);

    if (immediate) {
      return this.performSetItem(key, value);
    } else {
      // 添加到批量操作队列
      this.batchOperations.push({ key, value, type: 'set' });
      this.scheduleBatchProcess();
      return true;
    }
  }

  // 安全的删除操作
  safeRemoveItem(key, immediate = false) {
    if (!this.storageAvailable) {
      return false;
    }

    // 从缓存中删除
    this.cache.delete(key);
    this.lastAccessTime.delete(key);

    if (immediate) {
      return this.performRemoveItem(key);
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
