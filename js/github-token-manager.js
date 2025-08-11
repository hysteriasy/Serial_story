// GitHub Token 管理器
// 用于在 GitHub Pages 环境下安全管理 GitHub Personal Access Token

(function() {
  'use strict';

  // GitHub Token 管理器类
  class GitHubTokenManager {
    constructor() {
      this.tokenKey = 'github_token';
      console.log('🔧 GitHub Token 管理器已初始化');
    }

    // 设置 GitHub Token
    setToken(token) {
      if (!token || typeof token !== 'string') {
        throw new Error('无效的 GitHub Token');
      }

      // 验证 token 格式
      if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        console.warn('⚠️ Token 格式可能不正确，应以 ghp_ 或 github_pat_ 开头');
      }

      try {
        // 保存到 localStorage
        localStorage.setItem(this.tokenKey, token);
        
        // 设置到 GitHub 存储实例
        if (window.githubStorage) {
          window.githubStorage.setToken(token);
        }
        
        // 设置到数据管理器
        if (window.dataManager && window.dataManager.githubStorage) {
          window.dataManager.githubStorage.setToken(token);
        }

        console.log('✅ GitHub Token 已设置');
        return true;
      } catch (error) {
        console.error('❌ 设置 GitHub Token 失败:', error);
        return false;
      }
    }

    // 获取 GitHub Token
    getToken() {
      try {
        return localStorage.getItem(this.tokenKey);
      } catch (error) {
        console.error('❌ 获取 GitHub Token 失败:', error);
        return null;
      }
    }

    // 清除 GitHub Token
    clearToken() {
      try {
        localStorage.removeItem(this.tokenKey);
        
        if (window.githubStorage) {
          window.githubStorage.token = null;
        }
        
        if (window.dataManager && window.dataManager.githubStorage) {
          window.dataManager.githubStorage.token = null;
        }

        console.log('✅ GitHub Token 已清除');
        return true;
      } catch (error) {
        console.error('❌ 清除 GitHub Token 失败:', error);
        return false;
      }
    }

    // 验证 Token 权限
    async validateToken(token = null) {
      const tokenToUse = token || this.getToken();
      
      if (!tokenToUse) {
        throw new Error('没有可用的 GitHub Token');
      }

      try {
        // 验证用户信息
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${tokenToUse}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (!userResponse.ok) {
          throw new Error(`Token 验证失败: ${userResponse.status}`);
        }

        const user = await userResponse.json();
        console.log(`✅ Token 验证成功，用户: ${user.login}`);

        // 检查仓库权限
        const repoResponse = await fetch('https://api.github.com/repos/hysteriasy/Serial_story', {
          headers: {
            'Authorization': `token ${tokenToUse}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (!repoResponse.ok) {
          throw new Error(`仓库访问失败: ${repoResponse.status}`);
        }

        const repo = await repoResponse.json();
        console.log(`✅ 仓库访问成功: ${repo.full_name}`);
        
        return {
          valid: true,
          user: user,
          repository: repo,
          permissions: repo.permissions
        };
      } catch (error) {
        console.error('❌ Token 验证失败:', error);
        throw error;
      }
    }

    // 检查 Token 是否已配置
    isTokenConfigured() {
      const token = this.getToken();
      return token && token.length > 0;
    }

    // 获取 Token 状态信息
    getTokenStatus() {
      const token = this.getToken();
      return {
        configured: !!token,
        length: token ? token.length : 0,
        masked: token ? `${token.substring(0, 8)}...${token.substring(token.length - 4)}` : null
      };
    }
  }

  // 创建全局实例
  window.githubTokenManager = new GitHubTokenManager();

  // 为向后兼容，提供简化的全局函数
  window.setupGitHubToken = function(token) {
    return window.githubTokenManager.setToken(token);
  };

  window.validateTokenPermissions = function(token) {
    return window.githubTokenManager.validateToken(token);
  };

  console.log('🔧 GitHub Token 管理器已加载');

})();
