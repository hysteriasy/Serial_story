/**
 * 文件删除功能修复脚本
 * 解决GitHub Pages环境中文件删除后列表不更新的问题
 */

class FileDeletionFix {
  constructor() {
    this.isInitialized = false;
    this.deletionQueue = new Set();
    this.refreshTimeout = null;
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    console.log('🔧 初始化文件删除修复模块...');
    
    // 监听文件删除事件
    this.setupDeletionEventListeners();
    
    // 增强管理员文件管理器的删除方法
    this.enhanceAdminFileManager();
    
    // 监听页面刷新事件
    this.setupRefreshEventListeners();
    
    this.isInitialized = true;
    console.log('✅ 文件删除修复模块初始化完成');
  }

  // 设置删除事件监听器
  setupDeletionEventListeners() {
    // 监听自定义删除事件
    window.addEventListener('fileDeleted', (event) => {
      const { fileId, owner } = event.detail;
      console.log(`📡 接收到文件删除事件: ${fileId} (${owner})`);
      this.handleFileDeleted(fileId, owner);
    });

    // 监听数据变更事件
    window.addEventListener('dataChanged', (event) => {
      const { action, fileId, owner } = event.detail;
      if (action === 'delete') {
        console.log(`📡 接收到数据变更事件 (删除): ${fileId} (${owner})`);
        this.handleFileDeleted(fileId, owner);
      }
    });
  }

  // 增强管理员文件管理器
  enhanceAdminFileManager() {
    if (!window.adminFileManager) {
      console.warn('⚠️ adminFileManager 未找到，延迟增强...');
      setTimeout(() => this.enhanceAdminFileManager(), 1000);
      return;
    }

    // 保存原始删除方法
    const originalDeleteFile = window.adminFileManager.deleteFile.bind(window.adminFileManager);
    
    // 增强删除方法
    window.adminFileManager.deleteFile = async (fileId, owner) => {
      console.log(`🔧 增强删除方法被调用: ${fileId} (${owner})`);
      
      try {
        // 调用原始删除方法
        await originalDeleteFile(fileId, owner);
        
        // 触发自定义删除事件
        const deleteEvent = new CustomEvent('fileDeleted', {
          detail: { fileId, owner, timestamp: Date.now() }
        });
        window.dispatchEvent(deleteEvent);
        
        console.log(`✅ 文件删除完成: ${fileId} (${owner})`);
      } catch (error) {
        console.error(`❌ 文件删除失败: ${fileId} (${owner})`, error);
        throw error;
      }
    };

    console.log('✅ adminFileManager 删除方法已增强');
  }

  // 处理文件删除
  handleFileDeleted(fileId, owner) {
    const fileKey = `${owner}_${fileId}`;
    
    // 添加到删除队列
    this.deletionQueue.add(fileKey);
    
    // 立即更新UI
    this.immediateUIUpdate(fileId, owner);
    
    // 延迟完整刷新
    this.scheduleRefresh();
  }

  // 立即更新UI
  immediateUIUpdate(fileId, owner) {
    if (!window.adminFileManager || !window.adminFileManager.currentFiles) {
      return;
    }

    console.log(`🔄 立即更新UI: 移除文件 ${fileId} (${owner})`);
    
    // 从当前文件列表中移除
    const originalLength = window.adminFileManager.currentFiles.length;
    window.adminFileManager.currentFiles = window.adminFileManager.currentFiles.filter(
      file => !(file.fileId === fileId && file.owner === owner)
    );
    
    const newLength = window.adminFileManager.currentFiles.length;
    console.log(`📊 文件列表长度: ${originalLength} -> ${newLength}`);
    
    // 立即重新渲染
    if (typeof window.adminFileManager.applyFilters === 'function') {
      window.adminFileManager.applyFilters();
    }
    
    if (typeof window.adminFileManager.renderFileList === 'function') {
      window.adminFileManager.renderFileList();
    }
    
    // 更新统计信息
    this.updateStatistics();
  }

  // 计划刷新
  scheduleRefresh() {
    // 清除之前的刷新计划
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    // 设置新的刷新计划
    this.refreshTimeout = setTimeout(() => {
      this.performFullRefresh();
    }, 2000); // 2秒后执行完整刷新
  }

  // 执行完整刷新
  async performFullRefresh() {
    console.log('🔄 执行完整文件列表刷新...');
    
    try {
      if (window.adminFileManager && typeof window.adminFileManager.loadFileList === 'function') {
        await window.adminFileManager.loadFileList();
        console.log('✅ 完整刷新完成');
      }
      
      // 清空删除队列
      this.deletionQueue.clear();
      
    } catch (error) {
      console.error('❌ 完整刷新失败:', error);
      
      // 如果刷新失败，重试一次
      setTimeout(() => {
        this.performFullRefresh();
      }, 5000);
    }
  }

  // 更新统计信息
  updateStatistics() {
    // 更新首页统计
    if (typeof window.updateHomepageStats === 'function') {
      setTimeout(() => {
        window.updateHomepageStats();
      }, 100);
    }
    
    // 更新管理员页面统计
    if (window.adminFileManager && typeof window.adminFileManager.updateStatistics === 'function') {
      window.adminFileManager.updateStatistics();
    }
  }

  // 设置刷新事件监听器
  setupRefreshEventListeners() {
    // 监听页面刷新需求事件
    window.addEventListener('pageRefreshNeeded', (event) => {
      const { type, data } = event.detail;
      
      if (type === 'fileDelete') {
        console.log('📡 接收到页面刷新需求 (文件删除)');
        this.handleFileDeleted(data.fileId, data.owner);
      }
    });
    
    // 监听存储变更事件
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('work_') && event.newValue === null) {
        // 检测到文件被删除
        const fileId = event.key.replace('work_', '');
        console.log(`📡 检测到存储删除: ${fileId}`);
        
        // 触发UI更新
        this.scheduleRefresh();
      }
    });
  }

  // 手动触发文件删除处理
  manualTriggerDeletion(fileId, owner) {
    console.log(`🔧 手动触发文件删除处理: ${fileId} (${owner})`);
    this.handleFileDeleted(fileId, owner);
  }

  // 强制刷新文件列表
  forceRefresh() {
    console.log('🔧 强制刷新文件列表');
    this.deletionQueue.clear();
    this.performFullRefresh();
  }

  // 获取删除队列状态
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      deletionQueueSize: this.deletionQueue.size,
      deletionQueue: Array.from(this.deletionQueue),
      hasRefreshTimeout: !!this.refreshTimeout
    };
  }
}

// 创建全局实例
window.fileDeletionFix = new FileDeletionFix();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileDeletionFix;
}

console.log('🔧 文件删除修复脚本已加载');
