// 用户认证模块
const PASSWORD_CONFIG = {
  minLength: 6,
  requireSpecialChar: false,
  specialChars: '!@#$%^&*'
};

// 用户角色权限配置 - 四级权限体系
const USER_ROLES = {
  admin: {
    name: '管理员',
    level: 4,
    permissions: ['upload', 'delete', 'edit', 'manage_users', 'view_all_files', 'set_file_permissions', 'comment', 'edit_comment', 'delete_comment'],
    uploadTypes: ['literature', 'art', 'music', 'video'], // 可以上传所有类型
    canComment: true,
    canEditOwnComment: true,
    canDeleteOwnComment: true,
    canDeleteAnyComment: true,
    canViewContent: ['public', 'friend', 'visitor', 'private'], // 可以查看所有内容
    canManageOwnWorks: true,
    canManageAllWorks: true
  },
  friend: {
    name: '好友',
    level: 3,
    permissions: ['upload', 'edit', 'comment', 'edit_comment', 'delete_comment'],
    uploadTypes: ['literature', 'art', 'music', 'video'], // 可以上传所有类型
    canComment: true,
    canEditOwnComment: true,
    canDeleteOwnComment: true,
    canDeleteAnyComment: false,
    canViewContent: ['public', 'friend'], // 可以查看公开作品和其他好友的作品（黑名单除外）
    canManageOwnWorks: true,
    canManageAllWorks: false
  },
  visitor: {
    name: '访客',
    level: 2,
    permissions: ['view', 'comment', 'edit_comment', 'delete_comment'],
    uploadTypes: [], // 不能上传任何内容
    canComment: true,
    canEditOwnComment: true,
    canDeleteOwnComment: true,
    canDeleteAnyComment: false,
    canViewContent: ['public', 'friend'], // 可以查看所有好友级别用户的作品（黑名单除外）
    canManageOwnWorks: false,
    canManageAllWorks: false
  },
  guest: {
    name: '未登录用户',
    level: 1,
    permissions: ['view'],
    uploadTypes: [], // 不能上传任何内容
    canComment: false,
    canEditOwnComment: false,
    canDeleteOwnComment: false,
    canDeleteAnyComment: false,
    canViewContent: ['public'], // 只能查看标记为"公开"的作品
    canManageOwnWorks: false,
    canManageAllWorks: false
  }
};

// 预设管理员账户
const PRESET_ADMIN = {
  username: 'hysteria',
  password: 'hysteria7816', // 在生产环境中应该通过其他方式配置
  role: 'admin'
};

