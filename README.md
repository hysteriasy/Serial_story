# 桑梓 - 个人分享平台

一个功能完整的个人文学创作作品展示和分享网站，支持随笔、诗歌、小说连载等多种文学形式的发布和管理，具备完善的用户权限管理和文件权限控制系统。

## 🌟 功能特色

### 📝 内容管理系统
- **多样化内容支持**：生活随笔、诗歌创作、小说连载、绘画作品、音乐创作、视频作品
- **智能分类管理**：自动分类和标签系统，支持内容检索和筛选
- **版本控制**：支持内容修改历史记录和版本回滚
- **批量操作**：支持批量上传、编辑、删除和权限设置

### 🔐 权限管理系统
- **三级用户权限**：访客、好友、管理员，精细化权限控制
- **文件权限管理**：支持单文件和批量权限设置，白名单/黑名单机制
- **权限继承**：支持文件夹级别的权限继承和覆盖
- **权限历史**：完整的权限变更历史记录和审计功能

### 👥 用户管理功能
- **用户注册登录**：完整的用户认证系统，支持密码加密存储
- **登录记录追踪**：详细的用户登录历史，包括时间、IP、设备信息
- **用户状态管理**：在线状态显示，最后活跃时间记录
- **批量用户操作**：支持批量创建、编辑、删除用户

### 📊 数据统计分析
- **实时统计面板**：用户数量、作品统计、活跃度分析
- **存储使用监控**：本地存储使用情况，大文件识别和管理
- **访问统计**：页面访问量、用户活跃度、内容热度分析
- **数据导出**：支持统计数据和用户记录的CSV导出

### 🎨 界面设计优化
- **现代化UI**：简约淡雅的设计语言，统一的视觉风格
- **响应式布局**：完美适配桌面端、平板和移动端设备
- **交互动效**：流畅的页面过渡和操作反馈
- **主题定制**：支持界面主题和布局的个性化设置

## 🚀 技术栈

- **前端框架**：原生HTML5, CSS3, JavaScript (ES6+)
- **数据存储**：LocalStorage + Firebase Realtime Database (可选)
- **文件管理**：基于浏览器的文件系统API
- **权限控制**：基于角色的访问控制 (RBAC)
- **部署平台**：GitHub Pages + GitHub Actions自动部署
- **开发工具**：现代化的模块化JavaScript架构

## 📦 快速开始

### 🌐 在线访问

