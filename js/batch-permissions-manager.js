// 批量权限管理系统
class BatchPermissionsManager {
  constructor() {
    this.selectedFiles = new Set();
    this.isSelectionMode = false;
  }

  // 初始化批量权限管理
  initialize() {
    this.addBatchControlsToHierarchy();
    this.bindEvents();
    console.log('✅ 批量权限管理器已初始化');
  }

  // 添加批量控制按钮到文件层级管理器
  addBatchControlsToHierarchy() {
    // 等待文件层级管理器加载完成
    setTimeout(() => {
      const hierarchyHeader = document.querySelector('.hierarchy-header');
      if (hierarchyHeader) {
        this.insertBatchControls(hierarchyHeader);
      }
    }, 1000);
  }

  // 插入批量控制按钮
  insertBatchControls(hierarchyHeader) {
    const controlsContainer = hierarchyHeader.querySelector('.hierarchy-controls');
    if (!controlsContainer) return;

    // 创建批量操作按钮
    const batchControls = document.createElement('div');
    batchControls.className = 'batch-controls';
    batchControls.innerHTML = `
      <button class="btn btn-sm btn-info" onclick="batchPermissionsManager.toggleSelectionMode()" id="toggleSelectionBtn">
        📋 批量选择
      </button>
      <div class="batch-actions" id="batchActions" style="display: none;">
        <span class="selected-count" id="selectedCount">已选择 0 个文件</span>
        <button class="btn btn-sm btn-primary" onclick="batchPermissionsManager.showBatchPermissionsModal()">
          ⚙️ 批量设置权限
        </button>
        <button class="btn btn-sm btn-success" onclick="batchPermissionsManager.selectAll()">
          ✅ 全选
        </button>
        <button class="btn btn-sm btn-warning" onclick="batchPermissionsManager.clearSelection()">
          🔄 清除选择
        </button>
        <button class="btn btn-sm btn-secondary" onclick="batchPermissionsManager.toggleSelectionMode()">
          ❌ 取消
        </button>
      </div>
    `;

    controlsContainer.appendChild(batchControls);
  }

  // 切换选择模式
  toggleSelectionMode() {
    this.isSelectionMode = !this.isSelectionMode;
    
    const toggleBtn = document.getElementById('toggleSelectionBtn');
    const batchActions = document.getElementById('batchActions');
    
    if (this.isSelectionMode) {
      // 进入选择模式
      toggleBtn.style.display = 'none';
      batchActions.style.display = 'flex';
      this.addCheckboxesToFiles();
      document.body.classList.add('batch-selection-mode');
    } else {
      // 退出选择模式
      toggleBtn.style.display = 'block';
      batchActions.style.display = 'none';
      this.removeCheckboxesFromFiles();
      this.clearSelection();
      document.body.classList.remove('batch-selection-mode');
    }
  }

