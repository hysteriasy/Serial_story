/**
 * Serial Story 故事连载平台 - Linlin 专属欢迎页面交互脚本
 * 实现星空效果、打字机动画、统计计数器、交互功能
 */

// 全局变量
let stars = [];
let animationId;
let canvas;
let ctx;
let typewriterIndex = 0;
let typewriterText = '';
let isTyping = false;

// 欢迎消息文本
const welcomeMessages = [
    "欢迎来到 Serial Story 故事连载平台，Linlin！",
    "这里是创意与想象力的交汇点，每个故事都等待着被发现...",
    "在这个数字化的叙事宇宙中，无数精彩的连载故事正在上演。",
    "从科幻冒险到奇幻传说，从悬疑推理到浪漫爱情...",
    "每一个章节都是一次心灵的旅行，每一页都充满惊喜。",
    "准备好开始你的阅读冒险了吗？让我们一起探索故事的无限可能！"
];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initStarfield();
    initTimeDisplay();
    initStatCounters();
    initTypewriter();
    initInteractions();
    initStoryCards();

    // 延迟启动动画以获得更好的性能
    setTimeout(() => {
        startAnimations();
    }, 800);
});

// 初始化星空系统
function initStarfield() {
    const container = document.getElementById('starfield-container');
    if (!container) return;

    // 创建canvas
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1';
    container.appendChild(canvas);

    // 设置canvas尺寸
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 创建星星
    createStars();

    // 开始星空动画
    animateStarfield();
}

// 调整canvas尺寸
function resizeCanvas() {
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 重新创建星星以适应新尺寸
    if (stars.length > 0) {
        createStars();
    }
}

// 创建星星
function createStars() {
    const starCount = Math.min(150, Math.floor(window.innerWidth / 8));
    stars = [];

    const colors = ['#00d4ff', '#ff0080', '#00ff88', '#ffaa00', '#8800ff'];

    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 2.5 + 0.5,
            opacity: Math.random() * 0.8 + 0.2,
            color: colors[Math.floor(Math.random() * colors.length)],
            pulse: Math.random() * Math.PI * 2,
            twinkle: Math.random() * 0.02 + 0.01,
            originalSize: 0
        });
        stars[i].originalSize = stars[i].size;
    }
}

// 星空动画
function animateStarfield() {
    if (!ctx || !canvas) return;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach((star, index) => {
        // 更新位置
        star.x += star.vx;
        star.y += star.vy;

        // 边界检测和循环
        if (star.x < -10) star.x = canvas.width + 10;
        if (star.x > canvas.width + 10) star.x = -10;
        if (star.y < -10) star.y = canvas.height + 10;
        if (star.y > canvas.height + 10) star.y = -10;

        // 更新闪烁效果
        star.pulse += star.twinkle;
        const twinkleFactor = Math.sin(star.pulse) * 0.4 + 0.6;
        const currentSize = star.originalSize * twinkleFactor;

        // 绘制星星
        ctx.save();
        ctx.globalAlpha = star.opacity * twinkleFactor;
        ctx.fillStyle = star.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = star.color;

        // 绘制星星主体
        ctx.beginPath();
        ctx.arc(star.x, star.y, currentSize, 0, Math.PI * 2);
        ctx.fill();

        // 绘制十字光芒效果
        if (currentSize > 1.5) {
            ctx.strokeStyle = star.color;
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = star.opacity * twinkleFactor * 0.6;

            ctx.beginPath();
            ctx.moveTo(star.x - currentSize * 2, star.y);
            ctx.lineTo(star.x + currentSize * 2, star.y);
            ctx.moveTo(star.x, star.y - currentSize * 2);
            ctx.lineTo(star.x, star.y + currentSize * 2);
            ctx.stroke();
        }

        ctx.restore();
    });

    // 继续动画
    animationId = requestAnimationFrame(animateStarfield);
}

// 初始化打字机效果
function initTypewriter() {
    const messageElement = document.getElementById('welcome-message');
    if (!messageElement) return;

    // 延迟开始打字机效果
    setTimeout(() => {
        startTypewriter(messageElement);
    }, 3000);
}

// 开始打字机效果
function startTypewriter(element) {
    if (isTyping) return;

    isTyping = true;
    typewriterIndex = 0;
    typewriterText = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    element.textContent = '';

    typeNextCharacter(element);
}

// 打字机逐字符显示
function typeNextCharacter(element) {
    if (typewriterIndex < typewriterText.length) {
        element.textContent += typewriterText.charAt(typewriterIndex);
        typewriterIndex++;

        // 随机延迟以模拟真实打字
        const delay = Math.random() * 100 + 50;
        setTimeout(() => typeNextCharacter(element), delay);
    } else {
        isTyping = false;

        // 5秒后开始下一条消息
        setTimeout(() => {
            if (element) {
                startTypewriter(element);
            }
        }, 5000);
    }
}
// 初始化故事卡片交互
function initStoryCards() {
    const storyCards = document.querySelectorAll('.story-card');

    storyCards.forEach((card, index) => {
        // 鼠标悬停效果
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
            card.style.transition = 'all 0.4s ease';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });

        // 点击效果
        card.addEventListener('click', () => {
            createCardClickEffect(card);
            // 这里可以添加跳转到具体故事的逻辑
            console.log(`点击了故事卡片 ${index + 1}`);
        });

        // 延迟显示动画
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 500 + index * 200);

        // 初始状态
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
    });
}

