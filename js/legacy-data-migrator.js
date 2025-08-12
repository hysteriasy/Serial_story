/**
 * 旧格式数据迁移工具
 * 用于清理和转换旧格式随笔数据到新的标准化格式
 */
class LegacyDataMigrator {
  constructor() {
    this.migrationLog = [];
    this.errors = [];
    this.stats = {
      totalFound: 0,
      converted: 0,
      uploaded: 0,
      cleaned: 0,
      errors: 0
    };
  }

  // 主要迁移方法
  async migrateLegacyData(options = {}) {
    const {
      dryRun = false,
      uploadToGitHub = true,
      cleanupAfterMigration = true,
      backupBeforeMigration = true
    } = options;

    this.log('🚀 开始旧格式数据迁移');
    this.log(`配置: 试运行=${dryRun}, 上传GitHub=${uploadToGitHub}, 清理=${cleanupAfterMigration}, 备份=${backupBeforeMigration}`);

    try {
      // 1. 备份现有数据
      if (backupBeforeMigration && !dryRun) {
        await this.backupLegacyData();
      }

      // 2. 识别旧格式数据
      const legacyData = await this.identifyLegacyData();
      this.stats.totalFound = legacyData.length;
      this.log(`📊 发现 ${legacyData.length} 条旧格式随笔数据`);

      if (legacyData.length === 0) {
        this.log('ℹ️ 没有发现需要迁移的旧格式数据');
        return this.getResult();
      }

      // 3. 转换数据格式
      const convertedData = await this.convertLegacyData(legacyData);
      this.stats.converted = convertedData.length;

      // 4. 上传到 GitHub（如果不是试运行）
      if (uploadToGitHub && !dryRun) {
        await this.uploadConvertedData(convertedData);
      }

      // 5. 清理旧数据（如果不是试运行）
      if (cleanupAfterMigration && !dryRun) {
        await this.cleanupLegacyData();
      }

      this.log('✅ 数据迁移完成');
      return this.getResult();

    } catch (error) {
      this.logError('❌ 数据迁移失败', error);
      throw error;
    }
  }

  // 识别旧格式数据
  async identifyLegacyData() {
    const legacyData = [];

    try {
      // 1. 检查 essays 键中的旧格式随笔
      const essaysData = localStorage.getItem('essays');
      if (essaysData) {
        const essays = JSON.parse(essaysData);
        if (Array.isArray(essays)) {
          essays.forEach((essay, index) => {
            legacyData.push({
              type: 'essay',
              source: 'localStorage.essays',
              index: index,
              data: essay,
              id: this.generateLegacyId(essay)
            });
          });
          this.log(`📚 发现 ${essays.length} 条旧格式随笔`);
        }
      }

      // 2. 检查其他可能的旧格式数据
      const legacyKeys = this.findLegacyKeys();
      for (const key of legacyKeys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            legacyData.push({
              type: 'legacy_work',
              source: key,
              data: parsed,
              id: key
            });
          }
        } catch (error) {
          this.logError(`解析旧格式数据失败: ${key}`, error);
        }
      }

