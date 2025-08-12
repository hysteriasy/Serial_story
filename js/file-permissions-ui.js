// 文件权限设置界面
class FilePermissionsUI {
  constructor() {
    this.currentFileId = null;
    this.currentOwner = null;
    this.currentPermissions = null;
    this.availableUsers = [];
  }

  // 显示权限设置模态框
  async showPermissionsModal(fileId, owner) {
    try {
      this.currentFileId = fileId;
      this.currentOwner = owner;
      
      // 检查权限
      if (!window.filePermissionsSystem.canModifyPermissions(owner)) {
        this.showNotification('您没有权限修改此文件的权限设置', 'error');
        return;
      }

      // 获取当前权限设置
      this.currentPermissions = await window.filePermissionsSystem.getFilePermissions(fileId, owner);
      
      // 获取可用用户列表
      this.availableUsers = await auth.getAllUsers();
      
      // 创建并显示模态框
      this.createPermissionsModal();
      
    } catch (error) {
      console.error('显示权限设置模态框失败:', error);
      this.showNotification('加载权限设置失败', 'error');
    }
  }

  // 创建权限设置模态框
  createPermissionsModal() {
    // 移除现有模态框
    const existingModal = document.getElementById('filePermissionsModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'filePermissionsModal';
    modal.className = 'modal permissions-modal';
    modal.style.display = 'flex';
    modal.innerHTML = this.getModalHTML();

    document.body.appendChild(modal);
    
    // 绑定事件
    this.bindModalEvents();
    
    // 初始化界面状态
    this.initializeModalState();
  }

  // 获取模态框HTML
  getModalHTML() {
    const currentLevel = this.currentPermissions?.level || 'public';
    
    return `
      <div class="modal-content permissions-modal-content">
        <div class="modal-header">
          <h3>🔐 文件权限设置</h3>
          <span class="close-btn" onclick="filePermissionsUI.closeModal()">&times;</span>
        </div>
        
        <div class="modal-body">
          <!-- 文件信息 -->
          <div class="file-info-section">
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
              <div class="info-item">
                <label>当前权限:</label>
                <span class="permission-badge permission-${currentLevel}">
                  ${this.getPermissionIcon(currentLevel)} ${this.getPermissionText(currentLevel)}
                </span>
              </div>
            </div>
          </div>

          <!-- 权限级别选择 -->
          <div class="permission-levels-section">
            <h4>🎯 权限级别</h4>
            <div class="permission-options">
              <div class="permission-option">
                <input type="radio" id="level-public" name="permissionLevel" value="public" ${currentLevel === 'public' ? 'checked' : ''}>
                <label for="level-public" class="permission-label">
                  <div class="permission-icon">🌍</div>
                  <div class="permission-details">
                    <h5>公开</h5>
                    <p>所有人都可以查看，包括未登录用户</p>
                  </div>
                </label>
              </div>
              
              <div class="permission-option">
                <input type="radio" id="level-visitor" name="permissionLevel" value="visitor" ${currentLevel === 'visitor' ? 'checked' : ''}>
                <label for="level-visitor" class="permission-label">
                  <div class="permission-icon">👤</div>
                  <div class="permission-details">
                    <h5>访客</h5>
                    <p>仅限已登录的访客级别及以上用户查看</p>
                  </div>
                </label>
              </div>
              
              <div class="permission-option">
                <input type="radio" id="level-friend" name="permissionLevel" value="friend" ${currentLevel === 'friend' ? 'checked' : ''}>
                <label for="level-friend" class="permission-label">
                  <div class="permission-icon">👥</div>
                  <div class="permission-details">
                    <h5>好友</h5>
                    <p>仅限好友级别及以上用户查看和评论</p>
                  </div>
                </label>
              </div>
              
              <div class="permission-option">
                <input type="radio" id="level-custom" name="permissionLevel" value="custom" ${currentLevel === 'custom' ? 'checked' : ''}>
                <label for="level-custom" class="permission-label">
                  <div class="permission-icon">⚙️</div>
                  <div class="permission-details">
                    <h5>自定义</h5>
                    <p>使用白名单和黑名单机制精确控制访问权限</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- 自定义权限设置 -->
          <div id="customPermissionsSection" class="custom-permissions-section" style="display: ${currentLevel === 'custom' ? 'block' : 'none'}">
            <h4>⚙️ 自定义权限设置</h4>
            
            <!-- 白名单设置 -->
            <div class="permission-list-section">
              <div class="list-header">
                <h5>✅ 白名单（允许访问）</h5>
                <label class="toggle-switch">
                  <input type="checkbox" id="whitelistEnabled" ${this.currentPermissions?.customAccess?.whitelist?.enabled ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div id="whitelistContent" class="list-content" style="display: ${this.currentPermissions?.customAccess?.whitelist?.enabled ? 'block' : 'none'}">
                <div class="user-selection">
                  <h6>选择用户:</h6>
                  <div class="user-grid" id="whitelistUsers">
                    ${this.renderUserSelection('whitelist')}
                  </div>
                </div>
                <div class="role-selection">
                  <h6>选择角色:</h6>
                  <div class="role-checkboxes" id="whitelistRoles">
                    ${this.renderRoleSelection('whitelist')}
                  </div>
                </div>
                <div class="description-input">
                  <label for="whitelistDescription">说明:</label>
                  <textarea id="whitelistDescription" placeholder="可选：添加白名单说明" rows="2">${this.currentPermissions?.customAccess?.whitelist?.description || ''}</textarea>
                </div>
              </div>
            </div>

            <!-- 黑名单设置 -->
            <div class="permission-list-section">
              <div class="list-header">
                <h5>❌ 黑名单（禁止访问）</h5>
                <label class="toggle-switch">
                  <input type="checkbox" id="blacklistEnabled" ${this.currentPermissions?.customAccess?.blacklist?.enabled ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div id="blacklistContent" class="list-content" style="display: ${this.currentPermissions?.customAccess?.blacklist?.enabled ? 'block' : 'none'}">
                <div class="user-selection">
                  <h6>选择用户:</h6>
                  <div class="user-grid" id="blacklistUsers">
                    ${this.renderUserSelection('blacklist')}
                  </div>
                </div>
                <div class="role-selection">
                  <h6>选择角色:</h6>
                  <div class="role-checkboxes" id="blacklistRoles">
                    ${this.renderRoleSelection('blacklist')}
                  </div>
                </div>
                <div class="description-input">
                  <label for="blacklistDescription">说明:</label>
                  <textarea id="blacklistDescription" placeholder="可选：添加黑名单说明" rows="2">${this.currentPermissions?.customAccess?.blacklist?.description || ''}</textarea>
                </div>
              </div>
            </div>

            <!-- 特殊权限设置 -->
            <div class="special-permissions-section">
              <h5>🔧 特殊权限</h5>
              <div class="special-options">
                <label class="checkbox-option">
                  <input type="checkbox" id="allowAnonymous" ${this.currentPermissions?.customAccess?.specialPermissions?.allowAnonymous ? 'checked' : ''}>
                  <span>允许未登录用户访问</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" id="allowComments" ${this.currentPermissions?.customAccess?.specialPermissions?.allowComments !== false ? 'checked' : ''}>
                  <span>允许评论</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" id="allowDownload" ${this.currentPermissions?.customAccess?.specialPermissions?.allowDownload !== false ? 'checked' : ''}>
                  <span>允许下载</span>
                </label>
                <label class="checkbox-option">
                  <input type="checkbox" id="allowShare" ${this.currentPermissions?.customAccess?.specialPermissions?.allowShare !== false ? 'checked' : ''}>
                  <span>允许分享</span>
                </label>
              </div>
              
              <div class="advanced-options">
                <div class="option-group">
                  <label for="expiryDate">过期时间:</label>
                  <input type="datetime-local" id="expiryDate" value="${this.formatDateForInput(this.currentPermissions?.customAccess?.specialPermissions?.expiryDate)}">
                </div>
                <div class="option-group">
                  <label for="maxViews">最大查看次数:</label>
                  <input type="number" id="maxViews" min="1" placeholder="不限制" value="${this.currentPermissions?.customAccess?.specialPermissions?.maxViews || ''}">
                </div>
              </div>
            </div>
          </div>

          <!-- 权限预览 -->
          <div class="permission-preview-section">
            <h4>👁️ 权限预览</h4>
            <div id="permissionPreview" class="permission-preview">
              ${this.generatePermissionPreview()}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="change-reason">
            <label for="changeReason">修改原因:</label>
            <input type="text" id="changeReason" placeholder="可选：说明此次权限修改的原因">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="filePermissionsUI.closeModal()">取消</button>
            <button type="button" class="btn btn-primary" onclick="filePermissionsUI.savePermissions()">保存权限</button>
          </div>
        </div>
      </div>
    `;
  }

  // 渲染用户选择
  renderUserSelection(listType) {
    const selectedUsers = this.currentPermissions?.customAccess?.[listType]?.users || [];
    
    return this.availableUsers.map(user => {
      const username = typeof user === 'string' ? user : user.username;
      const displayName = user.displayName || username;
      const role = user.role || 'visitor';
      const isSelected = selectedUsers.includes(username);
      
      return `
        <label class="user-checkbox">
          <input type="checkbox" name="${listType}Users" value="${username}" ${isSelected ? 'checked' : ''}>
          <div class="user-info">
            <span class="username">${displayName}</span>
            <span class="user-role role-${role}">${this.getRoleName(role)}</span>
          </div>
        </label>
      `;
    }).join('');
  }

  // 渲染角色选择
  renderRoleSelection(listType) {
    const selectedRoles = this.currentPermissions?.customAccess?.[listType]?.roles || [];
    const roles = [
      { key: 'visitor', name: '访客' },
      { key: 'friend', name: '好友' },
      { key: 'admin', name: '管理员' }
    ];
    
    return roles.map(role => {
      const isSelected = selectedRoles.includes(role.key);
      return `
        <label class="role-checkbox">
          <input type="checkbox" name="${listType}Roles" value="${role.key}" ${isSelected ? 'checked' : ''}>
          <span class="role-name">${role.name}</span>
        </label>
      `;
    }).join('');
  }

  // 绑定模态框事件
  bindModalEvents() {
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

    // 用户和角色选择变化
    document.addEventListener('change', (e) => {
      if (e.target.name && (e.target.name.includes('Users') || e.target.name.includes('Roles'))) {
        this.updatePermissionPreview();
      }
    });

    // 特殊权限变化
    document.querySelectorAll('#allowAnonymous, #allowComments, #allowDownload, #allowShare, #expiryDate, #maxViews').forEach(input => {
      input.addEventListener('change', () => {
        this.updatePermissionPreview();
      });
    });
  }

  // 处理权限级别变化
  handlePermissionLevelChange() {
    const selectedLevel = document.querySelector('input[name="permissionLevel"]:checked').value;
    const customSection = document.getElementById('customPermissionsSection');
    
    customSection.style.display = selectedLevel === 'custom' ? 'block' : 'none';
    this.updatePermissionPreview();
  }

  // 初始化模态框状态
  initializeModalState() {
    this.updatePermissionPreview();
  }

  // 更新权限预览
  updatePermissionPreview() {
    const preview = document.getElementById('permissionPreview');
    if (preview) {
      preview.innerHTML = this.generatePermissionPreview();
    }
  }

  // 生成权限预览
  generatePermissionPreview() {
    const selectedLevel = document.querySelector('input[name="permissionLevel"]:checked')?.value || 'public';
    
    let preview = `<div class="preview-item"><strong>权限级别:</strong> ${this.getPermissionText(selectedLevel)}</div>`;
    
    if (selectedLevel === 'custom') {
      const whitelistEnabled = document.getElementById('whitelistEnabled')?.checked;
      const blacklistEnabled = document.getElementById('blacklistEnabled')?.checked;
      
      if (whitelistEnabled) {
        const selectedUsers = Array.from(document.querySelectorAll('input[name="whitelistUsers"]:checked')).map(cb => cb.value);
        const selectedRoles = Array.from(document.querySelectorAll('input[name="whitelistRoles"]:checked')).map(cb => cb.value);
        
        preview += `<div class="preview-item"><strong>白名单:</strong> ${selectedUsers.length} 个用户, ${selectedRoles.length} 个角色</div>`;
      }
      
      if (blacklistEnabled) {
        const selectedUsers = Array.from(document.querySelectorAll('input[name="blacklistUsers"]:checked')).map(cb => cb.value);
        const selectedRoles = Array.from(document.querySelectorAll('input[name="blacklistRoles"]:checked')).map(cb => cb.value);
        
        preview += `<div class="preview-item"><strong>黑名单:</strong> ${selectedUsers.length} 个用户, ${selectedRoles.length} 个角色</div>`;
      }
      
      const allowAnonymous = document.getElementById('allowAnonymous')?.checked;
      if (allowAnonymous) {
        preview += `<div class="preview-item"><strong>特殊权限:</strong> 允许未登录用户访问</div>`;
      }
    }
    
    return preview;
  }

  // 保存权限设置
  async savePermissions() {
    try {
      console.log(`🔐 开始保存权限设置: ${this.currentFileId} (所有者: ${this.currentOwner})`);

      // 检查必要的元素是否存在
      const levelRadio = document.querySelector('input[name="permissionLevel"]:checked');
      if (!levelRadio) {
        this.showNotification('请选择权限级别', 'error');
        return;
      }

      const selectedLevel = levelRadio.value;
      const reasonElement = document.getElementById('changeReason');
      const reason = reasonElement ? reasonElement.value.trim() : '';

      console.log(`📋 权限设置详情: 级别=${selectedLevel}, 原因="${reason}"`);

      let customSettings = {};

      if (selectedLevel === 'custom') {
        customSettings = this.collectCustomSettings();
        console.log(`⚙️ 自定义设置:`, customSettings);
      }

      // 检查权限系统是否可用
      if (!window.filePermissionsSystem) {
        throw new Error('权限系统未初始化');
      }

      // 创建新的权限结构
      const newPermissions = window.filePermissionsSystem.createPermissionStructure(selectedLevel, customSettings);
      console.log(`📝 创建的权限结构:`, newPermissions);

      // 显示保存进度
      this.showNotification('正在保存权限设置...', 'info');

      // 保存权限
      const result = await window.filePermissionsSystem.updatePermissions(
        this.currentFileId,
        this.currentOwner,
        newPermissions,
        reason
      );

      console.log(`💾 权限保存结果:`, result);

      if (result.success) {
        this.showNotification('权限设置已保存', 'success');
        this.closeModal();

        // 刷新文件层级显示
        if (window.fileHierarchyManager) {
          console.log('🔄 刷新文件层级显示');
          window.fileHierarchyManager.refreshHierarchy();
        }
      } else {
        console.error('❌ 权限保存失败:', result.message);
        this.showNotification(result.message || '保存权限失败', 'error');
      }

    } catch (error) {
      console.error('❌ 保存权限过程中发生错误:', error);
      this.showNotification(`保存权限失败: ${error.message}`, 'error');
    }
  }

  // 收集自定义设置
  collectCustomSettings() {
    const whitelistEnabled = document.getElementById('whitelistEnabled').checked;
    const blacklistEnabled = document.getElementById('blacklistEnabled').checked;
    
    const settings = {
      whitelistEnabled,
      blacklistEnabled,
      allowAnonymous: document.getElementById('allowAnonymous').checked,
      allowComments: document.getElementById('allowComments').checked,
      allowDownload: document.getElementById('allowDownload').checked,
      allowShare: document.getElementById('allowShare').checked,
      expiryDate: document.getElementById('expiryDate').value || null,
      maxViews: parseInt(document.getElementById('maxViews').value) || null
    };
    
    if (whitelistEnabled) {
      settings.whitelistUsers = Array.from(document.querySelectorAll('input[name="whitelistUsers"]:checked')).map(cb => cb.value);
      settings.whitelistRoles = Array.from(document.querySelectorAll('input[name="whitelistRoles"]:checked')).map(cb => cb.value);
      settings.whitelistDescription = document.getElementById('whitelistDescription').value.trim();
    }
    
    if (blacklistEnabled) {
      settings.blacklistUsers = Array.from(document.querySelectorAll('input[name="blacklistUsers"]:checked')).map(cb => cb.value);
      settings.blacklistRoles = Array.from(document.querySelectorAll('input[name="blacklistRoles"]:checked')).map(cb => cb.value);
      settings.blacklistDescription = document.getElementById('blacklistDescription').value.trim();
    }
    
    return settings;
  }

  // 关闭模态框
  closeModal() {
    const modal = document.getElementById('filePermissionsModal');
    if (modal) {
      modal.remove();
    }
  }

  // 辅助方法
  getPermissionIcon(level) {
    const icons = {
      public: '🌍',
      visitor: '👤',
      friend: '👥',
      custom: '⚙️',
      private: '🔒'
    };
    return icons[level] || '❓';
  }

  getPermissionText(level) {
    const texts = {
      public: '公开',
      visitor: '访客',
      friend: '好友',
      custom: '自定义',
      private: '私有'
    };
    return texts[level] || level;
  }

  getRoleName(role) {
    const names = {
      admin: '管理员',
      friend: '好友',
      visitor: '访客'
    };
    return names[role] || role;
  }

  formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  showNotification(message, type = 'info') {
    // 使用现有的通知系统
    if (typeof showNotification !== 'undefined') {
      showNotification(message, type);
    } else {
      alert(message);
    }
  }
}

// 添加权限管理样式
function addPermissionsStyles() {
  if (document.getElementById('permissionsStyles')) return;

  const style = document.createElement('style');
  style.id = 'permissionsStyles';
  style.textContent = `
    /* 权限模态框样式 */
    .permissions-modal {
      z-index: 10000;
      backdrop-filter: blur(5px);
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      box-sizing: border-box;
    }

    .permissions-modal-content {
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .permissions-modal-content .modal-header {
      flex-shrink: 0;
      padding: 1.5rem;
      border-bottom: 1px solid #e9ecef;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 16px 16px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .permissions-modal-content .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .permissions-modal-content .modal-footer {
      flex-shrink: 0;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e9ecef;
      background: #f8f9fa;
      border-radius: 0 0 16px 16px;
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid #e9ecef;
      background: #f8f9fa;
      border-radius: 0 0 16px 16px;
    }

    /* 文件信息样式 */
    .file-info-section {
      margin-bottom: 2rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .file-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-item label {
      font-weight: 600;
      color: #6c757d;
      font-size: 0.875rem;
    }

    /* 权限选项样式 */
    .permission-options {
      display: grid;
      gap: 1rem;
      margin-top: 1rem;
    }

    .permission-option {
      border: 2px solid #e9ecef;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .permission-option:hover {
      border-color: #007bff;
      box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
    }

    .permission-option input[type="radio"] {
      display: none;
    }

    .permission-option input[type="radio"]:checked + .permission-label {
      border-color: #007bff;
      background: #f8f9ff;
    }

    .permission-label {
      display: flex;
      align-items: center;
      padding: 1rem;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.3s ease;
    }

    .permission-icon {
      font-size: 2rem;
      margin-right: 1rem;
    }

    .permission-details h5 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .permission-details p {
      margin: 0;
      color: #6c757d;
      font-size: 0.875rem;
    }

    /* 自定义权限样式 */
    .custom-permissions-section {
      margin-top: 2rem;
      padding: 1.5rem;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      background: #fafbfc;
    }

    .permission-list-section {
      margin-bottom: 2rem;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      background: white;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      border-radius: 8px 8px 0 0;
    }

    .list-header h5 {
      margin: 0;
      color: #333;
    }

    .list-content {
      padding: 1.5rem;
    }

    /* 用户选择样式 */
    .user-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .user-checkbox {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .user-checkbox:hover {
      background: #f8f9fa;
      border-color: #007bff;
    }

    .user-checkbox input[type="checkbox"] {
      margin-right: 0.5rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .username {
      font-weight: 500;
      color: #333;
    }

    .user-role {
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      color: white;
    }

    .role-admin { background: #dc3545; }
    .role-friend { background: #28a745; }
    .role-visitor { background: #6c757d; }

    /* 角色选择样式 */
    .role-checkboxes {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
    }

    .role-checkbox {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .role-checkbox:hover {
      background: #f8f9fa;
      border-color: #007bff;
    }

    .role-checkbox input[type="checkbox"] {
      margin-right: 0.5rem;
    }

    /* 开关样式 */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.4s;
      border-radius: 24px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    }

    input:checked + .toggle-slider {
      background-color: #007bff;
    }

    input:checked + .toggle-slider:before {
      transform: translateX(26px);
    }

    /* 特殊权限样式 */
    .special-permissions-section {
      margin-top: 1.5rem;
      padding: 1rem;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      background: white;
    }

    .special-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .checkbox-option {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      cursor: pointer;
    }

    .checkbox-option input[type="checkbox"] {
      margin-right: 0.5rem;
    }

    .advanced-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .option-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .option-group label {
      font-weight: 500;
      color: #333;
    }

    .option-group input {
      padding: 0.5rem;
      border: 1px solid #e9ecef;
      border-radius: 4px;
    }

    /* 权限预览样式 */
    .permission-preview-section {
      margin-top: 2rem;
      padding: 1rem;
      background: #e8f4fd;
      border: 1px solid #b8daff;
      border-radius: 8px;
    }

    .permission-preview {
      margin-top: 1rem;
    }

    .preview-item {
      padding: 0.5rem 0;
      border-bottom: 1px solid #b8daff;
    }

    .preview-item:last-child {
      border-bottom: none;
    }

    /* 权限徽章样式 */
    .permission-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
    }

    .permission-public { background: #28a745; }
    .permission-visitor { background: #007bff; }
    .permission-friend { background: #fd7e14; }
    .permission-custom { background: #6f42c1; }
    .permission-private { background: #dc3545; }

    /* 模态框底部样式 */
    .change-reason {
      margin-bottom: 1rem;
    }

    .change-reason label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .change-reason input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #e9ecef;
      border-radius: 4px;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
      .permissions-modal {
        padding: 0.5rem;
      }

      .permissions-modal-content {
        max-height: 95vh;
        border-radius: 12px;
      }

      .permissions-modal-content .modal-header {
        padding: 1rem;
        border-radius: 12px 12px 0 0;
      }

      .permissions-modal-content .modal-body {
        padding: 1rem;
      }

      .permissions-modal-content .modal-footer {
        padding: 0.75rem 1rem;
        border-radius: 0 0 12px 12px;
      }

      .file-info-grid {
        grid-template-columns: 1fr;
      }

      .user-grid {
        grid-template-columns: 1fr;
      }

      .role-checkboxes {
        flex-direction: column;
      }

      .special-options {
        grid-template-columns: 1fr;
      }

      .advanced-options {
        grid-template-columns: 1fr;
      }

      .modal-actions {
        flex-direction: column;
        gap: 0.5rem;
      }

      .modal-actions .btn {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .permissions-modal-content {
        max-height: 98vh;
        border-radius: 8px;
      }

      .permission-section {
        padding: 1rem;
      }
    }
  `;

  document.head.appendChild(style);
}

// 自动添加样式
addPermissionsStyles();

// 创建全局实例
window.filePermissionsUI = new FilePermissionsUI();
