// 评论系统模块
class CommentSystem {
  constructor() {
    this.comments = {};
    this.currentWorkId = null;
    this.currentWorkType = null;
  }

  // 初始化评论系统
  init(workId, workType) {
    this.currentWorkId = workId;
    this.currentWorkType = workType;
    this.loadComments();
    this.renderCommentSection();
  }

  // 加载评论数据
  loadComments() {
    const commentsKey = `comments_${this.currentWorkType}_${this.currentWorkId}`;
    const savedComments = localStorage.getItem(commentsKey);
    
    if (savedComments) {
      this.comments = JSON.parse(savedComments);
    } else {
      this.comments = {};
    }
  }

  // 保存评论数据
  saveComments() {
    const commentsKey = `comments_${this.currentWorkType}_${this.currentWorkId}`;
    localStorage.setItem(commentsKey, JSON.stringify(this.comments));
  }

  // 渲染评论区
  renderCommentSection() {
    // 检查是否已存在评论区
    let commentSection = document.getElementById('commentSection');
    if (!commentSection) {
      // 创建评论区
      commentSection = document.createElement('div');
      commentSection.id = 'commentSection';
      commentSection.className = 'comment-section';
      
      // 找到合适的位置插入评论区（在主内容之后，页脚之前）
      const main = document.querySelector('main') || document.querySelector('.main-content');
      const footer = document.querySelector('footer');
      
      if (main && footer) {
        main.parentNode.insertBefore(commentSection, footer);
      } else {
        document.body.appendChild(commentSection);
      }
    }

    commentSection.innerHTML = this.getCommentSectionHTML();
    this.bindCommentEvents();
  }

  // 获取评论区HTML
  getCommentSectionHTML() {
    const commentsArray = Object.values(this.comments).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    return `
      <div class="comment-container">
        <h3 class="comment-title">💬 评论区 (${commentsArray.length})</h3>
        
        ${this.getCommentFormHTML()}
        
        <div class="comments-list">
          ${commentsArray.length > 0 ? 
            commentsArray.map(comment => this.getCommentHTML(comment)).join('') :
            '<div class="no-comments">暂无评论，快来发表第一条评论吧！</div>'
          }
        </div>
      </div>
    `;
  }

  // 获取评论表单HTML
  getCommentFormHTML() {
    if (!auth.currentUser) {
      return `
        <div class="comment-form-placeholder">
          <p>请先登录后再发表评论</p>
          <a href="index.html" class="login-link">前往登录</a>
        </div>
      `;
    }

    if (!auth.canComment()) {
      return `
        <div class="comment-form-placeholder">
          <p>您当前的权限不允许发表评论</p>
          <p>只有访客、好友和管理员可以发表评论</p>
        </div>
      `;
    }

    return `
      <div class="comment-form">
        <div class="comment-form-header">
          <span class="comment-author">${auth.currentUser.username}</span>
          <span class="comment-role ${auth.currentUser.role}-role">${this.getRoleDisplayName(auth.currentUser.role)}</span>
        </div>
        <textarea 
          id="commentInput" 
          class="comment-input" 
          placeholder="写下您的评论..."
          maxlength="500"
        ></textarea>
        <div class="comment-form-actions">
          <span class="char-count">0/500</span>
          <button class="comment-submit-btn" onclick="commentSystem.submitComment()">发表评论</button>
        </div>
      </div>
    `;
  }

