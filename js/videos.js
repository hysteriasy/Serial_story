// 视频作品展示模块
class VideosDisplay {
  constructor() {
    this.videosData = [];
    this.currentFilter = 'all';
    this.init();
  }

  async init() {
    console.log('🔄 初始化视频作品展示模块...');
    
    try {
      await this.loadVideosData();
      this.setupFilters();
      this.renderVideos();
      console.log('✅ 视频作品展示模块初始化完成');
    } catch (error) {
      console.error('❌ 视频作品展示模块初始化失败:', error);
      this.showError();
    }
  }

  // 加载视频作品数据
  async loadVideosData() {
    this.videosData = [];

    try {
      // 从本地存储获取视频作品
      const localVideos = this.getLocalVideos();
      this.videosData.push(...localVideos);

      // 如果Firebase可用，也从Firebase获取
      if (window.firebaseAvailable && firebase.apps.length) {
        try {
          const firebaseVideos = await this.getFirebaseVideos();
          this.videosData.push(...firebaseVideos);
        } catch (error) {
          console.warn('从Firebase获取视频作品失败:', error);
        }
      }

      // 去重并按时间排序
      this.videosData = this.removeDuplicates(this.videosData);
      this.videosData.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

      console.log(`🎬 加载了 ${this.videosData.length} 个视频作品`);
    } catch (error) {
      console.error('加载视频作品数据失败:', error);
      throw error;
    }
  }

  // 从本地存储获取视频作品
  getLocalVideos() {
    const videos = [];

    try {
      // 获取公共视频作品
      const publicWorks = localStorage.getItem('publicWorks_video');
      if (publicWorks) {
        const worksList = JSON.parse(publicWorks);
        
        worksList.forEach(workRef => {
          const fullWorkData = localStorage.getItem(`work_${workRef.id}`);
          if (fullWorkData) {
            const workInfo = JSON.parse(fullWorkData);
            if (workInfo.permissions?.isPublic) {
              videos.push(this.formatVideoData(workInfo));
            }
          }
        });
      }
    } catch (error) {
      console.error('从本地存储获取视频作品失败:', error);
    }

    return videos;
  }

  // 从Firebase获取视频作品
  async getFirebaseVideos() {
    const videos = [];

    try {
      // 从公共文件列表获取
      const publicSnapshot = await firebase.database().ref('publicFiles/video').once('value');
      const publicData = publicSnapshot.val() || {};
      
      Object.values(publicData).forEach(work => {
        if (work.permissions?.isPublic) {
          videos.push(this.formatVideoData(work));
        }
      });
    } catch (error) {
      console.error('从Firebase获取视频作品失败:', error);
    }

    return videos;
  }

  // 格式化视频作品数据
  formatVideoData(workInfo) {
    return {
      id: workInfo.id,
      title: workInfo.title,
      description: workInfo.description || '',
      subcategory: workInfo.subcategory,
      subcategoryName: workInfo.subcategoryName,
      author: workInfo.uploadedBy || '匿名',
      uploadTime: workInfo.uploadTime,
      fileData: workInfo.fileData,
      downloadURL: workInfo.downloadURL,
      fileName: workInfo.fileName,
      fileSize: workInfo.fileSize,
      permissions: workInfo.permissions
    };
  }

