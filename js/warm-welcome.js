// 温馨欢迎页面交互功能 - 采用主页风格

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeWelcomePage();
});

// 初始化欢迎页面
function initializeWelcomePage() {
    initializeMobileMenu();
    initializeScrollEffects();
    initializeFormHandling();
    initializeBackToTop();

    // 添加页面加载动画
    document.body.classList.add('page-loaded');
}

// 初始化移动端菜单
function initializeMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // 点击菜单项时关闭移动菜单
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// 初始化滚动效果
function initializeScrollEffects() {
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = '#fff';
            navbar.style.backdropFilter = 'none';
        }
    });
}

// 初始化表单处理
function initializeFormHandling() {
    const storyForm = document.getElementById('storyForm');

    if (storyForm) {
        storyForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(storyForm);
            const title = formData.get('title');
            const genre = formData.get('genre');
            const content = formData.get('content');

            // 模拟提交
            showNotification(`故事《${title}》已成功发布！`, 'success');
            storyForm.reset();
        });
    }
}

// 初始化返回顶部按钮
function initializeBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');

    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
    }
}

// 滚动到指定区域
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 滚动到顶部
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 初始化卡片交互
function initializeCardInteractions() {
    const navCards = document.querySelectorAll('.nav-card');
    const updateCards = document.querySelectorAll('.update-card');
    
    // 导航卡片点击事件
    navCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category;
            handleNavCardClick(category);
        });
        
        // 添加悬停效果
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // 更新卡片点击事件
    updateCards.forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('.update-title').textContent;
            handleUpdateCardClick(title);
        });
    });
}

// 处理导航卡片点击
function handleNavCardClick(category) {
    // 添加点击动画
    const clickedCard = document.querySelector(`[data-category="${category}"]`);
    clickedCard.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        clickedCard.style.transform = 'translateY(-8px) scale(1.02)';
    }, 150);
    
    // 根据类别执行不同操作
    switch(category) {
        case 'my-stories':
            showNotification('正在加载我的故事...', 'info');
            // 这里可以添加跳转到我的故事页面的逻辑
            setTimeout(() => {
                showNotification('我的故事页面开发中，敬请期待！', 'success');
            }, 1000);
            break;
            
        case 'linlin-stories':
            showNotification('正在加载Linlin的故事...', 'info');
            setTimeout(() => {
                showNotification('Linlin的故事页面开发中，敬请期待！', 'success');
            }, 1000);
            break;
            
        case 'favorites':
            showNotification('正在加载我们的收藏...', 'info');
            setTimeout(() => {
                showNotification('收藏页面开发中，敬请期待！', 'success');
            }, 1000);
            break;
            
        case 'create':
            showNotification('正在打开创作工具...', 'info');
            setTimeout(() => {
                showNotification('创作工具开发中，敬请期待！', 'success');
            }, 1000);
            break;
    }
}

// 处理更新卡片点击
function handleUpdateCardClick(title) {
    showNotification(`正在打开《${title}》...`, 'info');
    setTimeout(() => {
        showNotification('故事阅读页面开发中，敬请期待！', 'success');
    }, 1000);
}

// 探索故事功能
function exploreStories() {
    showNotification('正在进入故事世界...', 'info');
    
    // 添加按钮点击动画
    const button = event.target.closest('button');
    button.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
        showNotification('故事浏览页面开发中，敬请期待！', 'success');
    }, 200);
}

// 开始创作功能
function startWriting() {
    showNotification('正在打开创作编辑器...', 'info');
    
    // 添加按钮点击动画
    const button = event.target.closest('button');
    button.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
        showNotification('创作编辑器开发中，敬请期待！', 'success');
    }, 200);
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4ECDC4' : type === 'error' ? '#FF6B9D' : '#C44569'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 初始化滚动动画
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // 观察需要动画的元素
    const animateElements = document.querySelectorAll('.message-card, .nav-card, .update-card');
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

// 初始化背景效果
function initializeBackgroundEffects() {
    // 创建更多浮动元素
    createFloatingElements();
    
    // 鼠标移动视差效果
    document.addEventListener('mousemove', handleMouseMove);
}

// 创建浮动元素
function createFloatingElements() {
    const container = document.querySelector('.background-decorations');
    if (!container) return;
    
    // 创建额外的浮动心形
    for (let i = 0; i < 5; i++) {
        const heart = document.createElement('div');
        heart.className = 'extra-heart';
        heart.textContent = ['💕', '💖', '💝', '✨', '🌟'][i];
        heart.style.cssText = `
            position: absolute;
            font-size: 16px;
            opacity: 0.1;
            animation: float ${6 + Math.random() * 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 5}s;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            pointer-events: none;
        `;
        container.appendChild(heart);
    }
}

// 鼠标移动视差效果
function handleMouseMove(e) {
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    // 移动背景装饰元素
    const decorations = document.querySelectorAll('.gradient-orbs::before, .gradient-orbs::after');
    const hearts = document.querySelectorAll('.extra-heart');
    
    hearts.forEach((heart, index) => {
        const speed = (index + 1) * 0.5;
        const x = (mouseX - 0.5) * speed;
        const y = (mouseY - 0.5) * speed;
        heart.style.transform = `translate(${x}px, ${y}px)`;
    });
}

// 添加页面加载样式
const style = document.createElement('style');
style.textContent = `
    .page-loaded .message-card,
    .page-loaded .nav-card,
    .page-loaded .update-card {
        opacity: 0;
        transform: translateY(30px);
        animation: fadeInUp 0.6s ease-out forwards;
    }
    
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
    
    .notification {
        font-family: 'Noto Sans SC', sans-serif;
    }
`;
document.head.appendChild(style);

// 防止页面刷新时的闪烁
window.addEventListener('beforeunload', function() {
    document.body.style.opacity = '0';
});

// 页面可见性变化处理
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 页面隐藏时暂停动画
        document.body.style.animationPlayState = 'paused';
    } else {
        // 页面显示时恢复动画
        document.body.style.animationPlayState = 'running';
        updateCurrentTime(); // 立即更新时间
    }
});

// 错误处理
window.addEventListener('error', function(e) {
    console.error('页面错误:', e.error);
    showNotification('页面出现了一些小问题，但不影响使用哦！', 'error');
});

// 导出函数供全局使用
window.exploreStories = exploreStories;
window.startWriting = startWriting;
