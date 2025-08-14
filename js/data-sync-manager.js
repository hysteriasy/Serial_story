// 数据同步管理器 - 解决跨页面数据同步问题
class DataSyncManager {
  constructor() {
    this.eventListeners = new Map();
    this.syncQueue = [];
    this.isProcessing = false;
    
    // 监听存储变化
    this.setupStorageListener();
    
    console.log('🔄 数据同步管理器初始化完成');
  }

  // 设置存储监听器
  setupStorageListener() {
    // 监听 localStorage 变化（跨标签页）
    window.addEventListener('storage', (e) => {
      this.handleStorageChange(e);
    });

    // 监听自定义数据变更事件
    window.addEventListener('dataChanged', (e) => {
      this.handleDataChange(e.detail);
    });
  }

  // 处理存储变化
  handleStorageChange(event) {
    if (!event.key) return;

    const changeInfo = {
      type: 'storage',
      key: event.key,
      oldValue: event.oldValue,
      newValue: event.newValue,
      timestamp: Date.now()
    };

    console.log('📡 检测到存储变化:', changeInfo);
    this.notifyListeners('storageChange', changeInfo);
  }

  // 处理数据变化
  handleDataChange(detail) {
    console.log('📡 检测到数据变化:', detail);
    this.notifyListeners('dataChange', detail);
  }

