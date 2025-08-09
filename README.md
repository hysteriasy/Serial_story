# 桑梓 - 个人创作分享平台

这是一个基于GitHub Pages的个人创作分享平台，支持文学作品、绘画、音乐、视频等多种类型作品的上传、管理和展示。

## 🌟 项目特性

- **多类型作品支持**: 文学作品（随笔、诗歌、小说）、绘画作品、音乐作品、视频作品
- **表单化上传**: 文学作品支持表单输入，媒体作品支持文件上传
- **响应式设计**: 适配桌面端、平板和移动设备
- **用户权限管理**: 支持用户注册、登录、权限控制
- **作品权限控制**: 支持公开/私有作品设置
- **本地存储**: 支持离线模式，数据存储在浏览器本地
- **Firebase集成**: 可选的云端存储支持
- **SEO优化**: 包含meta标签、robots.txt等SEO基础配置

## 📁 项目结构

```
Serial_story/
├── index.html                    # 主页面
├── upload.html                   # 作品上传页面
├── essays.html                   # 生活随笔页面
├── 404.html                     # 404错误页面
├── robots.txt                    # 搜索引擎爬虫配置
├── css/
│   └── style.css                 # 主样式文件
├── js/
│   ├── script.js                 # 核心功能脚本
│   ├── auth.js                   # 用户认证模块
│   ├── upload.js                 # 作品上传模块
│   ├── essays.js                 # 随笔展示模块
│   └── homepage-integration.js   # 首页集成模块
├── essays/
│   └── _list.json               # 随笔列表数据
├── images/                       # 图片资源目录
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions部署配置
├── test_upload.html             # 上传功能测试页面
├── test_complete_flow.html      # 完整流程测试页面
└── README.md                    # 项目说明文档
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/hysteriasy/Serial_story.git
cd Serial_story
```

### 2. 本地预览

直接在浏览器中打开 `index.html` 文件，或使用本地服务器：

```bash
# 使用Python启动本地服务器
python -m http.server 8000

# 或使用Node.js的http-server
npx http-server
```

然后在浏览器中访问 `http://localhost:8000`

## 📦 GitHub Pages 部署指南

### 方法一：自动部署（推荐）

1. **创建GitHub仓库**
   - 在GitHub上创建新仓库
   - 将代码推送到仓库

2. **启用GitHub Pages**
   - 进入仓库设置页面
   - 找到"Pages"选项
   - 在"Source"中选择"GitHub Actions"

3. **推送代码触发部署**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

4. **访问网站**
   - 部署完成后，访问：`https://hysteriasy.github.io/Serial_story/`

### 方法二：手动部署

1. **启用GitHub Pages**
   - 进入仓库设置页面
   - 找到"Pages"选项
   - 在"Source"中选择"Deploy from a branch"
   - 选择"main"分支和"/ (root)"文件夹

2. **推送代码**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

## 🛠️ 开发指南

### 技术栈

- **HTML5**: 语义化标签，SEO友好
- **CSS3**: Flexbox、Grid布局，CSS动画，响应式设计
- **JavaScript**: ES6+语法，模块化开发，本地存储
- **Firebase**: 可选的云端存储和用户认证
- **GitHub Actions**: 自动化部署流程

### 主要功能

1. **作品上传系统**
   - 文学作品表单输入（随笔、诗歌、小说）
   - 媒体作品文件上传（绘画、音乐、视频）
   - 作品分类管理
   - 权限控制（公开/私有）

2. **用户认证系统**
   - 用户注册和登录
   - 角色权限管理
   - 会话状态管理

3. **作品展示系统**
   - 分类展示作品
   - 作品详情查看
   - 响应式布局
   - 搜索和筛选

4. **数据存储系统**
   - 本地存储支持
   - Firebase云端存储
   - 数据同步和备份

5. **响应式界面**
   - 移动端适配
   - 现代化UI设计
   - 平滑动画效果
   - 用户友好的交互

## 🎨 功能详解

### 作品上传功能

