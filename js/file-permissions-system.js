// 文件权限管理系统 - 完整实现
class FilePermissionsSystem {
  constructor() {
    this.permissionLevels = {
      PUBLIC: 'public',
      VISITOR: 'visitor', 
      FRIEND: 'friend',
      CUSTOM: 'custom'
    };

    this.userRoleLevels = {
      guest: 1,      // 未登录用户
      visitor: 2,    // 访客
      friend: 3,     // 好友
      admin: 4       // 管理员
    };
  }

  // 权限数据结构定义
  createPermissionStructure(level = 'public', customSettings = {}) {
    const baseStructure = {
      // 基础权限设置
      level: level, // 'public', 'visitor', 'friend', 'custom'
      isPublic: level === 'public',
      
      // 角色权限设置
      requiredRole: this.getRequiredRole(level),
      minRoleLevel: this.getMinRoleLevel(level),
      
      // 自定义权限设置（仅当level为'custom'时有效）
      customAccess: {
        // 白名单机制
        whitelist: {
          enabled: customSettings.whitelistEnabled || false,
          users: customSettings.whitelistUsers || [], // 用户名数组
          roles: customSettings.whitelistRoles || [], // 角色数组
          description: customSettings.whitelistDescription || ''
        },
        
        // 黑名单机制（优先级高于白名单）
        blacklist: {
          enabled: customSettings.blacklistEnabled || false,
          users: customSettings.blacklistUsers || [], // 用户名数组
          roles: customSettings.blacklistRoles || [], // 角色数组
          description: customSettings.blacklistDescription || ''
        },
        
        // 特殊权限设置
        specialPermissions: {
          allowAnonymous: customSettings.allowAnonymous || false, // 允许未登录用户
          allowComments: customSettings.allowComments !== false, // 允许评论（默认true）
          allowDownload: customSettings.allowDownload !== false, // 允许下载（默认true）
          allowShare: customSettings.allowShare !== false, // 允许分享（默认true）
          expiryDate: customSettings.expiryDate || null, // 权限过期时间
          maxViews: customSettings.maxViews || null, // 最大查看次数
          currentViews: 0 // 当前查看次数
        }
      },
      
      // 元数据
      metadata: {
        createdBy: auth.currentUser ? auth.currentUser.username : 'system',
        createdAt: new Date().toISOString(),
        lastModifiedBy: auth.currentUser ? auth.currentUser.username : 'system',
        lastModifiedAt: new Date().toISOString(),
        version: '1.0',
        
        // 权限变更历史
        changeHistory: [{
          action: 'created',
          by: auth.currentUser ? auth.currentUser.username : 'system',
          at: new Date().toISOString(),
          from: null,
          to: level,
          reason: customSettings.reason || 'Initial creation'
        }]
      }
    };

    return baseStructure;
  }

  // 获取权限级别对应的最低角色要求
  getRequiredRole(level) {
    const roleMap = {
      'public': null, // 无要求，所有人都可以访问
      'visitor': 'visitor', // 需要登录（访客级别）
      'friend': 'friend', // 需要好友级别
      'custom': null // 自定义规则
    };
    return roleMap[level];
  }

  // 获取权限级别对应的最低角色等级
  getMinRoleLevel(level) {
    const levelMap = {
      'public': 0, // 无要求，所有人都可以访问
      'visitor': 2, // 需要访客级别（登录）
      'friend': 3, // 需要好友级别
      'custom': 0 // 自定义规则
    };
    return levelMap[level] || 0;
  }