**生产环境**：[https://hysteriasy.github.io/Serial_story/](https://hysteriasy.github.io/Serial_story/)

### 💻 本地部署

#### 方法一：直接克隆运行
```bash
# 1. 克隆仓库
git clone https://github.com/hysteriasy/Serial_story.git
cd Serial_story

# 2. 启动本地服务器
# 使用Python 3
python -m http.server 8080

# 或使用Python 2
python -m SimpleHTTPServer 8080

# 或使用Node.js
npx http-server -p 8080 -c-1

# 或使用PHP
php -S localhost:8080
```

#### 方法二：使用开发环境
```bash
# 1. 安装依赖（可选，用于Firebase功能）
npm install

# 2. 启动开发服务器
npm start

# 3. 访问应用
# 浏览器打开：http://localhost:8080
```

### 🔧 GitHub Pages部署

项目已配置自动部署，推送到main分支后会自动部署到GitHub Pages：

1. **Fork本仓库**到你的GitHub账户
2. **启用GitHub Pages**：
   - 进入仓库设置 → Pages
   - Source选择"GitHub Actions"
   - 等待自动部署完成
3. **访问你的网站**：`https://你的用户名.github.io/Serial_story/`

## 📖 详细使用指南

### 🔑 管理员登录

**默认管理员账户**：
- 用户名：`hysteria`
- 密码：`hysteria7816`
- 权限：完整的系统管理权限

**首次登录建议**：
1. 使用默认账户登录
2. 进入用户管理页面修改密码
3. 创建其他管理员账户
4. 根据需要禁用默认账户

### 👤 用户权限说明

#### 访客权限 (Visitor)
- ✅ 浏览公开内容
- ✅ 查看作品列表和详情
- ❌ 发布或编辑内容
- ❌ 访问受限内容

#### 好友权限 (Friend)  
- ✅ 访客的所有权限
- ✅ 浏览好友专属内容
- ✅ 发布和编辑自己的作品
- ✅ 评论和互动功能
- ❌ 管理其他用户内容

#### 管理员权限 (Admin)
- ✅ 好友的所有权限
- ✅ 用户管理：创建、编辑、删除用户
- ✅ 内容管理：管理所有用户的内容
- ✅ 权限管理：设置文件和用户权限
- ✅ 系统管理：查看统计、导出数据、系统配置

### 📁 文件权限管理

#### 权限设置方式
1. **单文件权限**：
   - 进入"上传作品"页面
   - 选择"文件权限"标签
   - 选择要设置权限的文件
   - 配置访问权限和用户列表

2. **批量权限设置**：
   - 使用批量权限管理器
   - 选择多个文件或文件夹
   - 统一设置权限规则
   - 支持权限继承和覆盖

#### 权限类型说明
- **公开访问**：所有用户都可以访问
- **好友可见**：仅好友及以上权限用户可访问
- **管理员专用**：仅管理员可以访问
- **自定义权限**：指定特定用户或用户组
- **白名单模式**：只有列表中的用户可以访问
- **黑名单模式**：列表中的用户无法访问

### 📊 系统统计功能

#### 管理员统计面板
1. **访问方式**：
   - 管理员登录后，首页会显示统计概览
   - 点击"系统统计"查看详细数据

2. **统计内容**：
   - **用户统计**：总用户数、各权限级别用户数、活跃用户
   - **内容统计**：总作品数、各分类作品数、今日上传量
   - **存储统计**：存储使用情况、大文件分析
   - **活跃度统计**：登录频率、在线用户、访问热度

#### 登录记录查看
1. **访问方式**：
   - 进入"上传作品"页面
   - 切换到"用户管理"标签
   - 点击"📋 登录记录"按钮

2. **功能特性**：
   - **实时搜索**：按用户名快速筛选
   - **时间筛选**：按日期范围查看记录
   - **状态筛选**：查看成功/失败的登录尝试
   - **详细信息**：IP地址、设备信息、浏览器信息
   - **数据导出**：支持CSV格式导出
   - **分页显示**：大量数据的分页浏览

### 🎨 界面个性化

#### 主题设置
- **色彩方案**：支持多种预设主题色彩
- **布局模式**：紧凑/宽松布局切换
- **字体设置**：字体大小和字体族选择

#### 响应式适配
- **桌面端**：完整功能，最佳体验
- **平板端**：优化的触控界面
- **移动端**：简化操作，核心功能保留

## 🏗️ 项目架构

### 📂 目录结构
```
Serial_story/
├── 📄 index.html                    # 首页 - 作品展示和用户登录
├── 📄 essays.html                   # 生活随笔页面
├── 📄 poetry.html                   # 诗歌创作页面  
├── 📄 novels.html                   # 小说连载页面
├── 📄 artworks.html                 # 绘画作品页面
├── 📄 music.html                    # 音乐作品页面
├── 📄 videos.html                   # 视频作品页面
├── 📄 upload.html                   # 作品上传和管理中心
├── 📁 css/
│   └── 🎨 style.css                 # 主样式文件
├── 📁 js/
│   ├── 🔧 script.js                 # 主脚本和工具函数
│   ├── 🔐 auth.js                   # 用户认证和权限管理
│   ├── 📤 upload.js                 # 文件上传和内容管理
│   ├── 👥 user-status.js            # 用户状态管理
│   ├── 📊 system-stats.js           # 系统统计数据管理
│   ├── 📋 login-records-manager.js  # 登录记录管理
│   ├── 🗂️ file-permissions-system.js # 文件权限核心系统
│   ├── 🎛️ file-permissions-ui.js     # 权限管理界面
│   ├── 📦 batch-permissions-manager.js # 批量权限管理
│   ├── 📄 file-details-viewer.js    # 文件详情查看器
│   ├── 🌐 homepage-integration.js   # 首页功能集成
│   └── 🎨 unified-button-styles.js  # 统一按钮样式系统
├── 📁 images/                       # 图片资源和背景图
├── 📁 essays/                       # 随笔数据存储目录
├── 📁 users/                        # 用户数据存储目录
├── 📁 .github/
│   └── 📁 workflows/
│       └── ⚙️ deploy.yml            # GitHub Actions自动部署配置
├── 📄 package.json                  # 项目依赖配置
└── 📄 README.md                     # 项目说明文档
```

### 🔧 核心模块说明

#### 认证系统 (auth.js)
- **用户注册登录**：密码加密、会话管理
- **权限验证**：基于角色的访问控制
- **会话管理**：自动登录、登录状态保持

#### 文件权限系统 (file-permissions-system.js)
- **权限核心引擎**：权限计算、继承、覆盖逻辑
- **访问控制**：文件访问权限验证
- **权限缓存**：性能优化的权限缓存机制

#### 用户管理系统 (upload.js + user-status.js)
- **用户CRUD操作**：创建、读取、更新、删除用户
- **状态管理**：在线状态、最后活跃时间
- **批量操作**：批量用户管理功能

#### 统计分析系统 (system-stats.js)
- **数据收集**：用户行为、系统使用情况
- **实时统计**：动态数据更新和展示
- **数据导出**：统计报告生成和导出

## 🛠️ 开发指南

### 🔨 开发环境设置

#### 必需工具
- **现代浏览器**：Chrome 90+, Firefox 88+, Safari 14+
- **代码编辑器**：VS Code, WebStorm, Sublime Text
- **本地服务器**：Python, Node.js, PHP 任选其一
- **Git**：版本控制和代码管理

#### 可选工具
- **Node.js**：用于Firebase功能和包管理
- **Firebase CLI**：用于Firebase项目管理
- **GitHub CLI**：用于GitHub操作自动化

### 📝 添加新功能

#### 1. 创建新页面
```bash
# 1. 创建HTML文件
touch new-feature.html

# 2. 创建对应的JavaScript模块
touch js/new-feature.js

# 3. 添加样式定义
# 在css/style.css中添加相关样式
```

#### 2. 集成权限系统
```javascript
// 在新功能中集成权限验证
if (!auth.hasPermission('feature_name')) {
    showErrorMessage('权限不足');
    return;
}
```

#### 3. 添加导航链接
```html
<!-- 在相关页面添加导航链接 -->
<a href="new-feature.html" class="nav-link">新功能</a>
```

### 🗄️ 数据存储说明

#### LocalStorage结构
```javascript
// 用户数据
localStorage.setItem('user_username', JSON.stringify({
    username: 'username',
    password: 'encrypted_password',
    role: 'friend',
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-01-01T00:00:00Z'
}));

// 作品数据
localStorage.setItem('work_id', JSON.stringify({
    id: 'unique_id',
    title: '作品标题',
    content: '作品内容',
    category: 'literature',
    subcategory: 'essay',
    author: 'username',
    created_at: '2024-01-01T00:00:00Z',
    permissions: {
        access_level: 'public',
        allowed_users: [],
        denied_users: []
    }
}));

// 权限数据
localStorage.setItem('file_permissions', JSON.stringify({
    'file_id': {
        access_level: 'friends',
        allowed_users: ['user1', 'user2'],
        denied_users: ['user3'],
        inherit_parent: true,
        created_by: 'admin',
        created_at: '2024-01-01T00:00:00Z'
    }
}));
```

#### Firebase集成（可选）
```javascript
// Firebase配置
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project.firebaseio.com",
    projectId: "your-project-id"
};

// 数据同步
firebase.database().ref('users').on('value', (snapshot) => {
    // 处理用户数据同步
});
```

### 🔐 权限系统开发

#### 添加新权限级别
```javascript
// 在auth.js中添加新权限
const PERMISSION_LEVELS = {
    visitor: 0,
    friend: 1,
    moderator: 2,  // 新增版主权限
    admin: 3
};
```

#### 创建权限检查函数
```javascript
// 检查特定功能权限
function checkFeaturePermission(featureName, username) {
    const user = auth.getUser(username);
    const requiredLevel = FEATURE_PERMISSIONS[featureName];
    return auth.getPermissionLevel(user.role) >= requiredLevel;
}
```

## 🚨 故障排除

### 常见问题解答

#### Q1: 无法登录管理员账户
**解决方案**：
1. 确认用户名和密码正确：`hysteria` / `hysteria7816`
2. 清除浏览器缓存和LocalStorage
3. 检查浏览器控制台是否有JavaScript错误
4. 尝试使用隐私模式/无痕模式

#### Q2: 文件权限设置不生效
**解决方案**：
1. 确认当前用户有权限管理权限
2. 检查权限设置是否正确保存
3. 刷新页面重新加载权限数据
4. 查看浏览器控制台的权限验证日志

#### Q3: 统计数据显示异常
**解决方案**：
1. 检查LocalStorage中的数据完整性
2. 清除统计缓存：`systemStatsManager.clearCache()`
3. 重新加载统计数据
4. 检查数据格式是否符合预期

#### Q4: 页面样式显示异常
**解决方案**：
1. 检查CSS文件是否正确加载
2. 清除浏览器缓存
3. 检查是否有CSS冲突
4. 验证响应式断点设置

#### Q5: GitHub Pages部署失败
**解决方案**：
1. 检查GitHub Actions工作流状态
2. 确认仓库设置中Pages配置正确
3. 检查文件路径大小写敏感问题
4. 验证所有文件都已正确提交

### 🔍 调试技巧

#### 开启调试模式
```javascript
// 在浏览器控制台中开启详细日志
localStorage.setItem('debug_mode', 'true');
location.reload();
```

#### 查看权限状态
```javascript
// 检查当前用户权限
console.log('当前用户:', auth.currentUser);
console.log('权限级别:', auth.getPermissionLevel());

// 检查文件权限
console.log('文件权限:', filePermissionsSystem.getFilePermissions('file_id'));
```

#### 重置系统数据
```javascript
// ⚠️ 警告：这将清除所有数据
localStorage.clear();
location.reload();
```

## 🤝 贡献指南

### 贡献流程

1. **Fork仓库**：点击GitHub页面右上角的Fork按钮
2. **克隆到本地**：
   ```bash
   git clone https://github.com/你的用户名/Serial_story.git
   cd Serial_story
   ```
3. **创建功能分支**：
   ```bash
   git checkout -b feature/新功能名称
   ```
4. **开发和测试**：
   - 编写代码
   - 添加测试
   - 确保所有功能正常工作
5. **提交更改**：
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   ```
6. **推送分支**：
   ```bash
   git push origin feature/新功能名称
   ```
7. **创建Pull Request**：
   - 在GitHub上创建PR
   - 详细描述更改内容
   - 等待代码审查

### 代码规范

#### JavaScript规范
- 使用ES6+语法
- 函数和变量使用驼峰命名
- 添加详细的注释
- 保持代码简洁和可读性

#### CSS规范
- 使用BEM命名规范
- 保持样式模块化
- 添加浏览器兼容性前缀
- 使用相对单位确保响应式

#### HTML规范
- 使用语义化标签
- 保持良好的缩进
- 添加必要的accessibility属性
- 确保HTML验证通过

### 提交信息规范

使用约定式提交格式：
```
<类型>(<范围>): <描述>

[可选的正文]

[可选的脚注]
```

**类型说明**：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例**：
```
feat(auth): 添加双因素认证功能

- 实现TOTP验证
- 添加备用恢复码
- 更新用户设置界面

Closes #123
```

## 📄 许可证

本项目采用 **MIT 许可证** - 查看 [LICENSE](LICENSE) 文件了解详情

### 许可证要点
- ✅ 商业使用
- ✅ 修改
- ✅ 分发
- ✅ 私人使用
- ❗ 责任限制
- ❗ 无担保

## 📞 联系方式

### 项目维护者
- **GitHub**: [@hysteriasy](https://github.com/hysteriasy)
- **项目地址**: [https://github.com/hysteriasy/Serial_story](https://github.com/hysteriasy/Serial_story)
- **在线演示**: [https://hysteriasy.github.io/Serial_story/](https://hysteriasy.github.io/Serial_story/)

### 获取帮助
- **Issues**: [提交问题或建议](https://github.com/hysteriasy/Serial_story/issues)
- **Discussions**: [参与讨论](https://github.com/hysteriasy/Serial_story/discussions)
- **Wiki**: [查看详细文档](https://github.com/hysteriasy/Serial_story/wiki)

### 社区
- **Star** ⭐ 本项目以表示支持
- **Watch** 👀 获取项目更新通知
- **Fork** 🍴 创建你自己的版本

---

<div align="center">

**感谢使用桑梓个人分享平台！**

如果这个项目对你有帮助，请考虑给它一个 ⭐

[🏠 首页](https://hysteriasy.github.io/Serial_story/) | [📚 文档](https://github.com/hysteriasy/Serial_story/wiki) | [🐛 报告问题](https://github.com/hysteriasy/Serial_story/issues) | [💡 功能建议](https://github.com/hysteriasy/Serial_story/discussions)

</div>
