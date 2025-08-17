/**
 * GitHub Pages 环境下文件删除问题修复脚本
 * 修复删除后文件重新出现的问题
 */

class GitHubPagesDeletionFix {
  constructor() {
    this.isGitHubPages = window.location.hostname === 'hysteriasy.github.io';
    this.deletionQueue = new Set(); // 防止重复删除
    this.deletedFiles = new Map(); // 记录已删除的文件
    this.initialized = false;
  }

  // 初始化修复
  async init() {
    if (this.initialized) return;
    
    console.log('🔧 初始化 GitHub Pages 删除问题修复...');
    
    // 等待必要的组件加载
    await this.waitForDependencies();
    
    // 应用修复
    this.applyDeletionFixes();
    
    // 监听删除事件
    this.setupDeletionEventListeners();
    
    // 修复文件列表加载逻辑
    this.fixFileListLoading();
    
    this.initialized = true;
    console.log('✅ GitHub Pages 删除问题修复已应用');
  }

  // 等待依赖组件
  async waitForDependencies() {
    const maxWait = 10000; // 最多等待10秒
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (window.adminFileManager && window.githubStorage && window.dataManager) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // 应用删除修复
  applyDeletionFixes() {
    if (!window.adminFileManager) return;
    
    // 保存原始删除方法
    const originalDeleteFile = window.adminFileManager.deleteFile.bind(window.adminFileManager);
    const originalPerformFileDelete = window.adminFileManager.performFileDelete.bind(window.adminFileManager);
    const originalLoadFileList = window.adminFileManager.loadFileList.bind(window.adminFileManager);
    
    // 增强删除方法
    window.adminFileManager.deleteFile = async (fileId, owner) => {
      console.log(`🔧 增强删除方法: ${fileId} (${owner})`);
      
      // 防止重复删除
      const deleteKey = `${fileId}_${owner}`;
      if (this.deletionQueue.has(deleteKey)) {
        console.log('⚠️ 删除操作已在进行中，跳过重复请求');
        return;
      }
      
      this.deletionQueue.add(deleteKey);
      
      try {
        // 记录删除前的文件信息
        const fileToDelete = window.adminFileManager.currentFiles?.find(f => 
          f.fileId === fileId && f.owner === owner
        );
        
        if (fileToDelete) {
          this.deletedFiles.set(deleteKey, {
            ...fileToDelete,
            deletedAt: Date.now()
          });
        }
        
        // 执行原始删除
        await originalDeleteFile(fileId, owner);
        
        // GitHub Pages 环境下的特殊处理
        if (this.isGitHubPages) {
          await this.handleGitHubPagesDeletion(fileId, owner, fileToDelete);
        }
        
        console.log(`✅ 文件删除完成: ${fileId} (${owner})`);
        
      } catch (error) {
        console.error(`❌ 文件删除失败: ${fileId} (${owner})`, error);
        // 删除失败时从记录中移除
        this.deletedFiles.delete(deleteKey);
        throw error;
      } finally {
        this.deletionQueue.delete(deleteKey);
      }
    };

    // 增强文件列表加载方法
    window.adminFileManager.loadFileList = async () => {
      console.log('🔧 增强文件列表加载方法');
      
      try {
        // 执行原始加载
        await originalLoadFileList();
        
        // GitHub Pages 环境下过滤已删除的文件
        if (this.isGitHubPages && window.adminFileManager.currentFiles) {
          this.filterDeletedFiles();
        }
        
      } catch (error) {
        console.error('❌ 文件列表加载失败:', error);
        throw error;
      }
    };

    console.log('✅ 删除方法增强完成');
  }

  // 处理 GitHub Pages 环境下的删除
  async handleGitHubPagesDeletion(fileId, owner, fileData) {
    console.log(`🌐 处理 GitHub Pages 删除: ${fileId} (${owner})`);
    
    const workKey = `work_${fileId}`;
    
    try {
      // 1. 确保从所有可能的 GitHub 路径删除
      await this.deleteFromAllGitHubPaths(fileId, owner, fileData);
      
      // 2. 强制清理本地缓存
      this.clearLocalCache(fileId, owner);
      
      // 3. 清理智能文件加载器缓存
      this.clearSmartLoaderCache();
      
      // 4. 延迟验证删除结果
      setTimeout(() => {
        this.verifyDeletionResult(fileId, owner);
      }, 2000);
      
    } catch (error) {
      console.error(`❌ GitHub Pages 删除处理失败: ${error.message}`);
    }
  }

  // 从所有可能的 GitHub 路径删除
  async deleteFromAllGitHubPaths(fileId, owner, fileData) {
    if (!window.githubStorage || !window.githubStorage.token) {
      console.log('⚠️ GitHub 存储不可用，跳过 GitHub 删除');
      return;
    }
    
    const possiblePaths = [
      `data/works/work_${fileId}.json`,
      `data/works/${fileId}.json`,
      `data/works/${owner}_${fileId}.json`,
      fileData?.githubPath
    ].filter(Boolean);
    
    console.log(`🗑️ 尝试从 ${possiblePaths.length} 个可能路径删除文件`);
    
    for (const path of possiblePaths) {
      try {
        const result = await window.githubStorage.deleteFile(path, `删除文件: ${fileId} (${owner})`);
        if (result && result.success && !result.alreadyDeleted) {
          console.log(`✅ 成功从 GitHub 删除: ${path}`);
        }
      } catch (error) {
        if (error.status !== 404) {
          console.warn(`⚠️ GitHub 删除失败: ${path} - ${error.message}`);
        }
      }
    }
  }

  // 清理本地缓存
  clearLocalCache(fileId, owner) {
    const keysToRemove = [
      `work_${fileId}`,
      `file_${fileId}`,
      `${owner}_${fileId}`,
      `permissions_${fileId}`,
      `cache_${fileId}`
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`⚠️ 清理本地缓存失败: ${key}`);
      }
    });
    
    // 清理包含文件ID的所有键
    try {
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.includes(fileId) || key.includes(`${owner}_${fileId}`)) {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            // 忽略单个键删除失败
          }
        }
      });
    } catch (error) {
      console.warn('⚠️ 清理相关缓存失败:', error);
    }
  }

  // 清理智能文件加载器缓存
  clearSmartLoaderCache() {
    if (window.smartFileLoader && window.smartFileLoader.cache) {
      window.smartFileLoader.cache.clear();
      console.log('🗂️ 已清理智能文件加载器缓存');
    }
    
    if (window.directoryChecker && window.directoryChecker.cache) {
      window.directoryChecker.cache.clear();
      console.log('🗂️ 已清理目录检查器缓存');
    }
  }

  // 过滤已删除的文件
  filterDeletedFiles() {
    if (!window.adminFileManager.currentFiles) return;
    
    const originalCount = window.adminFileManager.currentFiles.length;
    
    window.adminFileManager.currentFiles = window.adminFileManager.currentFiles.filter(file => {
      const deleteKey = `${file.fileId}_${file.owner}`;
      const isDeleted = this.deletedFiles.has(deleteKey);
      
      if (isDeleted) {
        const deletedInfo = this.deletedFiles.get(deleteKey);
        const timeSinceDeletion = Date.now() - deletedInfo.deletedAt;
        
        // 如果删除时间超过5分钟，从记录中移除（避免永久过滤）
        if (timeSinceDeletion > 5 * 60 * 1000) {
          this.deletedFiles.delete(deleteKey);
          return true; // 保留文件
        }
        
        console.log(`🚫 过滤已删除的文件: ${file.title || file.originalName} (${deleteKey})`);
        return false; // 过滤掉
      }
      
      return true; // 保留文件
    });
    
    const filteredCount = originalCount - window.adminFileManager.currentFiles.length;
    if (filteredCount > 0) {
      console.log(`🔄 已过滤 ${filteredCount} 个已删除的文件`);
      
      // 更新显示
      if (typeof window.adminFileManager.applyFilters === 'function') {
        window.adminFileManager.applyFilters();
      }
      if (typeof window.adminFileManager.renderFileList === 'function') {
        window.adminFileManager.renderFileList();
      }
    }
  }

  // 验证删除结果
  async verifyDeletionResult(fileId, owner) {
    console.log(`🔍 验证删除结果: ${fileId} (${owner})`);
    
    const deleteKey = `${fileId}_${owner}`;
    
    // 检查文件是否仍在当前列表中
    if (window.adminFileManager.currentFiles) {
      const stillExists = window.adminFileManager.currentFiles.some(f => 
        f.fileId === fileId && f.owner === owner
      );
      
      if (stillExists) {
        console.warn(`⚠️ 文件删除后仍存在于列表中: ${fileId} (${owner})`);
        
        // 强制从列表中移除
        window.adminFileManager.currentFiles = window.adminFileManager.currentFiles.filter(f => 
          !(f.fileId === fileId && f.owner === owner)
        );
        
        // 更新显示
        if (typeof window.adminFileManager.applyFilters === 'function') {
          window.adminFileManager.applyFilters();
        }
        if (typeof window.adminFileManager.renderFileList === 'function') {
          window.adminFileManager.renderFileList();
        }
        
        console.log(`🔧 已强制从列表中移除文件: ${fileId} (${owner})`);
      } else {
        console.log(`✅ 文件删除验证通过: ${fileId} (${owner})`);
      }
    }
  }

  // 设置删除事件监听器
  setupDeletionEventListeners() {
    // 监听文件删除事件
    window.addEventListener('fileDeleted', (event) => {
      const { fileId, owner } = event.detail;
      console.log(`📢 收到文件删除事件: ${fileId} (${owner})`);
      
      // 确保文件从列表中移除
      setTimeout(() => {
        this.verifyDeletionResult(fileId, owner);
      }, 1000);
    });
    
    // 监听页面刷新事件
    window.addEventListener('pageRefreshNeeded', (event) => {
      if (event.detail.type === 'fileDelete') {
        console.log('📢 收到文件删除刷新事件');
        
        // 在 GitHub Pages 环境下延迟刷新
        if (this.isGitHubPages) {
          setTimeout(() => {
            this.filterDeletedFiles();
          }, 500);
        }
      }
    });
    
    console.log('👂 删除事件监听器已设置');
  }

  // 修复文件列表加载逻辑
  fixFileListLoading() {
    // 修复数据同步管理器的文件删除处理
    if (window.dataSyncManager) {
      const originalHandleFileDelete = window.dataSyncManager.handleFileDelete.bind(window.dataSyncManager);
      
      window.dataSyncManager.handleFileDelete = async (fileId, owner, data) => {
        console.log(`🔧 增强数据同步删除处理: ${fileId} (${owner})`);
        
        // 执行原始处理
        await originalHandleFileDelete(fileId, owner, data);
        
        // GitHub Pages 环境下的额外处理
        if (this.isGitHubPages) {
          // 记录删除的文件
          const deleteKey = `${fileId}_${owner}`;
          this.deletedFiles.set(deleteKey, {
            fileId,
            owner,
            deletedAt: Date.now(),
            source: 'sync'
          });
          
          // 延迟过滤
          setTimeout(() => {
            this.filterDeletedFiles();
          }, 100);
        }
      };
    }
    
    console.log('🔧 文件列表加载逻辑修复完成');
  }

  // 手动清理已删除文件记录
  clearDeletedFilesRecord() {
    const count = this.deletedFiles.size;
    this.deletedFiles.clear();
    console.log(`🗑️ 已清理 ${count} 个已删除文件记录`);
  }

  // 获取诊断信息
  getDiagnosticInfo() {
    return {
      isGitHubPages: this.isGitHubPages,
      deletionQueueSize: this.deletionQueue.size,
      deletedFilesCount: this.deletedFiles.size,
      initialized: this.initialized,
      deletedFiles: Array.from(this.deletedFiles.entries()).map(([key, value]) => ({
        key,
        fileId: value.fileId,
        owner: value.owner,
        deletedAt: new Date(value.deletedAt).toISOString(),
        timeSinceDeletion: Date.now() - value.deletedAt
      }))
    };
  }
}

// 创建全局实例
window.gitHubPagesDeletionFix = new GitHubPagesDeletionFix();

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.gitHubPagesDeletionFix.init();
  }, 1000);
});

console.log('🔧 GitHub Pages 删除问题修复脚本已加载');
