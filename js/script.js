// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 启动性能监控
    monitorWelcomeScreenPerformance();

    // 初始化欢迎页面
    initWelcomeScreen();

    // 初始化所有功能
    initMobileMenu();
    initScrollEffects();
    initContactForm();
    initSmoothScrolling();
    initAnimations();
});

// 移动端菜单功能
function initMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // 点击菜单项时关闭移动端菜单
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// 滚动效果
function initScrollEffects() {
    const navbar = document.querySelector('.navbar');
    const backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;
        
        // 导航栏滚动效果
        if (scrollTop > 100) {
            navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.backgroundColor = '#fff';
            navbar.style.backdropFilter = 'none';
        }
        
        // 返回顶部按钮显示/隐藏
        if (scrollTop > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
}

// 平滑滚动到指定区域
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - 70; // 减去导航栏高度
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// 返回顶部
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 初始化平滑滚动
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
}

// 联系表单处理
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 获取表单数据
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            
            // 简单的表单验证
            if (!name || !email || !message) {
                showNotification('请填写所有必填字段', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showNotification('请输入有效的邮箱地址', 'error');
                return;
            }
            
            // 模拟表单提交
            showNotification('正在发送消息...', 'info');
            
            setTimeout(() => {
                showNotification('消息发送成功！我们会尽快回复您。', 'success');
                contactForm.reset();
            }, 2000);
        });
    }
}

// 邮箱验证
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 通知系统
function showNotification(message, type = 'info') {
    // 移除现有通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 创建新通知
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // 自动移除通知
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
}

// 获取通知颜色
function getNotificationColor(type) {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#007bff'
    };
    return colors[type] || colors.info;
}

// 添加通知动画样式
function addNotificationStyles() {
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// 初始化动画
function initAnimations() {
    addNotificationStyles();
    
    // 观察器用于滚动动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
            }
        });
    }, observerOptions);
    
    // 观察需要动画的元素
    const animatedElements = document.querySelectorAll('.project-card, .about-content, .contact-content');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
}

// 工具函数：防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 工具函数：节流
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 性能优化：使用节流优化滚动事件
window.addEventListener('scroll', throttle(function() {
    // 这里可以添加其他滚动相关的功能
}, 100));

// 页面加载完成后的额外初始化
window.addEventListener('load', function() {
    // 预加载图片或其他资源
    console.log('页面加载完成');
    
    // 添加页面加载动画
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// 错误处理
window.addEventListener('error', function(e) {
    console.error('页面发生错误:', e.error);
    // 可以在这里添加错误报告功能
});

// 欢迎页面功能
function initWelcomeScreen() {
    try {
        const welcomeOverlay = document.getElementById('welcome-overlay');

        if (!welcomeOverlay) {
            console.warn('欢迎页面元素未找到');
            return;
        }

        // 检查是否是首次访问或页面刷新
        const hasVisited = sessionStorage.getItem('hasVisitedWelcome');

        if (hasVisited) {
            // 如果已经访问过，直接隐藏欢迎页面
            welcomeOverlay.classList.add('hidden');
            document.body.style.overflow = ''; // 确保页面可以滚动
            return;
        }

        // 防止页面滚动
        document.body.style.overflow = 'hidden';

        // 使用事件委托优化性能
        let isHidden = false;

        // 点击任意位置隐藏欢迎页面
        welcomeOverlay.addEventListener('click', function(e) {
            if (!isHidden) {
                hideWelcomeScreen();
                isHidden = true;
            }
        }, { once: true }); // 只执行一次

        // 键盘事件支持（按任意键隐藏）
        const keydownHandler = function(e) {
            if (!isHidden && !welcomeOverlay.classList.contains('hidden')) {
                hideWelcomeScreen();
                isHidden = true;
                document.removeEventListener('keydown', keydownHandler);
            }
        };
        document.addEventListener('keydown', keydownHandler);

        // 自动隐藏（可选，10秒后自动隐藏）
        const autoHideTimer = setTimeout(() => {
            if (!isHidden && !welcomeOverlay.classList.contains('hidden')) {
                hideWelcomeScreen();
                isHidden = true;
            }
        }, 10000);

        // 清理定时器的函数
        welcomeOverlay.addEventListener('click', () => {
            clearTimeout(autoHideTimer);
        }, { once: true });

    } catch (error) {
        console.error('初始化欢迎页面时发生错误:', error);
        // 发生错误时确保页面可以正常使用
        document.body.style.overflow = '';
    }
}

function hideWelcomeScreen() {
    try {
        const welcomeOverlay = document.getElementById('welcome-overlay');

        if (!welcomeOverlay || welcomeOverlay.classList.contains('hidden')) {
            return;
        }

        // 添加隐藏类
        welcomeOverlay.classList.add('hidden');

        // 恢复页面滚动
        document.body.style.overflow = '';

        // 标记已访问（使用try-catch处理可能的存储错误）
        try {
            sessionStorage.setItem('hasVisitedWelcome', 'true');
        } catch (storageError) {
            console.warn('无法保存访问状态到sessionStorage:', storageError);
        }

        // 触发主页面动画
        requestAnimationFrame(() => {
            setTimeout(() => {
                triggerMainPageAnimations();
            }, 300);
        });

        // 触发自定义事件，允许其他代码监听欢迎页面关闭
        const welcomeHiddenEvent = new CustomEvent('welcomeScreenHidden', {
            detail: { timestamp: Date.now() }
        });
        document.dispatchEvent(welcomeHiddenEvent);

    } catch (error) {
        console.error('隐藏欢迎页面时发生错误:', error);
        // 确保页面可以正常使用
        document.body.style.overflow = '';
    }
}

function triggerMainPageAnimations() {
    // 触发主页面的入场动画
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.style.animation = 'fadeInUp 0.8s ease forwards';
    }

    // 触发导航栏动画
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.style.animation = 'slideInFromTop 0.6s ease forwards';
    }
}

// 重置欢迎页面状态（用于测试）
function resetWelcomeScreen() {
    try {
        sessionStorage.removeItem('hasVisitedWelcome');
        location.reload();
    } catch (error) {
        console.error('重置欢迎页面状态时发生错误:', error);
        alert('重置失败，请手动刷新页面');
    }
}

// 性能监控
function monitorWelcomeScreenPerformance() {
    if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark('welcome-screen-start');

        // 监听欢迎页面隐藏事件
        document.addEventListener('welcomeScreenHidden', function() {
            performance.mark('welcome-screen-end');
            performance.measure('welcome-screen-duration', 'welcome-screen-start', 'welcome-screen-end');

            const measures = performance.getEntriesByName('welcome-screen-duration');
            if (measures.length > 0) {
                console.log(`欢迎页面显示时长: ${measures[0].duration.toFixed(2)}ms`);
            }
        }, { once: true });
    }
}

// 导出函数供全局使用
window.scrollToSection = scrollToSection;
window.scrollToTop = scrollToTop;
window.resetWelcomeScreen = resetWelcomeScreen;
