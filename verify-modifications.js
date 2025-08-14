/**
 * 页眉页脚修改验证脚本
 * 用于验证所有修改是否正常工作
 */

// 验证页脚组件修改
function verifyFooterModifications() {
    console.log('🔍 开始验证页脚组件修改...');
    
    const results = {
        footerExists: false,
        linksCount: 0,
        homeLink: false,
        aboutLink: false,
        uploadLink: false,
        navigateToAboutFunction: false,
        navigateToHomeFunction: false
    };
    
    // 检查页脚是否存在
    const footer = document.querySelector('.footer');
    results.footerExists = footer !== null;
    console.log(`页脚存在: ${results.footerExists ? '✅' : '❌'}`);
    
    // 检查页脚链接
    const footerLinks = document.querySelectorAll('.footer-links a');
    results.linksCount = footerLinks.length;
    console.log(`页脚链接数量: ${results.linksCount}`);
    
    // 检查具体链接
    footerLinks.forEach(link => {
        const text = link.textContent.trim();
        if (text.includes('首页')) {
            results.homeLink = true;
            console.log('首页链接: ✅');
        } else if (text.includes('关于作者')) {
            results.aboutLink = true;
            console.log('关于作者链接: ✅');
        } else if (text.includes('上传作品')) {
            results.uploadLink = true;
            console.log('上传作品链接: ✅');
        }
    });
    
    // 检查导航函数
    results.navigateToAboutFunction = typeof navigateToAbout === 'function';
    results.navigateToHomeFunction = typeof navigateToHome === 'function';
    console.log(`navigateToAbout函数: ${results.navigateToAboutFunction ? '✅' : '❌'}`);
    console.log(`navigateToHome函数: ${results.navigateToHomeFunction ? '✅' : '❌'}`);
    
    return results;
}

// 验证页眉组件修改
function verifyHeaderModifications() {
    console.log('🔍 开始验证页眉组件修改...');
    
    const results = {
        headerExists: false,
        loginButtonCount: 0,
        dropdownExists: false,
        dropdownLinksCount: 0,
        stylesInjected: false
    };
    
    // 检查页眉是否存在
    const header = document.querySelector('.navbar');
    results.headerExists = header !== null;
    console.log(`页眉存在: ${results.headerExists ? '✅' : '❌'}`);
    
    // 检查登录按钮数量
    const loginButtons = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.includes('登录') && 
        (el.tagName === 'A' || el.tagName === 'BUTTON') &&
        el.offsetParent !== null // 确保元素是可见的
    );
    results.loginButtonCount = loginButtons.length;
    console.log(`登录按钮数量: ${results.loginButtonCount} ${results.loginButtonCount === 1 ? '✅' : '❌'}`);
    
    // 检查下拉菜单
    const dropdown = document.querySelector('.nav-dropdown-menu');
    results.dropdownExists = dropdown !== null;
    console.log(`下拉菜单存在: ${results.dropdownExists ? '✅' : '❌'}`);
    
    if (dropdown) {
        const dropdownLinks = dropdown.querySelectorAll('.nav-dropdown-link');
        results.dropdownLinksCount = dropdownLinks.length;
        console.log(`下拉菜单链接数量: ${results.dropdownLinksCount}`);
        
        // 检查下拉菜单样式
        if (dropdownLinks.length > 0) {
            const firstLink = dropdownLinks[0];
            const computedStyle = window.getComputedStyle(firstLink);
            const textColor = computedStyle.color;
            console.log(`下拉菜单文字颜色: ${textColor}`);
        }
    }
    
    // 检查样式注入
    const headerStyles = document.getElementById('header-component-styles');
    results.stylesInjected = headerStyles !== null;
    console.log(`页眉样式注入: ${results.stylesInjected ? '✅' : '❌'}`);
    
    return results;
}

// 验证跨页面导航功能
function verifyCrossPageNavigation() {
    console.log('🔍 开始验证跨页面导航功能...');
    
    const results = {
        aboutSectionExists: false,
        currentPage: '',
        hashHandling: false
    };
    
    // 检查当前页面
    results.currentPage = window.location.pathname;
    console.log(`当前页面: ${results.currentPage}`);
    
    // 检查关于作者区域（如果在首页）
    const aboutSection = document.getElementById('about');
    results.aboutSectionExists = aboutSection !== null;
    console.log(`关于作者区域存在: ${results.aboutSectionExists ? '✅' : '❌'}`);
    
    // 检查URL哈希处理
    if (window.location.hash) {
        results.hashHandling = true;
        console.log(`URL哈希: ${window.location.hash} ✅`);
    } else {
        console.log('URL哈希: 无');
    }
    
    return results;
}

// 运行完整验证
function runCompleteVerification() {
    console.log('🚀 开始完整的修改验证...');
    console.log('='.repeat(50));
    
    const footerResults = verifyFooterModifications();
    console.log('='.repeat(50));
    
    const headerResults = verifyHeaderModifications();
    console.log('='.repeat(50));
    
    const navigationResults = verifyCrossPageNavigation();
    console.log('='.repeat(50));
    
    // 生成总结报告
    console.log('📊 验证总结报告:');
    
    // 页脚修改验证
    const footerScore = [
        footerResults.footerExists,
        footerResults.linksCount >= 3,
        footerResults.homeLink,
        footerResults.aboutLink,
        footerResults.uploadLink,
        footerResults.navigateToAboutFunction,
        footerResults.navigateToHomeFunction
    ].filter(Boolean).length;
    console.log(`页脚修改: ${footerScore}/7 ${footerScore === 7 ? '✅' : '⚠️'}`);
    
    // 页眉修改验证
    const headerScore = [
        headerResults.headerExists,
        headerResults.loginButtonCount === 1,
        headerResults.dropdownExists,
        headerResults.dropdownLinksCount > 0,
        headerResults.stylesInjected
    ].filter(Boolean).length;
    console.log(`页眉修改: ${headerScore}/5 ${headerScore === 5 ? '✅' : '⚠️'}`);
    
    // 跨页面导航验证
    const navigationScore = [
        navigationResults.currentPage !== '',
        typeof navigateToAbout === 'function',
        typeof navigateToHome === 'function'
    ].filter(Boolean).length;
    console.log(`跨页面导航: ${navigationScore}/3 ${navigationScore === 3 ? '✅' : '⚠️'}`);
    
    const totalScore = footerScore + headerScore + navigationScore;
    const maxScore = 15;
    console.log(`总体评分: ${totalScore}/${maxScore} (${Math.round(totalScore/maxScore*100)}%)`);
    
    if (totalScore === maxScore) {
        console.log('🎉 所有修改验证通过！');
    } else {
        console.log('⚠️ 部分修改需要检查');
    }
    
    return {
        footer: footerResults,
        header: headerResults,
        navigation: navigationResults,
        totalScore,
        maxScore
    };
}

// 自动运行验证（如果页面加载完成）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(runCompleteVerification, 2000);
    });
} else {
    setTimeout(runCompleteVerification, 1000);
}

// 导出函数供手动调用
if (typeof window !== 'undefined') {
    window.verifyModifications = runCompleteVerification;
    window.verifyFooter = verifyFooterModifications;
    window.verifyHeader = verifyHeaderModifications;
    window.verifyNavigation = verifyCrossPageNavigation;
}
