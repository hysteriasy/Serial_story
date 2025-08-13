// 增强的文件权限管理器
class EnhancedPermissionsManager {
  constructor() {
    this.currentFileId = null;
    this.currentOwner = null;
    this.currentPermissions = null;
    this.availableUsers = [];
  }

  // 显示增强的权限设置模态框
  async showEnhancedPermissionsModal(fileId, owner) {
    try {
      this.currentFileId = fileId;
      this.currentOwner = owner;
      
      // 检查权限
      if (!this.canModifyPermissions(owner)) {
        this.showNotification('您没有权限修改此文件的权限设置', 'error');
        return;
      }

      // 获取当前权限设置
      this.currentPermissions = await this.getFilePermissions(fileId, owner);
      
      // 获取可用用户列表
      this.availableUsers = await this.getAllUsers();
      
      // 创建并显示模态框
      this.createEnhancedPermissionsModal();
      
    } catch (error) {
      console.error('显示增强权限设置模态框失败:', error);
      this.showNotification('加载权限设置失败', 'error');
    }
  }

  // 创建增强权限设置模态框
  createEnhancedPermissionsModal() {
    // 移除现有模态框
    const existingModal = document.getElementById('enhancedPermissionsModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'enhancedPermissionsModal';
    modal.className = 'modal enhanced-permissions-modal';
    modal.style.display = 'flex';
    modal.innerHTML = this.getEnhancedPermissionsModalHTML();

    document.body.appendChild(modal);
    this.bindEnhancedPermissionsEvents();
    this.initializePermissionsForm();
  }

  // 获取增强权限模态框HTML
  getEnhancedPermissionsModalHTML() {
    return `
      <div class="modal-content enhanced-permissions-content">
        <div class="modal-header">
          <h3>🔐 文件权限设置</h3>
          <span class="close-btn" onclick="enhancedPermissionsManager.closeModal()">&times;</span>
        </div>
        
        <div class="modal-body">
          <!-- 文件信息 -->
          <div class="permissions-section">
            <h4>📄 文件信息</h4>
            <div class="file-info-grid">
              <div class="info-item">
                <label>文件ID:</label>
                <span>${this.currentFileId}</span>
              </div>
              <div class="info-item">
                <label>所有者:</label>
                <span>${this.currentOwner}</span>
              </div>
            </div>
          </div>

          <!-- 基础权限设置 -->
          <div class="permissions-section">
            <h4>🔧 基础权限设置</h4>
            <div class="permission-level-options">
              <label class="permission-option">
                <input type="radio" name="permissionLevel" value="public">
                <div class="option-content">
                  <div class="option-title">🌍 公开</div>
                  <div class="option-description">所有人都可以查看此文件</div>
                </div>
              </label>
              
              <label class="permission-option">
                <input type="radio" name="permissionLevel" value="visitor">
                <div class="option-content">
                  <div class="option-title">👥 访客可见</div>
                  <div class="option-description">已注册的访客用户可以查看</div>
                </div>
              </label>
              
              <label class="permission-option">
                <input type="radio" name="permissionLevel" value="friend">
                <div class="option-content">
                  <div class="option-title">👫 好友可见</div>
                  <div class="option-description">好友级别及以上用户可以查看</div>
                </div>
              </label>
              
              <label class="permission-option">
                <input type="radio" name="permissionLevel" value="custom">
                <div class="option-content">
                  <div class="option-title">⚙️ 自定义</div>
                  <div class="option-description">使用白名单和黑名单进行精确控制</div>
                </div>
              </label>
            </div>
          </div>

          <!-- 自定义权限设置 -->
          <div id="customPermissionsSection" class="permissions-section" style="display: none;">
            <h4>⚙️ 自定义权限设置</h4>
            
            <!-- 白名单设置 -->
            <div class="custom-permission-group">
              <div class="group-header">
                <label>
                  <input type="checkbox" id="whitelistEnabled">
                  ✅ 启用白名单
                </label>
                <span class="group-description">只有白名单中的用户可以访问</span>
              </div>
              <div id="whitelistContent" class="permission-list-content" style="display: none;">
                <div class="user-selection">
                  <select id="whitelistUserSelect" class="form-control">
                    <option value="">选择用户...</option>
                  </select>
                  <button type="button" class="btn btn-sm btn-primary" onclick="enhancedPermissionsManager.addToWhitelist()">
                    ➕ 添加
                  </button>
                </div>
                <div id="whitelistUsers" class="selected-users">
                  <!-- 白名单用户将在这里显示 -->
                </div>
              </div>
            </div>

            <!-- 黑名单设置 -->
            <div class="custom-permission-group">
              <div class="group-header">
                <label>
                  <input type="checkbox" id="blacklistEnabled">
                  ❌ 启用黑名单
                </label>
                <span class="group-description">黑名单中的用户无法访问（优先级高于白名单）</span>
              </div>
              <div id="blacklistContent" class="permission-list-content" style="display: none;">
                <div class="user-selection">
                  <select id="blacklistUserSelect" class="form-control">
                    <option value="">选择用户...</option>
                  </select>
                  <button type="button" class="btn btn-sm btn-danger" onclick="enhancedPermissionsManager.addToBlacklist()">
                    ➕ 添加
                  </button>
                </div>
                <div id="blacklistUsers" class="selected-users">
                  <!-- 黑名单用户将在这里显示 -->
                </div>
              </div>
            </div>

            <!-- 特殊权限设置 -->
            <div class="custom-permission-group">
              <div class="group-header">
                <h5>🔧 特殊权限</h5>
              </div>
              <div class="special-permissions">
                <label>
                  <input type="checkbox" id="allowAnonymous">
                  允许匿名访问
                </label>
                <label>
                  <input type="checkbox" id="requirePassword">
                  需要密码访问
                </label>
                <div id="passwordSection" style="display: none;">
                  <input type="text" id="accessPassword" class="form-control" placeholder="设置访问密码...">
                </div>
              </div>
            </div>
          </div>

          <!-- 权限预览 -->
          <div class="permissions-section">
            <h4>👁️ 权限预览</h4>
            <div id="permissionPreview" class="permission-preview">
              <!-- 权限预览将在这里显示 -->
            </div>
          </div>

          <!-- 操作记录 -->
          <div class="permissions-section">
            <h4>📝 操作原因</h4>
            <textarea id="permissionChangeReason" class="form-control" rows="2" 
                      placeholder="请输入修改权限的原因（可选）..."></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="enhancedPermissionsManager.closeModal()">取消</button>
          <button type="button" class="btn btn-primary" onclick="enhancedPermissionsManager.savePermissions()">保存权限</button>
        </div>
      </div>
    `;
  }

  // 绑定增强权限事件
  bindEnhancedPermissionsEvents() {
    // 权限级别切换
    document.querySelectorAll('input[name="permissionLevel"]').forEach(radio => {
      radio.addEventListener('change', () => {
        this.handlePermissionLevelChange();
      });
    });

    // 白名单/黑名单开关
    document.getElementById('whitelistEnabled').addEventListener('change', (e) => {
      document.getElementById('whitelistContent').style.display = e.target.checked ? 'block' : 'none';
      this.updatePermissionPreview();
    });

    document.getElementById('blacklistEnabled').addEventListener('change', (e) => {
      document.getElementById('blacklistContent').style.display = e.target.checked ? 'block' : 'none';
      this.updatePermissionPreview();
    });

    // 特殊权限
    document.getElementById('allowAnonymous').addEventListener('change', () => {
      this.updatePermissionPreview();
    });

    document.getElementById('requirePassword').addEventListener('change', (e) => {
      document.getElementById('passwordSection').style.display = e.target.checked ? 'block' : 'none';
      this.updatePermissionPreview();
    });

    // 密码输入
    document.getElementById('accessPassword').addEventListener('input', () => {
      this.updatePermissionPreview();
    });
  }

  // 初始化权限表单
  initializePermissionsForm() {
    // 填充用户选择列表
    this.populateUserSelects();
    
    // 设置当前权限值
    if (this.currentPermissions) {
      this.setFormValues(this.currentPermissions);
    } else {
      // 默认设置为私有
      document.querySelector('input[name="permissionLevel"][value="friend"]').checked = true;
    }
    
    // 触发初始更新
    this.handlePermissionLevelChange();
  }

  // 填充用户选择列表
  populateUserSelects() {
    const whitelistSelect = document.getElementById('whitelistUserSelect');
    const blacklistSelect = document.getElementById('blacklistUserSelect');
    
    // 清空现有选项
    whitelistSelect.innerHTML = '<option value="">选择用户...</option>';
    blacklistSelect.innerHTML = '<option value="">选择用户...</option>';
    
    // 添加用户选项
    this.availableUsers.forEach(user => {
      const username = typeof user === 'string' ? user : user.username;
      if (username && username !== this.currentOwner) {
        const option1 = document.createElement('option');
        option1.value = username;
        option1.textContent = username;
        whitelistSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = username;
        option2.textContent = username;
        blacklistSelect.appendChild(option2);
      }
    });
  }

  // 设置表单值
  setFormValues(permissions) {
    // 设置权限级别
    const levelRadio = document.querySelector(`input[name="permissionLevel"][value="${permissions.level}"]`);
    if (levelRadio) {
      levelRadio.checked = true;
    }

    // 设置自定义权限
    if (permissions.level === 'custom' && permissions.customAccess) {
      const customAccess = permissions.customAccess;
      
      // 白名单
      if (customAccess.whitelist && customAccess.whitelist.length > 0) {
        document.getElementById('whitelistEnabled').checked = true;
        document.getElementById('whitelistContent').style.display = 'block';
        this.displaySelectedUsers('whitelist', customAccess.whitelist);
      }
      
      // 黑名单
      if (customAccess.blacklist && customAccess.blacklist.length > 0) {
        document.getElementById('blacklistEnabled').checked = true;
        document.getElementById('blacklistContent').style.display = 'block';
        this.displaySelectedUsers('blacklist', customAccess.blacklist);
      }
      
      // 特殊权限
      if (customAccess.specialPermissions) {
        const special = customAccess.specialPermissions;
        
        if (special.allowAnonymous) {
          document.getElementById('allowAnonymous').checked = true;
        }
        
        if (special.requirePassword) {
          document.getElementById('requirePassword').checked = true;
          document.getElementById('passwordSection').style.display = 'block';
          if (special.password) {
            document.getElementById('accessPassword').value = special.password;
          }
        }
      }
    }
  }

  // 处理权限级别变更
  handlePermissionLevelChange() {
    const selectedLevel = document.querySelector('input[name="permissionLevel"]:checked');
    const customSection = document.getElementById('customPermissionsSection');
    
    if (selectedLevel && selectedLevel.value === 'custom') {
      customSection.style.display = 'block';
    } else {
      customSection.style.display = 'none';
    }
    
    this.updatePermissionPreview();
  }

  // 更新权限预览
  updatePermissionPreview() {
    const preview = document.getElementById('permissionPreview');
    const selectedLevel = document.querySelector('input[name="permissionLevel"]:checked');
    
    if (!selectedLevel) {
      preview.innerHTML = '<div class="preview-item">请选择权限级别</div>';
      return;
    }
    
    let previewHTML = '';
    
    switch (selectedLevel.value) {
      case 'public':
        previewHTML = '<div class="preview-item success">🌍 所有人都可以访问此文件</div>';
        break;
      case 'visitor':
        previewHTML = '<div class="preview-item info">👥 已注册的访客用户可以访问</div>';
        break;
      case 'friend':
        previewHTML = '<div class="preview-item warning">👫 好友级别及以上用户可以访问</div>';
        break;
      case 'custom':
        previewHTML = this.generateCustomPreview();
        break;
    }
    
    preview.innerHTML = previewHTML;
  }

  // 生成自定义权限预览
  generateCustomPreview() {
    let preview = [];
    
    const whitelistEnabled = document.getElementById('whitelistEnabled').checked;
    const blacklistEnabled = document.getElementById('blacklistEnabled').checked;
    const allowAnonymous = document.getElementById('allowAnonymous').checked;
    const requirePassword = document.getElementById('requirePassword').checked;
    
    if (whitelistEnabled) {
      const whitelistUsers = this.getSelectedUsers('whitelist');
      if (whitelistUsers.length > 0) {
        preview.push(`<div class="preview-item success">✅ 白名单用户可访问: ${whitelistUsers.join(', ')}</div>`);
      } else {
        preview.push(`<div class="preview-item warning">⚠️ 白名单已启用但为空，无人可访问</div>`);
      }
    }
    
    if (blacklistEnabled) {
      const blacklistUsers = this.getSelectedUsers('blacklist');
      if (blacklistUsers.length > 0) {
        preview.push(`<div class="preview-item danger">❌ 黑名单用户禁止访问: ${blacklistUsers.join(', ')}</div>`);
      }
    }
    
    if (allowAnonymous) {
      preview.push(`<div class="preview-item info">🔓 允许匿名用户访问</div>`);
    }
    
    if (requirePassword) {
      const password = document.getElementById('accessPassword').value;
      if (password) {
        preview.push(`<div class="preview-item warning">🔐 需要密码访问: ${password}</div>`);
      } else {
        preview.push(`<div class="preview-item danger">⚠️ 已启用密码保护但未设置密码</div>`);
      }
    }
    
    if (preview.length === 0) {
      preview.push(`<div class="preview-item warning">⚠️ 自定义权限未配置，默认拒绝访问</div>`);
    }
    
    return preview.join('');
  }
}

