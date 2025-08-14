// 管理员页面修复验证脚本
// 此脚本用于在浏览器控制台中验证修复是否生效

console.log('🔧 开始验证管理员页面修复...');

// 验证函数1：检查文件过滤修复
function verifyFileFiltering() {
    console.log('\n📋 验证文件过滤修复...');
    
    if (typeof window.AdminFileManager === 'undefined') {
        console.error('❌ AdminFileManager 类未找到');
        return false;
    }
    
    const manager = new window.AdminFileManager();
    
    // 检查初始状态
    if (manager.ownerFilter !== 'all') {
        console.error('❌ 用户过滤器初始状态错误:', manager.ownerFilter);
        return false;
    }
    
    // 检查重置方法
    if (typeof manager.resetFilters !== 'function') {
        console.error('❌ resetFilters 方法不存在');
        return false;
    }
    
    // 测试重置功能
    manager.ownerFilter = 'test';
    manager.resetFilters();
    if (manager.ownerFilter !== 'all') {
        console.error('❌ resetFilters 方法未正确重置过滤器');
        return false;
    }
    
    console.log('✅ 文件过滤修复验证通过');
    return true;
}

// 验证函数2：检查中文编码修复
function verifyChineseEncoding() {
    console.log('\n🈶 验证中文编码修复...');
    
    if (typeof window.AdminFileManager === 'undefined') {
        console.error('❌ AdminFileManager 类未找到');
        return false;
    }
    
    const manager = new window.AdminFileManager();
    
    // 检查安全解码方法
    if (typeof manager.safeBase64Decode !== 'function') {
        console.error('❌ safeBase64Decode 方法不存在');
        return false;
    }
    
    // 测试中文编码
    const testString = '测试中文文件名';
    try {
        const encoded = btoa(unescape(encodeURIComponent(testString)));
        const decoded = manager.safeBase64Decode(encoded);
        
        if (decoded !== testString) {
            console.error('❌ 中文编码测试失败:', decoded, '!=', testString);
            return false;
        }
    } catch (error) {
        console.error('❌ 中文编码测试异常:', error);
        return false;
    }
    
    console.log('✅ 中文编码修复验证通过');
    return true;
}

// 验证函数3：检查按钮可见性修复
function verifyButtonVisibility() {
    console.log('\n👁️ 验证按钮可见性修复...');
    
    if (typeof window.AdminFileManager === 'undefined') {
        console.error('❌ AdminFileManager 类未找到');
        return false;
    }
    
    const manager = new window.AdminFileManager();
    
    // 检查确保按钮可见方法
    if (typeof manager.ensureButtonsVisible !== 'function') {
        console.error('❌ ensureButtonsVisible 方法不存在');
        return false;
    }
    
    // 检查调试方法
    if (typeof manager.debugButtonRendering !== 'function') {
        console.error('❌ debugButtonRendering 方法不存在');
        return false;
    }
    
    // 检查CSS样式是否加载
    const adminStyleSheets = Array.from(document.styleSheets).filter(sheet => 
        sheet.href && sheet.href.includes('admin-file-manager.css')
    );
    
    if (adminStyleSheets.length === 0) {
        console.warn('⚠️ 管理员文件管理器样式表未找到');
    } else {
        console.log('✅ 管理员文件管理器样式表已加载');
    }
    
    console.log('✅ 按钮可见性修复验证通过');
    return true;
}

// 验证函数4：检查实际DOM中的按钮
function verifyActualButtons() {
    console.log('\n🔍 验证实际DOM中的按钮...');
    
    const fileActions = document.querySelectorAll('.admin-file-manager .file-actions');
    console.log(`找到 ${fileActions.length} 个文件操作区域`);
    
    if (fileActions.length === 0) {
        console.warn('⚠️ 未找到文件操作区域，可能文件列表未加载');
        return false;
    }
    
    let visibleButtons = 0;
    fileActions.forEach((actionContainer, index) => {
        const buttons = actionContainer.querySelectorAll('.btn');
        const containerStyle = window.getComputedStyle(actionContainer);
        
        console.log(`操作区域 ${index + 1}:`, {
            buttonsCount: buttons.length,
            display: containerStyle.display,
            opacity: containerStyle.opacity,
            visibility: containerStyle.visibility
        });
        
        buttons.forEach((btn, btnIndex) => {
            const btnStyle = window.getComputedStyle(btn);
            const isVisible = btnStyle.opacity !== '0' && 
                            btnStyle.visibility !== 'hidden' && 
                            btnStyle.display !== 'none';
            
            if (isVisible) visibleButtons++;
            
            console.log(`  按钮 ${btnIndex + 1} (${btn.textContent.trim()}):`, {
                visible: isVisible,
                backgroundColor: btnStyle.backgroundColor,
                color: btnStyle.color
            });
        });
    });
    
    console.log(`✅ 共找到 ${visibleButtons} 个可见按钮`);
    return visibleButtons > 0;
}

// 主验证函数
function runAllVerifications() {
    console.log('🚀 开始运行所有验证...\n');
    
    const results = {
        fileFiltering: verifyFileFiltering(),
        chineseEncoding: verifyChineseEncoding(),
        buttonVisibility: verifyButtonVisibility(),
        actualButtons: verifyActualButtons()
    };
    
    console.log('\n📊 验证结果汇总:');
    console.log('文件过滤修复:', results.fileFiltering ? '✅ 通过' : '❌ 失败');
    console.log('中文编码修复:', results.chineseEncoding ? '✅ 通过' : '❌ 失败');
    console.log('按钮可见性修复:', results.buttonVisibility ? '✅ 通过' : '❌ 失败');
    console.log('实际按钮检查:', results.actualButtons ? '✅ 通过' : '❌ 失败');
    
    const passedCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n🎯 总体结果: ${passedCount}/${totalCount} 项验证通过`);
    
    if (passedCount === totalCount) {
        console.log('🎉 所有修复验证通过！');
    } else {
        console.log('⚠️ 部分修复需要进一步检查');
    }
    
    return results;
}

// 自动运行验证（延迟执行，确保页面完全加载）
setTimeout(() => {
    if (document.readyState === 'complete') {
        runAllVerifications();
    } else {
        window.addEventListener('load', runAllVerifications);
    }
}, 1000);

// 导出验证函数供手动调用
window.adminFixesVerification = {
    runAll: runAllVerifications,
    fileFiltering: verifyFileFiltering,
    chineseEncoding: verifyChineseEncoding,
    buttonVisibility: verifyButtonVisibility,
    actualButtons: verifyActualButtons
};

console.log('📝 验证脚本已加载。可以手动调用 window.adminFixesVerification.runAll() 来重新验证。');
