// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 确保auth对象已加载并检查登录状态
    if (typeof auth !== 'undefined') {
        auth.checkAuthStatus();
        if (auth.currentUser) {
            console.log(`📋 Essays页面：当前登录用户 ${auth.currentUser.username} (${auth.currentUser.role})`);
        } else {
            console.log('📋 Essays页面：当前未登录');
        }
    }

    // 初始化随笔页面
    initEssaysPage();
});

// 初始化随笔页面
function initEssaysPage() {
    // 加载随笔列表
    loadEssaysList().catch(error => {
        console.error('初始化随笔列表失败:', error);
    });

    // 初始化移动端菜单
    initMobileMenu();
}



// 加载随笔列表 - 改为async函数
async function loadEssaysList() {
    const essaysList = document.getElementById('essaysList');
    if (!essaysList) return;

    // 清空列表
    essaysList.innerHTML = '';

    try {
        // 从文件系统获取随笔数据
        const essays = await loadEssaysFromFiles();

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

            // 添加点击事件监听器
            const essayItemContent = li.querySelector('.essay-item-content');
            essayItemContent.addEventListener('click', () => {
                loadEssayContent(index);
            });

            // 添加删除事件监听器
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止触发随笔项的点击事件
                deleteEssay(index);
            });
        });
    } catch (error) {
        console.error('加载随笔列表失败:', error);
        essaysList.innerHTML = '<li class="error-message">加载随笔失败，请重试</li>';
    }
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

    // 处理内容和图片
    let contentHtml = `<p class="essay-meta">发布日期: ${formatDate(essay.date)}</p>
${convertMarkdownToHtml(essay.content)}`;

    // 如果有图片，添加到内容中
    if (essay.images && essay.images.length > 0) {
        contentHtml += '<div class="essay-images">';
        essay.images.forEach(image => {
            contentHtml += `
<div class="essay-image-container">
    <img src="${image.data}" alt="${image.name}" class="essay-image">
    <p class="image-caption">${image.name}</p>
</div>`;
        });
        contentHtml += '</div>';
    }

    essayBody.innerHTML = contentHtml;

    // 初始化评论系统
    if (typeof commentSystem !== 'undefined') {
        commentSystem.init(`essay_${index}`, 'essays');
    }

    // 滚动到内容区域
    document.getElementById('essayContent').scrollIntoView({ behavior: 'smooth' });
}



// 获取存储的随笔
function getEssaysFromStorage() {
  try {
    // 首先尝试从essays键获取数据（兼容格式）
    const essays = localStorage.getItem('essays');
    if (essays) {
      const essayList = JSON.parse(essays);
      if (essayList.length > 0) {
        console.log(`✅ 从essays存储加载了 ${essayList.length} 篇随笔`);
        return essayList;
      }
    }

    // 如果essays为空，尝试从新格式的存储中获取随笔
    const publicWorks = localStorage.getItem('publicWorks_literature');
    if (publicWorks) {
      const worksList = JSON.parse(publicWorks);
      const essayWorks = [];

      worksList.forEach(workRef => {
        if (workRef.subcategory === 'essay') {
          const fullWorkData = localStorage.getItem(`work_${workRef.id}`);
          if (fullWorkData) {
            const workInfo = JSON.parse(fullWorkData);
            if (workInfo.permissions?.isPublic) {
              // 转换为essays格式
              essayWorks.push({
                title: workInfo.title,
                content: workInfo.content,
                date: workInfo.uploadTime,
                author: workInfo.uploadedBy
              });
            }
          }
        }
      });

      if (essayWorks.length > 0) {
        console.log(`✅ 从新格式存储转换了 ${essayWorks.length} 篇随笔`);
        // 将转换后的数据保存到essays格式中，以便下次直接使用
        localStorage.setItem('essays', JSON.stringify(essayWorks));
        return essayWorks;
      }
    }

    console.log('📝 没有找到随笔数据');
    return [];
  } catch (error) {
    console.error('❌ 获取随笔数据失败:', error);
    return [];
  }
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

// 显示随笔通知
function showEssayNotification(message, type = 'info') {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // 添加到页面
  document.body.appendChild(notification);

  // 自动移除
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// 初始化移动端菜单
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      mobileMenuBtn.classList.toggle('active');
    });
  }
}

