// 环境检测和存储策略管理模块
class EnvironmentManager {
  constructor() {
    this.environment = this.detectEnvironment();
    this.storageStrategy = this.determineStorageStrategy();
    console.log(`🌍 环境检测: ${this.environment}, 存储策略: ${this.storageStrategy}`);
  }

  // 检测当前运行环境
  detectEnvironment() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // 检测是否为本地文件访问
    if (protocol === 'file:') {
      return 'local_file';
    }

    // 检测是否为GitHub Pages
    if (hostname === 'hysteriasy.github.io' && pathname.startsWith('/Serial_story')) {
      return 'github_pages';
    }

    // 检测是否为本地开发服务器
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
      return 'local_server';
    }

    // 其他情况视为生产环境
    return 'production';
  }

  // 根据环境确定存储策略
  determineStorageStrategy() {
    switch (this.environment) {
      case 'local_file':
      case 'local_server':
        return 'local_storage'; // 本地环境使用本地存储
      case 'github_pages':
      case 'production':
        return 'github_storage'; // 线上环境使用GitHub存储
      default:
        return 'local_storage'; // 默认使用本地存储
    }
  }

  // 获取当前环境
  getEnvironment() {
    return this.environment;
  }

  // 获取存储策略
  getStorageStrategy() {
    return this.storageStrategy;
  }

  // 是否为线上环境
  isOnlineEnvironment() {
    return this.environment === 'github_pages' || this.environment === 'production';
  }

  // 是否为本地环境
  isLocalEnvironment() {
    return this.environment === 'local_file' || this.environment === 'local_server';
  }

  // 是否应该使用GitHub存储
  shouldUseGitHubStorage() {
    return this.storageStrategy === 'github_storage';
  }

  // 是否应该使用本地存储
  shouldUseLocalStorage() {
    return this.storageStrategy === 'local_storage';
  }
}

// GitHub仓库存储模块
class GitHubStorage {
  constructor() {
    this.owner = 'hysteriasy'; // GitHub用户名
    this.repo = 'Serial_story'; // 仓库名
    this.token = null; // GitHub Personal Access Token
    this.baseUrl = 'https://api.github.com';
    this.branch = 'main'; // 默认分支

    // 初始化token
    this.initializeToken();
  }

  // 初始化GitHub token
  initializeToken() {
    // 从localStorage获取token
    this.token = localStorage.getItem('github_token');
    
    // 如果没有token，提示用户配置
    if (!this.token) {
      console.warn('⚠️ GitHub token未配置，将使用本地存储模式');
    }
  }

  // 设置GitHub token
  setToken(token) {
    this.token = token;
    localStorage.setItem('github_token', token);
    console.log('✅ GitHub token已保存');
  }

