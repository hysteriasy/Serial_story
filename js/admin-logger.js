// 管理员操作日志系统
class AdminLogger {
  constructor() {
    this.logKey = 'admin_operation_logs';
    this.maxLogs = 1000; // 最多保存1000条日志
  }

  // 记录管理员操作
  logAdminOperation(operation, details = {}) {
    if (!auth.currentUser || !auth.isAdmin()) {
      return; // 只记录管理员操作
    }

    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      operator: auth.currentUser.username,
      operation: operation,
      details: details,
      userAgent: navigator.userAgent,
      ip: 'local', // 本地环境无法获取真实IP
      sessionId: this.getSessionId()
    };

    this.saveLogEntry(logEntry);
    console.log('🔒 管理员操作已记录:', logEntry);
  }

  // 记录作品管理操作
  logWorkManagement(action, workData, targetUser = null) {
    const details = {
      action: action, // 'delete', 'edit', 'permission_change'
      workId: workData.id,
      workTitle: workData.title,
      workType: workData.subcategory || workData.mainCategory,
      workAuthor: workData.uploadedBy || workData.author,
      targetUser: targetUser,
      isAdminAction: auth.currentUser.username !== (workData.uploadedBy || workData.author)
    };

    this.logAdminOperation('work_management', details);
  }

  // 记录权限变更操作
  logPermissionChange(workData, oldPermissions, newPermissions) {
    const details = {
      workId: workData.id,
      workTitle: workData.title,
      workAuthor: workData.uploadedBy || workData.author,
      oldVisibility: oldPermissions.visibility,
      newVisibility: newPermissions.visibility,
      oldAllowedUsers: oldPermissions.allowedUsers || [],
      newAllowedUsers: newPermissions.allowedUsers || [],
      oldBlockedUsers: oldPermissions.blockedUsers || [],
      newBlockedUsers: newPermissions.blockedUsers || []
    };

    this.logAdminOperation('permission_change', details);
  }

  // 记录用户管理操作
  logUserManagement(action, targetUser, details = {}) {
    const logDetails = {
      action: action, // 'create', 'delete', 'role_change', 'password_reset'
      targetUser: targetUser,
      ...details
    };

    this.logAdminOperation('user_management', logDetails);
  }

  // 记录登录操作
  logLoginOperation(action, username, success = true, reason = '') {
    const details = {
      action: action, // 'login', 'logout', 'login_failed'
      username: username,
      success: success,
      reason: reason,
      timestamp: new Date().toISOString()
    };

    // 登录操作不需要管理员权限检查
    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      operator: username,
      operation: 'authentication',
      details: details,
      userAgent: navigator.userAgent,
      ip: 'local',
      sessionId: this.getSessionId()
    };

    this.saveLogEntry(logEntry);
    console.log('🔐 登录操作已记录:', logEntry);
  }

  // 保存日志条目
  saveLogEntry(logEntry) {
    try {
      let logs = this.getLogs();
      
      // 添加新日志到开头
      logs.unshift(logEntry);
      
      // 限制日志数量
      if (logs.length > this.maxLogs) {
        logs = logs.slice(0, this.maxLogs);
      }
      
      localStorage.setItem(this.logKey, JSON.stringify(logs));
      
      // 如果Firebase可用，也保存到云端
      this.saveToFirebase(logEntry);
      
    } catch (error) {
      console.error('保存操作日志失败:', error);
    }
  }

  // 保存到Firebase（如果可用）
  async saveToFirebase(logEntry) {
    if (window.firebaseAvailable && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      try {
        await firebase.database().ref(`adminLogs/${logEntry.id}`).set(logEntry);
        console.log('✅ 操作日志已保存到Firebase');
      } catch (error) {
        console.warn('⚠️ 保存操作日志到Firebase失败:', error);
      }
    }
  }

  // 获取所有日志
  getLogs() {
    try {
      const logs = localStorage.getItem(this.logKey);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('获取操作日志失败:', error);
      return [];
    }
  }

  // 获取指定时间范围的日志
  getLogsByDateRange(startDate, endDate) {
    const logs = this.getLogs();
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  // 获取指定操作类型的日志
  getLogsByOperation(operation) {
    const logs = this.getLogs();
    return logs.filter(log => log.operation === operation);
  }

  // 获取指定用户的日志
  getLogsByUser(username) {
    const logs = this.getLogs();
    return logs.filter(log => 
      log.operator === username || 
      (log.details && log.details.targetUser === username)
    );
  }

  // 清理旧日志
  cleanOldLogs(daysToKeep = 30) {
    if (!auth.isAdmin()) {
      throw new Error('只有管理员可以清理日志');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const logs = this.getLogs();
    const filteredLogs = logs.filter(log => {
      return new Date(log.timestamp) >= cutoffDate;
    });

    localStorage.setItem(this.logKey, JSON.stringify(filteredLogs));
    
    this.logAdminOperation('log_cleanup', {
      originalCount: logs.length,
      remainingCount: filteredLogs.length,
      daysKept: daysToKeep
    });

    return {
      removed: logs.length - filteredLogs.length,
      remaining: filteredLogs.length
    };
  }

  // 导出日志
  exportLogs(format = 'json') {
    if (!auth.isAdmin()) {
      throw new Error('只有管理员可以导出日志');
    }

    const logs = this.getLogs();
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(logs);
    }
    
    throw new Error('不支持的导出格式');
  }

  // 转换为CSV格式
  convertToCSV(logs) {
    if (logs.length === 0) return '';

    const headers = ['时间', '操作员', '操作类型', '详情', '用户代理'];
    const rows = logs.map(log => [
      log.timestamp,
      log.operator,
      log.operation,
      JSON.stringify(log.details),
      log.userAgent
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // 生成日志ID
  generateLogId() {
    return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 获取会话ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('admin_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('admin_session_id', sessionId);
    }
    return sessionId;
  }

  // 获取日志统计信息
  getLogStats() {
    const logs = this.getLogs();
    const stats = {
      totalLogs: logs.length,
      operationTypes: {},
      operators: {},
      recentActivity: logs.slice(0, 10),
      dateRange: {
        earliest: null,
        latest: null
      }
    };

    logs.forEach(log => {
      // 统计操作类型
      stats.operationTypes[log.operation] = (stats.operationTypes[log.operation] || 0) + 1;
      
      // 统计操作员
      stats.operators[log.operator] = (stats.operators[log.operator] || 0) + 1;
      
      // 更新日期范围
      const logDate = new Date(log.timestamp);
      if (!stats.dateRange.earliest || logDate < new Date(stats.dateRange.earliest)) {
        stats.dateRange.earliest = log.timestamp;
      }
      if (!stats.dateRange.latest || logDate > new Date(stats.dateRange.latest)) {
        stats.dateRange.latest = log.timestamp;
      }
    });

    return stats;
  }
}

// 创建全局实例
const adminLogger = new AdminLogger();

// 在auth模块加载后，监听登录/登出事件
document.addEventListener('DOMContentLoaded', () => {
  // 监听登录成功事件
  if (typeof auth !== 'undefined') {
    const originalLogin = auth.login;
    auth.login = async function(username, password) {
      try {
        const result = await originalLogin.call(this, username, password);
        adminLogger.logLoginOperation('login', username, true);
        return result;
      } catch (error) {
        adminLogger.logLoginOperation('login_failed', username, false, error.message);
        throw error;
      }
    };

    const originalLogout = auth.logout;
    auth.logout = function() {
      const username = this.currentUser ? this.currentUser.username : 'unknown';
      const result = originalLogout.call(this);
      adminLogger.logLoginOperation('logout', username, true);
      return result;
    };
  }
});
