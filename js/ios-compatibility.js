// iOS Safari 兼容性修复 JavaScript

(function() {
    'use strict';

    // 检测是否为iOS设备
    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    // 检测是否为Safari浏览器
    function isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }

    // iOS Safari特定修复
    if (isIOS() && isSafari()) {
        console.log('🍎 检测到iOS Safari，应用兼容性修复...');

        // 1. 修复iOS Safari中的100vh问题
        function fixViewportHeight() {
            const setVH = () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            };
            
            setVH();
            window.addEventListener('resize', setVH);
            window.addEventListener('orientationchange', () => {
                setTimeout(setVH, 100);
            });
        }

        // 2. 修复iOS Safari中的点击延迟问题
        function fixTouchDelay() {
            // 添加FastClick功能的简化版本
            document.addEventListener('touchstart', function() {}, { passive: true });
            
            // 为所有可点击元素添加touch事件
            const clickableElements = document.querySelectorAll('a, button, .btn, .nav-link, .category-link');
            clickableElements.forEach(element => {
                element.addEventListener('touchstart', function() {
                    this.style.opacity = '0.7';
                }, { passive: true });
                
                element.addEventListener('touchend', function() {
                    this.style.opacity = '';
                }, { passive: true });
            });
        }

        // 3. 修复iOS Safari中的滚动问题
        function fixScrolling() {
            // 为模态框和滚动容器添加-webkit-overflow-scrolling
            const scrollContainers = document.querySelectorAll('.modal, .essays-content, .novels-content');
            scrollContainers.forEach(container => {
                container.style.webkitOverflowScrolling = 'touch';
            });

            // 修复iOS Safari中的滚动回弹问题
            document.body.addEventListener('touchmove', function(e) {
                if (e.target === document.body) {
                    e.preventDefault();
                }
            }, { passive: false });
        }

        // 4. 修复iOS Safari中的输入框问题
        function fixInputs() {
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                // 防止iOS自动缩放
                input.style.fontSize = '16px';
                
                // 修复iOS Safari中的输入框焦点问题
                input.addEventListener('focus', function() {
                    setTimeout(() => {
                        this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                });
            });
        }

        // 5. 修复iOS Safari中的动画性能问题
        function optimizeAnimations() {
            // 为动画元素添加硬件加速
            const animatedElements = document.querySelectorAll(
                '.welcome-animation, .category-card, .project-card, .btn'
            );
            
            animatedElements.forEach(element => {
                element.style.webkitTransform = 'translateZ(0)';
                element.style.webkitBackfaceVisibility = 'hidden';
                element.style.willChange = 'transform';
            });
        }

        // 6. 修复iOS Safari中的事件处理
        function fixEventHandling() {
            // 为触摸事件添加passive监听器
            const touchElements = document.querySelectorAll('a, button, .btn');
            touchElements.forEach(element => {
                element.addEventListener('touchstart', function(e) {
                    // 添加触摸反馈
                    this.classList.add('touching');
                }, { passive: true });
                
                element.addEventListener('touchend', function(e) {
                    // 移除触摸反馈
                    setTimeout(() => {
                        this.classList.remove('touching');
                    }, 150);
                }, { passive: true });
            });
        }

        // 7. 修复iOS Safari中的字体渲染问题
        function fixFontRendering() {
            // 确保字体平滑渲染
            document.body.style.webkitFontSmoothing = 'antialiased';
            document.body.style.mozOsxFontSmoothing = 'grayscale';
        }

        // 8. 修复iOS Safari中的backdrop-filter问题
        function fixBackdropFilter() {
            // 检查是否支持backdrop-filter
            if (!CSS.supports('backdrop-filter', 'blur(10px)') && 
                !CSS.supports('-webkit-backdrop-filter', 'blur(10px)')) {
                
                // 为不支持backdrop-filter的情况提供fallback
                const backdropElements = document.querySelectorAll('.modal, .nav-dropdown-menu');
                backdropElements.forEach(element => {
                    element.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                });
            }
        }

        // 9. IntersectionObserver polyfill for older iOS versions
        function addIntersectionObserverPolyfill() {
            if (!window.IntersectionObserver) {
                console.log('🔧 添加IntersectionObserver polyfill...');
                
                // 简化的IntersectionObserver polyfill
                window.IntersectionObserver = function(callback, options) {
                    this.callback = callback;
                    this.options = options || {};
                    this.elements = [];
                };
                
                window.IntersectionObserver.prototype.observe = function(element) {
                    this.elements.push(element);
                    // 立即触发回调，假设元素可见
                    this.callback([{
                        target: element,
                        isIntersecting: true
                    }]);
                };
                
                window.IntersectionObserver.prototype.unobserve = function(element) {
                    const index = this.elements.indexOf(element);
                    if (index > -1) {
                        this.elements.splice(index, 1);
                    }
                };
            }
        }

        // 10. 修复iOS Safari中的模态框问题
        function fixModals() {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.addEventListener('touchmove', function(e) {
                    e.stopPropagation();
                }, { passive: true });
            });
        }

        // 初始化所有修复
        function initIOSFixes() {
            try {
                fixViewportHeight();
                fixTouchDelay();
                fixScrolling();
                fixInputs();
                optimizeAnimations();
                fixEventHandling();
                fixFontRendering();
                fixBackdropFilter();
                addIntersectionObserverPolyfill();
                fixModals();
                
                console.log('✅ iOS Safari兼容性修复已应用');
            } catch (error) {
                console.error('❌ iOS兼容性修复失败:', error);
            }
        }

        // DOM加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initIOSFixes);
        } else {
            initIOSFixes();
        }

        // 页面完全加载后再次检查
        window.addEventListener('load', function() {
            setTimeout(initIOSFixes, 100);
        });

    } else {
        console.log('🖥️ 非iOS Safari环境，跳过iOS特定修复');
    }

    // 通用移动端优化（适用于所有移动设备）
    if (window.innerWidth <= 768) {
        console.log('📱 应用移动端通用优化...');
        
        // 优化触摸滚动
        document.body.style.webkitOverflowScrolling = 'touch';
        
        // 禁用双击缩放
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

})();
