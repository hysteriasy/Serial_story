// essays.js - 随笔页面功能
// 处理随笔的显示、加载和管理

// 缓存变量，避免重复加载
let essaysCache = null;
let essaysCacheTime = 0;
const CACHE_DURATION = 30000; // 30秒缓存

// 用户状态监听变量
let lastUserState = null;

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

        // 记录初始用户状态
        lastUserState = getCurrentUserState();
    }

    // 初始化随笔页面
    initEssaysPage();

    // 启动用户状态监听
    startUserStateMonitoring();
});

// 初始化随笔页面
async function initEssaysPage() {
    try {
        // 初始化权限控制系统
        await initializePermissionSystems();

        // 加载随笔列表
        await loadEssaysList();
    } catch (error) {
        console.error('初始化随笔页面失败:', error);
    }

    // 移动端菜单功能已由页眉组件提供
}

// 初始化权限控制系统
async function initializePermissionSystems() {
    try {
        // 初始化文件权限系统
        if (typeof FilePermissionsSystem !== 'undefined') {
            window.filePermissionsSystem = new FilePermissionsSystem();
            console.log('✅ 文件权限系统初始化完成');
        } else {
            console.warn('⚠️ FilePermissionsSystem 未找到');
        }

        // 初始化内容访问控制系统
        if (typeof ContentAccessControl !== 'undefined') {
            window.contentAccessControl = new ContentAccessControl();
            await window.contentAccessControl.initialize();
            console.log('✅ 内容访问控制系统初始化完成');
        } else {
            console.warn('⚠️ ContentAccessControl 未找到');
        }

        // 初始化白名单黑名单管理器
        if (typeof WhitelistBlacklistManager !== 'undefined') {
            window.whitelistBlacklistManager = new WhitelistBlacklistManager();
            console.log('✅ 白名单黑名单管理器初始化完成');
        } else {
            console.warn('⚠️ WhitelistBlacklistManager 未找到');
        }

    } catch (error) {
        console.error('❌ 权限控制系统初始化失败:', error);
    }
}

// 获取当前用户状态
function getCurrentUserState() {
    if (typeof auth === 'undefined' || !auth.currentUser) {
        return { username: null, role: null, isLoggedIn: false };
    }

    return {
        username: auth.currentUser.username,
        role: auth.currentUser.role,
        isLoggedIn: true
    };
}

// 比较用户状态是否发生变化
function hasUserStateChanged(oldState, newState) {
    if (!oldState && !newState) return false;
    if (!oldState || !newState) return true;

    return oldState.username !== newState.username ||
           oldState.role !== newState.role ||
           oldState.isLoggedIn !== newState.isLoggedIn;
}

// 启动用户状态监听
function startUserStateMonitoring() {
    // 每3秒检查一次用户状态变化
    setInterval(() => {
        const currentState = getCurrentUserState();

        if (hasUserStateChanged(lastUserState, currentState)) {
            console.log('🔄 检测到用户状态变化，刷新随笔列表');
            console.log('旧状态:', lastUserState);
            console.log('新状态:', currentState);

            // 更新状态记录
            lastUserState = currentState;

            // 刷新随笔列表
            loadEssaysList(true).catch(error => {
                console.error('用户状态变化后刷新列表失败:', error);
            });
        }
    }, 3000);

    // 监听页面可见性变化，当页面重新可见时检查用户状态
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            setTimeout(() => {
                const currentState = getCurrentUserState();
                if (hasUserStateChanged(lastUserState, currentState)) {
                    console.log('🔄 页面重新可见，检测到用户状态变化');
                    lastUserState = currentState;
                    loadEssaysList(true).catch(error => {
                        console.error('页面可见性变化后刷新列表失败:', error);
                    });
                }
            }, 500);
        }
    });
}



