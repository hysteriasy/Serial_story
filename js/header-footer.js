/**
 * 页眉页脚统一组件模块
 * 基于首页的完整功能重新设计，确保所有特性都能正常工作
 */
class HeaderFooterManager {
    constructor() {
        this.currentPage = this.getCurrentPageName();
        this.isInitialized = false;
    }

    // 获取当前页面名称
    getCurrentPageName() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('.html', '') || 'index';
    }

    // 生成导航栏HTML - 完全基于首页的导航结构
    generateHeader() {
        return `
            <!-- 导航栏 -->
            <nav class="navbar">
                <div class="nav-container">
                    <div class="nav-logo">
                        <h2>桑梓</h2>
                    </div>
                    <ul class="nav-menu">
                        <li class="nav-item">
                            <a href="#home" class="nav-link ${this.currentPage === 'index' ? 'active' : ''}" onclick="navigateToHome(event)">首页</a>
                        </li>
                        <li class="nav-item">
                            <a href="#about" class="nav-link" onclick="navigateToAbout(event)">关于我</a>
                        </li>
                        <li class="nav-item nav-dropdown">
                            <a href="#" class="nav-link dropdown-trigger">作品展示 ▼</a>
                            <div class="nav-dropdown-menu">
                                <a href="essays.html" class="nav-dropdown-link">生活随笔</a>
                                <a href="poetry.html" class="nav-dropdown-link">诗歌创作</a>
                                <a href="novels.html" class="nav-dropdown-link">小说连载</a>
                                <a href="artworks.html" class="nav-dropdown-link">绘画作品</a>
                                <a href="music.html" class="nav-dropdown-link">音乐作品</a>
                                <a href="videos.html" class="nav-dropdown-link">视频作品</a>
                            </div>
                        </li>
                        <li class="nav-item">
                            <a href="upload.html" class="nav-link" id="uploadBtn">作品上传</a>
                        </li>
                        <li class="nav-item">
                            <a href="#contact" class="nav-link" onclick="navigateToContact(event)">联系我</a>
                        </li>
                        <li class="nav-item" id="authNavItem">
                            <a href="#" class="nav-link" id="authNavLink" onclick="showLoginModal()">登录</a>
                        </li>
                    </ul>
                    <div class="nav-toggle" id="mobile-menu">
                        <span class="bar"></span>
                        <span class="bar"></span>
                        <span class="bar"></span>
                    </div>
                </div>
            </nav>
        `;
    }

    // 生成页脚HTML - 基于首页的简洁页脚结构
    generateFooter() {
        return `
            <!-- 页脚 -->
            <footer class="footer">
                <div class="container">
                    <div class="footer-content">
                        <p>&copy; 2024 桑梓. 个人文学创作分享平台.</p>
                        <div class="footer-links">
                            <a href="#home" onclick="navigateToHome(event)">首页</a>
                            <a href="#about" onclick="navigateToAbout(event)">关于作者</a>
                        </div>
                    </div>
                </div>
            </footer>
        `;
    }

    // 初始化页眉页脚
    init() {
        if (this.isInitialized) {
            console.log('⚠️ 页眉页脚组件已初始化，跳过重复初始化');
            return;
        }

        console.log('🚀 开始初始化页眉页脚组件...');

        // 注入必要的样式
        this.injectStyles();

        // 插入页眉页脚
        this.insertHeader();
        this.insertFooter();

        // 初始化各种功能
        this.initializeNavigation();
        this.initializeModals();
        this.initializeUserInfo();

        this.isInitialized = true;
        console.log('✅ 页眉页脚组件初始化完成');
    }

    // 插入页眉
    insertHeader() {
        // 查找现有的导航栏或在body开头插入
        const existingNav = document.querySelector('nav.navbar');
        if (existingNav) {
            console.log('🔄 替换现有导航栏');
            existingNav.outerHTML = this.generateHeader();
        } else {
            console.log('➕ 插入新导航栏');
            const headerHTML = this.generateHeader();
            document.body.insertAdjacentHTML('afterbegin', headerHTML);
        }
    }

    // 插入页脚
    insertFooter() {
        // 查找现有的页脚或在body末尾插入
        const existingFooter = document.querySelector('footer.footer');
        if (existingFooter) {
            console.log('🔄 替换现有页脚');
            existingFooter.outerHTML = this.generateFooter();
        } else {
            console.log('➕ 插入新页脚');
            const footerHTML = this.generateFooter();
            document.body.insertAdjacentHTML('beforeend', footerHTML);
        }
    }

    // 初始化导航功能
    initializeNavigation() {
        console.log('🧭 初始化导航功能...');

        // 初始化移动端菜单
        this.initMobileMenu();

        // 初始化平滑滚动
        this.initSmoothScrolling();

        // 初始化滚动效果
        this.initScrollEffects();

        // 初始化移动端触摸优化
        this.initMobileTouchOptimization();

        // 处理URL中的hash锚点
        this.handleUrlHash();

        // 等待auth系统加载
        this.waitForAuth(() => {
            this.updateAuthNavigation();
        });
    }

    // 等待auth系统加载
    waitForAuth(callback, attempts = 0) {
        const maxAttempts = 20; // 最多等待10秒

        if (typeof auth !== 'undefined' && auth.currentUser !== undefined) {
            console.log('✅ Auth系统已加载');
            callback();
        } else if (attempts < maxAttempts) {
            setTimeout(() => {
                this.waitForAuth(callback, attempts + 1);
            }, 500);
        } else {
            console.warn('⚠️ Auth系统加载超时，使用默认导航状态');
            callback();
        }
    }

    // 更新认证导航状态
    updateAuthNavigation() {
        console.log('🔄 更新认证导航状态...');

        const authNavLink = document.getElementById('authNavLink');
        const userInfoDisplay = document.getElementById('userInfoDisplay');

        if (!authNavLink) {
            console.warn('⚠️ 认证导航链接未找到');
            return;
        }

        if (typeof auth !== 'undefined' && auth.currentUser) {
            console.log('👤 用户已登录:', auth.currentUser.username);

            // 更新导航链接显示用户名
            authNavLink.textContent = auth.currentUser.username;
            authNavLink.style.color = '#28a745'; // 绿色表示已登录
            authNavLink.style.fontWeight = 'bold';

            // 更改点击事件为显示用户信息
            authNavLink.onclick = () => {
                if (userInfoDisplay) {
                    const display = userInfoDisplay.style.display;
                    userInfoDisplay.style.display = display === 'none' ? 'block' : 'none';
                }
            };

            // 如果是管理员，使用红色
            if (auth.isAdmin && auth.isAdmin()) {
                authNavLink.style.color = '#dc3545'; // 红色表示管理员
            }

        } else {
            console.log('👤 用户未登录');

            // 恢复登录状态
            authNavLink.textContent = '登录';
            authNavLink.style.color = '';
            authNavLink.style.fontWeight = '';
            authNavLink.onclick = () => {
                if (typeof showLoginModal === 'function') {
                    showLoginModal();
                } else {
                    console.warn('⚠️ showLoginModal 函数未找到');
                }
            };

            if (userInfoDisplay) {
                userInfoDisplay.style.display = 'none';
            }
        }
    }

    // 初始化移动端菜单
    initMobileMenu() {
        console.log('📱 初始化移动端菜单...');

        const mobileMenu = document.getElementById('mobile-menu');
        const navMenu = document.querySelector('.nav-menu');

        if (mobileMenu && navMenu) {
            // 添加触摸事件支持
            const toggleMenu = () => {
                mobileMenu.classList.toggle('active');
                navMenu.classList.toggle('active');
            };

            mobileMenu.addEventListener('click', toggleMenu);
            mobileMenu.addEventListener('touchend', function(e) {
                e.preventDefault();
                toggleMenu();
            }, { passive: false });

            // 点击菜单项时关闭移动端菜单
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                const closeMenu = () => {
                    mobileMenu.classList.remove('active');
                    navMenu.classList.remove('active');
                };

                link.addEventListener('click', closeMenu);
                link.addEventListener('touchend', closeMenu, { passive: true });
            });

            console.log('✅ 移动端菜单初始化完成');
        } else {
            console.warn('⚠️ 移动端菜单元素未找到');
        }
    }

    // 初始化滚动效果
    initScrollEffects() {
        console.log('📜 初始化滚动效果...');

        const navbar = document.querySelector('.navbar');
        const backToTopBtn = document.getElementById('backToTop');

        if (!navbar && !backToTopBtn) {
            console.log('ℹ️ 没有需要滚动效果的元素');
            return;
        }

        const handleScroll = () => {
            const scrollTop = window.pageYOffset;

            // 导航栏滚动效果
            if (navbar) {
                if (scrollTop > 100) {
                    navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                    navbar.style.backdropFilter = 'blur(10px)';
                    navbar.style.webkitBackdropFilter = 'blur(10px)';
                } else {
                    navbar.style.backgroundColor = '#fff';
                    navbar.style.backdropFilter = 'none';
                    navbar.style.webkitBackdropFilter = 'none';
                }
            }

            // 返回顶部按钮
            if (backToTopBtn) {
                if (scrollTop > 300) {
                    backToTopBtn.style.display = 'block';
                } else {
                    backToTopBtn.style.display = 'none';
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // 为iOS设备添加触摸滚动支持
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            document.addEventListener('touchmove', handleScroll, { passive: true });
        }

        console.log('✅ 滚动效果初始化完成');
    }

    // 初始化移动端触摸优化
    initMobileTouchOptimization() {
        console.log('📱 初始化移动端触摸优化...');

        // 检测是否为触摸设备
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (!isTouchDevice) {
            console.log('🖥️ 非触摸设备，跳过触摸优化');
            return;
        }

        // 优化下拉菜单的触摸交互
        const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
        dropdownTriggers.forEach(trigger => {
            const dropdown = trigger.closest('.nav-dropdown');
            const menu = dropdown.querySelector('.nav-dropdown-menu');

            if (dropdown && menu) {
                // 移除hover效果，改为点击切换
                trigger.addEventListener('touchstart', function(e) {
                    e.preventDefault();

                    // 关闭其他下拉菜单
                    document.querySelectorAll('.nav-dropdown.active').forEach(activeDropdown => {
                        if (activeDropdown !== dropdown) {
                            activeDropdown.classList.remove('active');
                        }
                    });

                    // 切换当前下拉菜单
                    dropdown.classList.toggle('active');
                }, { passive: false });
            }
        });

        // 点击外部区域关闭下拉菜单
        document.addEventListener('touchstart', function(e) {
            if (!e.target.closest('.nav-dropdown')) {
                document.querySelectorAll('.nav-dropdown.active').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        }, { passive: true });

        // 优化触摸反馈
        const touchElements = document.querySelectorAll('.nav-link, .btn, .nav-toggle');
        touchElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.opacity = '0.7';
                this.style.transform = 'scale(0.98)';
            }, { passive: true });

            element.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.style.opacity = '';
                    this.style.transform = '';
                }, 150);
            }, { passive: true });

            element.addEventListener('touchcancel', function() {
                this.style.opacity = '';
                this.style.transform = '';
            }, { passive: true });
        });

        // 防止iOS Safari的双击缩放
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        console.log('✅ 移动端触摸优化初始化完成');
    }

    // 初始化平滑滚动
    initSmoothScrolling() {
        console.log('🎯 初始化平滑滚动...');

        // 注意：主要的导航链接现在使用 onclick 处理函数（navigateToHome, navigateToAbout, navigateToContact）
        // 这里只处理其他可能的锚点链接
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]:not([onclick])');

        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    // 如果目标元素存在于当前页面，使用平滑滚动
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        console.log('✅ 平滑滚动初始化完成');
    }

    // 处理URL中的hash锚点
    handleUrlHash() {
        console.log('🔗 处理URL hash锚点...');

        // 检查URL中是否有hash
        if (window.location.hash) {
            const targetId = window.location.hash.substring(1);
            console.log('📍 检测到URL hash:', targetId);

            // 延迟执行，确保页面元素已加载
            setTimeout(() => {
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    console.log('✅ 找到目标元素，滚动到:', targetId);
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                } else {
                    console.warn('⚠️ 未找到目标元素:', targetId);
                }
            }, 500); // 延迟500ms确保页面完全加载
        }
    }

    // 初始化模态框
    initializeModals() {
        console.log('🔲 初始化模态框...');

        // 检查是否已存在登录模态框
        if (!document.getElementById('loginModal')) {
            this.createLoginModal();
        }

        console.log('✅ 模态框初始化完成');
    }

    // 创建登录模态框
    createLoginModal() {
        const modalHTML = `
            <!-- 登录模态框 -->
            <div id="loginModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <span class="close-btn" onclick="closeLoginModal()">&times;</span>
                    <h3>用户登录</h3>
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="loginUsername">用户名</label>
                            <input type="text" id="loginUsername" class="form-control" placeholder="请输入用户名" required>
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">密码</label>
                            <input type="password" id="loginPassword" class="form-control" placeholder="请输入密码" required>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">登录</button>
                            <button type="button" class="btn btn-secondary" onclick="closeLoginModal()">取消</button>
                        </div>
                    </form>
                    <div class="login-help">
                        <p><small>需要账户？请联系管理员获取登录凭据</small></p>
                        <p><small>忘记密码？请联系系统管理员重置</small></p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 初始化用户信息显示
    initializeUserInfo() {
        console.log('👤 初始化用户信息显示...');

        // 检查是否已存在用户信息显示区域
        if (!document.getElementById('userInfoDisplay')) {
            this.createUserInfoDisplay();
        }

        console.log('✅ 用户信息显示初始化完成');
    }

    // 创建用户信息显示区域
    createUserInfoDisplay() {
        const userInfoHTML = `
            <!-- 用户信息显示区域 -->
            <div id="userInfoDisplay" style="display: none; position: fixed; top: 80px; right: 20px; background: rgba(255,255,255,0.98); padding: 20px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); z-index: 1000; min-width: 200px;">
                <div id="userInfoContent"></div>
                <button id="logoutButton" onclick="logout()" style="
                    width: 100%;
                    margin-top: 15px;
                    padding: 10px 16px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                    position: relative;
                    overflow: hidden;
                ">
                    <span style="position: relative; z-index: 1;">退出登录</span>
                </button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', userInfoHTML);
    }

    // 注入必要的CSS样式
    injectStyles() {
        // 检查是否已经注入过样式
        if (document.getElementById('header-footer-styles')) {
            return;
        }

        const styleElement = document.createElement('style');
        styleElement.id = 'header-footer-styles';
        styleElement.textContent = `
            /* 导航栏下拉菜单样式 */
            .nav-dropdown {
                position: relative;
            }

            .dropdown-trigger {
                cursor: pointer;
                transition: color 0.3s ease;
            }

            .nav-dropdown-menu {
                position: absolute;
                top: 100%;
                left: 0;
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                min-width: 180px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 1000;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
            }

            .nav-dropdown:hover .nav-dropdown-menu {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .nav-dropdown-link {
                display: block;
                padding: 12px 20px;
                color: #333;
                text-decoration: none;
                border-bottom: 1px solid #f0f0f0;
                transition: all 0.3s ease;
                font-size: 0.9rem;
            }

            .nav-dropdown-link:last-child {
                border-bottom: none;
                border-radius: 0 0 12px 12px;
            }

            .nav-dropdown-link:first-child {
                border-radius: 12px 12px 0 0;
            }

            .nav-dropdown-link:hover {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                transform: translateX(5px);
            }

            /* 移动端下拉菜单优化 */
            @media (max-width: 768px) {
                /* 移动端导航菜单滚动优化 */
                .nav-menu {
                    max-height: calc(100vh - 70px) !important;
                    overflow-y: auto !important;
                    overflow-x: hidden !important;
                    -webkit-overflow-scrolling: touch !important;
                    padding: 1rem 0 !important; /* 减少内边距 */
                }

                /* 移动端下拉菜单触发器样式 */
                .dropdown-trigger {
                    color: #333 !important; /* 移动端使用深色文字，与其他菜单项一致 */
                    display: block !important;
                    padding: 12px 20px !important; /* 减少内边距 */
                    font-size: 0.95rem !important;
                    line-height: 1.4 !important;
                }

                .dropdown-trigger:hover {
                    color: #007bff !important;
                }

                /* 移动端下拉菜单容器 - 始终展开显示 */
                .nav-dropdown-menu {
                    position: static !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                    transform: none !important;
                    box-shadow: none !important;
                    border: none !important;
                    background: #f8f9fa !important; /* 浅灰色背景区分子菜单 */
                    margin: 0 !important;
                    padding: 5px 0 !important; /* 减少内边距 */
                    display: block !important; /* 强制显示 */
                    border-radius: 0 !important;
                }

                /* 移动端下拉菜单链接 - 优化间距 */
                .nav-dropdown-link {
                    display: block !important;
                    padding: 10px 30px !important; /* 减少上下内边距，增加左侧缩进显示层级 */
                    border-bottom: 1px solid #e9ecef !important;
                    color: #555 !important; /* 深灰色文字 */
                    font-size: 0.9rem !important; /* 稍微减小字体 */
                    text-align: left !important;
                    line-height: 1.3 !important; /* 优化行高 */
                }

                .nav-dropdown-link:last-child {
                    border-bottom: none !important;
                }

                .nav-dropdown-link:hover,
                .nav-dropdown-link:active {
                    background: #e9ecef !important;
                    color: #007bff !important;
                    transform: none !important;
                }

                /* 当前页面高亮 */
                .nav-dropdown-link.current-page {
                    background: #e3f2fd !important;
                    color: #007bff !important;
                    font-weight: 600 !important;
                }

                /* 确保下拉菜单项在移动端菜单中可见 */
                .nav-dropdown {
                    width: 100% !important;
                }

                /* 移动端菜单项边框优化 */
                .nav-item.nav-dropdown {
                    border-bottom: none !important; /* 下拉菜单项不需要底部边框 */
                }

                /* 移动端登录按钮 - 确保可见 */
                #authNavItem {
                    display: block !important;
                    width: 100% !important;
                }

                #authNavLink {
                    display: block !important;
                    padding: 12px 20px !important; /* 与其他链接保持一致 */
                    color: #007bff !important;
                    font-weight: 600 !important;
                    text-align: center !important;
                    min-height: 44px !important;
                    font-size: 0.95rem !important;
                    line-height: 1.4 !important;
                }

                #authNavLink:hover {
                    background: #f0f7ff !important;
                    color: #0056b3 !important;
                }

                /* 移动端菜单项样式统一 */
                .nav-item {
                    display: block !important;
                    width: 100% !important;
                }

                .nav-link {
                    display: block !important;
                    width: 100% !important;
                    padding: 12px 20px !important; /* 统一内边距 */
                    font-size: 0.95rem !important;
                    line-height: 1.4 !important;
                }

                /* 移动端导航栏触摸优化 */
                .nav-toggle {
                    min-height: 44px;
                    min-width: 44px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                }

                .nav-link {
                    min-height: 44px;
                    display: flex;
                    align-items: center;
                    padding: 12px 20px;
                    -webkit-tap-highlight-color: transparent;
                }

                /* 移动端用户信息区域优化 */
                #userInfoDisplay {
                    position: fixed;
                    top: 70px;
                    left: 0;
                    right: 0;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    padding: 15px;
                    border-bottom: 1px solid #e9ecef;
                    z-index: 999;
                }
            }

            /* 触摸设备特定优化 */
            @media (hover: none) and (pointer: coarse) {
                .nav-dropdown:hover .nav-dropdown-menu {
                    opacity: 0;
                    visibility: hidden;
                }

                .nav-dropdown.active .nav-dropdown-menu {
                    opacity: 1;
                    visibility: visible;
                    transform: translateY(0);
                }

                .nav-dropdown-link {
                    padding: 16px 20px; /* 增大触摸目标 */
                }
            }

            /* 用户信息显示区域动画 */
            #userInfoDisplay {
                animation: slideInFromRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes slideInFromRight {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            /* 退出登录按钮样式 */
            #logoutButton::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.5s;
            }

            #logoutButton:hover::before {
                left: 100%;
            }

            #logoutButton:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
            }

            #logoutButton:active {
                transform: translateY(0);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
        `;

        document.head.appendChild(styleElement);
        console.log('✅ 页眉页脚样式已注入');
    }
}

