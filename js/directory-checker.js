/**
 * 目录存在性检查器
 * 预防性检查目录是否存在，避免不必要的404错误
 */

class DirectoryChecker {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 600000; // 10分钟缓存
    this.pendingChecks = new Map(); // 防止重复检查
    
    // 预定义的目录结构
    this.knownDirectories = new Set([
      'user-uploads',
      'user-uploads/literature',
      'user-uploads/literature/essay',
      'user-uploads/literature/novel',
      'user-uploads/literature/poetry',
      'data',
      'data/works'
    ]);
    
    // 已知不存在的目录（避免重复检查）
    this.nonExistentDirectories = new Set([
      'user-uploads/art',
      'user-uploads/music',
      'user-uploads/video'
    ]);
    
    this.init();
  }

  init() {
    // 设置全局实例
    window.directoryChecker = this;
    
    if (window.logManager) {
      window.logManager.debug('DirectoryChecker', '目录检查器已初始化');
    }
  }

  // 检查目录是否存在
  async exists(path) {
    // 检查已知不存在的目录
    if (this.nonExistentDirectories.has(path)) {
      if (window.logManager) {
        window.logManager.debug('DirectoryChecker', `跳过已知不存在的目录: ${path}`);
      }
      return false;
    }

    // 检查缓存
    const cached = this.getCachedResult(path);
    if (cached !== null) {
      return cached;
    }

    // 检查是否已有进行中的检查
    if (this.pendingChecks.has(path)) {
      return await this.pendingChecks.get(path);
    }

    // 执行检查
    const checkPromise = this.performCheck(path);
    this.pendingChecks.set(path, checkPromise);

    try {
      const result = await checkPromise;
      this.cacheResult(path, result);
      return result;
    } finally {
      this.pendingChecks.delete(path);
    }
  }

  // 获取缓存结果
  getCachedResult(path) {
    const cached = this.cache.get(path);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(path);
      return null;
    }

    return cached.exists;
  }

  // 缓存结果
  cacheResult(path, exists) {
    this.cache.set(path, {
      exists: exists,
      timestamp: Date.now()
    });

    // 如果确认不存在，添加到已知不存在列表
    if (!exists) {
      this.nonExistentDirectories.add(path);
    }

    // 清理过期缓存
    this.cleanCache();
  }

  // 执行实际检查
  async performCheck(path) {
    if (!window.githubStorage || !window.githubStorage.token) {
      if (window.logManager) {
        window.logManager.debug('DirectoryChecker', 'GitHub存储未配置，假设目录不存在');
      }
      return false;
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/hysteriasy/Serial_story/contents/${path}`,
        {
          method: 'HEAD', // 只检查头部，不下载内容
          headers: {
            'Authorization': `Bearer ${window.githubStorage.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      );

      const exists = response.ok;
      
      if (window.logManager) {
        window.logManager.debug('DirectoryChecker', `目录检查: ${path} -> ${exists ? '存在' : '不存在'}`);
      }

      return exists;
    } catch (error) {
      if (window.logManager) {
        window.logManager.debug('DirectoryChecker', `目录检查失败: ${path}`, error.message);
      }
      return false;
    }
  }

  // 清理过期缓存
  cleanCache() {
    if (this.cache.size <= 100) return; // 缓存大小限制

    const now = Date.now();
    const toDelete = [];

    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.cacheTimeout) {
        toDelete.push(key);
      }
    });

    toDelete.forEach(key => this.cache.delete(key));
  }

  // 预检查常用目录
  async preCheckCommonDirectories() {
    const commonPaths = [
      'user-uploads',
      'user-uploads/literature',
      'user-uploads/art',
      'user-uploads/music',
      'user-uploads/video',
      'data/works'
    ];

    if (window.logManager) {
      window.logManager.debug('DirectoryChecker', '开始预检查常用目录');
    }

    const checks = commonPaths.map(path => this.exists(path));
    await Promise.allSettled(checks);

    if (window.logManager) {
      window.logManager.debug('DirectoryChecker', '常用目录预检查完成');
    }
  }

  // 安全的目录访问包装器
  async safeDirectoryAccess(path, operation) {
    const exists = await this.exists(path);
    
    if (!exists) {
      if (window.logManager) {
        window.logManager.debug('DirectoryChecker', `跳过不存在的目录操作: ${path}`);
      }
      return [];
    }

    try {
      return await operation();
    } catch (error) {
      if (error.status === 404) {
        // 更新缓存，标记为不存在
        this.cacheResult(path, false);
        if (window.logManager) {
          window.logManager.github404(path, 'DirectoryChecker');
        }
        return [];
      }
      throw error;
    }
  }

  // 批量检查目录
  async checkMultiple(paths) {
    const results = {};
    const checks = paths.map(async (path) => {
      results[path] = await this.exists(path);
    });

    await Promise.allSettled(checks);
    return results;
  }

  // 获取统计信息
  getStats() {
    return {
      cacheSize: this.cache.size,
      nonExistentCount: this.nonExistentDirectories.size,
      pendingChecks: this.pendingChecks.size,
      knownDirectories: this.knownDirectories.size
    };
  }

  // 清空缓存
  clearCache() {
    this.cache.clear();
    this.nonExistentDirectories.clear();
    if (window.logManager) {
      window.logManager.info('DirectoryChecker', '缓存已清空');
    }
  }

  // 手动标记目录为不存在
  markAsNonExistent(path) {
    this.nonExistentDirectories.add(path);
    this.cacheResult(path, false);
    if (window.logManager) {
      window.logManager.debug('DirectoryChecker', `手动标记目录为不存在: ${path}`);
    }
  }

  // 手动标记目录为存在
  markAsExistent(path) {
    this.nonExistentDirectories.delete(path);
    this.cacheResult(path, true);
    if (window.logManager) {
      window.logManager.debug('DirectoryChecker', `手动标记目录为存在: ${path}`);
    }
  }
}

// 创建全局实例
window.directoryChecker = new DirectoryChecker();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DirectoryChecker;
}

// 页面加载完成后预检查常用目录
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (window.directoryChecker) {
        window.directoryChecker.preCheckCommonDirectories();
      }
    }, 2000);
  });
} else {
  setTimeout(() => {
    if (window.directoryChecker) {
      window.directoryChecker.preCheckCommonDirectories();
    }
  }, 2000);
}

if (window.logManager) {
  window.logManager.debug('DirectoryChecker', '目录检查器已加载');
}
