/**
 * GitHub Pages 环境下文件删除问题诊断脚本
 * 专门诊断删除后文件重新出现的问题
 */

class FileDeletionDiagnostic {
  constructor() {
    this.diagnosticResults = [];
    this.testFileId = null;
    this.testOwner = null;
  }

  // 运行完整诊断
  async runDiagnostic() {
    console.log('🔍 开始文件删除问题诊断...');
    
    this.diagnosticResults = [];
    
    // 1. 环境检查
    await this.checkEnvironment();
    
    // 2. 存储系统检查
    await this.checkStorageSystems();
    
    // 3. 文件列表加载机制检查
    await this.checkFileListLoading();
    
    // 4. 删除操作流程检查
    await this.checkDeletionWorkflow();
    
    // 5. 数据同步机制检查
    await this.checkDataSyncMechanism();
    
    // 6. 缓存机制检查
    await this.checkCachingMechanism();
    
    // 输出诊断结果
    this.outputDiagnosticResults();
    
    return this.diagnosticResults;
  }

  // 检查运行环境
  async checkEnvironment() {
    console.log('🌐 检查运行环境...');
    
    const hostname = window.location.hostname;
    const isGitHubPages = hostname === 'hysteriasy.github.io';
    const hasGitHubToken = !!localStorage.getItem('github_token');
    
    this.addResult('environment', 'info', `当前环境: ${hostname}`);
    this.addResult('environment', isGitHubPages ? 'success' : 'warning', 
      `GitHub Pages 环境: ${isGitHubPages ? '是' : '否'}`);
    this.addResult('environment', hasGitHubToken ? 'success' : 'error', 
      `GitHub Token: ${hasGitHubToken ? '已配置' : '未配置'}`);
    
    // 检查环境管理器
    if (window.environmentManager) {
      const envInfo = {
        environment: window.environmentManager.getEnvironment(),
        strategy: window.environmentManager.getStorageStrategy(),
        shouldUseGitHub: window.environmentManager.shouldUseGitHubStorage()
      };
      this.addResult('environment', 'success', `环境管理器: ${JSON.stringify(envInfo)}`);
    } else {
      this.addResult('environment', 'error', '环境管理器未初始化');
    }
  }

  // 检查存储系统
  async checkStorageSystems() {
    console.log('💾 检查存储系统...');
    
    // 检查 GitHub 存储
    if (window.githubStorage) {
      this.addResult('storage', 'success', 'GitHub 存储已初始化');
      
      if (window.githubStorage.token) {
        this.addResult('storage', 'success', 'GitHub Token 已配置');
        
        // 测试 GitHub API 连接
        try {
          const testResult = await this.testGitHubConnection();
          this.addResult('storage', testResult.success ? 'success' : 'error', 
            `GitHub API 连接: ${testResult.message}`);
        } catch (error) {
          this.addResult('storage', 'error', `GitHub API 测试失败: ${error.message}`);
        }
      } else {
        this.addResult('storage', 'error', 'GitHub Token 未配置');
      }
    } else {
      this.addResult('storage', 'error', 'GitHub 存储未初始化');
    }
    
    // 检查本地存储
    try {
      const testKey = 'deletion_test_' + Date.now();
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.addResult('storage', 'success', '本地存储可用');
    } catch (error) {
      this.addResult('storage', 'error', `本地存储不可用: ${error.message}`);
    }
    
    // 检查数据管理器
    if (window.dataManager) {
      this.addResult('storage', 'success', '数据管理器已初始化');
      
      const shouldUseGitHub = window.dataManager.shouldUseGitHubStorage();
      this.addResult('storage', 'info', `应使用 GitHub 存储: ${shouldUseGitHub}`);
    } else {
      this.addResult('storage', 'error', '数据管理器未初始化');
    }
  }

