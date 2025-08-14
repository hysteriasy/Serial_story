/**
 * 页眉组件模块
 * 独立的页眉组件，包含完整的HTML结构、CSS样式和JavaScript功能
 */
class HeaderComponent {
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

    // 初始化页眉
    init() {
        if (this.isInitialized) {
            console.log('⚠️ 页眉组件已初始化，跳过重复初始化');
            return;
        }

        console.log('🚀 开始初始化页眉组件...');
        
        // 注入必要的样式
        this.injectStyles();
        
        // 插入页眉
        this.insertHeader();
        
        // 初始化各种功能
        this.initializeNavigation();
        this.initializeModals();
        this.initializeUserInfo();
        
        this.isInitialized = true;
        console.log('✅ 页眉组件初始化完成');
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

    // 初始化导航功能
    initializeNavigation() {
        console.log('🧭 初始化导航功能...');
        
        // 初始化移动端菜单
        this.initMobileMenu();
        
        // 初始化平滑滚动
        this.initSmoothScrolling();
        
        // 初始化滚动效果
        this.initScrollEffects();
        
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
            
            // 更新用户信息内容
            const userInfoContent = document.getElementById('userInfoContent');
            if (userInfoContent) {
                const roleText = auth.isAdmin && auth.isAdmin() ? '管理员' : '用户';
                const roleColor = auth.isAdmin && auth.isAdmin() ? '#dc3545' : '#28a745';

                userInfoContent.innerHTML = `
                    <div style="text-align: center;">
                        <strong style="color: ${roleColor};">${auth.currentUser.username}</strong><br>
                        <small style="color: #6c757d;">角色: ${roleText}</small><br>
                        <small style="color: #007bff;">状态: 已登录</small>
                    </div>
                `;
                console.log('✅ 用户信息内容已更新');
            }

            // 更改点击事件为显示用户信息
            authNavLink.onclick = () => {
                if (userInfoDisplay) {
                    const display = userInfoDisplay.style.display;
                    userInfoDisplay.style.display = display === 'none' ? 'block' : 'none';
                    console.log('🔄 用户信息显示状态切换:', userInfoDisplay.style.display);
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

        if (!navbar) {
            console.log('ℹ️ 没有需要滚动效果的导航栏');
            return;
        }

        const handleScroll = () => {
            const scrollTop = window.pageYOffset;

            // 导航栏滚动效果
            if (scrollTop > 100) {
                navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                navbar.style.backdropFilter = 'blur(10px)';
                navbar.style.webkitBackdropFilter = 'blur(10px)';
            } else {
                navbar.style.backgroundColor = '#fff';
                navbar.style.backdropFilter = 'none';
                navbar.style.webkitBackdropFilter = 'none';
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // 为iOS设备添加触摸滚动支持
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            document.addEventListener('touchmove', handleScroll, { passive: true });
        }
        
        console.log('✅ 滚动效果初始化完成');
    }

    // 初始化平滑滚动
    initSmoothScrolling() {
        console.log('🎯 初始化平滑滚动...');
        
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        console.log('✅ 平滑滚动初始化完成');
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
        if (document.getElementById('header-component-styles')) {
            return;
        }

        const styleElement = document.createElement('style');
        styleElement.id = 'header-component-styles';
        styleElement.textContent = `
            /* 导航栏下拉菜单样式 */
            .nav-dropdown {
                position: relative;
            }

            .dropdown-trigger {
                cursor: pointer;
                transition: color 0.3s ease;
                color: #333 !important; /* 确保文字颜色可见 */
                text-decoration: none;
                font-weight: 500;
            }

            .dropdown-trigger:hover {
                color: #007bff !important;
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

            /* 移动端下拉菜单适配 */
            @media (max-width: 768px) {
                .dropdown-trigger {
                    color: white !important; /* 移动端使用白色文字 */
                }

                .dropdown-trigger:hover {
                    color: #ccc !important;
                }

                .nav-dropdown-menu {
                    position: static;
                    opacity: 1;
                    visibility: visible;
                    transform: none;
                    box-shadow: none;
                    border: none;
                    background: transparent;
                    margin-top: 10px;
                }

                .nav-dropdown-link {
                    padding: 8px 0;
                    border-bottom: none;
                    color: white;
                }

                .nav-dropdown-link:hover {
                    background: rgba(255,255,255,0.1);
                    transform: none;
                }

                #userInfoDisplay {
                    right: 10px;
                    left: 10px;
                    width: auto;
                    min-width: auto;
                }
            }
        `;

        document.head.appendChild(styleElement);
        console.log('✅ 页眉样式已注入');
    }
}

// 全局函数 - 显示登录模态框
if (typeof showLoginModal === 'undefined') {
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
}

// 全局函数 - 关闭登录模态框
if (typeof closeLoginModal === 'undefined') {
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
}

// 全局函数 - 退出登录
if (typeof logout === 'undefined') {
    function logout() {
        if (typeof auth !== 'undefined' && auth.logout) {
            auth.logout();
            // 更新导航状态
            if (window.headerComponent) {
                window.headerComponent.updateAuthNavigation();
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

// 全局函数 - 滚动到指定区域
if (typeof scrollToSection === 'undefined') {
    function scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
}

// 自动初始化（如果页面包含此脚本）
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否需要自动初始化页眉
    const autoInit = document.querySelector('meta[name="auto-header"]');
    if (autoInit && autoInit.content === 'true') {
        window.headerComponent = new HeaderComponent();
        window.headerComponent.init();
        console.log('🎯 页眉自动初始化完成');
    }
});

// 提供手动初始化函数
function initHeader() {
    if (!window.headerComponent) {
        window.headerComponent = new HeaderComponent();
    }
    window.headerComponent.init();
    return window.headerComponent;
}

// 导出类供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderComponent;
} else {
    window.HeaderComponent = HeaderComponent;
    window.initHeader = initHeader;
}
