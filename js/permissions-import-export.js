// 权限配置导入导出系统
class PermissionsImportExport {
  constructor() {
    this.exportFormats = ['json', 'csv'];
    this.currentFormat = 'json';
  }

  // 初始化导入导出功能
  initialize() {
    this.addImportExportControls();
    console.log('✅ 权限导入导出系统已初始化');
  }

  // 添加导入导出控制按钮
  addImportExportControls() {
    setTimeout(() => {
      const hierarchyHeader = document.querySelector('.hierarchy-header');
      if (hierarchyHeader) {
        this.insertImportExportButtons(hierarchyHeader);
      }
    }, 1000);
  }

  // 插入导入导出按钮
  insertImportExportButtons(hierarchyHeader) {
    const controlsContainer = hierarchyHeader.querySelector('.hierarchy-controls');
    if (!controlsContainer) return;

    const importExportControls = document.createElement('div');
    importExportControls.className = 'import-export-controls';
    importExportControls.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-sm btn-success dropdown-toggle" onclick="permissionsImportExport.toggleDropdown('exportDropdown')">
          📤 导出权限
        </button>
        <div class="dropdown-menu" id="exportDropdown">
          <a class="dropdown-item" onclick="permissionsImportExport.exportPermissions('json')">导出为 JSON</a>
          <a class="dropdown-item" onclick="permissionsImportExport.exportPermissions('csv')">导出为 CSV</a>
          <a class="dropdown-item" onclick="permissionsImportExport.exportPermissions('backup')">创建完整备份</a>
        </div>
      </div>
      <button class="btn btn-sm btn-info" onclick="permissionsImportExport.showImportModal()">
        📥 导入权限
      </button>
    `;

    controlsContainer.appendChild(importExportControls);
  }

  // 切换下拉菜单
  toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        dropdown.style.display = 'none';
      }
    }, { once: true });
  }

  // 导出权限配置
  async exportPermissions(format = 'json') {
    try {
      this.showExportProgress();
      
      const permissionsData = await this.collectAllPermissions();
      
      let exportData;
      let filename;
      let mimeType;

      switch (format) {
        case 'json':
          exportData = JSON.stringify(permissionsData, null, 2);
          filename = `permissions_export_${this.getTimestamp()}.json`;
          mimeType = 'application/json';
          break;
        
        case 'csv':
          exportData = this.convertToCSV(permissionsData);
          filename = `permissions_export_${this.getTimestamp()}.csv`;
          mimeType = 'text/csv';
          break;
        
        case 'backup':
          exportData = JSON.stringify({
            metadata: {
              exportDate: new Date().toISOString(),
              exportedBy: auth.currentUser ? auth.currentUser.username : 'anonymous',
              version: '1.0',
              totalFiles: permissionsData.files.length
            },
            permissions: permissionsData
          }, null, 2);
          filename = `permissions_backup_${this.getTimestamp()}.json`;
          mimeType = 'application/json';
          break;
        
        default:
          throw new Error('不支持的导出格式');
      }

      this.downloadFile(exportData, filename, mimeType);
      this.hideExportProgress();
      this.showNotification(`权限配置已导出为 ${format.toUpperCase()} 格式`, 'success');
      
    } catch (error) {
      console.error('导出权限配置失败:', error);
      this.hideExportProgress();
      this.showNotification('导出失败: ' + error.message, 'error');
    }
  }

  // 收集所有权限配置
  async collectAllPermissions() {
    const permissions = {
      exportInfo: {
        date: new Date().toISOString(),
        exportedBy: auth.currentUser ? auth.currentUser.username : 'anonymous',
        totalFiles: 0
      },
      files: []
    };

    try {
      // 获取所有用户
      const users = await auth.getAllUsers();
      
      for (const user of users) {
        const username = typeof user === 'string' ? user : user.username;
        
        // 获取用户的所有文件
        const userFiles = await this.getUserFiles(username);
        
        for (const file of userFiles) {
          const filePermissions = await window.filePermissionsSystem.getFilePermissions(
            file.fileId, 
            username
          );
          
          if (filePermissions) {
            permissions.files.push({
              fileId: file.fileId,
              owner: username,
              title: file.title || file.originalName || '未命名文件',
              category: file.mainCategory || 'other',
              subcategory: file.subCategory || 'default',
              permissions: filePermissions
            });
          }
        }
      }
      
      permissions.exportInfo.totalFiles = permissions.files.length;
      return permissions;
      
    } catch (error) {
      console.error('收集权限配置失败:', error);
      throw error;
    }
  }

  // 获取用户文件（简化版本）
  async getUserFiles(username) {
    const files = [];
    
    try {
      // 从Firebase获取
      if (window.firebaseAvailable && firebase.apps.length) {
        const snapshot = await firebase.database().ref(`userFiles/${username}`).once('value');
        const userFiles = snapshot.val() || {};
        
        for (const [fileId, fileInfo] of Object.entries(userFiles)) {
          files.push({
            ...fileInfo,
            fileId: fileId,
            owner: username
          });
        }
      }
      
      // 从本地存储获取
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('work_')) {
          const workData = localStorage.getItem(key);
          if (workData) {
            const work = JSON.parse(workData);
            if (work.uploadedBy === username || work.author === username) {
              files.push({
                ...work,
                fileId: key.replace('work_', ''),
                owner: username
              });
            }
          }
        }
      }
      
      return files;
    } catch (error) {
      console.error(`获取用户 ${username} 的文件失败:`, error);
      return [];
    }
  }

  // 转换为CSV格式
  convertToCSV(permissionsData) {
    const headers = [
      'File ID',
      'Owner',
      'Title',
      'Category',
      'Subcategory',
      'Permission Level',
      'Is Public',
      'Required Role',
      'Whitelist Enabled',
      'Whitelist Users',
      'Whitelist Roles',
      'Blacklist Enabled',
      'Blacklist Users',
      'Blacklist Roles',
      'Allow Anonymous',
      'Allow Comments',
      'Allow Download',
      'Allow Share',
      'Expiry Date',
      'Max Views',
      'Created By',
      'Created At',
      'Last Modified By',
      'Last Modified At'
    ];

    const rows = [headers.join(',')];

    for (const file of permissionsData.files) {
      const p = file.permissions;
      const custom = p.customAccess || {};
      const special = custom.specialPermissions || {};
      const whitelist = custom.whitelist || {};
      const blacklist = custom.blacklist || {};

      const row = [
        this.escapeCSV(file.fileId),
        this.escapeCSV(file.owner),
        this.escapeCSV(file.title),
        this.escapeCSV(file.category),
        this.escapeCSV(file.subcategory),
        this.escapeCSV(p.level),
        p.isPublic ? 'Yes' : 'No',
        this.escapeCSV(p.requiredRole || ''),
        whitelist.enabled ? 'Yes' : 'No',
        this.escapeCSV((whitelist.users || []).join(';')),
        this.escapeCSV((whitelist.roles || []).join(';')),
        blacklist.enabled ? 'Yes' : 'No',
        this.escapeCSV((blacklist.users || []).join(';')),
        this.escapeCSV((blacklist.roles || []).join(';')),
        special.allowAnonymous ? 'Yes' : 'No',
        special.allowComments !== false ? 'Yes' : 'No',
        special.allowDownload !== false ? 'Yes' : 'No',
        special.allowShare !== false ? 'Yes' : 'No',
        this.escapeCSV(special.expiryDate || ''),
        special.maxViews || '',
        this.escapeCSV(p.metadata?.createdBy || ''),
        this.escapeCSV(p.metadata?.createdAt || ''),
        this.escapeCSV(p.metadata?.lastModifiedBy || ''),
        this.escapeCSV(p.metadata?.lastModifiedAt || '')
      ];

      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  // CSV字段转义
  escapeCSV(field) {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  // 显示导入模态框
  showImportModal() {
    this.createImportModal();
  }

  // 创建导入模态框
  createImportModal() {
    const existingModal = document.getElementById('importPermissionsModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'importPermissionsModal';
    modal.className = 'modal import-permissions-modal';
    modal.style.display = 'flex';
    modal.innerHTML = this.getImportModalHTML();

    document.body.appendChild(modal);
    this.bindImportModalEvents();
  }

  // 获取导入模态框HTML
  getImportModalHTML() {
    return `
      <div class="modal-content import-modal-content">
        <div class="modal-header">
          <h3>📥 导入权限配置</h3>
          <span class="close-btn" onclick="permissionsImportExport.closeImportModal()">&times;</span>
        </div>
        
        <div class="modal-body">
          <!-- 文件选择 -->
          <div class="file-upload-section">
            <h4>📁 选择配置文件</h4>
            <div class="file-input-container">
              <input type="file" id="importFileInput" accept=".json,.csv" class="file-input">
              <label for="importFileInput" class="file-input-label">
                <span class="file-icon">📄</span>
                <span class="file-text">点击选择文件或拖拽文件到此处</span>
              </label>
            </div>
            <div class="file-info" id="fileInfo" style="display: none;">
              <span class="file-name" id="fileName"></span>
              <span class="file-size" id="fileSize"></span>
            </div>
          </div>

          <!-- 导入选项 -->
          <div class="import-options">
            <h4>⚙️ 导入选项</h4>
            <div class="option-group">
              <label class="checkbox-option">
                <input type="checkbox" id="overwriteExisting" checked>
                <span>覆盖现有权限设置</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" id="createBackupBeforeImport" checked>
                <span>导入前创建备份</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" id="validatePermissions" checked>
                <span>验证权限配置有效性</span>
              </label>
              <label class="checkbox-option">
                <input type="checkbox" id="skipInvalidEntries">
                <span>跳过无效条目</span>
              </label>
            </div>
          </div>

          <!-- 预览区域 -->
          <div class="import-preview" id="importPreview" style="display: none;">
            <h4>👁️ 导入预览</h4>
            <div class="preview-stats" id="previewStats"></div>
            <div class="preview-content" id="previewContent"></div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="permissionsImportExport.closeImportModal()">取消</button>
            <button type="button" class="btn btn-primary" id="importButton" onclick="permissionsImportExport.importPermissions()" disabled>导入权限</button>
          </div>
        </div>
      </div>
    `;
  }

  // 绑定导入模态框事件
  bindImportModalEvents() {
    const fileInput = document.getElementById('importFileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const importButton = document.getElementById('importButton');

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);
        fileInfo.style.display = 'block';
        importButton.disabled = false;
        
        // 预览文件内容
        this.previewImportFile(file);
      } else {
        fileInfo.style.display = 'none';
        importButton.disabled = true;
        document.getElementById('importPreview').style.display = 'none';
      }
    });

    // 拖拽支持
    const fileInputLabel = document.querySelector('.file-input-label');
    
    fileInputLabel.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileInputLabel.classList.add('drag-over');
    });

    fileInputLabel.addEventListener('dragleave', () => {
      fileInputLabel.classList.remove('drag-over');
    });

    fileInputLabel.addEventListener('drop', (e) => {
      e.preventDefault();
      fileInputLabel.classList.remove('drag-over');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        fileInput.dispatchEvent(new Event('change'));
      }
    });
  }

  // 预览导入文件
  async previewImportFile(file) {
    try {
      const content = await this.readFileContent(file);
      let data;

      if (file.name.endsWith('.json')) {
        data = JSON.parse(content);
      } else if (file.name.endsWith('.csv')) {
        data = this.parseCSV(content);
      } else {
        throw new Error('不支持的文件格式');
      }

      this.displayImportPreview(data);
    } catch (error) {
      console.error('预览文件失败:', error);
      this.showNotification('文件格式错误: ' + error.message, 'error');
    }
  }

  // 读取文件内容
  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }

  // 解析CSV文件
  parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const files = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = this.parseCSVLine(lines[i]);
        const fileData = {};
        
        headers.forEach((header, index) => {
          fileData[header.trim()] = values[index] || '';
        });
        
        files.push(fileData);
      }
    }

    return { files };
  }

  // 解析CSV行
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  // 显示导入预览
  displayImportPreview(data) {
    const previewSection = document.getElementById('importPreview');
    const previewStats = document.getElementById('previewStats');
    const previewContent = document.getElementById('previewContent');

    const files = data.files || [];
    
    previewStats.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">文件数量:</span>
          <span class="stat-value">${files.length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">导出时间:</span>
          <span class="stat-value">${data.exportInfo?.date || data.metadata?.exportDate || '未知'}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">导出者:</span>
          <span class="stat-value">${data.exportInfo?.exportedBy || data.metadata?.exportedBy || '未知'}</span>
        </div>
      </div>
    `;

    previewContent.innerHTML = `
      <div class="preview-list">
        ${files.slice(0, 10).map(file => `
          <div class="preview-item">
            <span class="file-title">${file.title || file.Title || file.fileId || file['File ID']}</span>
            <span class="file-owner">${file.owner || file.Owner}</span>
            <span class="permission-level">${file.permissions?.level || file['Permission Level']}</span>
          </div>
        `).join('')}
        ${files.length > 10 ? `<div class="preview-more">... 还有 ${files.length - 10} 个文件</div>` : ''}
      </div>
    `;

    previewSection.style.display = 'block';
  }