  // 测试 GitHub API 连接
  async testGitHubConnection() {
    try {
      const response = await fetch('https://api.github.com/repos/hysteriasy/Serial_story', {
        headers: {
          'Authorization': `Bearer ${window.githubStorage.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        return { success: true, message: '连接正常' };
      } else {
        return { success: false, message: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // 检查文件列表加载机制
  async checkFileListLoading() {
    console.log('📋 检查文件列表加载机制...');
    
    if (window.adminFileManager) {
      this.addResult('loading', 'success', '管理员文件管理器已初始化');
      
      // 检查当前文件列表
      const currentFiles = window.adminFileManager.currentFiles;
      if (currentFiles && Array.isArray(currentFiles)) {
        this.addResult('loading', 'success', `当前文件列表: ${currentFiles.length} 个文件`);
        
        // 分析文件来源
        const sources = {};
        currentFiles.forEach(file => {
          sources[file.source] = (sources[file.source] || 0) + 1;
        });
        this.addResult('loading', 'info', `文件来源分布: ${JSON.stringify(sources)}`);
      } else {
        this.addResult('loading', 'warning', '当前文件列表为空或未初始化');
      }
      
      // 检查加载方法
      if (typeof window.adminFileManager.loadFileList === 'function') {
        this.addResult('loading', 'success', 'loadFileList 方法可用');
      } else {
        this.addResult('loading', 'error', 'loadFileList 方法不可用');
      }
      
      if (typeof window.adminFileManager.getAllFiles === 'function') {
        this.addResult('loading', 'success', 'getAllFiles 方法可用');
      } else {
        this.addResult('loading', 'error', 'getAllFiles 方法不可用');
      }
    } else {
      this.addResult('loading', 'error', '管理员文件管理器未初始化');
    }
  }

  // 检查删除操作流程
  async checkDeletionWorkflow() {
    console.log('🗑️ 检查删除操作流程...');
    
    if (window.adminFileManager) {
      // 检查删除相关方法
      const deletionMethods = [
        'deleteFile',
        'performFileDelete',
        'canDeleteFile',
        'showDeleteConfirmation'
      ];
      
      deletionMethods.forEach(method => {
        if (typeof window.adminFileManager[method] === 'function') {
          this.addResult('deletion', 'success', `${method} 方法可用`);
        } else {
          this.addResult('deletion', 'error', `${method} 方法不可用`);
        }
      });
      
      // 检查删除增强脚本
      if (window.fileDeletionFix) {
        this.addResult('deletion', 'success', '文件删除修复脚本已加载');
      } else {
        this.addResult('deletion', 'warning', '文件删除修复脚本未加载');
      }
      
      if (window.specificFileDeletionFix) {
        this.addResult('deletion', 'success', '特定文件删除修复脚本已加载');
      } else {
        this.addResult('deletion', 'warning', '特定文件删除修复脚本未加载');
      }
    }
  }

  // 检查数据同步机制
  async checkDataSyncMechanism() {
    console.log('🔄 检查数据同步机制...');
    
    if (window.dataSyncManager) {
      this.addResult('sync', 'success', '数据同步管理器已初始化');
      
      // 检查同步相关方法
      const syncMethods = [
        'syncFileDelete',
        'handleFileDelete',
        'triggerDataChange',
        'notifyPageRefresh'
      ];
      
      syncMethods.forEach(method => {
        if (typeof window.dataSyncManager[method] === 'function') {
          this.addResult('sync', 'success', `${method} 方法可用`);
        } else {
          this.addResult('sync', 'error', `${method} 方法不可用`);
        }
      });
    } else {
      this.addResult('sync', 'error', '数据同步管理器未初始化');
    }
  }

  // 检查缓存机制
  async checkCachingMechanism() {
    console.log('🗂️ 检查缓存机制...');
    
    // 检查智能文件加载器
    if (window.smartFileLoader) {
      this.addResult('cache', 'success', '智能文件加载器已初始化');
      
      if (window.smartFileLoader.cache) {
        const cacheSize = window.smartFileLoader.cache.size;
        this.addResult('cache', 'info', `缓存条目数: ${cacheSize}`);
      }
    } else {
      this.addResult('cache', 'warning', '智能文件加载器未初始化');
    }
    
    // 检查目录检查器缓存
    if (window.directoryChecker) {
      this.addResult('cache', 'success', '目录检查器已初始化');
    } else {
      this.addResult('cache', 'warning', '目录检查器未初始化');
    }
  }

  // 模拟删除操作测试
  async simulateDeletionTest() {
    console.log('🧪 模拟删除操作测试...');
    
    if (!window.adminFileManager || !window.adminFileManager.currentFiles) {
      this.addResult('test', 'error', '无法进行删除测试：文件管理器不可用');
      return;
    }
    
    const testFiles = window.adminFileManager.currentFiles.filter(f => 
      f.owner === 'admin' || f.owner === auth.currentUser?.username
    );
    
    if (testFiles.length === 0) {
      this.addResult('test', 'warning', '无可测试的文件');
      return;
    }
    
    const testFile = testFiles[0];
    this.testFileId = testFile.fileId;
    this.testOwner = testFile.owner;
    
    this.addResult('test', 'info', `选择测试文件: ${testFile.title || testFile.originalName} (${testFile.fileId})`);
    
    // 检查文件在各存储位置的存在状态
    await this.checkFileExistence(testFile);
  }

  // 检查文件在各存储位置的存在状态
  async checkFileExistence(file) {
    console.log('📍 检查文件存在状态...');
    
    const workKey = `work_${file.fileId}`;
    
    // 检查本地存储
    const localExists = !!localStorage.getItem(workKey);
    this.addResult('existence', localExists ? 'success' : 'info', 
      `本地存储: ${localExists ? '存在' : '不存在'}`);
    
    // 检查 GitHub 存储
    if (window.dataManager && window.dataManager.shouldUseGitHubStorage()) {
      try {
        const githubData = await window.dataManager.loadData(workKey, {
          category: 'works',
          fallbackToLocal: false
        });
        const githubExists = !!githubData;
        this.addResult('existence', githubExists ? 'success' : 'info', 
          `GitHub 存储: ${githubExists ? '存在' : '不存在'}`);
      } catch (error) {
        this.addResult('existence', 'warning', `GitHub 存储检查失败: ${error.message}`);
      }
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
    console.log('\n📊 文件删除问题诊断结果汇总:');
    
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
    this.generateFixSuggestions();
  }

  // 生成修复建议
  generateFixSuggestions() {
    console.log('\n💡 修复建议:');
    
    const errors = this.diagnosticResults.filter(r => r.type === 'error');
    const warnings = this.diagnosticResults.filter(r => r.type === 'warning');
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ 未发现明显问题，删除功能应该正常工作');
      return;
    }
    
    // 根据错误类型生成建议
    errors.forEach(error => {
      if (error.message.includes('GitHub Token')) {
        console.log('🔧 建议: 在管理员页面配置 GitHub Token');
      } else if (error.message.includes('GitHub 存储')) {
        console.log('🔧 建议: 检查 GitHub API 连接和权限');
      } else if (error.message.includes('本地存储')) {
        console.log('🔧 建议: 检查浏览器存储权限和隐私设置');
      } else if (error.message.includes('数据管理器')) {
        console.log('🔧 建议: 检查数据管理器初始化顺序');
      }
    });
    
    warnings.forEach(warning => {
      if (warning.message.includes('删除修复脚本')) {
        console.log('💡 建议: 确保删除修复脚本正确加载');
      } else if (warning.message.includes('缓存')) {
        console.log('💡 建议: 清理缓存或重新初始化缓存系统');
      }
    });
  }

  // 在页面上显示诊断结果
  displayResultsOnPage() {
    const container = document.getElementById('diagnosticResults') || 
                     document.getElementById('adminSettings') ||
                     document.body;
    
    const resultHTML = this.generateResultHTML();
    
    // 创建或更新结果显示区域
    let resultDiv = document.getElementById('fileDeletionDiagnostic');
    if (!resultDiv) {
      resultDiv = document.createElement('div');
      resultDiv.id = 'fileDeletionDiagnostic';
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
      <h4>🔍 文件删除问题诊断结果</h4>
      <div style="margin: 15px 0;">
        <button onclick="window.fileDeletionDiagnostic.runDiagnostic()" 
                style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          🔄 重新运行诊断
        </button>
        <button onclick="window.fileDeletionDiagnostic.simulateDeletionTest()" 
                style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
          🧪 运行删除测试
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
window.fileDeletionDiagnostic = new FileDeletionDiagnostic();

// 自动运行诊断（如果在管理员页面）
if (window.location.pathname.includes('admin.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window.fileDeletionDiagnostic.runDiagnostic().then(() => {
        window.fileDeletionDiagnostic.displayResultsOnPage();
      });
    }, 2000);
  });
}

console.log('🔍 文件删除问题诊断脚本已加载');