  // 验证用户是否有权限访问文件
  async checkFileAccess(filePermissions, currentUser = null) {
    try {
      // 如果没有权限设置，默认为私有
      if (!filePermissions) {
        return {
          hasAccess: false,
          reason: 'No permission settings found',
          level: 'private'
        };
      }

      const level = filePermissions.level;
      const customAccess = filePermissions.customAccess;

      // 1. 检查公开权限
      if (level === 'public') {
        return {
          hasAccess: true,
          reason: 'Public access',
          level: 'public'
        };
      }

      // 2. 检查是否需要登录
      if (!currentUser) {
        // 检查是否允许匿名访问（仅在自定义权限中）
        if (level === 'custom' && customAccess?.specialPermissions?.allowAnonymous) {
          return {
            hasAccess: true,
            reason: 'Anonymous access allowed',
            level: 'anonymous'
          };
        }

        // 未登录用户只能访问公开内容
        return {
          hasAccess: false,
          reason: 'Login required for non-public content',
          level: 'login_required'
        };
      }

      // 3. 管理员总是有权限
      if (currentUser.role === 'admin') {
        return {
          hasAccess: true,
          reason: 'Admin access',
          level: 'admin'
        };
      }

      // 4. 检查自定义权限
      if (level === 'custom') {
        return this.checkCustomAccess(customAccess, currentUser);
      }

      // 5. 检查基于角色的权限
      const userRoleLevel = this.userRoleLevels[currentUser.role] || 1; // 默认为guest级别
      const requiredLevel = this.getMinRoleLevel(level);

      if (userRoleLevel >= requiredLevel) {
        return {
          hasAccess: true,
          reason: `Role-based access (${currentUser.role})`,
          level: currentUser.role
        };
      }

      return {
        hasAccess: false,
        reason: `Insufficient role level (required: ${level}, current: ${currentUser.role})`,
        level: 'insufficient_role'
      };

    } catch (error) {
      console.error('权限检查失败:', error);
      return {
        hasAccess: false,
        reason: 'Permission check failed',
        level: 'error'
      };
    }
  }

  // 检查自定义权限访问
  checkCustomAccess(customAccess, currentUser) {
    if (!customAccess) {
      return {
        hasAccess: false,
        reason: 'No custom access settings',
        level: 'no_custom_settings'
      };
    }

    const username = currentUser.username;
    const userRole = currentUser.role;

    // 1. 检查黑名单（优先级最高）
    if (customAccess.blacklist?.enabled) {
      // 检查用户黑名单
      if (customAccess.blacklist.users?.includes(username)) {
        return {
          hasAccess: false,
          reason: 'User is blacklisted',
          level: 'blacklisted_user'
        };
      }
      
      // 检查角色黑名单
      if (customAccess.blacklist.roles?.includes(userRole)) {
        return {
          hasAccess: false,
          reason: 'User role is blacklisted',
          level: 'blacklisted_role'
        };
      }
    }

    // 2. 检查白名单
    if (customAccess.whitelist?.enabled) {
      // 检查用户白名单
      if (customAccess.whitelist.users?.includes(username)) {
        return {
          hasAccess: true,
          reason: 'User is whitelisted',
          level: 'whitelisted_user'
        };
      }
      
      // 检查角色白名单
      if (customAccess.whitelist.roles?.includes(userRole)) {
        return {
          hasAccess: true,
          reason: 'User role is whitelisted',
          level: 'whitelisted_role'
        };
      }
      
      // 白名单启用但用户不在列表中
      return {
        hasAccess: false,
        reason: 'User not in whitelist',
        level: 'not_whitelisted'
      };
    }

    // 3. 检查特殊权限设置
    const specialPerms = customAccess.specialPermissions;
    
    // 检查过期时间
    if (specialPerms?.expiryDate) {
      const expiryDate = new Date(specialPerms.expiryDate);
      if (new Date() > expiryDate) {
        return {
          hasAccess: false,
          reason: 'Access expired',
          level: 'expired'
        };
      }
    }
    
    // 检查查看次数限制
    if (specialPerms?.maxViews && specialPerms.currentViews >= specialPerms.maxViews) {
      return {
        hasAccess: false,
        reason: 'View limit exceeded',
        level: 'view_limit_exceeded'
      };
    }

    // 4. 如果没有特殊限制，默认拒绝访问
    return {
      hasAccess: false,
      reason: 'Custom access denied by default',
      level: 'custom_denied'
    };
  }