// 全局函数 - 移动端菜单切换
function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const hamburger = document.querySelector('.hamburger');
    
    if (navMenu && hamburger) {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    }
}

// 全局函数 - 显示登录模态框
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        // 防止背景滚动
        document.body.style.overflow = 'hidden';
    } else {
        console.warn('⚠️ 登录模态框未找到');
    }
}

// 全局函数 - 关闭登录模态框
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
        // 恢复背景滚动
        document.body.style.overflow = 'auto';
    }
}

// 全局函数 - 退出登录
function logout() {
    if (typeof auth !== 'undefined' && auth.logout) {
        auth.logout();
        // 更新导航状态
        if (window.headerFooterManager) {
            window.headerFooterManager.updateAuthNavigation();
        }
        // 显示成功消息
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage('已退出登录');
        } else {
            alert('已退出登录');
        }
        // 跳转到首页
        if (window.location.pathname !== '/index.html' && !window.location.pathname.endsWith('/')) {
            window.location.href = 'index.html';
        }
    } else {
        alert('系统尚未初始化');
    }
}

// 全局函数 - 滚动到顶部
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 全局函数 - 滚动到指定区域
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 全局函数 - 导航到首页（跳过欢迎界面）
if (typeof navigateToHome === 'undefined') {
    function navigateToHome(event) {
        if (event) {
            event.preventDefault(); // 阻止默认的锚点跳转
        }

        // 如果当前就在首页，直接滚动到顶部并隐藏欢迎界面
        if (window.location.pathname === '/' ||
            window.location.pathname.endsWith('/index.html') ||
            window.location.pathname === '/index.html') {

            // 隐藏欢迎界面（如果存在）
            if (typeof hideWelcomeScreen === 'function') {
                hideWelcomeScreen();
            }

            // 滚动到顶部
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            // 跳转到首页，并添加参数跳过欢迎界面
            window.location.href = 'index.html?skipWelcome=true';
        }
    }
}

