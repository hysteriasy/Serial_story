// 登录记录管理器
class LoginRecordsManager {
  constructor() {
    this.maxRecords = 1000; // 最大记录数
    this.currentPage = 1;
    this.pageSize = 20;
    this.filters = {
      username: '',
      startDate: '',
      endDate: '',
      status: 'all'
    };
  }

  // 记录登录信息
  recordLogin(username, success = true, additionalInfo = {}) {
    try {
      const record = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        username: username,
        timestamp: new Date().toISOString(),
        success: success,
        ip: this.getClientIP(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        ...additionalInfo
      };

      // 获取现有记录
      const records = this.getLoginRecords();
      
      // 添加新记录到开头
      records.unshift(record);
      
      // 限制记录数量
      if (records.length > this.maxRecords) {
        records.splice(this.maxRecords);
      }
      
      // 保存记录
      localStorage.setItem('loginRecords', JSON.stringify(records));
      
      console.log('✅ 登录记录已保存:', record);
      return record;
      
    } catch (error) {
      console.error('记录登录信息失败:', error);
      return null;
    }
  }

  // 获取登录记录
  getLoginRecords() {
    try {
      const records = localStorage.getItem('loginRecords');
      return records ? JSON.parse(records) : [];
    } catch (error) {
      console.error('获取登录记录失败:', error);
      return [];
    }
  }

  // 获取过滤后的记录
  getFilteredRecords() {
    const allRecords = this.getLoginRecords();
    
    return allRecords.filter(record => {
      // 用户名过滤
      if (this.filters.username && 
          !record.username.toLowerCase().includes(this.filters.username.toLowerCase())) {
        return false;
      }
      
      // 日期范围过滤
      if (this.filters.startDate) {
        const recordDate = new Date(record.timestamp);
        const startDate = new Date(this.filters.startDate);
        if (recordDate < startDate) return false;
      }
      
      if (this.filters.endDate) {
        const recordDate = new Date(record.timestamp);
        const endDate = new Date(this.filters.endDate);
        endDate.setHours(23, 59, 59, 999); // 包含整天
        if (recordDate > endDate) return false;
      }
      
      // 状态过滤
      if (this.filters.status !== 'all') {
        const success = this.filters.status === 'success';
        if (record.success !== success) return false;
      }
      
      return true;
    });
  }

  // 获取分页记录
  getPaginatedRecords() {
    const filteredRecords = this.getFilteredRecords();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    
    return {
      records: filteredRecords.slice(startIndex, endIndex),
      total: filteredRecords.length,
      totalPages: Math.ceil(filteredRecords.length / this.pageSize),
      currentPage: this.currentPage,
      pageSize: this.pageSize
    };
  }

  // 显示登录记录模态框
  showLoginRecordsModal() {
    // 检查管理员权限
    if (!auth.isAdmin || !auth.isAdmin()) {
      this.showNotification('只有管理员可以查看登录记录', 'error');
      return;
    }

    this.createLoginRecordsModal();
  }

