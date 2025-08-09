// 权限管理模块
class PermissionsManager {
  constructor() {
    this.currentWorkId = null;
    this.currentWorkData = null;
  }

  // 显示权限设置模态框
  showPermissionsModal(workId, workData) {
    this.currentWorkId = workId;
    this.currentWorkData = workData;

    // 检查用户是否有权限修改此作品的权限设置
    if (!this.canModifyPermissions(workData)) {
      this.showNotification('您没有权限修改此作品的权限设置', 'error');
      return;
    }

    this.createPermissionsModal();
  }

  // 检查用户是否可以修改权限
  canModifyPermissions(workData) {
    if (!auth.currentUser) return false;

    // 管理员可以修改所有作品的权限
    if (auth.isAdmin && auth.isAdmin()) {
      return true;
    }

    // 作品作者可以修改自己作品的权限
    if (workData.uploadedBy === auth.currentUser.username || 
        workData.author === auth.currentUser.username) {
      return true;
    }

    return false;
  }

  // 创建权限设置模态框
  createPermissionsModal() {
    // 移除现有模态框
    const existingModal = document.getElementById('permissionsModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'permissionsModal';
    modal.className = 'permissions-modal';
    
    const currentPermissions = this.currentWorkData.permissions || {};
    const visibility = currentPermissions.visibility || 'public';
    
    modal.innerHTML = `
      <div class="permissions-modal-content">
        <div class="permissions-modal-header">
          <h3>权限设置 - ${this.currentWorkData.title}</h3>
          <button class="permissions-modal-close" onclick="permissionsManager.closeModal()">&times;</button>
        </div>
        
        <div class="permissions-modal-body">
          <div class="permission-section">
            <h4>可见性设置</h4>
            <div class="visibility-options">
              <label class="visibility-option">
                <input type="radio" name="visibility" value="public" ${visibility === 'public' ? 'checked' : ''}>
                <span class="option-label">
                  <strong>公开</strong>
                  <small>所有用户都可以查看此作品</small>
                </span>
              </label>
              
              <label class="visibility-option">
                <input type="radio" name="visibility" value="private" ${visibility === 'private' ? 'checked' : ''}>
                <span class="option-label">
                  <strong>私有</strong>
                  <small>仅作者和管理员可以查看</small>
                </span>
              </label>
              
              <label class="visibility-option">
                <input type="radio" name="visibility" value="whitelist" ${visibility === 'whitelist' ? 'checked' : ''}>
                <span class="option-label">
                  <strong>白名单模式</strong>
                  <small>仅指定的用户可以查看</small>
                </span>
              </label>
              
              <label class="visibility-option">
                <input type="radio" name="visibility" value="blacklist" ${visibility === 'blacklist' ? 'checked' : ''}>
                <span class="option-label">
                  <strong>黑名单模式</strong>
                  <small>除指定用户外，所有人都可以查看</small>
                </span>
              </label>
            </div>
          </div>

          <div class="permission-section" id="userListSection" style="display: none;">
            <h4 id="userListTitle">用户列表</h4>
            <div class="user-list-input">
              <input type="text" id="userInput" placeholder="输入用户名">
              <button onclick="permissionsManager.addUser()">添加</button>
            </div>
            <div class="user-list" id="userList">
              <!-- 用户列表将在这里显示 -->
            </div>
          </div>

          <div class="permission-section">
            <h4>权限信息</h4>
            <div class="permission-info">
              <p><strong>作品作者：</strong> ${this.currentWorkData.uploadedBy || this.currentWorkData.author || '未知'}</p>
              <p><strong>创建时间：</strong> ${new Date(this.currentWorkData.uploadTime || Date.now()).toLocaleString()}</p>
              <p><strong>最后修改：</strong> ${currentPermissions.lastModified ? new Date(currentPermissions.lastModified).toLocaleString() : '未修改'}</p>
              ${currentPermissions.modifiedBy ? `<p><strong>修改者：</strong> ${currentPermissions.modifiedBy}</p>` : ''}
            </div>
          </div>
        </div>
        
        <div class="permissions-modal-footer">
          <button class="btn-cancel" onclick="permissionsManager.closeModal()">取消</button>
          <button class="btn-save" onclick="permissionsManager.savePermissions()">保存设置</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // 添加样式
    this.addModalStyles();
    
    // 绑定事件监听器
    this.bindEventListeners();
    
    // 初始化用户列表
    this.updateUserListSection();
  }

  // 绑定事件监听器
  bindEventListeners() {
    const visibilityInputs = document.querySelectorAll('input[name="visibility"]');
    visibilityInputs.forEach(input => {
      input.addEventListener('change', () => {
        this.updateUserListSection();
      });
    });

    // 点击模态框外部关闭
    document.getElementById('permissionsModal').addEventListener('click', (e) => {
      if (e.target.id === 'permissionsModal') {
        this.closeModal();
      }
    });
  }

  // 更新用户列表区域
  updateUserListSection() {
    const selectedVisibility = document.querySelector('input[name="visibility"]:checked').value;
    const userListSection = document.getElementById('userListSection');
    const userListTitle = document.getElementById('userListTitle');
    
    if (selectedVisibility === 'whitelist' || selectedVisibility === 'blacklist') {
      userListSection.style.display = 'block';
      userListTitle.textContent = selectedVisibility === 'whitelist' ? '允许查看的用户' : '禁止查看的用户';
      this.renderUserList();
    } else {
      userListSection.style.display = 'none';
    }
  }

  // 渲染用户列表
  renderUserList() {
    const selectedVisibility = document.querySelector('input[name="visibility"]:checked').value;
    const currentPermissions = this.currentWorkData.permissions || {};
    const userList = selectedVisibility === 'whitelist' ? 
      (currentPermissions.allowedUsers || []) : 
      (currentPermissions.blockedUsers || []);

    const userListContainer = document.getElementById('userList');
    userListContainer.innerHTML = '';

    userList.forEach(username => {
      const userItem = document.createElement('div');
      userItem.className = 'user-item';
      userItem.innerHTML = `
        <span class="username">${username}</span>
        <button class="remove-user" onclick="permissionsManager.removeUser('${username}')">移除</button>
      `;
      userListContainer.appendChild(userItem);
    });
  }

  // 添加用户
  addUser() {
    const userInput = document.getElementById('userInput');
    const username = userInput.value.trim();
    
    if (!username) {
      this.showNotification('请输入用户名', 'warning');
      return;
    }

    const selectedVisibility = document.querySelector('input[name="visibility"]:checked').value;
    const currentPermissions = this.currentWorkData.permissions || {};
    
    if (selectedVisibility === 'whitelist') {
      if (!currentPermissions.allowedUsers) {
        currentPermissions.allowedUsers = [];
      }
      if (!currentPermissions.allowedUsers.includes(username)) {
        currentPermissions.allowedUsers.push(username);
      }
    } else if (selectedVisibility === 'blacklist') {
      if (!currentPermissions.blockedUsers) {
        currentPermissions.blockedUsers = [];
      }
      if (!currentPermissions.blockedUsers.includes(username)) {
        currentPermissions.blockedUsers.push(username);
      }
    }

    userInput.value = '';
    this.renderUserList();
  }

  // 移除用户
  removeUser(username) {
    const selectedVisibility = document.querySelector('input[name="visibility"]:checked').value;
    const currentPermissions = this.currentWorkData.permissions || {};
    
    if (selectedVisibility === 'whitelist' && currentPermissions.allowedUsers) {
      currentPermissions.allowedUsers = currentPermissions.allowedUsers.filter(u => u !== username);
    } else if (selectedVisibility === 'blacklist' && currentPermissions.blockedUsers) {
      currentPermissions.blockedUsers = currentPermissions.blockedUsers.filter(u => u !== username);
    }

    this.renderUserList();
  }

  // 保存权限设置
  async savePermissions() {
    try {
      const selectedVisibility = document.querySelector('input[name="visibility"]:checked').value;
      const currentPermissions = this.currentWorkData.permissions || {};
      
      const newPermissions = {
        ...currentPermissions,
        visibility: selectedVisibility,
        isPublic: selectedVisibility === 'public',
        lastModified: new Date().toISOString(),
        modifiedBy: auth.currentUser.username
      };

      // 清理不相关的用户列表
      if (selectedVisibility !== 'whitelist') {
        newPermissions.allowedUsers = [];
      }
      if (selectedVisibility !== 'blacklist') {
        newPermissions.blockedUsers = [];
      }

      // 记录权限变更日志
      const oldPermissions = this.currentWorkData.permissions || {};
      if (typeof adminLogger !== 'undefined') {
        adminLogger.logPermissionChange(this.currentWorkData, oldPermissions, newPermissions);
      }

      // 更新作品权限
      if (window.fileUploader && window.fileUploader.updateWorkPermissions) {
        await window.fileUploader.updateWorkPermissions(this.currentWorkId, newPermissions);
      } else {
        // 直接更新localStorage中的数据
        const workData = localStorage.getItem(`work_${this.currentWorkId}`);
        if (workData) {
          const work = JSON.parse(workData);
          work.permissions = newPermissions;
          localStorage.setItem(`work_${this.currentWorkId}`, JSON.stringify(work));
        }
      }

      this.showNotification('权限设置保存成功！', 'success');
      this.closeModal();
      
      // 刷新页面数据
      if (typeof location !== 'undefined') {
        location.reload();
      }

    } catch (error) {
      console.error('保存权限设置失败:', error);
      this.showNotification('保存失败：' + error.message, 'error');
    }
  }

  // 关闭模态框
  closeModal() {
    const modal = document.getElementById('permissionsModal');
    if (modal) {
      modal.remove();
    }
  }

  // 显示通知
  showNotification(message, type = 'info') {
    // 移除现有通知
    const existingNotification = document.querySelector('.permission-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    // 创建新通知
    const notification = document.createElement('div');
    notification.className = `permission-notification notification-${type}`;
    notification.textContent = message;
    
    // 添加样式
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${this.getNotificationColor(type)};
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001;
      animation: slideInRight 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // 自动移除通知
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 4000);
  }

  // 获取通知颜色
  getNotificationColor(type) {
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#007bff'
    };
    return colors[type] || colors.info;
  }

  // 添加模态框样式
  addModalStyles() {
    // 检查是否已经添加了样式
    if (document.getElementById('permissionsModalStyles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'permissionsModalStyles';
    style.textContent = `
      .permissions-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
      }

      .permissions-modal-content {
        background: white;
        border-radius: 10px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
      }

      .permissions-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #e9ecef;
      }