  // 导入权限配置
  async importPermissions() {
    try {
      const fileInput = document.getElementById('importFileInput');
      const file = fileInput.files[0];
      
      if (!file) {
        this.showNotification('请选择要导入的文件', 'warning');
        return;
      }

      const options = {
        overwriteExisting: document.getElementById('overwriteExisting').checked,
        createBackup: document.getElementById('createBackupBeforeImport').checked,
        validatePermissions: document.getElementById('validatePermissions').checked,
        skipInvalidEntries: document.getElementById('skipInvalidEntries').checked
      };

      this.showImportProgress();

      // 如果需要创建备份
      if (options.createBackup) {
        await this.exportPermissions('backup');
      }

      const content = await this.readFileContent(file);
      let data;

      if (file.name.endsWith('.json')) {
        data = JSON.parse(content);
      } else if (file.name.endsWith('.csv')) {
        data = this.parseCSV(content);
      } else {
        throw new Error('不支持的文件格式');
      }

      const result = await this.processImportData(data, options);
      
      this.hideImportProgress();
      this.showImportResults(result);

      if (result.success > 0) {
        this.closeImportModal();
        
        // 刷新文件层级显示
        if (window.fileHierarchyManager) {
          setTimeout(() => {
            window.fileHierarchyManager.refreshHierarchy();
          }, 1000);
        }
      }

    } catch (error) {
      console.error('导入权限配置失败:', error);
      this.hideImportProgress();
      this.showNotification('导入失败: ' + error.message, 'error');
    }
  }

