// 系统统计数据管理器
class SystemStatsManager {
  constructor() {
    this.statsCache = null;
    this.lastUpdateTime = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  // 获取真实的系统统计数据
  async getRealSystemStats() {
    // 检查缓存是否有效
    if (this.statsCache && this.lastUpdateTime && 
        (Date.now() - this.lastUpdateTime) < this.cacheTimeout) {
      return this.statsCache;
    }

    console.log('🔄 正在收集系统统计数据...');

    const stats = {
      users: await this.getUserStats(),
      works: await this.getWorksStats(),
      activity: await this.getActivityStats(),
      storage: this.getStorageStats(),
      system: this.getSystemStats()
    };

    // 更新缓存
    this.statsCache = stats;
    this.lastUpdateTime = Date.now();

    console.log('✅ 系统统计数据收集完成:', stats);
    return stats;
  }

  // 获取用户统计
  async getUserStats() {
    const userStats = {
      total: 0,
      byRole: { admin: 0, friend: 0, visitor: 0 },
      todayActive: 0,
      thisWeekActive: 0
    };

    try {
      // 从Firebase获取用户数据
      if (window.firebaseAvailable && firebase.apps && firebase.apps.length) {
        const snapshot = await firebase.database().ref('users').once('value');
        const firebaseUsers = snapshot.val() || {};
        
        for (const [username, userData] of Object.entries(firebaseUsers)) {
          userStats.total++;
          userStats.byRole[userData.role] = (userStats.byRole[userData.role] || 0) + 1;
          
          // 检查活跃度
          if (userData.last_login) {
            const lastLogin = new Date(userData.last_login);
            const now = new Date();
            const daysDiff = (now - lastLogin) / (1000 * 60 * 60 * 24);
            
            if (daysDiff < 1) userStats.todayActive++;
            if (daysDiff < 7) userStats.thisWeekActive++;
          }
        }
      }

      // 从本地存储获取用户数据
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('user_')) {
          try {
            const userData = JSON.parse(localStorage.getItem(key));
            userStats.total++;
            userStats.byRole[userData.role] = (userStats.byRole[userData.role] || 0) + 1;
            
            // 检查活跃度
            if (userData.last_login) {
              const lastLogin = new Date(userData.last_login);
              const now = new Date();
              const daysDiff = (now - lastLogin) / (1000 * 60 * 60 * 24);
              
              if (daysDiff < 1) userStats.todayActive++;
              if (daysDiff < 7) userStats.thisWeekActive++;
            }
          } catch (error) {
            console.warn(`解析用户数据失败: ${key}`, error);
          }
        }
      }

      // 去重（Firebase和本地存储可能有重复）
      userStats.total = Math.max(userStats.total, 
        userStats.byRole.admin + userStats.byRole.friend + userStats.byRole.visitor);

    } catch (error) {
      console.error('获取用户统计失败:', error);
    }

