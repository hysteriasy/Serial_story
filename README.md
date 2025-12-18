# 桑梓 - 个人分享平台

一个功能完整的个人文学创作作品展示和分享网站，支持随笔、诗歌、小说连载等多种文学形式的发布和管理，具备完善的用户权限管理和文件权限控制系统。

## 🌟 功能特色

### 📝 内容管理系统
- **多样化内容支持**：生活随笔、诗歌创作、小说连载、绘画作品、音乐创作、视频作品
- **智能分类管理**：自动分类和标签系统，支持内容检索和筛选
- **版本控制**：支持内容修改历史记录和版本回滚
- **批量操作**：支持批量上传、编辑、删除和权限设置

### 🔐 权限管理系统
- **多级权限控制**：公开、仅好友、访客级别、自定义、私有五种权限级别
- **白名单/黑名单**：精确控制特定用户的访问权限，支持用户列表管理
- **权限预览功能**：实时显示权限设置效果，避免配置错误
- **权限继承机制**：支持批量权限管理和权限继承
- **权限历史记录**：完整的权限变更历史记录和审计功能

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

### 🌍 环境优化与兼容性
- **智能环境适配**：自动检测运行环境并优化配置
- **跟踪保护兼容**：完美处理浏览器跟踪保护限制
- **iOS Safari优化**：专门针对iOS设备的兼容性修复
- **移动端优化**：触摸交互、视口适配、性能优化
- **离线支持**：支持离线访问和本地数据缓存

## 🚀 技术栈

### 核心技术
- **前端框架**：原生HTML5, CSS3, JavaScript (ES6+)
- **模块化架构**：ES6 Class模块化设计，组件化开发
- **部署平台**：GitHub Pages + GitHub Actions自动部署

### 数据存储策略
- **智能存储适配**：根据运行环境自动选择最优存储策略
  - **GitHub Pages环境**：优先使用GitHub API存储，LocalStorage作为缓存
  - **本地开发环境**：优先使用LocalStorage，支持离线开发
  - **跟踪保护环境**：自动降级到内存存储，确保功能可用
- **多层存储系统**：
  - GitHub仓库存储（主要存储，支持版本控制）
  - LocalStorage（缓存和备用存储）
  - Firebase Realtime Database（可选，用于实时同步）
  - 内存存储（跟踪保护环境下的降级方案）

### 环境适配与优化
- **环境检测系统**：自动识别GitHub Pages、本地服务器、本地文件等环境
- **跟踪保护处理**：智能处理浏览器跟踪保护限制，静默模式减少控制台噪音
- **iOS兼容性**：专门优化iOS Safari浏览器兼容性
- **存储优化器**：缓存机制、批量操作、节流控制，提升性能

### 权限与安全
- **权限控制**：基于角色的访问控制 (RBAC)
- **多级权限系统**：公开、好友、访客、自定义、私有五级权限
- **安全管理**：密码加密存储、会话管理、权限审计

### 文件管理
- **GitHub API集成**：完整的文件上传、下载、删除功能
- **智能文件加载**：按需加载、懒加载、预加载优化
- **批量操作**：支持批量上传、权限设置、文件管理

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

### 📤 安全推送流程

项目配置了完善的Git推送规则和自动化脚本，确保代码安全推送：

#### 使用自动化脚本（推荐）
```bash
# 1. 初始化项目（首次使用）
bash .augment/rules/setup-project.sh

# 2. 日常快速部署
./quick-deploy.sh "提交消息"

# 3. 检查项目状态
./check-status.sh

# 4. 紧急情况快速推送
bash scripts/emergency-push.sh "紧急修复"
```

#### 手动推送流程
```bash
# 1. 推送前检查
git status
bash scripts/pre-push-check.sh

# 2. 拉取最新更改（重要！）
git fetch origin main
git pull origin main --no-edit

# 3. 添加和提交更改
git add .
git commit -m "feat: 描述你的更改"

# 4. 推送到远程
git push origin main

# 5. 验证部署
# 等待GitHub Actions完成部署
# 访问网站验证功能正常
```

#### 推送前检查清单
- [ ] 所有JavaScript文件无语法错误
- [ ] 没有硬编码的API密钥或敏感信息
- [ ] 单个文件不超过100MB
- [ ] 本地测试所有核心功能正常
- [ ] 提交消息清晰描述更改内容