const auth = {
  currentUser: null,

  // 检查用户权限
  hasPermission(permission) {
    if (!this.currentUser) return false;
    const role = USER_ROLES[this.currentUser.role] || USER_ROLES.visitor;
    return role.permissions.includes(permission);
  },

  // 检查上传权限
  canUploadType(fileType) {
    if (!this.currentUser) return false;
    const role = USER_ROLES[this.currentUser.role] || USER_ROLES.visitor;
    return role.uploadTypes.includes(fileType);
  },

  // 检查是否为管理员
  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  },

  // 检查是否为好友或更高权限
  isFriend() {
    return this.currentUser && ['friend', 'admin'].includes(this.currentUser.role);
  },

  // 检查是否为访客
  isVisitor() {
    return this.currentUser && this.currentUser.role === 'visitor';
  },

  // 检查是否为未登录用户
  isGuest() {
    return !this.currentUser;
  },

  // 检查用户权限级别
  getUserPermissionLevel() {
    if (!this.currentUser) return 1; // 未登录用户级别为1

    const role = USER_ROLES[this.currentUser.role];
    return role ? role.level : 1;
  },

  // 检查用户是否可以查看指定级别的内容
  canViewContentLevel(contentLevel) {
    if (!this.currentUser) {
      // 未登录用户只能查看公开内容
      return contentLevel === 'public';
    }

    const role = USER_ROLES[this.currentUser.role];
    if (!role) return false;

    return role.canViewContent.includes(contentLevel);
  },

  // 检查是否可以编辑指定用户
  canEditUser(targetUsername) {
    if (!this.currentUser) return false;

    // 用户可以编辑自己
    if (this.currentUser.username === targetUsername) return true;

    // 只有管理员可以编辑其他用户
    return this.isAdmin();
  },

  // 检查是否可以修改指定用户的角色
  canChangeUserRole(targetUsername, newRole) {
    if (!this.isAdmin()) return false;

    // 不能修改预设管理员
    if (targetUsername === PRESET_ADMIN.username) return false;

    // 不能修改自己的角色（防止意外降权）
    if (this.currentUser.username === targetUsername) return false;

    return true;
  },

  // 用户管理功能（仅管理员）
  async createUser(username, password, role = 'user') {
    if (!this.isAdmin()) {
      throw new Error('只有管理员可以创建用户');
    }

    // 验证用户名
    if (!/^[a-zA-Z0-9_]{4,16}$/.test(username)) {
      throw new Error('用户名需4-16位字母数字或下划线');
    }

    // 验证密码强度
    const validation = this.validatePassword(password);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // 检查用户是否已存在（支持离线模式）
    const existingUser = await this.getUserByUsername(username);
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 创建加密密码
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const key = await crypto.subtle.deriveBits({
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: 100000
    }, baseKey, 256);

    const userData = {
      username: username,
      password_hash: Array.from(new Uint8Array(key)),
      salt: Array.from(salt),
      iterations: 100000,
      role: role,
      created_at: new Date().toISOString(),
      created_by: this.currentUser.username,
      file_permissions: {},
      storage_type: window.firebaseAvailable ? 'firebase' : 'local'
    };

    try {
      // 使用统一的数据管理器保存用户数据
      if (window.dataManager && window.dataManager.shouldUseGitHubStorage()) {
        try {
          const userKey = `user_${username}`;
          await window.dataManager.saveData(userKey, userData, {
            category: 'users',
            commitMessage: `创建用户: ${username}`
          });
          userData.storage_type = 'github';
          console.log(`✅ 用户 ${username} 已保存到GitHub仓库`);

          // 同时保存到本地存储作为缓存
          await this.saveUserToLocalStorage(userData);

          // 更新用户索引
          await this.updateUserIndex(username, 'add');

          return userData;
        } catch (githubError) {
          console.warn('⚠️ GitHub保存失败，回退到Firebase/本地存储:', githubError.message);
        }
      }

      if (window.firebaseAvailable && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
        // 尝试保存到Firebase
        userData.created_at = firebase.database.ServerValue.TIMESTAMP;
        await firebase.database().ref('users/' + username).set(userData);
        console.log(`✅ 用户 ${username} 已保存到Firebase数据库`);
      } else {
        // 使用本地存储作为备用
        await this.saveUserToLocalStorage(userData);
        console.log(`📱 用户 ${username} 已保存到本地存储（离线模式）`);
      }
    } catch (error) {
      console.warn('⚠️ Firebase保存失败，尝试本地存储:', error.message);
      // Firebase失败时回退到本地存储
      userData.storage_type = 'local';
      userData.created_at = new Date().toISOString();
      await this.saveUserToLocalStorage(userData);
      console.log(`📱 用户 ${username} 已保存到本地存储（备用方案）`);
    }

    return userData;
  },

  // 删除用户（仅管理员，支持离线模式）
  async deleteUser(username) {
    if (!this.isAdmin()) {
      throw new Error('只有管理员可以删除用户');
    }

    if (username === this.currentUser.username) {
      throw new Error('不能删除自己的账户');
    }

    if (username === PRESET_ADMIN.username) {
      throw new Error('不能删除预设管理员账户');
    }

    let deletedFromGitHub = false;
    let deletedFromFirebase = false;
    let deletedFromLocal = false;

    // 尝试从GitHub删除
    if (window.dataManager && window.dataManager.shouldUseGitHubStorage()) {
      try {
        const userKey = `user_${username}`;
        await window.dataManager.deleteData(userKey, { category: 'users' });
        deletedFromGitHub = true;
        console.log(`✅ 用户 ${username} 已从GitHub删除`);
      } catch (error) {
        console.warn('⚠️ GitHub删除失败:', error.message);
      }
    }

    // 尝试从Firebase删除
    if (window.firebaseAvailable && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      try {
        await firebase.database().ref('users/' + username).remove();
        await firebase.database().ref('userFiles/' + username).remove();
        deletedFromFirebase = true;
        console.log(`✅ 用户 ${username} 已从Firebase删除`);
      } catch (error) {
        console.warn('⚠️ Firebase删除失败:', error.message);
      }
    }

    // 从本地存储删除
    try {
      localStorage.removeItem(`user_${username}`);

      // 更新用户列表索引
      const userListKey = 'local_users_list';
      const usersList = this.getLocalUsersList();
      const updatedList = usersList.filter(u => u !== username);
      localStorage.setItem(userListKey, JSON.stringify(updatedList));

      deletedFromLocal = true;
      console.log(`📱 用户 ${username} 已从本地存储删除`);
    } catch (error) {
      console.warn('本地存储删除失败:', error);
    }

    if (!deletedFromGitHub && !deletedFromFirebase && !deletedFromLocal) {
      throw new Error('删除用户失败：无法从任何存储中删除用户数据');
    }

    // 更新用户索引
    if (deletedFromGitHub || deletedFromLocal) {
      try {
        await this.updateUserIndex(username, 'remove');
      } catch (error) {
        console.warn('更新用户索引失败:', error);
      }
    }

    return true;
  },

  // 修改用户密码（管理员可修改任何用户，普通用户只能修改自己）
  async changeUserPassword(username, newPassword, oldPassword = null) {
    const isChangingSelf = username === this.currentUser.username;
    const isAdmin = this.isAdmin();

    if (!isChangingSelf && !isAdmin) {
      throw new Error('只能修改自己的密码');
    }

    // 如果是修改自己的密码，需要验证旧密码
    if (isChangingSelf && oldPassword) {
      await this.login(username, oldPassword);
    }

    // 验证新密码强度
    const validation = this.validatePassword(newPassword);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // 生成新密码哈希
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(newPassword), 'PBKDF2', false, ['deriveBits']);
    const key = await crypto.subtle.deriveBits({
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: 100000
    }, baseKey, 256);

    const updateData = {
      password_hash: Array.from(new Uint8Array(key)),
      salt: Array.from(salt),
      iterations: 100000,
      last_modified: new Date().toISOString(),
      modified_by: this.currentUser.username
    };

    try {
      // 尝试更新Firebase
      if (window.firebaseAvailable && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
        updateData.last_modified = firebase.database.ServerValue.TIMESTAMP;
        await firebase.database().ref('users/' + username).update(updateData);
        console.log(`✅ 用户 ${username} 密码已在Firebase中更新`);
      } else {
        // 更新本地存储
        const userData = await this.getUserByUsername(username);
        if (userData) {
          Object.assign(userData, updateData);
          localStorage.setItem(`user_${username}`, JSON.stringify(userData));
          console.log(`📱 用户 ${username} 密码已在本地存储中更新`);
        } else {
          throw new Error('用户不存在');
        }
      }
    } catch (error) {
      console.error('密码更新失败:', error);
      throw error;
    }

    return true;
  },

  // 修改用户角色（管理员功能）
  async changeUserRole(username, newRole) {
    if (!this.isAdmin()) {
      throw new Error('只有管理员可以修改用户角色');
    }

    if (!username || username.trim() === '') {
      throw new Error('用户名无效');
    }

    if (!['visitor', 'friend', 'admin'].includes(newRole)) {
      throw new Error('无效的用户角色');
    }

    // 防止修改预设管理员的角色
    if (username === PRESET_ADMIN.username) {
      throw new Error('不能修改预设管理员的角色');
    }

    const updateData = {
      role: newRole,
      last_modified: new Date().toISOString(),
      modified_by: this.currentUser.username
    };

    try {
      // 尝试更新Firebase
      if (window.firebaseAvailable && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
        updateData.last_modified = firebase.database.ServerValue.TIMESTAMP;
        await firebase.database().ref('users/' + username).update(updateData);
        console.log(`✅ 用户 ${username} 角色已在Firebase中更新为 ${newRole}`);
      } else {
        // 更新本地存储
        const userData = await this.getUserByUsername(username);
        if (userData) {
          Object.assign(userData, updateData);
          localStorage.setItem(`user_${username}`, JSON.stringify(userData));
          console.log(`📱 用户 ${username} 角色已在本地存储中更新为 ${newRole}`);
        } else {
          throw new Error('用户不存在');
        }
      }
    } catch (error) {
      console.error('角色更新失败:', error);
      throw error;
    }

    return true;
  },

  // 获取所有用户列表（仅管理员，支持离线模式，确保数据一致性）
  async getAllUsers() {
    if (!this.isAdmin()) {
      throw new Error('只有管理员可以查看用户列表');
    }

    let userList = [];
    const userMap = new Map(); // 使用Map避免重复用户

    // 在网络环境下，优先从 GitHub 获取用户数据
    if (window.dataManager && window.dataManager.shouldUseGitHubStorage()) {
      try {
        // 这里需要实现一个方法来获取所有用户数据
        // 由于 GitHub API 的限制，我们可能需要维护一个用户索引文件
        const userIndexKey = 'users_index';
        const userIndex = await window.dataManager.loadData(userIndexKey, {
          category: 'system',
          fallbackToLocal: true
        });

        if (userIndex && userIndex.users) {
          for (const username of userIndex.users) {
            try {
              const userKey = `user_${username}`;
              const userData = await window.dataManager.loadData(userKey, {
                category: 'users',
                fallbackToLocal: true
              });

              if (userData) {
                userMap.set(username, {
                  username: userData.username,
                  role: userData.role,
                  created_at: userData.created_at,
                  last_modified: userData.last_modified,
                  storage_type: 'github'
                });
              }
            } catch (error) {
              // 只有在非404错误时才记录警告
              if (!error.message.includes('文件不存在') && !error.message.includes('404') && error.status !== 404) {
                console.warn(`从 GitHub 获取用户 ${username} 数据失败:`, error);
              }
              // 404错误静默处理，这是正常情况
            }
          }
          console.log(`✅ 从 GitHub 获取到 ${userIndex.users.length} 个用户索引`);
        } else {
          // 静默处理，不输出日志（首次使用时这是正常情况）
        }
      } catch (error) {
        // 只有在非404错误时才记录警告
        if (!error.message.includes('文件不存在') && !error.message.includes('404') && error.status !== 404) {
          console.warn('⚠️ GitHub 用户数据获取失败:', error.message);
        }
        // 404错误静默处理，这是正常情况
      }
    }

    // 获取本地存储的用户（作为备用或补充）
    const localUsernames = this.getLocalUsersList();
    console.log(`📱 本地存储中有 ${localUsernames.length} 个用户索引`);

    for (const username of localUsernames) {
      try {
        const userData = localStorage.getItem(`user_${username}`);
        if (userData) {
          const user = JSON.parse(userData);
          // 如果 GitHub 中没有这个用户，或者本地版本更新，则使用本地数据
          const existingUser = userMap.get(username);
          if (!existingUser || (user.last_modified &&
              new Date(user.last_modified) > new Date(existingUser.last_modified || 0))) {
            userMap.set(username, {
              username: user.username,
              role: user.role,
              created_at: user.created_at,
              last_modified: user.last_modified,
              storage_type: existingUser ? 'local_updated' : 'local'
            });
          }
        }
      } catch (error) {
        console.warn(`解析本地用户 ${username} 数据失败:`, error);
      }
    }

    // 然后尝试从Firebase获取（只有在连接可用时）
    if (window.firebaseAvailable && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      try {
        const snapshot = await firebase.database().ref('users').once('value');
        const users = snapshot.val() || {};

        Object.keys(users).forEach(username => {
          // 如果本地没有这个用户，或者Firebase版本更新，则使用Firebase数据
          const localUser = userMap.get(username);
          const firebaseUser = {
            username: username,
            role: users[username].role,
            created_at: users[username].created_at,
            last_modified: users[username].last_modified,
            storage_type: 'firebase'
          };

          if (!localUser || (users[username].last_modified &&
              new Date(users[username].last_modified) > new Date(localUser.last_modified || 0))) {
            userMap.set(username, firebaseUser);
          }
        });

        console.log(`✅ 从Firebase获取到 ${Object.keys(users).length} 个用户`);
      } catch (error) {
        console.warn('⚠️ Firebase用户列表获取失败:', error.message);
      }
    }

    // 添加预设管理员（如果不在列表中）
    if (!userMap.has(PRESET_ADMIN.username)) {
      userMap.set(PRESET_ADMIN.username, {
        username: PRESET_ADMIN.username,
        role: PRESET_ADMIN.role,
        created_at: new Date().toISOString(),
        storage_type: 'preset'
      });
    }

    // 转换为数组并按创建时间排序
    userList = Array.from(userMap.values()).sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA; // 最新的在前面
    });

    console.log(`📋 总共获取到 ${userList.length} 个用户 (本地: ${localUsernames.length}, 合并后: ${userList.length})`);
    return userList;
  },

  // 保存用户到本地存储（改进版本，确保数据一致性）
  async saveUserToLocalStorage(userData) {
    try {
      // 验证用户数据
      if (!userData || !userData.username) {
        throw new Error('无效的用户数据');
      }

      // 保存单个用户数据
      const userKey = `user_${userData.username}`;
      localStorage.setItem(userKey, JSON.stringify(userData));
      console.log(`📱 用户数据已保存: ${userKey}`);

      // 更新用户列表索引
      const userListKey = 'local_users_list';
      let usersList = [];

      try {
        const existingList = localStorage.getItem(userListKey);
        if (existingList) {
          usersList = JSON.parse(existingList);
          if (!Array.isArray(usersList)) {
            console.warn('用户列表格式错误，重新创建');
            usersList = [];
          }
        }
      } catch (e) {
        console.warn('解析用户列表失败，创建新列表:', e.message);
        usersList = [];
      }

      // 添加用户到列表（如果不存在）
      if (!usersList.includes(userData.username)) {
        usersList.push(userData.username);
        localStorage.setItem(userListKey, JSON.stringify(usersList));
        console.log(`📱 用户索引已更新，当前列表: [${usersList.join(', ')}]`);
      } else {
        console.log(`📱 用户 ${userData.username} 已在索引中`);
      }

      // 验证保存结果
      const savedData = localStorage.getItem(userKey);
      if (!savedData) {
        throw new Error('数据保存验证失败');
      }

      return true;
    } catch (error) {
      console.error('保存用户到本地存储失败:', error);
      throw new Error(`本地存储保存失败: ${error.message}`);
    }
  },

  // 从本地存储获取用户列表（改进版本，包含数据验证和清理）
  getLocalUsersList() {
    try {
      const userListKey = 'local_users_list';
      const usersList = localStorage.getItem(userListKey);

      if (!usersList) {
        return [];
      }

      let parsedList = JSON.parse(usersList);

      // 验证数据格式
      if (!Array.isArray(parsedList)) {
        console.warn('用户列表格式错误，重置为空数组');
        localStorage.setItem(userListKey, JSON.stringify([]));
        return [];
      }

      // 验证每个用户是否真实存在于本地存储中
      const validUsers = [];
      for (const username of parsedList) {
        if (typeof username === 'string' && username.trim()) {
          const userKey = `user_${username}`;
          try {
            const userData = localStorage.getItem(userKey);
            if (userData) {
              // 尝试解析用户数据以验证其有效性
              JSON.parse(userData);
              validUsers.push(username);
            } else {
              console.warn(`用户 ${username} 在索引中但数据不存在，已从索引中移除`);
            }
          } catch (parseError) {
            console.warn(`用户 ${username} 数据损坏，已从索引中移除:`, parseError);
          }
        }
      }

      // 如果清理后的列表与原列表不同，更新索引
      if (validUsers.length !== parsedList.length) {
        localStorage.setItem(userListKey, JSON.stringify(validUsers));
        console.log(`📱 用户索引已清理，从 ${parsedList.length} 个减少到 ${validUsers.length} 个`);
      }

      return validUsers;
    } catch (error) {
      console.warn('获取本地用户列表失败:', error);
      // 尝试重置索引
      try {
        localStorage.setItem('local_users_list', JSON.stringify([]));
      } catch (resetError) {
        console.error('重置用户索引失败:', resetError);
      }
      return [];
    }
  },

  // 根据用户名获取用户信息（支持离线模式，优化查询）
  async getUserByUsername(username, skipFirebase = false) {
    // 检查是否是预设管理员（优先检查，避免不必要的查询）
    if (username === PRESET_ADMIN.username) {
      // 为预设管理员生成密码哈希（用于密码验证）
      try {
        const salt = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]); // 固定salt用于预设管理员
        const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(PRESET_ADMIN.password), 'PBKDF2', false, ['deriveBits']);
        const key = await crypto.subtle.deriveBits({
          name: 'PBKDF2',
          hash: 'SHA-256',
          salt: salt,
          iterations: 100000
        }, baseKey, 256);

        return {
          username: PRESET_ADMIN.username,
          password_hash: Array.from(new Uint8Array(key)),
          salt: Array.from(salt),
          iterations: 100000,
          role: PRESET_ADMIN.role,
          created_at: new Date().toISOString(),
          created_by: 'system',
          storage_type: 'preset'
        };
      } catch (error) {
        console.error('预设管理员密码哈希生成失败:', error);
        // 回退到简单格式
        return {
          username: PRESET_ADMIN.username,
          password_hash: PRESET_ADMIN.password,
          role: PRESET_ADMIN.role,
          created_at: new Date().toISOString(),
          created_by: 'system',
          storage_type: 'preset'
        };
      }
    }

    // 首先检查本地存储（更快）
    try {
      const localUser = localStorage.getItem(`user_${username}`);
      if (localUser) {
        const userData = JSON.parse(localUser);
        // 如果是本地存储的用户或者跳过Firebase查询，直接返回
        if (userData.storage_type === 'local' || skipFirebase || !window.firebaseAvailable) {
          return userData;
        }
      }
    } catch (error) {
      console.warn('本地存储用户查询失败:', error);
    }

    // 如果需要且可能，从Firebase获取
    if (!skipFirebase && window.firebaseAvailable && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      try {
        const snapshot = await firebase.database().ref('users/' + username).once('value');
        const firebaseUser = snapshot.val();
        if (firebaseUser) {
          return firebaseUser;
        }
      } catch (error) {
        console.warn('⚠️ Firebase用户查询失败:', error.message);
        // Firebase失败时，回退到本地存储结果
        try {
          const localUser = localStorage.getItem(`user_${username}`);
          if (localUser) {
            return JSON.parse(localUser);
          }
        } catch (localError) {
          console.warn('本地存储回退查询失败:', localError);
        }
      }
    }

    return null;
  },

  // 设置文件访问权限（仅管理员）
  async setFilePermissions(fileId, fileOwner, permissions) {
    if (!this.isAdmin()) {
      throw new Error('只有管理员可以设置文件权限');
    }

    // permissions 格式: { allowedUsers: ['user1', 'user2'], blockedUsers: ['user3'], isPublic: false }
    await firebase.database().ref(`userFiles/${fileOwner}/${fileId}/permissions`).set({
      ...permissions,
      setBy: this.currentUser.username,
      setAt: firebase.database.ServerValue.TIMESTAMP
    });

    return true;
  },

  // 检查用户是否可以访问特定文件
  async canAccessFile(fileId, fileOwner, filePermissions = null) {
    // 文件所有者总是可以访问
    if (this.currentUser && this.currentUser.username === fileOwner) {
      return true;
    }

    // 管理员可以访问所有文件
    if (this.isAdmin()) {
      return true;
    }

    // 获取文件权限设置
    let permissions = filePermissions;
    if (!permissions && typeof firebase !== 'undefined') {
      const snapshot = await firebase.database().ref(`userFiles/${fileOwner}/${fileId}/permissions`).once('value');
      permissions = snapshot.val();
    }

    if (!permissions) {
      // 没有设置权限，默认为好友可见
      permissions = { level: 'friend', isPublic: false };
    }

    // 检查是否被屏蔽（黑名单）
    if (this.currentUser && permissions.blockedUsers && permissions.blockedUsers.includes(this.currentUser.username)) {
      return false;
    }

    // 检查是否在允许列表中（白名单）
    if (this.currentUser && permissions.allowedUsers && permissions.allowedUsers.includes(this.currentUser.username)) {
      return true;
    }

    // 根据权限级别检查访问权限
    const permissionLevel = permissions.level || (permissions.isPublic ? 'public' : 'friend');

    if (permissionLevel === 'public') {
      return true; // 公开内容所有人都可以访问
    }

    if (!this.currentUser) {
      return false; // 未登录用户只能访问公开内容
    }

    // 检查用户角色是否有权限访问此级别的内容
    return this.canViewContentLevel(permissionLevel);
  },

  // 获取用户可访问的文件列表
  async getAccessibleFiles(targetUser = null) {
    const users = targetUser ? [targetUser] : await this.getAllUsers();
    const accessibleFiles = [];

    for (const user of users) {
      const username = typeof user === 'string' ? user : user.username;
      const snapshot = await firebase.database().ref(`userFiles/${username}`).once('value');
      const files = snapshot.val() || {};

      for (const [fileId, fileInfo] of Object.entries(files)) {
        if (await this.canAccessFile(fileId, username)) {
          accessibleFiles.push({
            ...fileInfo,
            fileId: fileId,
            owner: username
          });
        }
      }
    }

    return accessibleFiles;
  },

  // 初始化预设管理员账户
  async initializePresetAdmin() {
    try {
      // 检查Firebase是否可用
      if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length || !window.firebaseAvailable) {
        console.warn('📱 Firebase不可用，跳过预设管理员数据库创建（离线模式）');
        return;
      }

      const existingAdmin = await this.getUserByUsername(PRESET_ADMIN.username);
      if (!existingAdmin) {
        console.log('🔧 正在创建预设管理员账户到数据库...');

        // 创建预设管理员账户
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(PRESET_ADMIN.password), 'PBKDF2', false, ['deriveBits']);
        const key = await crypto.subtle.deriveBits({
          name: 'PBKDF2',
          hash: 'SHA-256',
          salt,
          iterations: 100000
        }, baseKey, 256);

        const adminData = {
          username: PRESET_ADMIN.username,
          password_hash: Array.from(new Uint8Array(key)),
          salt: Array.from(salt),
          iterations: 100000,
          role: PRESET_ADMIN.role,
          created_at: firebase.database.ServerValue.TIMESTAMP,
          created_by: 'system',
          file_permissions: {}
        };

        await firebase.database().ref('users/' + PRESET_ADMIN.username).set(adminData);
        console.log('✅ 预设管理员账户已创建到数据库');
      } else {
        console.log('✅ 预设管理员账户已存在于数据库');
      }
    } catch (error) {
      console.warn('⚠️ 初始化预设管理员失败:', error.message);
      console.info('📱 系统将继续在离线模式下运行');
      // 不抛出错误，允许系统继续运行
    }
  },

  async login(username, password) {
    console.log('🔐 登录尝试:', username);

    // 清理输入数据（去除前后空格）
    const cleanUsername = username ? username.trim() : '';
    const cleanPassword = password ? password.trim() : '';

    console.log('🔍 检查预设管理员:', {
      inputUsername: cleanUsername,
      inputUsernameLength: cleanUsername.length,
      presetUsername: PRESET_ADMIN.username,
      presetUsernameLength: PRESET_ADMIN.username.length,
      usernameMatch: cleanUsername === PRESET_ADMIN.username,
      passwordMatch: cleanPassword === PRESET_ADMIN.password,
      inputUsernameBytes: Array.from(new TextEncoder().encode(cleanUsername)),
      presetUsernameBytes: Array.from(new TextEncoder().encode(PRESET_ADMIN.username))
    });

    // 首先检查是否为预设管理员账户
    if (cleanUsername === PRESET_ADMIN.username && cleanPassword === PRESET_ADMIN.password) {
      console.log('✅ 预设管理员登录验证通过');

      // 尝试初始化预设管理员账户到数据库（不阻塞登录）
      try {
        if (window.firebaseAvailable) {
          await this.initializePresetAdmin();
        } else {
          console.info('📱 离线模式：跳过数据库初始化');
        }
      } catch (error) {
        console.warn('⚠️ 预设管理员数据库初始化失败，但登录继续:', error.message);
      }

      this.currentUser = {
        username: PRESET_ADMIN.username,
        role: PRESET_ADMIN.role,
        privilege: PRESET_ADMIN.role
      };

      // 保存登录状态到sessionStorage
      sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      // 记录登录信息
      if (window.loginRecordsManager) {
        window.loginRecordsManager.recordLogin(this.currentUser.username, true, {
          loginMethod: 'preset_admin'
        });
      }

      console.log('🎉 预设管理员登录成功');

      // 更新页眉组件的认证状态显示
      if (window.headerComponent && typeof window.headerComponent.updateAuthNavigation === 'function') {
        setTimeout(() => {
          window.headerComponent.updateAuthNavigation();
          console.log('✅ 页眉认证状态已更新（预设管理员）');
        }, 100);
      }

      return true;
    }

    // 如果是预设管理员用户名但密码错误
    if (cleanUsername === PRESET_ADMIN.username && cleanPassword !== PRESET_ADMIN.password) {
      console.log('❌ 预设管理员密码错误');
      throw new Error('密码错误');
    }

    // 从Firebase数据库加载用户数据（如果可用）
    let user = null;
    if (window.firebaseAvailable) {
      try {
        user = await this.getUserByUsername(cleanUsername);
      } catch (error) {
        console.warn('⚠️ Firebase用户查询失败，尝试本地存储:', error.message);
      }
    }

    // 如果Firebase中没有或不可用，尝试从本地存储加载（向后兼容）
    if (!user) {
      user = this.loadUserFromLocalStorage(cleanUsername);
    }

    if (!user) throw new Error('用户不存在');

    // 检查是否有加密的密码哈希
    if (user.salt && user.iterations && Array.isArray(user.password_hash)) {
      // 使用PBKDF2验证
      const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(cleanPassword), 'PBKDF2', false, ['deriveBits']);
      const storedKey = new Uint8Array(user.password_hash);
      const newKey = await crypto.subtle.deriveBits({
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: new Uint8Array(user.salt),
        iterations: user.iterations
      }, baseKey, 256);

      if (Array.from(new Uint8Array(newKey)).toString() !== storedKey.toString()) {
        throw new Error('密码错误');
      }
    } else {
      // 简单密码验证（用于向后兼容）
      if (user.password_hash !== cleanPassword) {
        throw new Error('密码错误');
      }
    }

    this.currentUser = {
      username: user.username,
      role: user.role || 'user',
      privilege: user.privilege || user.role || 'user'
    };

    // 保存登录状态到sessionStorage
    sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));

    // 记录登录信息
    if (window.loginRecordsManager) {
      window.loginRecordsManager.recordLogin(this.currentUser.username, true, {
        loginMethod: 'password'
      });
    }

    console.log('🎉 用户登录成功:', this.currentUser.username);

    // 更新页眉组件的认证状态显示
    if (window.headerComponent && typeof window.headerComponent.updateAuthNavigation === 'function') {
      setTimeout(() => {
        window.headerComponent.updateAuthNavigation();
        console.log('✅ 页眉认证状态已更新');
      }, 100);
    }

    return true;
  },

  // 从本地存储加载用户（向后兼容）
  loadUserFromLocalStorage(username) {
    try {
      const userData = localStorage.getItem(`user_${username}`);
      if (userData) {
        return JSON.parse(userData);
      }

      // 尝试旧格式
      const oldData = localStorage.getItem(username);
      if (oldData) {
        return {
          username: username,
          password_hash: atob(oldData), // Base64解码
          role: 'user',
          created_at: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('本地存储用户加载失败:', error);
    }
    return null;
  },

  // 登出功能
  logout() {
    console.log('🔓 auth.logout() 开始执行...');
    this.currentUser = null;
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    console.log('✅ 用户状态已清除');

    // 更新页眉组件的认证状态显示
    if (window.headerComponent && typeof window.headerComponent.updateAuthNavigation === 'function') {
      setTimeout(() => {
        window.headerComponent.updateAuthNavigation();
        console.log('✅ 页眉认证状态已更新（退出登录）');

        // 通知页面更新认证状态（这是关键的修复）
        if (typeof window.headerComponent.notifyPageAuthUpdate === 'function') {
          window.headerComponent.notifyPageAuthUpdate();
          console.log('✅ 页面认证状态更新通知已发送');
        } else {
          console.warn('⚠️ notifyPageAuthUpdate方法不存在');
        }
      }, 100);
    } else {
      console.warn('⚠️ 页眉组件或updateAuthNavigation方法不存在');
    }
  },

  // 检查登录状态
  checkAuthStatus() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        return true;
      } catch (e) {
        sessionStorage.removeItem('currentUser');
      }
    }
    return false;
  },

  // 验证密码强度
  validatePassword(password) {
    const errors = [];

    // 简化的密码验证：只需要超过6个字符
    if (password.length < PASSWORD_CONFIG.minLength) {
      errors.push(`密码至少需要${PASSWORD_CONFIG.minLength}位字符`);
    }

    // 可选：检查密码不能为空或只包含空格
    if (!password || password.trim().length === 0) {
      errors.push('密码不能为空');
    }

    // 可选：检查密码不能过长（防止恶意输入）
    if (password.length > 128) {
      errors.push('密码不能超过128位字符');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  // 验证密码（独立的密码验证方法）
  async verifyPassword(password, storedPasswordHash, salt, iterations = 100000) {
    if (!password || !storedPasswordHash) {
      throw new Error('密码或密码哈希不能为空');
    }

    try {
      // 检查是否有加密的密码哈希
      if (salt && iterations && Array.isArray(storedPasswordHash)) {
        // 使用PBKDF2验证
        const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
        const storedKey = new Uint8Array(storedPasswordHash);
        const newKey = await crypto.subtle.deriveBits({
          name: 'PBKDF2',
          hash: 'SHA-256',
          salt: new Uint8Array(salt),
          iterations: iterations
        }, baseKey, 256);

        const isValid = Array.from(new Uint8Array(newKey)).toString() === storedKey.toString();
        console.log(`🔐 PBKDF2密码验证结果: ${isValid}`);
        return isValid;
      } else {
        // 简单密码验证（用于向后兼容）
        const isValid = storedPasswordHash === password;
        console.log(`🔐 简单密码验证结果: ${isValid}`);
        return isValid;
      }
    } catch (error) {
      console.error('❌ 密码验证过程中发生错误:', error);
      throw new Error(`密码验证失败: ${error.message}`);
    }
  },

  // 验证管理员密码（用于敏感操作的二次验证）
  async verifyAdminPassword(password) {
    console.log('🔐 开始管理员密码验证...');

    if (!this.currentUser || !this.isAdmin()) {
      const error = new Error('当前用户不是管理员');
      console.error('❌ 权限检查失败:', error.message);
      throw error;
    }

    if (!password || password.trim() === '') {
      const error = new Error('请输入管理员密码');
      console.error('❌ 密码输入检查失败:', error.message);
      throw error;
    }

    try {
      console.log(`🔍 获取管理员用户数据: ${this.currentUser.username}`);

      // 获取当前管理员的用户数据
      const adminData = await this.getUserByUsername(this.currentUser.username);

      if (!adminData) {
        const error = new Error('无法获取管理员账户信息');
        console.error('❌ 管理员数据获取失败:', error.message);
        throw error;
      }

      console.log('📋 管理员数据获取成功:', {
        username: adminData.username,
        role: adminData.role,
        storage_type: adminData.storage_type,
        hasPasswordHash: !!adminData.password_hash,
        hasSalt: !!adminData.salt,
        iterations: adminData.iterations
      });

      // 检查verifyPassword方法是否存在
      if (typeof this.verifyPassword !== 'function') {
        const error = new Error('verifyPassword方法不存在');
        console.error('❌ 方法检查失败:', error.message);
        throw error;
      }

      // 验证密码
      console.log('🔐 开始密码验证...');
      const isValid = await this.verifyPassword(password, adminData.password_hash, adminData.salt, adminData.iterations);

      if (!isValid) {
        const error = new Error('管理员密码错误');
        console.error('❌ 密码验证失败:', error.message);
        throw error;
      }

      console.log('✅ 管理员密码验证成功');
      return true;
    } catch (error) {
      console.error('❌ 管理员密码验证过程中发生错误:', {
        message: error.message,
        stack: error.stack,
        currentUser: this.currentUser?.username,
        isAdmin: this.isAdmin(),
        firebaseAvailable: window.firebaseAvailable
      });
      throw error;
    }
  },

  // 记录管理员操作日志
  async logAdminAction(action, targetUser, details = {}) {
    if (!this.currentUser || !this.isAdmin()) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      adminUser: this.currentUser.username,
      action: action,
      targetUser: targetUser,
      details: details,
      userAgent: navigator.userAgent,
      ip: 'unknown' // 在客户端无法获取真实IP
    };

    try {
      // 尝试保存到Firebase
      if (window.firebaseAvailable && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
        const logRef = firebase.database().ref('adminLogs').push();
        await logRef.set(logEntry);
        console.log('✅ 管理员操作日志已保存到Firebase');
      } else {
        // 保存到本地存储
        const localLogs = this.getLocalAdminLogs();
        localLogs.push(logEntry);

        // 只保留最近100条日志
        if (localLogs.length > 100) {
          localLogs.splice(0, localLogs.length - 100);
        }

        localStorage.setItem('admin_logs', JSON.stringify(localLogs));
        console.log('📱 管理员操作日志已保存到本地存储');
      }
    } catch (error) {
      console.warn('⚠️ 保存管理员操作日志失败:', error);
    }
  },

  // 获取本地管理员操作日志
  getLocalAdminLogs() {
    try {
      const logs = localStorage.getItem('admin_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.warn('获取本地管理员日志失败:', error);
      return [];
    }
  },

  async changePassword(oldPass, newPass) {
    if (!this.currentUser) throw new Error('请先登录');

    // 验证新密码强度
    const validation = this.validatePassword(newPass);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // 验证旧密码
    await this.login(this.currentUser.username, oldPass);

    // 生成新密码
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(newPass), 'PBKDF2', false, ['deriveBits']);
    const newKey = await crypto.subtle.deriveBits({
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: 100000
    }, baseKey, 256);

    // 更新数据库
    await firebase.database().ref('users/' + this.currentUser.username).update({
      password_hash: Array.from(new Uint8Array(newKey)),
      salt: Array.from(salt),
      last_modified: firebase.database.ServerValue.TIMESTAMP
    });
  },

  // 评论权限检查方法
  canComment() {
    if (!this.currentUser) return false; // 未登录用户无法评论
    const role = USER_ROLES[this.currentUser.role] || USER_ROLES.visitor;
    return role.canComment;
  },

  canEditComment(commentAuthor) {
    if (!this.currentUser) return false;
    const role = USER_ROLES[this.currentUser.role] || USER_ROLES.visitor;

    // 管理员可以编辑任何评论
    if (this.isAdmin()) return true;

    // 用户只能编辑自己的评论
    return role.canEditOwnComment && this.currentUser.username === commentAuthor;
  },

  canDeleteComment(commentAuthor) {
    if (!this.currentUser) return false;
    const role = USER_ROLES[this.currentUser.role] || USER_ROLES.visitor;

    // 管理员可以删除任何评论
    if (role.canDeleteAnyComment) return true;

    // 用户只能删除自己的评论
    return role.canDeleteOwnComment && this.currentUser.username === commentAuthor;
  },

  // 更新用户索引（用于 GitHub 环境下的用户管理）
  async updateUserIndex(username, action) {
    if (!window.dataManager || !window.dataManager.shouldUseGitHubStorage()) {
      return; // 只在 GitHub 环境下维护索引
    }

    try {
      const userIndexKey = 'users_index';
      let userIndex;

      try {
        userIndex = await window.dataManager.loadData(userIndexKey, {
          category: 'system',
          fallbackToLocal: true
        });
      } catch (error) {
        // 如果索引文件不存在，创建新的索引（这是正常情况）
        if (error.message.includes('文件不存在') || error.message.includes('404') || error.status === 404) {
          // 静默处理，不输出日志（首次使用时这是正常情况）
          userIndex = null;
        } else {
          // 只有非预期错误才输出日志
          console.warn('⚠️ 获取用户索引时发生非预期错误:', error.message);
          userIndex = null; // 继续执行，创建新索引
        }
      }

      if (!userIndex) {
        // 从本地存储构建初始索引
        const localUsers = this.getLocalUsersList();
        userIndex = {
          users: [...localUsers],
          lastUpdated: new Date().toISOString(),
          createdFrom: 'local_storage'
        };
        console.log(`📋 从本地存储构建用户索引，包含 ${localUsers.length} 个用户`);
      }

      let indexChanged = false;

      if (action === 'add') {
        if (!userIndex.users.includes(username)) {
          userIndex.users.push(username);
          userIndex.lastUpdated = new Date().toISOString();
          indexChanged = true;
          console.log(`✅ 用户 ${username} 已添加到索引`);
        }
      } else if (action === 'remove') {
        const index = userIndex.users.indexOf(username);
        if (index > -1) {
          userIndex.users.splice(index, 1);
          userIndex.lastUpdated = new Date().toISOString();
          indexChanged = true;
          console.log(`✅ 用户 ${username} 已从索引中移除`);
        }
      }

      // 只有在索引发生变化时才保存
      if (indexChanged || !userIndex.createdFrom) {
        await window.dataManager.saveData(userIndexKey, userIndex, {
          category: 'system',
          commitMessage: `更新用户索引: ${action} ${username}`
        });
        console.log(`💾 用户索引已保存到 GitHub`);
      }

    } catch (error) {
      console.error('更新用户索引失败:', error);
      // 不抛出错误，避免影响主要功能
      console.warn('⚠️ 用户索引更新失败，但不影响主要功能');
    }
  }
};

