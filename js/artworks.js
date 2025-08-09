// 绘画作品展示模块
class ArtworksDisplay {
  constructor() {
    this.artworksData = [];
    this.currentFilter = 'all';
    this.init();
  }

  async init() {
    console.log('🔄 初始化绘画作品展示模块...');
    
    try {
      await this.loadArtworksData();
      this.setupFilters();
      this.renderArtworks();
      console.log('✅ 绘画作品展示模块初始化完成');
    } catch (error) {
      console.error('❌ 绘画作品展示模块初始化失败:', error);
      this.showError();
    }
  }

  // 加载绘画作品数据
  async loadArtworksData() {
    this.artworksData = [];

    try {
      // 从本地存储获取绘画作品
      const localArtworks = this.getLocalArtworks();
      this.artworksData.push(...localArtworks);

      // 如果Firebase可用，也从Firebase获取
      if (window.firebaseAvailable && firebase.apps.length) {
        try {
          const firebaseArtworks = await this.getFirebaseArtworks();
          this.artworksData.push(...firebaseArtworks);
        } catch (error) {
          console.warn('从Firebase获取绘画作品失败:', error);
        }
      }

      // 去重并按时间排序
      this.artworksData = this.removeDuplicates(this.artworksData);
      this.artworksData.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

      console.log(`🎨 加载了 ${this.artworksData.length} 个绘画作品`);
    } catch (error) {
      console.error('加载绘画作品数据失败:', error);
      throw error;
    }
  }

  // 从本地存储获取绘画作品
  getLocalArtworks() {
    const artworks = [];

    try {
      // 获取公共绘画作品
      const publicWorks = localStorage.getItem('publicWorks_art');
      if (publicWorks) {
        const worksList = JSON.parse(publicWorks);
        
        worksList.forEach(workRef => {
          const fullWorkData = localStorage.getItem(`work_${workRef.id}`);
          if (fullWorkData) {
            const workInfo = JSON.parse(fullWorkData);
            if (workInfo.permissions?.isPublic) {
              artworks.push(this.formatArtworkData(workInfo));
            }
          }
        });
      }
    } catch (error) {
      console.error('从本地存储获取绘画作品失败:', error);
    }

    return artworks;
  }

  // 从Firebase获取绘画作品
  async getFirebaseArtworks() {
    const artworks = [];

    try {
      // 从公共文件列表获取
      const publicSnapshot = await firebase.database().ref('publicFiles/art').once('value');
      const publicData = publicSnapshot.val() || {};
      
      Object.values(publicData).forEach(work => {
        if (work.permissions?.isPublic) {
          artworks.push(this.formatArtworkData(work));
        }
      });
    } catch (error) {
      console.error('从Firebase获取绘画作品失败:', error);
    }

    return artworks;
  }

  // 格式化绘画作品数据
  formatArtworkData(workInfo) {
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
      permissions: workInfo.permissions
    };
  }

  // 去重
  removeDuplicates(artworks) {
    const seen = new Set();
    return artworks.filter(artwork => {
      const key = `${artwork.author}_${artwork.title}_${artwork.uploadTime}`;
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
        this.renderArtworks();
      });
    });
  }

  // 渲染绘画作品
  renderArtworks() {
    const loadingElement = document.getElementById('loading');
    const gridElement = document.getElementById('artworksGrid');
    const noArtworksElement = document.getElementById('noArtworks');

    // 隐藏加载状态
    loadingElement.style.display = 'none';

    // 筛选绘画作品
    let filteredArtworks = this.artworksData;
    if (this.currentFilter !== 'all') {
      filteredArtworks = this.artworksData.filter(artwork => artwork.subcategory === this.currentFilter);
    }

    if (filteredArtworks.length === 0) {
      gridElement.style.display = 'none';
      noArtworksElement.style.display = 'block';
      return;
    }

    // 显示绘画作品网格
    noArtworksElement.style.display = 'none';
    gridElement.style.display = 'grid';

    // 渲染绘画作品卡片
    gridElement.innerHTML = filteredArtworks.map(artwork => this.createArtworkCard(artwork)).join('');
  }

  // 创建绘画作品卡片
  createArtworkCard(artwork) {
    const typeLabel = this.getTypeLabel(artwork.subcategory);
    const formattedDate = this.formatDate(artwork.uploadTime);
    const imageUrl = artwork.fileData || artwork.downloadURL;

    return `
      <div class="artwork-card" data-type="${artwork.subcategory}" onclick="artworksDisplay.openImage('${artwork.id}')">
        <div class="artwork-image">
          ${imageUrl ? 
            `<img src="${imageUrl}" alt="${this.escapeHtml(artwork.title)}" loading="lazy">` :
            `<div class="artwork-placeholder">🎨</div>`
          }
        </div>
        <div class="artwork-content">
          <div class="artwork-meta">
            <span class="artwork-type">${typeLabel}</span>
            <span class="artwork-date">${formattedDate}</span>
          </div>
          <h3 class="artwork-title">${this.escapeHtml(artwork.title)}</h3>
          ${artwork.description ? 
            `<div class="artwork-description">${this.escapeHtml(artwork.description)}</div>` : 
            ''
          }
          <div class="artwork-author">—— ${this.escapeHtml(artwork.author)}</div>
        </div>
      </div>
    `;
  }

  // 获取类型标签
  getTypeLabel(subcategory) {
    const labels = {
      painting: '绘画作品',
      sketch: '素描作品',
      digital: '数字艺术'
    };
    return labels[subcategory] || '绘画作品';
  }

  // 打开图片
  openImage(artworkId) {
    const artwork = this.artworksData.find(art => art.id === artworkId);
    if (!artwork) return;

    const imageUrl = artwork.fileData || artwork.downloadURL;
    if (!imageUrl) return;

    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
      <div class="image-modal-content">
        <span class="image-modal-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <img src="${imageUrl}" alt="${this.escapeHtml(artwork.title)}">
        <div class="image-modal-info">
          <div class="image-modal-title">${this.escapeHtml(artwork.title)}</div>
          <div class="image-modal-author">作者: ${this.escapeHtml(artwork.author)}</div>
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
    const gridElement = document.getElementById('artworksGrid');
    const noArtworksElement = document.getElementById('noArtworks');

    loadingElement.style.display = 'none';
    gridElement.style.display = 'none';
    noArtworksElement.style.display = 'block';
    
    noArtworksElement.innerHTML = `
      <div class="icon">❌</div>
      <h3>加载失败</h3>
      <p>无法加载绘画作品，请刷新页面重试。</p>
    `;
  }
}

// 全局变量供HTML调用
let artworksDisplay;

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
  artworksDisplay = new ArtworksDisplay();
});