  // 添加到白名单
  addToWhitelist() {
    const select = document.getElementById('whitelistUserSelect');
    const username = select.value;

    if (!username) {
      this.showNotification('请选择要添加的用户', 'warning');
      return;
    }

    // 检查是否已存在
    const existingUsers = this.getSelectedUsers('whitelist');
    if (existingUsers.includes(username)) {
      this.showNotification('用户已在白名单中', 'warning');
      return;
    }

    // 添加用户
    this.addUserToList('whitelist', username);

    // 重置选择
    select.value = '';

    // 更新预览
    this.updatePermissionPreview();
  }

  // 添加到黑名单
  addToBlacklist() {
    const select = document.getElementById('blacklistUserSelect');
    const username = select.value;

    if (!username) {
      this.showNotification('请选择要添加的用户', 'warning');
      return;
    }

    // 检查是否已存在
    const existingUsers = this.getSelectedUsers('blacklist');
    if (existingUsers.includes(username)) {
      this.showNotification('用户已在黑名单中', 'warning');
      return;
    }

    // 添加用户
    this.addUserToList('blacklist', username);

    // 重置选择
    select.value = '';

    // 更新预览
    this.updatePermissionPreview();
  }

  // 添加用户到列表
  addUserToList(listType, username) {
    const container = document.getElementById(`${listType}Users`);
    const userElement = document.createElement('div');
    userElement.className = 'selected-user';
    userElement.innerHTML = `
      <span class="user-name">${username}</span>
      <button type="button" class="btn btn-sm btn-outline-danger"
              onclick="enhancedPermissionsManager.removeUserFromList('${listType}', '${username}')">
        ✕
      </button>
    `;
    container.appendChild(userElement);
  }