// 创建本地用户函数
function createLocalUser(username, password, role = 'user') {
  if (typeof localStorage === 'undefined') {
    throw new Error('此浏览器不支持本地存储');
  }
  if (!/^[a-zA-Z0-9_]{4,16}$/.test(username)) {
    throw new Error('用户名需4-16位字母数字');
  }

  const validation = auth.validatePassword(password);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  // 简单的本地存储（仅用于演示）
  const userData = {
    username: username,
    password_hash: btoa(password), // 注意：这不安全，仅用于演示
    role: role,
    created_at: new Date().toISOString()
  };

  localStorage.setItem(`user_${username}`, JSON.stringify(userData));
  return userData;
}

// 暴露全局方法
window.auth = auth;

window.createLocalUser = () => {
  const username = document.getElementById('newUsername').value;
  const password = document.getElementById('newPassword').value;
  const role = document.getElementById('userRole').value;

  try {
    createLocalUser(username, password, role);
    alert('用户创建成功');
    // 清空表单
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
  } catch (e) {
    alert(`错误: ${e.message}`);
  }
};

window.changePassword = async () => {
  const oldPass = document.getElementById('oldPassword').value;
  const newPass = document.getElementById('newPassword').value;

  try {
    await auth.changePassword(oldPass, newPass);
    alert('密码更新成功');
    // 清空表单
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
  } catch (e) {
    alert(`错误: ${e.message}`);
  }
};

window.login = async (username, password) => {
  try {
    await auth.login(username, password);
    return true;
  } catch (e) {
    alert(`登录失败: ${e.message}`);
    return false;
  }
};

window.logout = () => {
  auth.logout();

  // 显示成功消息
  if (typeof showSuccessMessage === 'function') {
    showSuccessMessage('已退出登录');
  } else {
    alert('已退出登录');
  }

  // 不刷新页面，让页眉组件处理状态更新
  console.log('✅ 退出登录完成，页眉状态将自动更新');
};

// 页面加载时检查登录状态和初始化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔧 Auth模块初始化开始...');

  // 等待Firebase初始化（如果可用）
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && window.firebaseAvailable) {
    console.log('🔧 Firebase可用，初始化预设管理员...');
    try {
      await auth.initializePresetAdmin();
    } catch (error) {
      console.warn('⚠️ 预设管理员初始化失败:', error.message);
    }
  } else {
    console.log('📱 Firebase不可用，跳过数据库初始化');
  }

  // 检查登录状态
  console.log('🔧 检查登录状态...');
  auth.checkAuthStatus();
  console.log('✅ Auth模块初始化完成');
});