// 通用兼容性加载器
// 自动检测环境并加载相应的兼容性脚本和样式

(function() {
    'use strict';

    console.log('🚀 通用兼容性加载器启动...');

    // 检测浏览器环境
    const env = {
        isWechat: /micromessenger/i.test(navigator.userAgent),
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
        isAndroid: /android/i.test(navigator.userAgent),
        isMobile: /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent),
        isGitHubPages: window.location.hostname.includes('github.io')
    };

    // 记录环境信息
    console.log('📱 环境检测结果:', {
        微信浏览器: env.isWechat,
        iOS设备: env.isIOS,
        Android设备: env.isAndroid,
        移动设备: env.isMobile,
        GitHub_Pages: env.isGitHubPages
    });

    // 动态加载CSS文件
    function loadCSS(href) {
        return new Promise((resolve, reject) => {
            // 检查是否已加载
            const existing = document.querySelector(`link[href="${href}"]`);
            if (existing) {
                console.log(`✅ CSS已存在: ${href}`);
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => {
                console.log(`✅ CSS加载成功: ${href}`);
                resolve();
            };
            link.onerror = () => {
                console.warn(`⚠️ CSS加载失败: ${href}`);
                reject(new Error(`Failed to load CSS: ${href}`));
            };
            document.head.appendChild(link);
        });
    }

    // 动态加载JavaScript文件
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            // 检查是否已加载
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                console.log(`✅ 脚本已存在: ${src}`);
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log(`✅ 脚本加载成功: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.warn(`⚠️ 脚本加载失败: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    // 加载兼容性资源
    async function loadCompatibilityResources() {
        const resources = [];

        // iOS兼容性
        if (env.isIOS) {
            resources.push(
                loadCSS('css/ios-compatibility.css?v=20240810'),
                loadScript('js/ios-compatibility.js')
            );
        }

        // 微信浏览器兼容性
        if (env.isWechat) {
            resources.push(
                loadCSS('css/wechat-compatibility.css?v=20241218'),
                loadScript('js/wechat-compatibility.js')
            );
        }

        // 等待所有资源加载完成
        try {
            await Promise.all(resources);
            console.log('✅ 所有兼容性资源加载完成');
            
            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('compatibilityReady', {
                detail: env
            }));
        } catch (error) {
            console.error('❌ 部分兼容性资源加载失败:', error);
        }
    }

    // 初始化
    function init() {
        // 如果已经手动加载了兼容性脚本，则跳过
        if (window.compatibilityLoaderDisabled) {
            console.log('⏭️ 兼容性加载器已禁用');
            return;
        }

        // 加载兼容性资源
        loadCompatibilityResources();

        // 设置全局环境信息
        window.browserEnv = env;
    }

    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('✅ 通用兼容性加载器已就绪');

})();

