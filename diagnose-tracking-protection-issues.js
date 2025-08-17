/**
 * 跟踪保护问题诊断脚本
 * 专门诊断权限按钮点击时的跟踪保护相关问题
 */

class TrackingProtectionDiagnostic {
  constructor() {
    this.diagnosticResults = [];
    this.storageTestResults = {};
    this.permissionTestResults = {};
    this.consoleErrors = [];
    this.originalConsoleError = console.error;
  }

  // 运行完整诊断
  async runDiagnostic() {
    console.log('🔍 开始跟踪保护问题诊断...');
    
    this.diagnosticResults = [];
    this.setupErrorCapture();
    
    // 1. 浏览器环境检查
    await this.checkBrowserEnvironment();
    
    // 2. 存储访问测试
    await this.testStorageAccess();
    
    // 3. 跟踪保护检测
    await this.detectTrackingProtection();
    
    // 4. 权限系统组件检查
    await this.checkPermissionComponents();
    
    // 5. 权限按钮功能测试
    await this.testPermissionButtonFunction();
    
    // 6. 存储策略验证
    await this.verifyStorageStrategy();
    
    // 7. 错误模式分析
    await this.analyzeErrorPatterns();
    
    // 输出诊断结果
    this.outputDiagnosticResults();
    this.restoreConsoleError();
    
    return this.diagnosticResults;
  }

  // 设置错误捕获
  setupErrorCapture() {
    this.consoleErrors = [];
    console.error = (...args) => {
      const message = args.join(' ');
      this.consoleErrors.push({
        message,
        timestamp: new Date().toISOString(),
        args
      });
      // 仍然输出到控制台，但添加标识
      this.originalConsoleError.call(console, '📊 [诊断捕获]', ...args);
    };
  }

  // 恢复控制台错误方法
  restoreConsoleError() {
    console.error = this.originalConsoleError;
  }

  // 检查浏览器环境
  async checkBrowserEnvironment() {
    console.log('🌐 检查浏览器环境...');
    
    const userAgent = navigator.userAgent;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    this.addResult('environment', 'info', `用户代理: ${userAgent}`);
    this.addResult('environment', 'info', `主机名: ${hostname}`);
    this.addResult('environment', 'info', `协议: ${protocol}`);
    
    // 检查是否为GitHub Pages
    const isGitHubPages = hostname === 'hysteriasy.github.io';
    this.addResult('environment', isGitHubPages ? 'success' : 'info', 
      `GitHub Pages 环境: ${isGitHubPages ? '是' : '否'}`);
    
    // 检查浏览器类型
    const browserInfo = this.detectBrowser(userAgent);
    this.addResult('environment', 'info', `浏览器: ${browserInfo.name} ${browserInfo.version}`);
    
    // 检查隐私模式
    const isPrivateMode = await this.detectPrivateMode();
    this.addResult('environment', isPrivateMode ? 'warning' : 'success', 
      `隐私模式: ${isPrivateMode ? '是' : '否'}`);
    
    // 检查跟踪保护功能
    const trackingProtectionInfo = this.detectTrackingProtectionFeatures();
    trackingProtectionInfo.forEach(info => {
      this.addResult('environment', 'info', info);
    });
  }