  // 从列表中移除用户
  removeUserFromList(listType, username) {
    const container = document.getElementById(`${listType}Users`);
    const userElements = container.querySelectorAll('.selected-user');

    userElements.forEach(element => {
      const nameSpan = element.querySelector('.user-name');
      if (nameSpan && nameSpan.textContent === username) {
        element.remove();
      }
    });

    this.updatePermissionPreview();
  }

  // 显示选中的用户
  displaySelectedUsers(listType, users) {
    const container = document.getElementById(`${listType}Users`);
    container.innerHTML = '';

    users.forEach(username => {
      this.addUserToList(listType, username);
    });
  }

  // 获取选中的用户
  getSelectedUsers(listType) {
    const container = document.getElementById(`${listType}Users`);
    const userElements = container.querySelectorAll('.user-name');
    return Array.from(userElements).map(el => el.textContent);
  }

  // 保存权限设置
  async savePermissions() {
    try {
      const selectedLevel = document.querySelector('input[name="permissionLevel"]:checked');
      if (!selectedLevel) {
        this.showNotification('请选择权限级别', 'warning');
        return;
      }

      const level = selectedLevel.value;
      const reason = document.getElementById('permissionChangeReason').value.trim();

      // 构建权限对象
      const permissions = this.buildPermissionsObject(level);

      // 保存权限
      await this.saveFilePermissions(this.currentFileId, this.currentOwner, permissions, reason);

      // 关闭模态框
      this.closeModal();

      // 显示成功消息
      this.showNotification('权限设置保存成功', 'success');

      // 刷新文件列表（如果存在）
      if (window.adminFileManager) {
        await window.adminFileManager.loadFileList();
      }

    } catch (error) {
      console.error('保存权限设置失败:', error);
      this.showNotification('保存权限设置失败: ' + error.message, 'error');
    }
  }