  // 创建登录记录模态框
  createLoginRecordsModal() {
    // 移除现有模态框
    const existingModal = document.getElementById('loginRecordsModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'loginRecordsModal';
    modal.className = 'modal login-records-modal';
    modal.style.display = 'flex';
    modal.innerHTML = this.getLoginRecordsModalHTML();

    document.body.appendChild(modal);
    this.bindLoginRecordsModalEvents();
    this.loadRecords();
  }

  // 获取登录记录模态框HTML
  getLoginRecordsModalHTML() {
    return `
      <div class="modal-content login-records-content">
        <div class="modal-header">
          <h3>📋 用户登录记录</h3>
          <span class="close-btn" onclick="loginRecordsManager.closeModal()">&times;</span>
        </div>
        
        <div class="modal-body">
          <!-- 过滤器 -->
          <div class="records-filters">
            <div class="filter-row">
              <div class="filter-group">
                <label for="usernameFilter">用户名:</label>
                <input type="text" id="usernameFilter" placeholder="搜索用户名">
              </div>
              <div class="filter-group">
                <label for="startDateFilter">开始日期:</label>
                <input type="date" id="startDateFilter">
              </div>
              <div class="filter-group">
                <label for="endDateFilter">结束日期:</label>
                <input type="date" id="endDateFilter">
              </div>
              <div class="filter-group">
                <label for="statusFilter">状态:</label>
                <select id="statusFilter">
                  <option value="all">全部</option>
                  <option value="success">成功</option>
                  <option value="failed">失败</option>
                </select>
              </div>
              <div class="filter-actions">
                <button class="btn btn-sm btn-primary" onclick="loginRecordsManager.applyFilters()">筛选</button>
                <button class="btn btn-sm btn-secondary" onclick="loginRecordsManager.clearFilters()">清除</button>
              </div>
            </div>
          </div>

          <!-- 统计信息 -->
          <div class="records-stats" id="recordsStats">
            <!-- 统计信息将在这里显示 -->
          </div>

          <!-- 记录列表 -->
          <div class="records-table-container">
            <table class="records-table">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>登录时间</th>
                  <th>状态</th>
                  <th>IP地址</th>
                  <th>设备信息</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody id="recordsTableBody">
                <!-- 记录将在这里显示 -->
              </tbody>
            </table>
          </div>

          <!-- 分页控件 -->
          <div class="records-pagination" id="recordsPagination">
            <!-- 分页控件将在这里显示 -->
          </div>
        </div>

        <div class="modal-footer">
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="loginRecordsManager.exportRecords()">导出记录</button>
            <button type="button" class="btn btn-warning" onclick="loginRecordsManager.clearAllRecords()">清空记录</button>
            <button type="button" class="btn btn-primary" onclick="loginRecordsManager.closeModal()">关闭</button>
          </div>
        </div>
      </div>
    `;
  }

  // 加载记录
  loadRecords() {
    const paginatedData = this.getPaginatedRecords();
    
    // 更新统计信息
    this.updateStatsDisplay(paginatedData);
    
    // 更新记录表格
    this.updateRecordsTable(paginatedData.records);
    
    // 更新分页控件
    this.updatePagination(paginatedData);
  }

  // 更新统计信息显示
  updateStatsDisplay(paginatedData) {
    const statsContainer = document.getElementById('recordsStats');
    if (!statsContainer) return;

    const allRecords = this.getFilteredRecords();
    const successCount = allRecords.filter(r => r.success).length;
    const failedCount = allRecords.filter(r => !r.success).length;
    const uniqueUsers = new Set(allRecords.map(r => r.username)).size;

    statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${allRecords.length}</div>
          <div class="stat-label">总记录数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${successCount}</div>
          <div class="stat-label">成功登录</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${failedCount}</div>
          <div class="stat-label">失败登录</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${uniqueUsers}</div>
          <div class="stat-label">用户数</div>
        </div>
      </div>
    `;
  }

  // 更新记录表格
  updateRecordsTable(records) {
    const tableBody = document.getElementById('recordsTableBody');
    if (!tableBody) return;

    if (records.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: #6c757d;">
            没有找到符合条件的登录记录
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = records.map(record => `
      <tr class="record-row ${record.success ? 'success' : 'failed'}">
        <td class="username-cell">
          <span class="username">${record.username}</span>
        </td>
        <td class="timestamp-cell">
          <span class="date">${this.formatDate(record.timestamp)}</span>
          <span class="time">${this.formatTime(record.timestamp)}</span>
        </td>
        <td class="status-cell">
          <span class="status-badge ${record.success ? 'success' : 'failed'}">
            ${record.success ? '✅ 成功' : '❌ 失败'}
          </span>
        </td>
        <td class="ip-cell">
          <span class="ip">${record.ip || '未知'}</span>
        </td>
        <td class="device-cell">
          <div class="device-info">
            <div class="platform">${record.platform || '未知平台'}</div>
            <div class="resolution">${record.screenResolution || '未知分辨率'}</div>
          </div>
        </td>
        <td class="actions-cell">
          <button class="btn btn-xs btn-info" onclick="loginRecordsManager.showRecordDetails('${record.id}')" title="查看详情">
            详情
          </button>
        </td>
      </tr>
    `).join('');
  }

  // 更新分页控件
  updatePagination(paginatedData) {
    const paginationContainer = document.getElementById('recordsPagination');
    if (!paginationContainer) return;

    const { totalPages, currentPage, total } = paginatedData;

    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let paginationHTML = `
      <div class="pagination-info">
        显示第 ${(currentPage - 1) * this.pageSize + 1} - ${Math.min(currentPage * this.pageSize, total)} 条，共 ${total} 条记录
      </div>
      <div class="pagination-controls">
    `;

    // 上一页按钮
    if (currentPage > 1) {
      paginationHTML += `<button class="btn btn-sm btn-secondary" onclick="loginRecordsManager.goToPage(${currentPage - 1})">上一页</button>`;
    }

    // 页码按钮
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      paginationHTML += `<button class="btn btn-sm btn-secondary" onclick="loginRecordsManager.goToPage(1)">1</button>`;
      if (startPage > 2) {
        paginationHTML += `<span class="pagination-ellipsis">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === currentPage;
      paginationHTML += `<button class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}" onclick="loginRecordsManager.goToPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `<span class="pagination-ellipsis">...</span>`;
      }
      paginationHTML += `<button class="btn btn-sm btn-secondary" onclick="loginRecordsManager.goToPage(${totalPages})">${totalPages}</button>`;
    }

    // 下一页按钮
    if (currentPage < totalPages) {
      paginationHTML += `<button class="btn btn-sm btn-secondary" onclick="loginRecordsManager.goToPage(${currentPage + 1})">下一页</button>`;
    }

    paginationHTML += `</div>`;
    paginationContainer.innerHTML = paginationHTML;
  }

  // 应用过滤器
  applyFilters() {
    this.filters.username = document.getElementById('usernameFilter').value.trim();
    this.filters.startDate = document.getElementById('startDateFilter').value;
    this.filters.endDate = document.getElementById('endDateFilter').value;
    this.filters.status = document.getElementById('statusFilter').value;
    
    this.currentPage = 1; // 重置到第一页
    this.loadRecords();
  }

  // 清除过滤器
  clearFilters() {
    this.filters = {
      username: '',
      startDate: '',
      endDate: '',
      status: 'all'
    };
    
    document.getElementById('usernameFilter').value = '';
    document.getElementById('startDateFilter').value = '';
    document.getElementById('endDateFilter').value = '';
    document.getElementById('statusFilter').value = 'all';
    
    this.currentPage = 1;
    this.loadRecords();
  }

  // 跳转到指定页面
  goToPage(page) {
    this.currentPage = page;
    this.loadRecords();
  }

  // 显示记录详情
  showRecordDetails(recordId) {
    const records = this.getLoginRecords();
    const record = records.find(r => r.id === recordId);
    
    if (!record) {
      this.showNotification('记录不存在', 'error');
      return;
    }

    const detailsHTML = `
      登录记录详情：
      
      用户名: ${record.username}
      登录时间: ${this.formatDateTime(record.timestamp)}
      登录状态: ${record.success ? '成功' : '失败'}
      IP地址: ${record.ip || '未知'}
      用户代理: ${record.userAgent || '未知'}
      平台: ${record.platform || '未知'}
      语言: ${record.language || '未知'}
      屏幕分辨率: ${record.screenResolution || '未知'}
      记录ID: ${record.id}
    `;

    alert(detailsHTML);
  }

  // 导出记录
  exportRecords() {
    try {
      const records = this.getFilteredRecords();
      
      if (records.length === 0) {
        this.showNotification('没有记录可导出', 'warning');
        return;
      }

      const csvContent = this.convertRecordsToCSV(records);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `login_records_${this.getTimestamp()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('登录记录已导出', 'success');
      }
    } catch (error) {
      console.error('导出记录失败:', error);
      this.showNotification('导出失败', 'error');
    }
  }

