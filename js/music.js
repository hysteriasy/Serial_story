// 音乐作品展示模块
class MusicDisplay {
  constructor() {
    this.musicData = [];
    this.currentFilter = 'all';
    this.init();
  }

  async init() {
    console.log('🔄 初始化音乐作品展示模块...');
    
    try {
      await this.loadMusicData();
      this.setupFilters();
      this.renderMusic();
      console.log('✅ 音乐作品展示模块初始化完成');
    } catch (error) {
      console.error('❌ 音乐作品展示模块初始化失败:', error);
      this.showError();
    }
  }

  // 加载音乐作品数据
  async loadMusicData() {
    this.musicData = [];

    try {
      // 从本地存储获取音乐作品
      const localMusic = this.getLocalMusic();
      this.musicData.push(...localMusic);

      // 如果Firebase可用，也从Firebase获取
      if (window.firebaseAvailable && firebase.apps.length) {
        try {
          const firebaseMusic = await this.getFirebaseMusic();
          this.musicData.push(...firebaseMusic);
        } catch (error) {
          console.warn('从Firebase获取音乐作品失败:', error);
        }
      }

      // 去重并按时间排序
      this.musicData = this.removeDuplicates(this.musicData);
      this.musicData.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

      console.log(`🎵 加载了 ${this.musicData.length} 个音乐作品`);
    } catch (error) {
      console.error('加载音乐作品数据失败:', error);
      throw error;
    }
  }

  // 从本地存储获取音乐作品
  getLocalMusic() {
    const music = [];

    try {
      // 获取公共音乐作品
      const publicWorks = localStorage.getItem('publicWorks_music');
      if (publicWorks) {
        const worksList = JSON.parse(publicWorks);
        
        worksList.forEach(workRef => {
          const fullWorkData = localStorage.getItem(`work_${workRef.id}`);
          if (fullWorkData) {
            const workInfo = JSON.parse(fullWorkData);
            if (workInfo.permissions?.isPublic) {
              music.push(this.formatMusicData(workInfo));
            }
          }
        });
      }
    } catch (error) {
      console.error('从本地存储获取音乐作品失败:', error);
    }

    return music;
  }

  // 从Firebase获取音乐作品
  async getFirebaseMusic() {
    const music = [];

    try {
      // 从公共文件列表获取
      const publicSnapshot = await firebase.database().ref('publicFiles/music').once('value');
      const publicData = publicSnapshot.val() || {};
      
      Object.values(publicData).forEach(work => {
        if (work.permissions?.isPublic) {
          music.push(this.formatMusicData(work));
        }
      });
    } catch (error) {
      console.error('从Firebase获取音乐作品失败:', error);
    }

    return music;
  }

  // 格式化音乐作品数据
  formatMusicData(workInfo) {
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
  removeDuplicates(music) {
    const seen = new Set();
    return music.filter(track => {
      const key = `${track.author}_${track.title}_${track.uploadTime}`;
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
        this.renderMusic();
      });
    });
  }

  // 渲染音乐作品
  renderMusic() {
    const loadingElement = document.getElementById('loading');
    const gridElement = document.getElementById('musicGrid');
    const noMusicElement = document.getElementById('noMusic');

    // 隐藏加载状态
    loadingElement.style.display = 'none';

    // 筛选音乐作品
    let filteredMusic = this.musicData;
    if (this.currentFilter !== 'all') {
      filteredMusic = this.musicData.filter(track => track.subcategory === this.currentFilter);
    }

    if (filteredMusic.length === 0) {
      gridElement.style.display = 'none';
      noMusicElement.style.display = 'block';
      return;
    }

    // 显示音乐作品网格
    noMusicElement.style.display = 'none';
    gridElement.style.display = 'grid';

    // 渲染音乐作品卡片
    gridElement.innerHTML = filteredMusic.map(track => this.createMusicCard(track)).join('');
  }

  // 创建音乐作品卡片
  createMusicCard(track) {
    const typeLabel = this.getTypeLabel(track.subcategory);
    const formattedDate = this.formatDate(track.uploadTime);
    const audioUrl = track.fileData || track.downloadURL;
    const fileSize = this.formatFileSize(track.fileSize);

    return `
      <div class="music-card" data-type="${track.subcategory}">
        <div class="music-meta">
          <span class="music-type">${typeLabel}</span>
          <span class="music-date">${formattedDate}</span>
        </div>
        <h3 class="music-title">${this.escapeHtml(track.title)}</h3>
        ${track.description ? 
          `<div class="music-description">${this.escapeHtml(track.description)}</div>` : 
          ''
        }
        <div class="music-player">
          ${audioUrl ? 
            `<audio controls preload="metadata">
              <source src="${audioUrl}" type="audio/mpeg">
              <source src="${audioUrl}" type="audio/wav">
              <source src="${audioUrl}" type="audio/ogg">
              您的浏览器不支持音频播放。
            </audio>` :
            `<div class="audio-placeholder">
              <div class="icon">🎵</div>
              <p>音频文件不可用</p>
            </div>`
          }
        </div>
        <div class="music-controls">
          <span class="play-count">${fileSize ? `文件大小: ${fileSize}` : ''}</span>
          ${audioUrl ? 
            `<button class="download-btn" onclick="musicDisplay.downloadTrack('${track.id}')">
              下载音频
            </button>` : 
            ''
          }
        </div>
        <div class="music-author">—— ${this.escapeHtml(track.author)}</div>
      </div>
    `;
  }

  // 获取类型标签
  getTypeLabel(subcategory) {
    const labels = {
      original: '原创音乐',
      cover: '翻唱作品',
      instrumental: '器乐演奏'
    };
    return labels[subcategory] || '音乐作品';
  }

  // 下载音轨
  downloadTrack(trackId) {
    const track = this.musicData.find(t => t.id === trackId);
    if (!track) return;

    const audioUrl = track.fileData || track.downloadURL;
    if (!audioUrl) return;

    try {
      // 创建下载链接
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = track.fileName || `${track.title}.mp3`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请稍后重试');
    }
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
    const gridElement = document.getElementById('musicGrid');
    const noMusicElement = document.getElementById('noMusic');

    loadingElement.style.display = 'none';
    gridElement.style.display = 'none';
    noMusicElement.style.display = 'block';
    
    noMusicElement.innerHTML = `
      <div class="icon">❌</div>
      <h3>加载失败</h3>
      <p>无法加载音乐作品，请刷新页面重试。</p>
    `;
  }
}

// 全局变量供HTML调用
let musicDisplay;

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
  musicDisplay = new MusicDisplay();
});
