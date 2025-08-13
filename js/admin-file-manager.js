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
      
      // 更新用户过滤器选项
      this.updateOwnerFilter();
      
      // 应用过滤和排序
      this.applyFilters();
      
      console.log(`✅ 文件列表加载完成，共 ${this.currentFiles.length} 个文件`);
      
    } catch (error) {
      console.error('❌ 加载文件列表失败:', error);
      fileListContent.innerHTML = `
        <div class="error-message">
          <h4>❌ 加载失败</h4>
          <p>无法加载文件列表: ${error.message}</p>
          <button class="btn btn-primary" onclick="adminFileManager.loadFileList()">重试</button>
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
      });
      
      // 再添加本地文件（如果不存在）
      localFiles.forEach(file => {
        const key = `${file.owner}_${file.fileId}`;
        if (!fileMap.has(key)) {
          fileMap.set(key, { ...file, source: 'local' });
        }
      });

      return Array.from(fileMap.values());
      
    } catch (error) {
      console.error('获取文件列表失败:', error);
      throw error;
    }
  }

  // 从 GitHub 获取文件
  async getGitHubFiles() {
    try {
      if (!window.fileHierarchyManager) {
        return [];
      }
      
      const githubFiles = await window.fileHierarchyManager.getAllGitHubFiles();
      const processedFiles = [];
      
      for (const file of githubFiles) {
        try {
          // 尝试获取文件的详细信息
          let fileData = null;
          
          if (file.type === 'work') {
            // 从 data/works 目录获取
            fileData = await window.dataManager.loadData(file.key, {
              category: 'works',
              fallbackToLocal: false
            });
          } else {
            // 从 user-uploads 目录获取元数据
            const metadataPath = file.path.replace(/\.[^.]+$/, '_metadata.json');
            try {
              const metadataFile = await window.githubStorage.getFile(metadataPath);
              if (metadataFile && metadataFile.content) {
                fileData = JSON.parse(atob(metadataFile.content));
              }
            } catch (metaError) {
              // 如果没有元数据文件，创建基本信息
              fileData = {
                title: file.name,
                originalName: file.name,
                mainCategory: file.category,
                subCategory: file.subcategory,
                uploadedBy: file.owner,
                uploadTime: new Date().toISOString()
              };
            }
          }
          
          if (fileData) {
            processedFiles.push({
              ...fileData,
              fileId: file.key || file.name.replace(/\.[^.]+$/, ''),
              owner: file.owner || fileData.uploadedBy || fileData.author,
              githubPath: file.path,
              githubSha: file.sha,
              fileSize: file.size,
              downloadUrl: file.downloadUrl,
              htmlUrl: file.htmlUrl,
              source: 'github'
            });
          }
        } catch (error) {
          console.warn(`处理 GitHub 文件失败: ${file.path}`, error);
        }
      }
      
      return processedFiles;
    } catch (error) {
      console.error('从 GitHub 获取文件失败:', error);
      return [];
    }
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
            files.push({
              ...workData,
              fileId: key.replace('work_', ''),
              owner: workData.uploadedBy || workData.author,
              source: 'local'
            });
          } catch (error) {
            console.warn(`解析本地文件失败: ${key}`, error);
          }
        }
      }
      
      return files;
    } catch (error) {
      console.error('从本地存储获取文件失败:', error);
      return [];
    }
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
    this.filteredFiles = this.currentFiles.filter(file => {
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
        const permissionLevel = file.permissions?.level || 'unknown';
        if (permissionLevel !== this.permissionFilter) {
          return false;
        }
      }

      return true;
    });

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
    const permission = this.getPermissionText(file.permissions?.level);
    const source = file.source || 'unknown';

    return `
      <div class="file-row" data-file-id="${fileId}" data-owner="${owner}">
        <div class="file-checkbox">
          <input type="checkbox" class="file-select" value="${owner}/${fileId}">
        </div>
        <div class="file-name">
          <div class="file-title">${this.escapeHtml(title)}</div>
          <div class="file-meta">
            <span class="file-id">ID: ${fileId}</span>
            <span class="file-source source-${source}">${source === 'github' ? 'GitHub' : '本地'}</span>
          </div>
        </div>
        <div class="file-owner">${this.escapeHtml(owner)}</div>
        <div class="file-category">
          <div class="category-main">${category}</div>
          <div class="category-sub">${subcategory}</div>
        </div>
        <div class="file-size">${size}</div>
        <div class="file-permission">
          <span class="permission-badge permission-${file.permissions?.level || 'unknown'}">
            ${permission}
          </span>
        </div>
        <div class="file-time">${uploadTime}</div>
        <div class="file-actions">
          <button class="btn btn-sm btn-info" onclick="adminFileManager.viewFile('${fileId}', '${owner}')">
            👁️ 查看
          </button>
          <button class="btn btn-sm btn-secondary" onclick="adminFileManager.editPermissions('${fileId}', '${owner}')">
            🔐 权限
          </button>
          <button class="btn btn-sm btn-warning" onclick="adminFileManager.editFile('${fileId}', '${owner}')">
            ✏️ 编辑
          </button>
          <button class="btn btn-sm btn-danger" onclick="adminFileManager.deleteFile('${fileId}', '${owner}')">
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
      // 保存到数据管理器（会自动选择存储策略）
      if (window.dataManager) {
        await window.dataManager.saveData(fileKey, file, {
          category: 'works',
          commitMessage: `更新文件: ${file.title}`
        });
      } else {
        // 回退到本地存储
        localStorage.setItem(fileKey, JSON.stringify(file));
      }
    } catch (error) {
      console.error('保存文件到存储失败:', error);
      throw error;
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

    try {
      // 1. 从 GitHub 删除（如果存在）
      if (file.source === 'github' && file.githubPath && window.githubStorage && window.githubStorage.token) {
        try {
          await window.githubStorage.deleteFile(file.githubPath, `删除文件: ${file.title}`);
          console.log('✅ 文件已从 GitHub 删除');
        } catch (githubError) {
          console.warn('从 GitHub 删除文件失败:', githubError);
          // 继续删除本地副本
        }
      }

      // 2. 从本地存储删除
      localStorage.removeItem(fileKey);
      console.log('✅ 文件已从本地存储删除');

      // 3. 删除权限设置
      if (window.filePermissionsSystem) {
        try {
          await window.filePermissionsSystem.deleteFilePermissions(file.fileId, file.owner);
          console.log('✅ 文件权限设置已删除');
        } catch (permError) {
          console.warn('删除文件权限设置失败:', permError);
        }
      }

    } catch (error) {
      console.error('执行文件删除失败:', error);
      throw error;
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
}

// 创建全局实例
window.adminFileManager = new AdminFileManager();
