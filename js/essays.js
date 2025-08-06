// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 初始化随笔页面
    initEssaysPage();
});

// 初始化随笔页面
function initEssaysPage() {
    // 加载随笔列表
    loadEssaysList();

    // 初始化上传模态框
    initUploadModal();

    // 初始化移动端菜单
    initMobileMenu();
}

// 加载随笔列表
function loadEssaysList() {
    const essaysList = document.getElementById('essaysList');
    if (!essaysList) return;

    // 清空列表
    essaysList.innerHTML = '';

    // 从本地存储获取随笔数据
    const essays = getEssaysFromStorage();

    if (essays.length === 0) {
        essaysList.innerHTML = '<li class="no-essays">暂无随笔，请上传新随笔</li>';
        return;
    }

    // 遍历随笔数据并生成列表
    essays.forEach((essay, index) => {
        const li = document.createElement('li');
        li.className = 'essay-item';
        li.innerHTML = `
            <div class="essay-item-content" data-index="${index}">
                <span class="essay-title">${essay.title}</span>
                <span class="essay-date">${formatDate(essay.date)}</span>
            </div>
            <button class="delete-btn" data-index="${index}">删除</button>
        `;
        essaysList.appendChild(li);

        // 添加点击事件以加载随笔内容
        const essayItemContent = li.querySelector('.essay-item-content');
        essayItemContent.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            loadEssayContent(index);
        });

        // 添加删除按钮事件
        const deleteBtn = li.querySelector('.delete-btn');
        console.log('Delete button created:', deleteBtn);
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            const index = parseInt(this.getAttribute('data-index'));
            console.log('Delete button clicked for index:', index);
            deleteEssay(index);
        });
    });
}

// 加载随笔内容
function loadEssayContent(index) {
    const essayTitle = document.getElementById('essayTitle');
    const essayBody = document.getElementById('essayBody');
    if (!essayTitle || !essayBody) return;

    // 从本地存储获取随笔数据
    const essays = getEssaysFromStorage();
    if (index < 0 || index >= essays.length) return;

    const essay = essays[index];
    essayTitle.textContent = essay.title;
    essayBody.innerHTML = `<p class="essay-meta">发布日期: ${formatDate(essay.date)}</p>
${convertMarkdownToHtml(essay.content)}`;

    // 滚动到内容区域
    document.getElementById('essayContent').scrollIntoView({ behavior: 'smooth' });
}

// 初始化上传模态框
function initUploadModal() {
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const closeBtn = document.querySelector('.close-btn');
    const uploadForm = document.getElementById('uploadForm');

    if (!uploadBtn || !uploadModal || !closeBtn || !uploadForm) return;

    // 打开模态框
    uploadBtn.addEventListener('click', function() {
        uploadModal.style.display = 'block';
    });

    // 关闭模态框
    closeBtn.addEventListener('click', function() {
        uploadModal.style.display = 'none';
    });

    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        if (event.target === uploadModal) {
            uploadModal.style.display = 'none';
        }
    });

    // 提交表单
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const title = document.getElementById('essayTitleInput').value;
        const content = document.getElementById('essayContentInput').value;

        if (!title || !content) {
            showNotification('请填写标题和内容', 'error');
            return;
        }

        // 创建新随笔
        const newEssay = {
            title: title,
            content: content,
            date: new Date().toISOString()
        };

        // 保存到本地存储
        saveEssayToStorage(newEssay);

        // 关闭模态框并重置表单
        uploadModal.style.display = 'none';
        uploadForm.reset();

        // 更新随笔列表
        loadEssaysList();

        // 显示成功通知
        showNotification('随笔上传成功！', 'success');
    });
}

