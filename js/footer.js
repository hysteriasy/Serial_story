/**
 * 页脚组件模块
 * 独立的页脚组件，包含完整的HTML结构、CSS样式和JavaScript功能
 */
class FooterComponent {
    constructor() {
        this.isInitialized = false;
    }

    // 生成页脚HTML - 基于首页的页脚结构
    generateFooter() {
        return `
            <!-- 页脚 -->
            <footer class="footer">
                <div class="container">
                    <div class="footer-content">
                        <p>&copy; 2024 桑梓. 个人文学创作分享平台.</p>
                        <div class="footer-links">
                            <a href="#home" onclick="navigateToHome()">首页</a>
                            <a href="#about" onclick="navigateToAbout(event)">关于作者</a>
                            <a href="upload.html">上传作品</a>
                        </div>
                    </div>
                </div>
            </footer>

            <!-- 返回顶部按钮 -->
            <button id="backToTop" class="back-to-top" onclick="scrollToTop()">
                ↑
            </button>
        `;
    }

    // 初始化页脚
    init() {
        if (this.isInitialized) {
            console.log('⚠️ 页脚组件已初始化，跳过重复初始化');
            return;
        }

        console.log('🚀 开始初始化页脚组件...');
        
        // 注入必要的样式
        this.injectStyles();
        
        // 插入页脚
        this.insertFooter();
        
        // 初始化返回顶部功能
        this.initBackToTop();
        
        this.isInitialized = true;
        console.log('✅ 页脚组件初始化完成');
    }

    // 插入页脚
    insertFooter() {
        // 查找现有的页脚或在body末尾插入
        const existingFooter = document.querySelector('footer.footer');
        const existingBackToTop = document.getElementById('backToTop');
        
        if (existingFooter) {
            console.log('🔄 替换现有页脚');
            existingFooter.outerHTML = this.generateFooter();
        } else {
            console.log('➕ 插入新页脚');
            const footerHTML = this.generateFooter();
            document.body.insertAdjacentHTML('beforeend', footerHTML);
        }
        
        // 如果已存在返回顶部按钮，移除重复的
        if (existingBackToTop && !existingFooter) {
            existingBackToTop.remove();
        }
    }

    // 初始化返回顶部功能
    initBackToTop() {
        console.log('⬆️ 初始化返回顶部功能...');
        
        const backToTopBtn = document.getElementById('backToTop');
        
        if (!backToTopBtn) {
            console.warn('⚠️ 返回顶部按钮未找到');
            return;
        }

        const handleScroll = () => {
            const scrollTop = window.pageYOffset;
            
            if (scrollTop > 300) {
                backToTopBtn.style.display = 'block';
                backToTopBtn.style.opacity = '1';
            } else {
                backToTopBtn.style.opacity = '0';
                setTimeout(() => {
                    if (window.pageYOffset <= 300) {
                        backToTopBtn.style.display = 'none';
                    }
                }, 300);
            }
        };

        // 添加滚动监听
        window.addEventListener('scroll', handleScroll, { passive: true });

        // 为iOS设备添加触摸滚动支持
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            document.addEventListener('touchmove', handleScroll, { passive: true });
        }
        
        // 初始检查
        handleScroll();
        
        console.log('✅ 返回顶部功能初始化完成');
    }

    // 注入必要的CSS样式
    injectStyles() {
        // 检查是否已经注入过样式
        if (document.getElementById('footer-component-styles')) {
            return;
        }

        const styleElement = document.createElement('style');
        styleElement.id = 'footer-component-styles';
        styleElement.textContent = `
            /* 页脚样式 */
            .footer {
                background-color: #333;
                color: white;
                padding: 2rem 0;
                text-align: center;
                margin-top: auto;
            }

            .footer-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
            }

            .footer-links {
                display: flex;
                gap: 2rem;
            }

            .footer-links a {
                color: white;
                text-decoration: none;
                transition: color 0.3s ease;
            }

            .footer-links a:hover {
                color: #007bff;
            }

            /* 返回顶部按钮样式 */
            .back-to-top {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                color: white;
                border: none;
                border-radius: 50%;
                font-size: 1.2rem;
                font-weight: bold;
                cursor: pointer;
                display: none;
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
                z-index: 1000;
            }

            .back-to-top:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
                background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
            }

            .back-to-top:active {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .footer-content {
                    flex-direction: column;
                    gap: 1rem;
                }

                .footer-links {
                    gap: 1rem;
                }

                .back-to-top {
                    bottom: 20px;
                    right: 20px;
                    width: 45px;
                    height: 45px;
                    font-size: 1.1rem;
                }
            }

            @media (max-width: 480px) {
                .footer {
                    padding: 1.5rem 0;
                }

                .footer-content {
                    padding: 0 15px;
                }

                .footer-links {
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .back-to-top {
                    bottom: 15px;
                    right: 15px;
                    width: 40px;
                    height: 40px;
                    font-size: 1rem;
                }
            }
        `;
        
        document.head.appendChild(styleElement);
        console.log('✅ 页脚样式已注入');
    }
}

// 全局函数 - 滚动到顶部（如果不存在的话）
if (typeof scrollToTop === 'undefined') {
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// 全局函数 - 导航到首页
if (typeof navigateToHome === 'undefined') {
    function navigateToHome() {
        // 如果当前就在首页，直接滚动到顶部
        if (window.location.pathname === '/' || window.location.pathname.endsWith('/index.html') || window.location.pathname === '/index.html') {
            scrollToTop();
        } else {
            // 跳转到首页
            window.location.href = 'index.html';
        }
    }
}

// 全局函数 - 导航到关于作者区域
if (typeof navigateToAbout === 'undefined') {
    function navigateToAbout(event) {
        event.preventDefault(); // 阻止默认的锚点跳转

        // 如果当前就在首页，直接滚动到关于作者区域
        if (window.location.pathname === '/' || window.location.pathname.endsWith('/index.html') || window.location.pathname === '/index.html') {
            const aboutSection = document.getElementById('about');
            if (aboutSection) {
                aboutSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                console.warn('⚠️ 关于作者区域未找到');
            }
        } else {
            // 跳转到首页的关于作者区域
            window.location.href = 'index.html#about';
        }
    }
}

// 自动初始化（如果页面包含此脚本）
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否需要自动初始化页脚
    const autoInit = document.querySelector('meta[name="auto-footer"]');
    if (autoInit && autoInit.content === 'true') {
        window.footerComponent = new FooterComponent();
        window.footerComponent.init();
        console.log('🎯 页脚自动初始化完成');
    }
});

// 提供手动初始化函数
function initFooter() {
    if (!window.footerComponent) {
        window.footerComponent = new FooterComponent();
    }
    window.footerComponent.init();
    return window.footerComponent;
}

// 导出类供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FooterComponent;
} else {
    window.FooterComponent = FooterComponent;
    window.initFooter = initFooter;
}
