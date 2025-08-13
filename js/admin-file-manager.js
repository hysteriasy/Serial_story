// 管理员文件管理器 - 专门用于 admin.html 页面的文件管理功能
class AdminFileManager {
  constructor() {
    this.currentFiles = [];
    this.filteredFiles = [];
    this.sortBy = 'uploadTime';
    this.sortOrder = 'desc';
    this.filterBy = 'all';
    this.searchQuery = '';
    this.currentPage = 1;
    this.itemsPerPage = 20;
    this.selectedFiles = new Set();
  }

  // 初始化文件管理器
  async initialize(containerId) {
    this.containerId = containerId;
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error('文件管理器容器未找到:', containerId);
      return;
    }

    // 创建文件管理界面
    container.innerHTML = this.createFileManagerHTML();
    
    // 绑定事件
    this.bindEvents();
    
    // 加载文件列表
    await this.loadFileList();
    
    console.log('✅ 管理员文件管理器初始化完成');
  }

  // 创建文件管理界面HTML
  createFileManagerHTML() {
    return `
      <div class="admin-file-manager">
        <!-- 工具栏 -->
        <div class="file-manager-toolbar">
          <div class="toolbar-left">
            <h4>📁 文件管理</h4>
            <span id="fileCount" class="file-count">加载中...</span>
          </div>
          <div class="toolbar-right">
            <button id="refreshFiles" class="btn btn-secondary btn-sm">
              🔄 刷新
            </button>
            <button id="batchActions" class="btn btn-info btn-sm" disabled>
              📋 批量操作
            </button>
          </div>
        </div>

        <!-- 搜索和过滤器 -->
        <div class="file-manager-filters">
          <div class="filter-row">
            <div class="search-box">
              <input type="text" id="fileSearch" placeholder="搜索文件名、作者..." class="form-control">
            </div>
            <div class="filter-controls">
              <select id="categoryFilter" class="form-control">
                <option value="all">所有分类</option>
                <option value="literature">文学作品</option>
                <option value="art">绘画作品</option>
                <option value="music">音乐作品</option>
                <option value="video">视频作品</option>
              </select>
              <select id="ownerFilter" class="form-control">
                <option value="all">所有用户</option>
              </select>
              <select id="permissionFilter" class="form-control">
                <option value="all">所有权限</option>
                <option value="public">公开</option>
                <option value="visitor">访客可见</option>
                <option value="friend">好友可见</option>
                <option value="custom">自定义</option>
              </select>
            </div>
          </div>
          <div class="sort-controls">
            <label>排序:</label>
            <select id="sortBy" class="form-control">
              <option value="uploadTime">上传时间</option>
              <option value="title">文件名</option>
              <option value="owner">作者</option>
              <option value="size">文件大小</option>
              <option value="category">分类</option>
            </select>
            <select id="sortOrder" class="form-control">
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>
        </div>

        <!-- 文件列表 -->
        <div class="file-list-container">
          <div class="file-list-header">
            <div class="header-checkbox">
              <input type="checkbox" id="selectAll">
            </div>
            <div class="header-name">文件名</div>
            <div class="header-owner">作者</div>
            <div class="header-category">分类</div>
            <div class="header-size">大小</div>
            <div class="header-permission">权限</div>
            <div class="header-time">上传时间</div>
            <div class="header-actions">操作</div>
          </div>
          <div id="fileListContent" class="file-list-content">
            <!-- 文件列表将在这里动态生成 -->
          </div>
        </div>

        <!-- 分页控件 -->
        <div class="file-pagination">
          <div class="pagination-info">
            <span id="paginationInfo">显示 0 - 0 / 0 个文件</span>
          </div>
          <div class="pagination-controls">
            <button id="prevPage" class="btn btn-sm btn-secondary" disabled>上一页</button>
            <span id="pageNumbers" class="page-numbers"></span>
            <button id="nextPage" class="btn btn-sm btn-secondary" disabled>下一页</button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div id="loadingIndicator" class="loading-indicator" style="display: none;">
          <div class="loading-spinner"></div>
          <span>加载文件列表中...</span>
        </div>
      </div>
    `;
  }

  // 绑定事件
  bindEvents() {
    // 刷新按钮
    document.getElementById('refreshFiles').addEventListener('click', () => {
      this.loadFileList();
    });

    // 搜索框
    document.getElementById('fileSearch').addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.applyFilters();
    });

    // 过滤器
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
      this.filterBy = e.target.value;
      this.applyFilters();
    });

    document.getElementById('ownerFilter').addEventListener('change', (e) => {
      this.ownerFilter = e.target.value;
      this.applyFilters();
    });

    document.getElementById('permissionFilter').addEventListener('change', (e) => {
      this.permissionFilter = e.target.value;
      this.applyFilters();
    });

    // 排序
    document.getElementById('sortBy').addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.applySorting();
    });

    document.getElementById('sortOrder').addEventListener('change', (e) => {
      this.sortOrder = e.target.value;
      this.applySorting();
    });

    // 全选
    document.getElementById('selectAll').addEventListener('change', (e) => {
      this.toggleSelectAll(e.target.checked);
    });

    // 分页
    document.getElementById('prevPage').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderFileList();
      }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
      const totalPages = Math.ceil(this.filteredFiles.length / this.itemsPerPage);
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderFileList();
      }
    });

    // 批量操作
    document.getElementById('batchActions').addEventListener('click', () => {
      this.showBatchActionsModal();
    });
  }

  // 加载文件列表
  async loadFileList() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const fileListContent = document.getElementById('fileListContent');

    try {
      loadingIndicator.style.display = 'flex';
      fileListContent.innerHTML = '';

      console.log('📁 开始加载文件列表...');

      // 获取所有文件
      this.currentFiles = await this.getAllFiles();

      // 调试信息
      console.log('🔍 文件列表详情:', {
        totalFiles: this.currentFiles.length,
        filesBySource: this.currentFiles.reduce((acc, file) => {
          acc[file.source] = (acc[file.source] || 0) + 1;
          return acc;
        }, {}),
        filesByOwner: this.currentFiles.reduce((acc, file) => {
          acc[file.owner] = (acc[file.owner] || 0) + 1;
          return acc;
        }, {}),
        sampleFiles: this.currentFiles.slice(0, 3).map(f => ({
          title: f.title,
          owner: f.owner,
          source: f.source,
          permissions: f.permissions?.level
        }))
      });

      // 更新用户过滤器选项
      this.updateOwnerFilter();

      // 应用过滤和排序
      this.applyFilters();

      console.log(`✅ 文件列表加载完成，共 ${this.currentFiles.length} 个文件`);

      // 如果没有文件，显示详细的调试信息
      if (this.currentFiles.length === 0) {
        this.showNoFilesDebugInfo();
      }

    } catch (error) {
      console.error('❌ 加载文件列表失败:', error);
      fileListContent.innerHTML = `
        <div class="error-message">
          <h4>❌ 加载失败</h4>
          <p>无法加载文件列表: ${error.message}</p>
          <details>
            <summary>错误详情</summary>
            <pre>${error.stack || error.toString()}</pre>
          </details>
          <button class="btn btn-primary" onclick="window.adminFileManager.loadFileList()">重试</button>
          <button class="btn btn-secondary" onclick="window.adminFileManager.debugFileRetrieval()">调试</button>
        </div>
      `;
    } finally {
      loadingIndicator.style.display = 'none';
    }
  }

  // 获取所有文件
  async getAllFiles() {
    const allFiles = [];
    
    try {
      // 1. 从 GitHub 获取文件（如果在网络环境）
      if (window.dataManager && window.dataManager.shouldUseGitHubStorage()) {
        console.log('🌐 从 GitHub 获取文件...');
        const githubFiles = await this.getGitHubFiles();
        allFiles.push(...githubFiles);
      }

      // 2. 从本地存储获取文件
      console.log('📱 从本地存储获取文件...');
      const localFiles = await this.getLocalFiles();
      
      // 去重合并
      const fileMap = new Map();

      // 先添加 GitHub 文件
      allFiles.forEach(file => {
        const key = `${file.owner}_${file.fileId || file.name}`;
        fileMap.set(key, { ...file, source: 'github' });
        console.log(`📁 添加 GitHub 文件: ${file.title || file.name} (${file.owner})`);
      });

      // 再添加本地文件（如果不存在）
      localFiles.forEach(file => {
        const key = `${file.owner}_${file.fileId}`;
        if (!fileMap.has(key)) {
          fileMap.set(key, { ...file, source: 'local' });
          console.log(`📱 添加本地文件: ${file.title} (${file.owner})`);
        } else {
          console.log(`🔄 跳过重复文件: ${file.title} (${file.owner}) - GitHub版本已存在`);
        }
      });

      const finalFiles = Array.from(fileMap.values());
      console.log(`📊 文件合并完成: 总共 ${finalFiles.length} 个文件`);

      // 打印文件详情用于调试
      finalFiles.forEach((file, index) => {
        console.log(`📄 文件 ${index + 1}: ${file.title} | 作者: ${file.owner} | 分类: ${file.mainCategory} | 来源: ${file.source}`);
      });

      return finalFiles;
      
    } catch (error) {
      console.error('获取文件列表失败:', error);
      throw error;
    }
  }

  // 从 GitHub 获取文件
  async getGitHubFiles() {
    try {
      // 检查GitHub存储是否可用
      if (!window.githubStorage) {
        console.log('⚠️ githubStorage未初始化，跳过GitHub文件获取');
        return [];
      }

      if (!window.githubStorage.token) {
        console.log('⚠️ GitHub Token未配置，跳过GitHub文件获取');
        console.log('💡 提示：在系统设置中配置GitHub Token以访问GitHub存储的文件');
        return [];
      }

      console.log('🌐 开始从 GitHub 获取文件...');
      console.log(`🔑 使用Token: ${window.githubStorage.token.substring(0, 8)}...`);
      console.log(`📂 目标仓库: ${window.githubStorage.owner}/${window.githubStorage.repo}`);

      // 先验证token有效性
      try {
        console.log('🔍 验证GitHub Token...');
        await window.githubStorage.validateToken();
        console.log('✅ GitHub Token验证成功');
      } catch (tokenError) {
        console.error('❌ GitHub Token验证失败:', tokenError);
        throw new Error(`GitHub Token验证失败: ${tokenError.message}`);
      }

      // 先测试GitHub连接
      try {
        const isConnected = await window.githubStorage.checkConnection();
        if (!isConnected) {
          console.log('❌ GitHub连接测试失败，跳过GitHub文件获取');
          return [];
        }
        console.log('✅ GitHub连接测试成功');
      } catch (connectionError) {
        console.log('❌ GitHub连接测试失败:', connectionError.message);
        return [];
      }

      // 直接从GitHub API获取文件，而不依赖fileHierarchyManager
      const githubFiles = await this.fetchGitHubFilesDirectly();
      console.log(`🌐 GitHub 返回 ${githubFiles.length} 个文件`);

      const processedFiles = [];

      for (const file of githubFiles) {
        try {
          let fileData = null;

          if (file.type === 'work') {
            // 处理 data/works 目录的文件
            try {
              const workData = await window.githubStorage.getFile(file.path);
              if (workData && workData.content) {
                const rawData = JSON.parse(atob(workData.content));

                // data/works 文件可能只包含权限信息，需要补充基本信息
                fileData = {
                  title: rawData.title || file.name.replace('.json', ''),
                  originalName: rawData.originalName || file.name,
                  mainCategory: rawData.mainCategory || 'literature',
                  subCategory: rawData.subCategory || rawData.subcategory || 'essay',
                  uploadedBy: rawData.uploadedBy || rawData.owner || file.owner,
                  uploadTime: rawData.uploadTime || rawData.createdAt || new Date().toISOString(),
                  content: rawData.content || '内容已迁移',
                  permissions: rawData.permissions || {},
                  id: rawData.id,
                  // 保留原始数据
                  ...rawData
                };
              }
            } catch (error) {
              console.warn(`加载work文件失败: ${file.path}`, error);
            }

            // 如果没有获取到数据，创建基本信息
            if (!fileData) {
              fileData = {
                title: file.name.replace('.json', ''),
                originalName: file.name,
                mainCategory: 'literature',
                subCategory: 'essay',
                uploadedBy: file.owner,
                uploadTime: new Date().toISOString(),
                content: '内容未找到'
              };
            }
          } else {
            // 处理 user-uploads 目录的文件
            try {
              const uploadData = await window.githubStorage.getFile(file.path);
              if (uploadData && uploadData.content) {
                fileData = JSON.parse(atob(uploadData.content));
                console.log(`📄 成功解析文件: ${file.path}`, {
                  title: fileData.title,
                  uploadedBy: fileData.uploadedBy,
                  subcategory: fileData.subcategory
                });
              }
            } catch (error) {
              console.warn(`加载upload文件失败: ${file.path}`, error);
            }

            // 如果没有获取到数据，创建基本信息
            if (!fileData) {
              fileData = {
                title: file.name.replace('.json', ''),
                originalName: file.name,
                mainCategory: file.category || 'literature',
                subCategory: file.subcategory || 'essay',
                uploadedBy: file.owner,
                uploadTime: new Date().toISOString()
              };
              console.log(`⚠️ 使用回退数据: ${file.path}`, fileData);
            }
          }

          if (fileData) {
            // 生成文件ID
            const fileId = fileData.id ||
                          file.name.replace('.json', '') ||
                          `${file.owner}_${Date.now()}`;

            // 确保权限设置存在并标准化
            if (!fileData.permissions) {
              fileData.permissions = {
                level: fileData.visibility || 'friend',
                isPublic: fileData.isPublic || false,
                visibility: fileData.visibility || 'friend'
              };
            } else {
              // 标准化权限级别
              if (!fileData.permissions.level) {
                fileData.permissions.level = fileData.permissions.visibility ||
                                           fileData.permissions.requiredRole ||
                                           'friend';
              }

              // 确保isPublic字段存在
              if (fileData.permissions.isPublic === undefined) {
                fileData.permissions.isPublic = fileData.permissions.level === 'public' ||
                                               fileData.permissions.visibility === 'public';
              }
            }

            processedFiles.push({
              ...fileData,
              fileId: fileId,
              owner: file.owner || fileData.uploadedBy || fileData.author || 'unknown',
              githubPath: file.path,
              githubSha: file.sha,
              fileSize: file.size,
              downloadUrl: file.downloadUrl,
              htmlUrl: file.htmlUrl,
              source: 'github',
              mainCategory: fileData.mainCategory || file.category || 'literature',
              subCategory: fileData.subCategory || fileData.subcategory || file.subcategory || 'essay'
            });

            console.log(`✅ 处理GitHub文件: ${fileData.title} (${file.owner})`);
          }
        } catch (error) {
          console.warn(`处理 GitHub 文件失败: ${file.path}`, error);

          // 创建基本的回退条目
          try {
            const fallbackId = file.name?.replace(/\.[^.]+$/, '') || `fallback_${Date.now()}`;
            processedFiles.push({
              title: file.name || 'Unknown File',
              fileId: fallbackId,
              owner: file.owner || 'unknown',
              githubPath: file.path,
              githubSha: file.sha,
              fileSize: file.size,
              source: 'github',
              mainCategory: file.category || 'literature',
              subCategory: file.subcategory || 'essay',
              uploadTime: new Date().toISOString(),
              permissions: {
                level: 'friend',
                isPublic: false
              },
              error: error.message
            });
          } catch (fallbackError) {
            console.error('创建回退文件条目失败:', fallbackError);
          }
        }
      }

      console.log(`✅ 从 GitHub 获取到 ${processedFiles.length} 个文件`);
      return processedFiles;
    } catch (error) {
      console.error('从 GitHub 获取文件失败:', error);

      // 提供用户友好的错误信息
      if (error.message.includes('tracking prevention') || error.message.includes('storage access')) {
        console.warn('🛡️ 由于浏览器隐私保护，GitHub 文件获取受限');
      } else if (error.message.includes('404')) {
        console.info('ℹ️ GitHub 仓库中暂无文件');
      } else if (error.message.includes('403')) {
        console.warn('⚠️ GitHub API 访问受限，请检查令牌权限');
      }

      return [];
    }
  }

  // 直接从GitHub API获取文件
  async fetchGitHubFilesDirectly() {
    const allFiles = [];

    try {
      // 1. 获取 data/works 目录下的文件
      console.log('📁 获取 data/works 目录...');
      const worksFiles = await this.getGitHubWorksFiles();
      allFiles.push(...worksFiles);

      // 2. 获取 user-uploads 目录下的文件
      console.log('📁 获取 user-uploads 目录...');
      const uploadFiles = await this.getGitHubUserUploadsFiles();
      allFiles.push(...uploadFiles);

      console.log(`✅ 从GitHub获取到 ${allFiles.length} 个文件`);
      return allFiles;
    } catch (error) {
      console.error('直接获取GitHub文件失败:', error);
      return [];
    }
  }

  // 获取GitHub works文件
  async getGitHubWorksFiles() {
    try {
      const files = await window.githubStorage.listFiles('data/works');
      return files.map(file => ({
        ...file,
        type: 'work',
        category: 'works',
        owner: this.extractOwnerFromWorkFile(file.name),
        source: 'github'
      }));
    } catch (error) {
      if (error.status !== 404) {
        console.warn('获取GitHub works文件失败:', error);
      }
      return [];
    }
  }

  // 获取GitHub用户上传文件
  async getGitHubUserUploadsFiles() {
    const allFiles = [];
    const categories = ['literature', 'art', 'music', 'video'];

    for (const category of categories) {
      try {
        const categoryPath = `user-uploads/${category}`;
        const categoryFiles = await this.getGitHubCategoryFiles(categoryPath, category);
        allFiles.push(...categoryFiles);
      } catch (error) {
        if (error.status !== 404) {
          console.warn(`获取${category}分类文件失败:`, error);
        }
      }
    }

    return allFiles;
  }

  // 获取特定分类的GitHub文件（递归获取所有嵌套文件）
  async getGitHubCategoryFiles(categoryPath, category) {
    try {
      console.log(`🔍 开始递归获取 ${categoryPath} 目录下的文件...`);
      const allFiles = await this.recursivelyGetGitHubFiles(categoryPath);
      const processedFiles = [];

      for (const file of allFiles) {
        if (file.type === 'file' && file.name.endsWith('.json')) {
          // 从文件路径提取用户名和子分类
          // 路径格式: user-uploads/literature/essay/hysteria/2025-08-13_essay_1755045468642.json
          const pathParts = file.path.split('/');

          let subcategory = 'default';
          let owner = 'unknown';

          if (pathParts.length >= 4) {
            subcategory = pathParts[2]; // essay, poetry, novel等
            owner = pathParts[3]; // 用户名
          } else if (pathParts.length === 3) {
            // 如果路径较短，尝试从文件名提取信息
            owner = pathParts[2];
          }

          // 如果owner仍然是文件名，尝试从文件名中提取
          if (owner.endsWith('.json')) {
            // 尝试从文件名中提取用户信息
            const nameMatch = file.name.match(/(\w+)_\d+\.json$/);
            if (nameMatch) {
              owner = nameMatch[1];
            } else {
              owner = 'unknown';
            }
          }

          processedFiles.push({
            ...file,
            type: 'upload',
            category: category,
            subcategory: subcategory,
            owner: owner,
            source: 'github'
          });

          console.log(`📁 发现文件: ${file.path} -> 用户: ${owner}, 子分类: ${subcategory}`);
        }
      }

      console.log(`✅ ${categoryPath} 目录共找到 ${processedFiles.length} 个JSON文件`);
      return processedFiles;
    } catch (error) {
      console.warn(`获取分类文件失败 ${categoryPath}:`, error);
      return [];
    }
  }

  // 递归获取GitHub目录下的所有文件
  async recursivelyGetGitHubFiles(directoryPath, allFiles = []) {
    try {
      console.log(`🔍 正在扫描目录: ${directoryPath}`);
      const items = await window.githubStorage.listFiles(directoryPath);
      console.log(`📁 目录 ${directoryPath} 包含 ${items.length} 个项目`);

      for (const item of items) {
        if (item.type === 'file') {
          console.log(`📄 发现文件: ${item.path}`);
          allFiles.push(item);
        } else if (item.type === 'dir') {
          console.log(`📂 发现子目录: ${item.path}，开始递归扫描`);
          // 递归获取子目录中的文件
          await this.recursivelyGetGitHubFiles(item.path, allFiles);
        }
      }

      console.log(`✅ 目录 ${directoryPath} 扫描完成，累计文件数: ${allFiles.length}`);
      return allFiles;
    } catch (error) {
      if (error.message.includes('404') || error.message.includes('列出文件失败: 404')) {
        console.log(`📂 目录 ${directoryPath} 不存在，跳过`);
        return allFiles;
      }
      console.warn(`❌ 递归获取文件失败 ${directoryPath}:`, error);
      return allFiles;
    }
  }

  // 从work文件名提取所有者
  extractOwnerFromWorkFile(filename) {
    // work文件名格式: 2025-08-12_work_essay_legacy______1754921280127.json
    // 或者其他格式，尝试多种模式

    // 模式1: 包含用户名的格式
    let match = filename.match(/work_.*?_([^_]+)_/);
    if (match && match[1] !== 'legacy' && match[1] !== 'essay' && match[1] !== 'poetry' && match[1] !== 'novel') {
      return match[1];
    }

    // 模式2: legacy格式，尝试从时间戳推断
    match = filename.match(/legacy.*?(\d{13})/);
    if (match) {
      // 对于legacy文件，可能需要从文件内容中获取用户信息
      return 'legacy_user';
    }

    // 模式3: 简单的work_用户名格式
    match = filename.match(/work_([^_]+)/);
    if (match && match[1] !== 'essay' && match[1] !== 'poetry' && match[1] !== 'novel') {
      return match[1];
    }

    // 默认返回unknown
    return 'unknown';
  }

  // 从本地存储获取文件
  async getLocalFiles() {
    const files = [];

    try {
      // 遍历 localStorage 查找 work_ 开头的文件
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('work_')) {
          try {
            const workData = JSON.parse(localStorage.getItem(key));

            // 确保文件有必要的字段
            const processedFile = {
              ...workData,
              fileId: key.replace('work_', ''),
              owner: workData.uploadedBy || workData.author || workData.owner || 'unknown',
              title: workData.title || workData.originalName || '未命名文件',
              originalName: workData.originalName || workData.title || '未命名文件',
              mainCategory: workData.mainCategory || workData.category || 'literature',
              subCategory: workData.subCategory || workData.subcategory || 'essay',
              uploadTime: workData.uploadTime || workData.createdAt || new Date().toISOString(),
              source: 'local'
            };

            // 确保权限设置存在
            if (!processedFile.permissions) {
              processedFile.permissions = {
                level: 'friend',
                isPublic: false,
                requiredRole: 'friend',
                minRoleLevel: 3
              };
            }

            files.push(processedFile);
            console.log(`📱 找到本地文件: ${processedFile.title} (${processedFile.owner})`);
          } catch (error) {
            console.warn(`解析本地文件失败: ${key}`, error);
          }
        }
      }

      console.log(`📱 从本地存储获取到 ${files.length} 个文件`);
      return files;
    } catch (error) {
      console.error('从本地存储获取文件失败:', error);
      return [];
    }
  }

  // 更新用户过滤器选项
  updateOwnerFilter() {
    const ownerFilter = document.getElementById('ownerFilter');
    const owners = new Set();

    this.currentFiles.forEach(file => {
      if (file.owner) {
        owners.add(file.owner);
      }
    });

    // 保存当前选择
    const currentValue = ownerFilter.value;

    // 清空并重新填充选项
    ownerFilter.innerHTML = '<option value="all">所有用户</option>';

    Array.from(owners).sort().forEach(owner => {
      const option = document.createElement('option');
      option.value = owner;
      option.textContent = owner;
      ownerFilter.appendChild(option);
    });

    // 恢复选择
    if (currentValue && Array.from(owners).includes(currentValue)) {
      ownerFilter.value = currentValue;
    }
  }

  // 应用过滤器
  applyFilters() {
    console.log(`🔍 开始过滤 ${this.currentFiles.length} 个文件...`);

    this.filteredFiles = this.currentFiles.filter(file => {
      // 基本字段检查
      if (!file || !file.fileId) {
        console.warn('跳过无效文件:', file);
        return false;
      }

      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const searchText = `${file.title || ''} ${file.originalName || ''} ${file.owner || ''}`.toLowerCase();
        if (!searchText.includes(query)) {
          return false;
        }
      }

      // 分类过滤
      if (this.filterBy !== 'all' && file.mainCategory !== this.filterBy) {
        return false;
      }

      // 用户过滤
      if (this.ownerFilter && this.ownerFilter !== 'all' && file.owner !== this.ownerFilter) {
        return false;
      }

      // 权限过滤
      if (this.permissionFilter && this.permissionFilter !== 'all') {
        const permissionLevel = file.permissions?.level || 'friend'; // 默认为friend级别
        if (permissionLevel !== this.permissionFilter) {
          return false;
        }
      }

      return true;
    });

    console.log(`✅ 过滤完成，显示 ${this.filteredFiles.length} 个文件`);

    // 应用排序
    this.applySorting();
  }

  // 应用排序
  applySorting() {
    this.filteredFiles.sort((a, b) => {
      let aValue, bValue;

      switch (this.sortBy) {
        case 'title':
          aValue = (a.title || a.originalName || '').toLowerCase();
          bValue = (b.title || b.originalName || '').toLowerCase();
          break;
        case 'owner':
          aValue = (a.owner || '').toLowerCase();
          bValue = (b.owner || '').toLowerCase();
          break;
        case 'size':
          aValue = a.fileSize || 0;
          bValue = b.fileSize || 0;
          break;
        case 'category':
          aValue = (a.mainCategory || '').toLowerCase();
          bValue = (b.mainCategory || '').toLowerCase();
          break;
        case 'uploadTime':
        default:
          aValue = new Date(a.uploadTime || 0);
          bValue = new Date(b.uploadTime || 0);
          break;
      }

      let result = 0;
      if (aValue < bValue) result = -1;
      else if (aValue > bValue) result = 1;

      return this.sortOrder === 'desc' ? -result : result;
    });

    // 重置到第一页
    this.currentPage = 1;

    // 渲染文件列表
    this.renderFileList();
  }

  // 渲染文件列表
  renderFileList() {
    const fileListContent = document.getElementById('fileListContent');
    const fileCount = document.getElementById('fileCount');
    const paginationInfo = document.getElementById('paginationInfo');

    // 更新文件计数
    fileCount.textContent = `共 ${this.filteredFiles.length} 个文件`;

    // 计算分页
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredFiles.length);
    const currentPageFiles = this.filteredFiles.slice(startIndex, endIndex);

    // 更新分页信息
    paginationInfo.textContent = `显示 ${startIndex + 1} - ${endIndex} / ${this.filteredFiles.length} 个文件`;

    // 渲染文件行
    if (currentPageFiles.length === 0) {
      fileListContent.innerHTML = `
        <div class="no-files-message">
          <h4>📂 没有找到文件</h4>
          <p>当前过滤条件下没有文件，请尝试调整搜索条件。</p>
        </div>
      `;
    } else {
      fileListContent.innerHTML = currentPageFiles.map(file => this.createFileRow(file)).join('');

      // 绑定文件选择事件
      this.bindFileSelectionEvents();
    }

    // 更新分页控件
    this.updatePaginationControls();

    // 更新选择状态
    this.updateSelectionState();
  }

  // 创建文件行
  createFileRow(file) {
    const fileId = file.fileId || 'unknown';
    const owner = file.owner || 'unknown';
    const title = file.title || file.originalName || '未命名文件';
    const category = this.getCategoryText(file.mainCategory);
    const subcategory = this.getSubcategoryText(file.subCategory || file.subcategory);
    const size = this.formatFileSize(file.fileSize);
    const uploadTime = this.formatDate(file.uploadTime);
    const permission = this.getPermissionText(file.permissions?.level || file.permissions?.visibility);
    const source = file.source || 'unknown';

    // 创建显示格式："分类-标题-作者"
    const displayTitle = `${subcategory}-${title}-${owner}`;

    // 安全地转义参数，防止JavaScript注入
    const safeFileId = this.escapeForJs(fileId);
    const safeOwner = this.escapeForJs(owner);

    return `
      <div class="file-row" data-file-id="${this.escapeHtml(fileId)}" data-owner="${this.escapeHtml(owner)}">
        <div class="file-checkbox">
          <input type="checkbox" class="file-select" value="${this.escapeHtml(owner)}/${this.escapeHtml(fileId)}">
        </div>
        <div class="file-name">
          <div class="file-title">${this.escapeHtml(displayTitle)}</div>
          <div class="file-meta">
            <span class="file-id">ID: ${this.escapeHtml(fileId)}</span>
            <span class="file-source source-${source}">${source === 'github' ? 'GitHub' : '本地'}</span>
            <span class="file-original-title">原标题: ${this.escapeHtml(title)}</span>
          </div>
        </div>
        <div class="file-owner">${this.escapeHtml(owner)}</div>
        <div class="file-category">
          <div class="category-main">${category}</div>
          <div class="category-sub">${subcategory}</div>
        </div>
        <div class="file-size">${size}</div>
        <div class="file-permission">
          <span class="permission-badge permission-${file.permissions?.level || file.permissions?.visibility || 'unknown'}">
            ${permission}
          </span>
        </div>
        <div class="file-time">${uploadTime}</div>
        <div class="file-actions">
          <button class="btn btn-sm btn-info" onclick="window.adminFileManager.viewFile('${safeFileId}', '${safeOwner}')" title="查看文件详情">
            👁️ 查看
          </button>
          <button class="btn btn-sm btn-secondary" onclick="window.adminFileManager.editPermissions('${safeFileId}', '${safeOwner}')" title="编辑文件权限">
            🔐 权限
          </button>
          <button class="btn btn-sm btn-warning" onclick="window.adminFileManager.editFile('${safeFileId}', '${safeOwner}')" title="编辑文件内容">
            ✏️ 编辑
          </button>
          <button class="btn btn-sm btn-danger" onclick="window.adminFileManager.deleteFile('${safeFileId}', '${safeOwner}')" title="删除文件">
            🗑️ 删除
          </button>
        </div>
      </div>
    `;
  }

  // 更新分页控件
  updatePaginationControls() {
    const totalPages = Math.ceil(this.filteredFiles.length / this.itemsPerPage);
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');

    // 更新按钮状态
    prevButton.disabled = this.currentPage <= 1;
    nextButton.disabled = this.currentPage >= totalPages;

    // 生成页码
    let pageNumbersHTML = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === this.currentPage;
      pageNumbersHTML += `
        <button class="page-number ${isActive ? 'active' : ''}"
                onclick="adminFileManager.goToPage(${i})">${i}</button>
      `;
    }

    pageNumbers.innerHTML = pageNumbersHTML;
  }

  // 跳转到指定页面
  goToPage(page) {
    const totalPages = Math.ceil(this.filteredFiles.length / this.itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.renderFileList();
    }
  }

  // 更新选择状态
  updateSelectionState() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const fileCheckboxes = document.querySelectorAll('.file-select');
    const batchActionsButton = document.getElementById('batchActions');

    // 更新全选状态
    const checkedCount = Array.from(fileCheckboxes).filter(cb => cb.checked).length;
    selectAllCheckbox.checked = checkedCount > 0 && checkedCount === fileCheckboxes.length;
    selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < fileCheckboxes.length;

    // 更新批量操作按钮
    batchActionsButton.disabled = checkedCount === 0;
    batchActionsButton.textContent = checkedCount > 0 ? `📋 批量操作 (${checkedCount})` : '📋 批量操作';

    // 更新选中文件集合
    this.selectedFiles.clear();
    fileCheckboxes.forEach(cb => {
      if (cb.checked) {
        this.selectedFiles.add(cb.value);
      }
    });
  }

  // 切换全选
  toggleSelectAll(checked) {
    const fileCheckboxes = document.querySelectorAll('.file-select');
    fileCheckboxes.forEach(cb => {
      cb.checked = checked;
    });
    this.updateSelectionState();
  }

  // 绑定文件选择事件
  bindFileSelectionEvents() {
    const fileCheckboxes = document.querySelectorAll('.file-select');
    fileCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateSelectionState();
      });
    });
  }

  // 工具函数
  getCategoryText(category) {
    const categoryTexts = {
      literature: '文学',
      art: '绘画',
      music: '音乐',
      video: '影像'
    };
    return categoryTexts[category] || category || '其他';
  }

  getSubcategoryText(subcategory) {
    const subcategoryTexts = {
      essay: '随笔',
      poetry: '诗歌',
      novel: '小说',
      painting: '绘画',
      sketch: '素描',
      digital: '数艺',
      original: '原创',
      cover: '翻唱',
      instrumental: '器乐',
      short: '短片',
      documentary: '纪录',
      travel: '旅拍'
    };
    return subcategoryTexts[subcategory] || subcategory || '默认';
  }

  getPermissionText(level) {
    const permissionTexts = {
      public: '公开',
      visitor: '访客',
      friend: '好友',
      custom: '自定义',
      private: '私有'
    };
    return permissionTexts[level] || '未知';
  }

  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '未知';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  formatDate(dateString) {
    if (!dateString) return '未知';

    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '无效日期';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 转义JavaScript字符串，防止注入攻击
  escapeForJs(text) {
    if (!text) return '';
    return text.toString()
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  // 显示通知消息
  showNotification(message, type = 'info') {
    // 如果页面有全局的showNotification函数，使用它
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }

    // 否则创建简单的通知
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
    `;

    // 根据类型设置背景色
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;

    document.body.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // 文件操作方法

  // 查看文件
  async viewFile(fileId, owner) {
    try {
      if (window.fileDetailsViewer) {
        await window.fileDetailsViewer.showFileDetails(fileId, owner);
      } else {
        this.showNotification('文件详情查看器未初始化', 'error');
      }
    } catch (error) {
      console.error('查看文件失败:', error);
      this.showNotification('查看文件失败: ' + error.message, 'error');
    }
  }

  // 编辑文件权限
  async editPermissions(fileId, owner) {
    try {
      // 检查权限
      if (!this.canEditFile(owner)) {
        this.showNotification('您没有权限修改此文件的权限', 'error');
        return;
      }

      // 使用增强权限管理器
      if (window.enhancedPermissionsManager) {
        await window.enhancedPermissionsManager.showEnhancedPermissionsModal(fileId, owner);
      } else {
        this.showNotification('权限管理器未初始化', 'error');
      }

    } catch (error) {
      console.error('编辑文件权限失败:', error);
      this.showNotification('编辑文件权限失败: ' + error.message, 'error');
    }
  }

  // 编辑文件
  async editFile(fileId, owner) {
    try {
      // 检查权限
      if (!this.canEditFile(owner)) {
        this.showNotification('您没有权限编辑此文件', 'error');
        return;
      }

      // 获取文件信息
      const file = this.currentFiles.find(f => f.fileId === fileId && f.owner === owner);
      if (!file) {
        this.showNotification('文件不存在', 'error');
        return;
      }

      // 显示编辑模态框
      this.showEditFileModal(file);

    } catch (error) {
      console.error('编辑文件失败:', error);
      this.showNotification('编辑文件失败: ' + error.message, 'error');
    }
  }

  // 删除文件
  async deleteFile(fileId, owner) {
    try {
      // 检查权限
      if (!this.canDeleteFile(owner)) {
        this.showNotification('您没有权限删除此文件', 'error');
        return;
      }

      // 获取文件信息
      const file = this.currentFiles.find(f => f.fileId === fileId && f.owner === owner);
      if (!file) {
        this.showNotification('文件不存在', 'error');
        return;
      }

      // 显示确认对话框
      const confirmed = await this.showDeleteConfirmation(file);
      if (!confirmed) {
        return;
      }

      // 执行删除
      await this.performFileDelete(file);

      // 刷新列表
      await this.loadFileList();

      this.showNotification('文件删除成功', 'success');

    } catch (error) {
      console.error('删除文件失败:', error);
      this.showNotification('删除文件失败: ' + error.message, 'error');
    }
  }

  // 检查是否可以编辑文件
  canEditFile(owner) {
    if (!auth.currentUser) return false;

    // 管理员可以编辑所有文件
    if (auth.isAdmin && auth.isAdmin()) return true;

    // 用户只能编辑自己的文件
    return auth.currentUser.username === owner;
  }

  // 检查是否可以删除文件
  canDeleteFile(owner) {
    if (!auth.currentUser) return false;

    // 管理员可以删除所有文件
    if (auth.isAdmin && auth.isAdmin()) return true;

    // 用户只能删除自己的文件
    return auth.currentUser.username === owner;
  }

  // 显示编辑文件模态框
  showEditFileModal(file) {
    // 移除现有模态框
    const existingModal = document.getElementById('editFileModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'editFileModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>✏️ 编辑文件</h3>
          <span class="close-btn" onclick="document.getElementById('editFileModal').remove()">&times;</span>
        </div>
        <div class="modal-body">
          <form id="editFileForm">
            <div class="form-group">
              <label for="editFileTitle">文件标题:</label>
              <input type="text" id="editFileTitle" class="form-control"
                     value="${this.escapeHtml(file.title || file.originalName || '')}" required>
            </div>
            <div class="form-group">
              <label for="editFileDescription">文件描述:</label>
              <textarea id="editFileDescription" class="form-control" rows="3">${this.escapeHtml(file.description || '')}</textarea>
            </div>
            <div class="form-group">
              <label for="editFileCategory">主分类:</label>
              <select id="editFileCategory" class="form-control">
                <option value="literature" ${file.mainCategory === 'literature' ? 'selected' : ''}>文学作品</option>
                <option value="art" ${file.mainCategory === 'art' ? 'selected' : ''}>绘画作品</option>
                <option value="music" ${file.mainCategory === 'music' ? 'selected' : ''}>音乐作品</option>
                <option value="video" ${file.mainCategory === 'video' ? 'selected' : ''}>视频作品</option>
              </select>
            </div>
            <div class="form-group">
              <label for="editFileSubcategory">子分类:</label>
              <select id="editFileSubcategory" class="form-control">
                <!-- 子分类选项将根据主分类动态更新 -->
              </select>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="editFileIsPublic" ${file.permissions?.isPublic ? 'checked' : ''}>
                设为公开文件
              </label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('editFileModal').remove()">取消</button>
          <button type="button" class="btn btn-primary" onclick="adminFileManager.saveFileEdit('${file.fileId}', '${file.owner}')">保存</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 初始化子分类选项
    this.updateSubcategoryOptions(file.mainCategory, file.subCategory || file.subcategory);

    // 绑定分类变更事件
    document.getElementById('editFileCategory').addEventListener('change', (e) => {
      this.updateSubcategoryOptions(e.target.value);
    });
  }

  // 更新子分类选项
  updateSubcategoryOptions(category, selectedSubcategory = '') {
    const subcategorySelect = document.getElementById('editFileSubcategory');
    if (!subcategorySelect) return;

    const subcategoryOptions = {
      literature: [
        { value: 'essay', text: '随笔' },
        { value: 'poetry', text: '诗歌' },
        { value: 'novel', text: '小说' }
      ],
      art: [
        { value: 'painting', text: '绘画' },
        { value: 'sketch', text: '素描' },
        { value: 'digital', text: '数艺' }
      ],
      music: [
        { value: 'original', text: '原创' },
        { value: 'cover', text: '翻唱' },
        { value: 'instrumental', text: '器乐' }
      ],
      video: [
        { value: 'short', text: '短片' },
        { value: 'documentary', text: '纪录' },
        { value: 'travel', text: '旅拍' }
      ]
    };

    const options = subcategoryOptions[category] || [];
    subcategorySelect.innerHTML = options.map(option =>
      `<option value="${option.value}" ${option.value === selectedSubcategory ? 'selected' : ''}>${option.text}</option>`
    ).join('');
  }

  // 保存文件编辑
  async saveFileEdit(fileId, owner) {
    try {
      const title = document.getElementById('editFileTitle').value.trim();
      const description = document.getElementById('editFileDescription').value.trim();
      const category = document.getElementById('editFileCategory').value;
      const subcategory = document.getElementById('editFileSubcategory').value;
      const isPublic = document.getElementById('editFileIsPublic').checked;

      if (!title) {
        this.showNotification('请输入文件标题', 'error');
        return;
      }

      // 获取原文件信息
      const originalFile = this.currentFiles.find(f => f.fileId === fileId && f.owner === owner);
      if (!originalFile) {
        this.showNotification('原文件不存在', 'error');
        return;
      }

      // 更新文件信息
      const updatedFile = {
        ...originalFile,
        title: title,
        description: description,
        mainCategory: category,
        subCategory: subcategory,
        subcategory: subcategory, // 兼容性
        lastModified: new Date().toISOString()
      };

      // 更新权限设置
      if (updatedFile.permissions) {
        updatedFile.permissions.isPublic = isPublic;
        updatedFile.permissions.level = isPublic ? 'public' : updatedFile.permissions.level;
      }

      // 保存到存储
      await this.saveFileToStorage(updatedFile);

      // 关闭模态框
      document.getElementById('editFileModal').remove();

      // 刷新列表
      await this.loadFileList();

      this.showNotification('文件更新成功', 'success');

    } catch (error) {
      console.error('保存文件编辑失败:', error);
      this.showNotification('保存失败: ' + error.message, 'error');
    }
  }

  // 保存文件到存储
  async saveFileToStorage(file) {
    const fileKey = `work_${file.fileId}`;

    try {
      // 使用跟踪保护处理器的安全操作包装器
      const saveOperation = async () => {
        if (window.dataManager) {
          return await window.dataManager.saveData(fileKey, file, {
            category: 'works',
            commitMessage: `更新文件: ${file.title}`
          });
        } else {
          localStorage.setItem(fileKey, JSON.stringify(file));
          return true;
        }
      };

      const fallbackOperation = async () => {
        console.log('🔄 主要存储失败，尝试本地存储回退...');
        try {
          localStorage.setItem(fileKey, JSON.stringify(file));
          return true;
        } catch (localError) {
          console.error('本地存储回退也失败:', localError);
          throw localError;
        }
      };

      if (window.trackingProtectionHandler) {
        await window.trackingProtectionHandler.safeStorageOperation(
          saveOperation,
          fallbackOperation,
          3 // 重试3次
        );
      } else {
        await saveOperation();
      }

    } catch (error) {
      console.error('保存文件到存储失败:', error);

      // 提供更用户友好的错误信息
      if (error.message.includes('tracking prevention') || error.message.includes('storage access')) {
        throw new Error('由于浏览器隐私保护设置，文件保存失败。请尝试在浏览器设置中允许此网站的存储访问。');
      } else if (error.message.includes('QuotaExceededError')) {
        throw new Error('存储空间不足，请清理一些文件后重试。');
      } else {
        throw new Error(`文件保存失败: ${error.message}`);
      }
    }
  }

  // 显示删除确认对话框
  showDeleteConfirmation(file) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>⚠️ 确认删除</h3>
          </div>
          <div class="modal-body">
            <p>您确定要删除以下文件吗？</p>
            <div class="delete-file-info">
              <strong>文件名:</strong> ${this.escapeHtml(file.title || file.originalName || '未命名')}<br>
              <strong>作者:</strong> ${this.escapeHtml(file.owner)}<br>
              <strong>分类:</strong> ${this.getCategoryText(file.mainCategory)} - ${this.getSubcategoryText(file.subCategory || file.subcategory)}<br>
              <strong>上传时间:</strong> ${this.formatDate(file.uploadTime)}
            </div>
            <div class="warning-message">
              <strong>⚠️ 警告:</strong> 此操作不可撤销！文件将从所有存储位置永久删除。
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove(); window.deleteConfirmResolve(false)">取消</button>
            <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove(); window.deleteConfirmResolve(true)">确认删除</button>
          </div>
        </div>
      `;

      // 设置全局回调
      window.deleteConfirmResolve = resolve;

      document.body.appendChild(modal);
    });
  }

  // 执行文件删除
  async performFileDelete(file) {
    const fileKey = `work_${file.fileId}`;
    let deleteResults = {
      github: { success: false, error: null },
      local: { success: false, error: null },
      permissions: { success: false, error: null }
    };

    try {
      // 1. 从 GitHub 删除（如果存在）
      if (file.source === 'github' && file.githubPath && window.githubStorage && window.githubStorage.token) {
        try {
          // 使用跟踪保护处理器的安全操作包装器
          const githubDeleteOperation = async () => {
            return await window.githubStorage.deleteFile(file.githubPath, `删除文件: ${file.title}`);
          };

          const githubFallback = async () => {
            console.log('🔄 GitHub 删除失败，标记为已删除');
            return { success: true, fallback: true };
          };

          if (window.trackingProtectionHandler) {
            await window.trackingProtectionHandler.safeStorageOperation(
              githubDeleteOperation,
              githubFallback,
              2 // 只重试2次
            );
          } else {
            await githubDeleteOperation();
          }

          deleteResults.github.success = true;
          console.log('✅ 文件已从 GitHub 删除');
        } catch (githubError) {
          deleteResults.github.error = githubError.message;

          // 特殊处理404错误（文件不存在）
          if (githubError.status === 404 || githubError.message.includes('404')) {
            console.log('ℹ️ GitHub 文件不存在，可能已被删除');
            deleteResults.github.success = true; // 视为成功
          } else {
            console.warn('从 GitHub 删除文件失败:', githubError);
          }
        }
      } else {
        deleteResults.github.success = true; // 不需要从 GitHub 删除
      }

      // 2. 从本地存储删除
      try {
        const localDeleteOperation = () => {
          localStorage.removeItem(fileKey);
          return true;
        };

        const localFallback = () => {
          console.log('🔄 本地存储删除失败，尝试清理相关数据');
          // 尝试清理相关的缓存数据
          try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
              if (key.includes(file.fileId) || key.includes(file.owner)) {
                try {
                  localStorage.removeItem(key);
                } catch (e) {
                  // 忽略单个键删除失败
                }
              }
            });
            return true;
          } catch (e) {
            return false;
          }
        };

        if (window.trackingProtectionHandler) {
          await window.trackingProtectionHandler.safeStorageOperation(
            localDeleteOperation,
            localFallback
          );
        } else {
          localDeleteOperation();
        }

        deleteResults.local.success = true;
        console.log('✅ 文件已从本地存储删除');
      } catch (localError) {
        deleteResults.local.error = localError.message;
        console.warn('从本地存储删除文件失败:', localError);
      }

      // 3. 删除权限设置
      if (window.filePermissionsSystem) {
        try {
          await window.filePermissionsSystem.deleteFilePermissions(file.fileId, file.owner);
          deleteResults.permissions.success = true;
          console.log('✅ 文件权限设置已删除');
        } catch (permError) {
          deleteResults.permissions.error = permError.message;
          console.warn('删除文件权限设置失败:', permError);
        }
      } else {
        deleteResults.permissions.success = true; // 权限系统不存在，视为成功
      }

      // 检查整体删除结果
      const overallSuccess = deleteResults.github.success && deleteResults.local.success;

      if (!overallSuccess) {
        const errors = [];
        if (!deleteResults.github.success) errors.push(`GitHub: ${deleteResults.github.error}`);
        if (!deleteResults.local.success) errors.push(`本地: ${deleteResults.local.error}`);

        throw new Error(`部分删除操作失败: ${errors.join(', ')}`);
      }

    } catch (error) {
      console.error('执行文件删除失败:', error);

      // 提供更详细的错误信息
      const errorDetails = {
        message: error.message,
        results: deleteResults,
        file: {
          id: file.fileId,
          owner: file.owner,
          title: file.title
        }
      };

      throw new Error(`文件删除失败: ${error.message}。详细信息: ${JSON.stringify(errorDetails)}`);
    }
  }

  // 显示批量操作模态框
  showBatchActionsModal() {
    if (this.selectedFiles.size === 0) {
      this.showNotification('请先选择要操作的文件', 'warning');
      return;
    }

    // 移除现有模态框
    const existingModal = document.getElementById('batchActionsModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'batchActionsModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>📋 批量操作</h3>
          <span class="close-btn" onclick="document.getElementById('batchActionsModal').remove()">&times;</span>
        </div>
        <div class="modal-body">
          <p>已选择 <strong>${this.selectedFiles.size}</strong> 个文件</p>

          <div class="batch-action-section">
            <h4>🔧 批量权限设置</h4>
            <div class="form-group">
              <label>权限级别:</label>
              <select id="batchPermissionLevel" class="form-control">
                <option value="public">公开</option>
                <option value="visitor">访客可见</option>
                <option value="friend">好友可见</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            <div class="form-group">
              <label>操作原因:</label>
              <input type="text" id="batchChangeReason" class="form-control"
                     placeholder="请输入批量修改的原因...">
            </div>
            <button type="button" class="btn btn-primary" onclick="adminFileManager.applyBatchPermissions()">
              🔧 应用权限设置
            </button>
          </div>

          <div class="batch-action-section">
            <h4>📁 批量分类设置</h4>
            <div class="form-group">
              <label>主分类:</label>
              <select id="batchMainCategory" class="form-control">
                <option value="">不修改</option>
                <option value="literature">文学作品</option>
                <option value="art">绘画作品</option>
                <option value="music">音乐作品</option>
                <option value="video">视频作品</option>
              </select>
            </div>
            <div class="form-group">
              <label>子分类:</label>
              <select id="batchSubCategory" class="form-control">
                <option value="">不修改</option>
              </select>
            </div>
            <button type="button" class="btn btn-info" onclick="adminFileManager.applyBatchCategory()">
              📁 应用分类设置
            </button>
          </div>

          <div class="batch-action-section danger-section">
            <h4>⚠️ 危险操作</h4>
            <div class="warning-message">
              <strong>警告:</strong> 以下操作不可撤销，请谨慎操作！
            </div>
            <button type="button" class="btn btn-danger" onclick="adminFileManager.batchDeleteFiles()">
              🗑️ 批量删除文件
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('batchActionsModal').remove()">关闭</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 绑定分类变更事件
    document.getElementById('batchMainCategory').addEventListener('change', (e) => {
      this.updateBatchSubcategoryOptions(e.target.value);
    });
  }

  // 更新批量子分类选项
  updateBatchSubcategoryOptions(category) {
    const subcategorySelect = document.getElementById('batchSubCategory');
    if (!subcategorySelect) return;

    const subcategoryOptions = {
      literature: [
        { value: 'essay', text: '随笔' },
        { value: 'poetry', text: '诗歌' },
        { value: 'novel', text: '小说' }
      ],
      art: [
        { value: 'painting', text: '绘画' },
        { value: 'sketch', text: '素描' },
        { value: 'digital', text: '数艺' }
      ],
      music: [
        { value: 'original', text: '原创' },
        { value: 'cover', text: '翻唱' },
        { value: 'instrumental', text: '器乐' }
      ],
      video: [
        { value: 'short', text: '短片' },
        { value: 'documentary', text: '纪录' },
        { value: 'travel', text: '旅拍' }
      ]
    };

    const options = subcategoryOptions[category] || [];
    subcategorySelect.innerHTML = '<option value="">不修改</option>' +
      options.map(option => `<option value="${option.value}">${option.text}</option>`).join('');
  }

  // 应用批量权限设置
  async applyBatchPermissions() {
    try {
      const level = document.getElementById('batchPermissionLevel').value;
      const reason = document.getElementById('batchChangeReason').value.trim();

      if (!reason) {
        this.showNotification('请输入操作原因', 'warning');
        return;
      }

      const selectedFilesList = Array.from(this.selectedFiles);
      let successCount = 0;
      let failCount = 0;

      this.showNotification('开始批量权限设置...', 'info');

      for (const fileKey of selectedFilesList) {
        try {
          const [owner, fileId] = fileKey.split('/');

          // 检查权限
          if (!this.canEditFile(owner)) {
            console.warn(`跳过文件 ${fileKey}: 无权限`);
            failCount++;
            continue;
          }

          // 获取文件信息
          const file = this.currentFiles.find(f => f.fileId === fileId && f.owner === owner);
          if (!file) {
            console.warn(`跳过文件 ${fileKey}: 文件不存在`);
            failCount++;
            continue;
          }

          // 更新权限设置
          const updatedFile = { ...file };
          if (!updatedFile.permissions) {
            updatedFile.permissions = {};
          }

          updatedFile.permissions.level = level;
          updatedFile.permissions.isPublic = level === 'public';
          updatedFile.lastModified = new Date().toISOString();

          // 保存文件
          await this.saveFileToStorage(updatedFile);
          successCount++;

        } catch (error) {
          console.error(`批量权限设置失败: ${fileKey}`, error);
          failCount++;
        }
      }

      // 关闭模态框
      document.getElementById('batchActionsModal').remove();

      // 刷新列表
      await this.loadFileList();

      // 显示结果
      this.showNotification(
        `批量权限设置完成: 成功 ${successCount} 个，失败 ${failCount} 个`,
        failCount === 0 ? 'success' : 'warning'
      );

    } catch (error) {
      console.error('批量权限设置失败:', error);
      this.showNotification('批量权限设置失败: ' + error.message, 'error');
    }
  }

  // 应用批量分类设置
  async applyBatchCategory() {
    try {
      const mainCategory = document.getElementById('batchMainCategory').value;
      const subCategory = document.getElementById('batchSubCategory').value;

      if (!mainCategory && !subCategory) {
        this.showNotification('请选择要修改的分类', 'warning');
        return;
      }

      const selectedFilesList = Array.from(this.selectedFiles);
      let successCount = 0;
      let failCount = 0;

      this.showNotification('开始批量分类设置...', 'info');

      for (const fileKey of selectedFilesList) {
        try {
          const [owner, fileId] = fileKey.split('/');

          // 检查权限
          if (!this.canEditFile(owner)) {
            console.warn(`跳过文件 ${fileKey}: 无权限`);
            failCount++;
            continue;
          }

          // 获取文件信息
          const file = this.currentFiles.find(f => f.fileId === fileId && f.owner === owner);
          if (!file) {
            console.warn(`跳过文件 ${fileKey}: 文件不存在`);
            failCount++;
            continue;
          }

          // 更新分类设置
          const updatedFile = { ...file };
          if (mainCategory) {
            updatedFile.mainCategory = mainCategory;
          }
          if (subCategory) {
            updatedFile.subCategory = subCategory;
            updatedFile.subcategory = subCategory; // 兼容性
          }
          updatedFile.lastModified = new Date().toISOString();

          // 保存文件
          await this.saveFileToStorage(updatedFile);
          successCount++;

        } catch (error) {
          console.error(`批量分类设置失败: ${fileKey}`, error);
          failCount++;
        }
      }

      // 关闭模态框
      document.getElementById('batchActionsModal').remove();

      // 刷新列表
      await this.loadFileList();

      // 显示结果
      this.showNotification(
        `批量分类设置完成: 成功 ${successCount} 个，失败 ${failCount} 个`,
        failCount === 0 ? 'success' : 'warning'
      );

    } catch (error) {
      console.error('批量分类设置失败:', error);
      this.showNotification('批量分类设置失败: ' + error.message, 'error');
    }
  }

  // 批量删除文件
  async batchDeleteFiles() {
    try {
      const selectedFilesList = Array.from(this.selectedFiles);

      // 显示确认对话框
      const confirmed = await this.showBatchDeleteConfirmation(selectedFilesList.length);
      if (!confirmed) {
        return;
      }

      let successCount = 0;
      let failCount = 0;

      this.showNotification('开始批量删除文件...', 'info');

      for (const fileKey of selectedFilesList) {
        try {
          const [owner, fileId] = fileKey.split('/');

          // 检查权限
          if (!this.canDeleteFile(owner)) {
            console.warn(`跳过文件 ${fileKey}: 无权限`);
            failCount++;
            continue;
          }

          // 获取文件信息
          const file = this.currentFiles.find(f => f.fileId === fileId && f.owner === owner);
          if (!file) {
            console.warn(`跳过文件 ${fileKey}: 文件不存在`);
            failCount++;
            continue;
          }

          // 执行删除
          await this.performFileDelete(file);
          successCount++;

        } catch (error) {
          console.error(`批量删除失败: ${fileKey}`, error);
          failCount++;
        }
      }

      // 关闭模态框
      document.getElementById('batchActionsModal').remove();

      // 清空选择
      this.selectedFiles.clear();

      // 刷新列表
      await this.loadFileList();

      // 显示结果
      this.showNotification(
        `批量删除完成: 成功 ${successCount} 个，失败 ${failCount} 个`,
        failCount === 0 ? 'success' : 'warning'
      );

    } catch (error) {
      console.error('批量删除失败:', error);
      this.showNotification('批量删除失败: ' + error.message, 'error');
    }
  }

  // 显示批量删除确认对话框
  showBatchDeleteConfirmation(count) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>⚠️ 批量删除确认</h3>
          </div>
          <div class="modal-body">
            <div class="warning-message">
              <strong>⚠️ 危险操作警告</strong>
            </div>
            <p>您确定要删除选中的 <strong>${count}</strong> 个文件吗？</p>
            <div class="delete-warning">
              <ul>
                <li>此操作将永久删除所有选中的文件</li>
                <li>文件将从所有存储位置移除（GitHub 和本地）</li>
                <li>相关的权限设置也将被删除</li>
                <li><strong>此操作不可撤销！</strong></li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove(); window.batchDeleteConfirmResolve(false)">取消</button>
            <button type="button" class="btn btn-danger" onclick="this.closest('.modal').remove(); window.batchDeleteConfirmResolve(true)">确认删除</button>
          </div>
        </div>
      `;

      // 设置全局回调
      window.batchDeleteConfirmResolve = resolve;

      document.body.appendChild(modal);
    });
  }

  // 显示通知
  showNotification(message, type = 'info') {
    // 复用现有的通知系统
    if (typeof showNotification === 'function') {
      showNotification(message, type);
    } else {
      // 简单的 alert 回退
      alert(message);
    }
  }

  // 调试工具：显示文件管理器状态
  debugStatus() {
    const status = {
      initialized: this.initialized || false,
      currentFiles: this.currentFiles.length,
      filteredFiles: this.filteredFiles.length,
      selectedFiles: this.selectedFiles.size,
      filters: {
        searchQuery: this.searchQuery,
        filterBy: this.filterBy,
        ownerFilter: this.ownerFilter,
        permissionFilter: this.permissionFilter
      },
      sorting: {
        sortBy: this.sortBy,
        sortOrder: this.sortOrder
      },
      pagination: {
        currentPage: this.currentPage,
        itemsPerPage: this.itemsPerPage
      }
    };

    console.log('🔧 文件管理器状态:', status);

    if (this.currentFiles.length > 0) {
      console.log('📄 当前文件列表:');
      this.currentFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.title} (${file.owner}) - ${file.source}`);
      });
    }

    if (this.filteredFiles.length !== this.currentFiles.length) {
      console.log('🔍 过滤后文件列表:');
      this.filteredFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.title} (${file.owner}) - ${file.source}`);
      });
    }

    return status;
  }

  // 显示无文件时的调试信息
  showNoFilesDebugInfo() {
    const fileListContent = document.getElementById('fileListContent');
    if (!fileListContent) return;

    const debugInfo = {
      environment: window.location.hostname,
      dataManager: !!window.dataManager,
      githubStorage: !!window.githubStorage,
      githubToken: !!localStorage.getItem('github_token'),
      localStorageKeys: Object.keys(localStorage).filter(k => k.startsWith('work_')).length
    };

    fileListContent.innerHTML = `
      <div class="no-files-debug">
        <h4>📂 没有找到文件</h4>
        <p>系统未能找到任何文件。以下是调试信息：</p>
        <div class="debug-info">
          <h5>环境信息:</h5>
          <ul>
            <li>主机名: ${debugInfo.environment}</li>
            <li>数据管理器: ${debugInfo.dataManager ? '✅ 已加载' : '❌ 未加载'}</li>
            <li>GitHub存储: ${debugInfo.githubStorage ? '✅ 已加载' : '❌ 未加载'}</li>
            <li>GitHub Token: ${debugInfo.githubToken ? '✅ 已配置' : '❌ 未配置'}</li>
            <li>本地文件数量: ${debugInfo.localStorageKeys}</li>
          </ul>
          <h5>可能的原因:</h5>
          <ul>
            <li>GitHub Pages环境下需要配置GitHub Token</li>
            <li>本地存储中没有文件数据</li>
            <li>网络连接问题导致无法访问GitHub API</li>
            <li>文件路径配置不正确</li>
          </ul>
          <h5>建议操作:</h5>
          <ul>
            <li>检查系统设置中的GitHub Token配置</li>
            <li>尝试上传一个测试文件</li>
            <li>查看浏览器控制台的错误信息</li>
          </ul>
        </div>
        <div class="debug-actions">
          <button class="btn btn-primary" onclick="window.adminFileManager.debugFileRetrieval()">详细调试</button>
          <button class="btn btn-secondary" onclick="window.adminFileManager.loadFileList()">重新加载</button>
        </div>
      </div>
    `;
  }

  // 调试文件获取过程
  async debugFileRetrieval() {
    console.log('🔍 开始调试文件获取过程...');

    try {
      // 测试GitHub文件获取
      console.log('📁 测试GitHub文件获取...');
      const githubFiles = await this.getGitHubFiles();
      console.log(`GitHub文件: ${githubFiles.length} 个`, githubFiles);

      // 测试本地文件获取
      console.log('📱 测试本地文件获取...');
      const localFiles = await this.getLocalFiles();
      console.log(`本地文件: ${localFiles.length} 个`, localFiles);

      // 显示调试结果
      this.showNotification(`调试完成: GitHub ${githubFiles.length} 个, 本地 ${localFiles.length} 个文件`, 'info');

    } catch (error) {
      console.error('调试过程出错:', error);
      this.showNotification(`调试失败: ${error.message}`, 'error');
    }
  }
}

// 创建全局实例
window.adminFileManager = new AdminFileManager();

// 添加全局调试函数
window.debugFileManager = () => {
  if (window.adminFileManager) {
    return window.adminFileManager.debugStatus();
  } else {
    console.error('文件管理器未初始化');
    return null;
  }
};
