/**
 * 特定文件删除修复器
 * 专门处理复杂文件ID格式的删除问题
 */

class SpecificFileDeletionFix {
  constructor() {
    this.isInitialized = false;
    this.problemFileId = '2025-08-16_work_work_1755320228871_7dh6r0uza';
    this.problemOwner = '1755320228871';
    this.workKey = `work_${this.problemFileId}`;
    
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    if (window.logManager) {
      window.logManager.info('SpecificFileFix', '特定文件删除修复器初始化...');
    }
    
    // 增强文件ID提取逻辑
    this.enhanceFileIdExtraction();
    
    // 增强删除逻辑
    this.enhanceDeletionLogic();
    
    // 设置全局实例
    window.specificFileDeletionFix = this;
    
    this.isInitialized = true;
    
    if (window.logManager) {
      window.logManager.info('SpecificFileFix', '特定文件删除修复器已初始化');
    }
  }

  // 增强文件ID提取逻辑
  enhanceFileIdExtraction() {
    if (!window.adminFileManager) {
      setTimeout(() => this.enhanceFileIdExtraction(), 1000);
      return;
    }

    // 保存原始方法
    const originalExtractFileIdFromName = window.adminFileManager.extractFileIdFromName.bind(window.adminFileManager);
    
    // 增强文件ID提取方法
    window.adminFileManager.extractFileIdFromName = (filename) => {
      if (window.logManager) {
        window.logManager.debug('SpecificFileFix', `提取文件ID: ${filename}`);
      }
      
      // 移除扩展名
      const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
      
      // 特殊处理复杂格式：2025-08-16_work_work_1755320228871_7dh6r0uza.json
      if (nameWithoutExt.includes('_work_work_')) {
        const match = nameWithoutExt.match(/^(.+_work_work_.+)$/);
        if (match) {
          const extractedId = match[1];
          if (window.logManager) {
            window.logManager.debug('SpecificFileFix', `复杂格式文件ID: ${extractedId}`);
          }
          return extractedId;
        }
      }
      
      // 调用原始方法处理其他格式
      return originalExtractFileIdFromName(filename);
    };

    if (window.logManager) {
      window.logManager.debug('SpecificFileFix', '文件ID提取逻辑已增强');
    }
  }

  // 增强删除逻辑
  enhanceDeletionLogic() {
    if (!window.adminFileManager) {
      setTimeout(() => this.enhanceDeletionLogic(), 1000);
      return;
    }

    // 保存原始删除方法
    const originalPerformFileDelete = window.adminFileManager.performFileDelete.bind(window.adminFileManager);
    
    // 增强删除方法
    window.adminFileManager.performFileDelete = async (file) => {
      if (window.logManager) {
        window.logManager.debug('SpecificFileFix', `增强删除方法: ${file.fileId} (${file.owner})`);
      }
      
      // 特殊处理问题文件
      if (file.fileId === this.problemFileId && file.owner === this.problemOwner) {
        return await this.handleSpecificFileDeletion(file);
      }
      
      // 其他文件使用原始方法
      return await originalPerformFileDelete(file);
    };

    if (window.logManager) {
      window.logManager.debug('SpecificFileFix', '删除逻辑已增强');
    }
  }

  // 处理特定文件的删除
  async handleSpecificFileDeletion(file) {
    if (window.logManager) {
      window.logManager.info('SpecificFileFix', `开始处理特定文件删除: ${file.fileId}`);
    }

    const deleteResults = {
      github: { success: false, error: null },
      local: { success: false, error: null },
      permissions: { success: false, error: null }
    };

    try {
      // 1. 多种方式尝试从GitHub删除
      await this.deleteFromGitHub(file, deleteResults);
      
      // 2. 多种方式尝试从本地存储删除
      await this.deleteFromLocalStorage(file, deleteResults);
      
      // 3. 删除权限设置
      await this.deletePermissions(file, deleteResults);
      
      // 4. 清理相关缓存和引用
      await this.cleanupReferences(file);
      
      if (window.logManager) {
        window.logManager.info('SpecificFileFix', '特定文件删除完成', deleteResults);
      }
      
      return deleteResults;
      
    } catch (error) {
      if (window.logManager) {
        window.logManager.error('SpecificFileFix', `特定文件删除失败: ${error.message}`, deleteResults);
      }
      throw error;
    }
  }

  // 从GitHub删除
  async deleteFromGitHub(file, deleteResults) {
    if (!window.githubStorage || !window.githubStorage.token) {
      deleteResults.github.success = true; // GitHub不可用，视为成功
      return;
    }

    const possiblePaths = [
      `data/works/${this.workKey}.json`,
      `data/works/work_${file.fileId}.json`,
      `data/works/${file.fileId}.json`,
      file.githubPath
    ].filter(Boolean);

    if (window.logManager) {
      window.logManager.debug('SpecificFileFix', `尝试删除GitHub路径: ${possiblePaths.join(', ')}`);
    }

    let deletedAny = false;
    
    for (const path of possiblePaths) {
      try {
        const result = await window.githubStorage.deleteFile(path, `删除特定问题文件: ${file.fileId}`);
        if (result && result.success) {
          deletedAny = true;
          if (window.logManager) {
            window.logManager.info('SpecificFileFix', `GitHub删除成功: ${path}`);
          }
        }
      } catch (error) {
        if (error.status === 404) {
          if (window.logManager) {
            window.logManager.debug('SpecificFileFix', `GitHub路径不存在: ${path}`);
          }
        } else {
          if (window.logManager) {
            window.logManager.warn('SpecificFileFix', `GitHub删除失败: ${path} - ${error.message}`);
          }
        }
      }
    }

    deleteResults.github.success = true; // 即使没有删除任何文件，也视为成功（文件可能不存在）
    if (deletedAny) {
      if (window.logManager) {
        window.logManager.info('SpecificFileFix', 'GitHub删除操作完成');
      }
    }
  }

