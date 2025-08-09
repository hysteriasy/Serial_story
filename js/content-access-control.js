// 内容访问控制系统 - 在各页面实现权限验证
class ContentAccessControl {
  constructor() {
    this.initialized = false;
    this.accessCache = new Map(); // 缓存访问结果
    this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存过期
  }

  // 初始化访问控制
  async initialize() {
    if (this.initialized) return;

    try {
      // 等待权限系统初始化
      if (!window.filePermissionsSystem) {
        console.warn('文件权限系统未初始化，等待加载...');
        await this.waitForPermissionsSystem();
      }

      this.initialized = true;
      console.log('✅ 内容访问控制系统已初始化');
    } catch (error) {
      console.error('❌ 内容访问控制系统初始化失败:', error);
    }
  }

  // 等待权限系统加载
  waitForPermissionsSystem(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkSystem = () => {
        if (window.filePermissionsSystem) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('权限系统加载超时'));
        } else {
          setTimeout(checkSystem, 100);
        }
      };
      
      checkSystem();
    });
  }

  // 过滤内容列表，只显示有权限的内容
  async filterContentList(contentList, contentType = 'work') {
    if (!this.initialized) {
      await this.initialize();
    }

    const filteredContent = [];
    
    for (const content of contentList) {
      try {
        const hasAccess = await this.checkContentAccess(content, contentType);
        if (hasAccess.hasAccess) {
          // 添加访问级别信息
          content._accessLevel = hasAccess.level;
          content._accessReason = hasAccess.reason;
          filteredContent.push(content);
        }
      } catch (error) {
        console.warn(`检查内容访问权限失败 (${content.id || content.title}):`, error);
        // 出错时默认不显示
      }
    }

    return filteredContent;
  }

  // 检查单个内容的访问权限
  async checkContentAccess(content, contentType = 'work') {
    try {
      // 生成缓存键
      const cacheKey = this.generateCacheKey(content, contentType);
      
      // 检查缓存
      const cached = this.accessCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.result;
      }

      // 获取内容权限设置
      const permissions = await this.getContentPermissions(content, contentType);
      
      // 检查访问权限
      const accessResult = await window.filePermissionsSystem.checkFileAccess(
        permissions,
        auth.currentUser
      );

      // 缓存结果
      this.accessCache.set(cacheKey, {
        result: accessResult,
        timestamp: Date.now()
      });

      return accessResult;
    } catch (error) {
      console.error('检查内容访问权限失败:', error);
      return {
        hasAccess: false,
        reason: 'Permission check failed',
        level: 'error'
      };
    }
  }

  // 获取内容权限设置
  async getContentPermissions(content, contentType) {
    try {
      // 如果内容已经包含权限信息
      if (content.permissions) {
        return content.permissions;
      }

      // 根据内容类型和ID获取权限
      const fileId = content.id || content.fileId || content.workId;
      const owner = content.owner || content.author || content.uploadedBy;

      if (fileId && owner) {
        return await window.filePermissionsSystem.getFilePermissions(fileId, owner);
      }

      // 如果没有明确的权限设置，根据内容属性推断
      return this.inferPermissionsFromContent(content);
    } catch (error) {
      console.error('获取内容权限失败:', error);
      // 默认返回私有权限
      return window.filePermissionsSystem.createPermissionStructure('private');
    }
  }

  // 从内容属性推断权限设置
  inferPermissionsFromContent(content) {
    // 检查是否有明确的可见性设置
    if (content.visibility) {
      const level = content.visibility === 'public' ? 'public' :
                   content.visibility === 'friends' ? 'friend' :
                   content.visibility === 'private' ? 'private' :
                   content.visibility === 'visitor' ? 'visitor' : 'friend';
      return window.filePermissionsSystem.createPermissionStructure(level);
    }

    // 检查是否有isPublic标志
    if (content.hasOwnProperty('isPublic')) {
      const level = content.isPublic ? 'public' : 'friend'; // 默认为好友可见而不是私有
      return window.filePermissionsSystem.createPermissionStructure(level);
    }

    // 检查是否有权限级别设置
    if (content.permissionLevel) {
      return window.filePermissionsSystem.createPermissionStructure(content.permissionLevel);
    }

    // 默认为好友可见（访客和好友都可以查看）
    return window.filePermissionsSystem.createPermissionStructure('friend');
  }

  // 生成缓存键
  generateCacheKey(content, contentType) {
    const contentId = content.id || content.fileId || content.workId || content.title;
    const userId = auth.currentUser ? auth.currentUser.username : 'anonymous';
    return `${contentType}_${contentId}_${userId}`;
  }

  // 清除访问缓存
  clearAccessCache() {
    this.accessCache.clear();
    console.log('访问权限缓存已清除');
  }

  // 清除特定内容的缓存
  clearContentCache(content, contentType = 'work') {
    const cacheKey = this.generateCacheKey(content, contentType);
    this.accessCache.delete(cacheKey);
  }

  // 检查用户是否可以查看内容详情
  async canViewContentDetails(content, contentType = 'work') {
    const accessResult = await this.checkContentAccess(content, contentType);
    return accessResult.hasAccess;
  }

  // 检查用户是否可以评论内容
  async canCommentOnContent(content, contentType = 'work') {
    const accessResult = await this.checkContentAccess(content, contentType);
    
    if (!accessResult.hasAccess) {
      return false;
    }

    // 检查特殊权限设置
    const permissions = await this.getContentPermissions(content, contentType);
    if (permissions.level === 'custom') {
      return permissions.customAccess?.specialPermissions?.allowComments !== false;
    }

    // 默认允许评论（如果有访问权限）
    return true;
  }

  // 检查用户是否可以下载内容
  async canDownloadContent(content, contentType = 'work') {
    const accessResult = await this.checkContentAccess(content, contentType);
    
    if (!accessResult.hasAccess) {
      return false;
    }

    // 检查特殊权限设置
    const permissions = await this.getContentPermissions(content, contentType);
    if (permissions.level === 'custom') {
      return permissions.customAccess?.specialPermissions?.allowDownload !== false;
    }

    // 默认允许下载（如果有访问权限）
    return true;
  }

  // 检查用户是否可以分享内容
  async canShareContent(content, contentType = 'work') {
    const accessResult = await this.checkContentAccess(content, contentType);
    
    if (!accessResult.hasAccess) {
      return false;
    }

    // 检查特殊权限设置
    const permissions = await this.getContentPermissions(content, contentType);
    if (permissions.level === 'custom') {
      return permissions.customAccess?.specialPermissions?.allowShare !== false;
    }

    // 默认允许分享（如果有访问权限）
    return true;
  }

  // 为内容元素添加访问控制
  async applyAccessControlToElement(element, content, contentType = 'work') {
    try {
      const accessResult = await this.checkContentAccess(content, contentType);
      
      if (!accessResult.hasAccess) {
        // 隐藏或替换内容
        this.hideRestrictedContent(element, accessResult.reason);
        return false;
      }

      // 添加访问级别标识
      element.setAttribute('data-access-level', accessResult.level);
      element.classList.add(`access-${accessResult.level}`);

      // 检查并控制特殊功能
      await this.controlSpecialFeatures(element, content, contentType);
      
      return true;
    } catch (error) {
      console.error('应用访问控制失败:', error);
      this.hideRestrictedContent(element, 'Access control error');
      return false;
    }
  }

  // 隐藏受限内容
  hideRestrictedContent(element, reason) {
    element.innerHTML = `
      <div class="restricted-content">
        <div class="restricted-icon">🔒</div>
        <h4>内容受限</h4>
        <p>${this.getReasonMessage(reason)}</p>
        ${!auth.currentUser ? '<p><a href="#" onclick="userStatusManager.showLoginModal()">登录</a>以查看更多内容</p>' : ''}
      </div>
    `;
    element.classList.add('content-restricted');
  }

  // 获取限制原因的友好消息
  getReasonMessage(reason) {
    const messages = {
      'Login required': '此内容需要登录后查看',
      'Insufficient role level': '您的权限级别不足以查看此内容',
      'User is blacklisted': '您被限制访问此内容',
      'User not in whitelist': '此内容仅对特定用户开放',
      'Access expired': '此内容的访问权限已过期',
      'View limit exceeded': '此内容的查看次数已达上限',
      'Custom access denied by default': '此内容采用自定义权限控制',
      'Permission check failed': '权限检查失败，请稍后重试'
    };
    
    return messages[reason] || '您没有权限查看此内容';
  }

  // 控制特殊功能（评论、下载、分享等）
  async controlSpecialFeatures(element, content, contentType) {
    // 控制评论功能
    const commentButtons = element.querySelectorAll('.comment-btn, .add-comment');
    const canComment = await this.canCommentOnContent(content, contentType);
    commentButtons.forEach(btn => {
      if (!canComment) {
        btn.style.display = 'none';
      }
    });

    // 控制下载功能
    const downloadButtons = element.querySelectorAll('.download-btn, .download-link');
    const canDownload = await this.canDownloadContent(content, contentType);
    downloadButtons.forEach(btn => {
      if (!canDownload) {
        btn.style.display = 'none';
      }
    });

    // 控制分享功能
    const shareButtons = element.querySelectorAll('.share-btn, .share-link');
    const canShare = await this.canShareContent(content, contentType);
    shareButtons.forEach(btn => {
      if (!canShare) {
        btn.style.display = 'none';
      }
    });
  }

  // 批量应用访问控制
  async applyBatchAccessControl(elements, contents, contentType = 'work') {
    const promises = elements.map((element, index) => {
      const content = contents[index];
      if (content) {
        return this.applyAccessControlToElement(element, content, contentType);
      }
      return Promise.resolve(false);
    });

    return await Promise.all(promises);
  }

  // 监听用户登录状态变化
  onUserStatusChange() {
    // 清除缓存，重新检查权限
    this.clearAccessCache();
    
    // 触发页面内容重新加载
    if (typeof refreshPageContent === 'function') {
      refreshPageContent();
    }
  }
}

