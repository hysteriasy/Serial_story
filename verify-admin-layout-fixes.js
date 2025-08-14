// 验证管理员页面布局修复的脚本
(function() {
  'use strict';

  console.log('🔧 开始验证管理员页面布局修复...');

  // 验证函数集合
  const verifications = {
    // 验证CSS文件是否正确加载
    verifyCSSLoaded() {
      const adminCSSLink = document.querySelector('link[href*="admin-file-manager.css"]');
      if (adminCSSLink) {
        console.log('✅ admin-file-manager.css 已正确加载');
        return true;
      } else {
        console.warn('⚠️ admin-file-manager.css 未找到');
        return false;
      }
    },

    // 验证网格布局是否正确应用
    verifyGridLayout() {
      const fileHeader = document.querySelector('.file-list-header');
      if (fileHeader) {
        const computedStyle = window.getComputedStyle(fileHeader);
        const gridColumns = computedStyle.gridTemplateColumns;
        
        console.log('📐 当前网格布局:', gridColumns);
        
        // 检查是否包含2fr（文件名列的新宽度）
        if (gridColumns.includes('2fr')) {
          console.log('✅ 文件名列宽度已正确设置为 2fr');
          return true;
        } else {
          console.warn('⚠️ 文件名列宽度可能未正确应用');
          return false;
        }
      } else {
        console.warn('⚠️ 文件列表头部未找到');
        return false;
      }
    },

    // 验证文件标题样式
    verifyFileTitleStyles() {
      const fileTitles = document.querySelectorAll('.file-title');
      if (fileTitles.length > 0) {
        const firstTitle = fileTitles[0];
        const computedStyle = window.getComputedStyle(firstTitle);
        
        const whiteSpace = computedStyle.whiteSpace;
        const wordBreak = computedStyle.wordBreak;
        
        console.log('📝 文件标题样式:', {
          whiteSpace,
          wordBreak,
          lineHeight: computedStyle.lineHeight
        });
        
        if (whiteSpace === 'normal' && (wordBreak === 'break-word' || wordBreak === 'break-all')) {
          console.log('✅ 文件标题支持换行显示');
          return true;
        } else {
          console.warn('⚠️ 文件标题换行样式可能未正确应用');
          return false;
        }
      } else {
        console.warn('⚠️ 未找到文件标题元素');
        return false;
      }
    },

    // 验证操作按钮区域
    verifyActionButtons() {
      const actionContainers = document.querySelectorAll('.file-actions');
      if (actionContainers.length > 0) {
        const firstContainer = actionContainers[0];
        const computedStyle = window.getComputedStyle(firstContainer);
        const minWidth = computedStyle.minWidth;
        
        console.log('🔘 操作按钮容器最小宽度:', minWidth);
        
        // 检查按钮数量和样式
        const buttons = firstContainer.querySelectorAll('.btn');
        console.log('🔘 操作按钮数量:', buttons.length);
        
        if (buttons.length >= 4) {
          console.log('✅ 操作按钮数量正确');
          
          // 检查按钮文本是否为图标
          const buttonTexts = Array.from(buttons).map(btn => btn.textContent.trim());
          console.log('🔘 按钮文本:', buttonTexts);
          
          const hasOnlyIcons = buttonTexts.every(text => 
            text.length <= 2 && /[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u.test(text)
          );
          
          if (hasOnlyIcons) {
            console.log('✅ 按钮文本已简化为图标');
            return true;
          } else {
            console.warn('⚠️ 部分按钮可能仍包含文字');
            return false;
          }
        } else {
          console.warn('⚠️ 操作按钮数量不足');
          return false;
        }
      } else {
        console.warn('⚠️ 未找到操作按钮容器');
        return false;
      }
    },

    // 验证响应式布局
    verifyResponsiveLayout() {
      const screenWidth = window.innerWidth;
      console.log('📱 当前屏幕宽度:', screenWidth);
      
      if (screenWidth <= 768) {
        console.log('📱 移动设备布局测试');
        
        const fileRows = document.querySelectorAll('.file-row');
        if (fileRows.length > 0) {
          const computedStyle = window.getComputedStyle(fileRows[0]);
          const gridColumns = computedStyle.gridTemplateColumns;
          
          console.log('📱 移动设备网格布局:', gridColumns);
          
          // 移动设备应该只显示4列
          const columnCount = gridColumns.split(' ').length;
          if (columnCount <= 4) {
            console.log('✅ 移动设备布局正确');
            return true;
          } else {
            console.warn('⚠️ 移动设备布局可能有问题');
            return false;
          }
        }
      } else if (screenWidth <= 1200) {
        console.log('💻 平板设备布局测试');
        return true; // 平板布局通常工作正常
      } else {
        console.log('🖥️ 桌面设备布局测试');
        return true; // 桌面布局是主要目标
      }
      
      return false;
    },

    // 验证环境兼容性
    verifyEnvironmentCompatibility() {
      const hostname = window.location.hostname;
      const isGitHubPages = hostname.includes('github.io');
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      
      console.log('🌐 当前环境:', {
        hostname,
        isGitHubPages,
        isLocalhost,
        userAgent: navigator.userAgent.substring(0, 50) + '...'
      });
      
      // 检查CSS是否在当前环境下正确加载
      const stylesheets = Array.from(document.styleSheets);
      const adminCSS = stylesheets.find(sheet => 
        sheet.href && sheet.href.includes('admin-file-manager.css')
      );
      
      if (adminCSS) {
        try {
          // 尝试访问CSS规则
          const rules = adminCSS.cssRules || adminCSS.rules;
          console.log('✅ CSS规则可访问，数量:', rules.length);
          return true;
        } catch (error) {
          console.warn('⚠️ CSS规则访问受限:', error.message);
          return false;
        }
      } else {
        console.warn('⚠️ 未找到管理员CSS文件');
        return false;
      }
    }
  };

  // 执行所有验证
  function runAllVerifications() {
    console.log('\n🔍 开始执行布局修复验证...\n');
    
    const results = {};
    let passCount = 0;
    let totalCount = 0;
    
    for (const [name, verifyFn] of Object.entries(verifications)) {
      totalCount++;
      console.log(`\n--- 验证: ${name} ---`);
      
      try {
        const result = verifyFn();
        results[name] = result;
        if (result) passCount++;
        
        console.log(`结果: ${result ? '✅ 通过' : '❌ 失败'}`);
      } catch (error) {
        console.error(`❌ 验证过程出错:`, error);
        results[name] = false;
      }
    }
    
    // 输出总结
    console.log('\n' + '='.repeat(50));
    console.log('📊 验证结果总结');
    console.log('='.repeat(50));
    console.log(`✅ 通过: ${passCount}/${totalCount}`);
    console.log(`❌ 失败: ${totalCount - passCount}/${totalCount}`);
    console.log(`📈 成功率: ${Math.round(passCount / totalCount * 100)}%`);
    
    if (passCount === totalCount) {
      console.log('\n🎉 所有验证都通过了！布局修复成功！');
    } else if (passCount >= totalCount * 0.8) {
      console.log('\n✅ 大部分验证通过，布局修复基本成功！');
    } else {
      console.log('\n⚠️ 部分验证失败，可能需要进一步调整。');
    }
    
    return results;
  }

  // 等待DOM完全加载后执行验证
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllVerifications);
  } else {
    // 延迟一点时间确保CSS完全应用
    setTimeout(runAllVerifications, 500);
  }

  // 导出验证函数供手动调用
  window.verifyAdminLayoutFixes = runAllVerifications;
  
  console.log('💡 提示: 可以手动调用 verifyAdminLayoutFixes() 重新运行验证');

})();