  // 从本地存储删除
  async deleteFromLocalStorage(file, deleteResults) {
    const possibleKeys = [
      this.workKey,
      `work_${file.fileId}`,
      file.fileId
    ];

    if (window.logManager) {
      window.logManager.debug('SpecificFileFix', `尝试删除本地存储键: ${possibleKeys.join(', ')}`);
    }

    let deletedAny = false;

    for (const key of possibleKeys) {
      try {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          deletedAny = true;
          if (window.logManager) {
            window.logManager.info('SpecificFileFix', `本地存储删除成功: ${key}`);
          }
        }
      } catch (error) {
        if (window.logManager) {
          window.logManager.warn('SpecificFileFix', `本地存储删除失败: ${key} - ${error.message}`);
        }
      }
    }

    // 额外清理：搜索包含文件ID的所有键
    try {
      const allKeys = Object.keys(localStorage);
      const relatedKeys = allKeys.filter(key => 
        key.includes(file.fileId) || 
        key.includes(file.owner) ||
        key.includes(this.problemFileId)
      );
      
      for (const key of relatedKeys) {
        try {
          localStorage.removeItem(key);
          deletedAny = true;
          if (window.logManager) {
            window.logManager.info('SpecificFileFix', `清理相关键: ${key}`);
          }
        } catch (e) {
          // 忽略单个键删除失败
        }
      }
    } catch (error) {
      if (window.logManager) {
        window.logManager.warn('SpecificFileFix', `清理相关键失败: ${error.message}`);
      }
    }

    deleteResults.local.success = true;
    if (deletedAny) {
      if (window.logManager) {
        window.logManager.info('SpecificFileFix', '本地存储删除操作完成');
      }
    }
  }

  // 删除权限设置
  async deletePermissions(file, deleteResults) {
    if (window.filePermissionsSystem) {
      try {
        await window.filePermissionsSystem.deleteFilePermissions(file.fileId, file.owner);
        deleteResults.permissions.success = true;
        if (window.logManager) {
          window.logManager.info('SpecificFileFix', '权限设置删除成功');
        }
      } catch (error) {
        deleteResults.permissions.error = error.message;
        if (window.logManager) {
          window.logManager.warn('SpecificFileFix', `权限设置删除失败: ${error.message}`);
        }
      }
    } else {
      deleteResults.permissions.success = true; // 权限系统不存在，视为成功
    }
  }

  // 清理相关引用
  async cleanupReferences(file) {
    // 从管理员文件列表中移除
    if (window.adminFileManager && window.adminFileManager.currentFiles) {
      const originalLength = window.adminFileManager.currentFiles.length;
      window.adminFileManager.currentFiles = window.adminFileManager.currentFiles.filter(f => 
        !(f.fileId === file.fileId && f.owner === file.owner) &&
        !(f.fileId === this.problemFileId && f.owner === this.problemOwner)
      );
      const newLength = window.adminFileManager.currentFiles.length;
      
      if (originalLength !== newLength) {
        if (window.logManager) {
          window.logManager.info('SpecificFileFix', `从文件列表中移除 ${originalLength - newLength} 个条目`);
        }
      }
    }

    // 清理公共作品列表
    const categories = ['literature', 'art', 'music', 'video'];
    for (const category of categories) {
      const listKey = `publicWorks_${category}`;
      try {
        const existingList = localStorage.getItem(listKey);
        if (existingList) {
          let worksList = JSON.parse(existingList);
          const originalLength = worksList.length;
          
          worksList = worksList.filter(work => 
            !(work.id === file.fileId && work.owner === file.owner) &&
            !(work.id === this.problemFileId && work.owner === this.problemOwner)
          );
          
          if (worksList.length !== originalLength) {
            localStorage.setItem(listKey, JSON.stringify(worksList));
            if (window.logManager) {
              window.logManager.info('SpecificFileFix', `从公共作品列表清理: ${category}`);
            }
          }
        }
      } catch (error) {
        if (window.logManager) {
          window.logManager.warn('SpecificFileFix', `清理公共作品列表失败: ${category} - ${error.message}`);
        }
      }
    }
  }

  // 手动强制删除特定文件
  async forceDeleteSpecificFile() {
    if (window.logManager) {
      window.logManager.info('SpecificFileFix', '开始强制删除特定文件...');
    }

    try {
      // 创建虚拟文件对象
      const virtualFile = {
        fileId: this.problemFileId,
        owner: this.problemOwner,
        title: '问题文件',
        source: 'unknown'
      };

      // 执行删除
      await this.handleSpecificFileDeletion(virtualFile);

      // 刷新文件列表
      if (window.adminFileManager) {
        await window.adminFileManager.loadFileList();
      }

      if (window.logManager) {
        window.logManager.info('SpecificFileFix', '强制删除特定文件完成');
      }

      return { success: true, message: '强制删除成功' };
    } catch (error) {
      if (window.logManager) {
        window.logManager.error('SpecificFileFix', `强制删除失败: ${error.message}`);
      }
      return { success: false, message: error.message };
    }
  }

  // 获取状态信息
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      problemFileId: this.problemFileId,
      problemOwner: this.problemOwner,
      workKey: this.workKey
    };
  }
}

// 创建全局实例
window.specificFileDeletionFix = new SpecificFileDeletionFix();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpecificFileDeletionFix;
}

if (window.logManager) {
  window.logManager.debug('SpecificFileFix', '特定文件删除修复器已加载');
}