  // 转换记录为CSV格式
  convertRecordsToCSV(records) {
    const headers = ['用户名', '登录时间', '状态', 'IP地址', '平台', '语言', '屏幕分辨率', '用户代理'];
    const csvRows = [headers.join(',')];

    for (const record of records) {
      const row = [
        this.escapeCSV(record.username),
        this.escapeCSV(this.formatDateTime(record.timestamp)),
        this.escapeCSV(record.success ? '成功' : '失败'),
        this.escapeCSV(record.ip || ''),
        this.escapeCSV(record.platform || ''),
        this.escapeCSV(record.language || ''),
        this.escapeCSV(record.screenResolution || ''),
        this.escapeCSV(record.userAgent || '')
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
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

  // 清空所有记录
  clearAllRecords() {
    if (confirm('确定要清空所有登录记录吗？此操作不可撤销！')) {
      localStorage.removeItem('loginRecords');
      this.loadRecords();
      this.showNotification('所有登录记录已清空', 'success');
    }
  }

  // 绑定模态框事件
  bindLoginRecordsModalEvents() {
    // 点击背景关闭
    const modal = document.getElementById('loginRecordsModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }

    // 实时搜索
    const usernameFilter = document.getElementById('usernameFilter');
    if (usernameFilter) {
      let searchTimeout;
      usernameFilter.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.applyFilters();
        }, 500);
      });
    }
  }

  // 关闭模态框
  closeModal() {
    const modal = document.getElementById('loginRecordsModal');
    if (modal) {
      modal.remove();
    }
  }

