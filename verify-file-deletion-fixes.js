/**
 * 文件删除功能修复验证脚本
 * 验证GitHub Pages环境中文件删除功能的修复效果
 */

(function() {
  'use strict';

  console.log('🔍 开始验证文件删除功能修复...');

  // 验证结果收集器
  const verificationResults = {
    components: {},
    functionality: {},
    issues: [],
    recommendations: []
  };

  // 检查组件加载状态
  function checkComponents() {
    console.log('📦 检查组件加载状态...');

    const components = [
      { name: 'adminFileManager', obj: window.adminFileManager, critical: true },
      { name: 'githubStorage', obj: window.githubStorage, critical: false },
      { name: 'dataSyncManager', obj: window.dataSyncManager, critical: true },
      { name: 'fileDeletionFix', obj: window.fileDeletionFix, critical: true },
      { name: 'trackingProtectionHandler', obj: window.trackingProtectionHandler, critical: false }
    ];

    components.forEach(comp => {
      const isLoaded = comp.obj !== undefined;
      verificationResults.components[comp.name] = {
        loaded: isLoaded,
        critical: comp.critical,
        status: isLoaded ? 'OK' : 'MISSING'
      };

      if (!isLoaded && comp.critical) {
        verificationResults.issues.push(`关键组件缺失: ${comp.name}`);
      }

      console.log(`${isLoaded ? '✅' : '❌'} ${comp.name}: ${isLoaded ? '已加载' : '未加载'}`);
    });
  }

  // 检查删除功能增强
  function checkDeletionEnhancements() {
    console.log('🔧 检查删除功能增强...');

    if (window.adminFileManager) {
      // 检查删除方法是否被增强
      const deleteMethod = window.adminFileManager.deleteFile;
      const isEnhanced = deleteMethod && deleteMethod.toString().includes('增强删除方法被调用');
      
      verificationResults.functionality.deletionEnhanced = isEnhanced;
      
      if (isEnhanced) {
        console.log('✅ 删除方法已被增强');
      } else {
        console.log('⚠️ 删除方法未被增强');
        verificationResults.issues.push('删除方法未被增强');
      }
    } else {
      verificationResults.functionality.deletionEnhanced = false;
      verificationResults.issues.push('adminFileManager未加载，无法检查删除增强');
    }
  }

  // 检查事件监听器
  function checkEventListeners() {
    console.log('📡 检查事件监听器...');

    const events = ['fileDeleted', 'dataChanged', 'pageRefreshNeeded'];
    const hasListeners = events.some(eventType => {
      // 简单检查是否有相关的事件监听器
      return window.fileDeletionFix && window.fileDeletionFix.isInitialized;
    });

    verificationResults.functionality.eventListeners = hasListeners;
    
    if (hasListeners) {
      console.log('✅ 事件监听器已设置');
    } else {
      console.log('⚠️ 事件监听器未正确设置');
      verificationResults.issues.push('事件监听器未正确设置');
    }
  }

  // 检查GitHub存储增强
  function checkGitHubStorageEnhancements() {
    console.log('🌐 检查GitHub存储增强...');

    if (window.githubStorage && window.githubStorage.deleteFile) {
      const deleteMethod = window.githubStorage.deleteFile.toString();
      const hasEnhancedLogging = deleteMethod.includes('GitHub删除文件');
      
      verificationResults.functionality.githubStorageEnhanced = hasEnhancedLogging;
      
      if (hasEnhancedLogging) {
        console.log('✅ GitHub存储删除方法已增强');
      } else {
        console.log('⚠️ GitHub存储删除方法未增强');
        verificationResults.issues.push('GitHub存储删除方法未增强');
      }
    } else {
      verificationResults.functionality.githubStorageEnhanced = false;
      console.log('ℹ️ GitHub存储未配置或不可用');
    }
  }

  // 检查数据同步增强
  function checkDataSyncEnhancements() {
    console.log('🔄 检查数据同步增强...');

    if (window.dataSyncManager && window.dataSyncManager.notifyPageRefresh) {
      const refreshMethod = window.dataSyncManager.notifyPageRefresh.toString();
      const hasSmartRefresh = refreshMethod.includes('智能的刷新策略');
      
      verificationResults.functionality.dataSyncEnhanced = hasSmartRefresh;
      
      if (hasSmartRefresh) {
        console.log('✅ 数据同步刷新策略已增强');
      } else {
        console.log('⚠️ 数据同步刷新策略未增强');
        verificationResults.issues.push('数据同步刷新策略未增强');
      }
    } else {
      verificationResults.functionality.dataSyncEnhanced = false;
      verificationResults.issues.push('dataSyncManager未加载或方法缺失');
    }
  }

  // 生成修复建议
  function generateRecommendations() {
    console.log('💡 生成修复建议...');

    if (verificationResults.issues.length === 0) {
      verificationResults.recommendations.push('✅ 所有修复都已正确应用，文件删除功能应该正常工作');
      return;
    }

    // 基于问题生成建议
    verificationResults.issues.forEach(issue => {
      if (issue.includes('adminFileManager')) {
        verificationResults.recommendations.push('🔧 确保admin-file-manager.js正确加载并初始化');
      }
      
      if (issue.includes('fileDeletionFix')) {
        verificationResults.recommendations.push('🔧 确保file-deletion-fix.js正确加载');
      }
      
      if (issue.includes('删除方法未被增强')) {
        verificationResults.recommendations.push('🔧 检查文件删除修复模块是否在adminFileManager初始化后加载');
      }
      
      if (issue.includes('事件监听器')) {
        verificationResults.recommendations.push('🔧 检查事件监听器设置，确保页面刷新事件能正确触发');
      }
    });

    // 通用建议
    verificationResults.recommendations.push('🔄 如果问题持续存在，请尝试清除浏览器缓存并重新加载页面');
    verificationResults.recommendations.push('🌐 在GitHub Pages环境中，确保网络连接稳定且GitHub Token权限正确');
  }

  // 输出验证报告
  function outputReport() {
    console.log('\n📋 文件删除功能修复验证报告');
    console.log('=====================================');
    
    console.log('\n📦 组件状态:');
    Object.entries(verificationResults.components).forEach(([name, info]) => {
      console.log(`  ${info.status === 'OK' ? '✅' : '❌'} ${name}: ${info.status}`);
    });
    
    console.log('\n🔧 功能状态:');
    Object.entries(verificationResults.functionality).forEach(([name, status]) => {
      console.log(`  ${status ? '✅' : '❌'} ${name}: ${status ? '正常' : '异常'}`);
    });
    
    if (verificationResults.issues.length > 0) {
      console.log('\n⚠️ 发现的问题:');
      verificationResults.issues.forEach(issue => {
        console.log(`  • ${issue}`);
      });
    }
    
    console.log('\n💡 修复建议:');
    verificationResults.recommendations.forEach(rec => {
      console.log(`  ${rec}`);
    });
    
    console.log('\n=====================================');
    
    // 将结果存储到全局变量供调试使用
    window.fileDeletionVerificationResults = verificationResults;
  }

  // 执行验证
  function runVerification() {
    try {
      checkComponents();
      checkDeletionEnhancements();
      checkEventListeners();
      checkGitHubStorageEnhancements();
      checkDataSyncEnhancements();
      generateRecommendations();
      outputReport();
      
      console.log('✅ 文件删除功能修复验证完成');
    } catch (error) {
      console.error('❌ 验证过程中发生错误:', error);
    }
  }

  // 延迟执行验证，确保所有组件都已加载
  setTimeout(runVerification, 2000);

  // 导出验证函数供手动调用
  window.verifyFileDeletionFixes = runVerification;

})();

console.log('🔍 文件删除功能修复验证脚本已加载');
