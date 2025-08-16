/**
 * 权限修改重复文件修复器
 * 解决权限修改时出现重复文件的问题
 */

class PermissionDuplicateFix {
  constructor() {
    this.isInitialized = false;
    this.processedPermissions = new Set();
    this.permissionChangeQueue = [];
    this.isProcessing = false;
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    if (window.logManager) {
      window.logManager.debug('PermissionFix', '权限重复文件修复器初始化...');
    }
    
    // 监听权限变更事件
    this.setupPermissionEventListeners();
    
    // 增强文件权限系统
    this.enhanceFilePermissionsSystem();
    
    // 设置全局实例
    window.permissionDuplicateFix = this;
    
    this.isInitialized = true;
    
    if (window.logManager) {
      window.logManager.info('PermissionFix', '权限重复文件修复器已初始化');
    }
  }

  // 设置权限事件监听器
  setupPermissionEventListeners() {
    // 监听权限变更事件
    window.addEventListener('permissionChanged', (event) => {
      const { fileId, owner, permissions } = event.detail;
      this.handlePermissionChange(fileId, owner, permissions);
    });

    // 监听数据变更事件
    window.addEventListener('dataChanged', (event) => {
      const { action, fileId, owner, data } = event.detail;
      if (action === 'permission_change') {
        this.handlePermissionChange(fileId, owner, data.newPermissions);
      }
    });
  }

  // 增强文件权限系统
  enhanceFilePermissionsSystem() {
    if (!window.filePermissionsSystem) {
      setTimeout(() => this.enhanceFilePermissionsSystem(), 1000);
      return;
    }

    // 保存原始的updatePermissions方法
    const originalUpdatePermissions = window.filePermissionsSystem.updatePermissions.bind(window.filePermissionsSystem);
    
    // 增强updatePermissions方法
    window.filePermissionsSystem.updatePermissions = async (fileId, owner, newPermissions, reason = '') => {
      const permissionKey = `${owner}_${fileId}`;
      
      // 防止重复处理
      if (this.processedPermissions.has(permissionKey)) {
        if (window.logManager) {
          window.logManager.warn('PermissionFix', `跳过重复的权限修改: ${fileId} (${owner})`);
        }
        return { success: true, message: '权限已处理', permissions: newPermissions };
      }
      
      // 标记为正在处理
      this.processedPermissions.add(permissionKey);
      
      try {
        if (window.logManager) {
          window.logManager.debug('PermissionFix', `处理权限修改: ${fileId} (${owner})`);
        }
        
        // 调用原始方法
        const result = await originalUpdatePermissions(fileId, owner, newPermissions, reason);
        
        // 清理处理标记
        setTimeout(() => {
          this.processedPermissions.delete(permissionKey);
        }, 5000); // 5秒后清理标记
        
        return result;
      } catch (error) {
        // 出错时也要清理标记
        this.processedPermissions.delete(permissionKey);
        throw error;
      }
    };

    if (window.logManager) {
      window.logManager.debug('PermissionFix', '文件权限系统已增强');
    }
  }

  // 处理权限变更
  handlePermissionChange(fileId, owner, permissions) {
    const changeInfo = { fileId, owner, permissions, timestamp: Date.now() };
    
    // 添加到处理队列
    this.permissionChangeQueue.push(changeInfo);
    
    // 处理队列
    this.processPermissionQueue();
  }