  // 获取客户端IP（简化版本）
  getClientIP() {
    // 在实际应用中，这需要服务器端支持
    return 'localhost';
  }

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  }

  // 格式化时间
  formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN');
  }

  // 格式化日期时间
  formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  }

  // 获取时间戳
  getTimestamp() {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
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

// 添加登录记录管理器样式
function addLoginRecordsStyles() {
  if (document.getElementById('loginRecordsStyles')) return;

  const style = document.createElement('style');
  style.id = 'loginRecordsStyles';
  style.textContent = `
    /* 登录记录模态框样式 */
    .login-records-modal {
      z-index: 10005;
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

    .login-records-content {
      max-width: 1200px;
      width: 100%;
      max-height: 90vh;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .login-records-content .modal-header {
      flex-shrink: 0;
      padding: 1.5rem;
      border-bottom: 1px solid #e9ecef;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 16px 16px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .login-records-content .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .login-records-content .modal-footer {
      flex-shrink: 0;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e9ecef;
      background: #f8f9fa;
      border-radius: 0 0 16px 16px;
    }

    /* 过滤器样式 */
    .records-filters {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .filter-row {
      display: flex;
      gap: 1rem;
      align-items: end;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 120px;
    }

    .filter-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #6c757d;
    }

    .filter-group input,
    .filter-group select {
      padding: 0.5rem;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .filter-actions {
      display: flex;
      gap: 0.5rem;
    }

    /* 统计信息样式 */
    .records-stats {
      margin-bottom: 1.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .stat-item {
      text-align: center;
      padding: 1rem;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 8px;
      border-left: 4px solid #007bff;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #333;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6c757d;
      margin-top: 0.25rem;
    }

    /* 记录表格样式 */
    .records-table-container {
      overflow-x: auto;
      margin-bottom: 1.5rem;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }

    .records-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }

    .records-table th {
      background: #f8f9fa;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      color: #495057;
      border-bottom: 2px solid #dee2e6;
      white-space: nowrap;
    }

    .records-table td {
      padding: 0.75rem;
      border-bottom: 1px solid #f8f9fa;
      vertical-align: top;
    }

    .record-row:hover {
      background: #f8f9fa;
    }

    .record-row.success {
      border-left: 3px solid #28a745;
    }

    .record-row.failed {
      border-left: 3px solid #dc3545;
    }

    .username-cell .username {
      font-weight: 500;
      color: #333;
    }

    .timestamp-cell {
      min-width: 120px;
    }

    .timestamp-cell .date {
      display: block;
      font-weight: 500;
      color: #333;
    }

    .timestamp-cell .time {
      display: block;
      font-size: 0.875rem;
      color: #6c757d;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .status-badge.success {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.failed {
      background: #f8d7da;
      color: #721c24;
    }

    .ip-cell .ip {
      font-family: monospace;
      font-size: 0.875rem;
      color: #495057;
    }

    .device-info .platform {
      font-weight: 500;
      color: #333;
      font-size: 0.875rem;
    }

    .device-info .resolution {
      font-size: 0.75rem;
      color: #6c757d;
    }

    /* 分页样式 */
    .records-pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .pagination-info {
      font-size: 0.875rem;
      color: #6c757d;
    }

    .pagination-controls {
      display: flex;
      gap: 0.25rem;
      align-items: center;
    }

    .pagination-ellipsis {
      padding: 0.5rem;
      color: #6c757d;
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
      .login-records-modal {
        padding: 0.5rem;
      }

      .login-records-content {
        max-height: 95vh;
        border-radius: 12px;
      }

      .login-records-content .modal-header {
        padding: 1rem;
        border-radius: 12px 12px 0 0;
      }

      .login-records-content .modal-body {
        padding: 1rem;
      }

      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-group {
        min-width: auto;
      }

      .filter-actions {
        justify-content: stretch;
      }

      .filter-actions .btn {
        flex: 1;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .records-table {
        font-size: 0.875rem;
      }

      .records-table th,
      .records-table td {
        padding: 0.5rem;
      }

      .records-pagination {
        flex-direction: column;
        gap: 1rem;
      }

      .pagination-controls {
        flex-wrap: wrap;
        justify-content: center;
      }

      .modal-actions {
        flex-direction: column;
        gap: 0.5rem;
      }

      .modal-actions .btn {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .records-table th:nth-child(n+4),
      .records-table td:nth-child(n+4) {
        display: none;
      }
    }
  `;

  document.head.appendChild(style);
}

// 自动添加样式
addLoginRecordsStyles();

// 创建全局实例
window.loginRecordsManager = new LoginRecordsManager();
