// 小说展示模块
class NovelsDisplay {
  constructor() {
    this.novelsData = [];
    this.novelSeries = new Map(); // 按小说标题分组的章节
    this.init();
  }

  async init() {
    console.log('🔄 初始化小说展示模块...');
    
    try {
      await this.loadNovelsData();
      this.organizeNovelSeries();
      this.renderNovels();
      console.log('✅ 小说展示模块初始化完成');
    } catch (error) {
      console.error('❌ 小说展示模块初始化失败:', error);
      this.showError();
    }
  }

  // 加载小说数据
  async loadNovelsData() {
    this.novelsData = [];

    try {
      // 从本地存储获取小说作品
      const localNovels = this.getLocalNovels();
      this.novelsData.push(...localNovels);

      // 如果Firebase可用，也从Firebase获取
      if (window.firebaseAvailable && firebase.apps.length) {
        try {
          const firebaseNovels = await this.getFirebaseNovels();
          this.novelsData.push(...firebaseNovels);
        } catch (error) {
          console.warn('从Firebase获取小说失败:', error);
        }
      }

      // 去重并按时间排序
      this.novelsData = this.removeDuplicates(this.novelsData);
      this.novelsData.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

      console.log(`📚 加载了 ${this.novelsData.length} 个小说章节`);
    } catch (error) {
      console.error('加载小说数据失败:', error);
      throw error;
    }
  }