// 添加内容访问控制样式
function addAccessControlStyles() {
  if (document.getElementById('accessControlStyles')) return;

  const style = document.createElement('style');
  style.id = 'accessControlStyles';
  style.textContent = `
    /* 受限内容样式 */
    .content-restricted {
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      color: #6c757d;
    }

    .restricted-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .restricted-icon {
      font-size: 3rem;
      opacity: 0.5;
    }

    .restricted-content h4 {
      margin: 0;
      color: #495057;
      font-size: 1.25rem;
    }

    .restricted-content p {
      margin: 0;
      color: #6c757d;
      line-height: 1.5;
    }

    .restricted-content a {
      color: #007bff;
      text-decoration: none;
      font-weight: 500;
    }

    .restricted-content a:hover {
      text-decoration: underline;
    }

    /* 访问级别标识 */
    .access-public::before {
      content: "🌍";
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: #28a745;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .access-visitor::before {
      content: "👤";
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: #007bff;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .access-friend::before {
      content: "👥";
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: #fd7e14;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .access-custom::before {
      content: "⚙️";
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: #6f42c1;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    /* 确保父容器有相对定位 */
    .work-item,
    .content-item,
    .post-item {
      position: relative;
    }

    /* 加载状态 */
    .access-checking {
      opacity: 0.6;
      pointer-events: none;
    }

    .access-checking::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  document.head.appendChild(style);
}

// 自动添加样式
addAccessControlStyles();

// 创建全局实例
window.contentAccessControl = new ContentAccessControl();

// 监听用户状态变化
if (typeof auth !== 'undefined') {
  // 如果auth已经加载，立即绑定事件
  const originalLogin = auth.login;
  const originalLogout = auth.logout;
  
  auth.login = async function(...args) {
    const result = await originalLogin.apply(this, args);
    window.contentAccessControl.onUserStatusChange();
    return result;
  };
  
  auth.logout = function(...args) {
    const result = originalLogout.apply(this, args);
    window.contentAccessControl.onUserStatusChange();
    return result;
  };
} else {
  // 如果auth还未加载，等待加载后绑定
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof auth !== 'undefined') {
        const originalLogin = auth.login;
        const originalLogout = auth.logout;
        
        auth.login = async function(...args) {
          const result = await originalLogin.apply(this, args);
          window.contentAccessControl.onUserStatusChange();
          return result;
        };
        
        auth.logout = function(...args) {
          const result = originalLogout.apply(this, args);
          window.contentAccessControl.onUserStatusChange();
          return result;
        };
      }
    }, 1000);
  });
}