// 加载随笔列表 - 改为async函数
async function loadEssaysList(forceRefresh = false) {
    const essaysList = document.getElementById('essaysList');
    if (!essaysList) return;

    // 清空列表
    essaysList.innerHTML = '';

    // 如果强制刷新，清除智能加载器的缓存
    if (forceRefresh && window.smartFileLoader) {
        window.smartFileLoader.clearCache();
        console.log('🔄 强制刷新：已清除缓存');
    }

    try {
        // 从文件系统获取随笔数据
        const allEssays = await loadEssaysFromFiles();

        if (allEssays.length === 0) {
            essaysList.innerHTML = '<li class="no-essays">暂无随笔，请上传新随笔</li>';
            return;
        }

        // 应用权限过滤
        console.log(`🔍 开始应用权限过滤，原始随笔数量: ${allEssays.length}`);
        const essays = await filterEssaysByPermissions(allEssays);

        if (essays.length === 0) {
            const currentUser = auth.currentUser;
            const message = currentUser
                ? `当前用户 ${currentUser.username} (${currentUser.role}) 暂无可访问的随笔`
                : '暂无公开随笔，请登录查看更多内容';
            console.log(`⚠️ 权限过滤后无可访问随笔: ${message}`);
            essaysList.innerHTML = `<li class="no-essays">${message}</li>`;
            return;
        }

        console.log(`📋 权限过滤后显示 ${essays.length}/${allEssays.length} 篇随笔`);

        // 记录过滤后的随笔标题
        const filteredTitles = essays.map(e => e.title).join(', ');
        console.log(`📝 可访问的随笔: ${filteredTitles}`);

        // 遍历随笔数据并生成列表
        essays.forEach((essay, index) => {
            const li = document.createElement('li');
            li.className = 'essay-item';

            // 添加权限级别标识
            if (essay._accessLevel) {
                li.setAttribute('data-access-level', essay._accessLevel);
                li.classList.add(`access-${essay._accessLevel}`);
            }

            // 创建内容容器
            const contentDiv = document.createElement('div');
            contentDiv.className = 'essay-item-content';
            contentDiv.setAttribute('data-index', index);

            // 创建标题区域
            const headerDiv = document.createElement('div');
            headerDiv.className = 'essay-header';

            // 安全地设置标题文本（避免HTML转义问题）
            const titleSpan = document.createElement('span');
            titleSpan.className = 'essay-title';
            titleSpan.textContent = essay.title; // 使用textContent确保中文正确显示

            const sourceSpan = document.createElement('span');
            sourceSpan.className = 'essay-source';
            sourceSpan.textContent = getSourceIcon(essay.source);

            // 添加权限级别标识
            const permissionSpan = document.createElement('span');
            permissionSpan.className = 'essay-permission';
            permissionSpan.textContent = getPermissionIcon(essay._accessLevel);
            permissionSpan.title = getPermissionDescription(essay._accessLevel, essay._accessReason);

            headerDiv.appendChild(titleSpan);
            headerDiv.appendChild(sourceSpan);
            headerDiv.appendChild(permissionSpan);

            // 创建元数据区域
            const metaDiv = document.createElement('div');
            metaDiv.className = 'essay-meta';

            const authorSpan = document.createElement('span');
            authorSpan.className = 'essay-author';
            authorSpan.textContent = `作者: ${essay.author}`;

            const dateSpan = document.createElement('span');
            dateSpan.className = 'essay-date';
            dateSpan.textContent = formatDate(essay.date);

            metaDiv.appendChild(authorSpan);
            metaDiv.appendChild(dateSpan);

            // 如果有修改时间，添加修改时间
            if (essay.lastModified && essay.lastModified !== essay.date) {
                const modifiedSpan = document.createElement('span');
                modifiedSpan.className = 'essay-modified';
                modifiedSpan.textContent = `修改: ${formatDate(essay.lastModified)}`;
                metaDiv.appendChild(modifiedSpan);
            }

            contentDiv.appendChild(headerDiv);
            contentDiv.appendChild(metaDiv);
            li.appendChild(contentDiv);
            essaysList.appendChild(li);

            // 添加点击事件监听器
            const essayItemContent = li.querySelector('.essay-item-content');
            essayItemContent.addEventListener('click', () => {
                loadEssayContent(index);
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
    // 检查缓存是否有效
    const now = Date.now();
    if (essaysCache && (now - essaysCacheTime) < CACHE_DURATION) {
      console.log(`📋 从缓存返回 ${essaysCache.length} 篇随笔`);
      return essaysCache;
    }

    // 首先尝试从essays键获取数据（兼容格式）
    const essays = localStorage.getItem('essays');
    if (essays) {
      const essayList = JSON.parse(essays);
      if (essayList.length > 0) {
        console.log(`✅ 从essays存储加载了 ${essayList.length} 篇随笔`);
        // 更新缓存
        essaysCache = essayList;
        essaysCacheTime = now;
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
              // 智能提取标题
              let title = workInfo.title || workInfo.filename;

              // 如果没有标题，尝试从内容中提取
              if (!title && workInfo.content) {
                const lines = workInfo.content.split('\n').filter(line => line.trim());
                if (lines.length > 0) {
                  const firstLine = lines[0].trim();
                  if (firstLine.startsWith('#')) {
                    title = firstLine.replace(/^#+\s*/, '').trim();
                  } else if (firstLine.length <= 50) {
                    title = firstLine;
                  } else {
                    title = firstLine.substring(0, 50) + (firstLine.length > 50 ? '...' : '');
                  }
                }
              }

              // 最后的备用方案
              if (!title) {
                title = workRef.id ? `作品 ${workRef.id.substring(0, 8)}` : '无标题';
              }

              // 转换为essays格式
              essayWorks.push({
                id: workRef.id,
                title: title,
                content: workInfo.content,
                date: workInfo.uploadTime,
                author: workInfo.uploadedBy || workInfo.author || '匿名',
                source: 'localStorage'
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

// 移动端菜单功能已由页眉组件提供，移除重复代码

// 根据用户权限过滤随笔列表
async function filterEssaysByPermissions(essays) {
    if (!essays || essays.length === 0) {
        return [];
    }

    console.log(`🔍 开始权限过滤，原始随笔数量: ${essays.length}`);

    // 获取当前用户信息
    const currentUser = (typeof auth !== 'undefined') ? auth.currentUser : null;
    console.log(`👤 当前用户状态: ${currentUser ? `${currentUser.username} (${currentUser.role})` : '未登录'}`);

    // 如果内容访问控制系统未初始化，使用基本权限过滤逻辑
    if (!window.contentAccessControl) {
        console.warn('⚠️ 内容访问控制系统未初始化，使用基本权限过滤逻辑');
        return applyBasicPermissionFilter(essays, currentUser);
    }

    try {
        // 为每个随笔添加必要的权限检查字段
        const essaysWithPermissionData = essays.map(essay => {
            // 确保随笔有必要的权限相关字段
            return {
                ...essay,
                // 如果没有作者信息，尝试从其他字段获取
                author: essay.author || essay.uploadedBy || essay.owner || 'unknown',
                // 如果没有权限设置，根据内容推断默认权限
                permissions: essay.permissions || inferEssayPermissions(essay),
                // 添加内容类型标识
                contentType: 'essay'
            };
        });

        // 使用内容访问控制系统过滤
        const filteredEssays = await window.contentAccessControl.filterContentList(
            essaysWithPermissionData,
            'essay'
        );

        console.log(`✅ 权限过滤完成，可访问随笔数量: ${filteredEssays.length}`);

        // 记录过滤详情
        if (auth.currentUser) {
            console.log(`👤 当前用户: ${auth.currentUser.username} (${auth.currentUser.role})`);
        } else {
            console.log('👤 当前用户: 未登录');
        }

        return filteredEssays;
    } catch (error) {
        console.error('❌ 权限过滤失败:', error);
        // 出错时返回空数组，确保安全
        return [];
    }
}

// 推断随笔的默认权限设置
function inferEssayPermissions(essay) {
    // 如果随笔已经有明确的权限设置
    if (essay.permissions) {
        return essay.permissions;
    }

    // 根据随笔的其他属性推断权限
    let permissionLevel = 'public'; // 默认为公开可见，确保未登录用户能看到内容

    // 检查是否有明确的权限标识
    if (essay.isPublic === true || essay.visibility === 'public') {
        permissionLevel = 'public';
    } else if (essay.isPrivate === true || essay.visibility === 'private') {
        permissionLevel = 'private';
    } else if (essay.visibility === 'visitor') {
        permissionLevel = 'visitor';
    } else if (essay.visibility === 'friend') {
        permissionLevel = 'friend';
    }

    // 如果没有明确的可见性设置，但有作者信息，可能需要更严格的权限
    if (!essay.visibility && !essay.isPublic && !essay.isPrivate) {
        // 检查是否是从GitHub加载的文件（通常是公开的）
        if (essay.source === 'github' || essay.source === 'github_uploads') {
            permissionLevel = 'public';
        }
        // 检查是否是从localStorage加载的（可能是私人的）
        else if (essay.source === 'localStorage' || essay.source === 'local') {
            permissionLevel = 'friend';
        }
        // 其他情况保持公开
    }

    // 使用文件权限系统创建权限结构
    if (window.filePermissionsSystem) {
        return window.filePermissionsSystem.createPermissionStructure(permissionLevel);
    }

    // 如果权限系统不可用，返回基本权限结构
    return {
        level: permissionLevel,
        isPublic: permissionLevel === 'public',
        requiredRole: permissionLevel === 'public' ? null : permissionLevel,
        metadata: {
            createdBy: essay.author || 'unknown',
            createdAt: essay.date || new Date().toISOString(),
            source: 'inferred'
        }
    };
}

// 基本权限过滤逻辑（当权限控制系统未初始化时使用）
function applyBasicPermissionFilter(essays, currentUser) {
    console.log(`🔧 执行基本权限过滤，用户: ${currentUser ? `${currentUser.username} (${currentUser.role})` : '未登录'}`);

    const filteredEssays = essays.filter(essay => {
        // 为随笔添加权限信息（如果没有的话）
        const permissions = essay.permissions || inferEssayPermissions(essay);
        const permissionLevel = permissions.level || 'public'; // 默认为公开可见

        // 记录权限检查过程
        console.log(`📝 检查随笔 "${essay.title}" 权限: ${permissionLevel}`);

        // 公开内容所有人都可以查看
        if (permissionLevel === 'public') {
            console.log(`  ✅ 公开内容，允许访问`);
            return true;
        }

        // 未登录用户只能查看公开内容
        if (!currentUser) {
            console.log(`  ❌ 未登录用户，拒绝访问非公开内容`);
            return false;
        }

        // 管理员可以查看所有内容
        if (currentUser.role === 'admin') {
            console.log(`  ✅ 管理员用户，允许访问所有内容`);
            return true;
        }

        // 私人内容只有作者可以查看
        if (permissionLevel === 'private') {
            const isAuthor = currentUser.username === essay.author;
            console.log(`  ${isAuthor ? '✅' : '❌'} 私人内容，作者检查: ${isAuthor}`);
            return isAuthor;
        }

        // 根据权限级别和用户角色判断
        switch (permissionLevel) {
            case 'visitor':
                const visitorAccess = ['visitor', 'friend', 'admin'].includes(currentUser.role);
                console.log(`  ${visitorAccess ? '✅' : '❌'} 访客级别内容，用户角色: ${currentUser.role}`);
                return visitorAccess;

            case 'friend':
                const friendAccess = ['friend', 'admin'].includes(currentUser.role);
                console.log(`  ${friendAccess ? '✅' : '❌'} 好友级别内容，用户角色: ${currentUser.role}`);
                return friendAccess;

            case 'admin':
                const adminAccess = currentUser.role === 'admin';
                console.log(`  ${adminAccess ? '✅' : '❌'} 管理员级别内容，用户角色: ${currentUser.role}`);
                return adminAccess;

            default:
                console.log(`  ❌ 未知权限级别: ${permissionLevel}，拒绝访问`);
                return false;
        }
    });

    console.log(`✅ 基本权限过滤完成，可访问随笔数量: ${filteredEssays.length}/${essays.length}`);
    return filteredEssays;
}

// 从多个数据源智能加载随笔
async function loadEssaysFromFiles() {
  try {
    // 在file://协议下，直接使用localStorage避免CORS问题
    if (window.location.protocol === 'file:') {
      console.log('📁 file://协议下直接使用localStorage');
      return getEssaysFromStorage();
    }

    // 使用智能文件加载器
    if (window.smartFileLoader) {
      const files = await window.smartFileLoader.loadFileList('essays');

      if (files && files.length > 0) {
        console.log(`✅ 智能加载器加载了 ${files.length} 篇随笔`);

        // 验证文件是否真实存在，清理无效记录
        const validatedFiles = await validateEssayFiles(files);
        console.log(`🔍 验证后保留 ${validatedFiles.length} 篇有效随笔`);

        // 转换为随笔格式并确保作者信息完整
        const essays = validatedFiles.map(file => {
          // 智能提取标题 - 优先级：title > filename > content前50字符 > ID
          let title = file.title || file.filename;

          // 确保标题是字符串类型，并且正确处理中文字符
          if (title && typeof title === 'string') {
            // 验证标题是否包含有效的中文字符
            title = title.trim();
          }

          // 如果没有标题，尝试从内容中提取
          if (!title && file.content) {
            // 尝试提取第一行作为标题（如果是Markdown格式）
            const lines = file.content.split('\n').filter(line => line.trim());
            if (lines.length > 0) {
              const firstLine = lines[0].trim();
              // 如果第一行是Markdown标题格式
              if (firstLine.startsWith('#')) {
                title = firstLine.replace(/^#+\s*/, '').trim();
              } else if (firstLine.length <= 50) {
                // 如果第一行较短，可能是标题
                title = firstLine;
              } else {
                // 否则取前50个字符作为标题
                title = firstLine.substring(0, 50) + (firstLine.length > 50 ? '...' : '');
              }
            }
          }

          // 最后的备用方案
          if (!title) {
            title = file.id ? `作品 ${file.id.substring(0, 8)}` : '无标题';
          }

          // 调试输出：检查标题编码
          if (title && title.includes('很久很久')) {
            console.log(`🔍 标题编码检查: "${title}"`);
            console.log(`🔍 标题字节: ${Array.from(title).map(c => c.charCodeAt(0)).join(',')}`);
            console.log(`🔍 标题Unicode: ${Array.from(title).map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join('')}`);
          }

          // 处理从user-uploads目录加载的数据
          const processedFile = {
            id: file.id,
            title: title,
            content: file.content || '',
            author: file.author || file.username || file.uploadedBy || '匿名',
            date: file.date || file.created_at || file.uploadTime || new Date().toISOString(),
            lastModified: file.lastModified || file.last_modified || file.date,
            source: file.source || 'unknown',
            type: file.type || file.mainCategory || 'literature',
            subcategory: file.subcategory || 'essay',
            permissions: file.permissions || { level: 'public' },
            filePath: file.filePath // 保存文件路径用于后续操作
          };

          // 如果是从GitHub uploads加载的，确保数据完整性
          if (file.source === 'github_uploads') {
            processedFile.source = 'github_uploads';
            // 确保有正确的作者信息
            if (!processedFile.author || processedFile.author === '匿名') {
              // 尝试从文件路径提取作者信息
              const pathMatch = file.filePath?.match(/user-uploads\/[^\/]+\/[^\/]+\/([^\/]+)\//);
              if (pathMatch) {
                processedFile.author = pathMatch[1];
              }
            }
          }

          return processedFile;
        });

        // 调试信息：显示加载的数据结构
        console.log('📊 验证后的随笔数据:', essays.map(essay => ({
          id: essay.id,
          title: essay.title,
          author: essay.author,
          source: essay.source
        })));

        return essays.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
    }

    // 回退到传统方法
    console.log('📁 回退到传统加载方法');

    // 首先尝试从新格式的本地存储获取随笔
    const essays = getEssaysFromStorage();

    // 如果有数据，直接返回
    if (essays && essays.length > 0) {
      console.log(`✅ 从本地存储加载了 ${essays.length} 篇随笔`);
      console.log('📊 本地存储返回的随笔数据:', essays.map(essay => ({
        id: essay.id,
        title: essay.title,
        author: essay.author,
        source: essay.source
      })));
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

      // 好友可以编辑自己的作品
      if (action === '编辑' && auth.isFriend && auth.isFriend()) {
        if (auth.currentUser.username === workAuthor) {
          console.log('✅ 好友用户，可以编辑自己的作品');
          return true;
        } else {
          console.log('⚠️ 好友不能编辑其他人的作品');
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

      // 检查好友权限（好友可以编辑，但不能删除）
      if (action === '编辑' && auth.isFriend && auth.isFriend()) {
        console.log('✅ 好友用户，授权编辑操作');
        console.log(`好友用户 ${auth.currentUser.username} 已授权执行编辑操作`);
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
  const defaultPassword = action === '删除' ? 'change_admin_password' : 'change_friend_password';
  const isValid = password === (storedPassword || defaultPassword);

  if (isValid) {
    console.log(`✅ 密码验证通过，授权${action}操作`);
  } else {
    console.log(`❌ 密码验证失败，拒绝${action}操作`);
  }

  return isValid;
}

// 验证随笔文件是否真实存在
async function validateEssayFiles(files) {
  if (!files || files.length === 0) {
    return [];
  }

  console.log(`🔍 开始验证 ${files.length} 个随笔文件...`);
  const validFiles = [];
  const invalidFiles = [];

  for (const file of files) {
    try {
      // 检查文件是否来自实际的文件系统
      if (file.source === 'github_uploads' && file.filePath) {
        // 对于GitHub uploads的文件，检查文件是否真实存在
        const exists = await checkFileExists(file.filePath);
        if (exists) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file);
          console.warn(`❌ 文件不存在: ${file.filePath}`);
        }
      } else if (file.source === 'localStorage') {
        // 对于localStorage的文件，检查数据是否完整
        if (file.id && file.content && file.title) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file);
          console.warn(`❌ localStorage数据不完整: ${file.id}`);
        }
      } else {
        // 其他来源的文件，暂时保留
        validFiles.push(file);
      }
    } catch (error) {
      invalidFiles.push(file);
      console.warn(`❌ 验证文件失败: ${file.id || file.filePath}`, error.message);
    }
  }

  // 清理无效的localStorage记录
  if (invalidFiles.length > 0) {
    await cleanupInvalidLocalStorageRecords(invalidFiles);
  }

  console.log(`✅ 验证完成: ${validFiles.length} 个有效文件, ${invalidFiles.length} 个无效文件已清理`);
  return validFiles;
}

// 检查文件是否存在
async function checkFileExists(filePath) {
  try {
    if (window.githubStorage && window.githubStorage.token) {
      // 使用GitHub API检查文件是否存在
      const response = await fetch(
        `https://api.github.com/repos/hysteriasy/Serial_story/contents/${filePath}`,
        {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${window.githubStorage.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      );
      return response.ok;
    } else {
      // 在本地环境中，尝试fetch文件
      const response = await fetch(filePath, { method: 'HEAD' });
      return response.ok;
    }
  } catch (error) {
    console.warn(`检查文件存在性失败: ${filePath}`, error.message);
    return false;
  }
}

// 清理无效的localStorage记录
async function cleanupInvalidLocalStorageRecords(invalidFiles) {
  console.log(`🧹 开始清理 ${invalidFiles.length} 个无效记录...`);

  for (const file of invalidFiles) {
    try {
      // 清理work_记录
      if (file.id) {
        const workKey = `work_${file.id}`;
        if (localStorage.getItem(workKey)) {
          localStorage.removeItem(workKey);
          console.log(`🗑️ 已清理: ${workKey}`);
        }
      }

      // 从publicWorks_literature列表中移除
      const publicWorksKey = 'publicWorks_literature';
      const publicWorks = localStorage.getItem(publicWorksKey);
      if (publicWorks) {
        try {
          const worksList = JSON.parse(publicWorks);
          const filteredList = worksList.filter(work => work.id !== file.id);
          if (filteredList.length !== worksList.length) {
            localStorage.setItem(publicWorksKey, JSON.stringify(filteredList));
            console.log(`🗑️ 已从公共作品列表移除: ${file.id}`);
          }
        } catch (error) {
          console.warn('清理公共作品列表失败:', error);
        }
      }

      // 从essays列表中移除
      const essaysKey = 'essays';
      const essays = localStorage.getItem(essaysKey);
      if (essays) {
        try {
          const essaysList = JSON.parse(essays);
          const filteredEssays = essaysList.filter(essay => essay.id !== file.id);
          if (filteredEssays.length !== essaysList.length) {
            localStorage.setItem(essaysKey, JSON.stringify(filteredEssays));
            console.log(`🗑️ 已从随笔列表移除: ${file.id}`);
          }
        } catch (error) {
          console.warn('清理随笔列表失败:', error);
        }
      }
    } catch (error) {
      console.warn(`清理记录失败: ${file.id}`, error);
    }
  }

  console.log('✅ 无效记录清理完成');
}

// 清除缓存函数
function clearEssaysCache() {
  essaysCache = null;
  essaysCacheTime = 0;
  console.log('🗑️ 随笔缓存已清除');
}

// 删除功能已移除，保持页面简洁性和安全性



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

// 移动端菜单功能已由页眉组件提供，移除重复代码

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

    /* 删除按钮样式已移除，保持页面简洁性 */

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

// 获取数据源图标
function getSourceIcon(source) {
    const icons = {
        'github': '🌐',
        'github_uploads': '📁', // GitHub用户上传文件
        'localStorage': '💾',
        'firebase': '🔥',
        'unknown': '❓'
    };
    return icons[source] || icons.unknown;
}

// 获取权限级别图标
function getPermissionIcon(accessLevel) {
    const icons = {
        'public': '🌍',      // 公开
        'friend': '👥',      // 好友可见
        'visitor': '👤',     // 访客可见
        'admin': '🔑',       // 管理员访问
        'private': '🔒',     // 私有
        'custom': '⚙️',      // 自定义权限
        'anonymous': '👻',   // 匿名访问
        'error': '⚠️'        // 错误
    };
    return icons[accessLevel] || '📄';
}

// 获取权限级别描述
function getPermissionDescription(accessLevel, accessReason) {
    const descriptions = {
        'public': '公开内容 - 所有人都可以查看',
        'friend': '好友内容 - 好友及以上权限可查看',
        'visitor': '访客内容 - 访客及以上权限可查看',
        'admin': '管理员内容 - 仅管理员可查看',
        'private': '私有内容 - 仅作者可查看',
        'custom': '自定义权限 - 根据特定规则访问',
        'anonymous': '匿名访问 - 允许未登录用户查看',
        'error': '权限检查出错'
    };

    let description = descriptions[accessLevel] || '未知权限级别';

    if (accessReason) {
        description += ` (${accessReason})`;
    }

    return description;
}

// 改进的日期格式化函数
function formatDate(dateString) {
    if (!dateString) return '未知时间';

    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return '今天';
        } else if (diffDays === 2) {
            return '昨天';
        } else if (diffDays <= 7) {
            return `${diffDays - 1}天前`;
        } else {
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } catch (error) {
        return dateString.substring(0, 10); // 返回日期部分
    }
}