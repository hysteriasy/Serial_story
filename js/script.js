// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // Firebase initialization - 使用演示配置，在实际部署时需要替换为真实配置
    const firebaseConfig = {
      apiKey: 'demo-api-key',
      authDomain: 'demo-project.firebaseapp.com',
      databaseURL: 'https://demo-project-default-rtdb.firebaseio.com',
      projectId: 'demo-project',
      storageBucket: 'demo-project.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:demo-app-id'
    };

    // 全局Firebase状态标志
    window.firebaseAvailable = false;

    // 检查Firebase是否可用
    if (typeof firebase !== 'undefined') {
      try {
        firebase.initializeApp(firebaseConfig);
        console.log('🔧 Firebase配置已加载（演示模式）');

        // 测试数据库连接（设置超时）
        const connectionTimeout = setTimeout(() => {
          console.warn('⚠️ Firebase连接超时，切换到离线模式');
          window.firebaseAvailable = false;
        }, 3000);

        firebase.database().ref('.info/connected').on('value', (snapshot) => {
          clearTimeout(connectionTimeout);
          if (snapshot.val() === true) {
            console.log('✅ Firebase数据库连接正常');
            window.firebaseAvailable = true;
          } else {
            console.warn('⚠️ Firebase数据库连接断开，使用离线模式');
            window.firebaseAvailable = false;
          }
        });

      } catch (error) {
        console.warn('⚠️ Firebase初始化失败:', error.message);
        console.info('📱 系统将在离线模式下运行');
        window.firebaseAvailable = false;
      }
    } else {
      console.info('📱 Firebase库未加载，使用离线模式');
      window.firebaseAvailable = false;
    }

    // 管理员用户初始化已移至auth.js中处理



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
    initMediaFilter();

    // 添加上传按钮事件监听
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', async function() {
            // 上传处理逻辑
        });
    }
});

// 媒体筛选功能
function initMediaFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    if (filterButtons.length > 0 && projectCards.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // 移除所有按钮的active类
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // 为当前按钮添加active类
                this.classList.add('active');

                const filter = this.getAttribute('data-filter');

                // 筛选项目卡片
                projectCards.forEach(card => {
                    if (filter === 'all' || card.getAttribute('data-category') === filter) {
                        card.style.display = 'block';
                        // 添加淡入动画
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 10);
                    } else {
                        // 添加淡出动画
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }
}

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

    // 只有当元素存在时才添加滚动监听器
    if (!navbar && !backToTopBtn) {
        return; // 如果两个元素都不存在，直接返回
    }

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;

        // 导航栏滚动效果 - 只有当navbar存在时才执行
        if (navbar) {
            if (scrollTop > 100) {
                navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                navbar.style.backdropFilter = 'blur(10px)';
            } else {
                navbar.style.backgroundColor = '#fff';
                navbar.style.backdropFilter = 'none';
            }
        }

        // 返回顶部按钮显示/隐藏 - 只有当backToTopBtn存在时才执行
        if (backToTopBtn) {
            if (scrollTop > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
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
            // 特殊处理首页，确保总是滚动到顶部
            if (targetId === 'home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                scrollToSection(targetId);
            }
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
    console.error('页面发生错误:', e.error || e.message || '未知错误');
    // 可以在这里添加错误报告功能
});

// 欢迎页面功能 - 仅在首页初始化
function initWelcomeScreen() {
  // 检查当前页面是否为首页
  if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
    console.log('非首页，跳过欢迎页面初始化');
    return;
  }

  try {
    const welcomeOverlay = document.getElementById('welcome-overlay');

    if (!welcomeOverlay) {
      console.log('欢迎页面元素未找到，跳过初始化');
      return;
    }

    // 检查是否是首次访问
    const hasVisited = sessionStorage.getItem('hasVisitedWelcome');
    if (hasVisited) {
      welcomeOverlay.classList.add('hidden');
      document.body.style.overflow = '';
      return;
    }

    // 初始化逻辑
    welcomeOverlay.style.opacity = '1';

    // 添加点击事件监听器以关闭欢迎页面
    welcomeOverlay.addEventListener('click', hideWelcomeScreen);
  } catch (error) {
    console.error('欢迎页面初始化失败:', error);
  }
}

// 导航功能初始化
function initNavigation() {
  try {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!navToggle || !navMenu) {
      console.error('导航元素未找到:', { navToggle, navMenu });
      return;
    }

    // 移动端菜单切换
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    // 导航链接点击事件
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  } catch (error) {
    console.error('导航初始化失败:', error);
  }
}

// 确保所有模块初始化
function initializeAllModules() {
  try {
    initWelcomeScreen();
    
    // 上传模块已集成到upload.js中，无需额外加载
    
    // 初始化导航
    initNavigation();
  } catch (error) {
    console.error('模块初始化失败:', error);
  }
}

// 统一加载检测
if (document.readyState === 'complete') {
  initializeAllModules();
} else {
  window.addEventListener('DOMContentLoaded', initializeAllModules);
  window.addEventListener('load', () => {
    console.log('所有资源加载完成');
  });
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