      .permissions-modal-header h3 {
        margin: 0;
        color: #333;
        font-size: 1.2rem;
      }

      .permissions-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .permissions-modal-close:hover {
        color: #333;
      }

      .permissions-modal-body {
        padding: 20px;
      }

      .permission-section {
        margin-bottom: 25px;
      }

      .permission-section h4 {
        margin: 0 0 15px 0;
        color: #333;
        font-size: 1.1rem;
        border-bottom: 2px solid #007bff;
        padding-bottom: 5px;
      }

      .visibility-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .visibility-option {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 15px;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .visibility-option:hover {
        border-color: #007bff;
        background: #f8f9fa;
      }

      .visibility-option input[type="radio"] {
        margin: 0;
        margin-top: 2px;
      }

      .visibility-option input[type="radio"]:checked + .option-label {
        color: #007bff;
      }

      .option-label {
        flex: 1;
      }

      .option-label strong {
        display: block;
        margin-bottom: 5px;
        font-size: 1rem;
      }

      .option-label small {
        color: #6c757d;
        font-size: 0.9rem;
      }

      .user-list-input {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }

      .user-list-input input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 0.9rem;
      }

      .user-list-input button {
        padding: 8px 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.9rem;
      }

      .user-list-input button:hover {
        background: #0056b3;
      }