  // 为文件节点添加复选框
  addCheckboxesToFiles() {
    const fileNodes = document.querySelectorAll('.file-node');
    fileNodes.forEach(node => {
      const header = node.querySelector('.node-header');
      if (header && !header.querySelector('.file-checkbox')) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'file-checkbox';
        checkbox.addEventListener('change', (e) => {
          this.handleFileSelection(e, node);
        });
        
        // 插入到节点图标前面
        const nodeIcon = header.querySelector('.node-icon');
        header.insertBefore(checkbox, nodeIcon);
      }
    });
  }

  // 移除文件节点的复选框
  removeCheckboxesFromFiles() {
    const checkboxes = document.querySelectorAll('.file-checkbox');
    checkboxes.forEach(checkbox => checkbox.remove());
  }

  // 处理文件选择
  handleFileSelection(event, fileNode) {
    const fileId = fileNode.getAttribute('data-file-id');
    const owner = fileNode.getAttribute('data-owner');
    
    if (!fileId || !owner) return;
    
    const fileKey = `${owner}/${fileId}`;
    
    if (event.target.checked) {
      this.selectedFiles.add(fileKey);
      fileNode.classList.add('selected');
    } else {
      this.selectedFiles.delete(fileKey);
      fileNode.classList.remove('selected');
    }
    
    this.updateSelectedCount();
  }

  // 更新选中文件数量显示
  updateSelectedCount() {
    const countElement = document.getElementById('selectedCount');
    if (countElement) {
      countElement.textContent = `已选择 ${this.selectedFiles.size} 个文件`;
    }
  }

  // 全选文件
  selectAll() {
    const checkboxes = document.querySelectorAll('.file-checkbox');
    checkboxes.forEach(checkbox => {
      if (!checkbox.checked) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
      }
    });
  }

  // 清除选择
  clearSelection() {
    this.selectedFiles.clear();
    const checkboxes = document.querySelectorAll('.file-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    const selectedNodes = document.querySelectorAll('.file-node.selected');
    selectedNodes.forEach(node => node.classList.remove('selected'));
    this.updateSelectedCount();
  }

  // 显示批量权限设置模态框
  showBatchPermissionsModal() {
    if (this.selectedFiles.size === 0) {
      this.showNotification('请先选择要修改权限的文件', 'warning');
      return;
    }

    this.createBatchPermissionsModal();
  }

  // 创建批量权限设置模态框
  createBatchPermissionsModal() {
    // 移除现有模态框
    const existingModal = document.getElementById('batchPermissionsModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'batchPermissionsModal';
    modal.className = 'modal batch-permissions-modal';
    modal.style.display = 'flex';
    modal.innerHTML = this.getBatchModalHTML();

    document.body.appendChild(modal);
    this.bindBatchModalEvents();
  }

  // 获取批量权限设置模态框HTML
  getBatchModalHTML() {
    return `
      <div class="modal-content batch-modal-content">
        <div class="modal-header">
          <h3>📋 批量权限设置</h3>
          <span class="close-btn" onclick="batchPermissionsManager.closeBatchModal()">&times;</span>
        </div>
        
        <div class="modal-body">
          <!-- 选中文件信息 -->
          <div class="selected-files-info">
            <h4>📄 选中的文件 (${this.selectedFiles.size} 个)</h4>
            <div class="selected-files-list" id="selectedFilesList">
              ${this.renderSelectedFilesList()}
            </div>
          </div>

          <!-- 权限设置选项 -->
          <div class="batch-permission-settings">
            <h4>🎯 权限设置</h4>
            
            <div class="permission-options">
              <div class="permission-option">
                <input type="radio" id="batch-level-public" name="batchPermissionLevel" value="public">
                <label for="batch-level-public" class="permission-label">
                  <div class="permission-icon">🌍</div>
                  <div class="permission-details">
                    <h5>公开</h5>
                    <p>所有人都可以查看，包括未登录用户</p>
                  </div>
                </label>
              </div>
              
              <div class="permission-option">
                <input type="radio" id="batch-level-visitor" name="batchPermissionLevel" value="visitor">
                <label for="batch-level-visitor" class="permission-label">
                  <div class="permission-icon">👤</div>
                  <div class="permission-details">
                    <h5>访客</h5>
                    <p>仅限已登录的访客级别及以上用户查看</p>
                  </div>
                </label>
              </div>
              
              <div class="permission-option">
                <input type="radio" id="batch-level-friend" name="batchPermissionLevel" value="friend">
                <label for="batch-level-friend" class="permission-label">
                  <div class="permission-icon">👥</div>
                  <div class="permission-details">
                    <h5>好友</h5>
                    <p>仅限好友级别及以上用户查看和评论</p>
                  </div>
                </label>
              </div>
              
              <div class="permission-option">
                <input type="radio" id="batch-level-custom" name="batchPermissionLevel" value="custom">
                <label for="batch-level-custom" class="permission-label">
                  <div class="permission-icon">⚙️</div>
                  <div class="permission-details">
                    <h5>自定义</h5>
                    <p>使用白名单和黑名单机制精确控制访问权限</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- 快速权限模板 -->
            <div class="permission-templates">
              <h5>🚀 快速模板</h5>
              <div class="template-buttons">
                <button class="btn btn-sm btn-outline-primary" onclick="batchPermissionsManager.applyTemplate('allPublic')">
                  全部公开
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="batchPermissionsManager.applyTemplate('allPrivate')">
                  全部私有
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="batchPermissionsManager.applyTemplate('friendsOnly')">
                  仅好友可见
                </button>
              </div>
            </div>

            <!-- 操作选项 -->
            <div class="batch-options">
              <h5>⚙️ 操作选项</h5>
              <label class="checkbox-option">
                <input type="checkbox" id="preserveCustomSettings">
                <span>保留现有的自定义权限设置</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" id="createBackup">
                <span>创建权限设置备份</span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="batch-reason">
            <label for="batchChangeReason">批量修改原因:</label>
            <input type="text" id="batchChangeReason" placeholder="可选：说明此次批量权限修改的原因">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="batchPermissionsManager.closeBatchModal()">取消</button>
            <button type="button" class="btn btn-primary" onclick="batchPermissionsManager.applyBatchPermissions()">应用权限设置</button>
          </div>
        </div>
      </div>
    `;
  }

  // 渲染选中文件列表
  renderSelectedFilesList() {
    const files = Array.from(this.selectedFiles).map(fileKey => {
      const [owner, fileId] = fileKey.split('/');
      const fileNode = document.querySelector(`[data-file-id="${fileId}"][data-owner="${owner}"]`);
      const title = fileNode ? fileNode.querySelector('.node-title').textContent : fileId;
      return { owner, fileId, title };
    });

    return files.map(file => `
      <div class="selected-file-item">
        <span class="file-title">${file.title}</span>
        <span class="file-owner">by ${file.owner}</span>
      </div>
    `).join('');
  }

  // 应用权限模板
  applyTemplate(templateName) {
    const templates = {
      allPublic: 'public',
      allPrivate: 'private',
      friendsOnly: 'friend'
    };

    const level = templates[templateName];
    if (level) {
      const radio = document.querySelector(`input[name="batchPermissionLevel"][value="${level}"]`);
      if (radio) {
        radio.checked = true;
      }
    }
  }

  // 应用批量权限设置
  async applyBatchPermissions() {
    try {
      const selectedLevel = document.querySelector('input[name="batchPermissionLevel"]:checked');
      if (!selectedLevel) {
        this.showNotification('请选择权限级别', 'warning');
        return;
      }

      const level = selectedLevel.value;
      const reason = document.getElementById('batchChangeReason').value.trim();
      const preserveCustom = document.getElementById('preserveCustomSettings').checked;
      const createBackup = document.getElementById('createBackup').checked;

      // 显示进度
      this.showBatchProgress();

      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      // 批量处理文件
      for (const fileKey of this.selectedFiles) {
        try {
          const [owner, fileId] = fileKey.split('/');
          
          // 如果需要保留自定义设置且当前是自定义权限，则跳过
          if (preserveCustom) {
            const currentPermissions = await window.filePermissionsSystem.getFilePermissions(fileId, owner);
            if (currentPermissions?.level === 'custom' && level !== 'custom') {
              continue;
            }
          }

          // 创建新权限设置
          const newPermissions = window.filePermissionsSystem.createPermissionStructure(level);
          
          // 更新权限
          const result = await window.filePermissionsSystem.updatePermissions(
            fileId,
            owner,
            newPermissions,
            reason || `批量权限修改: ${level}`
          );

          if (result.success) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(`${fileId}: ${result.message}`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`${fileKey}: ${error.message}`);
        }
      }

      // 隐藏进度，显示结果
      this.hideBatchProgress();
      this.showBatchResults(results);

      // 刷新文件层级显示
      if (window.fileHierarchyManager) {
        setTimeout(() => {
          window.fileHierarchyManager.refreshHierarchy();
        }, 1000);
      }

    } catch (error) {
      console.error('批量权限设置失败:', error);
      this.showNotification('批量权限设置失败', 'error');
      this.hideBatchProgress();
    }
  }

  // 显示批量处理进度
  showBatchProgress() {
    const modal = document.getElementById('batchPermissionsModal');
    const overlay = document.createElement('div');
    overlay.id = 'batchProgressOverlay';
    overlay.className = 'batch-progress-overlay';
    overlay.innerHTML = `
      <div class="progress-content">
        <div class="progress-spinner"></div>
        <h4>正在批量设置权限...</h4>
        <p>请稍候，正在处理 ${this.selectedFiles.size} 个文件</p>
      </div>
    `;
    modal.appendChild(overlay);
  }

  // 隐藏批量处理进度
  hideBatchProgress() {
    const overlay = document.getElementById('batchProgressOverlay');
    if (overlay) {
      overlay.remove();
    }
  }

  // 显示批量处理结果
  showBatchResults(results) {
    const message = `
      批量权限设置完成！
      成功: ${results.success} 个文件
      失败: ${results.failed} 个文件
      ${results.errors.length > 0 ? '\n\n错误详情:\n' + results.errors.slice(0, 5).join('\n') : ''}
    `;
    
    const type = results.failed === 0 ? 'success' : 'warning';
    this.showNotification(message, type);
    
    if (results.success > 0) {
      this.closeBatchModal();
      this.toggleSelectionMode(); // 退出选择模式
    }
  }

  // 关闭批量权限设置模态框
  closeBatchModal() {
    const modal = document.getElementById('batchPermissionsModal');
    if (modal) {
      modal.remove();
    }
  }

  // 绑定批量模态框事件
  bindBatchModalEvents() {
    // 权限级别变化事件
    document.querySelectorAll('input[name="batchPermissionLevel"]').forEach(radio => {
      radio.addEventListener('change', () => {
        // 这里可以添加权限级别变化的处理逻辑
      });
    });
  }

  // 绑定事件
  bindEvents() {
    // 监听文件层级刷新事件
    document.addEventListener('hierarchyRefreshed', () => {
      if (this.isSelectionMode) {
        setTimeout(() => {
          this.addCheckboxesToFiles();
        }, 100);
      }
    });
  }

  // 显示通知
  showNotification(message, type = 'info') {
    if (typeof showNotification !== 'undefined') {
      showNotification(message, type);
    } else {
      alert(message);
    }
  }
}

// 添加批量权限管理样式
function addBatchPermissionsStyles() {
  if (document.getElementById('batchPermissionsStyles')) return;

  const style = document.createElement('style');
  style.id = 'batchPermissionsStyles';
  style.textContent = `
    /* 批量控制样式 */
    .batch-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .batch-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .selected-count {
      background: rgba(255, 255, 255, 0.3);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
      color: white;
    }

    /* 选择模式样式 */
    .batch-selection-mode .file-node {
      cursor: pointer;
    }

    .batch-selection-mode .file-node:hover {
      background: rgba(0, 123, 255, 0.1);
    }

    .file-node.selected {
      background: rgba(0, 123, 255, 0.2);
      border-left-color: #007bff !important;
    }

    .file-checkbox {
      margin-right: 0.5rem;
      cursor: pointer;
    }

    /* 批量权限模态框样式 */
    .batch-permissions-modal {
      z-index: 10001;
    }

    .batch-modal-content {
      max-width: 900px;
      width: 95%;
      max-height: 90vh;
      overflow-y: auto;
    }

    /* 选中文件信息样式 */
    .selected-files-info {
      margin-bottom: 2rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .selected-files-list {
      max-height: 200px;
      overflow-y: auto;
      margin-top: 1rem;
    }

    .selected-file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      border-bottom: 1px solid #e9ecef;
    }

    .selected-file-item:last-child {
      border-bottom: none;
    }

    .file-title {
      font-weight: 500;
      color: #333;
    }

    .file-owner {
      font-size: 0.875rem;
      color: #6c757d;
    }

    /* 权限模板样式 */
    .permission-templates {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #e8f4fd;
      border-radius: 8px;
    }

    .template-buttons {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
    }

    .btn-outline-primary {
      border: 1px solid #007bff;
      color: #007bff;
      background: transparent;
    }

    .btn-outline-primary:hover {
      background: #007bff;
      color: white;
    }

    .btn-outline-secondary {
      border: 1px solid #6c757d;
      color: #6c757d;
      background: transparent;
    }

    .btn-outline-secondary:hover {
      background: #6c757d;
      color: white;
    }

    .btn-outline-success {
      border: 1px solid #28a745;
      color: #28a745;
      background: transparent;
    }

    .btn-outline-success:hover {
      background: #28a745;
      color: white;
    }

    /* 批量选项样式 */
    .batch-options {
      margin-top: 1.5rem;
      padding: 1rem;
      border: 1px solid #dee2e6;
      border-radius: 8px;
    }

    .batch-options h5 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    /* 批量原因输入样式 */
    .batch-reason {
      margin-bottom: 1rem;
    }

    .batch-reason label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .batch-reason input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #e9ecef;
      border-radius: 4px;
    }

    /* 批量进度覆盖层样式 */
    .batch-progress-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      border-radius: 16px;
    }

    .progress-content {
      text-align: center;
      padding: 2rem;
    }

    .progress-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem auto;
    }

    .progress-content h4 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .progress-content p {
      margin: 0;
      color: #6c757d;
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
      .batch-controls {
        flex-direction: column;
        align-items: stretch;
      }

      .batch-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .batch-actions .btn {
        width: 100%;
        text-align: center;
        margin-bottom: 0.25rem;
      }

      .template-buttons {
        flex-direction: column;
      }

      .template-buttons .btn {
        width: 100%;
      }

      .selected-file-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }
    }

    /* 滚动条样式 */
    .selected-files-list::-webkit-scrollbar {
      width: 6px;
    }

    .selected-files-list::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .selected-files-list::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .selected-files-list::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `;

  document.head.appendChild(style);
}

// 自动添加样式
addBatchPermissionsStyles();

// 创建全局实例
window.batchPermissionsManager = new BatchPermissionsManager();
