// 权限安全管理器 - 防止权限泄露和未授权访问
class PermissionSecurityManager {
  constructor() {
    this.adminPages = [
      'admin.html',
      'user-management.html', 
      'admin-dashboard.html'
    ];
    this.currentUser = null;
    this.lastUserCheck = null;
    this.checkInterval = null;
    this.initialized = false;
    
    // 绑定方法到实例
    this.handleUserChange = this.handleUserChange.bind(this);
    this.checkPermissions = this.checkPermissions.bind(this);
    this.redirectToHome = this.redirectToHome.bind(this);
  }

  // 初始化安全管理器
  init() {
    if (this.initialized) return;
    
    console.log('🔒 初始化权限安全管理器...');
    
    // 检查当前页面是否为管理员页面
    if (!this.isAdminPage()) {
      console.log('📄 非管理员页面，跳过权限安全检查');
      return;
    }
    
    // 等待auth模块加载
    this.waitForAuth(() => {
      this.setupSecurityMonitoring();
      this.performInitialCheck();
      this.initialized = true;
      console.log('✅ 权限安全管理器初始化完成');
    });
  }

  // 等待auth模块加载
  waitForAuth(callback, maxAttempts = 20) {
    let attempts = 0;
    
    const checkAuth = () => {
      attempts++;
      
      if (typeof auth !== 'undefined' && auth !== null) {
        callback();
      } else if (attempts < maxAttempts) {
        setTimeout(checkAuth, 250);
      } else {
        console.error('❌ Auth模块加载超时，权限安全检查可能无法正常工作');
        // 即使auth未加载，也要进行基本的安全检查
        this.performBasicSecurityCheck();
      }
    };
    
    checkAuth();
  }

