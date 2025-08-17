/**
 * 跟踪保护权限访问修复脚本
 * 专门修复权限按钮点击时的"Tracking Prevention blocked access to storage"错误
 */

class TrackingProtectionPermissionsFix {
  constructor() {
    this.isGitHubPages = window.location.hostname === 'hysteriasy.github.io';
    this.storageAccessAttempts = 0;
    this.maxStorageAttempts = 3;
    this.permissionDataCache = new Map();
    this.initialized = false;
    
    // 错误消息过滤器
    this.errorFilters = [
      'Tracking Prevention blocked access to storage',
      'blocked access to storage for',
      'storage access denied',
      'cross-site tracking prevention'
    ];
  }

  // 初始化修复
  async init() {
    if (this.initialized) return;
    
    console.log('🔧 初始化跟踪保护权限访问修复...');
    
    // 等待必要组件加载
    await this.waitForDependencies();
    
    // 应用权限访问修复
    this.applyPermissionAccessFixes();
    
    // 设置控制台错误过滤
    this.setupConsoleErrorFiltering();
    
    // 增强存储访问方法
    this.enhanceStorageAccess();
    
    this.initialized = true;
    console.log('✅ 跟踪保护权限访问修复已应用');
  }

  // 等待依赖组件
  async waitForDependencies() {
    const maxWait = 10000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (window.adminFileManager && window.trackingProtectionHandler && window.filePermissionsSystem) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // 应用权限访问修复
  applyPermissionAccessFixes() {
    // 修复管理员文件管理器的权限编辑方法
    if (window.adminFileManager) {
      this.fixAdminFileManagerPermissions();
    }
    
    // 修复权限系统的数据获取方法
    if (window.filePermissionsSystem) {
      this.fixPermissionSystemDataAccess();
    }
    
    // 修复权限UI的显示方法
    if (window.filePermissionsUI) {
      this.fixPermissionUIAccess();
    }
    
    // 修复增强权限管理器
    if (window.enhancedPermissionsManager) {
      this.fixEnhancedPermissionsManager();
    }
  }

  // 修复管理员文件管理器的权限编辑
  fixAdminFileManagerPermissions() {
    const originalEditPermissions = window.adminFileManager.editPermissions.bind(window.adminFileManager);
    
    window.adminFileManager.editPermissions = async (fileId, owner) => {
      console.log(`🔧 增强权限编辑方法: ${fileId} (${owner})`);
      
      try {
        // 使用安全的存储访问包装器
        const result = await this.safePermissionAccess(async () => {
          return await originalEditPermissions(fileId, owner);
        }, fileId, owner);
        
        return result;
      } catch (error) {
        console.error(`❌ 权限编辑失败: ${fileId} (${owner})`, error);
        
        // 如果是跟踪保护错误，使用回退方案
        if (this.isTrackingProtectionError(error)) {
          await this.handlePermissionAccessFallback(fileId, owner);
        } else {
          throw error;
        }
      }
    };
  }

  // 修复权限系统的数据获取
  fixPermissionSystemDataAccess() {
    const originalGetFilePermissions = window.filePermissionsSystem.getFilePermissions.bind(window.filePermissionsSystem);
    
    window.filePermissionsSystem.getFilePermissions = async (fileId, owner) => {
      console.log(`🔧 增强权限数据获取: ${fileId} (${owner})`);
      
      // 检查缓存
      const cacheKey = `${fileId}_${owner}`;
      if (this.permissionDataCache.has(cacheKey)) {
        const cached = this.permissionDataCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 30000) { // 30秒缓存
          console.log(`📋 使用缓存的权限数据: ${fileId}`);
          return cached.data;
        }
      }
      
      try {
        // 使用安全的存储访问
        const permissions = await this.safeStorageOperation(async () => {
          return await originalGetFilePermissions(fileId, owner);
        });
        
        // 缓存结果
        this.permissionDataCache.set(cacheKey, {
          data: permissions,
          timestamp: Date.now()
        });
        
        return permissions;
      } catch (error) {
        console.warn(`⚠️ 权限数据获取失败，使用回退方案: ${error.message}`);
        return await this.getPermissionsFallback(fileId, owner);
      }
    };
  }