  // 更新权限设置
  async updatePermissions(fileId, owner, newPermissions, reason = '') {
    try {
      // 验证权限修改权限
      if (!this.canModifyPermissions(owner)) {
        throw new Error('您没有权限修改此文件的权限设置');
      }

      // 获取当前权限设置
      const currentPermissions = await this.getFilePermissions(fileId, owner);
      
      // 创建新的权限结构
      const updatedPermissions = {
        ...newPermissions,
        metadata: {
          ...newPermissions.metadata,
          lastModifiedBy: auth.currentUser.username,
          lastModifiedAt: new Date().toISOString(),
          version: this.incrementVersion(currentPermissions?.metadata?.version || '1.0'),
          
          // 添加到变更历史
          changeHistory: [
            ...(currentPermissions?.metadata?.changeHistory || []),
            {
              action: 'updated',
              by: auth.currentUser.username,
              at: new Date().toISOString(),
              from: currentPermissions?.level || 'unknown',
              to: newPermissions.level,
              reason: reason || 'Permission update'
            }
          ]
        }
      };

      // 保存权限设置
      await this.saveFilePermissions(fileId, owner, updatedPermissions);
      
      return {
        success: true,
        message: '权限设置已更新',
        permissions: updatedPermissions
      };

    } catch (error) {
      console.error('更新权限失败:', error);
      return {
        success: false,
        message: error.message,
        permissions: null
      };
    }
  }

  // 检查是否可以修改权限
  canModifyPermissions(fileOwner) {
    if (!auth.currentUser) return false;
    
    // 管理员可以修改所有文件权限
    if (auth.isAdmin()) return true;
    
    // 文件所有者可以修改自己的文件权限
    if (auth.currentUser.username === fileOwner) return true;
    
    return false;
  }