// 创建卡片点击效果
function createCardClickEffect(card) {
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(0, 255, 136, 0.6)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.width = '20px';
    ripple.style.height = '20px';
    ripple.style.marginLeft = '-10px';
    ripple.style.marginTop = '-10px';
    ripple.style.pointerEvents = 'none';

    card.style.position = 'relative';
    card.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// 初始化时间显示
function initTimeDisplay() {
    const timeElement = document.getElementById('current-time');
    const signatureDateElement = document.getElementById('signature-date');

    if (!timeElement) return;

    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        timeElement.textContent = timeString;

        // 更新签名日期
        if (signatureDateElement) {
            const dateString = now.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            signatureDateElement.textContent = dateString;
        }
    }

    updateTime();
    setInterval(updateTime, 1000);
}

// 初始化统计数字动画
function initStatCounters() {
    const statValues = document.querySelectorAll('.stat-value');

    // 使用Intersection Observer来触发动画
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stat = entry.target;
                const target = stat.getAttribute('data-target');

                if (target === '∞') {
                    stat.textContent = '∞';
                    return;
                }

                animateCounter(stat, parseInt(target));
                observer.unobserve(stat);
            }
        });
    }, { threshold: 0.5 });

    statValues.forEach(stat => {
        observer.observe(stat);
    });
}

// 数字计数动画
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 60; // 60帧动画
    const duration = 2000; // 2秒
    const stepTime = duration / 60;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }

        // 添加数字格式化
        const displayValue = Math.floor(current);
        if (displayValue >= 1000) {
            element.textContent = (displayValue / 1000).toFixed(1) + 'K';
        } else {
            element.textContent = displayValue;
        }
    }, stepTime);
}

// 初始化交互功能
function initInteractions() {
    // 鼠标移动效果
    document.addEventListener('mousemove', handleMouseMove);

    // 按钮点击效果
    const buttons = document.querySelectorAll('.neon-button');
    buttons.forEach(button => {
        button.addEventListener('click', createButtonClickEffect);

        // 添加悬停粒子效果
        button.addEventListener('mouseenter', () => {
            createHoverParticles(button);
        });
    });

    // 用户头像交互
    const avatarRing = document.querySelector('.avatar-ring');
    if (avatarRing) {
        avatarRing.addEventListener('mouseenter', () => {
            avatarRing.style.animationDuration = '3s';
        });

        avatarRing.addEventListener('mouseleave', () => {
            avatarRing.style.animationDuration = '10s';
        });
    }

    // 面板悬停效果
    const panels = document.querySelectorAll('.stats-panel, .welcome-panel');
    panels.forEach(panel => {
        panel.addEventListener('mouseenter', () => {
            panel.style.transform = 'translateY(-5px)';
            panel.style.boxShadow = '0 20px 40px rgba(0, 212, 255, 0.2)';
        });

        panel.addEventListener('mouseleave', () => {
            panel.style.transform = 'translateY(0)';
            panel.style.boxShadow = 'none';
        });
    });
}
// 鼠标移动效果
function handleMouseMove(e) {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // 为星星添加微妙的鼠标交互效果
    stars.forEach(star => {
        const dx = mouseX - star.x;
        const dy = mouseY - star.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
            const force = (150 - distance) / 150 * 0.005;
            star.vx += dx * force * 0.001;
            star.vy += dy * force * 0.001;

            // 增强闪烁效果
            star.twinkle = Math.min(star.twinkle * 1.2, 0.05);
        }
    });

    // 视差效果
    const parallaxElements = document.querySelectorAll('.hologram-interface, .platform-container');
    parallaxElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (mouseX - centerX) * 0.01;
        const deltaY = (mouseY - centerY) * 0.01;

        element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    });
}

// 按钮点击效果
function createButtonClickEffect(e) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 创建霓虹波纹效果
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.width = '0';
    ripple.style.height = '0';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(0, 212, 255, 0.6)';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.animation = 'neonRipple 0.8s ease-out';
    ripple.style.pointerEvents = 'none';
    ripple.style.zIndex = '1';

    button.style.position = 'relative';
    button.appendChild(ripple);

    // 添加按钮震动效果
    button.style.animation = 'buttonShake 0.3s ease-in-out';

    setTimeout(() => {
        ripple.remove();
        button.style.animation = '';
    }, 800);
}