详细的推送规则和工作流程请参考：
- `.augment/rules/git-push-rules.md` - Git推送规则
- `.augment/rules/PUSH_WORKFLOW.md` - 推送工作流程说明

## 📖 详细使用指南

### 🔑 管理员登录

**默认管理员账户**：
- 用户名：`hysteria`
- 密码：`hysteria7816`
- 权限：完整的系统管理权限

**首次登录建议**：
1. 使用默认账户登录
2. 进入用户管理页面修改密码
3. 配置GitHub存储（可选）
4. 创建其他管理员账户
5. 根据需要禁用默认账户

### ☁️ GitHub存储配置

#### 配置步骤
1. **创建GitHub Personal Access Token**：
   - 访问 [GitHub Settings > Tokens](https://github.com/settings/tokens)
   - 创建新Token，选择`repo`权限
   - 复制并保存Token

2. **在平台中配置**：
   - 以管理员身份登录
   - 进入"作品上传"页面
   - 在"GitHub存储配置"区域输入Token
   - 点击"测试连接"验证配置

3. **智能存储策略**：
   - **GitHub Pages环境**：
     - 优先使用GitHub API存储
     - LocalStorage作为缓存
     - 支持版本控制和永久保存
   - **本地开发环境**：
     - 优先使用LocalStorage
     - 支持离线开发和测试
     - 可选配置GitHub同步
   - **跟踪保护环境**：
     - 自动检测存储限制
     - 降级到内存存储
     - 静默处理错误，不影响用户体验

#### 环境自动适配
系统会自动检测运行环境并选择最优存储策略：
- **环境检测**：自动识别GitHub Pages、本地服务器、本地文件等环境
- **能力检测**：检测localStorage、sessionStorage等存储能力
- **智能降级**：存储不可用时自动切换到备用方案
- **性能优化**：缓存机制、批量操作、节流控制

#### 文件存储结构
```
Serial_story/
├── user-uploads/
│   ├── literature/     # 文学作品
│   ├── artworks/       # 绘画作品
│   ├── music/          # 音乐作品
│   └── videos/         # 视频作品
└── user-data/
    ├── permissions/    # 权限设置
    └── metadata/       # 元数据
```

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

#### 权限级别说明
1. **🌍 公开**：所有访问者都可以查看
2. **👥 仅好友可见**：只有好友级别及以上用户可以查看
3. **👤 访客及以上可见**：访客、好友、管理员都可以查看
4. **⚙️ 自定义权限**：可以设置白名单或黑名单
5. **🔒 私有**：只有作者自己可以查看

#### 自定义权限设置
- **白名单模式**：只有指定的用户可以查看作品
- **黑名单模式**：除了指定用户外，所有好友级别用户都可以查看
- **用户列表**：支持多个用户名，用逗号分隔
- **权限预览**：实时显示权限设置效果

#### 权限设置方式
1. **上传时设置**：
   - 在上传作品时选择访问权限
   - 如选择自定义权限，配置白名单/黑名单
   - 查看权限预览确认设置

2. **批量权限管理**：
   - 使用批量权限管理器
   - 选择多个文件统一设置
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
   - 点击"登录记录"按钮

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

## 💡 技术亮点

### 🌟 智能环境适配系统
本项目的核心特色之一是完善的环境适配系统，能够自动识别运行环境并优化配置：

**环境自动检测**
- 精确识别GitHub Pages、本地服务器、本地文件等环境
- 检测浏览器能力（localStorage、sessionStorage、IndexedDB、fetch等）
- 识别跟踪保护限制和隐私模式

**智能存储策略**
- **GitHub Pages环境**：优先GitHub API存储，LocalStorage缓存
- **本地开发环境**：优先LocalStorage，支持离线开发
- **跟踪保护环境**：自动降级到内存存储，静默处理错误

**性能优化**
- 缓存机制减少重复访问
- 批量操作提升效率
- 节流控制防止频繁访问
- 智能预加载和懒加载

### 🛡️ 跟踪保护兼容性
完美处理现代浏览器的跟踪保护限制：

**静默错误处理**
- 生产环境完全静默，不影响用户体验
- 智能识别跟踪保护相关错误
- 消息去重，10分钟内重复消息不再输出

**自动降级方案**
- 存储不可用时自动切换到内存存储
- 功能完整性不受影响
- 用户无感知的平滑降级

### 📱 移动端优化
专门针对移动设备和iOS Safari的优化：

**iOS Safari兼容性**
- 修复100vh视口问题
- 消除300ms点击延迟
- 优化触摸滚动性能
- 修复输入框缩放和聚焦问题
- 改善字体渲染

**移动端交互优化**
- 触摸友好的界面设计
- 响应式布局适配各种屏幕
- 优化的移动端菜单
- 手势支持和触摸反馈

### 🔐 完善的权限系统
多层次、细粒度的权限控制：

**五级权限控制**
- 公开、好友、访客、自定义、私有
- 白名单/黑名单精确控制
- 权限继承和覆盖机制

**权限管理功能**
- 批量权限设置
- 权限模板快速应用
- 完整的权限变更历史
- 权限预览和验证

### 🚀 模块化架构
清晰的模块化设计，易于维护和扩展：

**功能模块分类**
- 核心功能模块（认证、上传、状态管理）
- 环境适配模块（环境检测、跟踪保护、iOS兼容）
- 数据存储模块（数据管理、GitHub存储、存储优化）
- 权限管理模块（权限系统、批量管理、安全管理）
- 统计日志模块（系统统计、登录记录、日志管理）
- 文件管理模块（文件加载、层级管理、详情查看）
- 界面组件模块（页眉页脚、按钮样式、欢迎界面）
- 内容管理模块（各类作品管理、评论系统）

**组件独立性**
- 每个模块职责单一
- 组件间低耦合
- 易于测试和维护
- 支持按需加载

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
│   ├── 🎨 style.css                 # 主样式文件
│   └── 📱 ios-compatibility.css     # iOS兼容性样式
├── 📁 js/
│   ├── 🔧 核心功能模块
│   │   ├── script.js                # 主脚本和工具函数
│   │   ├── auth.js                  # 用户认证和权限管理
│   │   ├── upload.js                # 文件上传和内容管理
│   │   └── user-status.js           # 用户状态管理
│   ├── 🌍 环境适配模块
│   │   ├── environment-adapter.js   # 环境适配器（环境检测、存储策略）
│   │   ├── environment-config.js    # 环境配置管理
│   │   ├── tracking-protection-handler.js # 跟踪保护处理器
│   │   └── ios-compatibility.js     # iOS Safari兼容性修复
│   ├── 💾 数据存储模块
│   │   ├── data-manager.js          # 统一数据管理器
│   │   ├── github-storage.js        # GitHub存储和环境管理
│   │   ├── storage-optimizer.js     # 存储优化器
│   │   └── data-sync-manager.js     # 数据同步管理器
│   ├── � 权限管理模块
│   │   ├── file-permissions-system.js # 文件权限核心系统
│   │   ├── file-permissions-ui.js   # 权限管理界面
│   │   ├── batch-permissions-manager.js # 批量权限管理
│   │   ├── enhanced-permissions-manager.js # 增强权限管理器
│   │   ├── permission-security-manager.js # 权限安全管理
│   │   ├── permissions-import-export.js # 权限导入导出
│   │   └── whitelist-blacklist-manager.js # 白名单黑名单管理
│   ├── � 统计与日志模块
│   │   ├── system-stats.js          # 系统统计数据管理
│   │   ├── login-records-manager.js # 登录记录管理
│   │   ├── log-manager.js           # 日志管理器
│   │   ├── admin-logger.js          # 管理员日志
│   │   ├── essays-logger.js         # 随笔日志
│   │   ├── poetry-logger.js         # 诗歌日志
│   │   └── production-logger.js     # 生产环境日志
│   ├── 📁 文件管理模块
│   │   ├── file-details-viewer.js   # 文件详情查看器
│   │   ├── file-hierarchy-manager.js # 文件层级管理
│   │   ├── admin-file-manager.js    # 管理员文件管理
│   │   ├── smart-file-loader.js     # 智能文件加载器
│   │   └── directory-checker.js     # 目录检查器
│   ├── 🎨 界面组件模块
│   │   ├── header.js                # 页眉组件
│   │   ├── footer.js                # 页脚组件
│   │   ├── header-footer.js         # 页眉页脚集成
│   │   ├── unified-button-styles.js # 统一按钮样式系统
│   │   └── warm-welcome.js          # 欢迎界面
│   ├── 📝 内容管理模块
│   │   ├── essays.js                # 随笔管理
│   │   ├── poetry.js                # 诗歌管理
│   │   ├── novels.js                # 小说管理
│   │   ├── artworks.js              # 绘画管理
│   │   ├── music.js                 # 音乐管理
│   │   ├── videos.js                # 视频管理
│   │   ├── essays-data-manager.js   # 随笔数据管理器
│   │   └── comments.js              # 评论系统
│   ├── 🔧 工具与辅助模块
│   │   ├── homepage-integration.js  # 首页功能集成
│   │   ├── content-access-control.js # 内容访问控制
│   │   ├── github-token-manager.js  # GitHub Token管理
│   │   ├── legacy-data-migrator.js  # 旧数据迁移工具
│   │   ├── permissions-manager.js   # 权限管理器
│   │   └── script-loader-manager.js # 脚本加载管理器
├── 📁 images/                       # 图片资源和背景图
├── 📁 essays/                       # 随笔数据存储目录
├── 📁 users/                        # 用户数据存储目录
├── 📁 .github/
│   └── 📁 workflows/
│       └── ⚙️ deploy.yml            # GitHub Actions自动部署配置
├── 📁 .augment/
│   └── 📁 rules/                    # 开发规则和工作流程文档
│       ├── git-push-rules.md        # Git推送规则
│       ├── PUSH_WORKFLOW.md         # 推送工作流程
│       └── header-footer-integration-rules.md # 组件集成规则
├── 📄 package.json                  # 项目依赖配置
└── 📄 README.md                     # 项目说明文档
```

### 🔧 核心模块说明

#### 🔐 认证与权限系统
**auth.js - 用户认证核心**
- **用户注册登录**：密码加密存储、会话管理、自动登录
- **权限验证**：基于角色的访问控制（RBAC）
- **会话管理**：登录状态保持、超时处理、安全退出

**file-permissions-system.js - 文件权限核心引擎**
- **权限计算引擎**：多级权限计算、继承、覆盖逻辑
- **访问控制**：文件访问权限验证、白名单/黑名单管理
- **权限缓存**：性能优化的权限缓存机制

**enhanced-permissions-manager.js - 增强权限管理**
- **批量权限设置**：支持批量文件权限管理
- **权限模板**：预设权限模板，快速应用
- **权限审计**：完整的权限变更历史记录

#### 🌍 环境适配系统
**environment-adapter.js - 智能环境适配器**
- **环境检测**：自动识别GitHub Pages、本地服务器、本地文件等环境
- **能力检测**：检测localStorage、sessionStorage、IndexedDB、fetch等能力
- **存储策略**：根据环境自动选择最优存储策略
- **网络适配**：智能处理网络请求和API调用
- **错误处理**：静默处理跟踪保护相关错误

**tracking-protection-handler.js - 跟踪保护处理器**
- **静默模式**：在生产环境下完全静默，减少控制台噪音
- **消息去重**：10分钟内重复消息不再输出
- **错误抑制**：智能识别并抑制跟踪保护错误
- **降级方案**：存储不可用时自动切换到内存存储

**ios-compatibility.js - iOS兼容性修复**
- **视口修复**：修复iOS Safari的100vh问题
- **触摸优化**：消除点击延迟，优化触摸反馈
- **滚动优化**：改善滚动性能和体验
- **输入修复**：修复iOS输入框缩放和聚焦问题

#### 💾 数据存储系统
**data-manager.js - 统一数据管理器**
- **智能存储选择**：根据环境自动选择GitHub存储或本地存储
- **数据同步**：支持GitHub和本地存储的双向同步
- **降级处理**：GitHub存储失败时自动降级到本地存储
- **UTF-8编码**：正确处理中文等多语言内容

**github-storage.js - GitHub存储管理**
- **环境管理**：检测运行环境，确定存储策略
- **GitHub API集成**：完整的文件上传、下载、删除功能
- **Token管理**：安全的GitHub Token存储和验证
- **版本控制**：利用GitHub的版本控制功能

**storage-optimizer.js - 存储优化器**
- **缓存机制**：减少重复的存储访问
- **批量操作**：支持批量读写操作
- **节流控制**：防止频繁访问存储
- **跟踪保护集成**：与跟踪保护处理器协同工作

#### 📊 统计与日志系统
**system-stats.js - 系统统计管理**
- **实时统计**：用户数量、作品统计、活跃度分析
- **存储监控**：本地存储使用情况、大文件识别
- **数据导出**：支持CSV格式导出统计数据

**login-records-manager.js - 登录记录管理**
- **登录追踪**：详细的登录历史记录
- **设备信息**：记录IP、设备、浏览器信息
- **搜索过滤**：支持按用户名、时间、状态筛选
- **数据导出**：导出登录记录为CSV文件

**log-manager.js - 日志管理系统**
- **分级日志**：支持debug、info、warn、error等级别
- **环境感知**：生产环境自动减少日志输出
- **日志持久化**：重要日志保存到存储
- **性能监控**：记录关键操作的性能数据

#### 📁 文件管理系统
**smart-file-loader.js - 智能文件加载器**
- **按需加载**：根据需要动态加载文件
- **懒加载**：延迟加载非关键资源
- **预加载**：预先加载可能需要的资源
- **缓存管理**：智能的文件缓存策略

**file-hierarchy-manager.js - 文件层级管理**
- **目录结构**：管理文件的层级关系
- **路径解析**：智能的路径解析和规范化
- **权限继承**：支持目录级别的权限继承

#### 🎨 界面组件系统
**header.js - 页眉组件**
- **独立组件**：完整的HTML、CSS、JavaScript封装
- **状态同步**：自动同步用户登录状态
- **响应式设计**：适配桌面和移动端
- **防重复机制**：避免组件重复初始化

**footer.js - 页脚组件**
- **统一页脚**：全站统一的页脚样式和内容
- **动态内容**：支持动态更新页脚信息
- **版权信息**：自动更新年份等信息

**unified-button-styles.js - 统一按钮样式**
- **样式统一**：全站按钮样式一致性
- **交互反馈**：统一的悬停、点击效果
- **主题支持**：支持多种按钮主题

## 🛠️ 开发指南

### 🔨 开发环境设置

#### 必需工具
- **现代浏览器**：Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **代码编辑器**：VS Code（推荐）, WebStorm, Sublime Text
- **本地服务器**：Python, Node.js, PHP 任选其一
- **Git**：版本控制和代码管理

#### 可选工具
- **Node.js**：用于Firebase功能和包管理
- **Firebase CLI**：用于Firebase项目管理
- **GitHub CLI**：用于GitHub操作自动化

#### 开发环境配置
```bash
# 1. 克隆仓库
git clone https://github.com/hysteriasy/Serial_story.git
cd Serial_story

# 2. 初始化Git推送规则（推荐）
bash .augment/rules/setup-project.sh

# 3. 配置Git用户信息
git config user.name "your-name"
git config user.email "your-email@example.com"

# 4. 启动本地服务器
python -m http.server 8080
# 或
npx http-server -p 8080 -c-1

# 5. 访问本地网站
# 浏览器打开：http://localhost:8080
```

#### 环境检测
系统会自动检测运行环境：
- **本地文件**（file://）：使用本地存储，部分功能受限
- **本地服务器**（localhost）：完整功能，优先本地存储
- **GitHub Pages**：完整功能，优先GitHub存储

### 📝 添加新功能

#### 1. 创建新页面
```bash
# 1. 创建HTML文件
touch new-feature.html

# 2. 创建对应的JavaScript模块
touch js/new-feature.js

# 3. 添加样式定义（如需要）
# 在css/style.css中添加相关样式
```

#### 2. 集成核心系统

**集成页眉页脚组件**
```html
<!-- 在HTML文件中引入组件 -->
<script src="js/header.js"></script>
<script src="js/footer.js"></script>

<script>
// 初始化页眉页脚
document.addEventListener('DOMContentLoaded', () => {
    const header = new HeaderComponent();
    header.init();

    const footer = new FooterComponent();
    footer.init();
});
</script>
```

**集成认证系统**
```javascript
// 引入认证模块
<script src="js/auth.js"></script>

// 在功能中集成权限验证
if (!auth.hasPermission('feature_name')) {
    showErrorMessage('权限不足');
    return;
}

// 检查用户角色
if (auth.currentUser?.role !== 'admin') {
    // 限制管理员功能
}
```

**集成数据管理**
```javascript
// 引入数据管理器
<script src="js/environment-adapter.js"></script>
<script src="js/data-manager.js"></script>

// 保存数据
async function saveFeatureData(data) {
    await window.dataManager.saveData('feature_key', data, {
        category: 'feature',
        commitMessage: '保存功能数据'
    });
}

// 读取数据
async function loadFeatureData() {
    return await window.dataManager.loadData('feature_key', {
        category: 'feature'
    });
}
```

**集成权限系统**
```javascript
// 引入权限系统
<script src="js/file-permissions-system.js"></script>

// 检查文件访问权限
const hasAccess = filePermissionsSystem.checkAccess(
    fileId,
    auth.currentUser?.username
);

if (!hasAccess) {
    showErrorMessage('您没有权限访问此内容');
    return;
}
```

#### 3. 添加导航链接
```html
<!-- 在header.js的generateHeader方法中添加 -->
<li class="nav-item">
    <a href="new-feature.html" class="nav-link ${this.currentPage === 'new-feature' ? 'active' : ''}">
        新功能
    </a>
</li>
```

#### 4. 环境适配
```javascript
// 确保功能在不同环境下正常工作
document.addEventListener('DOMContentLoaded', async () => {
    // 等待环境适配器初始化
    while (!window.environmentAdapter) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 根据环境调整功能
    const env = window.environmentAdapter.environment;
    if (env.type === 'github_pages') {
        // GitHub Pages特定逻辑
    } else if (env.type === 'local_server') {
        // 本地开发特定逻辑
    }

    // 初始化功能
    initFeature();
});
```

#### 5. 测试和调试
```javascript
// 添加调试日志
if (window.location.search.includes('debug=true')) {
    console.log('新功能初始化');
    console.log('环境:', window.environmentAdapter?.environment);
    console.log('当前用户:', auth.currentUser);
}

// 测试数据保存和读取
async function testFeature() {
    const testData = { test: 'data' };
    await saveFeatureData(testData);
    const loaded = await loadFeatureData();
    console.log('测试结果:', loaded);
}
```

#### 6. 推送到GitHub
```bash
# 使用安全推送脚本
./quick-deploy.sh "feat: 添加新功能 - 功能描述"

# 或手动推送
git add .
git commit -m "feat: 添加新功能 - 功能描述"
git pull origin main --no-edit
git push origin main
```

### 🗄️ 数据存储说明

#### 智能存储系统
系统采用多层存储策略，根据环境自动选择最优方案：

**存储层次**
1. **GitHub API存储**（主要存储，GitHub Pages环境）
   - 永久保存，支持版本控制
   - 适合生产环境和重要数据
   - 需要配置GitHub Token

2. **LocalStorage**（缓存和备用存储）
   - 快速访问，离线可用
   - 适合本地开发和缓存
   - 受浏览器存储限制

3. **内存存储**（降级方案）
   - 跟踪保护环境下使用
   - 会话期间有效
   - 刷新页面后丢失

#### 数据结构示例

**用户数据**
```javascript
// 存储键：user_username
{
    username: 'username',
    password: 'encrypted_password',  // SHA-256加密
    role: 'friend',                  // visitor/friend/admin
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-01-01T00:00:00Z',
    login_count: 10,
    last_ip: '192.168.1.1'
}
```

**作品数据**
```javascript
// 存储键：work_id 或 essay_id/poetry_id等
{
    id: 'unique_id',
    title: '作品标题',
    content: '作品内容',
    category: 'literature',          // literature/artwork/music/video
    subcategory: 'essay',            // essay/poetry/novel等
    author: 'username',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    permissions: {
        access_level: 'public',      // public/friends/visitor/custom/private
        allowed_users: [],           // 白名单
        denied_users: []             // 黑名单
    },
    tags: ['标签1', '标签2'],
    views: 100,
    likes: 10
}
```

**权限数据**
```javascript
// 存储键：file_permissions
{
    'file_id': {
        access_level: 'friends',     // 权限级别
        allowed_users: ['user1', 'user2'],  // 白名单
        denied_users: ['user3'],     // 黑名单
        inherit_parent: true,        // 是否继承父级权限
        created_by: 'admin',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        history: [                   // 权限变更历史
            {
                action: 'update',
                old_level: 'public',
                new_level: 'friends',
                timestamp: '2024-01-01T00:00:00Z',
                operator: 'admin'
            }
        ]
    }
}
```

**环境配置数据**
```javascript
// 存储键：github_token
'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

// 存储键：environment_config
{
    environment: 'github_pages',     // github_pages/local_server/local_file
    storage_strategy: 'github_primary_local_cache',
    tracking_protection: false,
    last_check: '2024-01-01T00:00:00Z'
}
```

#### 数据管理API

**保存数据**
```javascript
// 使用统一数据管理器
await window.dataManager.saveData('key', data, {
    category: 'literature',          // 数据分类
    isPublic: false,                 // 是否公开
    commitMessage: '保存作品'        // GitHub提交消息
});
```

**读取数据**
```javascript
// 自动选择最优存储源
const data = await window.dataManager.loadData('key', {
    category: 'literature',
    fallbackToLocal: true            // GitHub失败时回退到本地
});
```

**删除数据**
```javascript
await window.dataManager.deleteData('key', {
    category: 'literature',
    deleteFromGitHub: true           // 同时从GitHub删除
});
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

#### 存储优化建议
1. **定期清理**：删除过期的缓存数据
2. **压缩数据**：大文件使用压缩存储
3. **批量操作**：合并多个小操作为批量操作
4. **监控配额**：定期检查存储使用情况

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

#### Q6: 浏览器控制台出现跟踪保护警告
**问题描述**：浏览器控制台显示"tracking prevention"或"blocked access to storage"等警告

**解决方案**：
1. **这是正常现象**：系统已自动处理跟踪保护限制
2. **不影响功能**：系统会自动降级到内存存储
3. **减少警告**：系统在生产环境下会自动启用静默模式
4. **开发调试**：如需查看详细日志，在URL添加`?debug=true`参数

#### Q7: iOS Safari浏览器显示异常
**问题描述**：在iPhone或iPad上访问网站时出现样式或功能问题

**解决方案**：
1. **已自动修复**：系统已集成iOS兼容性修复
2. **清除缓存**：在Safari设置中清除网站数据
3. **更新系统**：确保iOS系统版本为14+
4. **检查兼容性**：查看`iOS-COMPATIBILITY-GUIDE.md`了解详情

#### Q8: 数据保存失败或丢失
**问题描述**：保存的数据无法读取或丢失

**解决方案**：
1. **检查存储策略**：
   ```javascript
   // 在控制台查看当前存储策略
   console.log(window.environmentAdapter?.storageStrategy);
   ```
2. **GitHub存储配置**：确认GitHub Token配置正确
3. **本地存储限制**：检查浏览器存储配额是否已满
4. **跟踪保护**：检查是否被跟踪保护限制，系统会自动处理

#### Q9: 推送到GitHub时出现冲突
**问题描述**：执行`git push`时提示冲突或被拒绝

**解决方案**：
1. **先拉取更改**：
   ```bash
   git fetch origin main
   git pull origin main --no-edit
   ```
2. **使用安全推送脚本**：
   ```bash
   ./quick-deploy.sh "你的提交消息"
   ```
3. **解决冲突**：如有冲突，手动解决后再推送
4. **查看推送规则**：参考`.augment/rules/git-push-rules.md`

#### Q10: 移动端触摸交互不流畅
**问题描述**：在移动设备上点击或滑动响应慢

**解决方案**：
1. **已优化**：系统已集成移动端优化
2. **清除缓存**：清除浏览器缓存后重新访问
3. **检查网络**：确保网络连接稳定
4. **更新浏览器**：使用最新版本的移动浏览器

### 🔍 调试技巧

#### 开启调试模式
```javascript
// 在浏览器控制台中开启详细日志
localStorage.setItem('debug_mode', 'true');
location.reload();

// 或在URL中添加调试参数
// https://your-site.com/?debug=true
```

#### 查看环境和存储状态
```javascript
// 检查当前环境
console.log('环境信息:', window.environmentAdapter?.environment);
console.log('存储策略:', window.environmentAdapter?.storageStrategy);
console.log('能力检测:', window.environmentAdapter?.capabilities);

// 检查存储可用性
console.log('存储可用:', window.adaptiveStorage?.isAvailable());
console.log('存储状态:', window.adaptiveStorage?.getStatus());

// 检查跟踪保护状态
if (window.trackingProtectionHandler) {
  console.log('跟踪保护状态:',
    window.trackingProtectionHandler.getStorageStatusReport());
}
```

#### 查看权限状态
```javascript
// 检查当前用户权限
console.log('当前用户:', auth.currentUser);
console.log('权限级别:', auth.getPermissionLevel());

// 检查文件权限
console.log('文件权限:', filePermissionsSystem.getFilePermissions('file_id'));
```

#### 测试存储功能
```javascript
// 测试数据保存和读取
async function testStorage() {
  const testData = { test: '测试数据', time: new Date().toISOString() };

  // 保存数据
  await window.dataManager.saveData('test_key', testData);

  // 读取数据
  const loaded = await window.dataManager.loadData('test_key');
  console.log('读取的数据:', loaded);
}

testStorage();
```

#### 查看性能指标
```javascript
// 查看存储访问统计
if (window.storageOptimizer) {
  console.log('缓存命中率:', window.storageOptimizer.getCacheHitRate());
  console.log('访问统计:', window.storageOptimizer.getAccessStats());
}

// 查看日志统计
if (window.logManager) {
  console.log('日志统计:', window.logManager.getStats());
}
```

#### 重置系统数据
```javascript
// ⚠️ 警告：这将清除所有数据
localStorage.clear();
sessionStorage.clear();
location.reload();

// 或只清除特定数据
localStorage.removeItem('specific_key');
```

#### 导出诊断信息
```javascript
// 导出完整的系统诊断信息
function exportDiagnostics() {
  const diagnostics = {
    environment: window.environmentAdapter?.environment,
    storageStrategy: window.environmentAdapter?.storageStrategy,
    capabilities: window.environmentAdapter?.capabilities,
    trackingProtection: window.trackingProtectionHandler?.getStorageStatusReport(),
    currentUser: auth?.currentUser,
    timestamp: new Date().toISOString()
  };

  console.log('系统诊断信息:', JSON.stringify(diagnostics, null, 2));
  return diagnostics;
}

exportDiagnostics();
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

## 📝 更新日志

### 最新版本特性

#### 🌍 环境优化系统 (2024-12)
- ✅ 新增智能环境适配器，自动检测运行环境
- ✅ 实现跟踪保护兼容处理，静默模式减少控制台噪音
- ✅ 优化存储策略，根据环境自动选择最优方案
- ✅ 添加存储优化器，提升性能和稳定性

#### 📱 移动端优化 (2024-12)
- ✅ iOS Safari专项兼容性修复
- ✅ 修复100vh视口问题
- ✅ 消除300ms点击延迟
- ✅ 优化触摸滚动性能
- ✅ 改善移动端交互体验

#### 💾 数据存储增强 (2024-12)
- ✅ 统一数据管理器，智能选择存储策略
- ✅ GitHub存储和本地存储双向同步
- ✅ 自动降级机制，确保功能可用性
- ✅ UTF-8编码支持，完美处理中文内容

#### 🔐 权限系统完善 (2024-11)
- ✅ 五级权限控制系统
- ✅ 白名单/黑名单精确管理
- ✅ 批量权限设置功能
- ✅ 权限变更历史记录

#### 🎨 界面组件化 (2024-11)
- ✅ 独立的页眉页脚组件
- ✅ 统一的按钮样式系统
- ✅ 响应式布局优化
- ✅ 防重复初始化机制

#### 📊 统计与日志 (2024-10)
- ✅ 系统统计面板
- ✅ 登录记录管理
- ✅ 分级日志系统
- ✅ 数据导出功能

### 计划中的功能

#### 🔮 即将推出
- [ ] 评论系统增强
- [ ] 实时协作编辑
- [ ] 更多主题选项
- [ ] PWA支持（离线访问）
- [ ] 多语言支持

#### 💭 考虑中
- [ ] WebSocket实时通信
- [ ] 图片压缩和优化
- [ ] 视频流媒体支持
- [ ] AI辅助写作
- [ ] 社交分享功能

### 已知问题

- 部分旧版浏览器可能不支持某些ES6+特性
- 大文件上传可能受GitHub API限制
- 跟踪保护严格的浏览器可能影响部分功能

详细的更新历史请查看 [GitHub Releases](https://github.com/hysteriasy/Serial_story/releases)

---

<div align="center">

**感谢使用桑梓个人分享平台！**

如果这个项目对你有帮助，请考虑给它一个 ⭐

[🏠 首页](https://hysteriasy.github.io/Serial_story/) | [📚 文档](https://github.com/hysteriasy/Serial_story/wiki) | [🐛 报告问题](https://github.com/hysteriasy/Serial_story/issues) | [💡 功能建议](https://github.com/hysteriasy/Serial_story/discussions)

</div>