  // 从本地存储获取小说
  getLocalNovels() {
    const novels = [];

    try {
      // 获取公共小说作品
      const publicWorks = localStorage.getItem('publicWorks_literature');
      if (publicWorks) {
        const worksList = JSON.parse(publicWorks);
        
        worksList.forEach(workRef => {
          if (workRef.subcategory === 'novel') {
            const fullWorkData = localStorage.getItem(`work_${workRef.id}`);
            if (fullWorkData) {
              const workInfo = JSON.parse(fullWorkData);
              if (workInfo.permissions?.isPublic) {
                novels.push(this.formatNovelData(workInfo));
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('从本地存储获取小说失败:', error);
    }

    return novels;
  }

  // 从Firebase获取小说
  async getFirebaseNovels() {
    const novels = [];

    try {
      // 检查Firebase是否可用
      if (!window.firebaseAvailable || typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
        console.info('📱 Novels: Firebase 不可用，跳过 Firebase 数据获取');
        return novels;
      }

      // 从公共文件列表获取
      const publicSnapshot = await firebase.database().ref('publicFiles/literature').once('value');
      const publicData = publicSnapshot.val() || {};

      Object.values(publicData).forEach(work => {
        if (work.subcategory === 'novel' && work.permissions?.isPublic) {
          novels.push(this.formatNovelData(work));
        }
      });
    } catch (error) {
      console.error('从Firebase获取小说失败:', error);
    }

    return novels;
  }

  // 格式化小说数据
  formatNovelData(workInfo) {
    return {
      id: workInfo.id,
      title: workInfo.title,
      content: workInfo.content,
      chapter: workInfo.chapter || 1,
      chapterTitle: workInfo.chapterTitle || '',
      author: workInfo.uploadedBy || '匿名',
      uploadTime: workInfo.uploadTime,
      permissions: workInfo.permissions
    };
  }

  // 去重
  removeDuplicates(novels) {
    const seen = new Set();
    return novels.filter(novel => {
      const key = `${novel.author}_${novel.title}_${novel.chapter}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // 组织小说系列
  organizeNovelSeries() {
    this.novelSeries.clear();

    this.novelsData.forEach(novel => {
      const seriesKey = `${novel.author}_${novel.title}`;
      
      if (!this.novelSeries.has(seriesKey)) {
        this.novelSeries.set(seriesKey, {
          title: novel.title,
          author: novel.author,
          chapters: [],
          totalChapters: 0,
          lastUpdate: novel.uploadTime
        });
      }

      const series = this.novelSeries.get(seriesKey);
      series.chapters.push(novel);
      series.totalChapters = series.chapters.length;
      
      // 更新最后更新时间
      if (new Date(novel.uploadTime) > new Date(series.lastUpdate)) {
        series.lastUpdate = novel.uploadTime;
      }
    });

    // 对每个系列的章节按章节号排序
    this.novelSeries.forEach(series => {
      series.chapters.sort((a, b) => a.chapter - b.chapter);
    });
  }

  // 渲染小说
  renderNovels() {
    const loadingElement = document.getElementById('loading');
    const gridElement = document.getElementById('novelsGrid');
    const noNovelsElement = document.getElementById('noNovels');

    // 隐藏加载状态
    loadingElement.style.display = 'none';

    if (this.novelSeries.size === 0) {
      gridElement.style.display = 'none';
      noNovelsElement.style.display = 'block';
      return;
    }

    // 显示小说网格
    noNovelsElement.style.display = 'none';
    gridElement.style.display = 'grid';

    // 渲染小说系列
    const seriesArray = Array.from(this.novelSeries.values());
    seriesArray.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
    
    gridElement.innerHTML = seriesArray.map(series => this.createNovelSeriesCard(series)).join('');
  }

  // 创建小说系列卡片
  createNovelSeriesCard(series) {
    const formattedDate = this.formatDate(series.lastUpdate);
    const latestChapter = series.chapters[series.chapters.length - 1];

    return `
      <div class="novel-series">
        <h2 class="novel-title">${this.escapeHtml(series.title)}</h2>
        <div class="novel-info">
          <div class="novel-stats">
            <span class="stat-badge">${series.totalChapters} 章节</span>
            <span class="stat-badge">最新: 第${latestChapter.chapter}章</span>
          </div>
          <div class="novel-author">作者: ${this.escapeHtml(series.author)}</div>
        </div>
        <div class="chapters-list">
          ${series.chapters.map(chapter => this.createChapterItem(chapter)).join('')}
        </div>
      </div>
    `;
  }

  // 创建章节项
  createChapterItem(chapter) {
    const formattedDate = this.formatDate(chapter.uploadTime);
    const preview = this.getContentPreview(chapter.content, 100);

    return `
      <div class="chapter-item" onclick="novelDisplay.openChapter('${chapter.id}')">
        <div class="chapter-header">
          <div class="chapter-title">
            ${chapter.chapterTitle ? this.escapeHtml(chapter.chapterTitle) : `第${chapter.chapter}章`}
          </div>
          <div class="chapter-number">第${chapter.chapter}章</div>
        </div>
        <div class="chapter-date">${formattedDate}</div>
        <div class="chapter-preview">${preview}</div>
        <div class="read-more">点击阅读全文 →</div>
      </div>
    `;
  }

  // 打开章节
  openChapter(chapterId) {
    const chapter = this.novelsData.find(ch => ch.id === chapterId);
    if (!chapter) return;

    const modal = document.createElement('div');
    modal.className = 'chapter-modal';
    modal.innerHTML = `
      <div class="chapter-modal-content">
        <span class="chapter-modal-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <h2 class="chapter-modal-title">
          ${chapter.chapterTitle ? this.escapeHtml(chapter.chapterTitle) : `第${chapter.chapter}章`}
        </h2>
        <div class="chapter-modal-content-text">${this.formatNovelContent(chapter.content)}</div>
      </div>
    `;

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  }

  // 格式化小说内容
  formatNovelContent(content) {
    if (!content) return '';
    
    return this.escapeHtml(content)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  // 获取内容预览
  getContentPreview(content, maxLength = 100) {
    if (!content) return '';
    
    const plainText = content.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
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
    const gridElement = document.getElementById('novelsGrid');
    const noNovelsElement = document.getElementById('noNovels');

    loadingElement.style.display = 'none';
    gridElement.style.display = 'none';
    noNovelsElement.style.display = 'block';
    
    noNovelsElement.innerHTML = `
      <div class="icon">❌</div>
      <h3>加载失败</h3>
      <p>无法加载小说作品，请刷新页面重试。</p>
    `;
  }
}

// 全局变量供HTML调用
let novelDisplay;

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
  novelDisplay = new NovelsDisplay();
});