  // 构建权限对象
  buildPermissionsObject(level) {
    const permissions = {
      level: level,
      isPublic: level === 'public',
      requiredRole: this.getRequiredRole(level),
      minRoleLevel: this.getMinRoleLevel(level),
      lastModified: new Date().toISOString(),
      modifiedBy: auth.currentUser ? auth.currentUser.username : 'unknown'
    };

    if (level === 'custom') {
      permissions.customAccess = this.buildCustomAccess();
    }

    return permissions;
  }

  // 构建自定义访问设置
  buildCustomAccess() {
    const customAccess = {};

    // 白名单
    if (document.getElementById('whitelistEnabled').checked) {
      customAccess.whitelist = this.getSelectedUsers('whitelist');
    }

    // 黑名单
    if (document.getElementById('blacklistEnabled').checked) {
      customAccess.blacklist = this.getSelectedUsers('blacklist');
    }

    // 特殊权限
    const specialPermissions = {};

    if (document.getElementById('allowAnonymous').checked) {
      specialPermissions.allowAnonymous = true;
    }

    if (document.getElementById('requirePassword').checked) {
      specialPermissions.requirePassword = true;
      const password = document.getElementById('accessPassword').value.trim();
      if (password) {
        specialPermissions.password = password;
      }
    }

    if (Object.keys(specialPermissions).length > 0) {
      customAccess.specialPermissions = specialPermissions;
    }

    return customAccess;
  }

