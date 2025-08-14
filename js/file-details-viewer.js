// 文件详情查看器
class FileDetailsViewer {
  constructor() {
    this.currentFileId = null;
    this.currentOwner = null;
  }

  // 显示文件详情
  async showFileDetails(fileId, owner) {
    try {
      this.currentFileId = fileId;
      this.currentOwner = owner;

      // 获取文件信息和权限数据
      const fileInfo = await this.getFileInfo(fileId, owner);
      const permissions = await window.filePermissionsSystem.getFilePermissions(fileId, owner);

      if (!fileInfo) {
        this.showNotification('文件信息不存在', 'error');
        return;
      }

      // 创建并显示详情模态框
      this.createDetailsModal(fileInfo, permissions);

    } catch (error) {
      console.error('显示文件详情失败:', error);
      this.showNotification('获取文件详情失败', 'error');
    }
  }

  // 创建详情模态框
  createDetailsModal(fileInfo, permissions) {
    // 移除现有模态框
    const existingModal = document.getElementById('fileDetailsModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'fileDetailsModal';
    modal.className = 'modal file-details-modal';
    modal.style.display = 'flex';
    modal.innerHTML = this.getDetailsModalHTML(fileInfo, permissions);

    document.body.appendChild(modal);
    this.bindDetailsModalEvents();
  }

  // 获取详情模态框HTML
  getDetailsModalHTML(fileInfo, permissions) {
    const permissionLevel = permissions?.level || 'unknown';
    const permissionIcon = this.getPermissionIcon(permissionLevel);
    const permissionText = this.getPermissionText(permissionLevel);

    return `
      <div class="modal-content file-details-content">
        <div class="modal-header">
          <h3>📄 文件详情</h3>
          <span class="close-btn" onclick="fileDetailsViewer.closeModal()">&times;</span>
        </div>
        
        <div class="modal-body">
          <!-- 基本信息 -->
          <div class="details-section">
            <h4>📋 基本信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>文件标题:</label>
                <span class="info-value">${fileInfo.title || fileInfo.originalName || '未命名文件'}</span>
              </div>
              <div class="info-item">
                <label>文件ID:</label>
                <span class="info-value">${this.currentFileId}</span>
              </div>
              <div class="info-item">
                <label>作者/上传者:</label>
                <span class="info-value">${this.currentOwner}</span>
              </div>
              <div class="info-item">
                <label>上传时间:</label>
                <span class="info-value">${this.formatDate(fileInfo.uploadTime)}</span>
              </div>
              <div class="info-item">
                <label>文件类型:</label>
                <span class="info-value">${this.getFileType(fileInfo)}</span>
              </div>
              <div class="info-item">
                <label>分类:</label>
                <span class="info-value">${this.getCategoryPath(fileInfo)}</span>
              </div>
              <div class="info-item">
                <label>文件大小:</label>
                <span class="info-value">${this.getFileSize(fileInfo)}</span>
              </div>
              <div class="info-item">
                <label>存储类型:</label>
                <span class="info-value">${this.getStorageType(fileInfo)}</span>
              </div>
            </div>
          </div>

          <!-- 权限信息 -->
          <div class="details-section">
            <h4>🔐 权限设置</h4>
            <div class="permission-info">
              <div class="permission-level">
                <span class="permission-badge permission-${permissionLevel}">
                  ${permissionIcon} ${permissionText}
                </span>
                <span class="permission-description">${this.getPermissionDescription(permissionLevel)}</span>
              </div>
              ${this.renderPermissionDetails(permissions)}
            </div>
          </div>

          <!-- 权限变更历史 -->
          ${this.renderPermissionHistory(permissions)}

          <!-- 内容预览 -->
          ${this.renderContentPreview(fileInfo)}
        </div>

        <div class="modal-footer">
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="fileDetailsViewer.closeModal()">关闭</button>
            <button type="button" class="btn btn-primary" onclick="fileDetailsViewer.editPermissions()">编辑权限</button>
            ${auth.isAdmin && auth.isAdmin() ? '<button type="button" class="btn btn-danger" onclick="fileDetailsViewer.deleteFile()">删除文件</button>' : ''}
          </div>
        </div>
      </div>
    `;
  }

  // 渲染权限详情
  renderPermissionDetails(permissions) {
    if (!permissions || permissions.level !== 'custom') {
      return '';
    }

    const custom = permissions.customAccess || {};
    let html = '<div class="custom-permissions-details">';

    // 白名单信息
    if (custom.whitelist?.enabled) {
      html += `
        <div class="permission-detail-item">
          <strong>✅ 白名单:</strong>
          <div class="permission-lists">
            ${custom.whitelist.users?.length ? `<div>用户: ${custom.whitelist.users.join(', ')}</div>` : ''}
            ${custom.whitelist.roles?.length ? `<div>角色: ${custom.whitelist.roles.join(', ')}</div>` : ''}
          </div>
        </div>
      `;
    }

    // 黑名单信息
    if (custom.blacklist?.enabled) {
      html += `
        <div class="permission-detail-item">
          <strong>❌ 黑名单:</strong>
          <div class="permission-lists">
            ${custom.blacklist.users?.length ? `<div>用户: ${custom.blacklist.users.join(', ')}</div>` : ''}
            ${custom.blacklist.roles?.length ? `<div>角色: ${custom.blacklist.roles.join(', ')}</div>` : ''}
          </div>
        </div>
      `;
    }

    // 特殊权限
    const special = custom.specialPermissions || {};
    if (Object.keys(special).length > 0) {
      html += `
        <div class="permission-detail-item">
          <strong>🔧 特殊权限:</strong>
          <div class="special-permissions-list">
            ${special.allowAnonymous ? '<span class="permission-tag">允许匿名访问</span>' : ''}
            ${special.allowComments !== false ? '<span class="permission-tag">允许评论</span>' : '<span class="permission-tag disabled">禁止评论</span>'}
            ${special.allowDownload !== false ? '<span class="permission-tag">允许下载</span>' : '<span class="permission-tag disabled">禁止下载</span>'}
            ${special.allowShare !== false ? '<span class="permission-tag">允许分享</span>' : '<span class="permission-tag disabled">禁止分享</span>'}
            ${special.expiryDate ? `<span class="permission-tag">过期时间: ${this.formatDate(special.expiryDate)}</span>` : ''}
            ${special.maxViews ? `<span class="permission-tag">最大查看: ${special.maxViews}次</span>` : ''}
          </div>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  // 渲染权限变更历史
  renderPermissionHistory(permissions) {
    if (!permissions?.metadata?.changeHistory?.length) {
      return '';
    }

    const history = permissions.metadata.changeHistory;
    return `
      <div class="details-section">
        <h4>📈 权限变更历史</h4>
        <div class="history-list">
          ${history.map(change => `
            <div class="history-item">
              <div class="history-header">
                <span class="history-action">${this.getActionText(change.action)}</span>
                <span class="history-date">${this.formatDate(change.at)}</span>
              </div>
              <div class="history-details">
                <div>操作者: ${change.by}</div>
                ${change.from && change.to ? `<div>权限变更: ${change.from} → ${change.to}</div>` : ''}
                ${change.reason ? `<div>原因: ${change.reason}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 渲染内容预览
  renderContentPreview(fileInfo) {
    if (!fileInfo.content && !fileInfo.description) {
      return '';
    }

    const content = fileInfo.content || fileInfo.description || '';
    const previewContent = content.length > 500 ? content.substring(0, 500) + '...' : content;

    return `
      <div class="details-section">
        <h4>👁️ 内容预览</h4>
        <div class="content-preview">
          <div class="preview-text">${this.escapeHtml(previewContent)}</div>
          ${content.length > 500 ? '<div class="preview-note">内容已截断，完整内容请访问原文件</div>' : ''}
        </div>
      </div>
    `;
  }

  // 获取文件信息
  async getFileInfo(fileId, owner) {
    try {
      const workKey = `work_${fileId}`;
      console.log(`🔍 获取文件信息: ${fileId} (所有者: ${owner})`);

      // 1. 在网络环境下，优先从 GitHub 获取数据
      if (window.dataManager && window.dataManager.shouldUseGitHubStorage()) {
        console.log(`🌐 尝试从 GitHub 获取文件信息: ${workKey}`);
        try {
          const workData = await window.dataManager.loadData(workKey, {
            category: 'works',
            fallbackToLocal: false
          });
          if (workData) {
            console.log(`✅ 从 GitHub 获取到文件信息: ${fileId}`);
            return workData;
          } else {
            console.log(`ℹ️ GitHub 中未找到文件信息: ${fileId}`);
          }
        } catch (error) {
          console.warn(`⚠️ 从 GitHub 获取文件信息失败: ${error.message}`);
        }
      }

      // 2. 从本地存储获取
      console.log(`📱 尝试从本地存储获取文件信息: ${workKey}`);
      const localWorkData = localStorage.getItem(workKey);
      if (localWorkData) {
        try {
          const workData = JSON.parse(localWorkData);
          console.log(`✅ 从本地存储获取到文件信息: ${fileId}`);
          return workData;
        } catch (error) {
          console.warn(`⚠️ 解析本地文件信息失败: ${error.message}`);
        }
      } else {
        console.log(`ℹ️ 本地存储中未找到文件信息: ${fileId}`);
      }

      // 3. 尝试从当前文件列表中获取（管理员页面特有）
      if (window.adminFileManager && window.adminFileManager.currentFiles) {
        console.log(`📋 尝试从当前文件列表获取信息: ${fileId}`);
        const fileFromList = window.adminFileManager.currentFiles.find(f =>
          f.fileId === fileId && f.owner === owner
        );
        if (fileFromList) {
          console.log(`✅ 从文件列表获取到文件信息: ${fileId}`);
          return {
            title: fileFromList.title || fileFromList.originalName || '未命名文件',
            originalName: fileFromList.originalName,
            mainCategory: fileFromList.mainCategory || 'literature',
            subCategory: fileFromList.subCategory || fileFromList.subcategory || 'essay',
            uploadedBy: fileFromList.owner,
            uploadTime: fileFromList.uploadTime,
            content: fileFromList.content || '内容未加载',
            size: fileFromList.size,
            permissions: fileFromList.permissions,
            storage_type: 'admin_list'
          };
        }
      }

      // 4. 尝试从Firebase获取
      if (window.firebaseAvailable && firebase.apps && firebase.apps.length) {
        console.log(`🔥 尝试从 Firebase 获取文件信息: userFiles/${owner}/${fileId}`);
        try {
          const snapshot = await firebase.database().ref(`userFiles/${owner}/${fileId}`).once('value');
          const fileData = snapshot.val();
          if (fileData) {
            console.log(`✅ 从 Firebase 获取到文件信息: ${fileId}`);
            return fileData;
          } else {
            console.log(`ℹ️ Firebase 中未找到文件信息: ${fileId}`);
          }
        } catch (error) {
          console.warn(`⚠️ 从 Firebase 获取文件信息失败: ${error.message}`);
        }
      }

      // 5. 如果是旧格式随笔，从essays中查找
      if (fileId.startsWith('essay_legacy_')) {
        console.log(`📚 尝试从旧格式随笔中查找: ${fileId}`);
        const essaysData = localStorage.getItem('essays');
        if (essaysData) {
          const essays = JSON.parse(essaysData);
          const titleFromId = fileId.replace('essay_legacy_', '').split('_')[0];
          const essay = essays.find(essay => essay.title.replace(/[^a-zA-Z0-9]/g, '_') === titleFromId);
          if (essay) {
            console.log(`✅ 从旧格式随笔中找到文件信息: ${fileId}`);
            return {
              ...essay,
              mainCategory: 'literature',
              subCategory: 'essay',
              uploadedBy: essay.author,
              uploadTime: essay.date,
              storage_type: 'legacy_essay'
            };
          }
        }
      }

      // 6. 最后尝试从 GitHub 的 user-uploads 目录直接获取
      if (window.dataManager && window.dataManager.shouldUseGitHubStorage()) {
        console.log(`📁 尝试从 user-uploads 目录获取文件: ${fileId}`);
        try {
          // 构建可能的文件路径
          const possiblePaths = [
            `user-uploads/literature/essay/${owner}/${fileId}.json`,
            `user-uploads/literature/novel/${owner}/${fileId}.json`,
            `user-uploads/literature/poetry/${owner}/${fileId}.json`,
            `user-uploads/art/painting/${owner}/${fileId}.json`,
            `user-uploads/music/song/${owner}/${fileId}.json`,
            `user-uploads/video/movie/${owner}/${fileId}.json`
          ];

          for (const path of possiblePaths) {
            try {
              const fileData = await window.githubStorage.getFile(path);
              if (fileData && fileData.content) {
                const content = atob(fileData.content);
                const parsedData = JSON.parse(content);
                console.log(`✅ 从 user-uploads 获取到文件信息: ${path}`);
                return {
                  ...parsedData,
                  storage_type: 'user_uploads',
                  storage_path: path
                };
              }
            } catch (error) {
              // 继续尝试下一个路径
              continue;
            }
          }
        } catch (error) {
          console.warn(`⚠️ 从 user-uploads 获取文件失败: ${error.message}`);
        }
      }

      console.log(`ℹ️ 未找到文件信息: ${fileId}`);
      return null;
    } catch (error) {
      console.error(`❌ 获取文件信息失败: ${fileId}`, error);
      return null;
    }
  }

  // 编辑权限
  editPermissions() {
    this.closeModal();
    if (window.filePermissionsUI) {
      window.filePermissionsUI.showPermissionsModal(this.currentFileId, this.currentOwner);
    }
  }

  // 删除文件
  deleteFile() {
    this.closeModal();
    if (window.fileHierarchyManager) {
      window.fileHierarchyManager.deleteFile(this.currentFileId, this.currentOwner);
    }
  }

  // 关闭模态框
  closeModal() {
    const modal = document.getElementById('fileDetailsModal');
    if (modal) {
      modal.remove();
    }
  }

  // 绑定模态框事件
  bindDetailsModalEvents() {
    // 点击背景关闭
    const modal = document.getElementById('fileDetailsModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }
  }

  // 辅助方法
  formatDate(dateString) {
    if (!dateString) return '未知';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN');
    } catch (error) {
      return dateString;
    }
  }

  getFileType(fileInfo) {
    if (fileInfo.storage_type === 'legacy_essay') return '旧格式随笔';
    if (fileInfo.mainCategory === 'literature') return '文学作品';
    if (fileInfo.mainCategory === 'art') return '绘画作品';
    if (fileInfo.mainCategory === 'music') return '音乐作品';
    if (fileInfo.mainCategory === 'video') return '视频作品';
    return '其他';
  }

  getCategoryPath(fileInfo) {
    const categoryNames = {
      literature: '文学作品',
      art: '绘画作品',
      music: '音乐作品',
      video: '视频作品'
    };
    
    const subcategoryNames = {
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

    const category = categoryNames[fileInfo.mainCategory] || fileInfo.mainCategory || '其他';
    const subcategory = subcategoryNames[fileInfo.subCategory] || fileInfo.subCategory || '默认';
    
    return `${category} → ${subcategory}`;
  }

  getFileSize(fileInfo) {
    if (fileInfo.size) {
      return this.formatFileSize(fileInfo.size);
    }
    if (fileInfo.content) {
      return this.formatFileSize(new Blob([fileInfo.content]).size);
    }
    return '未知';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getStorageType(fileInfo) {
    if (fileInfo.storage_type === 'legacy_essay') return '旧格式随笔';
    if (fileInfo.storage_type === 'admin_list') return '管理员列表';
    if (fileInfo.storage_type === 'user_uploads') return '用户上传目录';
    if (this.currentFileId.startsWith('work_')) return '新格式作品';
    return '本地存储';
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

  getPermissionDescription(level) {
    const descriptions = {
      public: '所有人都可以查看，包括未登录用户',
      visitor: '仅限已登录的访客级别及以上用户查看',
      friend: '仅限好友级别及以上用户查看和评论',
      custom: '使用白名单和黑名单机制精确控制访问权限',
      private: '仅作者和管理员可以查看'
    };
    return descriptions[level] || '未知权限级别';
  }

  getActionText(action) {
    const actions = {
      created: '创建',
      updated: '更新',
      deleted: '删除'
    };
    return actions[action] || action;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = 'info') {
    if (typeof showNotification !== 'undefined') {
      showNotification(message, type);
    } else {
      alert(message);
    }
  }
}

// 添加文件详情查看器样式
function addFileDetailsStyles() {
  if (document.getElementById('fileDetailsStyles')) return;

  const style = document.createElement('style');
  style.id = 'fileDetailsStyles';
  style.textContent = `
    /* 文件详情模态框样式 */
    .file-details-modal {
      z-index: 10003;
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

    .file-details-content {
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .file-details-content .modal-header {
      flex-shrink: 0;
      padding: 1.5rem;
      border-bottom: 1px solid #e9ecef;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 16px 16px 0 0;
    }

    .file-details-content .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .file-details-content .modal-footer {
      flex-shrink: 0;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e9ecef;
      background: #f8f9fa;
      border-radius: 0 0 16px 16px;
    }

    /* 详情区域样式 */
    .details-section {
      margin-bottom: 1.5rem;
      padding: 1.25rem;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 4px solid #007bff;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .details-section:last-child {
      margin-bottom: 0;
    }

    .details-section h4 {
      margin: 0 0 1rem 0;
      color: #333;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
    }

    /* 信息网格样式 */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0; /* 允许内容收缩 */
    }

    .info-item label {
      font-weight: 600;
      color: #6c757d;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .info-value {
      color: #333;
      font-weight: 500;
      padding: 0.5rem;
      background: white;
      border-radius: 6px;
      border: 1px solid #e9ecef;
      word-wrap: break-word;
      overflow-wrap: break-word;
      min-width: 0;
    }

    /* 权限信息样式 */
    .permission-info {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .permission-level {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .permission-description {
      color: #6c757d;
      font-style: italic;
    }

    .custom-permissions-details {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e9ecef;
    }

    .permission-detail-item {
      margin-bottom: 1rem;
    }

    .permission-lists {
      margin-left: 1rem;
      color: #6c757d;
    }

    .special-permissions-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .permission-tag {
      padding: 0.25rem 0.75rem;
      background: #e8f4fd;
      color: #0c5460;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .permission-tag.disabled {
      background: #f8d7da;
      color: #721c24;
    }

    /* 历史记录样式 */
    .history-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .history-item {
      padding: 1rem;
      background: white;
      border-radius: 8px;
      border: 1px solid #e9ecef;
      margin-bottom: 0.5rem;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .history-action {
      font-weight: 600;
      color: #007bff;
    }

    .history-date {
      color: #6c757d;
      font-size: 0.875rem;
    }

    .history-details {
      color: #6c757d;
      font-size: 0.875rem;
      line-height: 1.4;
    }

    /* 内容预览样式 */
    .content-preview {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid #e9ecef;
      max-width: 100%;
      overflow: hidden;
    }

    .preview-text {
      white-space: pre-wrap;
      line-height: 1.6;
      color: #333;
      max-height: 200px;
      overflow-y: auto;
      word-wrap: break-word;
      overflow-wrap: break-word;
      max-width: 100%;
    }

    .preview-note {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #fff3cd;
      color: #856404;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    /* 删除确认对话框样式 */
    .delete-confirm-modal {
      z-index: 10004;
    }

    .delete-confirm-content {
      max-width: 500px;
      width: 95%;
    }

    .delete-warning {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: #fff3cd;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
    }

    .warning-icon {
      font-size: 2rem;
      color: #856404;
    }

    .warning-text {
      flex: 1;
    }

    .warning-text p {
      margin: 0 0 0.5rem 0;
    }

    .file-info {
      color: #6c757d;
    }

    .file-name, .file-owner {
      font-weight: 600;
      color: #333;
    }

    .warning-note {
      color: #dc3545;
      font-weight: 600;
      margin-top: 1rem;
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
      .file-details-modal {
        padding: 0.5rem;
      }

      .file-details-content {
        max-height: 95vh;
        border-radius: 12px;
      }

      .file-details-content .modal-header {
        padding: 1rem;
        border-radius: 12px 12px 0 0;
      }

      .file-details-content .modal-body {
        padding: 1rem;
      }

      .file-details-content .modal-footer {
        padding: 0.75rem 1rem;
        border-radius: 0 0 12px 12px;
      }

      .details-section {
        padding: 1rem;
        margin-bottom: 1rem;
      }

      .info-grid {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .permission-level {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .special-permissions-list {
        flex-direction: column;
      }

      .delete-warning {
        flex-direction: column;
        text-align: center;
        padding: 1rem;
      }

      .warning-icon {
        align-self: center;
      }

      .modal-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .modal-actions .btn {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .file-details-content {
        max-height: 98vh;
        border-radius: 8px;
      }

      .details-section {
        padding: 0.75rem;
      }

      .info-grid {
        gap: 0.5rem;
      }

      .preview-text {
        max-height: 150px;
      }
    }
  `;

  document.head.appendChild(style);
}

// 自动添加样式
addFileDetailsStyles();

// 创建全局实例
window.fileDetailsViewer = new FileDetailsViewer();