  // 版本号递增
  incrementVersion(currentVersion) {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2] || 0) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  // 获取文件权限设置
  async getFilePermissions(fileId, owner) {
    try {
      const workKey = `work_${fileId}`;
      console.log(`🔍 获取文件权限: ${fileId} (所有者: ${owner})`);

      // 1. 在网络环境下，优先从 GitHub 获取数据
      if (window.dataManager && window.dataManager.shouldUseGitHubStorage()) {
        console.log(`🌐 尝试从 GitHub 获取权限数据: ${workKey}`);
        try {
          const workData = await window.dataManager.loadData(workKey, {
            category: 'works',
            fallbackToLocal: false // 先不回退，单独处理
          });
          if (workData && workData.permissions) {
            // 只在调试模式下输出详细日志
            if (window.location.search.includes('debug=true')) {
              console.log(`✅ 从 GitHub 获取到权限数据: ${fileId}`);
            }
            return workData.permissions;
          } else if (workData) {
            // 只在调试模式下输出详细日志
            if (window.location.search.includes('debug=true')) {
              console.log(`⚠️ GitHub 中的作品数据没有权限信息: ${fileId}`);
            }
          } else {
            // 只在调试模式下输出详细日志
            if (window.location.search.includes('debug=true')) {
              console.log(`ℹ️ GitHub 中未找到作品数据: ${fileId}`);
            }
          }
        } catch (error) {
          // 只有非404错误才输出警告
          if (!error.message.includes('文件不存在') && !error.message.includes('404') && error.status !== 404) {
            console.warn(`⚠️ 从 GitHub 获取权限数据失败: ${error.message}`);
          }
        }
      }

      // 2. 从本地存储获取
      if (window.location.search.includes('debug=true')) {
        console.log(`📱 尝试从本地存储获取权限数据: ${workKey}`);
      }

      const localWorkData = localStorage.getItem(workKey);
      if (localWorkData) {
        try {
          const work = JSON.parse(localWorkData);
          if (work.permissions) {
            if (window.location.search.includes('debug=true')) {
              console.log(`✅ 从本地存储获取到权限数据: ${fileId}`);
            }
            return work.permissions;
          } else {
            if (window.location.search.includes('debug=true')) {
              console.log(`⚠️ 本地作品数据没有权限信息: ${fileId}`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ 解析本地作品数据失败: ${error.message}`);
        }
      } else {
        if (window.location.search.includes('debug=true')) {
          console.log(`ℹ️ 本地存储中未找到作品数据: ${fileId}`);
        }
      }

      // 3. 尝试从当前文件列表中获取（管理员页面特有）
      if (window.adminFileManager && window.adminFileManager.currentFiles) {
        if (window.location.search.includes('debug=true')) {
          console.log(`📋 尝试从当前文件列表获取权限数据: ${fileId}`);
        }
        const fileFromList = window.adminFileManager.currentFiles.find(f =>
          f.fileId === fileId && f.owner === owner
        );
        if (fileFromList && fileFromList.permissions) {
          if (window.location.search.includes('debug=true')) {
            console.log(`✅ 从文件列表获取到权限数据: ${fileId}`);
          }
          return fileFromList.permissions;
        }
      }

      // 4. 尝试从Firebase获取（如果可用）
      if (window.firebaseAvailable && firebase.apps && firebase.apps.length) {
        console.log(`🔥 尝试从 Firebase 获取权限数据: userFiles/${owner}/${fileId}/permissions`);
        try {
          const snapshot = await firebase.database().ref(`userFiles/${owner}/${fileId}/permissions`).once('value');
          const firebaseData = snapshot.val();
          if (firebaseData) {
            console.log(`✅ 从 Firebase 获取到权限数据: ${fileId}`);
            return firebaseData;
          } else {
            console.log(`ℹ️ Firebase 中未找到权限数据: ${fileId}`);
          }
        } catch (error) {
          console.warn(`⚠️ 从 Firebase 获取权限数据失败: ${error.message}`);
        }
      }

      // 5. 如果都没有找到，返回默认权限
      console.log(`ℹ️ 未找到权限数据，返回 null: ${fileId}`);
      return null;
    } catch (error) {
      console.error(`❌ 获取文件权限失败: ${fileId}`, error);
      return null;
    }
  }

  // 保存文件权限设置
  async saveFilePermissions(fileId, owner, permissions) {
    try {
      const workKey = `work_${fileId}`;
      let workData = null;

      // 首先尝试获取完整的作品数据
      // 1. 优先从 GitHub 获取（如果在网络环境）
      if (window.dataManager && window.dataManager.shouldUseGitHubStorage()) {
        try {
          workData = await window.dataManager.loadData(workKey, {
            category: 'works',
            fallbackToLocal: true
          });
          console.log(`📁 从 GitHub 获取作品数据用于权限更新: ${fileId}`);
        } catch (error) {
          console.warn(`⚠️ 从 GitHub 获取作品数据失败: ${error.message}`);
        }
      }

      // 2. 如果 GitHub 获取失败，从本地存储获取
      if (!workData) {
        const localData = localStorage.getItem(workKey);
        if (localData) {
          workData = JSON.parse(localData);
          console.log(`📱 从本地存储获取作品数据用于权限更新: ${fileId}`);
        }
      }

      // 3. 如果都没有数据，创建基本的作品数据结构
      if (!workData) {
        console.warn(`⚠️ 未找到作品数据，创建基本结构: ${fileId}`);
        workData = {
          id: fileId,
          owner: owner,
          title: `作品_${fileId}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // 更新权限数据
      workData.permissions = permissions;
      workData.updatedAt = new Date().toISOString();

      // 保存到本地存储
      localStorage.setItem(workKey, JSON.stringify(workData));
      console.log(`💾 权限数据已保存到本地存储: ${fileId}`);

      // 在网络环境下，同步到 GitHub
      if (window.dataManager && window.dataManager.shouldUseGitHubStorage()) {
        try {
          await window.dataManager.saveData(workKey, workData, {
            category: 'works',
            commitMessage: `更新文件权限: ${workData.title || fileId}`
          });
          console.log(`✅ 权限设置已同步到 GitHub: ${fileId}`);
        } catch (error) {
          console.warn(`⚠️ GitHub 权限同步失败: ${error.message}`);
          // GitHub 同步失败不应该阻止本地保存
        }
      }

      // 保存到Firebase
      if (window.firebaseAvailable && firebase.apps.length) {
        await firebase.database().ref(`userFiles/${owner}/${fileId}/permissions`).set(permissions);
      }

      return true;
    } catch (error) {
      console.error('保存文件权限失败:', error);
      throw error;
    }
  }
}

// 创建全局实例
window.filePermissionsSystem = new FilePermissionsSystem();
