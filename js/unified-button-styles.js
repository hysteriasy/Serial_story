// 统一按钮样式系统 - 现代感强、简约、淡雅的设计
function addUnifiedButtonStyles() {
  if (document.getElementById('unifiedButtonStyles')) return;
  
  const style = document.createElement('style');
  style.id = 'unifiedButtonStyles';
  style.textContent = `
    /* 统一按钮基础样式 - 现代感强、简约、淡雅 */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1;
      text-align: center;
      text-decoration: none;
      white-space: nowrap;
      vertical-align: middle;
      cursor: pointer;
      user-select: none;
      border: 1px solid transparent;
      border-radius: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      position: relative;
      overflow: hidden;
    }

    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    /* 按钮尺寸变体 */
    .btn-xs {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      border-radius: 8px;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      border-radius: 10px;
    }

    .btn-lg {
      padding: 1rem 2rem;
      font-size: 1rem;
      border-radius: 14px;
    }

    /* 主要按钮样式 - 蓝色渐变 */
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-color: transparent;
    }

    .btn-primary:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      color: white;
    }

    .btn-primary:active {
      background: linear-gradient(135deg, #4e5bc6 0%, #5e377e 100%);
    }

    /* 次要按钮样式 - 灰色淡雅 */
    .btn-secondary {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      color: #6c757d;
      border-color: #dee2e6;
    }

    .btn-secondary:hover {
      background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
      color: #5a6268;
      border-color: #adb5bd;
    }

    /* 成功按钮样式 - 绿色渐变 */
    .btn-success {
      background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
      color: white;
      border-color: transparent;
    }

    .btn-success:hover {
      background: linear-gradient(135deg, #4e9a2a 0%, #96d4b8 100%);
      color: white;
    }

    /* 信息按钮样式 - 青色渐变 */
    .btn-info {
      background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
      color: white;
      border-color: transparent;
    }

    .btn-info:hover {
      background: linear-gradient(135deg, #5aa7f7 0%, #0770c7 100%);
      color: white;
    }

    /* 警告按钮样式 - 橙色渐变 */
    .btn-warning {
      background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%);
      color: white;
      border-color: transparent;
    }

    .btn-warning:hover {
      background: linear-gradient(135deg, #fcbf49 0%, #d63031 100%);
      color: white;
    }

    /* 危险按钮样式 - 红色渐变 */
    .btn-danger {
      background: linear-gradient(135deg, #ff7675 0%, #d63031 100%);
      color: white;
      border-color: transparent;
    }

    .btn-danger:hover {
      background: linear-gradient(135deg, #ff6b6b 0%, #c0392b 100%);
      color: white;
    }

    /* 轮廓按钮样式 */
    .btn-outline-primary {
      background: transparent;
      color: #667eea;
      border-color: #667eea;
    }

    .btn-outline-primary:hover {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-color: transparent;
    }

    .btn-outline-secondary {
      background: transparent;
      color: #6c757d;
      border-color: #6c757d;
    }

    .btn-outline-secondary:hover {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      color: #5a6268;
      border-color: #adb5bd;
    }

    .btn-outline-success {
      background: transparent;
      color: #56ab2f;
      border-color: #56ab2f;
    }

    .btn-outline-success:hover {
      background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
      color: white;
      border-color: transparent;
    }

    /* 文件操作按钮特殊样式 */
    .file-actions {
      display: flex;
      gap: 0.25rem;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .file-node:hover .file-actions {
      opacity: 1;
    }

    .file-actions .btn {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      border-radius: 6px;
      min-width: auto;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* 批量操作按钮样式 */
    .batch-controls .btn,
    .batch-actions .btn {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #333;
      font-weight: 500;
    }

    .batch-controls .btn:hover,
    .batch-actions .btn:hover {
      background: rgba(255, 255, 255, 1);
      transform: translateY(-1px);
    }

    /* 导入导出按钮样式 */
    .import-export-controls .btn {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(0, 123, 255, 0.2);
      color: #007bff;
    }

    .import-export-controls .btn:hover {
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      color: white;
      border-color: transparent;
    }

    /* 层级控制按钮样式 */
    .hierarchy-controls .btn {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 250, 0.9) 100%);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 0, 0, 0.1);
      color: #495057;
    }

    .hierarchy-controls .btn:hover {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      color: #343a40;
    }

    /* 模态框按钮样式 */
    .modal-footer .btn {
      min-width: 100px;
      justify-content: center;
    }

    .modal-footer .btn + .btn {
      margin-left: 0.75rem;
    }

    /* 下拉菜单按钮样式 */
    .dropdown-toggle {
      position: relative;
    }

    .dropdown-toggle::after {
      content: '▼';
      font-size: 0.7em;
      margin-left: 0.5rem;
      transition: transform 0.3s ease;
    }

    .dropdown-toggle[aria-expanded="true"]::after {
      transform: rotate(180deg);
    }

    /* 按钮组样式 */
    .btn-group {
      display: inline-flex;
      vertical-align: middle;
    }

    .btn-group .btn {
      border-radius: 0;
      margin-left: -1px;
    }

    .btn-group .btn:first-child {
      border-top-left-radius: 12px;
      border-bottom-left-radius: 12px;
      margin-left: 0;
    }

    .btn-group .btn:last-child {
      border-top-right-radius: 12px;
      border-bottom-right-radius: 12px;
    }

    /* 浮动操作按钮 */
    .btn-floating {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      padding: 0;
      font-size: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
    }

    .btn-floating:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    }

    /* 加载状态按钮 */
    .btn-loading {
      position: relative;
      color: transparent;
    }

    .btn-loading::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 1rem;
      height: 1rem;
      margin: -0.5rem 0 0 -0.5rem;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: btn-loading-spin 1s linear infinite;
    }

    @keyframes btn-loading-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
      .btn {
        padding: 0.625rem 1.25rem;
        font-size: 0.875rem;
      }

      .btn-xs {
        padding: 0.25rem 0.5rem;
        font-size: 0.7rem;
      }

      .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
      }

      .file-actions {
        opacity: 1;
      }

      .file-actions .btn {
        padding: 0.125rem 0.25rem;
        font-size: 0.7rem;
      }

      .modal-footer .btn {
        width: 100%;
        margin: 0.25rem 0;
      }

      .modal-footer .btn + .btn {
        margin-left: 0;
      }

      .btn-floating {
        bottom: 1rem;
        right: 1rem;
        width: 48px;
        height: 48px;
        font-size: 1.25rem;
      }
    }

    /* 深色模式支持 */
    @media (prefers-color-scheme: dark) {
      .btn-secondary {
        background: linear-gradient(135deg, #343a40 0%, #495057 100%);
        color: #f8f9fa;
        border-color: #6c757d;
      }

      .btn-secondary:hover {
        background: linear-gradient(135deg, #495057 0%, #6c757d 100%);
        color: white;
      }

      .hierarchy-controls .btn,
      .batch-controls .btn,
      .batch-actions .btn {
        background: rgba(52, 58, 64, 0.9);
        color: #f8f9fa;
        border-color: rgba(255, 255, 255, 0.1);
      }

      .hierarchy-controls .btn:hover,
      .batch-controls .btn:hover,
      .batch-actions .btn:hover {
        background: rgba(73, 80, 87, 0.9);
      }
    }
  `;
  
  document.head.appendChild(style);
}

// 自动添加统一按钮样式
addUnifiedButtonStyles();

// 导出样式函数供其他模块使用
window.addUnifiedButtonStyles = addUnifiedButtonStyles;