  // 修复权限UI访问
  fixPermissionUIAccess() {
    const originalShowPermissionsModal = window.filePermissionsUI.showPermissionsModal.bind(window.filePermissionsUI);
    
    window.filePermissionsUI.showPermissionsModal = async (fileId, owner) => {
      console.log(`🔧 增强权限UI显示: ${fileId} (${owner})`);
      
      try {
        // 预加载权限数据到缓存
        await this.preloadPermissionData(fileId, owner);
        
        // 使用安全的UI访问
        return await this.safeUIOperation(async () => {
          return await originalShowPermissionsModal(fileId, owner);
        });
      } catch (error) {
        console.error(`❌ 权限UI显示失败: ${error.message}`);
        
        if (this.isTrackingProtectionError(error)) {
          await this.showPermissionModalFallback(fileId, owner);
        } else {
          throw error;
        }
      }
    };
  }

  // 修复增强权限管理器
  fixEnhancedPermissionsManager() {
    const originalShowModal = window.enhancedPermissionsManager.showEnhancedPermissionsModal.bind(window.enhancedPermissionsManager);
    
    window.enhancedPermissionsManager.showEnhancedPermissionsModal = async (fileId, owner) => {
      console.log(`🔧 增强权限管理器显示: ${fileId} (${owner})`);
      
      try {
        // 预处理权限数据
        await this.preprocessPermissionData(fileId, owner);
        
        return await this.safeUIOperation(async () => {
          return await originalShowModal(fileId, owner);
        });
      } catch (error) {
        console.error(`❌ 增强权限管理器失败: ${error.message}`);
        
        if (this.isTrackingProtectionError(error)) {
          await this.showEnhancedPermissionModalFallback(fileId, owner);
        } else {
          throw error;
        }
      }
    };
  }

  // 安全的权限访问包装器
  async safePermissionAccess(operation, fileId, owner) {
    this.storageAccessAttempts++;
    
    try {
      // 如果跟踪保护处理器可用，使用它
      if (window.trackingProtectionHandler) {
        return await window.trackingProtectionHandler.safeStorageOperation(
          operation,
          () => this.handlePermissionAccessFallback(fileId, owner),
          2 // 减少重试次数
        );
      } else {
        return await operation();
      }
    } catch (error) {
      if (this.isTrackingProtectionError(error)) {
        console.warn(`🛡️ 跟踪保护阻止权限访问，使用回退方案: ${fileId}`);
        return await this.handlePermissionAccessFallback(fileId, owner);
      }
      throw error;
    }
  }

  // 安全的存储操作
  async safeStorageOperation(operation) {
    try {
      if (window.trackingProtectionHandler) {
        return await window.trackingProtectionHandler.safeStorageOperation(operation, null, 1);
      } else {
        return await operation();
      }
    } catch (error) {
      if (this.isTrackingProtectionError(error)) {
        console.warn(`🛡️ 跟踪保护阻止存储访问: ${error.message}`);
        return null;
      }
      throw error;
    }
  }

  // 安全的UI操作
  async safeUIOperation(operation) {
    try {
      return await operation();
    } catch (error) {
      if (this.isTrackingProtectionError(error)) {
        console.warn(`🛡️ 跟踪保护阻止UI操作: ${error.message}`);
        // UI操作失败时不抛出错误，而是静默处理
        return null;
      }
      throw error;
    }
  }