    return userStats;
  }

  // 获取作品统计
  async getWorksStats() {
    const worksStats = {
      total: 0,
      byCategory: {
        literature: { total: 0, essay: 0, poetry: 0, novel: 0 },
        art: { total: 0, painting: 0, sketch: 0, digital: 0 },
        music: { total: 0, original: 0, cover: 0, instrumental: 0 },
        video: { total: 0, short: 0, documentary: 0, travel: 0 }
      },
      todayUploaded: 0,
      thisWeekUploaded: 0
    };

    try {
      // 统计work_*文件
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('work_')) {
          try {
            const workData = JSON.parse(localStorage.getItem(key));
            worksStats.total++;
            
            const category = workData.mainCategory || 'literature';
            const subcategory = workData.subCategory || 'essay';
            
            if (worksStats.byCategory[category]) {
              worksStats.byCategory[category].total++;
              if (worksStats.byCategory[category][subcategory] !== undefined) {
                worksStats.byCategory[category][subcategory]++;
              }
            }
            
            // 检查上传时间
            if (workData.uploadTime) {
              const uploadTime = new Date(workData.uploadTime);
              const now = new Date();
              const daysDiff = (now - uploadTime) / (1000 * 60 * 60 * 24);
              
              if (daysDiff < 1) worksStats.todayUploaded++;
              if (daysDiff < 7) worksStats.thisWeekUploaded++;
            }
          } catch (error) {
            console.warn(`解析作品数据失败: ${key}`, error);
          }
        }
      }

      // 统计旧格式随笔
      const essaysData = localStorage.getItem('essays');
      if (essaysData) {
        try {
          const essays = JSON.parse(essaysData);
          worksStats.total += essays.length;
          worksStats.byCategory.literature.total += essays.length;
          worksStats.byCategory.literature.essay += essays.length;
        } catch (error) {
          console.warn('解析旧格式随笔失败:', error);
        }
      }

      // 统计公共作品列表
      const categories = ['literature', 'art', 'music', 'video'];
      for (const category of categories) {
        const publicWorksData = localStorage.getItem(`publicWorks_${category}`);
        if (publicWorksData) {
          try {
            const publicWorks = JSON.parse(publicWorksData);
            // 注意：这里可能与work_*有重复，但我们保持简单的统计
            for (const work of publicWorks) {
              // 检查是否已经在work_*中统计过
              const workKey = `work_${work.id}`;
              if (!localStorage.getItem(workKey)) {
                worksStats.total++;
                worksStats.byCategory[category].total++;
              }
            }
          } catch (error) {
            console.warn(`解析${category}公共作品失败:`, error);
          }
        }
      }

    } catch (error) {
      console.error('获取作品统计失败:', error);
    }

    return worksStats;
  }

  // 获取活跃度统计
  async getActivityStats() {
    const activityStats = {
      todayLogins: 0,
      thisWeekLogins: 0,
      todayUploads: 0,
      thisWeekUploads: 0,
      onlineUsers: 0
    };

    try {
      // 从登录记录获取活跃度数据
      const loginRecords = this.getLoginRecords();
      const now = new Date();
      
      for (const record of loginRecords) {
        const loginTime = new Date(record.timestamp);
        const daysDiff = (now - loginTime) / (1000 * 60 * 60 * 24);
        
        if (daysDiff < 1) activityStats.todayLogins++;
        if (daysDiff < 7) activityStats.thisWeekLogins++;
      }

      // 估算在线用户（最近15分钟有活动的用户）
      const recentActivity = loginRecords.filter(record => {
        const loginTime = new Date(record.timestamp);
        const minutesDiff = (now - loginTime) / (1000 * 60);
        return minutesDiff < 15;
      });
      
      activityStats.onlineUsers = new Set(recentActivity.map(r => r.username)).size;

    } catch (error) {
      console.error('获取活跃度统计失败:', error);
    }

    return activityStats;
  }

  // 获取存储统计
  getStorageStats() {
    const storageStats = {
      localStorageUsed: 0,
      localStorageTotal: 5 * 1024 * 1024, // 5MB估算
      itemsCount: localStorage.length,
      largestItems: []
    };

    try {
      let totalSize = 0;
      const items = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        
        totalSize += size;
        items.push({ key, size });
      }

      storageStats.localStorageUsed = totalSize;
      storageStats.largestItems = items
        .sort((a, b) => b.size - a.size)
        .slice(0, 5)
        .map(item => ({
          key: item.key,
          size: this.formatFileSize(item.size)
        }));

    } catch (error) {
      console.error('获取存储统计失败:', error);
    }

    return storageStats;
  }

  // 获取系统统计
  getSystemStats() {
    return {
      lastUpdate: new Date().toISOString(),
      browserInfo: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine
    };
  }

  // 获取登录记录
  getLoginRecords() {
    try {
      const records = localStorage.getItem('loginRecords');
      return records ? JSON.parse(records) : [];
    } catch (error) {
      console.error('获取登录记录失败:', error);
      return [];
    }
  }

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 格式化统计数据为显示文本
  formatStatsForDisplay(stats) {
    return {
      summary: {
        totalUsers: stats.users.total,
        totalWorks: stats.works.total,
        todayActive: stats.users.todayActive,
        storageUsed: this.formatFileSize(stats.storage.localStorageUsed)
      },
      detailed: {
        users: `总用户: ${stats.users.total} (管理员: ${stats.users.byRole.admin}, 好友: ${stats.users.byRole.friend}, 访客: ${stats.users.byRole.visitor})`,
        works: `总作品: ${stats.works.total} (文学: ${stats.works.byCategory.literature.total}, 绘画: ${stats.works.byCategory.art.total}, 音乐: ${stats.works.byCategory.music.total}, 视频: ${stats.works.byCategory.video.total})`,
        activity: `今日活跃: ${stats.users.todayActive}, 本周活跃: ${stats.users.thisWeekActive}, 在线用户: ${stats.activity.onlineUsers}`,
        storage: `存储使用: ${this.formatFileSize(stats.storage.localStorageUsed)} / ${this.formatFileSize(stats.storage.localStorageTotal)} (${stats.storage.itemsCount} 项)`
      }
    };
  }

  // 清除缓存
  clearCache() {
    this.statsCache = null;
    this.lastUpdateTime = null;
  }
}

// 创建全局实例
window.systemStatsManager = new SystemStatsManager();
