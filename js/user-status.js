// 用户状态管理模块
class UserStatusManager {
  constructor() {
    this.initialized = false;
    this.updateInterval = null;
    this.lastUpdateTime = 0;
    this.updateThrottle = 1000; // 1秒节流
    this.isUpdating = false;

    // 状态跟踪变量，用于减少重复日志
    this.lastLoggedState = null;
    this.lastLogTime = 0;
  }

  // 初始化用户状态管理
  init() {
    if (this.initialized) return;

    // 检查是否在首页，如果是则跳过初始化（首页有自己的用户状态系统）
    if (this.isHomePage()) {
      console.log('🏠 检测到首页，跳过通用用户状态管理器初始化');
      return;
    }

    this.addUserStatusToNavbar();
    this.addStyles();
    this.bindEvents();
    this.updateUserStatus();

    // 定期检查登录状态变化（增加间隔时间，减少频繁更新）
    this.updateInterval = setInterval(() => {
      // 只有在页面可见时才更新状态，避免后台页面的无意义更新
      if (!document.hidden) {
        this.updateUserStatus();
      }
    }, 10000); // 从5秒改为10秒

    this.initialized = true;
    console.log('✅ 用户状态管理器已初始化');
  }

  // 检查是否为首页
  isHomePage() {
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop();

    // 检查是否为首页（index.html 或根路径）
    return currentFile === 'index.html' ||
           currentFile === '' ||
           currentPath === '/' ||
           currentPath.endsWith('/');
  }

  // 添加用户状态元素到导航栏
  addUserStatusToNavbar() {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) {
      console.warn('⚠️ 未找到导航菜单，跳过用户状态添加');
      return;
    }

    // 检查是否已经添加了用户状态元素
    if (document.getElementById('userStatusItem') || document.getElementById('loginItem')) {
      return;
    }

    // 创建登录按钮元素（未登录时显示）
    const loginItem = document.createElement('li');
    loginItem.className = 'nav-item';
    loginItem.id = 'loginItem';
    loginItem.innerHTML = `
      <a href="#" class="nav-link" id="loginNavLink" onclick="userStatusManager.showLoginModal()">登录</a>
    `;

    // 创建用户状态元素（已登录时显示）
    const userStatusItem = document.createElement('li');
    userStatusItem.className = 'nav-item';
    userStatusItem.id = 'userStatusItem';
    userStatusItem.style.display = 'none';
    userStatusItem.innerHTML = `
      <a href="#" class="nav-link" id="userNavLink" onclick="userStatusManager.toggleUserInfo()">
        <span id="currentUserName"></span>
      </a>
    `;

    // 添加到导航菜单末尾
    navMenu.appendChild(loginItem);
    navMenu.appendChild(userStatusItem);

    // 添加登录模态框
    this.addLoginModal();

    // 添加用户信息显示区域
    this.addUserInfoDisplay();

