// 随笔数据管理器
// 专门处理随笔数据的同步、验证和清理

class EssaysDataManager {
  constructor() {
    this.environment = this.detectEnvironment();
    this.validationCache = new Map();
    this.lastSyncTime = null;
    
    console.log(`📚 随笔数据管理器初始化 - 环境: ${this.environment}`);
  }

  // 检测运行环境
  detectEnvironment() {
    const hostname = window.location.hostname;
    if (hostname === 'hysteriasy.github.io') {
      return 'github_pages';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'local_dev';
    } else if (window.location.protocol === 'file:') {
      return 'file_system';
    }
    return 'unknown';
  }

  // 获取所有随笔数据源
  async getAllDataSources() {
    const sources = {
      localStorage_essays: [],
      localStorage_works: [],
      publicWorks_literature: [],
      github_files: []
    };

    try {
      // 1. localStorage中的essays数据
      const essays = localStorage.getItem('essays');
      if (essays) {
        sources.localStorage_essays = JSON.parse(essays);
      }

      // 2. localStorage中的work_记录
      const keys = Object.keys(localStorage);
      const workKeys = keys.filter(key => key.startsWith('work_'));
      for (const key of workKeys) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.subcategory === 'essay') {
            sources.localStorage_works.push({
              ...data,
              storageKey: key
            });
          }
        } catch (error) {
          console.warn(`解析work数据失败: ${key}`, error);
        }
      }

      // 3. publicWorks_literature中的随笔
      const publicWorks = localStorage.getItem('publicWorks_literature');
      if (publicWorks) {
        const works = JSON.parse(publicWorks);
        sources.publicWorks_literature = works.filter(work => work.subcategory === 'essay');
      }

      // 4. GitHub文件系统中的实际文件
      if (window.smartFileLoader) {
        try {
          sources.github_files = await window.smartFileLoader._loadFromUserUploads('essays');
        } catch (error) {
          console.warn('获取GitHub文件失败:', error);
        }
      }

    } catch (error) {
      console.error('获取数据源失败:', error);
    }

    return sources;
  }

  // 验证数据一致性
  async validateDataConsistency() {
    console.log('🔍 开始验证随笔数据一致性...');
    
    const sources = await this.getAllDataSources();
    const report = {
      total_localStorage_essays: sources.localStorage_essays.length,
      total_localStorage_works: sources.localStorage_works.length,
      total_publicWorks: sources.publicWorks_literature.length,
      total_github_files: sources.github_files.length,
      inconsistencies: [],
      orphaned_records: [],
      missing_files: [],
      recommendations: []
    };

    // 检查孤立的localStorage记录
    for (const work of sources.localStorage_works) {
      const hasGitHubFile = sources.github_files.some(file => 
        file.id === work.id || file.filePath?.includes(work.id)
      );
      
      if (!hasGitHubFile) {
        report.orphaned_records.push({
          type: 'localStorage_work',
          id: work.id,
          title: work.title,
          storageKey: work.storageKey
        });
      }
    }

    // 检查缺失的文件记录
    for (const file of sources.github_files) {
      const hasLocalRecord = sources.localStorage_works.some(work => 
        work.id === file.id
      );
      
      if (!hasLocalRecord) {
        report.missing_files.push({
          type: 'github_file',
          id: file.id,
          title: file.title,
          filePath: file.filePath
        });
      }
    }

    // 检查essays列表与work记录的一致性
    for (const essay of sources.localStorage_essays) {
      const hasWorkRecord = sources.localStorage_works.some(work => 
        work.id === essay.id || work.title === essay.title
      );
      
      if (!hasWorkRecord) {
        report.inconsistencies.push({
          type: 'essay_without_work',
          essay: essay
        });
      }
    }

    // 生成建议
    if (report.orphaned_records.length > 0) {
      report.recommendations.push(`清理 ${report.orphaned_records.length} 个孤立的localStorage记录`);
    }
    
    if (report.missing_files.length > 0) {
      report.recommendations.push(`为 ${report.missing_files.length} 个GitHub文件创建localStorage记录`);
    }
    
    if (report.inconsistencies.length > 0) {
      report.recommendations.push(`修复 ${report.inconsistencies.length} 个数据不一致问题`);
    }

    console.log('📊 数据一致性验证完成:', report);
    return report;
  }

  // 清理孤立的记录
  async cleanupOrphanedRecords(orphanedRecords) {
    console.log(`🧹 开始清理 ${orphanedRecords.length} 个孤立记录...`);
    
    let cleanedCount = 0;
    
    for (const record of orphanedRecords) {
      try {
        if (record.type === 'localStorage_work') {
          // 删除work_记录
          localStorage.removeItem(record.storageKey);
          console.log(`🗑️ 已删除: ${record.storageKey}`);
          
          // 从publicWorks_literature中移除
          const publicWorksKey = 'publicWorks_literature';
          const publicWorks = localStorage.getItem(publicWorksKey);
          if (publicWorks) {
            const works = JSON.parse(publicWorks);
            const filteredWorks = works.filter(work => work.id !== record.id);
            if (filteredWorks.length !== works.length) {
              localStorage.setItem(publicWorksKey, JSON.stringify(filteredWorks));
              console.log(`🗑️ 已从公共作品列表移除: ${record.id}`);
            }
          }
          
          // 从essays列表中移除
          const essaysKey = 'essays';
          const essays = localStorage.getItem(essaysKey);
          if (essays) {
            const essaysList = JSON.parse(essays);
            const filteredEssays = essaysList.filter(essay => essay.id !== record.id);
            if (filteredEssays.length !== essaysList.length) {
              localStorage.setItem(essaysKey, JSON.stringify(filteredEssays));
              console.log(`🗑️ 已从随笔列表移除: ${record.id}`);
            }
          }
          
          cleanedCount++;
        }
      } catch (error) {
        console.error(`清理记录失败: ${record.id}`, error);
      }
    }
    
    console.log(`✅ 清理完成，共清理 ${cleanedCount} 个记录`);
    return cleanedCount;
  }

  // 同步GitHub文件到localStorage
  async syncGitHubFilesToLocal(missingFiles) {
    console.log(`🔄 开始同步 ${missingFiles.length} 个GitHub文件到localStorage...`);
    
    let syncedCount = 0;
    
    for (const file of missingFiles) {
      try {
        if (file.type === 'github_file') {
          // 创建work_记录
          const workKey = `work_${file.id}`;
          const workData = {
            id: file.id,
            mainCategory: 'literature',
            subcategory: 'essay',
            title: file.title,
            content: file.content,
            uploadedBy: file.author || file.uploadedBy,
            uploadTime: file.date || file.uploadTime,
            permissions: file.permissions || { isPublic: true },
            storage_type: 'local'
          };
          
          localStorage.setItem(workKey, JSON.stringify(workData));
          console.log(`💾 已创建localStorage记录: ${workKey}`);
          
          // 添加到publicWorks_literature
          const publicWorksKey = 'publicWorks_literature';
          let publicWorks = [];
          try {
            const existing = localStorage.getItem(publicWorksKey);
            if (existing) {
              publicWorks = JSON.parse(existing);
            }
          } catch (error) {
            console.warn('获取公共作品列表失败:', error);
          }
          
          const workRef = {
            id: file.id,
            owner: file.author || file.uploadedBy,
            mainCategory: 'literature',
            subcategory: 'essay',
            title: file.title,
            uploadTime: file.date || file.uploadTime
          };
          
          // 检查是否已存在
          if (!publicWorks.some(work => work.id === file.id)) {
            publicWorks.push(workRef);
            localStorage.setItem(publicWorksKey, JSON.stringify(publicWorks));
            console.log(`📋 已添加到公共作品列表: ${file.id}`);
          }
          
          syncedCount++;
        }
      } catch (error) {
        console.error(`同步文件失败: ${file.id}`, error);
      }
    }
    
    console.log(`✅ 同步完成，共同步 ${syncedCount} 个文件`);
    return syncedCount;
  }

  // 执行完整的数据同步
  async performFullSync() {
    console.log('🔄 开始执行完整的数据同步...');
    
    try {
      // 1. 验证数据一致性
      const report = await this.validateDataConsistency();
      
      // 2. 清理孤立记录
      if (report.orphaned_records.length > 0) {
        await this.cleanupOrphanedRecords(report.orphaned_records);
      }
      
      // 3. 同步缺失文件
      if (report.missing_files.length > 0) {
        await this.syncGitHubFilesToLocal(report.missing_files);
      }
      
      // 4. 清除缓存
      if (window.smartFileLoader) {
        window.smartFileLoader.clearCache();
      }
      
      // 5. 更新同步时间
      this.lastSyncTime = new Date().toISOString();
      localStorage.setItem('essays_last_sync', this.lastSyncTime);
      
      console.log('✅ 完整数据同步完成');
      
      // 6. 重新验证
      const finalReport = await this.validateDataConsistency();
      return {
        success: true,
        initialReport: report,
        finalReport: finalReport,
        syncTime: this.lastSyncTime
      };
      
    } catch (error) {
      console.error('❌ 数据同步失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取同步状态
  getSyncStatus() {
    const lastSync = localStorage.getItem('essays_last_sync');
    return {
      environment: this.environment,
      lastSyncTime: lastSync,
      cacheSize: this.validationCache.size,
      needsSync: !lastSync || (Date.now() - new Date(lastSync).getTime()) > 24 * 60 * 60 * 1000 // 24小时
    };
  }
}

// 创建全局实例
window.essaysDataManager = new EssaysDataManager();

console.log('📚 随笔数据管理器已加载');