// 删除随笔
function deleteEssay(index) {
    console.log('deleteEssay function called with index:', index);
    if (!confirm('确定要删除这篇随笔吗？')) {
        console.log('Delete cancelled by user');
        return;
    }

    // 从本地存储获取随笔数据
    let essays = getEssaysFromStorage();
    console.log('Current essays:', essays);

    // 删除指定索引的随笔
    essays.splice(index, 1);
    console.log('Essays after deletion:', essays);

    // 保存更新后的随笔数据
    localStorage.setItem('essays', JSON.stringify(essays));
    console.log('Essays saved to localStorage');

    // 更新随笔列表
    loadEssaysList();

    // 重置内容区域
    document.getElementById('essayTitle').textContent = '请选择一篇随笔开始阅读';
    document.getElementById('essayBody').innerHTML = '<p>点击左侧目录中的标题来查看随笔内容</p>';

    // 显示成功通知
    showNotification('随笔删除成功！', 'success');
}

// 从本地存储获取随笔数据
function getEssaysFromStorage() {
    const essays = localStorage.getItem('essays');
    return essays ? JSON.parse(essays) : [];
}

// 保存随笔到本地存储
function saveEssayToStorage(essay) {
    let essays = getEssaysFromStorage();
    essays.unshift(essay); // 添加到数组开头
    localStorage.setItem('essays', JSON.stringify(essays));
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 简单的Markdown转HTML
function convertMarkdownToHtml(markdown) {
    // 替换标题
    markdown = markdown.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    markdown = markdown.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    markdown = markdown.replace(/^# (.*$)/gm, '<h1>$1</h1>');

    // 替换段落
    markdown = markdown.replace(/^(?!<h|<ul|<ol|<li)(.*$)/gm, '<p>$1</p>');

    // 替换换行
    markdown = markdown.replace(/\n/g, '<br>');

    return markdown;
}

// 移动端菜单功能（复制自script.js，确保功能一致）
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

// 通知函数（如果script.js中已经定义，这里可以省略，但为了保险起见，保留一份）
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

// 添加动画样式
const style = document.createElement('style');
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

    /* 随笔页面样式 */
    .essays-controls {
        margin: 20px 0;
        text-align: right;
    }

    .essays-container {
        display: flex;
        gap: 30px;
        margin-bottom: 50px;
    }

    .essays-sidebar {
        width: 30%;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 20px;
        position: sticky;
        top: 100px;
        height: fit-content;
    }

    .essays-list {
        list-style: none;
        margin-top: 15px;
    }

    .essay-item {
        padding: 12px 15px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .essay-item:hover {
        background-color: #f8f9fa;
    }

    .essay-item-content {
        flex-grow: 1;
    }

    .essay-title {
        font-weight: 500;
        display: block;
    }

    .essay-date {
        font-size: 0.8rem;
        color: #6c757d;
    }

    .delete-btn {
        background-color: transparent;
        border: none;
        color: #dc3545;
        cursor: pointer;
        padding: 5px 10px;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .essay-item:hover .delete-btn {
        opacity: 1;
    }

    .delete-btn:hover {
        color: #bd2130;
    }

    .essays-content {
        width: 70%;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 30px;
    }

    .essay-content {
        line-height: 1.8;
    }

    .essay-meta {
        color: #6c757d;
        font-size: 0.9rem;
        margin-bottom: 20px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    }

    .essay-body p {
        margin-bottom: 15px;
    }

    .no-essays {
        text-align: center;
        color: #6c757d;
        padding: 20px 0;
    }

    /* 模态框样式 */
    .modal {
        display: none;
        position: fixed;
        z-index: 10001;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        overflow: auto;
    }

    .modal-content {
        background-color: #fff;
        margin: 5% auto;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        width: 80%;
        max-width: 600px;
        animation: modalFadeIn 0.3s;
    }

    @keyframes modalFadeIn {
        from {
            opacity: 0;
            transform: translateY(-50px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .close-btn {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
    }

    .close-btn:hover {
        color: #333;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
    }

    .form-group input,
    .form-group textarea {
        width: 100%;
        padding: 10px 15px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 1rem;
        resize: vertical;
    }

    .form-group textarea {
        min-height: 200px;
    }

    @media (max-width: 992px) {
        .essays-container {
            flex-direction: column;
        }

        .essays-sidebar,
        .essays-content {
            width: 100%;
        }

        .essays-sidebar {
            position: static;
            margin-bottom: 30px;
        }
    }
`;

document.head.appendChild(style);