  // 获取单个评论HTML
  getCommentHTML(comment) {
    const canEdit = auth.canEditComment(comment.author);
    const canDelete = auth.canDeleteComment(comment.author);
    const isEditing = comment.isEditing;

    return `
      <div class="comment-item" data-comment-id="${comment.id}">
        <div class="comment-header">
          <div class="comment-author-info">
            <span class="comment-author">${comment.author}</span>
            <span class="comment-role ${comment.authorRole}-role">${this.getRoleDisplayName(comment.authorRole)}</span>
            <span class="comment-time">${this.formatTime(comment.createdAt)}</span>
            ${comment.editedAt ? `<span class="comment-edited">已编辑</span>` : ''}
          </div>
          <div class="comment-actions">
            ${canEdit ? `<button class="comment-action-btn edit-btn" onclick="commentSystem.editComment('${comment.id}')">${isEditing ? '取消' : '编辑'}</button>` : ''}
            ${canDelete ? `<button class="comment-action-btn delete-btn" onclick="commentSystem.deleteComment('${comment.id}')">删除</button>` : ''}
          </div>
        </div>
        <div class="comment-content">
          ${isEditing ? 
            `<textarea class="comment-edit-input" id="editInput_${comment.id}">${comment.content}</textarea>
             <div class="comment-edit-actions">
               <button class="comment-save-btn" onclick="commentSystem.saveEditComment('${comment.id}')">保存</button>
               <button class="comment-cancel-btn" onclick="commentSystem.cancelEditComment('${comment.id}')">取消</button>
             </div>` :
            `<p class="comment-text">${this.escapeHtml(comment.content)}</p>`
          }
        </div>
      </div>
    `;
  }

  // 绑定评论事件
  bindCommentEvents() {
    const commentInput = document.getElementById('commentInput');
    if (commentInput) {
      commentInput.addEventListener('input', (e) => {
        const charCount = document.querySelector('.char-count');
        if (charCount) {
          charCount.textContent = `${e.target.value.length}/500`;
        }
      });

      commentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          this.submitComment();
        }
      });
    }
  }

  // 提交评论
  submitComment() {
    const commentInput = document.getElementById('commentInput');
    if (!commentInput) return;

    const content = commentInput.value.trim();
    if (!content) {
      alert('请输入评论内容');
      return;
    }

    if (!auth.currentUser || !auth.canComment()) {
      alert('您没有权限发表评论');
      return;
    }

    const comment = {
      id: this.generateCommentId(),
      content: content,
      author: auth.currentUser.username,
      authorRole: auth.currentUser.role,
      createdAt: new Date().toISOString(),
      editedAt: null
    };

    this.comments[comment.id] = comment;
    this.saveComments();

    // 记录操作日志
    if (typeof adminLogger !== 'undefined') {
      adminLogger.logAdminOperation('comment_create', {
        workId: this.currentWorkId,
        workType: this.currentWorkType,
        commentId: comment.id,
        content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
      });
    }

    commentInput.value = '';
    this.renderCommentSection();
  }

  // 编辑评论
  editComment(commentId) {
    const comment = this.comments[commentId];
    if (!comment || !auth.canEditComment(comment.author)) {
      alert('您没有权限编辑此评论');
      return;
    }

    // 切换编辑状态
    comment.isEditing = !comment.isEditing;
    this.renderCommentSection();
  }

  // 保存编辑的评论
  saveEditComment(commentId) {
    const comment = this.comments[commentId];
    if (!comment || !auth.canEditComment(comment.author)) {
      alert('您没有权限编辑此评论');
      return;
    }

    const editInput = document.getElementById(`editInput_${commentId}`);
    if (!editInput) return;

    const newContent = editInput.value.trim();
    if (!newContent) {
      alert('评论内容不能为空');
      return;
    }

    comment.content = newContent;
    comment.editedAt = new Date().toISOString();
    comment.isEditing = false;

    this.saveComments();

    // 记录操作日志
    if (typeof adminLogger !== 'undefined') {
      adminLogger.logAdminOperation('comment_edit', {
        workId: this.currentWorkId,
        workType: this.currentWorkType,
        commentId: commentId,
        newContent: newContent.substring(0, 50) + (newContent.length > 50 ? '...' : '')
      });
    }

    this.renderCommentSection();
  }

  // 取消编辑评论
  cancelEditComment(commentId) {
    const comment = this.comments[commentId];
    if (comment) {
      comment.isEditing = false;
      this.renderCommentSection();
    }
  }

  // 删除评论
  deleteComment(commentId) {
    const comment = this.comments[commentId];
    if (!comment || !auth.canDeleteComment(comment.author)) {
      alert('您没有权限删除此评论');
      return;
    }

    if (confirm('确定要删除这条评论吗？')) {
      // 记录操作日志
      if (typeof adminLogger !== 'undefined') {
        adminLogger.logAdminOperation('comment_delete', {
          workId: this.currentWorkId,
          workType: this.currentWorkType,
          commentId: commentId,
          content: comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : ''),
          author: comment.author
        });
      }

      delete this.comments[commentId];
      this.saveComments();
      this.renderCommentSection();
    }
  }

  // 工具方法
  generateCommentId() {
    return 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) { // 1小时内
      return Math.floor(diff / 60000) + '分钟前';
    } else if (diff < 86400000) { // 1天内
      return Math.floor(diff / 3600000) + '小时前';
    } else if (diff < 2592000000) { // 30天内
      return Math.floor(diff / 86400000) + '天前';
    } else {
      return date.toLocaleDateString();
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getRoleDisplayName(role) {
    const roleNames = {
      'admin': '管理员',
      'friend': '好友',
      'visitor': '访客'
    };
    return roleNames[role] || role;
  }
}