// 从本地存储加载随笔
async function loadEssaysFromFiles() {
  try {
    // 首先尝试从新格式的本地存储获取随笔
    const essays = getEssaysFromStorage();

    // 如果有数据，直接返回
    if (essays && essays.length > 0) {
      console.log(`✅ 从本地存储加载了 ${essays.length} 篇随笔`);
      return essays.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 如果没有数据，尝试从文件系统加载（兼容旧版本）
    try {
      const response = await fetch('essays/_list.json');
      const fileList = await response.json();

      const fileEssays = await Promise.all(fileList.map(async filename => {
        const res = await fetch(`essays/${filename}`);
        return await res.json();
      }));

      console.log(`✅ 从文件系统加载了 ${fileEssays.length} 篇随笔`);
      return fileEssays.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (fileError) {
      console.log('📁 文件系统中没有随笔数据，这是正常的');
      return [];
    }
  } catch (error) {
    console.error('❌ 加载随笔失败:', error);
    return [];
  }
}

// 转换Markdown为HTML - 简化版
function convertMarkdownToHtml(markdown) {
  // 这里是一个简化版的Markdown转换
  // 实际应用中可以使用第三方库
  let html = markdown
    .replace(/(#{1,6})\s+([^\n]+)/g, function(match, p1, p2) {
      const headingLevel = Math.min(p1.length, 6);
      return `<h${headingLevel}>${p2}</h${headingLevel}>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>');

  return `<p>${html}</p>`;
}

// 检查用户是否可以管理指定作品
function canManageWork(workAuthor, action) {
  // 确保auth对象已加载并检查登录状态
  if (typeof auth !== 'undefined') {
    // 如果auth.currentUser为空，尝试从sessionStorage恢复登录状态
    if (!auth.currentUser) {
      console.log('🔄 auth.currentUser为空，尝试恢复登录状态...');
      auth.checkAuthStatus();
    }

    if (auth.currentUser) {
      console.log(`🔐 检查用户权限: ${auth.currentUser.username} (${auth.currentUser.role}) 对作品作者 ${workAuthor} 的${action}权限`);

      // 管理员可以管理所有用户的作品
      if (auth.isAdmin && auth.isAdmin()) {
        console.log('✅ 管理员用户，对所有作品拥有完全控制权限');
        return true;
      }

      // 作品作者可以管理自己的作品
      if (auth.currentUser.username === workAuthor) {
        console.log('✅ 作品作者，可以管理自己的作品');
        return true;
      }

      // 编辑员可以编辑自己的作品，但不能删除其他人的作品
      if (action === '编辑' && auth.isEditor && auth.isEditor()) {
        if (auth.currentUser.username === workAuthor) {
          console.log('✅ 编辑员用户，可以编辑自己的作品');
          return true;
        } else {
          console.log('⚠️ 编辑员不能编辑其他人的作品');
          return false;
        }
      }

      console.log(`⚠️ 用户 ${auth.currentUser.username} 没有对此作品的${action}权限`);
      return false;
    } else {
      console.log('⚠️ 用户未登录');
      return false;
    }
  } else {
    console.log('⚠️ auth对象未定义');
    return false;
  }
}

// 密码验证函数（保留用于向后兼容）
async function verifyPassword(action, workAuthor = null) {
  // 如果提供了作品作者信息，先检查权限
  if (workAuthor && canManageWork(workAuthor, action)) {
    return true;
  }

  // 确保auth对象已加载并检查登录状态
  if (typeof auth !== 'undefined') {
    // 如果auth.currentUser为空，尝试从sessionStorage恢复登录状态
    if (!auth.currentUser) {
      console.log('🔄 auth.currentUser为空，尝试恢复登录状态...');
      auth.checkAuthStatus();
    }

    if (auth.currentUser) {
      console.log(`🔐 检查用户权限: ${auth.currentUser.username} (${auth.currentUser.role})`);

      // 检查管理员权限（管理员可以执行所有操作）
      if (auth.isAdmin && auth.isAdmin()) {
        console.log('✅ 管理员用户，直接授权');
        console.log(`管理员用户 ${auth.currentUser.username} 已授权执行${action}操作`);
        return true;
      }

      // 检查编辑员权限（编辑员可以编辑，但不能删除）
      if (action === '编辑' && auth.isEditor && auth.isEditor()) {
        console.log('✅ 编辑员用户，授权编辑操作');
        console.log(`编辑员用户 ${auth.currentUser.username} 已授权执行编辑操作`);
        return true;
      }

      // 检查特定权限
      if (auth.hasPermission) {
        const permissionMap = {
          '删除': 'delete',
          '编辑': 'edit'
        };

        const requiredPermission = permissionMap[action];
        if (requiredPermission && auth.hasPermission(requiredPermission)) {
          console.log(`✅ 用户具有${action}权限，直接授权`);
          console.log(`用户 ${auth.currentUser.username} 已授权执行${action}操作`);
          return true;
        }
      }

      console.log(`⚠️ 用户 ${auth.currentUser.username} 没有${action}权限，需要密码验证`);
    } else {
      console.log('⚠️ 用户未登录，使用密码验证');
    }
  } else {
    console.log('⚠️ auth对象未定义，使用密码验证');
  }

  // 对于已登录但权限不足的用户，提供更友好的提示
  if (typeof auth !== 'undefined' && auth.currentUser) {
    const message = `当前用户 ${auth.currentUser.username} 没有${action}权限。\n如需执行此操作，请输入管理员密码：`;
    const password = prompt(message);
    if (!password) {
      console.log('用户取消了密码输入');
      return false;
    }

    // 验证管理员密码
    try {
      // 使用auth模块的管理员密码验证
      if (auth.verifyAdminPassword) {
        await auth.verifyAdminPassword(password);
        console.log(`✅ 管理员密码验证通过，授权${action}操作`);
        return true;
      }
    } catch (error) {
      console.log(`❌ 管理员密码验证失败: ${error.message}`);
      alert(`密码验证失败: ${error.message}`);
      return false;
    }
  }

  // 回退到原有的密码验证机制（用于未登录用户或备用验证）
  const envKey = {
    '删除': 'VITE_ADMIN_PASSWORD',
    '编辑': 'VITE_EDITOR_PASSWORD'
  }[action];

  const password = prompt(`请输入${action}密码（请联系管理员获取）:`);
  if (!password) {
    console.log('用户取消了密码输入');
    return false;
  }

  // 从localStorage获取密码，如果没有则使用默认密码
  const storedPassword = localStorage.getItem(envKey);
  const defaultPassword = action === '删除' ? 'admin123' : 'editor123';
  const isValid = password === (storedPassword || defaultPassword);

  if (isValid) {
    console.log(`✅ 密码验证通过，授权${action}操作`);
  } else {
    console.log(`❌ 密码验证失败，拒绝${action}操作`);
  }

  return isValid;
}

// 删除随笔
async function deleteEssay(index) {
  try {
    console.log('deleteEssay function called with index:', index);

    // 从本地存储获取随笔数据
    let essays = getEssaysFromStorage();
    console.log('Current essays:', essays);

    if (index < 0 || index >= essays.length) {
      showNotification('无效的随笔索引', 'error');
      return;
    }

    const essay = essays[index];
    const workAuthor = essay.author || '未知作者';

    // 检查权限：管理员可以删除所有作品，作者可以删除自己的作品
    if (!canManageWork(workAuthor, '删除')) {
      // 如果没有直接权限，尝试密码验证
      const hasPermission = await verifyPassword('删除', workAuthor);
      if (!hasPermission) {
        showNotification('您没有权限删除此随笔', 'error');
        return;
      }
    }

    if (!confirm(`确定要删除随笔《${essay.title}》吗？\n作者：${workAuthor}`)) {
      console.log('Delete cancelled by user');
      return;
    }

    // 记录管理员操作日志
    if (auth.currentUser && auth.isAdmin() && auth.currentUser.username !== workAuthor) {
      console.log(`🔒 管理员 ${auth.currentUser.username} 删除了用户 ${workAuthor} 的随笔《${essay.title}》`);
      // 记录操作日志
      if (typeof adminLogger !== 'undefined') {
        adminLogger.logWorkManagement('delete', essay, workAuthor);
      }
    }

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
  } catch (error) {
    console.error('删除随笔时发生错误:', error);
    showNotification('删除失败：' + error.message, 'error');
  }
}



// 保存随笔到文件系统
async function saveEssayToFile(essay) {
    try {
        // 生成符合GitHub Pages要求的文件名
        const filename = `essay_${Date.now()}.json`;
        
        // 使用GitHub Pages兼容的保存方式
        localStorage.setItem(filename, JSON.stringify(essay));
        
        // 更新文件列表
        const fileList = JSON.parse(localStorage.getItem('_list') || '[]');
        fileList.unshift(filename);
        localStorage.setItem('_list', JSON.stringify(fileList));
        
        showNotification('成功保存到本地存储（预览模式）', 'success');
        return { status: 'success' };
    } catch (error) {
        console.error('保存失败:', error);
        showNotification('自动保存失败：' + error.message, 'error');
        throw error;
    }
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

    /* 随笔图片样式 */
    .essay-images {
        margin-top: 30px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }

    .essay-image-container {
        background-color: #f8f9fa;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .essay-image-container:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }

    .essay-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
        display: block;
    }

    .image-caption {
        padding: 12px 15px;
        text-align: center;
        font-size: 0.9rem;
        color: #6c757d;
        background-color: white;
    }

    .help-text {
        font-size: 0.8rem;
        color: #6c757d;
        margin-top: 5px;
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