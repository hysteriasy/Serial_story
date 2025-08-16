// 诗歌展示模块
class PoetryDisplay {
  constructor() {
    this.poetryData = [];
    this.currentFilter = 'all';
    this.lastUserState = null; // 用户状态监听
    this.init();
  }

  async init() {
    console.log('🔄 初始化诗歌展示模块...');

    try {
      // 初始化权限控制系统
      await this.initializePermissionSystems();

      await this.loadPoetryData();
      this.setupFilters();
      this.renderPoetry();

      // 启动用户状态监听
      this.startUserStateMonitoring();

      console.log('✅ 诗歌展示模块初始化完成');
    } catch (error) {
      console.error('❌ 诗歌展示模块初始化失败:', error);
      this.showError();
    }
  }

  // 加载诗歌数据
  async loadPoetryData() {
    this.poetryData = [];

    try {
      // 在file://协议下，直接使用传统方法避免CORS问题
      if (window.location.protocol === 'file:') {
        console.log('📁 file://协议下直接使用传统方法');

        // 从本地存储获取诗歌作品
        const localPoetry = this.getLocalPoetry();
        this.poetryData.push(...localPoetry);

        // 如果Firebase可用，也从Firebase获取
        if (window.firebaseAvailable && firebase.apps.length) {
          try {
            const firebasePoetry = await this.getFirebasePoetry();
            this.poetryData.push(...firebasePoetry);
          } catch (error) {
            console.warn('从Firebase获取诗歌失败:', error);
          }
        }

        // 去重并按时间排序
        this.poetryData = this.removeDuplicates(this.poetryData);
        this.poetryData.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

        console.log(`📚 加载了 ${this.poetryData.length} 首诗歌`);
        return;
      }

      // 优先使用智能文件加载器
      if (window.smartFileLoader) {
        const files = await window.smartFileLoader.loadFileList('poetry');

        if (files && files.length > 0) {
          console.log(`✅ 智能加载器加载了 ${files.length} 首诗歌`);

          // 处理智能加载器返回的数据
          const poetry = files.map(file => {
            // 提取标题
            let title = file.title || file.name || '无标题';

            // 如果标题包含文件扩展名，去除它
            if (title.endsWith('.json')) {
              title = title.replace('.json', '');
            }

            // 如果标题包含时间戳，尝试提取更友好的标题
            const timestampMatch = title.match(/^(\d{4}-\d{2}-\d{2})_(.+)_(\d+)$/);
            if (timestampMatch) {
              title = timestampMatch[2] || title;
            }

            // 处理从user-uploads目录加载的数据
            const processedFile = {
              id: file.id,
              title: title,
              content: file.content || '',
              poetryType: file.poetryType || 'modern',
              author: file.author || file.username || file.uploadedBy || '匿名',
              uploadTime: file.uploadTime || file.date || file.created_at || new Date().toISOString(),
              permissions: file.permissions || { isPublic: true },
              source: file.source || 'unknown',
              filePath: file.filePath // 保存文件路径用于后续操作
            };

            // 如果是从GitHub uploads加载的，确保数据完整性
            if (file.source === 'github_uploads') {
              processedFile.source = 'github_uploads';
              // 确保有正确的作者信息
              if (!processedFile.author || processedFile.author === '匿名') {
                // 尝试从文件路径提取作者信息
                const pathMatch = file.filePath?.match(/user-uploads\/[^\/]+\/[^\/]+\/([^\/]+)\//);
                if (pathMatch) {
                  processedFile.author = pathMatch[1];
                }
              }
            }

            return processedFile;
          });

          this.poetryData.push(...poetry);

          // 调试信息：显示加载的数据结构
          console.log('📊 智能加载器返回的诗歌数据:', poetry.map(poem => ({
            id: poem.id,
            title: poem.title,
            author: poem.author,
            source: poem.source
          })));
        }
      }

      // 回退到传统方法
      if (this.poetryData.length === 0) {
        console.log('📁 回退到传统加载方法');

        // 从本地存储获取诗歌作品
        const localPoetry = this.getLocalPoetry();
        this.poetryData.push(...localPoetry);

        // 如果Firebase可用，也从Firebase获取
        if (window.firebaseAvailable && firebase.apps.length) {
          try {
            const firebasePoetry = await this.getFirebasePoetry();
            this.poetryData.push(...firebasePoetry);
          } catch (error) {
            console.warn('从Firebase获取诗歌失败:', error);
          }
        }
      }

      // 去重并按时间排序
      const allPoetry = this.removeDuplicates(this.poetryData);
      allPoetry.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

      console.log(`📚 原始加载了 ${allPoetry.length} 首诗歌`);

      // 应用权限过滤
      this.poetryData = await this.filterPoetryByPermissions(allPoetry);

      console.log(`📚 权限过滤后显示 ${this.poetryData.length}/${allPoetry.length} 首诗歌`);
    } catch (error) {
      console.error('加载诗歌数据失败:', error);
      throw error;
    }
  }

  // 从本地存储获取诗歌
  getLocalPoetry() {
    const poetry = [];

    try {
      // 获取公共诗歌作品
      const publicWorks = localStorage.getItem('publicWorks_literature');
      if (publicWorks) {
        const worksList = JSON.parse(publicWorks);
        
        worksList.forEach(workRef => {
          if (workRef.subcategory === 'poetry') {
            const fullWorkData = localStorage.getItem(`work_${workRef.id}`);
            if (fullWorkData) {
              const workInfo = JSON.parse(fullWorkData);
              if (workInfo.permissions?.isPublic) {
                poetry.push(this.formatPoetryData(workInfo));
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('从本地存储获取诗歌失败:', error);
    }

    return poetry;
  }

  // 从Firebase获取诗歌
  async getFirebasePoetry() {
    const poetry = [];

    try {
      // 从公共文件列表获取
      const publicSnapshot = await firebase.database().ref('publicFiles/literature').once('value');
      const publicData = publicSnapshot.val() || {};
      
      Object.values(publicData).forEach(work => {
        if (work.subcategory === 'poetry' && work.permissions?.isPublic) {
          poetry.push(this.formatPoetryData(work));
        }
      });
    } catch (error) {
      console.error('从Firebase获取诗歌失败:', error);
    }

    return poetry;
  }

  // 格式化诗歌数据
  formatPoetryData(workInfo) {
    return {
      id: workInfo.id,
      title: workInfo.title,
      content: workInfo.content,
      poetryType: workInfo.poetryType || 'modern',
      author: workInfo.uploadedBy || '匿名',
      uploadTime: workInfo.uploadTime,
      permissions: workInfo.permissions
    };
  }

  // 去重
  removeDuplicates(poetry) {
    const seen = new Set();
    return poetry.filter(poem => {
      const key = `${poem.author}_${poem.title}_${poem.uploadTime}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // 设置筛选器
  setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        // 更新按钮状态
        filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // 更新筛选器
        this.currentFilter = e.target.dataset.type;
        this.renderPoetry();
      });
    });
  }

  // 渲染诗歌
  renderPoetry() {
    const loadingElement = document.getElementById('loading');
    const gridElement = document.getElementById('poetryGrid');
    const noPoetryElement = document.getElementById('noPoetry');

    // 隐藏加载状态
    loadingElement.style.display = 'none';

    // 筛选诗歌
    let filteredPoetry = this.poetryData;
    if (this.currentFilter !== 'all') {
      filteredPoetry = this.poetryData.filter(poem => poem.poetryType === this.currentFilter);
    }

    if (filteredPoetry.length === 0) {
      gridElement.style.display = 'none';
      noPoetryElement.style.display = 'block';
      return;
    }

    // 显示诗歌网格
    noPoetryElement.style.display = 'none';
    gridElement.style.display = 'grid';

    // 渲染诗歌卡片
    gridElement.innerHTML = filteredPoetry.map(poem => this.createPoetryCard(poem)).join('');

    // 为诗歌卡片添加点击事件
    this.addPoetryCardEvents();
  }

  // 创建诗歌卡片
  createPoetryCard(poem) {
    const typeLabel = poem.poetryType === 'modern' ? '现代诗' : '古体诗词';
    const formattedDate = this.formatDate(poem.uploadTime);

    // 检查是否显示管理按钮
    const showManagementButtons = this.shouldShowManagementButtons(poem);
    const managementButtons = showManagementButtons ? `
      <div class="poetry-management">
        <button class="edit-btn" onclick="poetryDisplay.editPoetry('${poem.id}')" title="编辑诗歌">
          ✏️ 编辑
        </button>
        <button class="delete-btn" onclick="poetryDisplay.deletePoetry('${poem.id}')" title="删除诗歌">
          🗑️ 删除
        </button>
      </div>
    ` : '';

    // 添加权限级别标识
    const permissionIcon = this.getPermissionIcon(poem._accessLevel);
    const permissionDescription = this.getPermissionDescription(poem._accessLevel, poem._accessReason);

    return `
      <div class="poetry-card" data-type="${poem.poetryType}" data-id="${poem.id}" ${poem._accessLevel ? `data-access-level="${poem._accessLevel}"` : ''}>
        <div class="poetry-meta">
          <span class="poetry-type">${typeLabel}</span>
          <span class="poetry-date">${formattedDate}</span>
          <span class="poetry-source" title="数据源: ${poem.source || 'unknown'}">${getSourceIcon(poem.source)}</span>
          ${poem._accessLevel ? `<span class="poetry-permission" title="${permissionDescription}">${permissionIcon}</span>` : ''}
        </div>
        <h3 class="poetry-title">${this.escapeHtml(poem.title)}</h3>
        <div class="poetry-content">${this.formatPoetryContent(poem.content)}</div>
        <div class="poetry-author">—— ${this.escapeHtml(poem.author)}</div>
        ${managementButtons}
      </div>
    `;
  }

  // 为诗歌卡片添加点击事件
  addPoetryCardEvents() {
    const poetryCards = document.querySelectorAll('.poetry-card');
    poetryCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // 如果点击的是管理按钮，不触发详情显示
        if (e.target.closest('.poetry-management')) {
          return;
        }

        const poetryId = card.dataset.id;
        this.showPoetryDetail(poetryId);
      });
    });
  }

  // 显示诗歌详情
  showPoetryDetail(poetryId) {
    const poem = this.poetryData.find(p => p.id === poetryId);
    if (!poem) return;

    // 创建或更新详情模态框
    this.createDetailModal(poem);

    // 初始化评论系统
    if (typeof commentSystem !== 'undefined') {
      commentSystem.init(poetryId, 'poetry');
    }
  }

  // 创建详情模态框
  createDetailModal(poem) {
    // 移除现有模态框
    const existingModal = document.getElementById('poetryDetailModal');
    if (existingModal) {
      existingModal.remove();
    }

    const typeLabel = poem.poetryType === 'modern' ? '现代诗' : '古体诗词';
    const formattedDate = this.formatDate(poem.uploadTime);

    const modal = document.createElement('div');
    modal.id = 'poetryDetailModal';
    modal.className = 'poetry-detail-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="poetryDisplay.closeDetailModal()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">${this.escapeHtml(poem.title)}</h2>
          <button class="modal-close" onclick="poetryDisplay.closeDetailModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="poetry-detail-meta">
            <span class="poetry-type">${typeLabel}</span>
            <span class="poetry-date">${formattedDate}</span>
            <span class="poetry-author">作者：${this.escapeHtml(poem.author)}</span>
          </div>
          <div class="poetry-detail-content">
            ${this.formatPoetryContent(poem.content)}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 添加样式
    this.addModalStyles();

    // 显示模态框
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  }

  // 关闭详情模态框
  closeDetailModal() {
    const modal = document.getElementById('poetryDetailModal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  }

  // 添加模态框样式
  addModalStyles() {
    if (document.getElementById('poetryModalStyles')) return;

    const style = document.createElement('style');
    style.id = 'poetryModalStyles';
    style.textContent = `
      .poetry-detail-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      .poetry-detail-modal.show {
        opacity: 1;
        visibility: visible;
      }

      .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        cursor: pointer;
      }

      .modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        max-width: 600px;
        max-height: 80vh;
        width: 90%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e9ecef;
        background: #f8f9fa;
      }

      .modal-title {
        margin: 0;
        font-size: 1.5rem;
        color: #333;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 2rem;
        cursor: pointer;
        color: #6c757d;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.3s ease;
      }

      .modal-close:hover {
        background: #e9ecef;
        color: #333;
      }

      .modal-body {
        padding: 1.5rem;
        overflow-y: auto;
        flex: 1;
      }

      .poetry-detail-meta {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }

      .poetry-detail-meta .poetry-type {
        background: #007bff;
        color: white;
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 500;
      }

      .poetry-detail-meta .poetry-date,
      .poetry-detail-meta .poetry-author {
        color: #6c757d;
        font-size: 0.9rem;
      }

      .poetry-detail-content {
        line-height: 2;
        font-size: 1.1rem;
        color: #333;
        white-space: pre-line;
        text-align: center;
        padding: 1rem 0;
      }

      @media (max-width: 768px) {
        .modal-content {
          width: 95%;
          max-height: 90vh;
        }

        .modal-header {
          padding: 1rem;
        }

        .modal-body {
          padding: 1rem;
        }

        .modal-title {
          font-size: 1.2rem;
        }

        .poetry-detail-content {
          font-size: 1rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // 格式化诗歌内容
  formatPoetryContent(content) {
    if (!content) return '';
    
    // 简单的格式化处理
    return this.escapeHtml(content)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '未知时间';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return '未知时间';
    }
  }

  // HTML转义
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 显示错误
  showError() {
    const loadingElement = document.getElementById('loading');
    const gridElement = document.getElementById('poetryGrid');
    const noPoetryElement = document.getElementById('noPoetry');

    loadingElement.style.display = 'none';
    gridElement.style.display = 'none';
    noPoetryElement.style.display = 'block';

    noPoetryElement.innerHTML = `
      <div class="icon">❌</div>
      <h3>加载失败</h3>
      <p>无法加载诗歌作品，请刷新页面重试。</p>
    `;
  }

  // 检查是否应该显示管理按钮
  shouldShowManagementButtons(poem) {
    // 确保auth对象已加载并检查登录状态
    if (typeof auth !== 'undefined') {
      // 如果auth.currentUser为空，尝试从sessionStorage恢复登录状态
      if (!auth.currentUser) {
        console.log('🔄 Poetry: auth.currentUser为空，尝试恢复登录状态...');
        auth.checkAuthStatus();
      }

      if (auth.currentUser) {
        console.log(`🔐 Poetry: 检查管理按钮权限 - 用户: ${auth.currentUser.username} (${auth.currentUser.role}), 作品作者: ${poem.author}`);

        // 管理员可以管理所有用户的作品
        if (auth.isAdmin && auth.isAdmin()) {
          console.log('✅ Poetry: 管理员用户，对所有作品显示管理按钮');
          return true;
        }

        // 作品作者可以管理自己的作品
        if (poem.author === auth.currentUser.username) {
          console.log('✅ Poetry: 作品作者，显示管理按钮');
          return true;
        }

        // 好友可以管理自己的作品
        if (auth.isFriend && auth.isFriend() && poem.author === auth.currentUser.username) {
          console.log('✅ Poetry: 好友管理自己的作品，显示管理按钮');
          return true;
        }

        console.log('❌ Poetry: 用户无权限管理此作品');
      } else {
        console.log('❌ Poetry: 用户未登录，不显示管理按钮');
      }
    } else {
      console.log('❌ Poetry: auth对象未定义');
    }

    return false;
  }

  // 检查用户是否可以管理指定作品
  canManageWork(workAuthor, action) {
    // 确保auth对象已加载并检查登录状态
    if (typeof auth !== 'undefined') {
      // 如果auth.currentUser为空，尝试从sessionStorage恢复登录状态
      if (!auth.currentUser) {
        console.log('🔄 Poetry: auth.currentUser为空，尝试恢复登录状态...');
        auth.checkAuthStatus();
      }

      if (auth.currentUser) {
        console.log(`🔐 Poetry: 检查用户权限: ${auth.currentUser.username} (${auth.currentUser.role}) 对作品作者 ${workAuthor} 的${action}权限`);

        // 管理员可以管理所有用户的作品
        if (auth.isAdmin && auth.isAdmin()) {
          console.log('✅ Poetry: 管理员用户，对所有作品拥有完全控制权限');
          return true;
        }

        // 作品作者可以管理自己的作品
        if (auth.currentUser.username === workAuthor) {
          console.log('✅ Poetry: 作品作者，可以管理自己的作品');
          return true;
        }

        // 好友可以编辑自己的作品，但不能删除其他人的作品
        if (action === '编辑' && auth.isFriend && auth.isFriend()) {
          if (auth.currentUser.username === workAuthor) {
            console.log('✅ Poetry: 好友用户，可以编辑自己的作品');
            return true;
          } else {
            console.log('⚠️ Poetry: 好友不能编辑其他人的作品');
            return false;
          }
        }

        console.log(`⚠️ Poetry: 用户 ${auth.currentUser.username} 没有对此作品的${action}权限`);
        return false;
      } else {
        console.log('⚠️ Poetry: 用户未登录');
        return false;
      }
    } else {
      console.log('⚠️ Poetry: auth对象未定义');
      return false;
    }
  }

  // 编辑诗歌
  async editPoetry(poetryId) {
    try {
      console.log('编辑诗歌:', poetryId);

      // 验证权限
      const hasPermission = await this.verifyPassword('编辑');
      if (!hasPermission) {
        this.showNotification('权限验证失败，操作终止', 'error');
        return;
      }

      // 找到要编辑的诗歌
      const poetry = this.poetryData.find(p => p.id === poetryId);
      if (!poetry) {
        this.showNotification('未找到要编辑的诗歌', 'error');
        return;
      }

      // 这里可以打开编辑模态框或跳转到编辑页面
      // 暂时使用简单的prompt进行演示
      const newTitle = prompt('请输入新标题:', poetry.title);
      if (newTitle === null) return; // 用户取消

      const newContent = prompt('请输入新内容:', poetry.content);
      if (newContent === null) return; // 用户取消

      // 更新诗歌数据
      await this.updatePoetryData(poetryId, { title: newTitle, content: newContent });

      this.showNotification('诗歌编辑成功！', 'success');

      // 重新加载数据
      await this.loadPoetryData();
      this.renderPoetry();

    } catch (error) {
      console.error('编辑诗歌时发生错误:', error);
      this.showNotification('编辑失败：' + error.message, 'error');
    }
  }

  // 删除诗歌
  async deletePoetry(poetryId) {
    try {
      console.log('删除诗歌:', poetryId);

      // 找到要删除的诗歌
      const poetry = this.poetryData.find(p => p.id === poetryId);
      if (!poetry) {
        this.showNotification('未找到要删除的诗歌', 'error');
        return;
      }

      const workAuthor = poetry.author || '未知作者';

      // 检查权限：管理员可以删除所有作品，作者可以删除自己的作品
      if (!this.canManageWork(workAuthor, '删除')) {
        // 如果没有直接权限，尝试密码验证
        const hasPermission = await this.verifyPassword('删除', workAuthor);
        if (!hasPermission) {
          this.showNotification('您没有权限删除此诗歌', 'error');
          return;
        }
      }

      if (!confirm(`确定要删除诗歌《${poetry.title}》吗？\n作者：${workAuthor}\n此操作不可撤销。`)) {
        console.log('Delete cancelled by user');
        return;
      }

      // 记录管理员操作日志
      if (auth.currentUser && auth.isAdmin() && auth.currentUser.username !== workAuthor) {
        console.log(`🔒 管理员 ${auth.currentUser.username} 删除了用户 ${workAuthor} 的诗歌《${poetry.title}》`);
        // 记录操作日志
        if (typeof adminLogger !== 'undefined') {
          adminLogger.logWorkManagement('delete', poetry, workAuthor);
        }
      }

      // 删除诗歌数据
      await this.deletePoetryData(poetryId);

      this.showNotification('诗歌删除成功！', 'success');

      // 更新首页统计数据
      if (typeof window.updateHomepageStats === 'function') {
        window.updateHomepageStats();
      }

      // 重新加载数据
      await this.loadPoetryData();
      this.renderPoetry();

    } catch (error) {
      console.error('删除诗歌时发生错误:', error);
      this.showNotification('删除失败：' + error.message, 'error');
    }
  }
  // 更新诗歌数据
  async updatePoetryData(poetryId, updateData) {
    try {
      // 更新本地存储中的数据
      const workKey = `work_${poetryId}`;
      const workData = localStorage.getItem(workKey);

      if (workData) {
        const work = JSON.parse(workData);
        Object.assign(work, updateData);
        work.lastModified = new Date().toISOString();
        localStorage.setItem(workKey, JSON.stringify(work));
        console.log('本地存储中的诗歌已更新');
      }

      // 如果Firebase可用，也更新Firebase中的数据
      if (window.firebaseAvailable && firebase.apps.length) {
        try {
          const updates = {
            ...updateData,
            lastModified: firebase.database.ServerValue.TIMESTAMP
          };
          await firebase.database().ref(`publicFiles/literature/${poetryId}`).update(updates);
          console.log('Firebase中的诗歌已更新');
        } catch (error) {
          console.warn('更新Firebase中的诗歌失败:', error);
        }
      }
    } catch (error) {
      console.error('更新诗歌数据失败:', error);
      throw error;
    }
  }

  // 删除诗歌数据
  async deletePoetryData(poetryId) {
    try {
      // 从本地存储删除
      const workKey = `work_${poetryId}`;
      localStorage.removeItem(workKey);

      // 从公共作品列表中移除
      const publicWorks = localStorage.getItem('publicWorks_literature');
      if (publicWorks) {
        const worksList = JSON.parse(publicWorks);
        const updatedList = worksList.filter(work => work.id !== poetryId);
        localStorage.setItem('publicWorks_literature', JSON.stringify(updatedList));
      }

      console.log('本地存储中的诗歌已删除');

      // 如果Firebase可用，也从Firebase删除
      if (window.firebaseAvailable && firebase.apps.length) {
        try {
          await firebase.database().ref(`publicFiles/literature/${poetryId}`).remove();
          console.log('Firebase中的诗歌已删除');
        } catch (error) {
          console.warn('删除Firebase中的诗歌失败:', error);
        }
      }
    } catch (error) {
      console.error('删除诗歌数据失败:', error);
      throw error;
    }
  }

  // 密码验证函数（保留用于向后兼容）
  async verifyPassword(action, workAuthor = null) {
    // 如果提供了作品作者信息，先检查权限
    if (workAuthor && this.canManageWork(workAuthor, action)) {
      return true;
    }

    // 确保auth对象已加载并检查登录状态
    if (typeof auth !== 'undefined') {
      // 如果auth.currentUser为空，尝试从sessionStorage恢复登录状态
      if (!auth.currentUser) {
        console.log('🔄 Poetry: auth.currentUser为空，尝试恢复登录状态...');
        auth.checkAuthStatus();
      }

      if (auth.currentUser) {
        console.log(`🔐 Poetry: 检查用户权限: ${auth.currentUser.username} (${auth.currentUser.role})`);

        // 检查管理员权限（管理员可以执行所有操作）
        if (auth.isAdmin && auth.isAdmin()) {
          console.log('✅ Poetry: 管理员用户，直接授权');
          console.log(`管理员用户 ${auth.currentUser.username} 已授权执行${action}操作`);
          return true;
        }

        // 检查好友权限（好友可以编辑，但不能删除）
        if (action === '编辑' && auth.isFriend && auth.isFriend()) {
          console.log('✅ Poetry: 好友用户，授权编辑操作');
          console.log(`好友用户 ${auth.currentUser.username} 已授权执行编辑操作`);
          return true;
        }

        // 检查特定权限
        if (auth.hasPermission) {
          const permissionMap = {
            '删除': 'delete',
            '编辑': 'edit'
          };

          const requiredPermission = permissionMap[action];
          if (requiredPermission && auth.hasPermission(requiredPermission)) {
            console.log(`✅ Poetry: 用户具有${action}权限，直接授权`);
            console.log(`用户 ${auth.currentUser.username} 已授权执行${action}操作`);
            return true;
          }
        }

        console.log(`⚠️ Poetry: 用户 ${auth.currentUser.username} 没有${action}权限，需要密码验证`);
      } else {
        console.log('⚠️ Poetry: 用户未登录，使用密码验证');
      }
    } else {
      console.log('⚠️ Poetry: auth对象未定义，使用密码验证');
    }

    // 对于已登录但权限不足的用户，提供更友好的提示
    if (typeof auth !== 'undefined' && auth.currentUser) {
      const message = `当前用户 ${auth.currentUser.username} 没有${action}权限。\n如需执行此操作，请输入管理员密码：`;
      const password = prompt(message);
      if (!password) {
        console.log('用户取消了密码输入');
        return false;
      }

      // 验证管理员密码
      try {
        // 使用auth模块的管理员密码验证
        if (auth.verifyAdminPassword) {
          await auth.verifyAdminPassword(password);
          console.log(`✅ 管理员密码验证通过，授权${action}操作`);
          return true;
        }
      } catch (error) {
        console.log(`❌ 管理员密码验证失败: ${error.message}`);
        alert(`密码验证失败: ${error.message}`);
        return false;
      }
    }

    // 回退到原有的密码验证机制（用于未登录用户或备用验证）
    const envKey = {
      '删除': 'VITE_ADMIN_PASSWORD',
      '编辑': 'VITE_EDITOR_PASSWORD'
    }[action];

    const password = prompt(`请输入${action}密码（请联系管理员获取）:`);
    if (!password) {
      console.log('用户取消了密码输入');
      return false;
    }

    // 从localStorage获取密码，如果没有则使用默认密码
    const storedPassword = localStorage.getItem(envKey);
    const defaultPassword = action === '删除' ? 'change_admin_password' : 'change_friend_password';
    const isValid = password === (storedPassword || defaultPassword);

    if (isValid) {
      console.log(`✅ 密码验证通过，授权${action}操作`);
    } else {
      console.log(`❌ 密码验证失败，拒绝${action}操作`);
    }

    return isValid;
  }

  // 显示通知
  showNotification(message, type = 'info') {
    // 移除现有通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // 创建新通知
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
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
      z-index: 10000;
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
}

// 全局变量，用于在HTML中调用
let poetryDisplay;

// 获取数据源图标
function getSourceIcon(source) {
    const icons = {
        'github': '🌐',
        'github_uploads': '📁', // GitHub用户上传文件
        'localStorage': '💾',
        'firebase': '🔥',
        'unknown': '❓'
    };
    return icons[source] || icons.unknown;
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
  // 确保auth对象已加载并检查登录状态
  if (typeof auth !== 'undefined') {
    auth.checkAuthStatus();
    if (auth.currentUser) {
      console.log(`📋 Poetry页面：当前登录用户 ${auth.currentUser.username} (${auth.currentUser.role})`);
    } else {
      console.log('📋 Poetry页面：当前未登录');
    }
  }

  poetryDisplay = new PoetryDisplay();
});

// 权限相关辅助函数
PoetryDisplay.prototype.initializePermissionSystems = async function() {
  try {
    // 初始化文件权限系统
    if (typeof FilePermissionsSystem !== 'undefined') {
      window.filePermissionsSystem = new FilePermissionsSystem();
      console.log('✅ Poetry: 文件权限系统初始化完成');
    } else {
      console.warn('⚠️ Poetry: FilePermissionsSystem 未找到');
    }

    // 初始化内容访问控制系统
    if (typeof ContentAccessControl !== 'undefined') {
      window.contentAccessControl = new ContentAccessControl();
      await window.contentAccessControl.initialize();
      console.log('✅ Poetry: 内容访问控制系统初始化完成');
    } else {
      console.warn('⚠️ Poetry: ContentAccessControl 未找到');
    }

    // 初始化白名单黑名单管理器
    if (typeof WhitelistBlacklistManager !== 'undefined') {
      window.whitelistBlacklistManager = new WhitelistBlacklistManager();
      console.log('✅ Poetry: 白名单黑名单管理器初始化完成');
    } else {
      console.warn('⚠️ Poetry: WhitelistBlacklistManager 未找到');
    }

  } catch (error) {
    console.error('❌ Poetry: 权限控制系统初始化失败:', error);
  }
};

// 根据用户权限过滤诗歌列表
PoetryDisplay.prototype.filterPoetryByPermissions = async function(poetry) {
  if (!poetry || poetry.length === 0) {
    return [];
  }

  console.log(`🔍 Poetry: 开始权限过滤，原始诗歌数量: ${poetry.length}`);

  // 确保内容访问控制系统已初始化
  if (!window.contentAccessControl) {
    console.warn('⚠️ Poetry: 内容访问控制系统未初始化，跳过权限过滤');
    return poetry;
  }

  try {
    // 为每首诗歌添加必要的权限检查字段
    const poetryWithPermissionData = poetry.map(poem => {
      // 确保诗歌有必要的权限相关字段
      return {
        ...poem,
        // 如果没有作者信息，尝试从其他字段获取
        author: poem.author || poem.uploadedBy || poem.owner || 'unknown',
        // 如果没有权限设置，根据内容推断默认权限
        permissions: poem.permissions || this.inferPoetryPermissions(poem),
        // 添加内容类型标识
        contentType: 'poetry'
      };
    });

    // 使用内容访问控制系统过滤
    const filteredPoetry = await window.contentAccessControl.filterContentList(
      poetryWithPermissionData,
      'poetry'
    );

    console.log(`✅ Poetry: 权限过滤完成，可访问诗歌数量: ${filteredPoetry.length}`);

    // 记录过滤详情
    if (auth.currentUser) {
      console.log(`👤 Poetry: 当前用户: ${auth.currentUser.username} (${auth.currentUser.role})`);
    } else {
      console.log('👤 Poetry: 当前用户: 未登录');
    }

    return filteredPoetry;
  } catch (error) {
    console.error('❌ Poetry: 权限过滤失败:', error);
    // 出错时返回空数组，确保安全
    return [];
  }
};

// 推断诗歌的默认权限设置
PoetryDisplay.prototype.inferPoetryPermissions = function(poem) {
  // 如果诗歌已经有明确的权限设置
  if (poem.permissions) {
    return poem.permissions;
  }

  // 根据诗歌的其他属性推断权限
  let permissionLevel = 'friend'; // 默认为好友可见

  // 检查是否有公开标识
  if (poem.isPublic === true || poem.visibility === 'public') {
    permissionLevel = 'public';
  } else if (poem.isPrivate === true || poem.visibility === 'private') {
    permissionLevel = 'private';
  } else if (poem.visibility === 'visitor') {
    permissionLevel = 'visitor';
  }

  // 使用文件权限系统创建权限结构
  if (window.filePermissionsSystem) {
    return window.filePermissionsSystem.createPermissionStructure(permissionLevel);
  }

  // 如果权限系统不可用，返回基本权限结构
  return {
    level: permissionLevel,
    isPublic: permissionLevel === 'public',
    requiredRole: permissionLevel === 'public' ? null : permissionLevel,
    metadata: {
      createdBy: poem.author || 'unknown',
      createdAt: poem.uploadTime || new Date().toISOString(),
      source: 'inferred'
    }
  };
};

// 获取权限级别图标
PoetryDisplay.prototype.getPermissionIcon = function(accessLevel) {
  const icons = {
    'public': '🌍',      // 公开
    'friend': '👥',      // 好友可见
    'visitor': '👤',     // 访客可见
    'admin': '🔑',       // 管理员访问
    'private': '🔒',     // 私有
    'custom': '⚙️',      // 自定义权限
    'anonymous': '👻',   // 匿名访问
    'error': '⚠️'        // 错误
  };
  return icons[accessLevel] || '📄';
};

// 获取权限级别描述
PoetryDisplay.prototype.getPermissionDescription = function(accessLevel, accessReason) {
  const descriptions = {
    'public': '公开内容 - 所有人都可以查看',
    'friend': '好友内容 - 好友及以上权限可查看',
    'visitor': '访客内容 - 访客及以上权限可查看',
    'admin': '管理员内容 - 仅管理员可查看',
    'private': '私有内容 - 仅作者可查看',
    'custom': '自定义权限 - 根据特定规则访问',
    'anonymous': '匿名访问 - 允许未登录用户查看',
    'error': '权限检查出错'
  };

  let description = descriptions[accessLevel] || '未知权限级别';

  if (accessReason) {
    description += ` (${accessReason})`;
  }

  return description;
};

// 获取当前用户状态
PoetryDisplay.prototype.getCurrentUserState = function() {
  if (typeof auth === 'undefined' || !auth.currentUser) {
    return { username: null, role: null, isLoggedIn: false };
  }

  return {
    username: auth.currentUser.username,
    role: auth.currentUser.role,
    isLoggedIn: true
  };
};

// 比较用户状态是否发生变化
PoetryDisplay.prototype.hasUserStateChanged = function(oldState, newState) {
  if (!oldState && !newState) return false;
  if (!oldState || !newState) return true;

  return oldState.username !== newState.username ||
         oldState.role !== newState.role ||
         oldState.isLoggedIn !== newState.isLoggedIn;
};

// 启动用户状态监听
PoetryDisplay.prototype.startUserStateMonitoring = function() {
  // 记录初始用户状态
  this.lastUserState = this.getCurrentUserState();

  // 每3秒检查一次用户状态变化
  setInterval(() => {
    const currentState = this.getCurrentUserState();

    if (this.hasUserStateChanged(this.lastUserState, currentState)) {
      console.log('🔄 Poetry: 检测到用户状态变化，刷新诗歌列表');
      console.log('Poetry: 旧状态:', this.lastUserState);
      console.log('Poetry: 新状态:', currentState);

      // 更新状态记录
      this.lastUserState = currentState;

      // 刷新诗歌列表
      this.loadPoetryData().then(() => {
        this.renderPoetry();
      }).catch(error => {
        console.error('Poetry: 用户状态变化后刷新列表失败:', error);
      });
    }
  }, 3000);

  // 监听页面可见性变化，当页面重新可见时检查用户状态
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(() => {
        const currentState = this.getCurrentUserState();
        if (this.hasUserStateChanged(this.lastUserState, currentState)) {
          console.log('🔄 Poetry: 页面重新可见，检测到用户状态变化');
          this.lastUserState = currentState;
          this.loadPoetryData().then(() => {
            this.renderPoetry();
          }).catch(error => {
            console.error('Poetry: 页面可见性变化后刷新列表失败:', error);
          });
        }
      }, 500);
    }
  });
};