      .user-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .user-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background: #f8f9fa;
        border-radius: 5px;
        border: 1px solid #e9ecef;
      }

      .username {
        font-weight: 500;
        color: #333;
      }

      .remove-user {
        background: #dc3545;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 0.8rem;
      }

      .remove-user:hover {
        background: #c82333;
      }

      .permission-info {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 5px;
        border: 1px solid #e9ecef;
      }

      .permission-info p {
        margin: 0 0 8px 0;
        font-size: 0.9rem;
      }

      .permission-info p:last-child {
        margin-bottom: 0;
      }

      .permissions-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 20px;
        border-top: 1px solid #e9ecef;
      }

      .btn-cancel, .btn-save {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
      }

      .btn-cancel {
        background: #6c757d;
        color: white;
      }

      .btn-cancel:hover {
        background: #5a6268;
      }

      .btn-save {
        background: #28a745;
        color: white;
      }

      .btn-save:hover {
        background: #218838;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }

      @media (max-width: 768px) {
        .permissions-modal-content {
          width: 95%;
          margin: 10px;
        }

        .visibility-option {
          padding: 12px;
        }

        .option-label strong {
          font-size: 0.9rem;
        }

        .option-label small {
          font-size: 0.8rem;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

// 创建全局实例
const permissionsManager = new PermissionsManager();