  // 处理导入数据
  async processImportData(data, options) {
    const files = data.files || [];
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    for (const fileData of files) {
      try {
        // 验证数据有效性
        if (options.validatePermissions && !this.validateFileData(fileData)) {
          if (options.skipInvalidEntries) {
            results.skipped++;
            continue;
          } else {
            throw new Error('无效的文件数据');
          }
        }

        // 转换数据格式
        const permissionsData = this.convertImportDataToPermissions(fileData);
        
        // 检查是否覆盖现有权限
        if (!options.overwriteExisting) {
          const existing = await window.filePermissionsSystem.getFilePermissions(
            fileData.fileId || fileData['File ID'],
            fileData.owner || fileData.Owner
          );
          
          if (existing) {
            results.skipped++;
            continue;
          }
        }

        // 保存权限设置
        const result = await window.filePermissionsSystem.updatePermissions(
          fileData.fileId || fileData['File ID'],
          fileData.owner || fileData.Owner,
          permissionsData,
          '权限配置导入'
        );

        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`${fileData.fileId}: ${result.message}`);
        }

      } catch (error) {
        results.failed++;
        results.errors.push(`${fileData.fileId || fileData['File ID']}: ${error.message}`);
      }
    }

    return results;
  }

  // 验证文件数据
  validateFileData(fileData) {
    const requiredFields = ['fileId', 'owner'];
    
    // 检查必需字段
    for (const field of requiredFields) {
      if (!fileData[field] && !fileData[field.charAt(0).toUpperCase() + field.slice(1)]) {
        return false;
      }
    }

    return true;
  }

  // 转换导入数据为权限格式
  convertImportDataToPermissions(fileData) {
    // 如果已经是完整的权限格式
    if (fileData.permissions) {
      return fileData.permissions;
    }

    // 从CSV格式转换
    const level = fileData['Permission Level'] || 'public';
    const customSettings = {};

    if (level === 'custom') {
      customSettings.whitelistEnabled = fileData['Whitelist Enabled'] === 'Yes';
      customSettings.whitelistUsers = (fileData['Whitelist Users'] || '').split(';').filter(u => u.trim());
      customSettings.whitelistRoles = (fileData['Whitelist Roles'] || '').split(';').filter(r => r.trim());
      
      customSettings.blacklistEnabled = fileData['Blacklist Enabled'] === 'Yes';
      customSettings.blacklistUsers = (fileData['Blacklist Users'] || '').split(';').filter(u => u.trim());
      customSettings.blacklistRoles = (fileData['Blacklist Roles'] || '').split(';').filter(r => r.trim());
      
      customSettings.allowAnonymous = fileData['Allow Anonymous'] === 'Yes';
      customSettings.allowComments = fileData['Allow Comments'] !== 'No';
      customSettings.allowDownload = fileData['Allow Download'] !== 'No';
      customSettings.allowShare = fileData['Allow Share'] !== 'No';
      customSettings.expiryDate = fileData['Expiry Date'] || null;
      customSettings.maxViews = parseInt(fileData['Max Views']) || null;
    }

    return window.filePermissionsSystem.createPermissionStructure(level, customSettings);
  }

  // 显示导入结果
  showImportResults(results) {
    const message = `
      权限配置导入完成！
      成功: ${results.success} 个文件
      失败: ${results.failed} 个文件
      跳过: ${results.skipped} 个文件
      ${results.errors.length > 0 ? '\n\n错误详情:\n' + results.errors.slice(0, 5).join('\n') : ''}
    `;
    
    const type = results.failed === 0 ? 'success' : 'warning';
    this.showNotification(message, type);
  }

  // 关闭导入模态框
  closeImportModal() {
    const modal = document.getElementById('importPermissionsModal');
    if (modal) {
      modal.remove();
    }
  }

  // 显示导出进度
  showExportProgress() {
    // 可以添加进度指示器
    console.log('正在导出权限配置...');
  }

  // 隐藏导出进度
  hideExportProgress() {
    console.log('导出完成');
  }

  // 显示导入进度
  showImportProgress() {
    const modal = document.getElementById('importPermissionsModal');
    const overlay = document.createElement('div');
    overlay.id = 'importProgressOverlay';
    overlay.className = 'import-progress-overlay';
    overlay.innerHTML = `
      <div class="progress-content">
        <div class="progress-spinner"></div>
        <h4>正在导入权限配置...</h4>
        <p>请稍候，正在处理配置文件</p>
      </div>
    `;
    modal.appendChild(overlay);
  }

  // 隐藏导入进度
  hideImportProgress() {
    const overlay = document.getElementById('importProgressOverlay');
    if (overlay) {
      overlay.remove();
    }
  }

  // 下载文件
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  // 获取时间戳
  getTimestamp() {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
  }

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