  // 检测浏览器类型
  detectBrowser(userAgent) {
    if (userAgent.includes('Chrome')) {
      return { name: 'Chrome', version: userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown' };
    } else if (userAgent.includes('Firefox')) {
      return { name: 'Firefox', version: userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown' };
    } else if (userAgent.includes('Safari')) {
      return { name: 'Safari', version: userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown' };
    } else if (userAgent.includes('Edge')) {
      return { name: 'Edge', version: userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown' };
    }
    return { name: 'Unknown', version: 'Unknown' };
  }

  // 检测隐私模式
  async detectPrivateMode() {
    try {
      // 尝试使用IndexedDB检测隐私模式
      const request = indexedDB.open('test');
      return new Promise((resolve) => {
        request.onerror = () => resolve(true);
        request.onsuccess = () => {
          indexedDB.deleteDatabase('test');
          resolve(false);
        };
      });
    } catch (error) {
      return true;
    }
  }

  // 检测跟踪保护功能
  detectTrackingProtectionFeatures() {
    const features = [];
    
    // 检查各种跟踪保护API
    if (typeof navigator.doNotTrack !== 'undefined') {
      features.push(`Do Not Track: ${navigator.doNotTrack}`);
    }
    
    if (typeof navigator.globalPrivacyControl !== 'undefined') {
      features.push(`Global Privacy Control: ${navigator.globalPrivacyControl}`);
    }
    
    // 检查存储访问API
    if (typeof document.requestStorageAccess === 'function') {
      features.push('Storage Access API: 支持');
    }
    
    // 检查权限API
    if (typeof navigator.permissions !== 'undefined') {
      features.push('Permissions API: 支持');
    }
    
    return features;
  }

  // 测试存储访问
  async testStorageAccess() {
    console.log('💾 测试存储访问...');
    
    const tests = [
      { name: 'localStorage 写入', test: () => this.testLocalStorageWrite() },
      { name: 'localStorage 读取', test: () => this.testLocalStorageRead() },
      { name: 'localStorage 删除', test: () => this.testLocalStorageRemove() },
      { name: 'sessionStorage 访问', test: () => this.testSessionStorage() },
      { name: 'IndexedDB 访问', test: () => this.testIndexedDB() }
    ];
    
    for (const test of tests) {
      try {
        const result = await test.test();
        this.storageTestResults[test.name] = result;
        this.addResult('storage', result.success ? 'success' : 'error', 
          `${test.name}: ${result.success ? '成功' : result.error}`);
      } catch (error) {
        this.storageTestResults[test.name] = { success: false, error: error.message };
        this.addResult('storage', 'error', `${test.name}: ${error.message}`);
      }
    }
  }

  // 测试localStorage写入
  async testLocalStorageWrite() {
    try {
      const testKey = '__tracking_diagnostic_write_test__';
      const testValue = `test_${Date.now()}`;
      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 测试localStorage读取
  async testLocalStorageRead() {
    try {
      const testKey = '__tracking_diagnostic_read_test__';
      const testValue = `test_${Date.now()}`;
      localStorage.setItem(testKey, testValue);
      const readValue = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (readValue === testValue) {
        return { success: true };
      } else {
        return { success: false, error: '读取值不匹配' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 测试localStorage删除
  async testLocalStorageRemove() {
    try {
      const testKey = '__tracking_diagnostic_remove_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      const value = localStorage.getItem(testKey);
      
      if (value === null) {
        return { success: true };
      } else {
        return { success: false, error: '删除后仍能读取到值' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 测试sessionStorage
  async testSessionStorage() {
    try {
      const testKey = '__tracking_diagnostic_session_test__';
      const testValue = `test_${Date.now()}`;
      sessionStorage.setItem(testKey, testValue);
      const readValue = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);
      
      if (readValue === testValue) {
        return { success: true };
      } else {
        return { success: false, error: 'sessionStorage读写不一致' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 测试IndexedDB
  async testIndexedDB() {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('__tracking_diagnostic_idb_test__', 1);
        
        request.onerror = () => {
          resolve({ success: false, error: 'IndexedDB打开失败' });
        };
        
        request.onsuccess = () => {
          const db = request.result;
          db.close();
          indexedDB.deleteDatabase('__tracking_diagnostic_idb_test__');
          resolve({ success: true });
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          db.createObjectStore('test', { keyPath: 'id' });
        };
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  }

  // 检测跟踪保护
  async detectTrackingProtection() {
    console.log('🛡️ 检测跟踪保护...');
    
    // 检查跟踪保护处理器
    if (window.trackingProtectionHandler) {
      this.addResult('tracking', 'success', '跟踪保护处理器已加载');
      
      const isBlocked = window.trackingProtectionHandler.storageBlocked;
      this.addResult('tracking', isBlocked ? 'warning' : 'success', 
        `存储访问状态: ${isBlocked ? '被阻止' : '正常'}`);
      
      const stats = window.trackingProtectionHandler.accessStats;
      this.addResult('tracking', 'info', 
        `存储访问统计: ${stats.successes}成功/${stats.failures}失败`);
    } else {
      this.addResult('tracking', 'error', '跟踪保护处理器未加载');
    }
    
    // 检查修复脚本
    if (window.trackingProtectionPermissionsFix) {
      this.addResult('tracking', 'success', '跟踪保护权限修复脚本已加载');
      
      const fixInfo = window.trackingProtectionPermissionsFix.getDiagnosticInfo();
      this.addResult('tracking', 'info', 
        `修复脚本状态: 初始化=${fixInfo.initialized}, 缓存=${fixInfo.permissionCacheSize}`);
    } else {
      this.addResult('tracking', 'warning', '跟踪保护权限修复脚本未加载');
    }
  }

  // 检查权限系统组件
  async checkPermissionComponents() {
    console.log('🔐 检查权限系统组件...');
    
    const components = [
      { name: 'filePermissionsSystem', obj: window.filePermissionsSystem },
      { name: 'filePermissionsUI', obj: window.filePermissionsUI },
      { name: 'enhancedPermissionsManager', obj: window.enhancedPermissionsManager },
      { name: 'adminFileManager', obj: window.adminFileManager },
      { name: 'auth', obj: window.auth }
    ];
    
    components.forEach(component => {
      if (component.obj) {
        this.addResult('components', 'success', `${component.name} 已加载`);
        
        // 检查关键方法
        if (component.name === 'filePermissionsSystem' && component.obj.getFilePermissions) {
          this.addResult('components', 'success', 'getFilePermissions 方法可用');
        }
        
        if (component.name === 'adminFileManager' && component.obj.editPermissions) {
          this.addResult('components', 'success', 'editPermissions 方法可用');
        }
      } else {
        this.addResult('components', 'error', `${component.name} 未加载`);
      }
    });
  }

  // 测试权限按钮功能
  async testPermissionButtonFunction() {
    console.log('🔘 测试权限按钮功能...');
    
    // 查找权限按钮
    const permissionButtons = document.querySelectorAll('button[title*="权限"], button[onclick*="editPermissions"]');
    
    if (permissionButtons.length > 0) {
      this.addResult('button', 'success', `找到 ${permissionButtons.length} 个权限按钮`);
      
      // 测试第一个按钮的点击事件
      const firstButton = permissionButtons[0];
      if (firstButton.onclick || firstButton.getAttribute('onclick')) {
        this.addResult('button', 'success', '权限按钮有点击事件绑定');
      } else {
        this.addResult('button', 'warning', '权限按钮没有点击事件绑定');
      }
    } else {
      this.addResult('button', 'warning', '未找到权限按钮');
    }
    
    // 检查权限按钮的可见性和可用性
    permissionButtons.forEach((button, index) => {
      const isVisible = button.offsetParent !== null;
      const isDisabled = button.disabled;
      
      this.addResult('button', isVisible ? 'success' : 'warning', 
        `权限按钮 ${index + 1}: ${isVisible ? '可见' : '隐藏'}, ${isDisabled ? '禁用' : '启用'}`);
    });
  }

  // 验证存储策略
  async verifyStorageStrategy() {
    console.log('📊 验证存储策略...');
    
    if (window.dataManager) {
      const shouldUseGitHub = window.dataManager.shouldUseGitHubStorage();
      const isOnline = window.dataManager.isOnlineEnvironment();
      
      this.addResult('strategy', 'info', `应使用GitHub存储: ${shouldUseGitHub}`);
      this.addResult('strategy', 'info', `在线环境: ${isOnline}`);
    } else {
      this.addResult('strategy', 'error', '数据管理器未初始化');
    }
    
    if (window.environmentManager) {
      const env = window.environmentManager.getEnvironment();
      const strategy = window.environmentManager.getStorageStrategy();
      
      this.addResult('strategy', 'info', `环境: ${env}`);
      this.addResult('strategy', 'info', `存储策略: ${strategy}`);
    } else {
      this.addResult('strategy', 'error', '环境管理器未初始化');
    }
  }

  // 分析错误模式
  async analyzeErrorPatterns() {
    console.log('📈 分析错误模式...');
    
    const trackingErrors = this.consoleErrors.filter(error => 
      error.message.toLowerCase().includes('tracking prevention') ||
      error.message.toLowerCase().includes('blocked access to storage')
    );
    
    if (trackingErrors.length > 0) {
      this.addResult('errors', 'warning', `发现 ${trackingErrors.length} 个跟踪保护错误`);
      
      // 分析错误频率
      const errorFrequency = {};
      trackingErrors.forEach(error => {
        const key = error.message.substring(0, 50) + '...';
        errorFrequency[key] = (errorFrequency[key] || 0) + 1;
      });
      
      Object.entries(errorFrequency).forEach(([message, count]) => {
        this.addResult('errors', 'info', `错误频率: ${message} (${count}次)`);
      });
    } else {
      this.addResult('errors', 'success', '未发现跟踪保护错误');
    }
    
    // 分析其他存储相关错误
    const storageErrors = this.consoleErrors.filter(error => 
      error.message.toLowerCase().includes('storage') ||
      error.message.toLowerCase().includes('localstorage') ||
      error.message.toLowerCase().includes('sessionstorage')
    );
    
    if (storageErrors.length > 0) {
      this.addResult('errors', 'warning', `发现 ${storageErrors.length} 个存储相关错误`);
    } else {
      this.addResult('errors', 'success', '未发现存储相关错误');
    }
  }

  // 添加诊断结果
  addResult(category, type, message) {
    this.diagnosticResults.push({
      category,
      type,
      message,
      timestamp: new Date().toISOString()
    });
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${category}] ${message}`);
  }

  // 输出诊断结果
  outputDiagnosticResults() {
    console.log('\n📊 跟踪保护问题诊断结果汇总:');
    
    const categories = [...new Set(this.diagnosticResults.map(r => r.category))];
    
    categories.forEach(category => {
      const categoryResults = this.diagnosticResults.filter(r => r.category === category);
      const successCount = categoryResults.filter(r => r.type === 'success').length;
      const errorCount = categoryResults.filter(r => r.type === 'error').length;
      const warningCount = categoryResults.filter(r => r.type === 'warning').length;
      
      console.log(`\n📋 ${category.toUpperCase()}:`);
      console.log(`  ✅ 成功: ${successCount}`);
      console.log(`  ❌ 错误: ${errorCount}`);
      console.log(`  ⚠️ 警告: ${warningCount}`);
      
      if (errorCount > 0) {
        console.log('  错误详情:');
        categoryResults.filter(r => r.type === 'error').forEach(r => {
          console.log(`    - ${r.message}`);
        });
      }
    });
    
    // 生成修复建议
    this.generateFixRecommendations();
  }

  // 生成修复建议
  generateFixRecommendations() {
    console.log('\n💡 修复建议:');
    
    const errors = this.diagnosticResults.filter(r => r.type === 'error');
    const warnings = this.diagnosticResults.filter(r => r.type === 'warning');
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ 未发现明显问题，权限功能应该正常工作');
      return;
    }
    
    // 根据错误类型生成建议
    if (errors.some(e => e.message.includes('跟踪保护'))) {
      console.log('🔧 建议: 启用跟踪保护权限修复脚本');
    }
    
    if (errors.some(e => e.message.includes('存储访问'))) {
      console.log('🔧 建议: 检查浏览器隐私设置，考虑使用GitHub存储作为主要存储');
    }
    
    if (errors.some(e => e.message.includes('组件未加载'))) {
      console.log('🔧 建议: 检查脚本加载顺序和依赖关系');
    }
    
    if (warnings.some(w => w.message.includes('权限按钮'))) {
      console.log('💡 建议: 检查权限按钮的事件绑定和可见性');
    }
  }

  // 在页面上显示诊断结果
  displayResultsOnPage() {
    const container = document.getElementById('diagnosticResults') || 
                     document.getElementById('adminSettings') ||
                     document.body;
    
    const resultHTML = this.generateResultHTML();
    
    // 创建或更新结果显示区域
    let resultDiv = document.getElementById('trackingProtectionDiagnostic');
    if (!resultDiv) {
      resultDiv = document.createElement('div');
      resultDiv.id = 'trackingProtectionDiagnostic';
      resultDiv.style.cssText = `
        margin: 20px 0;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: #f9f9f9;
      `;
      container.appendChild(resultDiv);
    }
    
    resultDiv.innerHTML = resultHTML;
  }

  // 生成结果HTML
  generateResultHTML() {
    const categories = [...new Set(this.diagnosticResults.map(r => r.category))];
    
    let html = `
      <h4>🔍 跟踪保护问题诊断结果</h4>
      <div style="margin: 15px 0;">
        <button onclick="window.trackingProtectionDiagnostic.runDiagnostic()" 
                style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          🔄 重新运行诊断
        </button>
      </div>
    `;
    
    categories.forEach(category => {
      const categoryResults = this.diagnosticResults.filter(r => r.category === category);
      html += `
        <details style="margin: 10px 0;">
          <summary style="font-weight: bold; cursor: pointer; padding: 5px;">
            📋 ${category.toUpperCase()} (${categoryResults.length} 项)
          </summary>
          <ul style="margin: 10px 0; padding-left: 20px;">
      `;
      
      categoryResults.forEach(result => {
        const icon = result.type === 'success' ? '✅' : 
                    result.type === 'error' ? '❌' : 
                    result.type === 'warning' ? '⚠️' : 'ℹ️';
        html += `<li style="margin: 5px 0;">${icon} ${result.message}</li>`;
      });
      
      html += `</ul></details>`;
    });
    
    return html;
  }
}

// 创建全局实例
window.trackingProtectionDiagnostic = new TrackingProtectionDiagnostic();

// 自动运行诊断（如果在管理员页面）
if (window.location.pathname.includes('admin.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.trackingProtectionDiagnostic.runDiagnostic().then(() => {
        window.trackingProtectionDiagnostic.displayResultsOnPage();
      });
    }, 3000); // 延迟3秒以确保所有组件加载完成
  });
}

console.log('🔍 跟踪保护问题诊断脚本已加载');