  // 注册事件监听器
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  // 移除事件监听器
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 通知监听器
  notifyListeners(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('数据同步监听器执行失败:', error);
        }
      });
    }
  }

  // 触发数据变更事件
  triggerDataChange(changeInfo) {
    // 添加到同步队列
    this.syncQueue.push(changeInfo);
    
    // 触发自定义事件
    const event = new CustomEvent('dataChanged', { detail: changeInfo });
    window.dispatchEvent(event);
    
    // 处理同步队列
    this.processSyncQueue();
  }

  // 处理同步队列
  async processSyncQueue() {
    if (this.isProcessing || this.syncQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      while (this.syncQueue.length > 0) {
        const changeInfo = this.syncQueue.shift();
        await this.processDataChange(changeInfo);
      }
    } catch (error) {
      console.error('处理同步队列失败:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // 处理数据变更
  async processDataChange(changeInfo) {
    const { action, type, fileId, owner, data } = changeInfo;
    
    try {
      switch (action) {
        case 'update':
          await this.handleFileUpdate(fileId, owner, data);
          break;
        case 'delete':
          await this.handleFileDelete(fileId, owner, data);
          break;
        case 'permission_change':
          await this.handlePermissionChange(fileId, owner, data);
          break;
        default:
          console.warn('未知的数据变更操作:', action);
      }
    } catch (error) {
      console.error(`处理数据变更失败 (${action}):`, error);
    }
  }

  // 处理文件更新
  async handleFileUpdate(fileId, owner, data) {
    console.log(`🔄 处理文件更新: ${fileId} (${owner})`);
    
    // 清理相关缓存
    this.clearRelatedCache(fileId, owner, data);
    
    // 更新公共作品列表
    if (data.permissions?.isPublic) {
      await this.updatePublicWorksList(data);
    } else {
      await this.removeFromPublicWorksList(fileId, owner);
    }
    
    // 通知页面刷新
    this.notifyPageRefresh('fileUpdate', { fileId, owner, data });
  }

  // 处理文件删除
  async handleFileDelete(fileId, owner, data) {
    console.log(`🗑️ 处理文件删除: ${fileId} (${owner})`);
    
    // 清理相关缓存
    this.clearRelatedCache(fileId, owner, data);
    
    // 从公共作品列表中移除
    await this.removeFromPublicWorksList(fileId, owner);
    
    // 通知页面刷新
    this.notifyPageRefresh('fileDelete', { fileId, owner });
  }

  // 处理权限变更
  async handlePermissionChange(fileId, owner, data) {
    console.log(`🔐 处理权限变更: ${fileId} (${owner})`);
    
    // 清理相关缓存
    this.clearRelatedCache(fileId, owner, data);
    
    // 更新管理员文件列表中的权限信息
    if (window.adminFileManager && window.adminFileManager.currentFiles) {
      const fileIndex = window.adminFileManager.currentFiles.findIndex(f => 
        f.fileId === fileId && f.owner === owner
      );
      if (fileIndex !== -1) {
        window.adminFileManager.currentFiles[fileIndex].permissions = data.newPermissions;
        console.log('✅ 已更新管理员文件列表中的权限信息');
      }
    }
    
    // 根据新权限更新公共作品列表
    if (data.newPermissions?.isPublic) {
      // 获取完整文件信息并添加到公共列表
      const fileInfo = await this.getFileInfo(fileId, owner);
      if (fileInfo) {
        await this.updatePublicWorksList(fileInfo);
      }
    } else {
      await this.removeFromPublicWorksList(fileId, owner);
    }
    
    // 通知页面刷新
    this.notifyPageRefresh('permissionChange', { fileId, owner, permissions: data.newPermissions });
  }

  // 清理相关缓存
  clearRelatedCache(fileId, owner, data) {
    // 清理智能文件加载器缓存
    if (window.smartFileLoader) {
      window.smartFileLoader.clearCache();
      console.log('✅ 已清理智能文件加载器缓存');
    }
    
    // 清理其他相关缓存
    const cacheKeys = [
      `fileList_essays`,
      `fileList_literature`,
      `fileList_art`,
      `fileList_music`,
      `fileList_video`,
      `work_${fileId}`,
      `permissions_${fileId}_${owner}`
    ];
    
    cacheKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        // 标记缓存为过期，而不是直接删除
        const cacheData = JSON.parse(localStorage.getItem(key) || '{}');
        cacheData._expired = true;
        cacheData._expiredAt = Date.now();
        localStorage.setItem(key, JSON.stringify(cacheData));
      }
    });
  }

  // 更新公共作品列表
  async updatePublicWorksList(fileData) {
    try {
      const category = fileData.mainCategory || 'literature';
      const listKey = `publicWorks_${category}`;
      
      // 获取当前列表
      let worksList = [];
      try {
        const existingList = localStorage.getItem(listKey);
        if (existingList) {
          worksList = JSON.parse(existingList);
        }
      } catch (error) {
        console.warn('解析公共作品列表失败:', error);
      }
      
      // 移除旧条目（如果存在）
      worksList = worksList.filter(work => 
        !(work.id === fileData.fileId && work.owner === fileData.owner)
      );
      
      // 添加新条目
      worksList.push({
        id: fileData.fileId,
        title: fileData.title,
        owner: fileData.owner,
        subcategory: fileData.subCategory || fileData.subcategory,
        uploadTime: fileData.uploadTime,
        lastModified: Date.now()
      });
      
      // 保存更新后的列表
      localStorage.setItem(listKey, JSON.stringify(worksList));
      
      // 如果有数据管理器，也保存到 GitHub
      if (window.dataManager) {
        await window.dataManager.savePublicWorksList(category, worksList);
      }
      
      console.log(`✅ 已更新公共作品列表: ${category}`);
    } catch (error) {
      console.error('更新公共作品列表失败:', error);
    }
  }

  // 从公共作品列表中移除
  async removeFromPublicWorksList(fileId, owner) {
    try {
      const categories = ['literature', 'art', 'music', 'video'];
      
      for (const category of categories) {
        const listKey = `publicWorks_${category}`;
        
        try {
          const existingList = localStorage.getItem(listKey);
          if (existingList) {
            let worksList = JSON.parse(existingList);
            const originalLength = worksList.length;
            
            // 移除匹配的条目
            worksList = worksList.filter(work => 
              !(work.id === fileId && work.owner === owner)
            );
            
            if (worksList.length !== originalLength) {
              // 保存更新后的列表
              localStorage.setItem(listKey, JSON.stringify(worksList));
              
              // 如果有数据管理器，也保存到 GitHub
              if (window.dataManager) {
                await window.dataManager.savePublicWorksList(category, worksList);
              }
              
              console.log(`✅ 已从公共作品列表移除: ${category}/${fileId}`);
            }
          }
        } catch (error) {
          console.warn(`处理公共作品列表失败 (${category}):`, error);
        }
      }
    } catch (error) {
      console.error('从公共作品列表移除失败:', error);
    }
  }

  // 获取文件信息
  async getFileInfo(fileId, owner) {
    try {
      // 优先从管理员文件列表获取
      if (window.adminFileManager && window.adminFileManager.currentFiles) {
        const file = window.adminFileManager.currentFiles.find(f => 
          f.fileId === fileId && f.owner === owner
        );
        if (file) return file;
      }
      
      // 从存储获取
      const workKey = `work_${fileId}`;
      const workData = localStorage.getItem(workKey);
      if (workData) {
        return JSON.parse(workData);
      }
      
      // 从数据管理器获取
      if (window.dataManager) {
        return await window.dataManager.loadWorkData(fileId);
      }
      
      return null;
    } catch (error) {
      console.error('获取文件信息失败:', error);
      return null;
    }
  }

  // 通知页面刷新
  notifyPageRefresh(type, data) {
    // 通知管理员页面刷新
    if (window.adminFileManager && typeof window.adminFileManager.loadFileList === 'function') {
      setTimeout(() => {
        window.adminFileManager.loadFileList();
      }, 100);
    }
    
    // 通知其他页面刷新（通过自定义事件）
    const refreshEvent = new CustomEvent('pageRefreshNeeded', {
      detail: { type, data, timestamp: Date.now() }
    });
    window.dispatchEvent(refreshEvent);
  }

  // 手动触发文件更新同步
  syncFileUpdate(fileId, owner, fileData) {
    this.triggerDataChange({
      action: 'update',
      type: 'file',
      fileId,
      owner,
      data: fileData,
      timestamp: Date.now()
    });
  }

  // 手动触发文件删除同步
  syncFileDelete(fileId, owner) {
    this.triggerDataChange({
      action: 'delete',
      type: 'file',
      fileId,
      owner,
      timestamp: Date.now()
    });
  }

  // 手动触发权限变更同步
  syncPermissionChange(fileId, owner, oldPermissions, newPermissions, reason) {
    this.triggerDataChange({
      action: 'permission_change',
      type: 'permission',
      fileId,
      owner,
      data: {
        oldPermissions,
        newPermissions,
        reason,
        changedBy: auth.currentUser?.username
      },
      timestamp: Date.now()
    });
  }
}

// 创建全局实例
window.dataSyncManager = new DataSyncManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataSyncManager;
}

console.log('🔄 数据同步管理器已加载');
