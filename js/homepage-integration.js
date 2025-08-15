// 主页文件展示集成模块
class HomepageIntegration {
  constructor() {
    this.database = firebase.database();
    this.categories = {
      literature: {
        name: '文学作品',
        icon: '📚',
        container: '.project-card.literature'
      },
      art: {
        name: '绘画作品', 
        icon: '🎨',
        container: '.project-card.art'
      },
      music: {
        name: '音乐作品',
        icon: '🎵',
        container: '.project-card.music'
      },
      video: {
        name: '视频作品',
        icon: '🎬',
        container: '.project-card.video'
      }
    };
  }

  // 初始化主页文件展示
  async init() {
    try {
      // 由于主页不再显示具体作品，只更新统计信息
      await this.updateWorksStats();
    } catch (error) {
      console.error('主页统计信息更新失败:', error);
    }
  }

  // 更新作品统计
  async updateWorksStats() {
    try {
      console.log('📊 开始更新作品统计数据...');

      let totalWorks = 0;
      let literatureCount = 0;
      let mediaCount = 0;
      let lastUpdateTime = null;

      // 使用统一的数据获取方法
      const allWorks = await this.getAllWorksUnified();

      // 统计各类作品数量
      allWorks.forEach(work => {
        totalWorks++;

        // 按主分类统计
        if (work.mainCategory === 'literature') {
          literatureCount++;
        } else {
          mediaCount++;
        }

        // 找到最新的更新时间
        const workTime = new Date(work.uploadTime);
        if (!lastUpdateTime || workTime > lastUpdateTime) {
          lastUpdateTime = workTime;
        }
      });

      console.log(`📊 统计结果: 总计${totalWorks}个作品，文学${literatureCount}个，媒体${mediaCount}个`);

      // 更新页面显示
      this.updateStatsDisplay(totalWorks, literatureCount, mediaCount, lastUpdateTime);

    } catch (error) {
      console.error('更新作品统计失败:', error);
      // 显示错误状态
      this.updateStatsDisplay(0, 0, 0, null);
    }
  }

  // 统一获取所有作品数据（包含公开和私有作品）
  async getAllWorksUnified() {
    const allWorks = [];
    const processedIds = new Set(); // 防止重复

    try {
      console.log('🔍 开始从所有数据源获取作品...');

      // 1. 从localStorage获取所有work_*作品
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('work_')) {
          try {
            const workData = localStorage.getItem(key);
            if (workData) {
              const work = JSON.parse(workData);
              const workId = work.id || key.replace('work_', '');

              if (!processedIds.has(workId)) {
                allWorks.push({
                  ...work,
                  id: workId,
                  source: 'localStorage'
                });
                processedIds.add(workId);
              }
            }
          } catch (error) {
            console.warn(`解析作品数据失败: ${key}`, error);
          }
        }
      }

      // 2. 从Firebase获取作品（如果可用）
      if (window.firebaseAvailable && firebase.apps && firebase.apps.length) {
        try {
          const usersSnapshot = await this.database.ref('userFiles').once('value');
          const usersData = usersSnapshot.val() || {};

          Object.entries(usersData).forEach(([username, userFiles]) => {
            Object.entries(userFiles).forEach(([fileId, fileInfo]) => {
              if (!processedIds.has(fileId)) {
                allWorks.push({
                  ...fileInfo,
                  id: fileId,
                  owner: username,
                  source: 'firebase'
                });
                processedIds.add(fileId);
              }
            });
          });
        } catch (error) {
          console.warn('从Firebase获取作品失败:', error);
        }
      }