  // 去重
  removeDuplicates(videos) {
    const seen = new Set();
    return videos.filter(video => {
      const key = `${video.author}_${video.title}_${video.uploadTime}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // 设置筛选器
  setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        // 更新按钮状态
        filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // 更新筛选器
        this.currentFilter = e.target.dataset.type;
        this.renderVideos();
      });
    });
  }

  // 渲染视频作品
  renderVideos() {
    const loadingElement = document.getElementById('loading');
    const gridElement = document.getElementById('videosGrid');
    const noVideosElement = document.getElementById('noVideos');

    // 隐藏加载状态
    loadingElement.style.display = 'none';

    // 筛选视频作品
    let filteredVideos = this.videosData;
    if (this.currentFilter !== 'all') {
      filteredVideos = this.videosData.filter(video => video.subcategory === this.currentFilter);
    }

    if (filteredVideos.length === 0) {
      gridElement.style.display = 'none';
      noVideosElement.style.display = 'block';
      return;
    }

    // 显示视频作品网格
    noVideosElement.style.display = 'none';
    gridElement.style.display = 'grid';

    // 渲染视频作品卡片
    gridElement.innerHTML = filteredVideos.map(video => this.createVideoCard(video)).join('');
  }

  // 创建视频作品卡片
  createVideoCard(video) {
    const typeLabel = this.getTypeLabel(video.subcategory);
    const formattedDate = this.formatDate(video.uploadTime);
    const videoUrl = video.fileData || video.downloadURL;
    const fileSize = this.formatFileSize(video.fileSize);

    return `
      <div class="video-card" data-type="${video.subcategory}">
        <div class="video-thumbnail" onclick="videosDisplay.playVideo('${video.id}')">
          ${videoUrl ? 
            `<video preload="metadata" muted>
              <source src="${videoUrl}" type="video/mp4">
              <source src="${videoUrl}" type="video/webm">
              <source src="${videoUrl}" type="video/ogg">
            </video>
            <div class="play-overlay">▶</div>` :
            `<div class="video-placeholder">🎬</div>`
          }
        </div>
        <div class="video-content">
          <div class="video-meta">
            <span class="video-type">${typeLabel}</span>
            <span class="video-date">${formattedDate}</span>
          </div>
          <h3 class="video-title">${this.escapeHtml(video.title)}</h3>
          ${video.description ? 
            `<div class="video-description">${this.escapeHtml(video.description)}</div>` : 
            ''
          }
          <div class="video-controls">
            <span class="video-duration">${fileSize ? `文件大小: ${fileSize}` : ''}</span>
            ${videoUrl ? 
              `<button class="watch-btn" onclick="videosDisplay.playVideo('${video.id}')">
                观看视频
              </button>` : 
              ''
            }
          </div>
          <div class="video-author">—— ${this.escapeHtml(video.author)}</div>
        </div>
      </div>
    `;
  }

  // 获取类型标签
  getTypeLabel(subcategory) {
    const labels = {
      short: '创意短片',
      documentary: '纪录片',
      travel: '旅行影像'
    };
    return labels[subcategory] || '视频作品';
  }

  // 播放视频
  playVideo(videoId) {
    const video = this.videosData.find(v => v.id === videoId);
    if (!video) return;

    const videoUrl = video.fileData || video.downloadURL;
    if (!videoUrl) return;

    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.innerHTML = `
      <div class="video-modal-content">
        <span class="video-modal-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <video controls autoplay>
          <source src="${videoUrl}" type="video/mp4">
          <source src="${videoUrl}" type="video/webm">
          <source src="${videoUrl}" type="video/ogg">
          您的浏览器不支持视频播放。
        </video>
        <div class="video-modal-info">
          <div class="video-modal-title">${this.escapeHtml(video.title)}</div>
          <div class="video-modal-author">作者: ${this.escapeHtml(video.author)}</div>
        </div>
      </div>
    `;

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // ESC键关闭
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleKeyPress);
      }
    };
    document.addEventListener('keydown', handleKeyPress);

    document.body.appendChild(modal);
  }

  // 格式化文件大小
  formatFileSize(bytes) {
    if (!bytes) return '';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '未知时间';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return '未知时间';
    }
  }

  // HTML转义
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 显示错误
  showError() {
    const loadingElement = document.getElementById('loading');
    const gridElement = document.getElementById('videosGrid');
    const noVideosElement = document.getElementById('noVideos');

    loadingElement.style.display = 'none';
    gridElement.style.display = 'none';
    noVideosElement.style.display = 'block';
    
    noVideosElement.innerHTML = `
      <div class="icon">❌</div>
      <h3>加载失败</h3>
      <p>无法加载视频作品，请刷新页面重试。</p>
    `;
  }
}

// 全局变量供HTML调用
let videosDisplay;

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
  videosDisplay = new VideosDisplay();
});