// 创建悬停粒子效果
function createHoverParticles(button) {
    const rect = button.getBoundingClientRect();
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.background = '#00d4ff';
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        particle.style.boxShadow = '0 0 10px #00d4ff';

        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = 50;

        particle.style.left = startX + 'px';
        particle.style.top = startY + 'px';

        document.body.appendChild(particle);

        // 动画粒子
        const endX = startX + Math.cos(angle) * distance;
        const endY = startY + Math.sin(angle) * distance;

        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0)`, opacity: 0 }
        ], {
            duration: 800,
            easing: 'ease-out'
        }).onfinish = () => {
            particle.remove();
        };
    }
}

// 启动动画
function startAnimations() {
    // 添加入场动画类
    document.body.classList.add('animations-ready');

    // 启动星空动画
    if (canvas && ctx) {
        animateStarfield();
    }
}

// 进入故事平台
function enterPlatform() {
    // 创建进入效果
    const container = document.querySelector('.story-container');
    container.style.animation = 'platformEntry 1.5s ease-out';

    // 增强星空效果
    stars.forEach(star => {
        star.vx *= 1.5;
        star.vy *= 1.5;
        star.twinkle *= 1.3;
    });

    // 显示进入消息
    showNotification('正在进入故事世界...', 'success');

    // 模拟跳转延迟
    setTimeout(() => {
        showNotification('欢迎来到 Serial Story 的奇幻世界！', 'info');
        // 这里可以添加实际的页面跳转逻辑
        // window.location.href = 'stories.html';
    }, 1500);
}

// 显示专属消息弹窗
function showPersonalMessage() {
    const modal = document.getElementById('personal-message-modal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';

        // 添加打开动画
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.animation = 'modalSlideIn 0.5s ease-out';
    }
}

// 关闭专属消息弹窗
function closePersonalMessage() {
    const modal = document.getElementById('personal-message-modal');
    if (modal) {
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.animation = 'modalSlideOut 0.3s ease-in';

        setTimeout(() => {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }, 300);
    }
}

// 探索更多故事
function exploreStories() {
    // 创建探索效果
    const storyCards = document.querySelectorAll('.story-card');
    storyCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.transform = 'translateY(-10px) scale(1.05)';
            card.style.boxShadow = '0 20px 40px rgba(0, 255, 136, 0.3)';

            setTimeout(() => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '';
            }, 500);
        }, index * 200);
    });

    showNotification('发现了更多精彩故事！', 'success');
}

// 显示通知系统
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');

    // 根据类型设置颜色
    const colors = {
        success: { bg: 'rgba(0, 255, 136, 0.9)', shadow: '0 0 25px rgba(0, 255, 136, 0.6)' },
        error: { bg: 'rgba(255, 0, 128, 0.9)', shadow: '0 0 25px rgba(255, 0, 128, 0.6)' },
        warning: { bg: 'rgba(255, 170, 0, 0.9)', shadow: '0 0 25px rgba(255, 170, 0, 0.6)' },
        info: { bg: 'rgba(0, 212, 255, 0.9)', shadow: '0 0 25px rgba(0, 212, 255, 0.6)' }
    };

    const color = colors[type] || colors.info;

    notification.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        background: ${color.bg};
        color: #000;
        padding: 18px 25px;
        border-radius: 15px;
        font-family: 'Orbitron', monospace;
        font-weight: 600;
        font-size: 0.9rem;
        z-index: 2000;
        max-width: 350px;
        box-shadow: ${color.shadow};
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        animation: notificationSlideIn 0.6s ease-out, notificationFadeOut 0.5s ease-out 4s forwards;
        cursor: pointer;
    `;

    notification.textContent = message;

    // 点击关闭
    notification.addEventListener('click', () => {
        notification.style.animation = 'notificationFadeOut 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    });

    document.body.appendChild(notification);

    // 自动移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4500);
}

// 添加涟漪效果到CSS
function addRippleEffect() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                width: 100px;
                height: 100px;
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// 添加动画样式
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes neonRipple {
            to {
                width: 120px;
                height: 120px;
                opacity: 0;
            }
        }

        @keyframes buttonShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-2px); }
            75% { transform: translateX(2px); }
        }

        @keyframes platformEntry {
            0% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.02); filter: brightness(1.3) hue-rotate(30deg); }
            100% { transform: scale(1); filter: brightness(1); }
        }

        @keyframes notificationSlideIn {
            from {
                opacity: 0;
                transform: translateX(100%) scale(0.8);
            }
            to {
                opacity: 1;
                transform: translateX(0) scale(1);
            }
        }

        @keyframes notificationFadeOut {
            to {
                opacity: 0;
                transform: translateX(100%) scale(0.8);
            }
        }

        @keyframes modalSlideOut {
            from {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            to {
                opacity: 0;
                transform: translateY(-50px) scale(0.9);
            }
        }

        .animations-ready * {
            transition: all 0.3s ease;
        }
    `;
    document.head.appendChild(style);
}

// 初始化时添加样式
addAnimationStyles();
// 性能优化：清理函数
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});

// 页面可见性变化时暂停/恢复动画
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    } else {
        if (canvas && ctx && stars.length > 0) {
            animateStarfield();
        }
    }
});

// 导出全局函数供HTML调用
window.enterPlatform = enterPlatform;
window.showPersonalMessage = showPersonalMessage;
window.closePersonalMessage = closePersonalMessage;
window.exploreStories = exploreStories;
