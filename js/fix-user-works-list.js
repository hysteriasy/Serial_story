// 修复用户作品列表的工具脚本
// 用于重建和同步用户作品列表数据

class UserWorksListFixer {
  constructor() {
    this.fixedUsers = new Set();
    this.totalWorksFound = 0;
    this.totalUsersFixed = 0;
  }

  // 主修复方法
  async fixAllUserWorksLists() {
    console.log('🔧 开始修复用户作品列表...');
    
    try {
      // 1. 从localStorage扫描所有作品
      await this.scanLocalStorageWorks();
      
      // 2. 从GitHub扫描所有作品（如果可用）
      if (window.dataManager && window.dataManager.shouldUseGitHubStorage()) {
        await this.scanGitHubWorks();
      }
      
      console.log(`✅ 修复完成！共修复 ${this.totalUsersFixed} 个用户，找到 ${this.totalWorksFound} 个作品`);
      
      // 3. 触发页面刷新
      this.triggerPageRefresh();
      
    } catch (error) {
      console.error('❌ 修复用户作品列表失败:', error);
    }
  }

  // 扫描localStorage中的作品
  async scanLocalStorageWorks() {
    console.log('📱 扫描localStorage中的作品...');
    const userWorksMap = new Map();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('work_')) {
        try {
          const workData = localStorage.getItem(key);
          if (workData) {
            const work = JSON.parse(workData);
            const workId = key.replace('work_', '');
            const username = work.uploadedBy || work.author;
            
            if (username) {
              if (!userWorksMap.has(username)) {
                userWorksMap.set(username, []);
              }
              userWorksMap.get(username).push(workId);
              this.totalWorksFound++;
            }
          }
        } catch (error) {
          console.warn(`解析作品数据失败: ${key}`, error);
        }
      }
    }
    
    // 更新用户作品列表
    for (const [username, workIds] of userWorksMap) {
      await this.updateUserWorksList(username, workIds, 'localStorage');
    }
  }

  // 扫描GitHub中的作品
  async scanGitHubWorks() {
    console.log('🌐 扫描GitHub中的作品...');
    const userWorksMap = new Map();
    
    try {
      // 扫描data/works目录
      if (window.fileHierarchyManager) {
        const githubFiles = await window.fileHierarchyManager.listGitHubWorkFiles();
        console.log(`🔍 GitHub data/works目录中找到 ${githubFiles.length} 个文件`);
        
        for (const fileInfo of githubFiles) {
          try {
            const workData = await window.dataManager.loadData(fileInfo.key, {
              category: 'works',
              fallbackToLocal: false
            });
            
            if (workData) {
              const workId = workData.id || fileInfo.key.replace('work_', '');
              const username = workData.uploadedBy || workData.author;
              
              if (username) {
                if (!userWorksMap.has(username)) {
                  userWorksMap.set(username, []);
                }
                if (!userWorksMap.get(username).includes(workId)) {
                  userWorksMap.get(username).push(workId);
                  this.totalWorksFound++;
                }
              }
            }
          } catch (error) {
            console.warn(`加载GitHub作品失败: ${fileInfo.key}`, error);
          }
        }
      }
      
      // 扫描user-uploads目录
      if (window.smartFileLoader) {
        const categories = ['literature', 'art', 'music', 'video'];
        
        for (const category of categories) {
          try {
            const files = await window.smartFileLoader._loadFromUserUploads(category);
            console.log(`🔍 user-uploads/${category}目录中找到 ${files.length} 个文件`);
            
            files.forEach(file => {
              const workId = file.id || file.fileId;
              const username = file.uploadedBy || file.author;
              
              if (workId && username) {
                if (!userWorksMap.has(username)) {
                  userWorksMap.set(username, []);
                }
                if (!userWorksMap.get(username).includes(workId)) {
                  userWorksMap.get(username).push(workId);
                  this.totalWorksFound++;
                }
              }
            });
          } catch (error) {
            console.warn(`扫描${category}分类失败:`, error);
          }
        }
      }
      
      // 更新用户作品列表
      for (const [username, workIds] of userWorksMap) {
        await this.updateUserWorksList(username, workIds, 'github');
      }
      
    } catch (error) {
      console.error('扫描GitHub作品失败:', error);
    }
  }

  // 更新用户作品列表
  async updateUserWorksList(username, workIds, source) {
    try {
      if (this.fixedUsers.has(username)) {
        // 如果已经处理过这个用户，合并作品列表
        const existingList = await window.dataManager.loadUserWorksList(username);
        const mergedList = [...new Set([...existingList, ...workIds])];
        
        if (mergedList.length > existingList.length) {
          await window.dataManager.saveUserWorksList(username, mergedList);
          console.log(`🔄 合并用户作品列表: ${username}, 新增 ${mergedList.length - existingList.length} 个作品 (来源: ${source})`);
        }
      } else {
        // 首次处理这个用户
        await window.dataManager.saveUserWorksList(username, workIds);
        console.log(`✅ 重建用户作品列表: ${username}, 共 ${workIds.length} 个作品 (来源: ${source})`);
        this.fixedUsers.add(username);
        this.totalUsersFixed++;
      }
    } catch (error) {
      console.error(`更新用户 ${username} 的作品列表失败:`, error);
    }
  }

  // 触发页面刷新
  triggerPageRefresh() {
    console.log('🔄 触发页面数据刷新...');
    
    // 刷新首页统计
    if (typeof window.updateHomepageStats === 'function') {
      setTimeout(() => {
        window.updateHomepageStats();
      }, 1000);
    }
    
    // 刷新我的作品页面（如果存在）
    if (window.location.pathname.includes('my-works.html')) {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
    
    // 通知其他组件刷新
    if (window.dataSyncManager) {
      window.dataSyncManager.notifyPageRefresh('user_works_fixed', {
        usersFixed: this.totalUsersFixed,
        worksFound: this.totalWorksFound
      });
    }
  }

  // 验证修复结果
  async verifyFix(username) {
    try {
      const userWorksList = await window.dataManager.loadUserWorksList(username);
      console.log(`🔍 验证用户 ${username} 的作品列表:`, userWorksList);
      
      // 验证每个作品是否真实存在
      let validWorks = 0;
      for (const workId of userWorksList) {
        try {
          const workData = await window.dataManager.loadWorkData(workId);
          if (workData) {
            validWorks++;
          }
        } catch (error) {
          console.warn(`作品 ${workId} 无法加载:`, error);
        }
      }
      
      console.log(`✅ 用户 ${username} 的作品列表验证完成: ${validWorks}/${userWorksList.length} 个作品有效`);
      return { total: userWorksList.length, valid: validWorks };
      
    } catch (error) {
      console.error(`验证用户 ${username} 的作品列表失败:`, error);
      return { total: 0, valid: 0 };
    }
  }
}

// 创建全局实例
window.userWorksListFixer = new UserWorksListFixer();

// 自动修复函数（可在控制台调用）
window.fixUserWorksList = async function() {
  console.log('🚀 启动用户作品列表修复...');
  await window.userWorksListFixer.fixAllUserWorksLists();
};

// 验证特定用户的作品列表
window.verifyUserWorks = async function(username) {
  if (!username) {
    console.error('请提供用户名');
    return;
  }
  return await window.userWorksListFixer.verifyFix(username);
};

console.log('🔧 用户作品列表修复工具已加载');
console.log('💡 使用 fixUserWorksList() 来修复所有用户的作品列表');
console.log('💡 使用 verifyUserWorks("username") 来验证特定用户的作品列表');
