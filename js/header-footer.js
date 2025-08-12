// 页眉页脚统一组件模块
class HeaderFooterManager {
    constructor() {
        this.currentPage = this.getCurrentPageName();
    }

    // 获取当前页面名称
    getCurrentPageName() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('.html', '') || 'index';
    }

    // 生成导航栏HTML
    generateHeader() {
        return `
            <nav class="navbar">
                <div class="nav-container">
                    <a href="index.html" class="nav-logo">桑梓</a>
                    <ul class="nav-menu" id="nav-menu">
                        <li class="nav-item">
                            <a href="index.html" class="nav-link ${this.currentPage === 'index' ? 'active' : ''}">首页</a>
                        </li>
                        <li class="nav-item">
                            <a href="literature.html" class="nav-link ${this.currentPage === 'literature' ? 'active' : ''}">文学</a>
                        </li>
                        <li class="nav-item">
                            <a href="art.html" class="nav-link ${this.currentPage === 'art' ? 'active' : ''}">艺术</a>
                        </li>
                        <li class="nav-item">
                            <a href="music.html" class="nav-link ${this.currentPage === 'music' ? 'active' : ''}">音乐</a>
                        </li>
                        <li class="nav-item">
                            <a href="video.html" class="nav-link ${this.currentPage === 'video' ? 'active' : ''}">视频</a>
                        </li>
                        <li class="nav-item" id="loginItem">
                            <a href="login.html" class="nav-link">登录</a>
                        </li>
                        <li class="nav-item" id="userStatusItem" style="display: none;">
                            <span class="nav-link">欢迎，<span id="currentUserName"></span></span>
                            <a href="#" onclick="logout()" class="nav-link">退出</a>
                        </li>
                        <li class="nav-item">
                            <a href="upload.html" class="nav-link ${this.currentPage === 'upload' ? 'active' : ''}">作品上传</a>
                        </li>
                    </ul>
                    <div class="hamburger" onclick="toggleMobileMenu()">
                        <span class="bar"></span>
                        <span class="bar"></span>
                        <span class="bar"></span>
                    </div>
                </div>
            </nav>
        `;
    }

    // 生成页脚HTML
    generateFooter() {
        return `
            <footer class="footer">
                <div class="footer-content">
                    <div class="footer-section">
                        <h3>桑梓</h3>
                        <p>个人创作平台，分享文学、艺术、音乐和视频作品</p>
                    </div>
                    <div class="footer-section">
                        <h4>快速链接</h4>
                        <ul class="footer-links">
                            <li><a href="index.html">首页</a></li>
                            <li><a href="literature.html">文学</a></li>
                            <li><a href="art.html">艺术</a></li>
                            <li><a href="music.html">音乐</a></li>
                            <li><a href="video.html">视频</a></li>
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h4>用户功能</h4>
                        <ul class="footer-links">
                            <li><a href="login.html">登录</a></li>
                            <li><a href="upload.html">作品上传</a></li>
                            <li><a href="user-management.html">用户管理</a></li>
                            <li><a href="admin.html">系统管理</a></li>
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h4>联系方式</h4>
                        <p>邮箱: contact@example.com</p>
                        <p>创作理念: 用文字温暖人心，用故事连接世界</p>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; 2024 桑梓. 保留所有权利.</p>
                </div>
            </footer>
        `;
    }

    // 初始化页眉页脚
    init() {
        this.insertHeader();
        this.insertFooter();
        this.initializeNavigation();
    }

    // 插入页眉
    insertHeader() {
        // 查找现有的导航栏或在body开头插入
        const existingNav = document.querySelector('nav.navbar');
        if (existingNav) {
            existingNav.outerHTML = this.generateHeader();
        } else {
            const headerHTML = this.generateHeader();
            document.body.insertAdjacentHTML('afterbegin', headerHTML);
        }
    }

    // 插入页脚
    insertFooter() {
        // 查找现有的页脚或在body末尾插入
        const existingFooter = document.querySelector('footer.footer');
        if (existingFooter) {
            existingFooter.outerHTML = this.generateFooter();
        } else {
            const footerHTML = this.generateFooter();
            document.body.insertAdjacentHTML('beforeend', footerHTML);
        }
    }

    // 初始化导航功能
    initializeNavigation() {
        // 等待auth系统加载
        this.waitForAuth(() => {
            this.updateAuthNavigation();
        });

        // 初始化移动端菜单
        this.initMobileMenu();
    }

    // 等待auth系统加载
    waitForAuth(callback, attempts = 0) {
        const maxAttempts = 20; // 最多等待10秒
        
        if (typeof auth !== 'undefined' && auth.currentUser !== undefined) {
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
        const loginItem = document.getElementById('loginItem');
        const userStatusItem = document.getElementById('userStatusItem');
        const currentUserName = document.getElementById('currentUserName');

        if (!loginItem || !userStatusItem) {
            console.warn('⚠️ 导航元素未找到');
            return;
        }

        if (typeof auth !== 'undefined' && auth.currentUser) {
            // 用户已登录
            loginItem.style.display = 'none';
            userStatusItem.style.display = 'block';
            if (currentUserName) {
                currentUserName.textContent = auth.currentUser.username;
            }
            console.log('✅ 导航栏已更新为登录状态');
        } else {
            // 用户未登录
            loginItem.style.display = 'block';
            userStatusItem.style.display = 'none';
            console.log('✅ 导航栏已更新为未登录状态');
        }
    }

    // 初始化移动端菜单
    initMobileMenu() {
        // 移动端菜单切换功能已在全局函数中定义
        console.log('📱 移动端菜单初始化完成');
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

// 导出类供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderFooterManager;
} else {
    window.HeaderFooterManager = HeaderFooterManager;
}