#### 文学作品上传
- **生活随笔**: 提供题目和内容输入框，支持Markdown格式
- **诗歌创作**: 提供题目、内容输入框和诗歌类型选择（现代诗/古体诗词）
- **小说连载**: 提供题目、章节号、节标题和内容输入框

#### 媒体作品上传
- **绘画作品**: 题目输入 + 图片文件上传 + 作品简介
- **音乐作品**: 题目输入 + 音频文件上传 + 作品简介
- **视频作品**: 题目输入 + 视频文件上传 + 作品简介

### 数据存储方式

#### 本地存储模式
- 使用浏览器localStorage存储作品数据
- 支持离线使用
- 数据格式化存储，便于检索和展示

#### Firebase云端模式（可选）
- 支持多设备同步
- 云端备份保障数据安全
- 实时数据更新

### 权限管理

#### 用户角色
- **游客**: 只能查看公开作品
- **注册用户**: 可以上传和管理自己的作品
- **管理员**: 可以管理所有用户和作品

#### 作品权限
- **公开**: 所有人可见，在首页展示
- **私有**: 仅作者可见

### 自定义配置

#### 修改网站信息

编辑 `index.html` 文件中的以下内容：

```html
<title>桑梓 - 个人创作分享平台</title>
<meta name="description" content="个人创作作品分享平台">
```

#### 修改样式主题

编辑 `css/style.css` 文件：

```css
:root {
  --primary-color: #007bff;     /* 主色调 */
  --secondary-color: #6c757d;   /* 辅助色 */
  --success-color: #28a745;     /* 成功色 */
  --danger-color: #dc3545;      /* 危险色 */
}
```

#### Firebase配置

如需启用Firebase功能，在 `js/script.js` 中配置：

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "your-database-url",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 🧪 测试功能

项目包含完整的测试页面，帮助验证功能是否正常：

### 测试页面
- `test_upload.html`: 上传功能单元测试
- `test_complete_flow.html`: 完整流程集成测试

### 运行测试
```bash
# 启动本地服务器
python -m http.server 8080

# 访问测试页面
http://localhost:8080/test_complete_flow.html
```

## 🔧 故障排除

### 常见问题

1. **作品上传失败**
   - 检查用户是否已登录
   - 确认文件大小不超过10MB
   - 检查文件格式是否支持

2. **作品不显示在首页**
   - 确认作品权限设置为"公开"
   - 检查本地存储是否有数据
   - 刷新页面重新加载

3. **Firebase连接失败**
   - 检查Firebase配置是否正确
   - 确认网络连接正常
   - 系统会自动回退到本地存储模式

4. **移动端显示异常**
   - 检查viewport meta标签
   - 测试CSS媒体查询
   - 清除浏览器缓存

### 调试技巧

1. **使用浏览器开发者工具**
   - F12打开开发者工具
   - 检查Console错误信息
   - 使用Application面板检查本地存储

2. **本地测试**
   - 使用本地服务器测试
   - 运行测试页面验证功能
   - 使用不同设备和浏览器测试

## 📝 更新日志

### v2.0.0 (2025-08-08)
- 🎉 重大更新：作品上传系统重构
- ✨ 新增表单化文学作品上传（随笔、诗歌、小说）
- ✨ 新增媒体作品上传支持（绘画、音乐、视频）
- ✨ 新增用户权限管理系统
- ✨ 新增作品权限控制（公开/私有）
- ✨ 新增本地存储支持，可离线使用
- ✨ 新增Firebase云端存储集成
- ✨ 新增完整的测试页面
- 🔧 优化响应式设计和用户体验
- 🔧 重构代码架构，提高可维护性

### v1.0.0 (2024-01-01)
- 初始版本发布
- 基本网页结构和样式
- GitHub Pages部署配置
- 响应式设计实现

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目链接: [https://github.com/hysteriasy/Serial_story](https://github.com/hysteriasy/Serial_story)
- 网站地址: [https://hysteriasy.github.io/Serial_story/](https://hysteriasy.github.io/Serial_story/)
- 作者: hysteriasy

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和设计师。