    console.log('✅ 用户认证元素已添加到导航栏（包含登录按钮和用户信息）');
  }

  // 添加登录模态框
  addLoginModal() {
    // 检查是否已经存在登录模态框
    if (document.getElementById('loginModal')) {
      return;
    }

    const loginModal = document.createElement('div');
    loginModal.id = 'loginModal';
    loginModal.className = 'modal';
    loginModal.style.display = 'none';
    loginModal.innerHTML = `
      <div class="modal-content">
        <span class="close-btn" onclick="userStatusManager.closeLoginModal()">&times;</span>
        <h3>用户登录</h3>
        <form id="loginForm">
          <div class="form-group">
            <label for="loginUsername">用户名</label>
            <input type="text" id="loginUsername" class="form-control" placeholder="请输入用户名" required>
          </div>
          <div class="form-group">
            <label for="loginPassword">密码</label>
            <input type="password" id="loginPassword" class="form-control" placeholder="请输入密码" required>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">登录</button>
            <button type="button" class="btn btn-secondary" onclick="userStatusManager.closeLoginModal()">取消</button>
          </div>
        </form>
        <div class="login-help">
          <p><small>需要账户？请联系管理员获取登录凭据</small></p>
          <p><small>忘记密码？请联系系统管理员重置</small></p>
        </div>
      </div>
    `;

    document.body.appendChild(loginModal);
  }

  // 添加用户信息显示区域
  addUserInfoDisplay() {
    // 检查是否已经存在用户信息显示区域
    if (document.getElementById('userInfoDisplay')) {
      return;
    }

    const userInfoDisplay = document.createElement('div');
    userInfoDisplay.id = 'userInfoDisplay';
    userInfoDisplay.style.cssText = `
      display: none;
      position: fixed;
      top: 80px;
      right: 20px;
      background: rgba(255,255,255,0.98);
      padding: 20px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      z-index: 1000;
      min-width: 200px;
    `;
    userInfoDisplay.innerHTML = `
      <div id="userInfoContent"></div>
      <button id="logoutButton" onclick="userStatusManager.handleLogout()" style="
        width: 100%;
        margin-top: 15px;
        padding: 10px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      ">
        <span>退出登录</span>
      </button>
    `;

    document.body.appendChild(userInfoDisplay);
  }

  // 添加样式
  addStyles() {
    // 检查是否已经添加了样式
    if (document.getElementById('userStatusStyles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'userStatusStyles';
    style.textContent = `
      /* 登录模态框样式 */
      .modal {
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
        backdrop-filter: blur(5px);
      }

      .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
        position: relative;
        animation: modalSlideIn 0.3s ease-out;
      }

      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-50px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .close-btn {
        position: absolute;
        top: 15px;
        right: 20px;
        font-size: 1.5rem;
        cursor: pointer;
        color: #999;
        transition: color 0.3s ease;
      }

      .close-btn:hover {
        color: #333;
      }

      .modal h3 {
        margin: 0 0 1.5rem 0;
        color: #333;
        text-align: center;
        font-size: 1.5rem;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        color: #555;
        font-weight: 500;
      }

      .form-control {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.3s ease;
        box-sizing: border-box;
      }

      .form-control:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
      }

      .btn {
        flex: 1;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
      }

      .btn-secondary {
        background: #6c757d;
        color: white;
      }

      .btn-secondary:hover {
        background: #5a6268;
      }

      .login-help {
        margin-top: 1.5rem;
        text-align: center;
        color: #6c757d;
      }

      .login-help p {
        margin: 0.5rem 0;
      }

      /* 用户状态显示样式 */
      #userNavLink {
        color: #28a745 !important;
        font-weight: bold;
      }

      #userNavLink.admin {
        color: #dc3545 !important;
      }

      /* 用户信息显示区域动画 */
      #userInfoDisplay {
        animation: slideInFromRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      @keyframes slideInFromRight {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      /* 退出登录按钮悬停效果 */
      #logoutButton:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
      }

      /* 响应式设计 */
      @media (max-width: 768px) {
        .modal-content {
          margin: 1rem;
          padding: 1.5rem;
        }

        #userInfoDisplay {
          right: 10px;
          left: 10px;
          width: auto;
          min-width: auto;
        }

        .form-actions {
          flex-direction: column;
        }
      }

      /* 退出登录按钮样式 */
      .logout-btn {
        background: #dc3545;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 15px;
        font-size: 0.8rem;
        cursor: pointer;
        margin-left: 8px;
        transition: background-color 0.3s ease;
      }

      .logout-btn:hover {
        background: #c82333;
      }

      /* 登录链接样式 - 与首页保持一致 */
      #loginItem .nav-link {
        color: #333 !important;
        transition: color 0.3s ease;
      }

      #loginItem .nav-link:hover {
        color: #007bff !important;
      }

      @media (max-width: 768px) {
        .user-info {
          flex-direction: column;
          gap: 4px;
          padding: 6px 10px;
        }

        .user-role {
          font-size: 0.7rem;
          padding: 2px 6px;
        }

        .logout-btn {
          font-size: 0.7rem;
          padding: 4px 8px;
          margin-left: 0;
          margin-top: 4px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // 绑定事件
  bindEvents() {
    // 延迟绑定auth模块的方法重写，确保auth对象已完全初始化
    setTimeout(() => {
      if (typeof auth !== 'undefined' && auth.login && auth.logout) {
        // 重写auth.login方法以在登录后更新状态
        const originalLogin = auth.login;
        auth.login = async function(...args) {
          const result = await originalLogin.apply(this, args);
          userStatusManager.updateUserStatus();
          return result;
        };

        // 重写auth.logout方法以在登出后更新状态
        const originalLogout = auth.logout;
        auth.logout = function(...args) {
          const result = originalLogout.apply(this, args);
          userStatusManager.updateUserStatus();
          return result;
        };

        console.log('✅ Auth方法重写完成');
      } else {
        console.warn('⚠️ Auth对象未完全初始化，跳过方法重写');
      }
    }, 100); // 延迟100ms确保auth对象完全加载
  }

  // 更新用户状态显示（带节流机制）
  updateUserStatus() {
    // 节流检查：避免频繁更新
    const now = Date.now();
    if (this.isUpdating || (now - this.lastUpdateTime < this.updateThrottle)) {
      // 静默跳过，避免控制台噪音
      return;
    }

    this.isUpdating = true;
    this.lastUpdateTime = now;

    // 减少日志输出频率，只在状态真正改变时输出
    const shouldLog = !this.lastLoggedState || (now - this.lastLogTime > 30000); // 30秒内最多输出一次日志

    try {
      const userStatusItem = document.getElementById('userStatusItem');
      const loginItem = document.getElementById('loginItem');
      const currentUserName = document.getElementById('currentUserName');
      const userNavLink = document.getElementById('userNavLink');
      const userInfoContent = document.getElementById('userInfoContent');

    if (!userStatusItem || !loginItem) {
      if (shouldLog) {
        console.log('👤 用户状态元素未找到，跳过更新');
      }
      return; // 元素还未创建
    }

    const currentState = {
      isLoggedIn: !!(typeof auth !== 'undefined' && auth.currentUser),
      username: auth?.currentUser?.username || null,
      role: auth?.currentUser?.role || null
    };

    // 检查状态是否真正改变
    const stateChanged = !this.lastLoggedState ||
      this.lastLoggedState.isLoggedIn !== currentState.isLoggedIn ||
      this.lastLoggedState.username !== currentState.username ||
      this.lastLoggedState.role !== currentState.role;

    if (typeof auth !== 'undefined' && auth.currentUser) {
      // 用户已登录，显示用户信息，隐藏登录按钮
      userStatusItem.style.display = 'block';
      loginItem.style.display = 'none';

      if (currentUserName) {
        currentUserName.textContent = auth.currentUser.username;
      }

      // 设置用户链接样式
      if (userNavLink) {
        userNavLink.className = 'nav-link';
        if (auth.isAdmin && auth.isAdmin()) {
          userNavLink.classList.add('admin');
        }
      }

      // 更新用户信息内容
      if (userInfoContent) {
        const roleName = this.getRoleName(auth.currentUser.role);
        userInfoContent.innerHTML = `
          <div style="text-align: center;">
            <strong style="color: ${auth.isAdmin() ? '#dc3545' : '#28a745'};">${auth.currentUser.username}</strong><br>
            <small style="color: #6c757d;">角色: ${roleName}</small><br>
            <small style="color: #007bff;">状态: 已登录</small>
          </div>
        `;
      }

      if (shouldLog || stateChanged) {
        console.log('✅ 用户状态已更新 - 已登录:', auth.currentUser.username);
      }
    } else {
      // 用户未登录，显示登录按钮，隐藏用户状态
      userStatusItem.style.display = 'none';
      loginItem.style.display = 'block';

      // 隐藏用户信息显示区域
      const userInfoDisplay = document.getElementById('userInfoDisplay');
      if (userInfoDisplay) {
        userInfoDisplay.style.display = 'none';
      }

      if (shouldLog || stateChanged) {
        console.log('✅ 用户状态已更新 - 未登录');
      }
    }

    // 记录当前状态和日志时间
    if (stateChanged || shouldLog) {
      this.lastLoggedState = currentState;
      this.lastLogTime = now;
    }

    } catch (error) {
      console.error('❌ 更新用户状态失败:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  // 获取角色名称
  getRoleName(role) {
    const roleNames = {
      admin: '管理员',
      friend: '好友',
      visitor: '访客'
    };
    return roleNames[role] || '访客';
  }

  // 显示登录模态框
  showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      // 绑定登录表单事件
      this.bindLoginForm();
    }
  }

  // 关闭登录模态框
  closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';

      // 重置表单
      const form = document.getElementById('loginForm');
      if (form) {
        form.reset();
      }
    }
  }

  // 切换用户信息显示
  toggleUserInfo() {
    const userInfoDisplay = document.getElementById('userInfoDisplay');
    if (userInfoDisplay) {
      const isVisible = userInfoDisplay.style.display === 'block';
      userInfoDisplay.style.display = isVisible ? 'none' : 'block';
    }
  }

  // 绑定登录表单事件
  bindLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    // 移除之前的事件监听器
    const newForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newForm, loginForm);

    // 添加新的事件监听器
    newForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (typeof auth === 'undefined') {
        this.showMessage('系统正在初始化，请稍后再试', 'error');
        return;
      }

      const username = document.getElementById('loginUsername').value;
      const password = document.getElementById('loginPassword').value;

      try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '登录中...';
        submitBtn.disabled = true;

        const result = await auth.login(username, password);

        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        if (result) {
          this.closeLoginModal();
          // updateUserStatus 会在 auth.login 重写方法中自动调用，这里不需要重复调用
          this.showMessage('登录成功！欢迎回来，' + auth.currentUser.username, 'success');

          // 如果是管理员，显示特殊提示
          if (auth.isAdmin()) {
            setTimeout(() => {
              this.showMessage('您拥有管理员权限', 'success');
            }, 1500);
          }
        }
      } catch (error) {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.textContent = '登录';
          submitBtn.disabled = false;
        }

        let errorMessage = '登录失败';
        if (error.message.includes('用户不存在')) {
          errorMessage = '用户名不存在，请检查输入';
        } else if (error.message.includes('密码错误')) {
          errorMessage = '密码错误，请重新输入';
        }

        this.showMessage(errorMessage, 'error');
      }
    });
  }

  // 显示消息
  showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    const bgColor = type === 'success' ? '#28a745' : '#dc3545';
    const icon = type === 'success' ? '✅' : '❌';

    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001;
      font-weight: 500;
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
      word-wrap: break-word;
    `;
    messageDiv.innerHTML = `${icon} ${message}`;

    // 添加动画样式
    if (!document.getElementById('messageAnimationStyle')) {
      const style = document.createElement('style');
      style.id = 'messageAnimationStyle';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(messageDiv);

    const displayTime = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
      messageDiv.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.parentNode.removeChild(messageDiv);
        }
      }, 300);
    }, displayTime);
  }

  // 处理退出登录
  handleLogout() {
    if (confirm('确定要退出登录吗？')) {
      if (typeof auth !== 'undefined') {
        const username = auth.currentUser ? auth.currentUser.username : '用户';
        auth.logout();
        // updateUserStatus 会在 auth.logout 重写方法中自动调用，这里不需要重复调用

        // 显示退出成功提示
        this.showMessage(`${username} 已成功退出登录`, 'success');

        // 隐藏用户信息显示区域
        const userInfoDisplay = document.getElementById('userInfoDisplay');
        if (userInfoDisplay) {
          userInfoDisplay.style.display = 'none';
        }
      }
    }
  }

  // 显示通知
  showNotification(message, type = 'info') {
    // 尝试使用现有的通知系统
    if (typeof showNotification !== 'undefined') {
      showNotification(message, type);
      return;
    }

    // 创建简单的通知
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${this.getNotificationColor(type)};
      color: white;
      padding: 12px 20px;
      border-radius: 5px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 0.9rem;
      max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 自动移除通知
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
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

  // 销毁管理器
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // 移除添加的元素
    const userStatusItem = document.getElementById('userStatusItem');
    const loginItem = document.getElementById('loginItem');
    const loginModal = document.getElementById('loginModal');
    const userInfoDisplay = document.getElementById('userInfoDisplay');
    const styles = document.getElementById('userStatusStyles');
    const messageStyles = document.getElementById('messageAnimationStyle');

    if (userStatusItem) userStatusItem.remove();
    if (loginItem) loginItem.remove();
    if (loginModal) loginModal.remove();
    if (userInfoDisplay) userInfoDisplay.remove();
    if (styles) styles.remove();
    if (messageStyles) messageStyles.remove();
    
    this.initialized = false;
  }
}

// 创建全局实例
const userStatusManager = new UserStatusManager();

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', function() {
  // 等待其他脚本加载完成
  setTimeout(() => {
    userStatusManager.init();
  }, 100);
});

// 页面卸载时清理
window.addEventListener('beforeunload', function() {
  userStatusManager.destroy();
});