  // 检查当前页面是否为管理员页面
  isAdminPage() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    return this.adminPages.some(page => currentPage.includes(page));
  }

  // 设置安全监控
  setupSecurityMonitoring() {
    // 监听用户状态变化
    this.monitorUserChanges();
    
    // 定期检查权限
    this.startPeriodicCheck();
    
    // 监听页面可见性变化
    this.monitorPageVisibility();
    
    // 监听存储变化
    this.monitorStorageChanges();
  }

  // 监听用户状态变化
  monitorUserChanges() {
    // 重写auth.login方法
    if (auth && auth.login) {
      const originalLogin = auth.login;
      auth.login = async (...args) => {
        const result = await originalLogin.apply(auth, args);
        this.handleUserChange('login');
        return result;
      };
    }

    // 重写auth.logout方法
    if (auth && auth.logout) {
      const originalLogout = auth.logout;
      auth.logout = (...args) => {
        const result = originalLogout.apply(auth, args);
        this.handleUserChange('logout');
        return result;
      };
    }

    // 监听用户状态管理器的更新
    if (window.userStatusManager && window.userStatusManager.updateUserStatus) {
      const originalUpdate = window.userStatusManager.updateUserStatus;
      window.userStatusManager.updateUserStatus = (...args) => {
        const result = originalUpdate.apply(window.userStatusManager, args);
        this.handleUserChange('status_update');
        return result;
      };
    }
  }

  // 开始定期检查
  startPeriodicCheck() {
    // 每5秒检查一次权限状态
    this.checkInterval = setInterval(() => {
      this.checkPermissions('periodic');
    }, 5000);
  }

  // 监听页面可见性变化
  monitorPageVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // 页面变为可见时检查权限
        setTimeout(() => {
          this.checkPermissions('visibility');
        }, 100);
      }
    });
  }

  // 监听存储变化
  monitorStorageChanges() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'currentUser' || e.key?.startsWith('user_')) {
        this.handleUserChange('storage');
      }
    });
  }

  // 执行初始权限检查
  performInitialCheck() {
    setTimeout(() => {
      this.checkPermissions('initial');
    }, 500);
  }

  // 执行基本安全检查（当auth未加载时）
  performBasicSecurityCheck() {
    console.warn('⚠️ 执行基本安全检查（auth模块未加载）');
    
    // 检查sessionStorage中的用户信息
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      if (!storedUser) {
        this.redirectToHome('未找到用户登录信息');
        return;
      }
      
      const user = JSON.parse(storedUser);
      if (!user || user.role !== 'admin') {
        this.redirectToHome('用户权限不足');
        return;
      }
    } catch (error) {
      console.error('❌ 基本安全检查失败:', error);
      this.redirectToHome('权限验证失败');
    }
  }

  // 处理用户变化
  handleUserChange(source) {
    console.log(`🔄 检测到用户状态变化 (${source})`);
    
    // 延迟检查，确保状态已完全更新
    setTimeout(() => {
      this.checkPermissions(source);
    }, 100);
  }

  // 检查权限
  checkPermissions(source = 'manual') {
    try {
      // 获取当前用户信息
      const currentUser = this.getCurrentUser();

      // 检查用户是否发生变化
      const userChanged = this.hasUserChanged(currentUser);

      if (userChanged || source === 'initial') {
        console.log(`🔍 权限检查 (${source}):`, {
          currentUser: currentUser?.username || 'none',
          role: currentUser?.role || 'none',
          isAdmin: currentUser?.role === 'admin',
          pageUrl: window.location.href
        });
      }

      // 更新当前用户记录
      this.currentUser = currentUser;
      this.lastUserCheck = Date.now();

      // 执行多层安全检查
      const securityChecks = [
        () => this.checkUserLogin(currentUser),
        () => this.checkAdminRole(currentUser),
        () => this.checkSessionValidity(currentUser),
        () => this.checkPageAccess(currentUser)
      ];

      for (const check of securityChecks) {
        const result = check();
        if (!result.passed) {
          this.redirectToHome(result.reason);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ 权限检查失败:', error);
      this.redirectToHome('权限验证过程出错');
      return false;
    }
  }

  // 检查用户登录状态
  checkUserLogin(user) {
    if (!user) {
      return { passed: false, reason: '用户未登录' };
    }
    return { passed: true };
  }

  // 检查管理员角色
  checkAdminRole(user) {
    if (!user || user.role !== 'admin') {
      return {
        passed: false,
        reason: user ? `用户权限不足 (当前角色: ${user.role})` : '用户角色验证失败'
      };
    }
    return { passed: true };
  }

  // 检查会话有效性
  checkSessionValidity(user) {
    try {
      // 检查sessionStorage中的数据一致性
      const storedUser = sessionStorage.getItem('currentUser');
      if (!storedUser) {
        return { passed: false, reason: '会话已过期' };
      }

      const sessionUser = JSON.parse(storedUser);
      if (!sessionUser || sessionUser.username !== user.username || sessionUser.role !== user.role) {
        return { passed: false, reason: '会话数据不一致' };
      }

      return { passed: true };
    } catch (error) {
      return { passed: false, reason: '会话验证失败' };
    }
  }

  // 检查页面访问权限
  checkPageAccess(user) {
    const currentPage = window.location.pathname.split('/').pop();

    // 特定页面的额外权限检查
    if (currentPage.includes('user-management') && !this.canManageUsers(user)) {
      return { passed: false, reason: '无用户管理权限' };
    }

    if (currentPage.includes('admin-dashboard') && !this.canAccessDashboard(user)) {
      return { passed: false, reason: '无仪表板访问权限' };
    }

    return { passed: true };
  }

  // 检查用户管理权限
  canManageUsers(user) {
    return user && user.role === 'admin';
  }

  // 检查仪表板访问权限
  canAccessDashboard(user) {
    return user && user.role === 'admin';
  }

  // 获取当前用户信息
  getCurrentUser() {
    // 优先从auth模块获取
    if (auth && auth.currentUser) {
      return auth.currentUser;
    }
    
    // 从sessionStorage获取
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (error) {
      console.warn('⚠️ 从sessionStorage获取用户信息失败:', error);
    }
    
    return null;
  }

  // 检查用户是否发生变化
  hasUserChanged(currentUser) {
    if (!this.currentUser && !currentUser) return false;
    if (!this.currentUser || !currentUser) return true;
    
    return this.currentUser.username !== currentUser.username ||
           this.currentUser.role !== currentUser.role;
  }

  // 检查是否有管理员权限（保留向后兼容）
  hasAdminPermission(user) {
    return user && user.role === 'admin';
  }

  // 重定向到主页
  redirectToHome(reason) {
    console.warn(`🚨 权限不足，重定向到主页: ${reason}`);

    // 记录安全事件
    this.logSecurityEvent(reason);

    // 清理敏感内容
    this.clearSensitiveContent();

    // 清理用户会话
    this.clearUserSession();

    // 显示提示信息
    this.showSecurityMessage(reason);

    // 延迟重定向，让用户看到提示信息
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }

  // 记录安全事件
  logSecurityEvent(reason) {
    try {
      const event = {
        timestamp: new Date().toISOString(),
        page: window.location.href,
        reason: reason,
        userAgent: navigator.userAgent,
        currentUser: this.currentUser?.username || 'unknown'
      };

      console.warn('🔒 安全事件记录:', event);

      // 可以在这里添加发送到服务器的逻辑
      // 或者保存到本地存储用于审计
      const securityLog = JSON.parse(localStorage.getItem('security_log') || '[]');
      securityLog.push(event);

      // 只保留最近50条记录
      if (securityLog.length > 50) {
        securityLog.splice(0, securityLog.length - 50);
      }

      localStorage.setItem('security_log', JSON.stringify(securityLog));
    } catch (error) {
      console.error('❌ 安全事件记录失败:', error);
    }
  }

  // 清理用户会话
  clearUserSession() {
    try {
      // 清理sessionStorage
      sessionStorage.removeItem('currentUser');

      // 清理auth模块的当前用户
      if (auth) {
        auth.currentUser = null;
      }

      console.log('🧹 用户会话已清理');
    } catch (error) {
      console.error('❌ 清理用户会话失败:', error);
    }
  }

  // 清理敏感内容
  clearSensitiveContent() {
    try {
      // 隐藏管理员面板
      const adminPanel = document.getElementById('adminPanel');
      if (adminPanel) {
        adminPanel.style.display = 'none';
      }
      
      // 隐藏用户管理内容
      const managementContainer = document.querySelector('.management-container');
      if (managementContainer) {
        managementContainer.style.display = 'none';
      }
      
      // 隐藏仪表板内容
      const dashboardContainer = document.querySelector('.dashboard-container');
      if (dashboardContainer) {
        dashboardContainer.style.display = 'none';
      }
      
      // 清空敏感的DOM内容
      const sensitiveSelectors = [
        '#usersList',
        '#fileListContent', 
        '#adminFileManagerContainer',
        '.admin-content',
        '.stats-grid'
      ];
      
      sensitiveSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          element.innerHTML = '';
        }
      });
      
      console.log('🧹 敏感内容已清理');
    } catch (error) {
      console.error('❌ 清理敏感内容失败:', error);
    }
  }

  // 显示安全提示信息
  showSecurityMessage(reason) {
    // 创建提示框
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      border: 2px solid #dc3545;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      text-align: center;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    `;
    
    messageDiv.innerHTML = `
      <div style="color: #dc3545; font-size: 48px; margin-bottom: 15px;">🔒</div>
      <h3 style="color: #dc3545; margin-bottom: 15px;">权限验证失败</h3>
      <p style="color: #666; margin-bottom: 20px;">${reason}</p>
      <p style="color: #666; font-size: 14px;">正在重定向到主页...</p>
    `;
    
    document.body.appendChild(messageDiv);
    
    // 3秒后移除提示框
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 3000);
  }

  // 销毁安全管理器
  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.initialized = false;
    console.log('🔒 权限安全管理器已销毁');
  }
}

// 创建全局实例
window.permissionSecurityManager = new PermissionSecurityManager();

// 页面加载时自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.permissionSecurityManager.init();
  });
} else {
  window.permissionSecurityManager.init();
}

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  if (window.permissionSecurityManager) {
    window.permissionSecurityManager.destroy();
  }
});

console.log('🔒 权限安全管理器模块已加载');
