/**
 * Admin 页眉页脚集成验证脚本
 * 验证 admin.html 页面的页眉页脚组件集成是否正常工作
 */

(function() {
    'use strict';

    console.log('🧪 开始验证 Admin 页眉页脚集成...');

    // 等待页面完全加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runVerification);
    } else {
        runVerification();
    }

    function runVerification() {
        setTimeout(() => {
            console.log('🔍 运行页眉页脚集成验证...');
            
            const results = {
                passed: 0,
                failed: 0,
                warnings: 0,
                tests: []
            };

            // 测试1: 检查页眉组件
            testHeaderComponent(results);
            
            // 测试2: 检查页脚组件
            testFooterComponent(results);
            
            // 测试3: 检查DOM结构
            testDOMStructure(results);
            
            // 测试4: 检查功能集成
            testFunctionalIntegration(results);
            
            // 测试5: 检查样式和布局
            testStylesAndLayout(results);

            // 输出测试结果
            outputResults(results);
        }, 2000); // 等待2秒确保组件完全初始化
    }

    function testHeaderComponent(results) {
        console.log('📋 测试页眉组件...');

        // 检查HeaderComponent类
        if (typeof HeaderComponent !== 'undefined') {
            addResult(results, 'success', '页眉组件类已加载');
        } else {
            addResult(results, 'error', '页眉组件类未找到');
            return;
        }

        // 检查页眉组件实例
        if (window.headerComponent) {
            addResult(results, 'success', '页眉组件实例已创建');
            
            if (window.headerComponent.isInitialized) {
                addResult(results, 'success', '页眉组件已初始化');
            } else {
                addResult(results, 'warning', '页眉组件未完全初始化');
            }
        } else {
            addResult(results, 'error', '页眉组件实例未找到');
        }

        // 检查导航栏DOM
        const navbar = document.querySelector('nav.navbar');
        if (navbar) {
            addResult(results, 'success', '导航栏已插入DOM');
            
            // 检查导航栏内容
            const navLogo = navbar.querySelector('.nav-logo');
            const navMenu = navbar.querySelector('.nav-menu');
            const authNavLink = navbar.querySelector('#authNavLink');
            
            if (navLogo) addResult(results, 'success', '导航栏Logo已创建');
            if (navMenu) addResult(results, 'success', '导航菜单已创建');
            if (authNavLink) addResult(results, 'success', '登录链接已创建');
        } else {
            addResult(results, 'error', '导航栏未找到');
        }
    }

    function testFooterComponent(results) {
        console.log('📋 测试页脚组件...');

        // 检查FooterComponent类
        if (typeof FooterComponent !== 'undefined') {
            addResult(results, 'success', '页脚组件类已加载');
        } else {
            addResult(results, 'error', '页脚组件类未找到');
            return;
        }

        // 检查页脚组件实例
        if (window.footerComponent) {
            addResult(results, 'success', '页脚组件实例已创建');
            
            if (window.footerComponent.isInitialized) {
                addResult(results, 'success', '页脚组件已初始化');
            } else {
                addResult(results, 'warning', '页脚组件未完全初始化');
            }
        } else {
            addResult(results, 'error', '页脚组件实例未找到');
        }

        // 检查页脚DOM
        const footer = document.querySelector('footer.footer');
        if (footer) {
            addResult(results, 'success', '页脚已插入DOM');
            
            // 检查页脚内容
            const footerContent = footer.querySelector('.footer-content');
            const footerLinks = footer.querySelector('.footer-links');
            
            if (footerContent) addResult(results, 'success', '页脚内容已创建');
            if (footerLinks) addResult(results, 'success', '页脚链接已创建');
        } else {
            addResult(results, 'error', '页脚未找到');
        }

        // 检查返回顶部按钮
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            addResult(results, 'success', '返回顶部按钮已创建');
            
            // 检查按钮功能
            if (typeof backToTop.onclick === 'function' || backToTop.getAttribute('onclick')) {
                addResult(results, 'success', '返回顶部按钮功能已绑定');
            } else {
                addResult(results, 'warning', '返回顶部按钮功能未绑定');
            }
        } else {
            addResult(results, 'error', '返回顶部按钮未找到');
        }
    }

    function testDOMStructure(results) {
        console.log('📋 测试DOM结构...');

        // 检查是否移除了原有的静态页眉页脚
        const staticNavbars = document.querySelectorAll('nav.navbar');
        if (staticNavbars.length === 1) {
            addResult(results, 'success', '页眉重复元素已清理');
        } else if (staticNavbars.length > 1) {
            addResult(results, 'warning', `发现${staticNavbars.length}个导航栏，可能存在重复`);
        } else {
            addResult(results, 'error', '未找到导航栏');
        }

        const staticFooters = document.querySelectorAll('footer.footer');
        if (staticFooters.length === 1) {
            addResult(results, 'success', '页脚重复元素已清理');
        } else if (staticFooters.length > 1) {
            addResult(results, 'warning', `发现${staticFooters.length}个页脚，可能存在重复`);
        } else {
            addResult(results, 'error', '未找到页脚');
        }

        // 检查页面结构完整性
        const adminHero = document.querySelector('.admin-hero');
        const adminPanel = document.querySelector('.admin-panel');
        
        if (adminHero) addResult(results, 'success', 'Admin标题区域保持完整');
        if (adminPanel) addResult(results, 'success', 'Admin面板保持完整');
    }

    function testFunctionalIntegration(results) {
        console.log('📋 测试功能集成...');

        // 检查登录模态框
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            addResult(results, 'success', '登录模态框已创建');
        } else {
            addResult(results, 'warning', '登录模态框未找到（可能延迟创建）');
        }

        // 检查用户信息显示区域
        const userInfoDisplay = document.getElementById('userInfoDisplay');
        if (userInfoDisplay) {
            addResult(results, 'success', '用户信息显示区域已创建');
        } else {
            addResult(results, 'warning', '用户信息显示区域未找到（可能延迟创建）');
        }

        // 检查移动端菜单
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            addResult(results, 'success', '移动端菜单已创建');
        } else {
            addResult(results, 'warning', '移动端菜单未找到');
        }

        // 检查全局函数
        if (typeof showLoginModal === 'function') {
            addResult(results, 'success', 'showLoginModal函数可用');
        } else {
            addResult(results, 'warning', 'showLoginModal函数未找到');
        }

        if (typeof scrollToTop === 'function') {
            addResult(results, 'success', 'scrollToTop函数可用');
        } else {
            addResult(results, 'warning', 'scrollToTop函数未找到');
        }
    }

    function testStylesAndLayout(results) {
        console.log('📋 测试样式和布局...');

        // 检查页眉样式
        const navbar = document.querySelector('nav.navbar');
        if (navbar) {
            const navbarStyles = window.getComputedStyle(navbar);
            if (navbarStyles.position === 'fixed') {
                addResult(results, 'success', '导航栏固定定位正常');
            } else {
                addResult(results, 'warning', '导航栏定位可能异常');
            }
        }

        // 检查body padding
        const bodyStyles = window.getComputedStyle(document.body);
        const paddingTop = parseInt(bodyStyles.paddingTop);
        if (paddingTop >= 60) {
            addResult(results, 'success', 'Body顶部间距正常');
        } else {
            addResult(results, 'warning', 'Body顶部间距可能不足');
        }

        // 检查页脚位置
        const footer = document.querySelector('footer.footer');
        if (footer) {
            const footerRect = footer.getBoundingClientRect();
            if (footerRect.top > window.innerHeight * 0.5) {
                addResult(results, 'success', '页脚位置正常');
            } else {
                addResult(results, 'warning', '页脚位置可能异常');
            }
        }
    }

    function addResult(results, type, message) {
        results.tests.push({ type, message });
        if (type === 'success') results.passed++;
        else if (type === 'error') results.failed++;
        else if (type === 'warning') results.warnings++;
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
        console.log(`${icon} ${message}`);
    }

    function outputResults(results) {
        console.log('\n📊 验证结果汇总:');
        console.log(`✅ 通过: ${results.passed}`);
        console.log(`❌ 失败: ${results.failed}`);
        console.log(`⚠️ 警告: ${results.warnings}`);
        console.log(`📋 总计: ${results.tests.length}`);

        const successRate = (results.passed / results.tests.length * 100).toFixed(1);
        console.log(`📈 成功率: ${successRate}%`);

        if (results.failed === 0) {
            console.log('🎉 页眉页脚集成验证通过！');
        } else {
            console.log('⚠️ 页眉页脚集成存在问题，请检查失败项目');
        }

        // 在页面上显示结果（如果有测试容器）
        const testContainer = document.getElementById('testResults') || 
                             document.getElementById('verificationResults');
        if (testContainer) {
            displayResultsInPage(testContainer, results);
        }
    }

    function displayResultsInPage(container, results) {
        const resultHTML = `
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <h4>🧪 页眉页脚集成验证结果</h4>
                <div style="margin: 10px 0;">
                    <span style="color: green;">✅ 通过: ${results.passed}</span> | 
                    <span style="color: red;">❌ 失败: ${results.failed}</span> | 
                    <span style="color: orange;">⚠️ 警告: ${results.warnings}</span>
                </div>
                <div style="margin: 10px 0;">
                    <strong>成功率: ${(results.passed / results.tests.length * 100).toFixed(1)}%</strong>
                </div>
                <details style="margin: 10px 0;">
                    <summary>查看详细结果</summary>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        ${results.tests.map(test => {
                            const icon = test.type === 'success' ? '✅' : test.type === 'error' ? '❌' : '⚠️';
                            return `<li>${icon} ${test.message}</li>`;
                        }).join('')}
                    </ul>
                </details>
            </div>
        `;
        container.innerHTML = resultHTML;
    }

    // 导出验证函数供外部调用
    window.verifyAdminHeaderFooterIntegration = runVerification;

})();
