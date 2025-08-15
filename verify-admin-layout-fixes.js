// 管理员布局修复验证脚本
// 用于验证 admin.html 页面的布局修复是否正确应用

(function() {
  'use strict';

  console.log('🔍 开始验证管理员布局修复...');

  // 验证函数集合
  const verificationTests = {
    // 验证CSS文件是否正确加载
    checkCSSLoading() {
      const adminFileManagerCSS = Array.from(document.styleSheets).find(sheet => 
        sheet.href && sheet.href.includes('admin-file-manager.css')
      );
      
      if (adminFileManagerCSS) {
        console.log('✅ admin-file-manager.css 已正确加载');
        return true;
      } else {
        console.warn('⚠️ admin-file-manager.css 未找到');
        return false;
      }
    },

    // 验证文件管理器容器是否存在
    checkFileManagerContainer() {
      const container = document.getElementById('adminFileManagerContainer');
      if (container) {
        console.log('✅ 管理员文件管理器容器存在');
        return true;
      } else {
        console.warn('⚠️ 管理员文件管理器容器未找到');
        return false;
      }
    },

    // 验证AdminFileManager类是否可用
    checkAdminFileManagerClass() {
      if (typeof window.AdminFileManager === 'function') {
        console.log('✅ AdminFileManager 类已定义');
        return true;
      } else {
        console.warn('⚠️ AdminFileManager 类未定义');
        return false;
      }
    },

    // 验证文件权限系统是否可用
    checkFilePermissionsSystem() {
      if (typeof window.filePermissionsSystem === 'object' && window.filePermissionsSystem !== null) {
        console.log('✅ 文件权限系统已初始化');
        return true;
      } else {
        console.warn('⚠️ 文件权限系统未初始化');
        return false;
      }
    },

    // 验证数据管理器是否可用
    checkDataManager() {
      if (typeof window.dataManager === 'object' && window.dataManager !== null) {
        console.log('✅ 数据管理器已初始化');
        return true;
      } else {
        console.warn('⚠️ 数据管理器未初始化');
        return false;
      }
    },

    // 验证GitHub存储是否可用
    checkGitHubStorage() {
      if (typeof window.githubStorage === 'object' && window.githubStorage !== null) {
        console.log('✅ GitHub存储已初始化');
        return true;
      } else {
        console.warn('⚠️ GitHub存储未初始化');
        return false;
      }
    },

    // 验证环境检测
    checkEnvironmentDetection() {
      const isGitHubPages = window.location.hostname.includes('github.io');
      const isLocalhost = window.location.hostname === 'localhost';
      
      if (isGitHubPages) {
        console.log('✅ 检测到 GitHub Pages 环境');
        return true;
      } else if (isLocalhost) {
        console.log('✅ 检测到本地开发环境');
        return true;
      } else {
        console.log('ℹ️ 未知环境:', window.location.hostname);
        return true; // 不算错误
      }
    }
  };

  // 执行所有验证测试
  function runAllVerifications() {
    console.log('🔍 执行管理员布局修复验证测试...');
    
    const results = {};
    let passedTests = 0;
    let totalTests = 0;

    for (const [testName, testFunction] of Object.entries(verificationTests)) {
      totalTests++;
      try {
        const result = testFunction();
        results[testName] = result;
        if (result) passedTests++;
      } catch (error) {
        console.error(`❌ 验证测试 ${testName} 执行失败:`, error);
        results[testName] = false;
      }
    }

    // 输出验证结果摘要
    console.log(`📊 验证结果摘要: ${passedTests}/${totalTests} 测试通过`);
    
    if (passedTests === totalTests) {
      console.log('🎉 所有验证测试通过！管理员布局修复正常工作');
    } else {
      console.warn(`⚠️ ${totalTests - passedTests} 个测试失败，可能需要进一步检查`);
    }

    return results;
  }

  // 延迟执行验证，确保页面完全加载
  function scheduleVerification() {
    // 等待DOM完全加载
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runAllVerifications, 1000);
      });
    } else {
      setTimeout(runAllVerifications, 1000);
    }
  }

  // 提供全局验证函数
  window.verifyAdminLayoutFixes = runAllVerifications;

  // 自动执行验证
  scheduleVerification();

  console.log('✅ 管理员布局修复验证脚本已加载');

})();
