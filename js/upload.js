// 作品上传管理系统
class WorkUploader {
  constructor() {
    // 检查运行环境，在 GitHub Pages 环境下跳过 Firebase 初始化
    const isGitHubPages = window.location.hostname === 'hysteriasy.github.io';

    if (isGitHubPages) {
      console.info('🌐 检测到 GitHub Pages 环境，跳过 Firebase 初始化');
      this.storage = null;
      this.database = null;
    } else if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      // 只在非 GitHub Pages 环境且 Firebase 可用时初始化
      this.storage = firebase.storage();
      this.database = firebase.database();
      console.log('🔧 Firebase 存储已初始化');
    } else {
      console.info('📱 Firebase 不可用，使用本地/GitHub 存储模式');
      this.storage = null;
      this.database = null;
    }

    this.maxFileSize = 10 * 1024 * 1024; // 10MB

    // GitHub存储支持
    this.githubStorage = window.githubStorage;
    this.environmentManager = window.environmentManager;

    // 根据环境自动选择存储策略
    this.preferredStorage = this.environmentManager ?
      (this.environmentManager.shouldUseGitHubStorage() ? 'github' : 'local') : 'local';

    // 作品分类配置
    this.categories = {
      literature: {
        name: '文学作品',
        icon: '📚',
        subcategories: {
          essay: { name: '生活随笔', hasFile: false },
          poetry: { name: '诗歌创作', hasFile: false },
          novel: { name: '小说连载', hasFile: false }
        }
      },
      art: {
        name: '绘画作品',
        icon: '🎨',
        subcategories: {
          painting: { name: '绘画作品', hasFile: true, extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
          sketch: { name: '素描作品', hasFile: true, extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] },
          digital: { name: '数字艺术', hasFile: true, extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'psd', 'ai'] }
        }
      },
      music: {
        name: '音乐作品',
        icon: '🎵',
        subcategories: {
          original: { name: '原创音乐', hasFile: true, extensions: ['mp3', 'wav', 'flac', 'm4a', 'aac'] },
          cover: { name: '翻唱作品', hasFile: true, extensions: ['mp3', 'wav', 'flac', 'm4a', 'aac'] },
          instrumental: { name: '器乐演奏', hasFile: true, extensions: ['mp3', 'wav', 'flac', 'm4a', 'aac'] }
        }
      },
      video: {
        name: '视频作品',
        icon: '🎬',
        subcategories: {
          short: { name: '创意短片', hasFile: true, extensions: ['mp4', 'avi', 'mov', 'wmv', 'mkv'] },
          documentary: { name: '纪录片', hasFile: true, extensions: ['mp4', 'avi', 'mov', 'wmv', 'mkv'] },
          travel: { name: '旅行影像', hasFile: true, extensions: ['mp4', 'avi', 'mov', 'wmv', 'mkv'] }
        }
      }
    };

    this.initUI();
    // 延迟检查认证状态，确保页眉组件已完成初始化
    setTimeout(() => {
      this.checkAuthStatus();
    }, 100);
  }

  // 检查用户认证状态
  checkAuthStatus() {
    console.log('🔍 WorkUploader检查认证状态:', auth.currentUser ? `已登录: ${auth.currentUser.username}` : '未登录');

    if (!auth.currentUser) {
      // 优先使用页眉组件的登录功能
      if (typeof showLoginModal === 'function') {
        console.log('📝 使用页眉组件登录模态框');
        this.showAuthRequiredWithModal();
      } else {
        console.log('📝 使用内置登录表单');
        this.showAuthRequired();
      }
      return false;
    }
    this.showUserInfo();
    return true;
  }

  // 显示需要登录的提示（使用页眉组件模态框）
  showAuthRequiredWithModal() {
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) {
      uploadSection.innerHTML = `
        <div class="auth-required">
          <h3>请先登录</h3>
          <p>您需要登录后才能使用文件上传功能</p>
          <div class="login-prompt">
            <button type="button" class="btn btn-primary" onclick="showLoginModal()">
              点击登录
            </button>
            <p class="login-hint">登录后页面将自动刷新</p>
          </div>
        </div>
      `;
    }

    // 监听登录成功事件
    const checkLoginStatus = () => {
      if (auth.currentUser) {
        console.log('✅ 检测到用户已登录，刷新上传界面');
        this.showUserInfo();
        // 移除事件监听器
        clearInterval(loginCheckInterval);
      }
    };

    // 每秒检查一次登录状态
    const loginCheckInterval = setInterval(checkLoginStatus, 1000);

    // 5分钟后停止检查
    setTimeout(() => {
      clearInterval(loginCheckInterval);
    }, 300000);
  }

  // 显示需要登录的提示（内置表单）
  showAuthRequired() {
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) {
      uploadSection.innerHTML = `
        <div class="auth-required">
          <h3>请先登录</h3>
          <p>您需要登录后才能使用文件上传功能</p>
          <div class="login-form">
            <div class="form-group">
              <input type="text" id="loginUsername" class="form-control" placeholder="用户名">
              <span id="loginUsernameError" class="form-error"></span>
            </div>
            <div class="form-group">
              <input type="password" id="loginPassword" class="form-control" placeholder="密码">
              <span id="loginPasswordError" class="form-error"></span>
            </div>
            <button onclick="fileUploader.handleLogin()" class="btn btn-primary" style="width: 100%;">登录</button>
          </div>
        </div>
      `;
    }
  }

  // 显示用户信息
  showUserInfo() {
    const userInfoContainer = document.getElementById('userInfoContainer');
    const adminPanel = document.getElementById('adminPanel');

    if (!userInfoContainer) return;

    const role = auth.currentUser.role || 'user';
    const roleName = {
      admin: '管理员',
      friend: '好友',
      visitor: '访客'
    }[role] || '访客';

    userInfoContainer.innerHTML = `
      <div class="user-info">
        <div class="current-user">
          <span>👤 当前用户: <strong>${auth.currentUser.username}</strong> (${roleName})</span>
          <button onclick="logout()" class="btn btn-secondary btn-sm">退出登录</button>
        </div>
      </div>
    `;

    // 如果是管理员，显示管理面板
    if (auth.isAdmin() && adminPanel) {
      adminPanel.style.display = 'block';
      this.loadUsersList();
    }
  }

  createUserInfoElement() {
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    const container = document.querySelector('.container');
    if (container) {
      container.insertBefore(userInfo, container.firstChild);
    }
    return userInfo;
  }

  initUI() {
    // 初始化作品类型选择器
    this.initCategorySelector();

    // 初始化文学作品表单
    this.initLiteratureForm();

    // 初始化媒体作品表单
    this.initMediaForms();
  }

  // 初始化作品类型选择器
  initCategorySelector() {
    const typeButtons = document.querySelectorAll('.file-type-selector .btn');
    typeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const categoryType = e.target.dataset.type;

        // 检查用户权限
        if (!auth.canUploadType(categoryType)) {
          this.showNotification(`您没有权限上传${this.categories[categoryType].name}`, 'error');
          return;
        }

        // 更新选中状态
        typeButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // 切换表单显示
        this.switchForm(categoryType);
      });
    });

    // 默认选择文学作品
    const defaultButton = document.querySelector('[data-type="literature"]');
    if (defaultButton) {
      defaultButton.click();
    }
  }

  // 切换表单显示
  switchForm(categoryType) {
    // 隐藏所有表单
    document.querySelectorAll('.upload-form').forEach(form => {
      form.classList.remove('active');
      form.style.display = 'none';
    });

    // 显示对应的表单
    const targetForm = document.getElementById(`${categoryType}Form`);
    if (targetForm) {
      targetForm.style.display = 'block';
      targetForm.classList.add('active');
    }
  }

  // 初始化文学作品表单
  initLiteratureForm() {
    // 子分类切换
    const subcategorySelect = document.getElementById('literatureSubcategory');
    if (subcategorySelect) {
      subcategorySelect.addEventListener('change', (e) => {
        this.switchLiteratureSubcategory(e.target.value);
      });
      // 默认显示生活随笔
      this.switchLiteratureSubcategory('essay');
    }

    // 提交按钮
    const submitBtn = document.getElementById('submitLiterature');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        this.submitLiteratureWork();
      });
    }

    // 重置按钮
    const resetBtn = document.getElementById('resetLiterature');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetLiteratureForm();
      });
    }
  }

  // 切换文学作品子分类
  switchLiteratureSubcategory(subcategory) {
    // 隐藏所有子分类字段
    document.querySelectorAll('.subcategory-fields').forEach(field => {
      field.style.display = 'none';
    });

    // 显示对应的字段
    const targetFields = document.getElementById(`${subcategory}Fields`);
    if (targetFields) {
      targetFields.style.display = 'block';
    }
  }

  // 初始化媒体作品表单
  initMediaForms() {
    // 初始化绘画作品表单
    this.initMediaForm('art');
    // 初始化音乐作品表单
    this.initMediaForm('music');
    // 初始化视频作品表单
    this.initMediaForm('video');
  }

  // 初始化媒体作品表单
  initMediaForm(category) {
    // 提交按钮
    const submitBtn = document.getElementById(`submit${this.capitalize(category)}`);
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        this.submitMediaWork(category);
      });
    }

    // 重置按钮
    const resetBtn = document.getElementById(`reset${this.capitalize(category)}`);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetMediaForm(category);
      });
    }

    // 文件输入验证和移动端优化
    const fileInput = document.getElementById(`${category}File`);
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.validateMediaFile(e.target, category);
      });

      // 移动端文件上传优化
      this.setupMobileFileUpload(fileInput, category);
    }
  }

  // 设置移动端文件上传优化
  setupMobileFileUpload(fileInput, category) {
    const uploadArea = fileInput.closest('.file-upload-area');
    if (!uploadArea) return;

    // 检测是否为移动设备
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;

    if (isMobile) {
      // 移动端特定优化
      fileInput.style.fontSize = '16px'; // 防止iOS自动缩放

      // 添加触摸反馈
      fileInput.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.98)';
        this.style.transition = 'transform 0.1s ease';
      }, { passive: true });

      fileInput.addEventListener('touchend', function() {
        setTimeout(() => {
          this.style.transform = '';
        }, 150);
      }, { passive: true });

      // 改善文件选择提示
      const hint = uploadArea.querySelector('.file-upload-hint');
      if (hint) {
        hint.innerHTML += '<br><small>📱 点击选择文件或使用相机拍摄</small>';
      }
    }

    // 添加拖拽支持（桌面端）
    if (!isMobile) {
      this.setupDragAndDrop(uploadArea, fileInput, category);
    }

    // 文件选择后的视觉反馈
    fileInput.addEventListener('change', function() {
      const fileName = this.files[0]?.name;
      if (fileName) {
        uploadArea.style.borderColor = '#28a745';
        uploadArea.style.backgroundColor = '#d4edda';

        // 显示文件名
        let fileNameDisplay = uploadArea.querySelector('.selected-file-name');
        if (!fileNameDisplay) {
          fileNameDisplay = document.createElement('div');
          fileNameDisplay.className = 'selected-file-name';
          fileNameDisplay.style.cssText = `
            margin-top: 10px;
            padding: 8px 12px;
            background: #28a745;
            color: white;
            border-radius: 6px;
            font-size: 0.9rem;
            text-align: center;
          `;
          uploadArea.appendChild(fileNameDisplay);
        }
        fileNameDisplay.textContent = `✅ 已选择: ${fileName}`;
      }
    });
  }

  // 设置拖拽上传（桌面端）
  setupDragAndDrop(uploadArea, fileInput, category) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => {
        uploadArea.style.borderColor = '#007bff';
        uploadArea.style.backgroundColor = '#e3f2fd';
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadArea.addEventListener(eventName, () => {
        uploadArea.style.borderColor = '#dee2e6';
        uploadArea.style.backgroundColor = '#f8f9fa';
      });
    });

    uploadArea.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        fileInput.dispatchEvent(new Event('change'));
      }
    });
  }

  // 首字母大写
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // 提交文学作品
  async submitLiteratureWork() {
    try {
      if (!this.checkAuthStatus()) return;

      const subcategory = document.getElementById('literatureSubcategory').value;
      const permission = document.getElementById('literaturePermission').value;

      let workData = {};

      // 根据子分类获取表单数据
      switch (subcategory) {
        case 'essay':
          workData = {
            title: document.getElementById('essayTitle').value.trim(),
            content: document.getElementById('essayContent').value.trim()
          };
          break;
        case 'poetry':
          workData = {
            title: document.getElementById('poetryTitle').value.trim(),
            content: document.getElementById('poetryContent').value.trim(),
            poetryType: document.getElementById('poetryType').value
          };
          break;
        case 'novel':
          workData = {
            title: document.getElementById('novelTitle').value.trim(),
            content: document.getElementById('novelContent').value.trim(),
            chapter: parseInt(document.getElementById('novelChapter').value),
            chapterTitle: document.getElementById('novelChapterTitle').value.trim()
          };
          break;
      }

      // 验证必填字段
      if (!workData.title || !workData.content) {
        this.showNotification('请填写完整的作品信息', 'error');
        return;
      }

      // 保存作品
      await this.saveLiteratureWork('literature', subcategory, workData, permission, 'literature');

      this.showNotification('文学作品发布成功！', 'success');
      this.resetLiteratureForm();

      // 更新首页统计数据
      if (typeof window.updateHomepageStats === 'function') {
        window.updateHomepageStats();
      }

    } catch (error) {
      console.error('提交文学作品失败:', error);
      this.showNotification(`发布失败: ${error.message}`, 'error');
    }
  }

  // 重置文学作品表单
  resetLiteratureForm() {
    // 重置所有输入字段
    document.querySelectorAll('#literatureForm input, #literatureForm textarea, #literatureForm select').forEach(input => {
      if (input.type === 'number') {
        input.value = '';
      } else if (input.tagName === 'SELECT') {
        input.selectedIndex = 0;
      } else {
        input.value = '';
      }
    });

    // 重新显示默认子分类
    this.switchLiteratureSubcategory('essay');
  }

  // 提交媒体作品
  async submitMediaWork(category) {
    try {
      if (!this.checkAuthStatus()) return;

      const subcategory = document.getElementById(`${category}Subcategory`).value;
      const title = document.getElementById(`${category}Title`).value.trim();
      const description = document.getElementById(`${category}Description`).value.trim();
      const permission = document.getElementById(`${category}Permission`).value;
      const fileInput = document.getElementById(`${category}File`);

      // 验证必填字段
      if (!title) {
        this.showNotification('请输入作品题目', 'error');
        return;
      }

      if (!fileInput.files[0]) {
        this.showNotification('请选择要上传的文件', 'error');
        return;
      }

      if (category !== 'art' && !description) {
        this.showNotification('请输入作品简介', 'error');
        return;
      }

      const file = fileInput.files[0];

      // 验证文件
      if (!this.validateMediaFile(fileInput, category)) {
        return;
      }

      // 保存作品
      await this.saveMediaWork(category, subcategory, {
        title,
        description,
        file
      }, permission, category);

      this.showNotification(`${this.categories[category].name}发布成功！`, 'success');
      this.resetMediaForm(category);

      // 更新首页统计数据
      if (typeof window.updateHomepageStats === 'function') {
        window.updateHomepageStats();
      }

    } catch (error) {
      console.error('提交媒体作品失败:', error);
      this.showNotification(`发布失败: ${error.message}`, 'error');
    }
  }

  // 验证媒体文件
  validateMediaFile(fileInput, category) {
    const file = fileInput.files[0];
    if (!file) return false;

    // 检查文件大小
    if (file.size > this.maxFileSize) {
      this.showNotification(`文件大小不能超过${this.maxFileSize / 1024 / 1024}MB`, 'error');
      return false;
    }

    // 检查文件类型
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const subcategory = document.getElementById(`${category}Subcategory`).value;
    const allowedExtensions = this.categories[category].subcategories[subcategory].extensions;

    if (!allowedExtensions.includes(fileExtension)) {
      this.showNotification(`不支持的文件类型。支持的格式: ${allowedExtensions.join(', ')}`, 'error');
      return false;
    }

    return true;
  }

  // 重置媒体作品表单
  resetMediaForm(category) {
    document.querySelectorAll(`#${category}Form input, #${category}Form textarea, #${category}Form select`).forEach(input => {
      if (input.type === 'file') {
        input.value = '';
      } else if (input.tagName === 'SELECT') {
        input.selectedIndex = 0;
      } else {
        input.value = '';
      }
    });
  }

  // 保存文学作品
  async saveLiteratureWork(mainCategory, subcategory, workData, permission, category = null) {
    const user = auth.currentUser;
    if (!user) throw new Error('请先登录');

    // 生成唯一ID
    const workId = 'work_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();

    // 构建作品信息
    const workInfo = {
      id: workId,
      mainCategory,
      subcategory,
      categoryName: this.categories[mainCategory].name,
      subcategoryName: this.categories[mainCategory].subcategories[subcategory].name,
      title: workData.title,
      content: workData.content,
      uploadedBy: user.username,
      userRole: user.role,
      uploadTime: timestamp,
      permissions: this.getWorkPermissions(permission, category),
      storage_type: 'local', // 默认值，会根据实际保存位置更新
      ...workData // 包含其他特定字段如poetryType, chapter等
    };

    try {
      let githubResult = null;
      let saveToLocal = true;

      // 根据环境策略决定存储方式
      if (this.preferredStorage === 'github' && this.githubStorage) {
        try {
          githubResult = await this.githubStorage.uploadLiteratureWork(workInfo, user.username);
          workInfo.storage_type = 'github';
          workInfo.githubPath = githubResult.path;
          workInfo.downloadUrl = githubResult.downloadUrl;
          console.log('✅ 文学作品已保存到GitHub');

          // 如果是线上环境且GitHub保存成功，则不保存到本地
          if (this.environmentManager && this.environmentManager.isOnlineEnvironment()) {
            saveToLocal = false;
            console.log('🌍 线上环境：仅使用GitHub存储');
          }
        } catch (error) {
          console.warn('⚠️ GitHub保存失败，使用本地存储:', error.message);
          workInfo.storage_type = 'local';
        }
      } else {
        workInfo.storage_type = 'local';
        console.log('📱 本地环境：使用本地存储');
      }

      // 根据策略决定是否保存到本地存储
      if (saveToLocal) {
        await this.saveToLocalStorage(workInfo, mainCategory, subcategory);
      }

      // 如果是生活随笔，同时保存到essays格式（兼容现有展示逻辑）
      if (subcategory === 'essay') {
        await this.saveEssayCompatible(workInfo);
      }

      console.log('✅ 文学作品保存成功');
      return workInfo;

    } catch (error) {
      console.error('❌ 文学作品保存失败:', error);
      throw error;
    }
  }

  // 保存媒体作品
  async saveMediaWork(mainCategory, subcategory, workData, permission, category = null) {
    const user = auth.currentUser;
    if (!user) throw new Error('请先登录');

    // 生成唯一ID和文件名
    const workId = 'work_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toISOString();
    const file = workData.file;
    const fileExtension = file.name.split('.').pop().toLowerCase();

    // 生成安全的文件名
    const sanitizedTitle = workData.title
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
    const uniqueFileName = `${Date.now()}_${sanitizedTitle}.${fileExtension}`;

    try {
      // 将文件转换为Base64
      const fileData = await this.fileToBase64(file);

      // 构建作品信息
      const workInfo = {
        id: workId,
        mainCategory,
        subcategory,
        categoryName: this.categories[mainCategory].name,
        subcategoryName: this.categories[mainCategory].subcategories[subcategory].name,
        title: workData.title,
        description: workData.description || '',
        fileName: uniqueFileName,
        originalName: file.name,
        fileSize: file.size,
        fileData: fileData, // Base64编码的文件数据
        uploadedBy: user.username,
        userRole: user.role,
        uploadTime: timestamp,
        permissions: this.getWorkPermissions(permission, category),
        storage_type: 'local' // 默认值，会根据实际保存位置更新
      };

      let githubResult = null;
      let saveToLocal = true;

      // 根据环境策略决定存储方式
      if (this.preferredStorage === 'github' && this.githubStorage) {
        try {
          githubResult = await this.githubStorage.uploadMediaWork(workInfo, user.username);
          workInfo.storage_type = 'github';
          workInfo.githubPath = githubResult.path;
          workInfo.downloadUrl = githubResult.downloadUrl;
          console.log('✅ 媒体作品已保存到GitHub');

          // 如果是线上环境且GitHub保存成功，则不保存到本地
          if (this.environmentManager && this.environmentManager.isOnlineEnvironment()) {
            saveToLocal = false;
            console.log('🌍 线上环境：仅使用GitHub存储');
          }
        } catch (error) {
          console.warn('⚠️ GitHub保存失败，使用本地存储:', error.message);
          workInfo.storage_type = 'local';
        }
      } else {
        workInfo.storage_type = 'local';
        console.log('📱 本地环境：使用本地存储');
      }

      // 根据策略决定是否保存到本地存储
      if (saveToLocal) {
        await this.saveToLocalStorage(workInfo, mainCategory, subcategory);
      }

      console.log('✅ 媒体作品保存成功');
      return workInfo;

    } catch (error) {
      console.error('❌ 媒体作品保存失败:', error);
      throw error;
    }
  }

  // 将文件转换为Base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 保存到本地存储
  async saveToLocalStorage(workInfo, mainCategory, subcategory) {
    const user = auth.currentUser;

    try {
      // 保存单个作品
      localStorage.setItem(`work_${workInfo.id}`, JSON.stringify(workInfo));

      // 更新用户作品列表
      const userWorksKey = `userWorks_${user.username}`;
      let userWorks = [];
      try {
        const existingWorks = localStorage.getItem(userWorksKey);
        if (existingWorks) {
          userWorks = JSON.parse(existingWorks);
        }
      } catch (error) {
        console.warn('获取用户作品列表失败:', error);
      }

      userWorks.push({
        id: workInfo.id,
        mainCategory,
        subcategory,
        title: workInfo.title,
        uploadTime: workInfo.uploadTime
      });

      localStorage.setItem(userWorksKey, JSON.stringify(userWorks));

      // 如果是公开作品，也保存到公共作品列表
      if (workInfo.permissions.isPublic) {
        const publicWorksKey = `publicWorks_${mainCategory}`;
        let publicWorks = [];
        try {
          const existingPublicWorks = localStorage.getItem(publicWorksKey);
          if (existingPublicWorks) {
            publicWorks = JSON.parse(existingPublicWorks);
          }
        } catch (error) {
          console.warn('获取公共作品列表失败:', error);
        }

        publicWorks.push({
          id: workInfo.id,
          owner: user.username,
          mainCategory,
          subcategory,
          title: workInfo.title,
          uploadTime: workInfo.uploadTime
        });

        localStorage.setItem(publicWorksKey, JSON.stringify(publicWorks));
      }

      console.log('✅ 本地存储保存成功');

    } catch (error) {
      console.error('❌ 本地存储保存失败:', error);
      throw new Error(`本地存储保存失败: ${error.message}`);
    }
  }

  // 保存生活随笔（兼容现有格式）
  async saveEssayCompatible(workInfo) {
    try {
      // 转换为essays.js期望的格式
      const essayData = {
        title: workInfo.title,
        content: workInfo.content,
        date: workInfo.uploadTime,
        author: workInfo.uploadedBy
      };

      // 获取现有随笔列表
      let essays = [];
      try {
        const existingEssays = localStorage.getItem('essays');
        if (existingEssays) {
          essays = JSON.parse(existingEssays);
        }
      } catch (error) {
        console.warn('获取现有随笔列表失败:', error);
      }

      // 添加新随笔到列表开头
      essays.unshift(essayData);

      // 保存更新后的列表
      localStorage.setItem('essays', JSON.stringify(essays));

      console.log('✅ 随笔兼容格式保存成功');

    } catch (error) {
      console.warn('⚠️ 随笔兼容格式保存失败:', error);
      // 不抛出错误，因为这只是兼容性保存
    }
  }

  // 本地存储上传方法
  async uploadToLocalStorage(file, storagePath, fileTitle, fileDescription, permission, mainCategory, subcategory, uniqueFileName) {
    const user = auth.currentUser;

    try {
      console.log('📱 开始本地存储文件上传...');

      // 模拟上传进度
      this.simulateUploadProgress();

      // 将文件转换为Base64存储
      const fileData = await this.fileToBase64(file);

      // 生成本地文件ID
      const fileId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      // 设置权限
      const permissions = this.getFilePermissions(permission);

      // 创建文件信息
      const fileInfo = {
        fileName: uniqueFileName,
        originalName: file.name,
        title: fileTitle,
        description: fileDescription,
        mainCategory: mainCategory,
        subcategory: subcategory,
        categoryName: this.categories[mainCategory].name,
        subcategoryName: this.categories[mainCategory].subcategories[subcategory].name,
        fileSize: file.size,
        fileData: fileData, // Base64编码的文件数据
        storagePath: storagePath,
        uploadedBy: user.username,
        userRole: user.role,
        uploadTime: new Date().toISOString(),
        permissions: permissions,
        storage_type: 'local'
      };

      // 保存到本地存储
      localStorage.setItem(`file_${fileId}`, JSON.stringify(fileInfo));

      // 更新用户文件列表
      const userFilesKey = `userFiles_${user.username}`;
      let userFiles = [];
      try {
        const existingFiles = localStorage.getItem(userFilesKey);
        if (existingFiles) {
          userFiles = JSON.parse(existingFiles);
        }
      } catch (error) {
        console.warn('获取用户文件列表失败:', error);
      }

      userFiles.push({
        fileId: fileId,
        ...fileInfo
      });

      localStorage.setItem(userFilesKey, JSON.stringify(userFiles));

      // 如果是公开文件，也保存到公共文件列表
      if (permissions.isPublic) {
        const publicFilesKey = `publicFiles_${mainCategory}`;
        let publicFiles = [];
        try {
          const existingPublicFiles = localStorage.getItem(publicFilesKey);
          if (existingPublicFiles) {
            publicFiles = JSON.parse(existingPublicFiles);
          }
        } catch (error) {
          console.warn('获取公共文件列表失败:', error);
        }

        publicFiles.push({
          fileId: fileId,
          owner: user.username,
          ...fileInfo
        });

        localStorage.setItem(publicFilesKey, JSON.stringify(publicFiles));
      }

      console.log('✅ 本地存储文件上传成功');
      return {
        fileId: fileId,
        downloadURL: `local://${fileId}`, // 本地文件的虚拟URL
        fileName: file.name,
        title: fileTitle,
        fileInfo: fileInfo
      };

    } catch (error) {
      console.error('❌ 本地存储上传失败:', error);
      throw new Error(`本地存储上传失败: ${error.message}`);
    }
  }

  // 将文件转换为Base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 模拟上传进度
  simulateUploadProgress() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      this.showUploadProgress(progress);
    }, 200);
  }

  // 验证文件
  validateFile(file, mainCategory, subcategory) {
    // 检查文件大小（最大10MB）
    if (file.size > this.maxFileSize) {
      throw new Error(`文件大小超出限制，最大允许 ${(this.maxFileSize / 1024 / 1024).toFixed(1)}MB`);
    }

    // 检查文件类型
    const allowedExtensions = this.categories[mainCategory]?.subcategories[subcategory]?.extensions;
    if (allowedExtensions) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`不支持的文件类型 .${fileExtension}，支持的类型：${allowedExtensions.join(', ')}`);
      }
    }

    // 检查文件名长度
    if (file.name.length > 255) {
      throw new Error('文件名过长，请使用较短的文件名');
    }

    // 检查文件名是否包含非法字符
    const illegalChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (illegalChars.test(file.name)) {
      throw new Error('文件名包含非法字符，请重命名后重试');
    }

    console.log(`✅ 文件验证通过: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
  }

  // 获取作品权限设置（扩展版本）
  getWorkPermissions(permissionType, category = null) {
    // 获取自定义权限设置
    let customSettings = {};
    if (permissionType === 'custom' && category) {
      const userList = document.getElementById(`${category}UserList`);
      const permissionTypeRadio = document.querySelector(`input[name="${category}PermissionType"]:checked`);

      if (userList && permissionTypeRadio) {
        const users = userList.value.split(',').map(u => u.trim()).filter(u => u);
        const mode = permissionTypeRadio.value;

        if (mode === 'whitelist') {
          customSettings.allowedUsers = users;
          customSettings.visibility = 'whitelist';
        } else if (mode === 'blacklist') {
          customSettings.blockedUsers = users;
          customSettings.visibility = 'blacklist';
        }
      }
    }

    const basePermissions = {
      visibility: customSettings.visibility || permissionType || 'public',
      isPublic: ['public', 'blacklist'].includes(customSettings.visibility || permissionType),
      allowedUsers: customSettings.allowedUsers || [], // 白名单用户
      blockedUsers: customSettings.blockedUsers || [], // 黑名单用户
      allowedRoles: customSettings.allowedRoles || [], // 允许的角色
      setBy: auth.currentUser ? auth.currentUser.username : 'anonymous',
      setAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      modifiedBy: auth.currentUser ? auth.currentUser.username : 'anonymous'
    };

    switch (permissionType) {
      case 'public':
        return {
          ...basePermissions,
          isPublic: true,
          visibility: 'public'
        };
      case 'friend':
        return {
          ...basePermissions,
          isPublic: false,
          visibility: 'friend',
          allowedRoles: ['friend', 'admin']
        };
      case 'visitor':
        return {
          ...basePermissions,
          isPublic: false,
          visibility: 'visitor',
          allowedRoles: ['visitor', 'friend', 'admin']
        };
      case 'private':
        return {
          ...basePermissions,
          isPublic: false,
          visibility: 'private'
        };
      case 'custom':
        return {
          ...basePermissions,
          isPublic: customSettings.visibility === 'blacklist',
          visibility: customSettings.visibility || 'whitelist'
        };
      default:
        return {
          ...basePermissions,
          isPublic: false,
          visibility: 'private'
        };
    }
  }

  // 检查用户是否可以查看作品
  canUserViewWork(workPermissions, viewerUsername = null, viewerRole = null) {
    // 如果没有登录用户信息，使用当前登录用户
    if (!viewerUsername && auth.currentUser) {
      viewerUsername = auth.currentUser.username;
      viewerRole = auth.currentUser.role;
    }

    // 管理员可以查看所有作品
    if (viewerRole === 'admin') {
      return true;
    }

    // 作品作者可以查看自己的作品
    if (viewerUsername && workPermissions.setBy === viewerUsername) {
      return true;
    }

    // 根据可见性设置检查权限
    switch (workPermissions.visibility) {
      case 'public':
        return true; // 所有人都可以查看

      case 'private':
        return false; // 只有作者和管理员可见

      case 'friend':
        // 好友级别：好友和管理员可以查看
        return ['friend', 'admin'].includes(viewerRole);

      case 'visitor':
        // 访客级别：访客、好友和管理员可以查看
        return ['visitor', 'friend', 'admin'].includes(viewerRole);

      case 'whitelist':
        // 检查是否在白名单中
        if (workPermissions.allowedUsers.includes(viewerUsername)) {
          return true;
        }
        // 检查角色权限
        if (workPermissions.allowedRoles.includes(viewerRole)) {
          return true;
        }
        return false;

      case 'blacklist':
        // 检查是否在黑名单中
        if (workPermissions.blockedUsers.includes(viewerUsername)) {
          return false;
        }
        // 根据默认权限级别判断
        const defaultLevel = workPermissions.defaultLevel || 'friend';
        if (defaultLevel === 'public') return true;
        if (defaultLevel === 'friend') return ['friend', 'admin'].includes(viewerRole);
        if (defaultLevel === 'visitor') return ['visitor', 'friend', 'admin'].includes(viewerRole);
        return false;

      default:
        return workPermissions.isPublic || false;
    }
  }

  // 更新作品权限设置
  async updateWorkPermissions(workId, newPermissions) {
    if (!auth.currentUser) {
      throw new Error('请先登录');
    }

    try {
      // 获取现有作品数据
      const workData = localStorage.getItem(`work_${workId}`);
      if (!workData) {
        throw new Error('作品不存在');
      }

      const work = JSON.parse(workData);

      // 检查权限：只有作品作者或管理员可以修改权限
      if (work.uploadedBy !== auth.currentUser.username && !auth.isAdmin()) {
        throw new Error('您没有权限修改此作品的权限设置');
      }

      // 更新权限信息
      work.permissions = {
        ...work.permissions,
        ...newPermissions,
        lastModified: new Date().toISOString(),
        modifiedBy: auth.currentUser.username
      };

      // 保存更新后的作品数据
      localStorage.setItem(`work_${workId}`, JSON.stringify(work));

      // 更新公共作品列表
      await this.updatePublicWorksList(work);

      console.log('✅ 作品权限更新成功');
      return work;

    } catch (error) {
      console.error('❌ 更新作品权限失败:', error);
      throw error;
    }
  }

  // 更新公共作品列表
  async updatePublicWorksList(work) {
    const publicWorksKey = `publicWorks_${work.mainCategory}`;
    let publicWorks = [];

    try {
      const existingPublicWorks = localStorage.getItem(publicWorksKey);
      if (existingPublicWorks) {
        publicWorks = JSON.parse(existingPublicWorks);
      }
    } catch (error) {
      console.warn('获取公共作品列表失败:', error);
    }

    // 移除现有的作品记录
    publicWorks = publicWorks.filter(item => item.id !== work.id);

    // 如果作品是公开的，添加到公共列表
    if (work.permissions.visibility === 'public' || work.permissions.isPublic) {
      publicWorks.push({
        id: work.id,
        owner: work.uploadedBy,
        mainCategory: work.mainCategory,
        subcategory: work.subcategory,
        title: work.title,
        uploadTime: work.uploadTime
      });
    }

    localStorage.setItem(publicWorksKey, JSON.stringify(publicWorks));
  }

  // 显示通知消息
  showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // 添加样式
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      font-weight: bold;
      z-index: 10001;
      max-width: 300px;
      word-wrap: break-word;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInRight 0.3s ease-out;
    `;

    // 根据类型设置背景色
    const colors = {
      success: '#4CAF50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196F3'
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    // 添加到页面
    document.body.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
  }

  // 显示上传进度
  showUploadProgress(progress) {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.textContent = `${Math.round(progress)}%`;
    }
  }

  showUploadSuccess(result) {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.width = '100%';
      progressBar.textContent = '上传完成';
    }

    // 显示成功消息
    this.showNotification(`文件 "${result.fileName}" 上传成功！`, 'success');

    // 更新首页统计数据
    if (typeof window.updateHomepageStats === 'function') {
      window.updateHomepageStats();
    }

    // 重置进度条
    setTimeout(() => {
      if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.textContent = '';
      }
      // 重置文件输入
      const fileInput = document.getElementById('fileInput');
      if (fileInput) fileInput.value = '';

      // 刷新文件列表
      this.loadUserFiles();
    }, 2000);
  }

  showError(error) {
    console.error('上传错误:', error);

    // 根据错误类型提供不同的用户反馈
    let userMessage = error.message;
    let showRetryOption = false;

    if (error.message.includes('网络访问受限') || error.message.includes('本地存储模式')) {
      userMessage = '由于网络限制，文件已保存到本地存储。您可以在离线模式下正常使用。';
      showRetryOption = false;
    } else if (error.message.includes('网络连接失败')) {
      userMessage = '网络连接失败，文件已保存到本地存储。请检查网络连接后重试。';
      showRetryOption = true;
    } else if (error.message.includes('文件大小')) {
      userMessage = '文件大小超出限制，请选择较小的文件。';
      showRetryOption = false;
    } else if (error.message.includes('文件类型')) {
      userMessage = '不支持的文件类型，请选择支持的文件格式。';
      showRetryOption = false;
    } else {
      userMessage = `上传失败：${error.message}`;
      showRetryOption = true;
    }

    this.showNotification(userMessage, 'error');

    // 重置进度条
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.width = '0%';
      progressBar.textContent = showRetryOption ? '点击重试' : '上传失败';

      if (showRetryOption) {
        progressBar.style.cursor = 'pointer';
        progressBar.onclick = () => {
          // 重新触发文件选择
          const fileInput = document.getElementById('fileInput');
          if (fileInput) {
            fileInput.click();
          }
        };
      }
    }
  }


  // 加载用户文件列表
  async loadUserFiles() {
    if (!auth.currentUser) return;

    try {
      // 检查是否在 GitHub Pages 环境
      const isGitHubPages = window.location.hostname === 'hysteriasy.github.io';

      if (isGitHubPages || !this.database) {
        // GitHub Pages 环境或 Firebase 不可用，显示空列表
        this.displayUserFiles({});
        return;
      }

      const snapshot = await this.database.ref(`userFiles/${auth.currentUser.username}`).once('value');
      const files = snapshot.val() || {};

      this.displayFileList(files);
    } catch (error) {
      // 静默处理错误，避免在 GitHub Pages 环境下产生误导性错误
      if (!window.location.hostname.includes('github.io')) {
        console.error('加载文件列表失败:', error);
      }
    }
  }

  // 显示文件列表
  displayFileList(files) {
    let fileListContainer = document.querySelector('.file-list-container');

    if (!fileListContainer) {
      fileListContainer = document.createElement('div');
      fileListContainer.className = 'file-list-container';

      const uploadSection = document.querySelector('.upload-section');
      if (uploadSection) {
        uploadSection.appendChild(fileListContainer);
      }
    }

    const fileEntries = Object.entries(files);

    if (fileEntries.length === 0) {
      fileListContainer.innerHTML = '<p class="no-files">暂无上传的文件</p>';
      return;
    }

    const fileListHTML = `
      <h3>我的文件</h3>
      <div class="file-grid">
        ${fileEntries.map(([fileId, fileInfo]) => `
          <div class="file-item" data-file-id="${fileId}">
            <div class="file-icon">
              ${this.getFileIcon(fileInfo.fileType)}
            </div>
            <div class="file-info">
              <div class="file-name" title="${fileInfo.originalName}">${fileInfo.originalName}</div>
              <div class="file-meta">
                <span class="file-size">${this.formatFileSize(fileInfo.fileSize)}</span>
                <span class="file-type">${fileInfo.fileType}</span>
              </div>
              <div class="file-actions">
                <button onclick="fileUploader.downloadFile('${fileId}')" class="btn btn-sm btn-primary">下载</button>
                <button onclick="fileUploader.deleteFile('${fileId}')" class="btn btn-sm btn-danger">删除</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    fileListContainer.innerHTML = fileListHTML;
  }

  // 获取文件图标
  getFileIcon(mainCategory, subcategory = null) {
    if (this.categories[mainCategory]) {
      return this.categories[mainCategory].icon;
    }

    // 兼容旧格式
    const legacyIcons = {
      essay: '📝',
      image: '🖼️',
      document: '📄',
      video: '🎥',
      literature: '📚',
      art: '🎨',
      music: '🎵'
    };

    return legacyIcons[mainCategory] || legacyIcons[subcategory] || '📁';
  }

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 下载文件
  async downloadFile(fileId) {
    try {
      const snapshot = await this.database.ref(`userFiles/${auth.currentUser.username}/${fileId}`).once('value');
      const fileInfo = snapshot.val();

      if (fileInfo && fileInfo.downloadURL) {
        // 创建下载链接
        const link = document.createElement('a');
        link.href = fileInfo.downloadURL;
        link.download = fileInfo.originalName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification(`开始下载 "${fileInfo.originalName}"`, 'success');
      } else {
        throw new Error('文件不存在或已被删除');
      }
    } catch (error) {
      this.showNotification(`下载失败: ${error.message}`, 'error');
    }
  }

  // 删除文件
  async deleteFile(fileId) {
    if (!confirm('确定要删除这个文件吗？此操作不可恢复。')) {
      return;
    }

    try {
      // 检查是否在 GitHub Pages 环境
      const isGitHubPages = window.location.hostname === 'hysteriasy.github.io';

      if (isGitHubPages || !this.database || !this.storage) {
        // GitHub Pages 环境或 Firebase 不可用，使用替代删除方法
        this.showNotification('当前环境不支持此删除操作，请使用文件权限管理功能', 'warning');
        return;
      }

      // 获取文件信息
      const snapshot = await this.database.ref(`userFiles/${auth.currentUser.username}/${fileId}`).once('value');
      const fileInfo = snapshot.val();

      if (fileInfo) {
        // 从存储中删除文件
        const storageRef = this.storage.ref(fileInfo.storagePath);
        await storageRef.delete();

        // 从数据库中删除记录
        await this.database.ref(`userFiles/${auth.currentUser.username}/${fileId}`).remove();

        this.showNotification(`文件 "${fileInfo.originalName}" 已删除`, 'success');

        // 刷新文件列表
        this.loadUserFiles();
      } else {
        throw new Error('文件不存在');
      }
    } catch (error) {
      this.showNotification(`删除失败: ${error.message}`, 'error');
    }
  }

  // 处理登录
  async handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    // 清除之前的错误
    const usernameError = document.getElementById('loginUsernameError');
    const passwordError = document.getElementById('loginPasswordError');
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');

    if (usernameError) usernameError.textContent = '';
    if (passwordError) passwordError.textContent = '';
    if (usernameInput) usernameInput.classList.remove('error');
    if (passwordInput) passwordInput.classList.remove('error');

    // 验证输入
    let isValid = true;

    if (!username) {
      if (usernameError) usernameError.textContent = '请输入用户名';
      if (usernameInput) usernameInput.classList.add('error');
      isValid = false;
    }

    if (!password) {
      if (passwordError) passwordError.textContent = '请输入密码';
      if (passwordInput) passwordInput.classList.add('error');
      isValid = false;
    }

    if (!isValid) {
      this.showNotification('请填写完整的登录信息', 'error');
      return;
    }

    try {
      await auth.login(username, password);
      this.showNotification('登录成功', 'success');

      // 重新初始化界面
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      // 根据错误类型显示不同的错误信息
      if (error.message.includes('用户不存在')) {
        if (usernameError) usernameError.textContent = '用户不存在';
        if (usernameInput) usernameInput.classList.add('error');
      } else if (error.message.includes('密码错误')) {
        if (passwordError) passwordError.textContent = '密码错误';
        if (passwordInput) passwordInput.classList.add('error');
      } else {
        this.showNotification(`登录失败: ${error.message}`, 'error');
      }
    }
  }

  // 加载用户列表（管理员功能，改进版本）
  async loadUsersList() {
    if (!auth.isAdmin()) return;

    const usersList = document.getElementById('usersList');
    if (!usersList) return;

    // 显示加载状态
    usersList.innerHTML = `
      <div class="user-card" style="text-align: center; color: #6c757d;">
        <h4>🔄 加载中...</h4>
        <p>正在获取用户列表，请稍候...</p>
      </div>
    `;

    try {
      console.log('🔄 开始加载用户列表...');
      const users = await auth.getAllUsers();
      console.log(`✅ 获取到 ${users.length} 个用户`);

      if (!users || users.length === 0) {
        usersList.innerHTML = `
          <div class="user-card" style="text-align: center; color: #6c757d;">
            <h4>📭 暂无用户</h4>
            <p>当前没有用户数据，请尝试添加新用户。</p>
            <p><small>系统状态: ${window.firebaseAvailable ? '在线模式' : '离线模式'}</small></p>
          </div>
        `;
        return;
      }

      // 按存储类型分组显示
      const firebaseUsers = users.filter(u => u.storage_type === 'firebase');
      const localUsers = users.filter(u => u.storage_type === 'local');
      const presetUsers = users.filter(u => u.storage_type === 'preset');

      let statusInfo = '';
      if (firebaseUsers.length > 0 || localUsers.length > 0 || presetUsers.length > 0) {
        const statusParts = [];
        if (firebaseUsers.length > 0) statusParts.push(`云端: ${firebaseUsers.length}`);
        if (localUsers.length > 0) statusParts.push(`本地: ${localUsers.length}`);
        if (presetUsers.length > 0) statusParts.push(`预设: ${presetUsers.length}`);
        statusInfo = `<p style="text-align: center; color: #6c757d; margin-bottom: 20px;"><small>数据来源 - ${statusParts.join(', ')} | 总计: ${users.length} 个用户</small></p>`;
      }

      usersList.innerHTML = statusInfo + users.map(user => `
        <div class="user-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h4>${user.username}</h4>
              <span class="user-role role-${user.role}">${this.getRoleName(user.role)}</span>
            </div>
            <span class="storage-badge storage-${user.storage_type}" title="数据存储位置">
              ${user.storage_type === 'firebase' ? '☁️' : user.storage_type === 'local' ? '📱' : '⚙️'}
            </span>
          </div>
          <p><strong>创建时间:</strong> ${this.formatDate(user.created_at)}</p>
          ${user.last_modified ? `<p><strong>最后修改:</strong> ${this.formatDate(user.last_modified)}</p>` : ''}
          <div class="user-actions">
            <button class="btn btn-sm btn-primary" onclick="window.editUser('${user.username}')">编辑</button>
            ${user.username !== 'hysteria' ? `<button class="btn btn-sm btn-danger" onclick="window.deleteUser('${user.username}')">删除</button>` : ''}
          </div>
        </div>
      `).join('');

      // 显示同步成功消息
      console.log('✅ 用户列表加载完成');

    } catch (error) {
      console.error('❌ 加载用户列表失败:', error);
      usersList.innerHTML = `
        <div class="user-card" style="text-align: center; color: #dc3545;">
          <h4>❌ 加载失败</h4>
          <p>加载用户列表时发生错误: ${error.message}</p>
          <p><small>系统状态: ${window.firebaseAvailable ? '在线模式' : '离线模式'}</small></p>
          <div style="margin-top: 15px;">
            <button class="btn btn-sm btn-primary" onclick="window.fileUploader.loadUsersList()">重试</button>
            <button class="btn btn-sm btn-secondary" onclick="location.reload()">刷新页面</button>
          </div>
        </div>
      `;
      this.showNotification('加载用户列表失败', 'error');
    }
  }

  // 获取角色名称
  getRoleName(role) {
    const roleNames = {
      admin: '管理员',
      friend: '好友',
      visitor: '访客'
    };
    return roleNames[role] || '未知角色';
  }

  // 格式化日期
  formatDate(timestamp) {
    if (!timestamp) return '未知';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  }

  // 编辑用户（安全增强版本）
  async editUser(username) {
    console.log(`🔧 开始编辑用户: ${username}`);

    // 检查编辑权限
    if (!auth.canEditUser(username)) {
      this.showNotification('权限不足：您只能编辑自己的账户，或者需要管理员权限', 'error');
      return;
    }

    if (!username || username.trim() === '') {
      this.showNotification('用户名无效', 'error');
      return;
    }

    // 检查用户是否存在
    let targetUser;
    try {
      targetUser = await auth.getUserByUsername(username);
      if (!targetUser) {
        this.showNotification(`用户 ${username} 不存在`, 'error');
        return;
      }
    } catch (error) {
      console.error('检查用户存在性失败:', error);
      this.showNotification('无法验证用户信息，请稍后重试', 'error');
      return;
    }

    // 显示用户编辑对话框
    this.showUserEditDialog(username, targetUser);
  }

  // 显示用户编辑对话框
  showUserEditDialog(username, userInfo) {
    const isEditingSelf = auth.currentUser.username === username;
    const canChangeRole = auth.canChangeUserRole(username, userInfo.role);
    const isAdmin = auth.isAdmin();

    // 创建角色选择选项 - 统一为系统标准的三个角色
    const roleOptions = [
      { value: 'visitor', label: '访客' },
      { value: 'friend', label: '好友' },
      { value: 'admin', label: '管理员' }
    ].map(option =>
      `<option value="${option.value}" ${userInfo.role === option.value ? 'selected' : ''}>${option.label}</option>`
    ).join('');

    // 创建模态框HTML
    const modalHtml = `
      <div id="editUserModal" class="modal" style="display: flex; z-index: 10000;">
        <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
          <span class="close-btn" onclick="closeEditUserModal()">&times;</span>
          <h3>${isEditingSelf ? '编辑个人信息' : `编辑用户: ${username}`}</h3>

          <div class="form-group">
            <label>当前用户信息</label>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
              <p><strong>用户名:</strong> ${username}</p>
              <p><strong>角色:</strong> ${this.getRoleName(userInfo.role)}</p>
              <p><strong>创建时间:</strong> ${this.formatDate(userInfo.created_at)}</p>
              <p><strong>存储类型:</strong> ${userInfo.storage_type || 'unknown'}</p>
              ${userInfo.last_modified ? `<p><strong>最后修改:</strong> ${this.formatDate(userInfo.last_modified)}</p>` : ''}
            </div>
          </div>

          <form id="editUserForm">
            <div class="form-group">
              <label for="editUserNewPassword">新密码（留空则不修改）</label>
              <input type="password" id="editUserNewPassword" placeholder="至少6位字符" class="form-control">
              <span id="editPasswordError" class="form-error" style="display: block; min-height: 20px; margin-top: 5px;"></span>
            </div>

            ${canChangeRole ? `
            <div class="form-group">
              <label for="editUserRole">用户角色</label>
              <select id="editUserRole" class="form-control">
                ${roleOptions}
              </select>
              <span id="editRoleError" class="form-error" style="display: block; min-height: 20px; margin-top: 5px;"></span>
              <small style="color: #6c757d; display: block; margin-top: 5px;">修改用户角色需要管理员权限</small>
            </div>
            ` : `
            <div class="form-group">
              <label>用户角色</label>
              <input type="text" value="${this.getRoleName(userInfo.role)}" readonly class="form-control" style="background: #f8f9fa;">
              <small style="color: #6c757d; display: block; margin-top: 5px;">您没有权限修改此用户的角色</small>
            </div>
            `}

            ${!isEditingSelf ? `
            <div class="form-group">
              <label for="adminPasswordVerify">管理员密码验证（必填）</label>
              <input type="password" id="adminPasswordVerify" placeholder="请输入您的管理员密码" required class="form-control">
              <span id="adminPasswordError" class="form-error" style="display: block; min-height: 20px; margin-top: 5px; font-weight: bold;"></span>
              <small style="color: #6c757d; display: block; margin-top: 5px;">为了安全起见，修改其他用户信息需要验证您的管理员密码</small>
            </div>
            ` : ''}

            <div class="form-actions">
              <button type="submit" class="btn btn-primary">保存修改</button>
              <button type="button" class="btn btn-secondary" onclick="closeEditUserModal()">取消</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 绑定表单提交事件
    document.getElementById('editUserForm').addEventListener('submit', (e) => {
      this.handleUserEditSubmit(e, username, userInfo);
    });
  }

  // 处理用户编辑表单提交
  async handleUserEditSubmit(event, username, originalUserInfo) {
    event.preventDefault();

    const isEditingSelf = auth.currentUser.username === username;
    const newPassword = document.getElementById('editUserNewPassword').value.trim();
    const roleSelect = document.getElementById('editUserRole');
    const newRole = roleSelect ? roleSelect.value : originalUserInfo.role;
    const adminPasswordInput = document.getElementById('adminPasswordVerify');
    const adminPassword = adminPasswordInput ? adminPasswordInput.value : '';

    // 清除之前的错误
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));

    let hasChanges = false;
    let changes = {};

    // 检查密码修改
    if (newPassword) {
      // 验证新密码
      const validation = auth.validatePassword(newPassword);
      if (!validation.isValid) {
        document.getElementById('editPasswordError').textContent = validation.errors.join(', ');
        document.getElementById('editUserNewPassword').classList.add('error');
        return;
      }
      hasChanges = true;
      changes.password = newPassword;
    }

    // 检查角色修改
    if (roleSelect && newRole !== originalUserInfo.role) {
      // 检查是否有权限修改角色
      if (!auth.canChangeUserRole(username, newRole)) {
        document.getElementById('editRoleError').textContent = '您没有权限修改此用户的角色';
        roleSelect.classList.add('error');
        return;
      }
      hasChanges = true;
      changes.role = newRole;
    }

    if (!hasChanges) {
      this.showNotification('没有检测到任何修改', 'info');
      return;
    }

    // 如果不是编辑自己，需要验证管理员密码
    if (!isEditingSelf) {
      if (!adminPassword) {
        document.getElementById('adminPasswordError').textContent = '请输入管理员密码';
        adminPasswordInput.classList.add('error');
        return;
      }

      try {
        // 验证管理员密码
        await auth.verifyAdminPassword(adminPassword);
      } catch (error) {
        console.error('管理员密码验证失败:', error);

        if (error.message.includes('密码错误')) {
          document.getElementById('adminPasswordError').textContent = '管理员密码错误';
          adminPasswordInput.classList.add('error');
        } else {
          this.showNotification(`验证失败: ${error.message}`, 'error');
        }
        return;
      }
    }

    try {
      // 执行修改操作
      await this.performUserEdit(username, changes, originalUserInfo);

      // 关闭模态框
      closeEditUserModal();

      // 刷新用户列表
      setTimeout(() => {
        this.loadUsersList();
      }, 500);

    } catch (error) {
      console.error('用户编辑失败:', error);
      this.showNotification(`编辑失败: ${error.message}`, 'error');
    }
  }

  // 执行用户编辑操作
  async performUserEdit(username, changes, originalUserInfo) {
    const operations = [];

    try {
      // 修改密码
      if (changes.password) {
        await auth.changeUserPassword(username, changes.password);
        operations.push('密码修改');
      }

      // 修改角色
      if (changes.role) {
        await auth.changeUserRole(username, changes.role);
        operations.push(`角色修改: ${originalUserInfo.role} → ${changes.role}`);
      }

      // 记录管理员操作日志
      await auth.logAdminAction('edit_user', username, {
        changes: changes,
        operations: operations,
        originalInfo: {
          role: originalUserInfo.role
        }
      });

      this.showNotification(`用户 ${username} 编辑成功: ${operations.join(', ')}`, 'success');
      console.log(`✅ 用户 ${username} 编辑成功:`, operations);

    } catch (error) {
      console.error('执行用户编辑操作失败:', error);
      throw error;
    }
  }

  // 删除用户（改进版本）
  async deleteUser(username) {
    console.log(`🗑️ 开始删除用户: ${username}`);

    if (!auth.isAdmin()) {
      this.showNotification('权限不足：只有管理员可以删除用户', 'error');
      return;
    }

    if (!username || username.trim() === '') {
      this.showNotification('用户名无效', 'error');
      return;
    }

    if (username === 'hysteria') {
      this.showNotification('不能删除预设管理员账户', 'error');
      return;
    }

    if (username === auth.currentUser?.username) {
      this.showNotification('不能删除自己的账户', 'error');
      return;
    }

    // 检查用户是否存在
    try {
      const userExists = await auth.getUserByUsername(username);
      if (!userExists) {
        this.showNotification(`用户 ${username} 不存在`, 'error');
        return;
      }
    } catch (error) {
      console.error('检查用户存在性失败:', error);
      this.showNotification('无法验证用户信息，请稍后重试', 'error');
      return;
    }

    // 显示详细的确认对话框
    const confirmMessage = `确定要删除用户 "${username}" 吗？\n\n此操作将：\n• 永久删除用户账户\n• 删除该用户的所有文件\n• 无法恢复\n\n请确认您要继续。`;

    if (!confirm(confirmMessage)) {
      console.log('用户取消删除操作');
      return;
    }

    try {
      await auth.deleteUser(username);
      this.showNotification(`用户 ${username} 已删除`, 'success');
      console.log(`✅ 用户 ${username} 删除成功`);

      // 延迟刷新用户列表，确保删除操作完成
      setTimeout(() => {
        this.loadUsersList();
      }, 500);

    } catch (error) {
      console.error('删除用户失败:', error);
      this.showNotification(`删除用户失败: ${error.message}`, 'error');
    }
  }

  // 加载文件权限列表（管理员功能）
  async loadFilePermissionsList() {
    if (!auth.isAdmin()) return;

    try {
      const filePermissionsList = document.getElementById('filePermissionsList');
      if (!filePermissionsList) return;

      // 获取所有用户的文件
      const users = await auth.getAllUsers();
      let allFiles = [];

      for (const user of users) {
        try {
          const snapshot = await this.database.ref(`userFiles/${user.username}`).once('value');
          const userFiles = snapshot.val() || {};

          Object.entries(userFiles).forEach(([fileId, fileInfo]) => {
            allFiles.push({
              ...fileInfo,
              fileId: fileId,
              owner: user.username
            });
          });
        } catch (error) {
          console.warn(`获取用户 ${user.username} 的文件失败:`, error);
        }
      }

      if (allFiles.length === 0) {
        filePermissionsList.innerHTML = '<p class="no-files">暂无文件</p>';
        return;
      }

      filePermissionsList.innerHTML = `
        <div class="file-grid">
          ${allFiles.map(file => `
            <div class="file-item">
              <div class="file-icon">${this.getFileIcon(file.mainCategory)}</div>
              <div class="file-name">${file.title || file.originalName}</div>
              <div class="file-meta">
                <span>所有者: ${file.owner}</span>
                <span>权限: ${file.permissions?.isPublic ? '公开' : '私有'}</span>
              </div>
              <div class="file-actions">
                <button class="btn btn-sm btn-primary" onclick="window.editFilePermissions('${file.fileId}', '${file.owner}')">编辑权限</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

    } catch (error) {
      console.error('加载文件权限列表失败:', error);
      this.showNotification('加载文件权限列表失败', 'error');
    }
  }

  // 编辑文件权限
  async editFilePermissions(fileId, owner) {
    if (!auth.isAdmin()) {
      this.showNotification('权限不足', 'error');
      return;
    }

    try {
      const snapshot = await this.database.ref(`userFiles/${owner}/${fileId}`).once('value');
      const fileInfo = snapshot.val();

      if (!fileInfo) {
        this.showNotification('文件不存在', 'error');
        return;
      }

      const newPermission = prompt(`设置文件 "${fileInfo.title || fileInfo.originalName}" 的权限:\n\n1. public - 公开\n2. private - 私有\n\n请输入 public 或 private:`);

      if (newPermission === null) return; // 用户取消

      if (newPermission !== 'public' && newPermission !== 'private') {
        this.showNotification('无效的权限设置', 'error');
        return;
      }

      const permissions = {
        isPublic: newPermission === 'public',
        allowedUsers: [],
        blockedUsers: []
      };

      await this.database.ref(`userFiles/${owner}/${fileId}/permissions`).set(permissions);
      this.showNotification(`文件权限已更新为${newPermission === 'public' ? '公开' : '私有'}`, 'success');

      // 刷新文件权限列表
      this.loadFilePermissionsList();

    } catch (error) {
      this.showNotification(`权限设置失败: ${error.message}`, 'error');
    }
  }
}

// 全局变量
let workUploader;

// WorkUploader现在由页面控制初始化时机，不再自动初始化
// 这样可以确保页眉组件先完成初始化，避免登录状态检查冲突

// 提供手动初始化函数供页面调用
window.initWorkUploader = function() {
  // 检查是否已经初始化过，避免重复初始化
  if (window.workUploader) {
    console.log('⚠️ WorkUploader已初始化，跳过重复初始化');
    return window.workUploader;
  }

  console.log('🔄 手动初始化WorkUploader...');

  try {
    const workUploader = new WorkUploader();
    // 将实例赋值给window对象，供全局函数使用
    window.fileUploader = workUploader; // 保持向后兼容
    window.workUploader = workUploader;
    console.log('✅ WorkUploader手动初始化成功');

    return workUploader;
  } catch (error) {
    console.error('❌ WorkUploader手动初始化失败:', error);
    // 即使初始化失败，也要设置一个空对象避免undefined错误
    window.fileUploader = null;
    window.workUploader = null;
    return null;
  }
};