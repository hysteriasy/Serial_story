// 白名单黑名单管理器
class WhitelistBlacklistManager {
  constructor() {
    this.globalWhitelist = new Set();
    this.globalBlacklist = new Set();
    this.fileSpecificLists = new Map(); // fileId -> { whitelist: Set, blacklist: Set }
    this.initialized = false;
  }

  // 初始化管理器
  async initialize() {
    try {
      await this.loadGlobalLists();
      await this.loadFileSpecificLists();
      this.initialized = true;
      console.log('✅ 白名单黑名单管理器初始化完成');
    } catch (error) {
      console.error('❌ 白名单黑名单管理器初始化失败:', error);
      throw error;
    }
  }

  // 显示白名单黑名单管理界面
  showManagementInterface() {
    // 移除现有模态框
    const existingModal = document.getElementById('whitelistBlacklistModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'whitelistBlacklistModal';
    modal.className = 'modal whitelist-blacklist-modal';
    modal.style.display = 'flex';
    modal.innerHTML = this.getManagementInterfaceHTML();

    document.body.appendChild(modal);
    this.bindManagementEvents();
    this.refreshListDisplays();
  }

  // 获取管理界面HTML
  getManagementInterfaceHTML() {
    return `
      <div class="modal-content whitelist-blacklist-content">
        <div class="modal-header">
          <h3>📋 白名单黑名单管理</h3>
          <span class="close-btn" onclick="whitelistBlacklistManager.closeModal()">&times;</span>
        </div>
        
        <div class="modal-body">
          <!-- 全局白名单 -->
          <div class="list-management-section">
            <h4>✅ 全局白名单</h4>
            <p class="section-description">全局白名单中的用户可以访问所有未明确禁止的文件</p>
            
            <div class="list-controls">
              <div class="add-user-form">
                <input type="text" id="globalWhitelistInput" class="form-control" 
                       placeholder="输入用户名..." list="availableUsers">
                <button type="button" class="btn btn-success" onclick="whitelistBlacklistManager.addToGlobalWhitelist()">
                  ➕ 添加到白名单
                </button>
              </div>
            </div>
            
            <div id="globalWhitelistDisplay" class="user-list-display">
              <!-- 全局白名单用户将在这里显示 -->
            </div>
          </div>

          <!-- 全局黑名单 -->
          <div class="list-management-section">
            <h4>❌ 全局黑名单</h4>
            <p class="section-description">全局黑名单中的用户无法访问任何文件（优先级最高）</p>
            
            <div class="list-controls">
              <div class="add-user-form">
                <input type="text" id="globalBlacklistInput" class="form-control" 
                       placeholder="输入用户名..." list="availableUsers">
                <button type="button" class="btn btn-danger" onclick="whitelistBlacklistManager.addToGlobalBlacklist()">
                  ➕ 添加到黑名单
                </button>
              </div>
            </div>
            
            <div id="globalBlacklistDisplay" class="user-list-display">
              <!-- 全局黑名单用户将在这里显示 -->
            </div>
          </div>

          <!-- 文件特定列表 -->
          <div class="list-management-section">
            <h4>📁 文件特定权限</h4>
            <p class="section-description">为特定文件设置独立的白名单和黑名单</p>
            
            <div class="file-selection">
              <select id="fileSelector" class="form-control">
                <option value="">选择文件...</option>
              </select>
              <button type="button" class="btn btn-info" onclick="whitelistBlacklistManager.loadFileSpecificLists()">
                🔍 查看文件权限
              </button>
            </div>
            
            <div id="fileSpecificSection" style="display: none;">
              <div class="file-specific-controls">
                <div class="file-whitelist-section">
                  <h5>✅ 文件白名单</h5>
                  <div class="add-user-form">
                    <input type="text" id="fileWhitelistInput" class="form-control" 
                           placeholder="输入用户名..." list="availableUsers">
                    <button type="button" class="btn btn-success" onclick="whitelistBlacklistManager.addToFileWhitelist()">
                      ➕ 添加
                    </button>
                  </div>
                  <div id="fileWhitelistDisplay" class="user-list-display">
                    <!-- 文件白名单用户将在这里显示 -->
                  </div>
                </div>
                
                <div class="file-blacklist-section">
                  <h5>❌ 文件黑名单</h5>
                  <div class="add-user-form">
                    <input type="text" id="fileBlacklistInput" class="form-control" 
                           placeholder="输入用户名..." list="availableUsers">
                    <button type="button" class="btn btn-danger" onclick="whitelistBlacklistManager.addToFileBlacklist()">
                      ➕ 添加
                    </button>
                  </div>
                  <div id="fileBlacklistDisplay" class="user-list-display">
                    <!-- 文件黑名单用户将在这里显示 -->
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 权限规则说明 -->
          <div class="list-management-section">
            <h4>📖 权限规则说明</h4>
            <div class="rules-explanation">
              <div class="rule-item">
                <strong>优先级顺序（从高到低）：</strong>
                <ol>
                  <li>🚫 全局黑名单 - 最高优先级，无法被覆盖</li>
                  <li>🚫 文件黑名单 - 针对特定文件的禁止访问</li>
                  <li>✅ 文件白名单 - 针对特定文件的允许访问</li>
                  <li>✅ 全局白名单 - 全局允许访问</li>
                  <li>🔒 默认权限 - 基于用户角色的默认权限</li>
                </ol>
              </div>
              <div class="rule-item">
                <strong>权限判断逻辑：</strong>
                <ul>
                  <li>如果用户在全局黑名单中，则拒绝访问所有文件</li>
                  <li>如果用户在文件黑名单中，则拒绝访问该文件</li>
                  <li>如果用户在文件白名单中，则允许访问该文件</li>
                  <li>如果用户在全局白名单中，则允许访问未明确禁止的文件</li>
                  <li>否则按照文件的默认权限设置进行判断</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 批量操作 -->
          <div class="list-management-section">
            <h4>🔧 批量操作</h4>
            <div class="batch-operations">
              <button type="button" class="btn btn-info" onclick="whitelistBlacklistManager.exportLists()">
                📤 导出权限配置
              </button>
              <button type="button" class="btn btn-warning" onclick="whitelistBlacklistManager.importLists()">
                📥 导入权限配置
              </button>
              <button type="button" class="btn btn-danger" onclick="whitelistBlacklistManager.clearAllLists()">
                🗑️ 清空所有列表
              </button>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="whitelistBlacklistManager.closeModal()">关闭</button>
          <button type="button" class="btn btn-primary" onclick="whitelistBlacklistManager.saveAllLists()">💾 保存所有更改</button>
        </div>
      </div>

      <!-- 用户名自动完成数据列表 -->
      <datalist id="availableUsers">
        <!-- 可用用户选项将在这里动态生成 -->
      </datalist>
    `;
  }

  // 绑定管理事件
  bindManagementEvents() {
    // 文件选择器变更
    document.getElementById('fileSelector').addEventListener('change', (e) => {
      const fileId = e.target.value;
      if (fileId) {
        this.showFileSpecificSection(fileId);
      } else {
        document.getElementById('fileSpecificSection').style.display = 'none';
      }
    });

    // 回车键添加用户
    ['globalWhitelistInput', 'globalBlacklistInput', 'fileWhitelistInput', 'fileBlacklistInput'].forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const methodMap = {
              'globalWhitelistInput': 'addToGlobalWhitelist',
              'globalBlacklistInput': 'addToGlobalBlacklist',
              'fileWhitelistInput': 'addToFileWhitelist',
              'fileBlacklistInput': 'addToFileBlacklist'
            };
            const method = methodMap[inputId];
            if (method && this[method]) {
              this[method]();
            }
          }
        });
      }
    });
  }

  // 刷新列表显示
  async refreshListDisplays() {
    try {
      // 更新用户自动完成列表
      await this.updateAvailableUsersList();
      
      // 更新文件选择器
      await this.updateFileSelector();
      
      // 显示全局列表
      this.displayGlobalWhitelist();
      this.displayGlobalBlacklist();
      
    } catch (error) {
      console.error('刷新列表显示失败:', error);
    }
  }

  // 更新可用用户列表
  async updateAvailableUsersList() {
    try {
      const datalist = document.getElementById('availableUsers');
      if (!datalist) return;

      // 获取所有用户
      let users = [];
      if (auth && auth.getAllUsers) {
        users = await auth.getAllUsers();
      }

      // 清空现有选项
      datalist.innerHTML = '';

      // 添加用户选项
      users.forEach(user => {
        const username = typeof user === 'string' ? user : user.username;
        if (username) {
          const option = document.createElement('option');
          option.value = username;
          datalist.appendChild(option);
        }
      });

    } catch (error) {
      console.error('更新用户列表失败:', error);
    }
  }

  // 更新文件选择器
  async updateFileSelector() {
    try {
      const selector = document.getElementById('fileSelector');
      if (!selector) return;

      // 获取所有文件
      let files = [];
      if (window.adminFileManager && window.adminFileManager.currentFiles) {
        files = window.adminFileManager.currentFiles;
      }

      // 清空现有选项
      selector.innerHTML = '<option value="">选择文件...</option>';

      // 添加文件选项
      files.forEach(file => {
        const option = document.createElement('option');
        option.value = `${file.owner}/${file.fileId}`;
        option.textContent = `${file.title || file.originalName || '未命名'} (${file.owner})`;
        selector.appendChild(option);
      });

    } catch (error) {
      console.error('更新文件选择器失败:', error);
    }
  }

  // 显示全局白名单
  displayGlobalWhitelist() {
    const container = document.getElementById('globalWhitelistDisplay');
    if (!container) return;

    container.innerHTML = '';

    if (this.globalWhitelist.size === 0) {
      container.innerHTML = '<div class="empty-list">暂无用户</div>';
      return;
    }

    this.globalWhitelist.forEach(username => {
      const userElement = this.createUserListItem(username, 'whitelist', () => {
        this.removeFromGlobalWhitelist(username);
      });
      container.appendChild(userElement);
    });
  }

  // 显示全局黑名单
  displayGlobalBlacklist() {
    const container = document.getElementById('globalBlacklistDisplay');
    if (!container) return;

    container.innerHTML = '';

    if (this.globalBlacklist.size === 0) {
      container.innerHTML = '<div class="empty-list">暂无用户</div>';
      return;
    }

    this.globalBlacklist.forEach(username => {
      const userElement = this.createUserListItem(username, 'blacklist', () => {
        this.removeFromGlobalBlacklist(username);
      });
      container.appendChild(userElement);
    });
  }

  // 创建用户列表项
  createUserListItem(username, listType, removeCallback) {
    const item = document.createElement('div');
    item.className = `user-list-item ${listType}-item`;
    item.innerHTML = `
      <span class="username">${username}</span>
      <button type="button" class="btn btn-sm btn-outline-danger remove-user-btn" title="移除用户">
        ✕
      </button>
    `;

    const removeBtn = item.querySelector('.remove-user-btn');
    removeBtn.addEventListener('click', removeCallback);

    return item;
  }

  // 添加到全局白名单
  addToGlobalWhitelist() {
    const input = document.getElementById('globalWhitelistInput');
    const username = input.value.trim();

    if (!username) {
      this.showNotification('请输入用户名', 'warning');
      return;
    }

    if (this.globalWhitelist.has(username)) {
      this.showNotification('用户已在全局白名单中', 'warning');
      return;
    }

    if (this.globalBlacklist.has(username)) {
      this.showNotification('用户在全局黑名单中，请先移除', 'error');
      return;
    }

    this.globalWhitelist.add(username);
    input.value = '';
    this.displayGlobalWhitelist();
    this.showNotification(`已将 ${username} 添加到全局白名单`, 'success');
  }

  // 添加到全局黑名单
  addToGlobalBlacklist() {
    const input = document.getElementById('globalBlacklistInput');
    const username = input.value.trim();

    if (!username) {
      this.showNotification('请输入用户名', 'warning');
      return;
    }

    if (this.globalBlacklist.has(username)) {
      this.showNotification('用户已在全局黑名单中', 'warning');
      return;
    }

    // 从全局白名单中移除（如果存在）
    if (this.globalWhitelist.has(username)) {
      this.globalWhitelist.delete(username);
      this.displayGlobalWhitelist();
    }

    this.globalBlacklist.add(username);
    input.value = '';
    this.displayGlobalBlacklist();
    this.showNotification(`已将 ${username} 添加到全局黑名单`, 'success');
  }

  // 从全局白名单移除
  removeFromGlobalWhitelist(username) {
    this.globalWhitelist.delete(username);
    this.displayGlobalWhitelist();
    this.showNotification(`已将 ${username} 从全局白名单移除`, 'info');
  }

  // 从全局黑名单移除
  removeFromGlobalBlacklist(username) {
    this.globalBlacklist.delete(username);
    this.displayGlobalBlacklist();
    this.showNotification(`已将 ${username} 从全局黑名单移除`, 'info');
  }

  // 显示文件特定权限区域
  showFileSpecificSection(fileKey) {
    const section = document.getElementById('fileSpecificSection');
    section.style.display = 'block';

    // 加载文件特定列表
    this.loadFileSpecificLists(fileKey);
  }

  // 加载文件特定列表
  loadFileSpecificLists(fileKey = null) {
    if (!fileKey) {
      const selector = document.getElementById('fileSelector');
      fileKey = selector.value;
    }

    if (!fileKey) {
      this.showNotification('请选择文件', 'warning');
      return;
    }

    // 获取或创建文件特定列表
    if (!this.fileSpecificLists.has(fileKey)) {
      this.fileSpecificLists.set(fileKey, {
        whitelist: new Set(),
        blacklist: new Set()
      });
    }

    const lists = this.fileSpecificLists.get(fileKey);
    this.currentFileKey = fileKey;

    // 显示列表
    this.displayFileWhitelist(lists.whitelist);
    this.displayFileBlacklist(lists.blacklist);
  }

  // 显示文件白名单
  displayFileWhitelist(whitelist) {
    const container = document.getElementById('fileWhitelistDisplay');
    if (!container) return;

    container.innerHTML = '';

    if (whitelist.size === 0) {
      container.innerHTML = '<div class="empty-list">暂无用户</div>';
      return;
    }

    whitelist.forEach(username => {
      const userElement = this.createUserListItem(username, 'whitelist', () => {
        this.removeFromFileWhitelist(username);
      });
      container.appendChild(userElement);
    });
  }

  // 显示文件黑名单
  displayFileBlacklist(blacklist) {
    const container = document.getElementById('fileBlacklistDisplay');
    if (!container) return;

    container.innerHTML = '';

    if (blacklist.size === 0) {
      container.innerHTML = '<div class="empty-list">暂无用户</div>';
      return;
    }

    blacklist.forEach(username => {
      const userElement = this.createUserListItem(username, 'blacklist', () => {
        this.removeFromFileBlacklist(username);
      });
      container.appendChild(userElement);
    });
  }

  // 添加到文件白名单
  addToFileWhitelist() {
    if (!this.currentFileKey) {
      this.showNotification('请先选择文件', 'warning');
      return;
    }

    const input = document.getElementById('fileWhitelistInput');
    const username = input.value.trim();

    if (!username) {
      this.showNotification('请输入用户名', 'warning');
      return;
    }

    const lists = this.fileSpecificLists.get(this.currentFileKey);

    if (lists.whitelist.has(username)) {
      this.showNotification('用户已在文件白名单中', 'warning');
      return;
    }

    if (lists.blacklist.has(username)) {
      this.showNotification('用户在文件黑名单中，请先移除', 'error');
      return;
    }

    lists.whitelist.add(username);
    input.value = '';
    this.displayFileWhitelist(lists.whitelist);
    this.showNotification(`已将 ${username} 添加到文件白名单`, 'success');
  }

  // 添加到文件黑名单
  addToFileBlacklist() {
    if (!this.currentFileKey) {
      this.showNotification('请先选择文件', 'warning');
      return;
    }

    const input = document.getElementById('fileBlacklistInput');
    const username = input.value.trim();

    if (!username) {
      this.showNotification('请输入用户名', 'warning');
      return;
    }

    const lists = this.fileSpecificLists.get(this.currentFileKey);

    if (lists.blacklist.has(username)) {
      this.showNotification('用户已在文件黑名单中', 'warning');
      return;
    }

    // 从文件白名单中移除（如果存在）
    if (lists.whitelist.has(username)) {
      lists.whitelist.delete(username);
      this.displayFileWhitelist(lists.whitelist);
    }

    lists.blacklist.add(username);
    input.value = '';
    this.displayFileBlacklist(lists.blacklist);
    this.showNotification(`已将 ${username} 添加到文件黑名单`, 'success');
  }

  // 从文件白名单移除
  removeFromFileWhitelist(username) {
    if (!this.currentFileKey) return;

    const lists = this.fileSpecificLists.get(this.currentFileKey);
    lists.whitelist.delete(username);
    this.displayFileWhitelist(lists.whitelist);
    this.showNotification(`已将 ${username} 从文件白名单移除`, 'info');
  }

  // 从文件黑名单移除
  removeFromFileBlacklist(username) {
    if (!this.currentFileKey) return;

    const lists = this.fileSpecificLists.get(this.currentFileKey);
    lists.blacklist.delete(username);
    this.displayFileBlacklist(lists.blacklist);
    this.showNotification(`已将 ${username} 从文件黑名单移除`, 'info');
  }

  // 加载全局列表
  async loadGlobalLists() {
    try {
      // 从存储中加载全局白名单
      const globalWhitelistData = await this.loadData('global_whitelist');
      if (globalWhitelistData && Array.isArray(globalWhitelistData)) {
        this.globalWhitelist = new Set(globalWhitelistData);
      }

      // 从存储中加载全局黑名单
      const globalBlacklistData = await this.loadData('global_blacklist');
      if (globalBlacklistData && Array.isArray(globalBlacklistData)) {
        this.globalBlacklist = new Set(globalBlacklistData);
      }

    } catch (error) {
      console.error('加载全局列表失败:', error);
    }
  }

  // 加载文件特定列表
  async loadFileSpecificLists() {
    try {
      const fileListsData = await this.loadData('file_specific_lists');
      if (fileListsData && typeof fileListsData === 'object') {
        this.fileSpecificLists.clear();

        Object.entries(fileListsData).forEach(([fileKey, lists]) => {
          this.fileSpecificLists.set(fileKey, {
            whitelist: new Set(lists.whitelist || []),
            blacklist: new Set(lists.blacklist || [])
          });
        });
      }

    } catch (error) {
      console.error('加载文件特定列表失败:', error);
    }
  }

  // 保存所有列表
  async saveAllLists() {
    try {
      // 保存全局列表
      await this.saveData('global_whitelist', Array.from(this.globalWhitelist));
      await this.saveData('global_blacklist', Array.from(this.globalBlacklist));

      // 保存文件特定列表
      const fileListsData = {};
      this.fileSpecificLists.forEach((lists, fileKey) => {
        fileListsData[fileKey] = {
          whitelist: Array.from(lists.whitelist),
          blacklist: Array.from(lists.blacklist)
        };
      });
      await this.saveData('file_specific_lists', fileListsData);

      this.showNotification('所有权限列表已保存', 'success');

    } catch (error) {
      console.error('保存列表失败:', error);
      this.showNotification('保存失败: ' + error.message, 'error');
    }
  }

  // 数据存储方法
  async loadData(key) {
    if (window.dataManager) {
      return await window.dataManager.loadData(key, { category: 'permissions' });
    } else {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
  }

  async saveData(key, data) {
    if (window.dataManager) {
      return await window.dataManager.saveData(key, data, {
        category: 'permissions',
        commitMessage: `更新权限列表: ${key}`
      });
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  // 工具方法
  closeModal() {
    const modal = document.getElementById('whitelistBlacklistModal');
    if (modal) {
      modal.remove();
    }
  }

  showNotification(message, type = 'info') {
    if (typeof showNotification === 'function') {
      showNotification(message, type);
    } else {
      alert(message);
    }
  }

  // 权限检查方法
  checkUserAccess(username, fileKey = null) {
    // 1. 检查全局黑名单（最高优先级）
    if (this.globalBlacklist.has(username)) {
      return { hasAccess: false, reason: 'User in global blacklist' };
    }

    // 2. 检查文件特定黑名单
    if (fileKey && this.fileSpecificLists.has(fileKey)) {
      const lists = this.fileSpecificLists.get(fileKey);
      if (lists.blacklist.has(username)) {
        return { hasAccess: false, reason: 'User in file blacklist' };
      }

      // 3. 检查文件特定白名单
      if (lists.whitelist.has(username)) {
        return { hasAccess: true, reason: 'User in file whitelist' };
      }
    }

    // 4. 检查全局白名单
    if (this.globalWhitelist.has(username)) {
      return { hasAccess: true, reason: 'User in global whitelist' };
    }

    // 5. 返回默认权限判断
    return { hasAccess: null, reason: 'No specific list match, use default permissions' };
  }
}

// 创建全局实例
window.whitelistBlacklistManager = new WhitelistBlacklistManager();
