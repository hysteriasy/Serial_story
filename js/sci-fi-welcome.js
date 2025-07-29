/**
 * 科幻风格欢迎页面交互脚本
 * 实现粒子效果、动画、交互功能
 */

// 全局变量
let particles = [];
let animationId;
let canvas;
let ctx;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initParticles();
    initTimeDisplay();
    initStatCounters();
    initInteractions();
    
    // 延迟启动动画以获得更好的性能
    setTimeout(() => {
        startAnimations();
    }, 500);
});

// 初始化粒子系统
function initParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;
    
    // 创建canvas
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);
    
    // 设置canvas尺寸
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 创建粒子
    createParticles();
    
    // 开始粒子动画
    animateParticles();
}

// 调整canvas尺寸
function resizeCanvas() {
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// 创建粒子
function createParticles() {
    const particleCount = Math.min(100, Math.floor(window.innerWidth / 10));
    particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2,
            color: Math.random() > 0.5 ? '#00ffff' : '#ff00ff',
            pulse: Math.random() * Math.PI * 2
        });
    }
}

// 粒子动画
function animateParticles() {
    if (!ctx || !canvas) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((particle, index) => {
        // 更新位置
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // 边界检测
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        // 更新脉冲
        particle.pulse += 0.02;
        const pulseFactor = Math.sin(particle.pulse) * 0.3 + 0.7;
        
        // 绘制粒子
        ctx.save();
        ctx.globalAlpha = particle.opacity * pulseFactor;
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * pulseFactor, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // 绘制连接线
        particles.forEach((otherParticle, otherIndex) => {
            if (index !== otherIndex) {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.save();
                    ctx.globalAlpha = (1 - distance / 100) * 0.2;
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(otherParticle.x, otherParticle.y);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        });
    });
    
    animationId = requestAnimationFrame(animateParticles);
}

// 初始化时间显示
function initTimeDisplay() {
    const timeElement = document.getElementById('current-time');
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
    }
    
    updateTime();
    setInterval(updateTime, 1000);
}

// 初始化统计数字动画
function initStatCounters() {
    const statValues = document.querySelectorAll('.stat-value');
    
    statValues.forEach(stat => {
        const target = stat.getAttribute('data-target');
        if (target === '∞') {
            stat.textContent = '∞';
            return;
        }
        
        const targetNum = parseInt(target);
        let current = 0;
        const increment = targetNum / 100;
        const duration = 2000; // 2秒
        const stepTime = duration / 100;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= targetNum) {
                current = targetNum;
                clearInterval(timer);
            }
            stat.textContent = Math.floor(current);
        }, stepTime);
    });
}

// 初始化交互功能
function initInteractions() {
    // 鼠标移动效果
    document.addEventListener('mousemove', handleMouseMove);
    
    // 按钮点击效果
    const buttons = document.querySelectorAll('.sci-fi-button');
    buttons.forEach(button => {
        button.addEventListener('click', createClickEffect);
    });
    
    // 全息投影交互
    const hologram = document.querySelector('.hologram-frame');
    if (hologram) {
        hologram.addEventListener('mouseenter', () => {
            hologram.style.animationDuration = '2s';
        });
        
        hologram.addEventListener('mouseleave', () => {
            hologram.style.animationDuration = '10s';
        });
    }
}

// 鼠标移动效果
function handleMouseMove(e) {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // 为粒子添加鼠标吸引效果
    particles.forEach(particle => {
        const dx = mouseX - particle.x;
        const dy = mouseY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
            const force = (100 - distance) / 100 * 0.01;
            particle.vx += dx * force * 0.01;
            particle.vy += dy * force * 0.01;
        }
    });
}

// 点击效果
function createClickEffect(e) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 创建波纹效果
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.width = '0';
    ripple.style.height = '0';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.5)';
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.animation = 'ripple 0.6s ease-out';
    ripple.style.pointerEvents = 'none';
    
    button.style.position = 'relative';
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// 启动动画
function startAnimations() {
    // 添加入场动画类
    document.body.classList.add('animations-ready');
}

// 激活欢迎程序
function activateWelcome() {
    // 创建特殊效果
    const container = document.querySelector('.sci-fi-container');
    container.style.animation = 'none';
    container.offsetHeight; // 触发重排
    container.style.animation = 'welcomeActivation 2s ease-out';
    
    // 增强粒子效果
    particles.forEach(particle => {
        particle.vx *= 2;
        particle.vy *= 2;
        particle.size *= 1.5;
    });
    
    // 2秒后恢复正常
    setTimeout(() => {
        particles.forEach(particle => {
            particle.vx *= 0.5;
            particle.vy *= 0.5;
            particle.size *= 0.67;
        });
    }, 2000);
    
    // 显示欢迎消息
    showNotification('欢迎程序已激活！Linlin，愿你在这个科幻世界中探索无限可能！');
}

// 显示特殊消息
function showMessage() {
    const modal = document.getElementById('special-message');
    if (modal) {
        modal.classList.add('show');
    }
}

// 关闭消息
function closeMessage() {
    const modal = document.getElementById('special-message');
    if (modal) {
        modal.classList.remove('show');
    }
}

// 显示通知
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 255, 255, 0.9);
        color: #000;
        padding: 15px 20px;
        border-radius: 10px;
        font-family: 'Orbitron', monospace;
        font-weight: 600;
        z-index: 2000;
        animation: slideInRight 0.5s ease-out, fadeOut 0.5s ease-out 3s forwards;
        max-width: 300px;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3500);
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            width: 100px;
            height: 100px;
            opacity: 0;
        }
    }
    
    @keyframes welcomeActivation {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); filter: brightness(1.2); }
        100% { transform: scale(1); filter: brightness(1); }
    }
    
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// 清理函数
window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
});