// 添加导入导出样式
function addImportExportStyles() {
  if (document.getElementById('importExportStyles')) return;

  const style = document.createElement('style');
  style.id = 'importExportStyles';
  style.textContent = `
    /* 导入导出控制样式 */
    .import-export-controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .dropdown {
      position: relative;
      display: inline-block;
    }

    .dropdown-toggle {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .dropdown-toggle:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .dropdown-menu {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      min-width: 150px;
    }

    .dropdown-item {
      display: block;
      padding: 0.5rem 1rem;
      color: #333;
      text-decoration: none;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .dropdown-item:hover {
      background: #f8f9fa;
      color: #007bff;
    }

    /* 导入模态框样式 */
    .import-permissions-modal {
      z-index: 10002;
    }

    .import-modal-content {
      max-width: 700px;
      width: 95%;
      max-height: 90vh;
      overflow-y: auto;
    }

    /* 文件上传区域样式 */
    .file-upload-section {
      margin-bottom: 2rem;
    }

    .file-input-container {
      position: relative;
      margin-top: 1rem;
    }

    .file-input {
      position: absolute;
      opacity: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }

    .file-input-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      background: #f8f9fa;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .file-input-label:hover,
    .file-input-label.drag-over {
      border-color: #007bff;
      background: #e8f4fd;
    }

    .file-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      color: #6c757d;
    }

    .file-text {
      color: #6c757d;
      font-weight: 500;
    }

    .file-info {
      margin-top: 1rem;
      padding: 1rem;
      background: #e8f4fd;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .file-name {
      font-weight: 500;
      color: #333;
    }

    .file-size {
      color: #6c757d;
      font-size: 0.875rem;
    }

    /* 导入选项样式 */
    .import-options {
      margin-bottom: 2rem;
      padding: 1rem;
      border: 1px solid #dee2e6;
      border-radius: 8px;
    }

    .option-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    /* 导入预览样式 */
    .import-preview {
      margin-bottom: 2rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .preview-stats {
      margin-bottom: 1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6c757d;
      font-weight: 500;
    }

    .stat-value {
      font-weight: 600;
      color: #333;
    }

    .preview-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      background: white;
    }

    .preview-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1rem;
      border-bottom: 1px solid #f8f9fa;
    }

    .preview-item:last-child {
      border-bottom: none;
    }

    .preview-more {
      padding: 0.5rem 1rem;
      text-align: center;
      color: #6c757d;
      font-style: italic;
      background: #f8f9fa;
    }

    .file-title {
      font-weight: 500;
      color: #333;
      flex: 1;
    }

    .file-owner {
      color: #6c757d;
      font-size: 0.875rem;
      margin: 0 1rem;
    }

    .permission-level {
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
      background: #6c757d;
    }

    /* 进度覆盖层样式 */
    .import-progress-overlay {
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
      .import-export-controls {
        flex-direction: column;
        align-items: stretch;
        gap: 0.25rem;
      }

      .dropdown-toggle,
      .import-export-controls .btn {
        width: 100%;
        text-align: center;
      }

      .dropdown-menu {
        position: static;
        display: block;
        box-shadow: none;
        border: none;
        background: transparent;
        margin-top: 0.25rem;
      }

      .dropdown-item {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        margin-bottom: 0.25rem;
        border-radius: 4px;
      }

      .dropdown-item:hover {
        background: rgba(255, 255, 255, 0.3);
        color: white;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .preview-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .file-owner {
        margin: 0;
      }
    }

    /* 滚动条样式 */
    .preview-list::-webkit-scrollbar {
      width: 6px;
    }

    .preview-list::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .preview-list::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .preview-list::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `;

  document.head.appendChild(style);
}

// 自动添加样式
addImportExportStyles();

// 创建全局实例
window.permissionsImportExport = new PermissionsImportExport();