// 添加评论系统样式
function addCommentStyles() {
  if (document.getElementById('commentStyles')) return;

  const style = document.createElement('style');
  style.id = 'commentStyles';
  style.textContent = `
    .comment-section {
      max-width: 800px;
      margin: 3rem auto;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .comment-title {
      font-size: 1.5rem;
      color: #333;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e9ecef;
    }

    .comment-form {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .comment-form-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .comment-form-placeholder {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      margin-bottom: 2rem;
      color: #6c757d;
    }

    .login-link {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      transition: background-color 0.3s ease;
    }

    .login-link:hover {
      background: #0056b3;
      text-decoration: none;
      color: white;
    }

    .comment-input {
      width: 100%;
      min-height: 100px;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.9rem;
      font-family: inherit;
      resize: vertical;
      transition: border-color 0.3s ease;
    }

    .comment-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .comment-form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
    }

    .char-count {
      font-size: 0.8rem;
      color: #6c757d;
    }

    .comment-submit-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.5rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.3s ease;
    }

    .comment-submit-btn:hover {
      background: #0056b3;
    }

    .comments-list {
      space-y: 1rem;
    }

    .comment-item {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      border-left: 4px solid #007bff;
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .comment-author-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .comment-author {
      font-weight: 600;
      color: #333;
    }

    .comment-role {
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .admin-role {
      background: #dc3545;
      color: white;
    }

    .friend-role {
      background: #28a745;
      color: white;
    }

    .visitor-role {
      background: #6c757d;
      color: white;
    }

    .comment-time {
      font-size: 0.8rem;
      color: #6c757d;
    }

    .comment-edited {
      font-size: 0.7rem;
      color: #ffc107;
      font-style: italic;
    }

    .comment-actions {
      display: flex;
      gap: 0.5rem;
    }

    .comment-action-btn {
      background: none;
      border: 1px solid #ddd;
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.3s ease;
    }

    .edit-btn {
      color: #007bff;
      border-color: #007bff;
    }

    .edit-btn:hover {
      background: #007bff;
      color: white;
    }

    .delete-btn {
      color: #dc3545;
      border-color: #dc3545;
    }

    .delete-btn:hover {
      background: #dc3545;
      color: white;
    }

    .comment-text {
      margin: 0;
      line-height: 1.6;
      color: #333;
      white-space: pre-wrap;
    }

    .comment-edit-input {
      width: 100%;
      min-height: 80px;
      padding: 0.8rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.9rem;
      font-family: inherit;
      resize: vertical;
    }

    .comment-edit-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .comment-save-btn {
      background: #28a745;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
    }

    .comment-cancel-btn {
      background: #6c757d;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
    }

    .no-comments {
      text-align: center;
      color: #6c757d;
      font-style: italic;
      padding: 2rem;
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
      .comment-section {
        margin: 2rem 1rem;
        padding: 1rem;
      }

      .comment-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .comment-author-info {
        flex-wrap: wrap;
      }

      .comment-form-actions {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .comment-submit-btn {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(style);
}

// 页面加载时添加样式
document.addEventListener('DOMContentLoaded', addCommentStyles);

// 创建全局实例
const commentSystem = new CommentSystem();