  // 预加载权限数据
  async preloadPermissionData(fileId, owner) {
    const cacheKey = `${fileId}_${owner}`;
    
    if (this.permissionDataCache.has(cacheKey)) {
      return; // 已有缓存
    }
    
    try {
      // 优先从GitHub获取
      if (this.isGitHubPages && window.dataManager) {
        const workKey = `work_${fileId}`;
        const workData = await window.dataManager.loadData(workKey, {
          category: 'works',
          fallbackToLocal: false
        });
        
        if (workData && workData.permissions) {
          this.permissionDataCache.set(cacheKey, {
            data: workData.permissions,
            timestamp: Date.now()
          });
          console.log(`📋 预加载权限数据成功: ${fileId}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ 预加载权限数据失败: ${error.message}`);
    }
  }

  // 预处理权限数据
  async preprocessPermissionData(fileId, owner) {
    await this.preloadPermissionData(fileId, owner);
    
    // 预加载用户列表
    try {
      if (auth && typeof auth.getAllUsers === 'function') {
        const users = await auth.getAllUsers();
        console.log(`👥 预加载用户列表: ${users.length} 个用户`);
      }
    } catch (error) {
      console.warn(`⚠️ 预加载用户列表失败: ${error.message}`);
    }
  }

  // 权限访问回退方案
  async handlePermissionAccessFallback(fileId, owner) {
    console.log(`🔄 执行权限访问回退方案: ${fileId} (${owner})`);
    
    // 显示简化的权限设置界面
    this.showSimplifiedPermissionModal(fileId, owner);
  }

  // 权限获取回退方案
  async getPermissionsFallback(fileId, owner) {
    console.log(`🔄 执行权限获取回退方案: ${fileId} (${owner})`);
    
    // 返回默认权限设置
    return {
      level: 'public',
      isPublic: true,
      requiredRole: 'guest',
      minRoleLevel: 1,
      customAccess: null,
      lastModified: new Date().toISOString(),
      modifiedBy: 'system',
      fallback: true
    };
  }

  // 显示简化的权限模态框
  showSimplifiedPermissionModal(fileId, owner) {
    // 移除现有模态框
    const existingModal = document.getElementById('simplifiedPermissionsModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'simplifiedPermissionsModal';
    modal.className = 'modal permissions-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content permissions-modal-content">
        <div class="modal-header">
          <h3>🔐 权限设置 (简化模式)</h3>
          <span class="close-btn" onclick="document.getElementById('simplifiedPermissionsModal').remove()">&times;</span>
        </div>
        <div class="modal-body">
          <div class="permission-notice">
            <p>⚠️ 由于浏览器隐私保护设置，当前使用简化权限设置模式。</p>
            <p>文件ID: ${fileId}</p>
            <p>所有者: ${owner}</p>
          </div>
          <div class="permission-options">
            <label>
              <input type="radio" name="simplePermission" value="public" checked>
              🌍 公开 - 所有人可访问
            </label>
            <label>
              <input type="radio" name="simplePermission" value="friend">
              👥 好友 - 仅好友可访问
            </label>
            <label>
              <input type="radio" name="simplePermission" value="private">
              🔒 私有 - 仅自己可访问
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('simplifiedPermissionsModal').remove()">取消</button>
          <button class="btn btn-primary" onclick="window.trackingProtectionPermissionsFix.saveSimplifiedPermissions('${fileId}', '${owner}')">保存</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  // 保存简化权限设置
  async saveSimplifiedPermissions(fileId, owner) {
    const selectedRadio = document.querySelector('input[name="simplePermission"]:checked');
    if (!selectedRadio) return;
    
    const level = selectedRadio.value;
    
    try {
      // 尝试保存权限设置
      if (window.filePermissionsSystem) {
        const permissions = {
          level: level,
          isPublic: level === 'public',
          requiredRole: level === 'public' ? 'guest' : level === 'friend' ? 'friend' : 'owner',
          lastModified: new Date().toISOString(),
          modifiedBy: auth.currentUser?.username || 'unknown',
          simplified: true
        };
        
        await window.filePermissionsSystem.updatePermissions(fileId, owner, permissions, '简化权限设置');
        
        // 显示成功消息
        if (window.adminFileManager && typeof window.adminFileManager.showNotification === 'function') {
          window.adminFileManager.showNotification('权限设置已保存', 'success');
        }
      }
    } catch (error) {
      console.error('保存简化权限失败:', error);
      if (window.adminFileManager && typeof window.adminFileManager.showNotification === 'function') {
        window.adminFileManager.showNotification('权限保存失败', 'error');
      }
    }
    
    // 关闭模态框
    document.getElementById('simplifiedPermissionsModal').remove();
  }

  // 权限模态框回退方案
  async showPermissionModalFallback(fileId, owner) {
    console.log(`🔄 显示权限模态框回退方案: ${fileId} (${owner})`);
    this.showSimplifiedPermissionModal(fileId, owner);
  }

  // 增强权限模态框回退方案
  async showEnhancedPermissionModalFallback(fileId, owner) {
    console.log(`🔄 显示增强权限模态框回退方案: ${fileId} (${owner})`);
    this.showSimplifiedPermissionModal(fileId, owner);
  }

  // 判断是否是跟踪保护错误
  isTrackingProtectionError(error) {
    const message = error.message.toLowerCase();
    return this.errorFilters.some(filter => message.includes(filter.toLowerCase()));
  }

  // 设置控制台错误过滤
  setupConsoleErrorFiltering() {
    // 保存原始的console.error方法
    const originalConsoleError = console.error;
    
    console.error = (...args) => {
      const message = args.join(' ').toLowerCase();
      
      // 过滤跟踪保护相关的错误消息
      const shouldFilter = this.errorFilters.some(filter => 
        message.includes(filter.toLowerCase())
      );
      
      if (shouldFilter) {
        // 在调试模式下仍然显示，但添加标识
        if (window.location.search.includes('debug=true')) {
          originalConsoleError.call(console, '🛡️ [已过滤的跟踪保护错误]', ...args);
        }
        return; // 不显示错误
      }
      
      // 其他错误正常显示
      originalConsoleError.call(console, ...args);
    };
    
    console.log('🔇 控制台跟踪保护错误过滤已启用');
  }

  // 增强存储访问方法
  enhanceStorageAccess() {
    // 增强localStorage访问
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    const originalRemoveItem = localStorage.removeItem;
    
    localStorage.setItem = function(key, value) {
      try {
        return originalSetItem.call(this, key, value);
      } catch (error) {
        if (window.trackingProtectionPermissionsFix?.isTrackingProtectionError(error)) {
          console.warn(`🛡️ 跟踪保护阻止localStorage.setItem: ${key}`);
          return; // 静默失败
        }
        throw error;
      }
    };
    
    localStorage.getItem = function(key) {
      try {
        return originalGetItem.call(this, key);
      } catch (error) {
        if (window.trackingProtectionPermissionsFix?.isTrackingProtectionError(error)) {
          console.warn(`🛡️ 跟踪保护阻止localStorage.getItem: ${key}`);
          return null; // 返回null而不是抛出错误
        }
        throw error;
      }
    };
    
    localStorage.removeItem = function(key) {
      try {
        return originalRemoveItem.call(this, key);
      } catch (error) {
        if (window.trackingProtectionPermissionsFix?.isTrackingProtectionError(error)) {
          console.warn(`🛡️ 跟踪保护阻止localStorage.removeItem: ${key}`);
          return; // 静默失败
        }
        throw error;
      }
    };
    
    console.log('🔧 localStorage访问方法已增强');
  }

  // 清理权限数据缓存
  clearPermissionCache() {
    this.permissionDataCache.clear();
    console.log('🗑️ 权限数据缓存已清理');
  }

  // 获取诊断信息
  getDiagnosticInfo() {
    return {
      isGitHubPages: this.isGitHubPages,
      storageAccessAttempts: this.storageAccessAttempts,
      permissionCacheSize: this.permissionDataCache.size,
      initialized: this.initialized,
      errorFiltersCount: this.errorFilters.length
    };
  }
}

// 创建全局实例
window.trackingProtectionPermissionsFix = new TrackingProtectionPermissionsFix();

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.trackingProtectionPermissionsFix.init();
  }, 1500); // 稍微延迟以确保其他组件先加载
});

console.log('🔧 跟踪保护权限访问修复脚本已加载');