  // 处理权限变更队列
  async processPermissionQueue() {
    if (this.isProcessing || this.permissionChangeQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      while (this.permissionChangeQueue.length > 0) {
        const changeInfo = this.permissionChangeQueue.shift();
        await this.processPermissionChange(changeInfo);
      }
    } catch (error) {
      if (window.logManager) {
        window.logManager.error('PermissionFix', '处理权限变更队列失败', error);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // 处理单个权限变更
  async processPermissionChange(changeInfo) {
    const { fileId, owner, permissions } = changeInfo;
    
    try {
      // 检查并清理重复文件
      await this.cleanupDuplicateFiles(fileId, owner);
      
      // 确保文件列表中只有一个正确的文件
      this.ensureSingleFileInList(fileId, owner, permissions);
      
    } catch (error) {
      if (window.logManager) {
        window.logManager.error('PermissionFix', `处理权限变更失败: ${fileId}`, error);
      }
    }
  }

  // 清理重复文件
  async cleanupDuplicateFiles(fileId, owner) {
    if (!window.adminFileManager || !window.adminFileManager.currentFiles) return;
    
    const duplicateFiles = window.adminFileManager.currentFiles.filter(f => 
      f.fileId === fileId && f.owner === owner
    );
    
    if (duplicateFiles.length <= 1) return; // 没有重复文件
    
    if (window.logManager) {
      window.logManager.warn('PermissionFix', `发现重复文件: ${fileId} (${owner}) - ${duplicateFiles.length}个`);
    }
    
    // 找到最完整的文件（有完整标题和内容的）
    const bestFile = this.findBestFile(duplicateFiles);
    
    // 从列表中移除重复文件，只保留最好的一个
    window.adminFileManager.currentFiles = window.adminFileManager.currentFiles.filter(f => {
      if (f.fileId === fileId && f.owner === owner) {
        return f === bestFile; // 只保留最好的文件
      }
      return true; // 保留其他文件
    });
    
    if (window.logManager) {
      window.logManager.info('PermissionFix', `已清理重复文件，保留: ${bestFile.title || bestFile.originalName}`);
    }
  }

  // 找到最好的文件（最完整的）
  findBestFile(files) {
    return files.reduce((best, current) => {
      // 优先选择有完整标题的文件
      if (current.title && !current.title.startsWith('作品_') && (!best.title || best.title.startsWith('作品_'))) {
        return current;
      }
      
      // 优先选择有内容的文件
      if (current.content && !best.content) {
        return current;
      }
      
      // 优先选择有更多属性的文件
      const currentProps = Object.keys(current).length;
      const bestProps = Object.keys(best).length;
      if (currentProps > bestProps) {
        return current;
      }
      
      // 优先选择更新时间更新的文件
      if (current.lastModified && best.lastModified) {
        return new Date(current.lastModified) > new Date(best.lastModified) ? current : best;
      }
      
      return best;
    });
  }

  // 确保文件列表中只有一个正确的文件
  ensureSingleFileInList(fileId, owner, permissions) {
    if (!window.adminFileManager || !window.adminFileManager.currentFiles) return;
    
    const matchingFiles = window.adminFileManager.currentFiles.filter(f => 
      f.fileId === fileId && f.owner === owner
    );
    
    if (matchingFiles.length === 1) {
      // 更新权限信息
      matchingFiles[0].permissions = permissions;
      matchingFiles[0].lastModified = new Date().toISOString();
      
      // 重新渲染列表
      if (typeof window.adminFileManager.renderFileList === 'function') {
        window.adminFileManager.renderFileList();
      }
    }
  }

  // 手动清理重复文件
  async manualCleanupDuplicates() {
    if (!window.adminFileManager || !window.adminFileManager.currentFiles) {
      if (window.logManager) {
        window.logManager.warn('PermissionFix', '管理员文件管理器不可用');
      }
      return;
    }
    
    const fileMap = new Map();
    const duplicates = [];
    
    // 找出所有重复文件
    window.adminFileManager.currentFiles.forEach(file => {
      const key = `${file.owner}_${file.fileId}`;
      if (fileMap.has(key)) {
        duplicates.push({ key, files: [fileMap.get(key), file] });
      } else {
        fileMap.set(key, file);
      }
    });
    
    if (duplicates.length === 0) {
      if (window.logManager) {
        window.logManager.info('PermissionFix', '没有发现重复文件');
      }
      return;
    }
    
    if (window.logManager) {
      window.logManager.info('PermissionFix', `发现 ${duplicates.length} 组重复文件，开始清理...`);
    }
    
    // 清理每组重复文件
    for (const duplicate of duplicates) {
      const { key, files } = duplicate;
      const [owner, fileId] = key.split('_');
      await this.cleanupDuplicateFiles(fileId, owner);
    }
    
    if (window.logManager) {
      window.logManager.info('PermissionFix', '重复文件清理完成');
    }
  }

  // 获取状态信息
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      processedPermissions: this.processedPermissions.size,
      queueLength: this.permissionChangeQueue.length,
      isProcessing: this.isProcessing
    };
  }

  // 重置状态
  reset() {
    this.processedPermissions.clear();
    this.permissionChangeQueue = [];
    this.isProcessing = false;
    
    if (window.logManager) {
      window.logManager.info('PermissionFix', '权限修复器状态已重置');
    }
  }
}

// 创建全局实例
window.permissionDuplicateFix = new PermissionDuplicateFix();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PermissionDuplicateFix;
}

if (window.logManager) {
  window.logManager.debug('PermissionFix', '权限重复文件修复器已加载');
}