      return legacyData;
    } catch (error) {
      this.logError('识别旧格式数据失败', error);
      return [];
    }
  }

  // 查找旧格式数据键
  findLegacyKeys() {
    const legacyKeys = [];
    const patterns = [
      /^essay_legacy_/,
      /^work_essay_legacy_/,
      /^essay_\d+\.json$/
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (patterns.some(pattern => pattern.test(key))) {
        legacyKeys.push(key);
      }
    }

    return legacyKeys;
  }

  // 转换旧格式数据
  async convertLegacyData(legacyData) {
    const convertedData = [];

    for (const item of legacyData) {
      try {
        let convertedWork;

        if (item.type === 'essay') {
          convertedWork = this.convertEssayToNewFormat(item.data, item.id);
        } else if (item.type === 'legacy_work') {
          convertedWork = this.convertLegacyWorkToNewFormat(item.data, item.id);
        }

        if (convertedWork) {
          convertedData.push(convertedWork);
          this.log(`✅ 转换成功: ${convertedWork.title}`);
        }

      } catch (error) {
        this.stats.errors++;
        this.logError(`转换失败: ${item.id}`, error);
      }
    }

    return convertedData;
  }

  // 转换随笔到新格式
  convertEssayToNewFormat(essay, legacyId) {
    const now = new Date().toISOString();
    const workId = legacyId || this.generateWorkId(essay.title);

    return {
      id: workId,
      mainCategory: 'literature',
      subCategory: 'essay',
      categoryName: '文学作品',
      subcategoryName: '生活随笔',
      title: essay.title || '无标题',
      content: essay.content || '',
      uploadedBy: essay.author || 'hysteria',
      uploadTime: essay.date || now,
      originalName: essay.title || '无标题',
      createdAt: essay.date || now,
      updatedAt: now,
      permissions: this.createDefaultPermissions(essay.author || 'hysteria'),
      metadata: {
        migratedFrom: 'legacy_essay',
        migrationDate: now,
        originalFormat: 'essays_array'
      }
    };
  }

  // 转换旧格式作品到新格式
  convertLegacyWorkToNewFormat(work, legacyId) {
    const now = new Date().toISOString();

    return {
      ...work,
      updatedAt: now,
      metadata: {
        ...work.metadata,
        migratedFrom: 'legacy_work',
        migrationDate: now,
        originalId: legacyId
      }
    };
  }

  // 创建默认权限
  createDefaultPermissions(author) {
    return {
      level: 'public',
      isPublic: true,
      allowComments: true,
      allowDownload: true,
      allowShare: true,
      owner: author,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // 生成作品ID
  generateWorkId(title) {
    const cleanTitle = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const timestamp = Date.now();
    return `work_${cleanTitle}_${timestamp}`;
  }

  // 生成旧格式ID
  generateLegacyId(essay) {
    const cleanTitle = essay.title.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.parse(essay.date) || Date.now();
    return `essay_legacy_${cleanTitle}_${timestamp}`;
  }

  // 上传转换后的数据
  async uploadConvertedData(convertedData) {
    if (!window.dataManager || !window.dataManager.shouldUseGitHubStorage()) {
      this.log('⚠️ GitHub 存储不可用，跳过上传');
      return;
    }

    this.log('🌐 开始上传转换后的数据到 GitHub');

    for (const work of convertedData) {
      try {
        // 保存到本地存储
        const workKey = `work_${work.id}`;
        localStorage.setItem(workKey, JSON.stringify(work));

        // 上传到 GitHub
        await window.dataManager.saveData(workKey, work, {
          category: 'works',
          commitMessage: `迁移旧格式数据: ${work.title}`
        });

        this.stats.uploaded++;
        this.log(`📤 上传成功: ${work.title}`);

      } catch (error) {
        this.stats.errors++;
        this.logError(`上传失败: ${work.title}`, error);
      }
    }
  }

  // 备份旧格式数据
  async backupLegacyData() {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        essays: localStorage.getItem('essays'),
        legacyKeys: {}
      };

      // 备份所有旧格式键
      const legacyKeys = this.findLegacyKeys();
      for (const key of legacyKeys) {
        backup.legacyKeys[key] = localStorage.getItem(key);
      }

      const backupKey = `legacy_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backup));
      this.log(`💾 创建备份: ${backupKey}`);

    } catch (error) {
      this.logError('创建备份失败', error);
    }
  }

  // 清理旧格式数据
  async cleanupLegacyData() {
    try {
      this.log('🧹 开始清理旧格式数据');

      // 清理 essays 键
      if (localStorage.getItem('essays')) {
        localStorage.removeItem('essays');
        this.stats.cleaned++;
        this.log('🗑️ 清理 essays 键');
      }

      // 清理其他旧格式键
      const legacyKeys = this.findLegacyKeys();
      for (const key of legacyKeys) {
        localStorage.removeItem(key);
        this.stats.cleaned++;
        this.log(`🗑️ 清理 ${key}`);
      }

      this.log(`✅ 清理完成，共清理 ${this.stats.cleaned} 个项目`);

    } catch (error) {
      this.logError('清理旧格式数据失败', error);
    }
  }

  // 记录日志
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.migrationLog.push(logEntry);
    
    // 只在调试模式下输出到控制台
    if (window.location.search.includes('debug=true')) {
      console.log(logEntry);
    }
  }

  // 记录错误
  logError(message, error) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: message,
      error: error.message || error
    };
    this.errors.push(errorEntry);
    this.log(`❌ ${message}: ${error.message || error}`);
  }

  // 获取迁移结果
  getResult() {
    return {
      success: this.stats.errors === 0,
      stats: this.stats,
      log: this.migrationLog,
      errors: this.errors
    };
  }
}

// 导出到全局
window.LegacyDataMigrator = LegacyDataMigrator;