  // 验证token有效性
  async validateToken() {
    if (!this.token) {
      throw new Error('GitHub token未配置');
    }

    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      if (!response.ok) {
        throw new Error(`Token验证失败: ${response.status}`);
      }

      const user = await response.json();
      console.log(`✅ GitHub token验证成功，用户: ${user.login}`);
      return true;
    } catch (error) {
      console.error('❌ GitHub token验证失败:', error);
      throw error;
    }
  }

  // 生成文件路径
  generateFilePath(category, subcategory, filename, username) {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `user-uploads/${category}/${subcategory}/${username}/${timestamp}_${filename}`;
  }

  // 上传文件到GitHub
  async uploadFile(filePath, content, commitMessage, isBase64 = false) {
    if (!this.token) {
      throw new Error('GitHub token未配置');
    }

    try {
      // 检查文件是否已存在
      let sha = null;
      try {
        const existingFile = await this.getFile(filePath);
        sha = existingFile.sha;
        console.log(`📝 文件已存在，将更新: ${filePath}`);
      } catch (error) {
        console.log(`📄 创建新文件: ${filePath}`);
      }

      // 准备请求数据
      const requestData = {
        message: commitMessage,
        content: isBase64 ? content : btoa(unescape(encodeURIComponent(content))),
        branch: this.branch
      };

      if (sha) {
        requestData.sha = sha;
      }

      // 发送请求
      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28'
          },
          body: JSON.stringify(requestData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API错误: ${response.status} - ${errorData.message}`);
      }

      const result = await response.json();
      console.log(`✅ 文件上传成功: ${filePath}`);
      
      return {
        success: true,
        path: filePath,
        sha: result.content.sha,
        downloadUrl: result.content.download_url,
        htmlUrl: result.content.html_url,
        commitSha: result.commit.sha
      };

    } catch (error) {
      console.error('❌ GitHub文件上传失败:', error);
      throw error;
    }
  }

  // 获取文件内容
  async getFile(filePath) {
    if (!this.token) {
      throw new Error('GitHub token未配置');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // 404 错误是正常情况，静默处理
          const error = new Error('文件不存在');
          error.status = 404;
          error.isExpected = true; // 标记为预期错误
          throw error;
        }
        throw new Error(`获取文件失败: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // 只有非预期错误才输出到控制台
      if (!error.isExpected) {
        console.error('❌ 获取GitHub文件失败:', error);
      }
      throw error;
    }
  }

  // 删除文件
  async deleteFile(filePath, commitMessage = '删除文件') {
    if (!this.token) {
      throw new Error('GitHub token未配置');
    }

    console.log(`🗑️ GitHub删除文件: ${filePath}`);

    try {
      // 先获取文件的SHA
      let fileInfo;
      try {
        fileInfo = await this.getFile(filePath);
        console.log(`📄 获取到文件信息: ${filePath} (SHA: ${fileInfo.sha.substring(0, 8)}...)`);
      } catch (error) {
        // 如果文件不存在，直接返回成功（文件已经不存在了）
        if (error.status === 404 || error.message.includes('文件不存在')) {
          console.log(`ℹ️ 文件不存在，跳过删除: ${filePath}`);
          return { success: true, alreadyDeleted: true };
        }
        console.error(`❌ 获取文件信息失败: ${filePath}`, error);
        throw error;
      }

      console.log(`🔄 正在删除GitHub文件: ${filePath}`);
      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${filePath}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28'
          },
          body: JSON.stringify({
            message: commitMessage,
            sha: fileInfo.sha,
            branch: this.branch
          })
        }
      );

      console.log(`📡 删除请求响应: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        // 如果删除时文件已不存在，也视为成功
        if (response.status === 404) {
          console.log(`ℹ️ 删除时文件已不存在: ${filePath}`);
          return { success: true, alreadyDeleted: true };
        }

        let errorMessage = `删除文件失败: ${response.status} - ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = `删除文件失败: ${response.status} - ${errorData.message}`;
        } catch (e) {
          // 如果无法解析错误响应，使用默认错误消息
        }

        console.error(`❌ GitHub删除失败: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      console.log(`✅ GitHub文件删除成功: ${filePath}`);
      return { success: true, alreadyDeleted: false };
    } catch (error) {
      // 增强错误处理和日志记录
      if (!error.message.includes('文件不存在') && error.status !== 404) {
        console.error(`❌ GitHub文件删除失败: ${filePath}`, {
          error: error.message,
          status: error.status,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  // 上传文学作品
  async uploadLiteratureWork(workData, username) {
    const filename = `${workData.subcategory}_${Date.now()}.json`;
    const filePath = this.generateFilePath('literature', workData.subcategory, filename, username);
    
    const commitMessage = `添加${workData.categoryName}: ${workData.title} (by ${username})`;
    
    return await this.uploadFile(filePath, JSON.stringify(workData, null, 2), commitMessage);
  }

  // 上传媒体作品
  async uploadMediaWork(workData, username) {
    const fileExtension = workData.originalName.split('.').pop().toLowerCase();
    const filename = `${workData.subcategory}_${Date.now()}.${fileExtension}`;
    const filePath = this.generateFilePath(workData.mainCategory, workData.subcategory, filename, username);
    
    const commitMessage = `添加${workData.categoryName}: ${workData.title} (by ${username})`;
    
    // 媒体文件使用Base64编码
    const base64Content = workData.fileData.split(',')[1]; // 移除data:type;base64,前缀
    
    const result = await this.uploadFile(filePath, base64Content, commitMessage, true);
    
    // 同时上传元数据文件
    const metadataPath = filePath.replace(`.${fileExtension}`, '_metadata.json');
    const metadata = {
      ...workData,
      fileData: undefined, // 不在元数据中保存文件内容
      githubPath: filePath,
      downloadUrl: result.downloadUrl
    };
    
    await this.uploadFile(metadataPath, JSON.stringify(metadata, null, 2), `添加元数据: ${workData.title}`);
    
    return result;
  }

  // 检查GitHub连接状态
  async checkConnection() {
    try {
      await this.validateToken();
      return true;
    } catch (error) {
      return false;
    }
  }

  // 获取仓库信息
  async getRepoInfo() {
    if (!this.token) {
      throw new Error('GitHub token未配置');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`获取仓库信息失败: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ 获取GitHub仓库信息失败:', error);
      throw error;
    }
  }

  // 列出目录下的文件
  async listFiles(directoryPath = 'user-uploads') {
    if (!this.token) {
      throw new Error('GitHub token未配置');
    }

    try {
      console.log(`🔍 正在获取目录: ${directoryPath}`);
      console.log(`🔗 API URL: ${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${directoryPath}`);

      const response = await fetch(
        `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${directoryPath}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      );

      console.log(`📡 API响应状态: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        if (response.status === 404) {
          return []; // 目录不存在，返回空数组
        }
        throw new Error(`列出文件失败: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ 列出GitHub文件失败:', error);
      throw error;
    }
  }
}

// 创建全局实例
window.environmentManager = new EnvironmentManager();
window.githubStorage = new GitHubStorage();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EnvironmentManager, GitHubStorage };
}
