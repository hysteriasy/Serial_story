// 文件层级管理系统 - 三级目录结构展示
class FileHierarchyManager {
  constructor() {
    this.expandedNodes = new Set(); // 记录展开的节点
    this.fileData = new Map(); // 缓存文件数据
    // 美术字体文字设计 - 优雅的中文装饰文字
    this.categoryTexts = {
      literature: '文学',  // 文学作品
      art: '绘画',         // 绘画作品
      music: '音乐',       // 音乐作品
      video: '影像'        // 视频作品
    };

    this.subcategoryTexts = {
      // 文学子分类
      essay: '随笔',       // 生活随笔
      poetry: '诗歌',      // 诗歌创作
      novel: '小说',       // 小说连载

      // 绘画子分类
      painting: '绘画',    // 绘画作品
      sketch: '素描',      // 素描作品
      digital: '数艺',     // 数字艺术

      // 音乐子分类
      original: '原创',    // 原创音乐
      cover: '翻唱',       // 翻唱作品
      instrumental: '器乐', // 器乐演奏

      // 视频子分类
      short: '短片',       // 创意短片
      documentary: '纪录', // 纪录片
      travel: '旅拍'       // 旅行影像
    };
  }

  // 初始化文件层级展示
  async initializeHierarchy(containerId) {
    try {
      console.log('🔄 开始初始化文件层级展示...');

      const container = document.getElementById(containerId);
      if (!container) {
        console.error('容器元素不存在:', containerId);
        return;
      }

      // 显示加载状态
      container.innerHTML = this.createLoadingHTML();

      // 检查权限系统是否已初始化
      if (!window.filePermissionsSystem) {
        console.warn('⚠️ 权限系统未初始化，等待加载...');
        await this.waitForPermissionsSystem();
      }

      // 获取所有文件数据
      console.log('📊 开始构建层级数据...');
      const hierarchyData = await this.buildHierarchyData();
      console.log(`📁 构建完成，共有 ${hierarchyData.size} 个作者的数据`);

      // 渲染层级结构
      container.innerHTML = this.renderHierarchy(hierarchyData);

      // 绑定事件
      this.bindEvents(container);

      console.log('✅ 文件层级展示初始化完成');
    } catch (error) {
      console.error('❌ 文件层级展示初始化失败:', error);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = this.createErrorHTML(error.message);
      }
    }
  }

  // 等待权限系统初始化
  async waitForPermissionsSystem(timeout = 10000) {
    const startTime = Date.now();

    while (!window.filePermissionsSystem && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!window.filePermissionsSystem) {
      throw new Error('权限系统初始化超时');
    }
  }

  // 构建层级数据结构
  async buildHierarchyData() {
    const hierarchy = new Map(); // author -> categories -> subcategories -> works

    try {
      // 获取所有用户（如果是管理员）或当前用户
      let users = [];

      if (auth.isAdmin && auth.isAdmin()) {
        try {
          users = await auth.getAllUsers();
        } catch (error) {
          console.warn('获取所有用户失败，回退到当前用户:', error);
          if (auth.currentUser) {
            users = [auth.currentUser];
          }
        }
      } else if (auth.currentUser) {
        users = [auth.currentUser];
      }

      // 如果没有用户，尝试从存储中发现用户
      if (users.length === 0) {
        users = await this.discoverUsersFromStorage();
      }

      for (const user of users) {
        const username = typeof user === 'string' ? user : user.username;

        // 获取用户的所有文件
        const userFiles = await this.getUserFiles(username);

        if (userFiles.length > 0) {
          const authorData = {
            username: username,
            displayName: user.displayName || username,
            role: user.role || 'visitor',
            totalFiles: userFiles.length,
            categories: new Map()
          };

          // 按类别组织文件
          for (const file of userFiles) {
            const category = file.mainCategory || 'other';
            const subcategory = file.subCategory || file.subcategory || 'default';

            if (!authorData.categories.has(category)) {
              authorData.categories.set(category, {
                name: this.getCategoryName(category),
                text: this.categoryTexts[category] || category,
                totalFiles: 0,
                subcategories: new Map()
              });
            }

            const categoryData = authorData.categories.get(category);
            categoryData.totalFiles++;

            if (!categoryData.subcategories.has(subcategory)) {
              categoryData.subcategories.set(subcategory, {
                name: this.getSubcategoryName(subcategory),
                text: this.subcategoryTexts[subcategory] || subcategory,
                files: []
              });
            }

            categoryData.subcategories.get(subcategory).files.push(file);
          }

          hierarchy.set(username, authorData);
        }
      }

      return hierarchy;
    } catch (error) {
      console.error('构建层级数据失败:', error);
      throw error;
    }
  }

  // 从存储中发现用户
  async discoverUsersFromStorage() {
    const discoveredUsers = new Set();

    try {
      // 1. 从work_*键中发现用户
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('work_')) {
          const workData = localStorage.getItem(key);
          if (workData) {
            const work = JSON.parse(workData);
            if (work.uploadedBy) {
              discoveredUsers.add(work.uploadedBy);
            }
            if (work.author) {
              discoveredUsers.add(work.author);
            }
          }
        }
      }

      // 2. 从公共作品列表中发现用户
      const categories = ['literature', 'art', 'music', 'video'];
      for (const category of categories) {
        const publicWorksKey = `publicWorks_${category}`;
        const publicWorksData = localStorage.getItem(publicWorksKey);
        if (publicWorksData) {
          const publicWorksList = JSON.parse(publicWorksData);
          for (const workRef of publicWorksList) {
            if (workRef.owner) {
              discoveredUsers.add(workRef.owner);
            }
          }
        }
      }

      // 3. 从旧格式随笔中发现用户
      const essaysData = localStorage.getItem('essays');
      if (essaysData) {
        const essays = JSON.parse(essaysData);
        for (const essay of essays) {
          if (essay.author) {
            discoveredUsers.add(essay.author);
          }
        }
      }

      // 4. 添加当前用户
      if (auth.currentUser) {
        discoveredUsers.add(auth.currentUser.username);
      }

      // 转换为用户对象数组
      return Array.from(discoveredUsers).map(username => ({
        username: username,
        displayName: username,
        role: username === 'hysteria' ? 'admin' : 'visitor'
      }));

    } catch (error) {
      console.error('从存储中发现用户失败:', error);
      return [];
    }
  }

  // 获取用户文件
  async getUserFiles(username) {
    const files = [];
    const fileIds = new Set(); // 用于去重

    try {
      // 1. 优先从 GitHub 获取（如果在网络环境）
      if (window.dataManager && window.dataManager.shouldUseGitHubStorage()) {
        console.log(`🌐 从 GitHub 获取用户 ${username} 的文件...`);
        try {
          const githubFiles = await this.getGitHubUserFiles(username);
          for (const file of githubFiles) {
            if (!fileIds.has(file.fileId)) {
              files.push(file);
              fileIds.add(file.fileId);
            }
          }
          console.log(`✅ 从 GitHub 获取到 ${githubFiles.length} 个文件`);
        } catch (githubError) {
          // 只有非404错误才输出警告
          if (!githubError.message.includes('文件不存在') && githubError.status !== 404) {
            console.warn(`从 GitHub 获取用户 ${username} 的文件失败:`, githubError.message);
          }
        }
      }

      // 2. 从本地存储获取
      console.log(`📱 从本地存储获取用户 ${username} 的文件...`);
      const localFiles = await this.getLocalUserFiles(username);
      for (const file of localFiles) {
        if (!fileIds.has(file.fileId)) {
          files.push(file);
          fileIds.add(file.fileId);
        }
      }
      console.log(`✅ 从本地存储获取到 ${localFiles.length} 个文件`);

      // 3. 从Firebase获取（如果可用）
      if (window.firebaseAvailable && firebase.apps && firebase.apps.length) {
        console.log(`🔥 从 Firebase 获取用户 ${username} 的文件...`);
        try {
          const snapshot = await firebase.database().ref(`userFiles/${username}`).once('value');
          const userFiles = snapshot.val() || {};

          for (const [fileId, fileInfo] of Object.entries(userFiles)) {
            if (!fileIds.has(fileId)) {
              // 确保有权限设置
              if (!fileInfo.permissions) {
                fileInfo.permissions = this.createDefaultPermissions(fileInfo);
              }

              // 检查当前用户是否有权限查看此文件
              const accessResult = await window.filePermissionsSystem.checkFileAccess(
                fileInfo.permissions,
                auth.currentUser
              );

              if (accessResult.hasAccess) {
                files.push({
                  ...fileInfo,
                  fileId: fileId,
                  owner: username,
                  accessLevel: accessResult.level
                });
                fileIds.add(fileId);
              }
            }
          }
          console.log(`✅ 从 Firebase 获取到 ${Object.keys(userFiles).length} 个文件`);
        } catch (firebaseError) {
          console.warn(`从Firebase获取用户 ${username} 的文件失败:`, firebaseError);
        }
      }

      console.log(`📁 用户 ${username} 共有 ${files.length} 个可访问文件`);
      return files;
    } catch (error) {
      console.error(`获取用户 ${username} 的文件失败:`, error);
      return [];
    }
  }

  // 从 GitHub 获取用户文件
  async getGitHubUserFiles(username) {
    const files = [];

    try {
      if (!window.dataManager || !window.dataManager.shouldUseGitHubStorage()) {
        return files;
      }

      // 获取 GitHub 中的所有作品文件
      const githubFiles = await this.listGitHubWorkFiles();

      for (const fileInfo of githubFiles) {
        try {
          // 加载文件内容
          const workData = await window.dataManager.loadData(fileInfo.key, {
            category: 'works',
            fallbackToLocal: false
          });

          if (workData && (workData.uploadedBy === username || workData.author === username)) {
            // 确保有权限设置
            if (!workData.permissions) {
              workData.permissions = this.createDefaultPermissions(workData);
            }

            // 检查当前用户是否有权限查看此文件
            const accessResult = await window.filePermissionsSystem.checkFileAccess(
              workData.permissions,
              auth.currentUser
            );

            if (accessResult.hasAccess) {
              files.push({
                ...workData,
                fileId: workData.id,
                owner: username,
                accessLevel: accessResult.level,
                source: 'github'
              });
            }
          }
        } catch (error) {
          // 静默处理单个文件的错误
          if (window.location.search.includes('debug=true')) {
            console.warn(`加载 GitHub 文件失败: ${fileInfo.key}`, error.message);
          }
        }
      }

      return files;
    } catch (error) {
      console.warn(`从 GitHub 获取用户文件失败:`, error.message);
      return [];
    }
  }

  // 列出 GitHub 中的作品文件
  async listGitHubWorkFiles() {
    try {
      if (!window.githubStorage || !window.githubStorage.token) {
        return [];
      }

      // 获取 data/works 目录下的所有文件
      const response = await fetch(
        `https://api.github.com/repos/hysteriasy/Serial_story/contents/data/works`,
        {
          headers: {
            'Authorization': `token ${window.githubStorage.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // 目录不存在是正常情况
          return [];
        }
        throw new Error(`GitHub API 错误: ${response.status}`);
      }

      const files = await response.json();
      return files
        .filter(file => file.type === 'file' && file.name.endsWith('.json'))
        .map(file => ({
          name: file.name,
          key: file.name.replace('.json', ''),
          path: file.path,
          sha: file.sha,
          size: file.size,
          downloadUrl: file.download_url,
          htmlUrl: file.html_url
        }));

    } catch (error) {
      // 只有非404错误才输出警告
      if (!error.message.includes('404') && error.status !== 404) {
        console.warn('列出 GitHub 作品文件失败:', error.message);
      }
      return [];
    }
  }

  // 获取所有 GitHub 文件的详细信息（包括 user-uploads 目录）
  async getAllGitHubFiles() {
    try {
      if (!window.githubStorage || !window.githubStorage.token) {
        return [];
      }

      const allFiles = [];

      // 1. 获取 data/works 目录下的文件
      const workFiles = await this.listGitHubWorkFiles();
      allFiles.push(...workFiles.map(file => ({
        ...file,
        category: 'works',
        type: 'work'
      })));

      // 2. 获取 user-uploads 目录下的文件
      const uploadFiles = await this.listGitHubUserUploads();
      allFiles.push(...uploadFiles);

      return allFiles;
    } catch (error) {
      console.error('获取所有 GitHub 文件失败:', error);
      return [];
    }
  }

  // 列出 user-uploads 目录下的所有文件
  async listGitHubUserUploads() {
    try {
      if (!window.githubStorage || !window.githubStorage.token) {
        return [];
      }

      const allFiles = [];

      // 首先检查 user-uploads 根目录是否存在
      const userUploadsExists = await this.checkDirectoryExists('user-uploads');
      if (!userUploadsExists) {
        console.log('ℹ️ user-uploads 目录不存在，跳过用户上传文件检查');
        return [];
      }

      const categories = ['literature', 'art', 'music', 'video'];

      for (const category of categories) {
        try {
          // 检查分类目录是否存在
          const categoryExists = await this.checkDirectoryExists(`user-uploads/${category}`);
          if (!categoryExists) {
            console.log(`ℹ️ ${category} 分类目录不存在，跳过`);
            continue;
          }

          const categoryFiles = await this.listGitHubCategoryFiles(category);
          allFiles.push(...categoryFiles);
        } catch (error) {
          // 忽略404错误（目录不存在）
          if (error.status !== 404) {
            console.warn(`获取 ${category} 分类文件失败:`, error.message);
          }
        }
      }

      return allFiles;
    } catch (error) {
      console.error('列出用户上传文件失败:', error);
      return [];
    }
  }

  // 检查目录是否存在（带缓存）
  async checkDirectoryExists(path) {
    // 初始化缓存
    if (!this.directoryCache) {
      this.directoryCache = new Map();
    }

    // 检查缓存
    if (this.directoryCache.has(path)) {
      const cached = this.directoryCache.get(path);
      // 缓存5分钟
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        console.log(`📋 使用缓存结果: ${path} -> ${cached.exists}`);
        return cached.exists;
      }
    }

    try {
      console.log(`🔍 检查目录是否存在: ${path}`);
      const response = await fetch(
        `https://api.github.com/repos/hysteriasy/Serial_story/contents/${path}`,
        {
          method: 'HEAD', // 只检查头部，不下载内容
          headers: {
            'Authorization': `token ${window.githubStorage.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      const exists = response.ok;

      // 缓存结果
      this.directoryCache.set(path, {
        exists: exists,
        timestamp: Date.now()
      });

      console.log(`📋 目录检查结果: ${path} -> ${exists ? '存在' : '不存在'}`);
      return exists;
    } catch (error) {
      console.warn(`目录检查失败: ${path}`, error.message);

      // 缓存失败结果（假设不存在）
      this.directoryCache.set(path, {
        exists: false,
        timestamp: Date.now()
      });

      return false;
    }
  }

  // 列出特定分类下的文件
  async listGitHubCategoryFiles(category) {
    const response = await fetch(
      `https://api.github.com/repos/hysteriasy/Serial_story/contents/user-uploads/${category}`,
      {
        headers: {
          'Authorization': `token ${window.githubStorage.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`GitHub API 错误: ${response.status}`);
    }

    const items = await response.json();
    const files = [];

    // 递归遍历子目录
    for (const item of items) {
      if (item.type === 'dir') {
        // 这是子分类目录
        const subFiles = await this.listGitHubSubcategoryFiles(category, item.name);
        files.push(...subFiles);
      } else if (item.type === 'file') {
        // 直接在分类目录下的文件
        files.push({
          name: item.name,
          path: item.path,
          sha: item.sha,
          size: item.size,
          downloadUrl: item.download_url,
          htmlUrl: item.html_url,
          category: category,
          subcategory: 'default',
          type: 'upload'
        });
      }
    }

    return files;
  }

  // 列出子分类下的文件
  async listGitHubSubcategoryFiles(category, subcategory) {
    const response = await fetch(
      `https://api.github.com/repos/hysteriasy/Serial_story/contents/user-uploads/${category}/${subcategory}`,
      {
        headers: {
          'Authorization': `token ${window.githubStorage.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`GitHub API 错误: ${response.status}`);
    }

    const items = await response.json();
    const files = [];

    // 遍历用户目录
    for (const item of items) {
      if (item.type === 'dir') {
        // 这是用户目录
        const userFiles = await this.listGitHubUserFiles(category, subcategory, item.name);
        files.push(...userFiles);
      } else if (item.type === 'file') {
        // 直接在子分类目录下的文件
        files.push({
          name: item.name,
          path: item.path,
          sha: item.sha,
          size: item.size,
          downloadUrl: item.download_url,
          htmlUrl: item.html_url,
          category: category,
          subcategory: subcategory,
          owner: 'unknown',
          type: 'upload'
        });
      }
    }

    return files;
  }

  // 列出特定用户目录下的文件
  async listGitHubUserFiles(category, subcategory, username) {
    const response = await fetch(
      `https://api.github.com/repos/hysteriasy/Serial_story/contents/user-uploads/${category}/${subcategory}/${username}`,
      {
        headers: {
          'Authorization': `token ${window.githubStorage.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`GitHub API 错误: ${response.status}`);
    }

    const items = await response.json();
    return items
      .filter(item => item.type === 'file')
      .map(item => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        size: item.size,
        downloadUrl: item.download_url,
        htmlUrl: item.html_url,
        category: category,
        subcategory: subcategory,
        owner: username,
        type: 'upload'
      }));
  }

  // 从本地存储获取用户文件
  async getLocalUserFiles(username) {
    const files = [];

    try {
      // 1. 遍历localStorage查找新格式的work_*文件
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('work_')) {
          const workData = localStorage.getItem(key);
          if (workData) {
            const work = JSON.parse(workData);
            if (work.uploadedBy === username || work.author === username) {
              // 确保有权限设置
              if (!work.permissions) {
                work.permissions = this.createDefaultPermissions(work);
                // 保存更新后的权限设置
                localStorage.setItem(key, JSON.stringify(work));
              }

              // 异步检查权限
              const accessResult = await window.filePermissionsSystem.checkFileAccess(
                work.permissions,
                auth.currentUser
              );

              if (accessResult.hasAccess) {
                files.push({
                  ...work,
                  fileId: key.replace('work_', ''),
                  owner: username,
                  accessLevel: accessResult.level
                });
              }
            }
          }
        }
      }

      // 2. 处理旧格式的随笔数据（essays键）
      const essaysData = localStorage.getItem('essays');
      if (essaysData) {
        try {
          const essays = JSON.parse(essaysData);
          for (const essay of essays) {
            // 检查这个随笔是否属于当前用户
            const essayAuthor = essay.author || 'hysteria'; // 默认作者为hysteria
            if (essayAuthor === username || username === 'hysteria') {
              // 为旧格式随笔创建新格式数据
              const essayWork = {
                id: `essay_legacy_${essay.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.parse(essay.date) || Date.now()}`,
                mainCategory: 'literature',
                subCategory: 'essay',
                categoryName: '文学作品',
                subcategoryName: '生活随笔',
                title: essay.title,
                content: essay.content,
                uploadedBy: essayAuthor,
                uploadTime: essay.date,
                originalName: essay.title,
                permissions: this.createDefaultPermissions({
                  isPublic: true,
                  uploadedBy: essayAuthor
                }),
                storage_type: 'legacy_essay'
              };

              // 检查权限
              const accessResult = await window.filePermissionsSystem.checkFileAccess(
                essayWork.permissions,
                auth.currentUser
              );

              if (accessResult.hasAccess) {
                files.push({
                  ...essayWork,
                  fileId: essayWork.id,
                  owner: essayWork.uploadedBy,
                  accessLevel: accessResult.level
                });
              }
            }
          }
        } catch (essayError) {
          console.warn('处理旧格式随笔数据失败:', essayError);
        }
      }

      // 3. 从公共作品列表中获取用户的作品
      await this.getPublicWorksForUser(username, files);

    } catch (error) {
      console.error(`从本地存储获取用户 ${username} 的文件失败:`, error);
    }

    return files;
  }

  // 从公共作品列表中获取用户的作品
  async getPublicWorksForUser(username, files) {
    const categories = ['literature', 'art', 'music', 'video'];

    for (const category of categories) {
      try {
        const publicWorksKey = `publicWorks_${category}`;
        const publicWorksData = localStorage.getItem(publicWorksKey);

        if (publicWorksData) {
          const publicWorksList = JSON.parse(publicWorksData);

          for (const workRef of publicWorksList) {
            if (workRef.owner === username) {
              const fullWorkData = localStorage.getItem(`work_${workRef.id}`);
              if (fullWorkData) {
                const workInfo = JSON.parse(fullWorkData);

                // 确保有权限设置
                if (!workInfo.permissions) {
                  workInfo.permissions = this.createDefaultPermissions(workInfo);
                  localStorage.setItem(`work_${workRef.id}`, JSON.stringify(workInfo));
                }

                // 检查是否已经添加过这个文件
                if (!files.find(f => f.fileId === workRef.id)) {
                  const accessResult = await window.filePermissionsSystem.checkFileAccess(
                    workInfo.permissions,
                    auth.currentUser
                  );

                  if (accessResult.hasAccess) {
                    files.push({
                      ...workInfo,
                      fileId: workRef.id,
                      owner: username,
                      accessLevel: accessResult.level
                    });
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn(`获取 ${category} 类别的公共作品失败:`, error);
      }
    }
  }

  // 创建默认权限设置
  createDefaultPermissions(work) {
    // 如果作品有isPublic标志，使用它
    const isPublic = work.isPublic !== undefined ? work.isPublic : true;
    const level = isPublic ? 'public' : 'private';

    return window.filePermissionsSystem.createPermissionStructure(level, {
      reason: '从旧格式数据迁移的默认权限设置'
    });
  }

  // 渲染层级结构
  renderHierarchy(hierarchyData) {
    if (hierarchyData.size === 0) {
      return this.createEmptyHTML();
    }

    let html = `
      <div class="file-hierarchy">
        <div class="hierarchy-header">
          <h3>📁 文件权限管理</h3>
          <div class="hierarchy-stats">
            <span class="stat-item">👥 ${hierarchyData.size} 位作者</span>
            <span class="stat-item">📄 ${this.getTotalFiles(hierarchyData)} 个文件</span>
          </div>
          <div class="hierarchy-controls">
            <button class="btn btn-sm btn-secondary" onclick="fileHierarchyManager.expandAll()">展开全部</button>
            <button class="btn btn-sm btn-secondary" onclick="fileHierarchyManager.collapseAll()">折叠全部</button>
            <button class="btn btn-sm btn-primary" onclick="fileHierarchyManager.refreshHierarchy()">刷新</button>
          </div>
        </div>
        <div class="hierarchy-tree">
    `;

    // 渲染每个作者
    for (const [username, authorData] of hierarchyData) {
      html += this.renderAuthorNode(username, authorData);
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  // 渲染作者节点
  renderAuthorNode(username, authorData) {
    const nodeId = `author-${username}`;
    const isExpanded = this.expandedNodes.has(nodeId);
    const expandIcon = isExpanded ? '▼' : '▶';

    let html = `
      <div class="tree-node author-node" data-node-id="${nodeId}">
        <div class="node-header" onclick="fileHierarchyManager.toggleNode('${nodeId}')">
          <span class="expand-icon">${expandIcon}</span>
          <span class="node-text author-text">作者</span>
          <span class="node-title">${authorData.displayName}</span>
          <span class="node-badge role-${authorData.role}">${this.getRoleName(authorData.role)}</span>
          <span class="node-stats">${authorData.totalFiles} 个文件</span>
        </div>
        <div class="node-children" style="display: ${isExpanded ? 'block' : 'none'}">
    `;

    // 渲染类别节点
    for (const [categoryKey, categoryData] of authorData.categories) {
      html += this.renderCategoryNode(username, categoryKey, categoryData);
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  // 渲染类别节点
  renderCategoryNode(username, categoryKey, categoryData) {
    const nodeId = `category-${username}-${categoryKey}`;
    const isExpanded = this.expandedNodes.has(nodeId);
    const expandIcon = isExpanded ? '▼' : '▶';
    const categoryText = this.categoryTexts[categoryKey] || categoryKey;

    let html = `
      <div class="tree-node category-node" data-node-id="${nodeId}">
        <div class="node-header" onclick="fileHierarchyManager.toggleNode('${nodeId}')">
          <span class="expand-icon">${expandIcon}</span>
          <span class="node-text category-text">${categoryText}</span>
          <span class="node-title">${categoryData.name}</span>
          <span class="node-stats">${categoryData.totalFiles} 个文件</span>
        </div>
        <div class="node-children" style="display: ${isExpanded ? 'block' : 'none'}">
    `;

    // 渲染子类别节点
    for (const [subcategoryKey, subcategoryData] of categoryData.subcategories) {
      html += this.renderSubcategoryNode(username, categoryKey, subcategoryKey, subcategoryData);
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  // 渲染子类别节点
  renderSubcategoryNode(username, categoryKey, subcategoryKey, subcategoryData) {
    const nodeId = `subcategory-${username}-${categoryKey}-${subcategoryKey}`;
    const isExpanded = this.expandedNodes.has(nodeId);
    const expandIcon = isExpanded ? '▼' : '▶';
    const subcategoryText = this.subcategoryTexts[subcategoryKey] || subcategoryKey;

    let html = `
      <div class="tree-node subcategory-node" data-node-id="${nodeId}">
        <div class="node-header" onclick="fileHierarchyManager.toggleNode('${nodeId}')">
          <span class="expand-icon">${expandIcon}</span>
          <span class="node-text subcategory-text">${subcategoryText}</span>
          <span class="node-title">${subcategoryData.name}</span>
          <span class="node-stats">${subcategoryData.files.length} 个文件</span>
        </div>
        <div class="node-children" style="display: ${isExpanded ? 'block' : 'none'}">
    `;

    // 渲染文件节点
    for (const file of subcategoryData.files) {
      html += this.renderFileNode(file);
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  // 渲染文件节点
  renderFileNode(file) {
    const permissionLevel = file.permissions?.level || 'private';
    const permissionIcon = this.getPermissionIcon(permissionLevel);
    const permissionText = this.getPermissionText(permissionLevel);

    // 检查是否为管理员，决定是否显示删除按钮
    const isAdmin = auth.isAdmin && auth.isAdmin();
    const deleteButton = isAdmin ? `
      <button class="btn btn-xs btn-danger" onclick="fileHierarchyManager.deleteFile('${file.fileId}', '${file.owner}')" title="删除文件">
        删除
      </button>
    ` : '';

    return `
      <div class="tree-node file-node" data-file-id="${file.fileId}" data-owner="${file.owner}">
        <div class="node-header">
          <span class="node-text file-text">文件</span>
          <span class="node-title">${file.title || file.originalName || '未命名文件'}</span>
          <span class="permission-badge permission-${permissionLevel}" title="${permissionText}">
            ${permissionIcon} ${permissionText}
          </span>
          <div class="file-actions">
            <button class="btn btn-xs btn-primary" onclick="fileHierarchyManager.editFilePermissions('${file.fileId}', '${file.owner}')" title="编辑权限">
              设置
            </button>
            <button class="btn btn-xs btn-info" onclick="fileHierarchyManager.viewFileDetails('${file.fileId}', '${file.owner}')" title="查看详情">
              详情
            </button>
            ${deleteButton}
          </div>
        </div>
      </div>
    `;
  }

  // 切换节点展开/折叠状态
  toggleNode(nodeId) {
    const node = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (!node) return;

    const children = node.querySelector('.node-children');
    const expandIcon = node.querySelector('.expand-icon');
    
    if (this.expandedNodes.has(nodeId)) {
      // 折叠
      this.expandedNodes.delete(nodeId);
      children.style.display = 'none';
      expandIcon.textContent = '📁';
    } else {
      // 展开
      this.expandedNodes.add(nodeId);
      children.style.display = 'block';
      expandIcon.textContent = '📂';
    }
  }

  // 展开所有节点
  expandAll() {
    const allNodes = document.querySelectorAll('.tree-node[data-node-id]');
    allNodes.forEach(node => {
      const nodeId = node.getAttribute('data-node-id');
      this.expandedNodes.add(nodeId);
      
      const children = node.querySelector('.node-children');
      const expandIcon = node.querySelector('.expand-icon');
      
      if (children) children.style.display = 'block';
      if (expandIcon) expandIcon.textContent = '📂';
    });
  }

  // 折叠所有节点
  collapseAll() {
    this.expandedNodes.clear();
    
    const allNodes = document.querySelectorAll('.tree-node[data-node-id]');
    allNodes.forEach(node => {
      const children = node.querySelector('.node-children');
      const expandIcon = node.querySelector('.expand-icon');
      
      if (children) children.style.display = 'none';
      if (expandIcon) expandIcon.textContent = '📁';
    });
  }



  // 编辑文件权限
  editFilePermissions(fileId, owner) {
    if (window.filePermissionsUI) {
      window.filePermissionsUI.showPermissionsModal(fileId, owner);
    } else {
      console.error('权限设置界面未初始化');
    }
  }

  // 刷新层级结构
  async refreshHierarchy(preserveState = false) {
    const container = document.getElementById('fileHierarchyContainer');
    if (container) {
      let savedState = null;

      // 如果需要保持状态，先保存当前状态
      if (preserveState) {
        savedState = this.saveCurrentState();
      }

      await this.initializeHierarchy('fileHierarchyContainer');

      // 恢复状态
      if (preserveState && savedState) {
        this.expandedNodes = savedState.expandedNodes;
        setTimeout(() => {
          container.scrollTop = savedState.scrollTop;
          container.scrollLeft = savedState.scrollLeft;
        }, 100);
      }

      // 触发刷新事件
      document.dispatchEvent(new CustomEvent('hierarchyRefreshed'));
    }
  }

  // 删除文件
  async deleteFile(fileId, owner) {
    try {
      // 增强权限检查
      const permissionCheck = await this.checkDeletePermission(fileId, owner);
      if (!permissionCheck.allowed) {
        this.showNotification(permissionCheck.reason, 'error');
        return;
      }

      // 保存当前展开状态和滚动位置
      const currentState = this.saveCurrentState();

      // 获取文件信息用于确认对话框
      const fileInfo = await this.getFileInfo(fileId, owner);
      const fileName = fileInfo?.title || fileInfo?.originalName || fileId;

      // 显示确认对话框
      const confirmed = await this.showDeleteConfirmDialog(fileName, owner);
      if (!confirmed) {
        return;
      }

      // 添加删除动画效果
      const fileNode = document.querySelector(`[data-file-id="${fileId}"][data-owner="${owner}"]`);
      if (fileNode) {
        fileNode.style.transition = 'all 0.3s ease';
        fileNode.style.opacity = '0.5';
        fileNode.style.transform = 'translateX(-20px)';
      }

      // 显示删除进度
      this.showNotification('正在删除文件...', 'info');

      // 执行删除操作
      const result = await this.performFileDelete(fileId, owner);

      if (result.success) {
        this.showNotification(`文件 "${fileName}" 已成功删除 (删除了 ${result.deletedCount} 个数据源)`, 'success');

        // 更新首页统计数据
        if (typeof window.updateHomepageStats === 'function') {
          window.updateHomepageStats();
        }

        // 智能刷新：保持位置和展开状态
        await this.smartRefreshAfterDelete(currentState, fileId, owner);
      } else {
        // 恢复文件节点样式
        if (fileNode) {
          fileNode.style.opacity = '1';
          fileNode.style.transform = 'translateX(0)';
        }

        // 显示详细错误信息
        let errorMessage = `删除失败: ${result.message}`;
        if (result.errors && result.errors.length > 0) {
          errorMessage += '\n详细错误:\n' + result.errors.join('\n');
        }
        this.showNotification(errorMessage, 'error');
      }

    } catch (error) {
      console.error('删除文件失败:', error);
      this.showNotification(`删除文件时发生错误: ${error.message}`, 'error');
    }
  }

  // 检查删除权限
  async checkDeletePermission(fileId, owner) {
    try {
      // 检查用户是否已登录
      if (!auth.currentUser) {
        return {
          allowed: false,
          reason: '请先登录'
        };
      }

      // 检查是否为管理员
      if (auth.isAdmin && auth.isAdmin()) {
        return {
          allowed: true,
          reason: '管理员权限'
        };
      }

      // 检查是否为文件所有者
      if (auth.currentUser.username === owner) {
        return {
          allowed: true,
          reason: '文件所有者权限'
        };
      }

      // 检查是否有特殊权限（如果有权限系统）
      if (window.filePermissionsSystem) {
        try {
          const fileInfo = await this.getFileInfo(fileId, owner);
          if (fileInfo && fileInfo.permissions) {
            const accessCheck = await window.filePermissionsSystem.checkFileAccess(
              fileInfo.permissions,
              auth.currentUser
            );

            if (accessCheck.hasAccess && accessCheck.level === 'admin') {
              return {
                allowed: true,
                reason: '特殊管理权限'
              };
            }
          }
        } catch (error) {
          console.warn('权限系统检查失败:', error);
        }
      }

      return {
        allowed: false,
        reason: '权限不足：只有管理员或文件所有者可以删除文件'
      };

    } catch (error) {
      console.error('权限检查失败:', error);
      return {
        allowed: false,
        reason: `权限检查失败: ${error.message}`
      };
    }
  }

  // 保存当前状态
  saveCurrentState() {
    const container = document.getElementById('fileHierarchyContainer');
    return {
      expandedNodes: new Set(this.expandedNodes),
      scrollTop: container ? container.scrollTop : 0,
      scrollLeft: container ? container.scrollLeft : 0
    };
  }

  // 智能刷新：删除后保持位置和展开状态
  async smartRefreshAfterDelete(savedState, deletedFileId, deletedOwner) {
    try {
      // 重新构建层级数据
      const hierarchyData = await this.buildHierarchyData();

      // 检查删除的文件是否是某个节点的最后一个文件
      const shouldCollapseNodes = this.checkForEmptyNodes(hierarchyData, savedState.expandedNodes);

      // 更新展开状态
      this.expandedNodes = new Set(savedState.expandedNodes);

      // 移除空节点的展开状态
      shouldCollapseNodes.forEach(nodeId => {
        this.expandedNodes.delete(nodeId);
      });

      // 重新渲染
      const container = document.getElementById('fileHierarchyContainer');
      if (container) {
        container.innerHTML = this.renderHierarchy(hierarchyData);
        this.bindEvents(container);

        // 恢复滚动位置（延迟执行以确保DOM更新完成）
        setTimeout(() => {
          container.scrollTop = savedState.scrollTop;
          container.scrollLeft = savedState.scrollLeft;
        }, 100);
      }

      // 触发刷新事件
      document.dispatchEvent(new CustomEvent('hierarchyRefreshed', {
        detail: { deletedFile: { id: deletedFileId, owner: deletedOwner } }
      }));

    } catch (error) {
      console.error('智能刷新失败:', error);
      // 回退到普通刷新
      await this.refreshHierarchy();
    }
  }

  // 检查空节点
  checkForEmptyNodes(hierarchyData, expandedNodes) {
    const nodesToCollapse = [];

    for (const [username, authorData] of hierarchyData) {
      // 检查作者节点是否为空
      if (authorData.totalFiles === 0) {
        nodesToCollapse.push(`author-${username}`);
        continue;
      }

      // 检查类别节点
      for (const [categoryKey, categoryData] of authorData.categories) {
        if (categoryData.totalFiles === 0) {
          nodesToCollapse.push(`category-${username}-${categoryKey}`);
          continue;
        }

        // 检查子类别节点
        for (const [subcategoryKey, subcategoryData] of categoryData.subcategories) {
          if (subcategoryData.files.length === 0) {
            nodesToCollapse.push(`subcategory-${username}-${categoryKey}-${subcategoryKey}`);
          }
        }
      }
    }

    return nodesToCollapse;
  }

  // 显示删除确认对话框
  showDeleteConfirmDialog(fileName, owner) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal delete-confirm-modal';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-content delete-confirm-content">
          <div class="modal-header">
            <h3>🗑️ 确认删除文件</h3>
          </div>
          <div class="modal-body">
            <div class="delete-warning">
              <div class="warning-icon">⚠️</div>
              <div class="warning-text">
                <p><strong>您确定要删除以下文件吗？</strong></p>
                <p class="file-info">文件名：<span class="file-name">${fileName}</span></p>
                <p class="file-info">作者：<span class="file-owner">${owner}</span></p>
                <p class="warning-note">此操作不可撤销，文件将被永久删除！</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove(); window.deleteFileResolve(false);">取消</button>
            <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove(); window.deleteFileResolve(true);">确认删除</button>
          </div>
        </div>
      `;

      // 设置全局回调
      window.deleteFileResolve = resolve;

      document.body.appendChild(modal);

      // 点击背景关闭
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(false);
        }
      });
    });
  }

  // 执行文件删除操作
  async performFileDelete(fileId, owner) {
    try {
      let deletedCount = 0;
      const errors = [];
      const deletionLog = [];

      console.log(`🗑️ 开始删除文件: ${fileId} (所有者: ${owner})`);

      // 1. 从localStorage删除work_*文件
      const workKey = `work_${fileId}`;
      try {
        if (localStorage.getItem(workKey)) {
          localStorage.removeItem(workKey);
          deletedCount++;
          deletionLog.push(`✅ 本地存储: ${workKey}`);
          console.log(`✅ 从本地存储删除: ${workKey}`);
        } else {
          deletionLog.push(`ℹ️ 本地存储: ${workKey} 不存在`);
        }
      } catch (error) {
        errors.push(`删除本地存储失败: ${error.message}`);
        deletionLog.push(`❌ 本地存储: ${error.message}`);
      }

      // 2. 从公共作品列表中删除引用
      const categories = ['literature', 'art', 'music', 'video'];
      for (const category of categories) {
        try {
          const publicWorksKey = `publicWorks_${category}`;
          const publicWorksData = localStorage.getItem(publicWorksKey);
          if (publicWorksData) {
            const publicWorksList = JSON.parse(publicWorksData);
            const originalLength = publicWorksList.length;
            const filteredList = publicWorksList.filter(work => work.id !== fileId);

            if (filteredList.length !== originalLength) {
              localStorage.setItem(publicWorksKey, JSON.stringify(filteredList));
              deletedCount++;
              deletionLog.push(`✅ 公共列表 ${category}: 删除了引用`);
              console.log(`✅ 从 ${category} 公共列表删除引用`);
            } else {
              deletionLog.push(`ℹ️ 公共列表 ${category}: 无引用`);
            }
          } else {
            deletionLog.push(`ℹ️ 公共列表 ${category}: 列表不存在`);
          }
        } catch (error) {
          errors.push(`删除 ${category} 类别引用失败: ${error.message}`);
          deletionLog.push(`❌ 公共列表 ${category}: ${error.message}`);
        }
      }

      // 3. 从GitHub删除（如果可用且在网络环境）
      if (window.dataManager && window.dataManager.shouldUseGitHubStorage()) {
        try {
          // 只在调试模式下输出详细日志
          if (window.location.search.includes('debug=true')) {
            console.log(`🌐 尝试从GitHub删除: ${workKey}`);
          }

          const deleteResult = await window.dataManager.deleteData(workKey, { category: 'works' });

          if (deleteResult.githubResult) {
            if (deleteResult.githubResult.alreadyDeleted) {
              deletionLog.push(`ℹ️ GitHub存储: ${workKey} (文件已不存在)`);
            } else {
              deletedCount++;
              deletionLog.push(`✅ GitHub存储: ${workKey}`);
            }
          } else {
            // GitHub删除被跳过（可能是token未配置等）
            deletionLog.push(`ℹ️ GitHub存储: 跳过删除 ${workKey}`);
          }
        } catch (error) {
          // 只有在非404错误时才记录为错误
          if (!error.message.includes('文件不存在') && !error.message.includes('404') &&
              !error.message.includes('Not Found') && error.status !== 404) {
            console.warn(`⚠️ 从GitHub删除失败: ${error.message}`);
            errors.push(`删除GitHub数据失败: ${error.message}`);
            deletionLog.push(`❌ GitHub存储: ${error.message}`);
          } else {
            // 文件不存在是正常情况，不记录为错误
            deletionLog.push(`ℹ️ GitHub存储: ${workKey} (文件不存在，跳过删除)`);
          }
        }
      } else {
        deletionLog.push(`ℹ️ GitHub存储: 未启用或不可用`);
      }

      // 4. 从Firebase删除（如果可用）
      if (window.firebaseAvailable && firebase.apps && firebase.apps.length) {
        try {
          await firebase.database().ref(`userFiles/${owner}/${fileId}`).remove();
          deletedCount++;
          deletionLog.push(`✅ Firebase: userFiles/${owner}/${fileId}`);
          console.log(`✅ 从Firebase删除: userFiles/${owner}/${fileId}`);
        } catch (error) {
          errors.push(`删除Firebase数据失败: ${error.message}`);
          deletionLog.push(`❌ Firebase: ${error.message}`);
        }
      } else {
        deletionLog.push(`ℹ️ Firebase: 不可用`);
      }

      // 5. 处理旧格式随笔数据
      if (fileId.startsWith('essay_legacy_')) {
        try {
          const essaysData = localStorage.getItem('essays');
          if (essaysData) {
            const essays = JSON.parse(essaysData);
            const fileInfo = await this.getFileInfo(fileId, owner);
            const originalLength = essays.length;
            const filteredEssays = essays.filter(essay => essay.title !== fileInfo?.title);

            if (filteredEssays.length !== originalLength) {
              localStorage.setItem('essays', JSON.stringify(filteredEssays));
              deletedCount++;
              deletionLog.push(`✅ 旧格式随笔: 删除了引用`);
              console.log(`✅ 从旧格式随笔删除引用`);
            } else {
              deletionLog.push(`ℹ️ 旧格式随笔: 无引用`);
            }
          } else {
            deletionLog.push(`ℹ️ 旧格式随笔: 数据不存在`);
          }
        } catch (error) {
          errors.push(`删除旧格式随笔失败: ${error.message}`);
          deletionLog.push(`❌ 旧格式随笔: ${error.message}`);
        }
      }

      // 6. 删除权限设置（如果存在）
      try {
        // 检查旧格式的权限设置键
        const oldPermissionKey = `permissions_${fileId}_${owner}`;
        if (localStorage.getItem(oldPermissionKey)) {
          localStorage.removeItem(oldPermissionKey);
          deletedCount++;
          deletionLog.push(`✅ 旧格式权限设置: ${oldPermissionKey}`);
          console.log(`✅ 删除旧格式权限设置: ${oldPermissionKey}`);
        }

        // 权限设置现在存储在作品数据中，已经在步骤1中删除了
        deletionLog.push(`ℹ️ 权限设置: 已包含在作品数据中删除`);
      } catch (error) {
        errors.push(`删除权限设置失败: ${error.message}`);
        deletionLog.push(`❌ 权限设置: ${error.message}`);
      }

      // 输出删除日志
      console.log('🗑️ 删除操作完成，详细日志:');
      deletionLog.forEach(log => console.log(`  ${log}`));

      const success = deletedCount > 0;
      const message = success
        ? `成功删除 ${deletedCount} 个数据项` + (errors.length > 0 ? ` (部分失败: ${errors.length} 个错误)` : '')
        : errors.length > 0 ? errors.join('; ') : '没有找到要删除的数据';

      return {
        success,
        message,
        deletedCount,
        errors,
        deletionLog
      };

    } catch (error) {
      console.error('❌ 删除操作异常:', error);
      return {
        success: false,
        message: `删除操作异常: ${error.message}`,
        deletedCount: 0,
        errors: [error.message],
        deletionLog: [`❌ 异常: ${error.message}`]
      };
    }
  }

  // 获取文件信息
  async getFileInfo(fileId, owner) {
    try {
      const workKey = `work_${fileId}`;

      // 1. 优先从GitHub获取（如果在网络环境）
      if (window.dataManager && window.dataManager.shouldUseGitHubStorage()) {
        try {
          const githubData = await window.dataManager.loadData(workKey, {
            category: 'works',
            fallbackToLocal: false
          });
          if (githubData) {
            console.log(`📁 从GitHub获取文件信息: ${fileId}`);
            return githubData;
          }
        } catch (error) {
          console.warn(`⚠️ 从GitHub获取文件信息失败: ${error.message}`);
        }
      }

      // 2. 从localStorage获取
      const workData = localStorage.getItem(workKey);
      if (workData) {
        console.log(`📱 从本地存储获取文件信息: ${fileId}`);
        return JSON.parse(workData);
      }

      // 3. 从Firebase获取
      if (window.firebaseAvailable && firebase.apps && firebase.apps.length) {
        try {
          const snapshot = await firebase.database().ref(`userFiles/${owner}/${fileId}`).once('value');
          const fileData = snapshot.val();
          if (fileData) {
            console.log(`🔥 从Firebase获取文件信息: ${fileId}`);
            return fileData;
          }
        } catch (error) {
          console.warn(`⚠️ 从Firebase获取文件信息失败: ${error.message}`);
        }
      }

      // 4. 如果是旧格式随笔，从essays中查找
      if (fileId.startsWith('essay_legacy_')) {
        const essaysData = localStorage.getItem('essays');
        if (essaysData) {
          const essays = JSON.parse(essaysData);
          // 根据fileId中的标题查找
          const titleFromId = fileId.replace('essay_legacy_', '').split('_')[0];
          return essays.find(essay => essay.title.replace(/[^a-zA-Z0-9]/g, '_') === titleFromId);
        }
      }

      return null;
    } catch (error) {
      console.error('获取文件信息失败:', error);
      return null;
    }
  }

  // 查看文件详情
  async viewFileDetails(fileId, owner) {
    try {
      if (window.fileDetailsViewer) {
        await window.fileDetailsViewer.showFileDetails(fileId, owner);
      } else {
        // 临时实现，显示基本信息
        const fileInfo = await this.getFileInfo(fileId, owner);
        const permissions = await window.filePermissionsSystem.getFilePermissions(fileId, owner);

        alert(`文件详情：\n标题：${fileInfo?.title || '未知'}\n作者：${owner}\n权限：${permissions?.level || '未设置'}`);
      }
    } catch (error) {
      console.error('获取文件详情失败:', error);
      this.showNotification('获取文件详情失败', 'error');
    }
  }

  // 辅助方法
  getCategoryName(category) {
    const names = {
      literature: '文学作品',
      art: '绘画作品',
      music: '音乐作品',
      video: '视频作品'
    };
    return names[category] || category;
  }

  getSubcategoryName(subcategory) {
    const names = {
      essay: '生活随笔',
      poetry: '诗歌创作',
      novel: '小说连载',
      painting: '绘画作品',
      sketch: '素描作品',
      digital: '数字艺术',
      original: '原创音乐',
      cover: '翻唱作品',
      instrumental: '器乐演奏',
      short: '创意短片',
      documentary: '纪录片',
      travel: '旅行影像'
    };
    return names[subcategory] || subcategory;
  }

  getRoleName(role) {
    const names = {
      admin: '管理员',
      friend: '好友',
      visitor: '访客'
    };
    return names[role] || role;
  }

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

  getTotalFiles(hierarchyData) {
    let total = 0;
    for (const [, authorData] of hierarchyData) {
      total += authorData.totalFiles;
    }
    return total;
  }

  // HTML模板方法
  createLoadingHTML() {
    return `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载文件层级结构...</p>
      </div>
    `;
  }

  createEmptyHTML() {
    return `
      <div class="empty-container">
        <div class="empty-icon">📁</div>
        <h3>暂无文件</h3>
        <p>系统中还没有任何文件，请先上传一些作品。</p>
      </div>
    `;
  }

  createErrorHTML(message) {
    return `
      <div class="error-container">
        <div class="error-icon">❌</div>
        <h3>加载失败</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="fileHierarchyManager.refreshHierarchy()">重试</button>
      </div>
    `;
  }

  // 绑定事件
  bindEvents(container) {
    // 这里可以添加其他事件绑定
    console.log('文件层级管理器事件已绑定');
  }

  // 显示通知消息
  showNotification(message, type = 'info') {
    // 尝试使用全局通知函数
    if (typeof showNotification !== 'undefined') {
      showNotification(message, type);
      return;
    }

    // 创建简单的通知
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
      z-index: 10001;
      animation: slideInRight 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
    `;

    document.body.appendChild(notification);

    // 自动移除通知
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 3000);
  }

  // 获取通知颜色
  getNotificationColor(type) {
    const colors = {
      success: '#4CAF50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196F3'
    };
    return colors[type] || colors.info;
  }

  // 添加层级管理器样式
  addHierarchyStyles() {
    if (document.getElementById('hierarchyStyles')) return;

    const style = document.createElement('style');
    style.id = 'hierarchyStyles';
    style.textContent = `
      /* 文件层级管理器样式 */
      .file-hierarchy {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .hierarchy-header {
        padding: 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .hierarchy-header h3 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
        font-weight: 600;
      }

      .hierarchy-stats {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }

      .stat-item {
        background: rgba(255, 255, 255, 0.2);
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .hierarchy-controls {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .hierarchy-controls .btn {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .hierarchy-controls .btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      .hierarchy-tree {
        padding: 1rem;
        max-height: 70vh;
        overflow-y: auto;
      }

      /* 树节点样式 */
      .tree-node {
        margin-bottom: 0.5rem;
      }

      .node-header {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 1px solid transparent;
      }

      .node-header:hover {
        background: #f8f9fa;
        border-color: #e9ecef;
        transform: translateX(2px);
      }

      .expand-icon {
        margin-right: 0.5rem;
        font-size: 1rem;
        transition: transform 0.3s ease;
      }

      .node-icon {
        margin-right: 0.75rem;
        font-size: 1.25rem;
      }

      .node-title {
        flex: 1;
        font-weight: 500;
        color: #333;
      }

      .node-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
        color: white;
        margin-right: 0.5rem;
      }

      .node-stats {
        font-size: 0.875rem;
        color: #6c757d;
        margin-left: 0.5rem;
      }

      /* 节点层级样式 */
      .author-node {
        border-left: 4px solid #007bff;
        margin-bottom: 1rem;
      }

      .author-node .node-header {
        background: #f8f9ff;
        font-weight: 600;
      }

      .category-node {
        margin-left: 1rem;
        border-left: 3px solid #28a745;
      }

      .category-node .node-header {
        background: #f8fff8;
      }

      .subcategory-node {
        margin-left: 2rem;
        border-left: 2px solid #fd7e14;
      }

      .subcategory-node .node-header {
        background: #fffaf8;
      }

      .file-node {
        margin-left: 3rem;
        border-left: 1px solid #6c757d;
      }

      .file-node .node-header {
        background: #fafafa;
        cursor: default;
      }

      .file-node .node-header:hover {
        background: #f0f0f0;
        transform: none;
      }

      /* 节点子元素样式 */
      .node-children {
        margin-top: 0.5rem;
        animation: slideDown 0.3s ease-out;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          max-height: 0;
        }
        to {
          opacity: 1;
          max-height: 1000px;
        }
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
        margin-right: 0.5rem;
      }

      .permission-public { background: #28a745; }
      .permission-visitor { background: #007bff; }
      .permission-friend { background: #fd7e14; }
      .permission-custom { background: #6f42c1; }
      .permission-private { background: #dc3545; }

      /* 文件操作按钮样式 */
      .file-actions {
        display: flex;
        gap: 0.25rem;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .file-node:hover .file-actions {
        opacity: 1;
      }

      .file-actions .btn {
        padding: 0.25rem 0.5rem;
        border: none;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .btn-xs {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
      }

      .btn-primary {
        background: #007bff;
        color: white;
      }

      .btn-primary:hover {
        background: #0056b3;
        transform: translateY(-1px);
      }

      .btn-secondary {
        background: #6c757d;
        color: white;
      }

      .btn-secondary:hover {
        background: #545b62;
        transform: translateY(-1px);
      }

      /* 加载和错误状态样式 */
      .loading-container,
      .empty-container,
      .error-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        text-align: center;
        color: #6c757d;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .empty-icon,
      .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .empty-container h3,
      .error-container h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
      }

      .empty-container p,
      .error-container p {
        margin: 0 0 1rem 0;
        color: #6c757d;
      }

      /* 响应式设计 */
      @media (max-width: 768px) {
        .hierarchy-header {
          padding: 1rem;
        }

        .hierarchy-stats {
          flex-direction: column;
          gap: 0.5rem;
        }

        .hierarchy-controls {
          flex-direction: column;
        }

        .hierarchy-controls .btn {
          width: 100%;
          text-align: center;
        }

        .node-header {
          padding: 0.5rem;
          flex-wrap: wrap;
        }

        .node-title {
          flex-basis: 100%;
          margin-bottom: 0.5rem;
        }

        .file-actions {
          opacity: 1;
        }

        .category-node,
        .subcategory-node,
        .file-node {
          margin-left: 0.5rem;
        }
      }

      /* 滚动条样式 */
      .hierarchy-tree::-webkit-scrollbar {
        width: 6px;
      }

      .hierarchy-tree::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }

      .hierarchy-tree::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }

      .hierarchy-tree::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
    `;

    document.head.appendChild(style);
  }
}

// 添加文件层级管理器样式增强
function addHierarchyManagerStyles() {
  if (document.getElementById('hierarchyManagerStyles')) return;

  const style = document.createElement('style');
  style.id = 'hierarchyManagerStyles';
  style.textContent = `
    /* 文件层级管理器样式增强 */
    .hierarchy-container {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    /* 美术字体文字样式 */
    .node-text {
      font-family: 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'SimSun', serif;
      font-weight: 700;
      font-size: 0.875rem;
      padding: 0.25rem 0.75rem;
      border-radius: 8px;
      margin-right: 0.5rem;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
      letter-spacing: 0.5px;
      min-width: 3rem;
      text-align: center;
      display: inline-block;
    }

    .author-text {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
    }

    .category-text {
      background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(86, 171, 47, 0.3);
    }

    .subcategory-text {
      background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(116, 185, 255, 0.3);
    }

    .file-text {
      background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%);
      color: white;
      box-shadow: 0 2px 4px rgba(253, 203, 110, 0.3);
      font-size: 0.75rem;
      min-width: 2.5rem;
    }

    .hierarchy-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .hierarchy-header h3 {
      margin: 0;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .hierarchy-controls {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }

    /* 树形结构样式 */
    .tree-container {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .tree-node {
      margin-bottom: 0.5rem;
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateX(0);
      opacity: 1;
    }

    .tree-node:hover {
      background: rgba(102, 126, 234, 0.05);
      transform: translateX(2px);
    }

    .tree-node.deleting {
      opacity: 0.5;
      transform: translateX(-20px);
      pointer-events: none;
    }

    .tree-node.deleted {
      opacity: 0;
      transform: translateX(-40px) scale(0.9);
      max-height: 0;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    .node-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .node-header:hover {
      background: rgba(102, 126, 234, 0.1);
    }

    .node-icon {
      font-size: 1.25rem;
      min-width: 1.5rem;
      text-align: center;
    }

    .node-title {
      flex: 1;
      font-weight: 500;
      color: #333;
    }

    .node-stats {
      color: #6c757d;
      font-size: 0.875rem;
      background: rgba(108, 117, 125, 0.1);
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
    }

    .expand-icon {
      font-size: 0.875rem;
      color: #6c757d;
      transition: transform 0.3s ease;
      cursor: pointer;
    }

    .expand-icon.expanded {
      transform: rotate(90deg);
    }

    /* 权限徽章样式 */
    .permission-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .permission-public {
      background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
      color: white;
    }

    .permission-visitor {
      background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
      color: white;
    }

    .permission-friend {
      background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%);
      color: white;
    }

    .permission-custom {
      background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
      color: white;
    }

    .permission-private {
      background: linear-gradient(135deg, #ff7675 0%, #d63031 100%);
      color: white;
    }

    /* 层级缩进 */
    .tree-node.level-1 {
      margin-left: 1.5rem;
    }

    .tree-node.level-2 {
      margin-left: 3rem;
    }

    .tree-node.level-3 {
      margin-left: 4.5rem;
    }

    /* 加载和错误状态 */
    .loading-container {
      text-align: center;
      padding: 3rem;
      color: #6c757d;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem auto;
    }

    .error-container {
      text-align: center;
      padding: 3rem;
      color: #dc3545;
      background: #f8d7da;
      border-radius: 12px;
      border: 1px solid #f5c6cb;
    }

    .no-files-message {
      text-align: center;
      padding: 3rem;
      color: #6c757d;
      background: #f8f9fa;
      border-radius: 12px;
      border: 2px dashed #dee2e6;
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
      .hierarchy-container {
        padding: 1rem;
        border-radius: 12px;
      }

      .hierarchy-header {
        padding: 1rem;
        border-radius: 8px;
      }

      .hierarchy-controls {
        flex-direction: column;
      }

      .node-header {
        padding: 0.5rem;
        gap: 0.5rem;
      }

      .node-title {
        font-size: 0.875rem;
      }

      .tree-node.level-1 {
        margin-left: 1rem;
      }

      .tree-node.level-2 {
        margin-left: 2rem;
      }

      .tree-node.level-3 {
        margin-left: 3rem;
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  document.head.appendChild(style);
}

// 自动添加样式
addHierarchyManagerStyles();

// 创建全局实例
window.fileHierarchyManager = new FileHierarchyManager();

// 自动添加样式
window.fileHierarchyManager.addHierarchyStyles();