  // 获取所需角色
  getRequiredRole(level) {
    const roleMap = {
      public: 'guest',
      visitor: 'visitor',
      friend: 'friend',
      custom: 'custom'
    };
    return roleMap[level] || 'friend';
  }

  // 获取最小角色级别
  getMinRoleLevel(level) {
    const levelMap = {
      public: 1,
      visitor: 2,
      friend: 3,
      custom: 0
    };
    return levelMap[level] || 3;
  }

  // 工具方法
  async getFilePermissions(fileId, owner) {
    if (window.filePermissionsSystem) {
      return await window.filePermissionsSystem.getFilePermissions(fileId, owner);
    }
    return null;
  }

  async getAllUsers() {
    if (auth && auth.getAllUsers) {
      return await auth.getAllUsers();
    }
    return [];
  }

  canModifyPermissions(owner) {
    if (!auth.currentUser) return false;

    // 管理员可以修改所有文件权限
    if (auth.isAdmin && auth.isAdmin()) return true;

    // 用户只能修改自己的文件权限
    return auth.currentUser.username === owner;
  }

  async saveFilePermissions(fileId, owner, permissions, reason) {
    if (window.filePermissionsSystem) {
      return await window.filePermissionsSystem.updatePermissions(fileId, owner, permissions, reason);
    }
    throw new Error('权限系统未初始化');
  }

  closeModal() {
    const modal = document.getElementById('enhancedPermissionsModal');
    if (modal) {
      modal.remove();
    }
  }

  showNotification(message, type = 'info') {
    if (typeof showNotification === 'function') {
      showNotification(message, type);
    } else {
      alert(message);
    }
  }
}

// 创建全局实例
window.enhancedPermissionsManager = new EnhancedPermissionsManager();
