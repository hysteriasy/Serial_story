// 微信浏览器兼容性检测和修复
// 专门处理微信内置浏览器的特殊问题

(function() {
    'use strict';

    // 检测是否为微信浏览器
    function isWechat() {
        const ua = navigator.userAgent.toLowerCase();
        return /micromessenger/.test(ua);
    }

    // 检测微信版本
    function getWechatVersion() {
        const ua = navigator.userAgent.toLowerCase();
        const match = ua.match(/micromessenger\/(\d+\.\d+\.\d+)/);
        return match ? match[1] : null;
    }

    // 检测操作系统
    function getOS() {
        const ua = navigator.userAgent;
        if (/android/i.test(ua)) return 'android';
        if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
        return 'unknown';
    }

    // 微信浏览器环境信息
    const wechatEnv = {
        isWechat: isWechat(),
        version: getWechatVersion(),
        os: getOS(),
        ua: navigator.userAgent
    };

    // 如果不是微信浏览器，直接返回
    if (!wechatEnv.isWechat) {
        console.log('🌐 非微信浏览器环境');
        return;
    }

    console.log('💬 检测到微信浏览器环境');
    console.log('📱 微信版本:', wechatEnv.version);
    console.log('🖥️ 操作系统:', wechatEnv.os);

    // 1. 修复微信浏览器的localStorage问题
    function fixWechatStorage() {
        try {
            // 测试localStorage是否可用
            const testKey = '__wechat_storage_test__';
            localStorage.setItem(testKey, 'test');
            const result = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            if (result === 'test') {
                console.log('✅ 微信浏览器localStorage可用');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ 微信浏览器localStorage不可用，使用内存存储');
            
            // 创建内存存储替代方案
            window.wechatMemoryStorage = {};
            
            // 重写localStorage方法
            const memoryStorage = {
                getItem: function(key) {
                    return window.wechatMemoryStorage[key] || null;
                },
                setItem: function(key, value) {
                    window.wechatMemoryStorage[key] = String(value);
                },
                removeItem: function(key) {
                    delete window.wechatMemoryStorage[key];
                },
                clear: function() {
                    window.wechatMemoryStorage = {};
                }
            };
            
            // 保存原始localStorage引用
            window._originalLocalStorage = window.localStorage;
            
            // 使用内存存储
            Object.defineProperty(window, 'localStorage', {
                value: memoryStorage,
                writable: false
            });
            
            return false;
        }
    }

    // 2. 修复微信浏览器的HTTPS证书问题
    function fixWechatHTTPS() {
        // 微信浏览器对GitHub Pages的HTTPS支持通常没问题
        // 但需要确保所有资源都使用HTTPS
        const protocol = window.location.protocol;
        
        if (protocol === 'http:') {
            console.warn('⚠️ 检测到HTTP协议，微信浏览器可能阻止部分功能');
            console.log('💡 建议使用HTTPS访问');
        } else {
            console.log('✅ 使用HTTPS协议，符合微信浏览器要求');
        }
    }

    // 3. 修复微信浏览器的跨域问题
    function fixWechatCORS() {
        // 微信浏览器对跨域请求有特殊限制
        // 确保所有API请求都正确处理CORS
        
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            // 为所有请求添加必要的CORS头
            const newOptions = {
                ...options,
                mode: options.mode || 'cors',
                credentials: options.credentials || 'omit'
            };
            
            return originalFetch(url, newOptions).catch(error => {
                console.warn('🌐 微信浏览器网络请求失败:', error);
                throw error;
            });
        };
        
        console.log('✅ 微信浏览器CORS修复已应用');
    }

    // 4. 修复微信浏览器的视口问题
    function fixWechatViewport() {
        // 微信浏览器有自己的顶部栏，需要调整视口
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        
        // 微信浏览器特有的orientationchange事件
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
        
        console.log('✅ 微信浏览器视口修复已应用');
    }

    // 5. 修复微信浏览器的触摸事件
    function fixWechatTouch() {
        // 微信浏览器的触摸事件处理
        document.addEventListener('touchstart', function() {}, { passive: true });

        // 防止微信浏览器的长按菜单
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        }, false);

        console.log('✅ 微信浏览器触摸事件修复已应用');
    }

    // 6. 修复微信浏览器的字体渲染
    function fixWechatFonts() {
        // 微信浏览器使用系统字体
        document.body.style.fontFamily = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
        document.body.style.webkitFontSmoothing = 'antialiased';

        console.log('✅ 微信浏览器字体修复已应用');
    }

    // 7. 修复微信浏览器的图片加载
    function fixWechatImages() {
        // 微信浏览器对图片加载有特殊处理
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // 添加加载错误处理
            img.addEventListener('error', function() {
                console.warn('⚠️ 图片加载失败:', this.src);
                // 可以设置默认图片
                // this.src = 'path/to/default-image.jpg';
            });

            // 懒加载优化
            if ('loading' in HTMLImageElement.prototype) {
                img.loading = 'lazy';
            }
        });

        console.log('✅ 微信浏览器图片加载修复已应用');
    }

    // 8. 修复微信浏览器的音频/视频播放
    function fixWechatMedia() {
        // 微信浏览器需要用户交互才能播放音视频
        const videos = document.querySelectorAll('video');
        const audios = document.querySelectorAll('audio');

        [...videos, ...audios].forEach(media => {
            media.setAttribute('playsinline', '');
            media.setAttribute('webkit-playsinline', '');
            media.setAttribute('x5-playsinline', ''); // 腾讯X5内核
            media.setAttribute('x5-video-player-type', 'h5');
            media.setAttribute('x5-video-player-fullscreen', 'false');
        });

        console.log('✅ 微信浏览器媒体播放修复已应用');
    }

    // 9. 修复微信浏览器的页面缓存
    function fixWechatCache() {
        // 微信浏览器有强缓存，需要处理页面刷新
        window.addEventListener('pageshow', function(event) {
            if (event.persisted) {
                console.log('🔄 从微信浏览器缓存恢复页面');
                // 重新初始化必要的功能
                window.location.reload();
            }
        });

        console.log('✅ 微信浏览器缓存处理已应用');
    }

    // 10. 修复微信浏览器的分享功能
    function setupWechatShare() {
        // 微信分享需要使用微信JS-SDK
        // 这里提供基础的分享信息设置

        // 设置页面标题和描述
        const title = document.title || '桑梓 - 个人分享平台';
        const description = document.querySelector('meta[name="description"]')?.content ||
                          '个人文学创作作品展示和分享网站';

        // 微信分享配置（需要后端支持获取签名）
        window.wechatShareConfig = {
            title: title,
            desc: description,
            link: window.location.href,
            imgUrl: window.location.origin + '/favicon.ico'
        };

        console.log('✅ 微信分享配置已设置');
    }

    // 11. 检测微信浏览器的网络状态
    function checkWechatNetwork() {
        // 检测网络连接
        const isOnline = navigator.onLine;

        if (!isOnline) {
            console.warn('⚠️ 微信浏览器检测到离线状态');
            showWechatOfflineMessage();
        }

        // 监听网络状态变化
        window.addEventListener('online', function() {
            console.log('✅ 微信浏览器网络已恢复');
            hideWechatOfflineMessage();
        });

        window.addEventListener('offline', function() {
            console.warn('⚠️ 微信浏览器网络已断开');
            showWechatOfflineMessage();
        });

        // 检测 GitHub Pages 连接问题
        checkGitHubPagesConnection();
    }

    // 检测 GitHub Pages 连接
    function checkGitHubPagesConnection() {
        // 延迟检测，等待页面加载
        setTimeout(() => {
            const testUrl = window.location.origin + '/favicon.ico?t=' + Date.now();

            fetch(testUrl, {
                method: 'HEAD',
                cache: 'no-cache',
                mode: 'no-cors'
            })
            .then(() => {
                console.log('✅ GitHub Pages 连接正常');
            })
            .catch(error => {
                console.warn('⚠️ GitHub Pages 连接可能存在问题:', error);
                // 显示连接引导（仅在微信浏览器中）
                if (wechatEnv.isWechat) {
                    showConnectionGuide();
                }
            });
        }, 2000);
    }

    // 显示连接引导
    function showConnectionGuide() {
        const guide = document.createElement('div');
        guide.id = 'wechat-connection-guide';
        guide.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10001;
            max-width: 90%;
            width: 400px;
            text-align: center;
        `;

        guide.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">🌐</div>
            <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">连接提示</h3>
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                检测到网络连接可能存在问题。<br>
                建议您点击右上角 "···" 菜单，<br>
                选择 "在浏览器中打开" 以获得更好的体验。
            </p>
            <button onclick="document.getElementById('wechat-connection-guide').remove()"
                    style="background: #667eea; color: white; border: none; padding: 12px 30px;
                           border-radius: 8px; font-size: 14px; cursor: pointer; width: 100%; margin-bottom: 10px;">
                我知道了
            </button>
            <button onclick="window.location.href='wechat-guide.html'"
                    style="background: #28a745; color: white; border: none; padding: 12px 30px;
                           border-radius: 8px; font-size: 14px; cursor: pointer; width: 100%;">
                查看详细引导
            </button>
        `;

        document.body.appendChild(guide);

        // 10秒后自动关闭
        setTimeout(() => {
            const guideElement = document.getElementById('wechat-connection-guide');
            if (guideElement) {
                guideElement.remove();
            }
        }, 10000);
    }

    // 显示离线消息
    function showWechatOfflineMessage() {
        let offlineMsg = document.getElementById('wechat-offline-message');

        if (!offlineMsg) {
            offlineMsg = document.createElement('div');
            offlineMsg.id = 'wechat-offline-message';
            offlineMsg.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ff9800;
                color: white;
                text-align: center;
                padding: 10px;
                z-index: 99999;
                font-size: 14px;
            `;
            offlineMsg.textContent = '⚠️ 网络连接已断开，部分功能可能无法使用';
            document.body.appendChild(offlineMsg);
        }

        offlineMsg.style.display = 'block';
    }

    // 隐藏离线消息
    function hideWechatOfflineMessage() {
        const offlineMsg = document.getElementById('wechat-offline-message');
        if (offlineMsg) {
            offlineMsg.style.display = 'none';
        }
    }

    // 12. 微信浏览器调试信息
    function showWechatDebugInfo() {
        // 仅在URL包含debug参数时显示
        if (window.location.search.includes('debug=true')) {
            const debugInfo = document.createElement('div');
            debugInfo.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.8);
                color: #0f0;
                padding: 10px;
                font-family: monospace;
                font-size: 12px;
                z-index: 99999;
                max-height: 200px;
                overflow-y: auto;
            `;

            debugInfo.innerHTML = `
                <div><strong>微信浏览器调试信息</strong></div>
                <div>版本: ${wechatEnv.version}</div>
                <div>系统: ${wechatEnv.os}</div>
                <div>UA: ${wechatEnv.ua}</div>
                <div>视口: ${window.innerWidth}x${window.innerHeight}</div>
                <div>协议: ${window.location.protocol}</div>
                <div>在线: ${navigator.onLine ? '是' : '否'}</div>
                <div>localStorage: ${testLocalStorageAvailable() ? '可用' : '不可用'}</div>
            `;

            document.body.appendChild(debugInfo);
        }
    }

    // 测试localStorage可用性
    function testLocalStorageAvailable() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    // 初始化所有微信浏览器修复
    function initWechatFixes() {
        console.log('🚀 开始初始化微信浏览器兼容性修复...');

        try {
            fixWechatStorage();
            fixWechatHTTPS();
            fixWechatCORS();
            fixWechatViewport();
            fixWechatTouch();
            fixWechatFonts();
            fixWechatImages();
            fixWechatMedia();
            fixWechatCache();
            setupWechatShare();
            checkWechatNetwork();
            showWechatDebugInfo();

            console.log('✅ 微信浏览器兼容性修复已全部应用');

            // 触发自定义事件，通知其他脚本微信环境已就绪
            window.dispatchEvent(new CustomEvent('wechatReady', {
                detail: wechatEnv
            }));

        } catch (error) {
            console.error('❌ 微信浏览器兼容性修复失败:', error);
        }
    }

    // DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWechatFixes);
    } else {
        initWechatFixes();
    }

    // 页面完全加载后再次检查
    window.addEventListener('load', function() {
        setTimeout(() => {
            // 再次检查关键功能
            fixWechatImages();
            fixWechatMedia();
        }, 100);
    });

    // 导出微信环境信息
    window.wechatEnv = wechatEnv;

})();