// 全局函数 - 导航到关于我区域
if (typeof navigateToAbout === 'undefined') {
    function navigateToAbout(event) {
        if (event) {
            event.preventDefault(); // 阻止默认的锚点跳转
        }

        // 如果当前就在首页，直接滚动到关于我区域
        if (window.location.pathname === '/' ||
            window.location.pathname.endsWith('/index.html') ||
            window.location.pathname === '/index.html') {

            // 隐藏欢迎界面（如果存在）
            if (typeof hideWelcomeScreen === 'function') {
                hideWelcomeScreen();
            }

            // 等待欢迎界面隐藏动画完成后滚动
            setTimeout(() => {
                const aboutSection = document.getElementById('about');
                if (aboutSection) {
                    aboutSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                } else {
                    console.warn('⚠️ 关于我区域未找到');
                }
            }, 300);
        } else {
            // 跳转到首页的关于我区域
            window.location.href = 'index.html?skipWelcome=true#about';
        }
    }
}

// 全局函数 - 导航到联系我区域
if (typeof navigateToContact === 'undefined') {
    function navigateToContact(event) {
        if (event) {
            event.preventDefault(); // 阻止默认的锚点跳转
        }

        // 如果当前就在首页，直接滚动到联系我区域
        if (window.location.pathname === '/' ||
            window.location.pathname.endsWith('/index.html') ||
            window.location.pathname === '/index.html') {

            // 隐藏欢迎界面（如果存在）
            if (typeof hideWelcomeScreen === 'function') {
                hideWelcomeScreen();
            }

            // 等待欢迎界面隐藏动画完成后滚动
            setTimeout(() => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                    contactSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    console.log('✅ 已滚动到联系我区域');
                } else {
                    console.warn('⚠️ 联系我区域未找到');
                }
            }, 300);
        } else {
            // 跳转到首页的联系我区域
            window.location.href = 'index.html?skipWelcome=true#contact';
        }
    }
}

// 自动初始化（如果页面包含此脚本）
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否需要自动初始化页眉页脚
    const autoInit = document.querySelector('meta[name="auto-header-footer"]');
    if (autoInit && autoInit.content === 'true') {
        window.headerFooterManager = new HeaderFooterManager();
        window.headerFooterManager.init();
        console.log('🎯 页眉页脚自动初始化完成');
    }
});

// 提供手动初始化函数
function initHeaderFooter() {
    if (!window.headerFooterManager) {
        window.headerFooterManager = new HeaderFooterManager();
    }
    window.headerFooterManager.init();
    return window.headerFooterManager;
}

// 导出类供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderFooterManager;
} else {
    window.HeaderFooterManager = HeaderFooterManager;
    window.initHeaderFooter = initHeaderFooter;
}