      console.log(`✅ 共获取到 ${allWorks.length} 个作品`);
      return allWorks;

    } catch (error) {
      console.error('获取作品数据失败:', error);
      return [];
    }
  }

  // 更新统计显示
  updateStatsDisplay(totalWorks, literatureCount, mediaCount, lastUpdateTime) {
    console.log('📊 更新统计显示:', { totalWorks, literatureCount, mediaCount, lastUpdateTime });

    // 更新总作品数
    const totalElement = document.getElementById('totalWorks');
    if (totalElement) {
      totalElement.textContent = totalWorks;
    }

    // 更新文学作品数
    const literatureElement = document.getElementById('literatureCount');
    if (literatureElement) {
      literatureElement.textContent = literatureCount;
    }

    // 更新媒体作品数
    const mediaElement = document.getElementById('mediaCount');
    if (mediaElement) {
      mediaElement.textContent = mediaCount;
    }

    // 更新最近更新时间
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
      if (lastUpdateTime) {
        const now = new Date();
        const diffTime = Math.abs(now - lastUpdateTime);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          lastUpdateElement.textContent = '今天';
        } else if (diffDays <= 7) {
          lastUpdateElement.textContent = `${diffDays}天前`;
        } else {
          lastUpdateElement.textContent = lastUpdateTime.toLocaleDateString();
        }
      } else {
        lastUpdateElement.textContent = '暂无';
      }
    }
  }

  // 加载公开文件
  async loadPublicFiles() {
    for (const [category, config] of Object.entries(this.categories)) {
      try {
        const files = await this.getPublicFilesByCategory(category);
        this.renderCategoryFiles(category, files);
      } catch (error) {
        console.error(`加载${config.name}失败:`, error);
      }
    }
  }

  // 获取指定分类的公开作品
  async getPublicFilesByCategory(category) {
    const publicWorks = [];

    try {
      // 首先尝试从Firebase获取
      if (window.firebaseAvailable && firebase.apps.length) {
        // 从公共文件列表获取
        const publicSnapshot = await this.database.ref(`publicFiles/${category}`).once('value');
        const publicData = publicSnapshot.val() || {};

        Object.values(publicData).forEach(file => {
          if (file.permissions?.isPublic) {
            publicWorks.push(file);
          }
        });

        // 从用户文件中获取公开文件
        const usersSnapshot = await this.database.ref('userFiles').once('value');
        const usersData = usersSnapshot.val() || {};

        Object.entries(usersData).forEach(([username, userFiles]) => {
          Object.entries(userFiles).forEach(([fileId, fileInfo]) => {
            if (fileInfo.mainCategory === category &&
                fileInfo.permissions?.isPublic &&
                !publicWorks.find(f => f.fileId === fileId)) {
              publicWorks.push({
                ...fileInfo,
                fileId: fileId,
                owner: username
              });
            }
          });
        });
      }
    } catch (error) {
      console.warn('从Firebase获取作品失败，尝试本地存储:', error);
    }

    // 从本地存储获取公开作品
    try {
      const localPublicWorks = this.getLocalPublicWorks(category);
      publicWorks.push(...localPublicWorks);
    } catch (error) {
      console.warn('从本地存储获取作品失败:', error);
    }

    // 去重并按上传时间排序
    const uniqueWorks = this.removeDuplicateWorks(publicWorks);
    return uniqueWorks.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));
  }

  // 从本地存储获取公开作品
  getLocalPublicWorks(category) {
    const localWorks = [];

    try {
      // 获取公共作品列表
      const publicWorksKey = `publicWorks_${category}`;
      const publicWorksData = localStorage.getItem(publicWorksKey);

      if (publicWorksData) {
        const publicWorksList = JSON.parse(publicWorksData);

        publicWorksList.forEach(workRef => {
          // 获取完整的作品信息
          const fullWorkData = localStorage.getItem(`work_${workRef.id}`);
          if (fullWorkData) {
            const workInfo = JSON.parse(fullWorkData);
            localWorks.push({
              ...workInfo,
              fileId: workInfo.id,
              owner: workInfo.uploadedBy,
              // 兼容旧格式
              originalName: workInfo.fileName || workInfo.title,
              downloadURL: workInfo.fileData || `local://${workInfo.id}`
            });
          }
        });
      }
    } catch (error) {
      console.error('解析本地作品数据失败:', error);
    }

    return localWorks;
  }

  // 去除重复作品
  removeDuplicateWorks(works) {
    const seen = new Set();
    return works.filter(work => {
      const key = `${work.owner}_${work.title}_${work.uploadTime}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // 渲染分类文件
  renderCategoryFiles(category, files) {
    const container = document.querySelector(this.categories[category].container);
    if (!container) return;

    const projectContent = container.querySelector('.project-content');
    if (!projectContent) return;

    // 如果有文件，更新内容
    if (files.length > 0) {
      const latestFiles = files.slice(0, 3); // 只显示最新的3个文件
      
      // 创建文件列表HTML
      const filesHTML = `
        <div class="uploaded-files">
          <h4>最新作品</h4>
          <div class="files-list">
            ${latestFiles.map(file => this.createFileItemHTML(file)).join('')}
          </div>
          ${files.length > 3 ? `<p class="more-files">还有 ${files.length - 3} 个作品...</p>` : ''}
        </div>
      `;
      
      // 在现有内容后添加文件列表
      const existingContent = projectContent.innerHTML;
      projectContent.innerHTML = existingContent + filesHTML;
    }
  }

  // 创建文件项HTML
  createFileItemHTML(file) {
    const fileIcon = this.getFileIcon(file.mainCategory, file.subcategory);
    const fileSize = this.formatFileSize(file.fileSize);
    const uploadDate = this.formatDate(file.uploadTime);
    
    return `
      <div class="file-item" data-file-id="${file.fileId}" data-owner="${file.owner}">
        <div class="file-icon">${fileIcon}</div>
        <div class="file-info">
          <h5 class="file-title">${file.title || file.originalName}</h5>
          <p class="file-meta">
            <span class="file-author">作者: ${file.owner}</span>
            <span class="file-size">${fileSize}</span>
            <span class="file-date">${uploadDate}</span>
          </p>
          ${file.description ? `<p class="file-description">${file.description}</p>` : ''}
        </div>
        <div class="file-actions">
          <button class="btn btn-small" onclick="homepageIntegration.viewFile('${file.fileId}', '${file.owner}')">
            查看
          </button>
          <button class="btn btn-small btn-outline" onclick="homepageIntegration.downloadFile('${file.downloadURL}', '${file.originalName}')">
            下载
          </button>
        </div>
      </div>
    `;
  }

  // 获取文件图标
  getFileIcon(mainCategory, subcategory) {
    const icons = {
      literature: '📖',
      art: '🖼️',
      music: '🎵',
      video: '🎬'
    };
    return icons[mainCategory] || '📄';
  }

  // 格式化文件大小
  formatFileSize(bytes) {
    if (!bytes) return '未知大小';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 格式化日期
  formatDate(timestamp) {
    if (!timestamp) return '未知时间';
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN');
  }

  // 查看作品
  async viewFile(fileId, owner) {
    try {
      // 检查用户是否有权限查看文件
      if (auth.currentUser) {
        const canAccess = await auth.canAccessFile(fileId, owner);
        if (!canAccess) {
          alert('您没有权限查看此作品');
          return;
        }
      }

      // 获取作品信息
      let workInfo = null;

      // 首先尝试从本地存储获取
      try {
        const localWorkData = localStorage.getItem(`work_${fileId}`);
        if (localWorkData) {
          workInfo = JSON.parse(localWorkData);
        }
      } catch (error) {
        console.warn('从本地存储获取作品失败:', error);
      }

      // 如果本地没有，尝试从Firebase获取
      if (!workInfo && window.firebaseAvailable && firebase.apps.length) {
        try {
          const snapshot = await this.database.ref(`userFiles/${owner}/${fileId}`).once('value');
          workInfo = snapshot.val();
        } catch (error) {
          console.warn('从Firebase获取作品失败:', error);
        }
      }

      if (!workInfo) {
        alert('作品不存在或已被删除');
        return;
      }

      // 根据作品类型打开不同的查看方式
      if (workInfo.mainCategory === 'literature') {
        this.viewLiteratureWork(workInfo);
      } else if (workInfo.mainCategory === 'art') {
        this.viewArtWork(workInfo);
      } else if (workInfo.mainCategory === 'music') {
        this.viewMusicWork(workInfo);
      } else if (workInfo.mainCategory === 'video') {
        this.viewVideoWork(workInfo);
      } else {
        // 默认处理
        if (workInfo.downloadURL) {
          window.open(workInfo.downloadURL, '_blank');
        } else {
          alert('无法打开此作品');
        }
      }

    } catch (error) {
      console.error('查看作品失败:', error);
      alert('查看作品失败');
    }
  }

  // 查看文学作品
  viewLiteratureWork(workInfo) {
    const modal = this.createWorkModal(workInfo);

    let contentHtml = '';
    if (workInfo.subcategory === 'novel' && workInfo.chapter) {
      contentHtml = `
        <div class="work-meta">
          <p><strong>类型:</strong> ${workInfo.subcategoryName}</p>
          <p><strong>章节:</strong> 第${workInfo.chapter}章 ${workInfo.chapterTitle || ''}</p>
          <p><strong>作者:</strong> ${workInfo.uploadedBy}</p>
          <p><strong>发布时间:</strong> ${this.formatDate(workInfo.uploadTime)}</p>
        </div>
        <div class="work-content">
          ${this.formatTextContent(workInfo.content)}
        </div>
      `;
    } else if (workInfo.subcategory === 'poetry' && workInfo.poetryType) {
      contentHtml = `
        <div class="work-meta">
          <p><strong>类型:</strong> ${workInfo.subcategoryName} (${workInfo.poetryType === 'modern' ? '现代诗' : '古体诗词'})</p>
          <p><strong>作者:</strong> ${workInfo.uploadedBy}</p>
          <p><strong>发布时间:</strong> ${this.formatDate(workInfo.uploadTime)}</p>
        </div>
        <div class="work-content poetry">
          ${this.formatTextContent(workInfo.content)}
        </div>
      `;
    } else {
      contentHtml = `
        <div class="work-meta">
          <p><strong>类型:</strong> ${workInfo.subcategoryName}</p>
          <p><strong>作者:</strong> ${workInfo.uploadedBy}</p>
          <p><strong>发布时间:</strong> ${this.formatDate(workInfo.uploadTime)}</p>
        </div>
        <div class="work-content">
          ${this.formatTextContent(workInfo.content)}
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="modal-content literature-modal">
        <span class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <h3>${workInfo.title}</h3>
        ${contentHtml}
        <div class="work-actions">
          <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">关闭</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // 查看绘画作品
  viewArtWork(workInfo) {
    const modal = this.createWorkModal(workInfo);
    modal.innerHTML = `
      <div class="modal-content art-modal">
        <span class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <h3>${workInfo.title}</h3>
        <div class="work-meta">
          <p><strong>类型:</strong> ${workInfo.subcategoryName}</p>
          <p><strong>作者:</strong> ${workInfo.uploadedBy}</p>
          <p><strong>发布时间:</strong> ${this.formatDate(workInfo.uploadTime)}</p>
          ${workInfo.description ? `<p><strong>作品简介:</strong> ${workInfo.description}</p>` : ''}
        </div>
        <div class="work-viewer">
          <img src="${workInfo.fileData || workInfo.downloadURL}" style="max-width: 100%; max-height: 70vh;" alt="${workInfo.title}">
        </div>
        <div class="work-actions">
          ${workInfo.downloadURL ? `<a href="${workInfo.downloadURL}" target="_blank" class="btn btn-primary">查看原图</a>` : ''}
          <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">关闭</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // 查看音乐作品
  viewMusicWork(workInfo) {
    const modal = this.createWorkModal(workInfo);
    modal.innerHTML = `
      <div class="modal-content music-modal">
        <span class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <h3>${workInfo.title}</h3>
        <div class="work-meta">
          <p><strong>类型:</strong> ${workInfo.subcategoryName}</p>
          <p><strong>作者:</strong> ${workInfo.uploadedBy}</p>
          <p><strong>发布时间:</strong> ${this.formatDate(workInfo.uploadTime)}</p>
          <p><strong>作品简介:</strong> ${workInfo.description}</p>
        </div>
        <div class="work-viewer">
          <audio controls style="width: 100%;">
            <source src="${workInfo.fileData || workInfo.downloadURL}" type="audio/mpeg">
            您的浏览器不支持音频播放。
          </audio>
        </div>
        <div class="work-actions">
          ${workInfo.downloadURL ? `<a href="${workInfo.downloadURL}" target="_blank" class="btn btn-primary">下载音频</a>` : ''}
          <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">关闭</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // 查看视频作品
  viewVideoWork(workInfo) {
    const modal = this.createWorkModal(workInfo);
    modal.innerHTML = `
      <div class="modal-content video-modal">
        <span class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <h3>${workInfo.title}</h3>
        <div class="work-meta">
          <p><strong>类型:</strong> ${workInfo.subcategoryName}</p>
          <p><strong>作者:</strong> ${workInfo.uploadedBy}</p>
          <p><strong>发布时间:</strong> ${this.formatDate(workInfo.uploadTime)}</p>
          <p><strong>作品简介:</strong> ${workInfo.description}</p>
        </div>
        <div class="work-viewer">
          <video controls style="width: 100%; max-height: 70vh;">
            <source src="${workInfo.fileData || workInfo.downloadURL}" type="video/mp4">
            您的浏览器不支持视频播放。
          </video>
        </div>
        <div class="work-actions">
          ${workInfo.downloadURL ? `<a href="${workInfo.downloadURL}" target="_blank" class="btn btn-primary">下载视频</a>` : ''}
          <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">关闭</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // 格式化文本内容
  formatTextContent(content) {
    if (!content) return '';

    // 简单的Markdown转换
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .split('</p><p>')
      .map(p => `<p>${p}</p>`)
      .join('');
  }

  // 创建作品模态框
  createWorkModal(workInfo) {
    const modal = document.createElement('div');
    modal.className = 'work-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      overflow-y: auto;
      padding: 20px;
    `;

    // 添加模态框样式
    if (!document.getElementById('work-modal-styles')) {
      const style = document.createElement('style');
      style.id = 'work-modal-styles';
      style.textContent = `
        .work-modal .modal-content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .work-modal .close-btn {
          position: absolute;
          top: 15px;
          right: 20px;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
          color: #aaa;
          transition: color 0.3s ease;
        }

        .work-modal .close-btn:hover {
          color: #333;
        }

        .work-modal h3 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #333;
          padding-right: 40px;
        }

        .work-meta {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #007bff;
        }

        .work-meta p {
          margin: 5px 0;
          color: #555;
        }

        .work-content {
          line-height: 1.8;
          color: #333;
          margin-bottom: 20px;
        }

        .work-content.poetry {
          white-space: pre-line;
          font-family: serif;
          text-align: center;
        }

        .work-viewer {
          text-align: center;
          margin: 20px 0;
        }

        .work-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }

        .literature-modal .modal-content {
          max-width: 900px;
        }

        .art-modal .work-viewer img {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `;
      document.head.appendChild(style);
    }

    return modal;
  }

  // 下载文件
  downloadFile(downloadURL, fileName) {
    const link = document.createElement('a');
    link.href = downloadURL;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 设置文件过滤器
  setupFileFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const filter = e.target.dataset.filter;
        this.filterFiles(filter);
        
        // 更新按钮状态
        filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
      });
    });
  }

  // 过滤文件显示
  filterFiles(filter) {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
      if (filter === 'all' || card.classList.contains(filter)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }
}

// 全局实例
let homepageIntegration;

// 全局统计更新函数
window.updateHomepageStats = function() {
  if (homepageIntegration) {
    console.log('🔄 手动触发统计数据更新...');
    homepageIntegration.updateWorksStats();
  } else {
    console.warn('⚠️ 首页统计模块尚未初始化');
  }
};

// 初始化主页集成
document.addEventListener('DOMContentLoaded', () => {
  console.log('🏠 开始初始化首页统计模块...');

  // 延迟初始化以确保所有依赖都已加载
  setTimeout(() => {
    try {
      homepageIntegration = new HomepageIntegration();
      homepageIntegration.init();
      console.log('✅ 首页统计模块初始化完成');
    } catch (error) {
      console.error('❌ 首页统计模块初始化失败:', error);
    }
  }, 500); // 延迟500ms确保其他模块已加载
});
