# 我的网页项目 - GitHub Pages 部署

这是一个使用 GitHub Pages 部署的现代化静态网站项目，展示了如何创建响应式网页并实现自动化部署。

## 🌟 项目特性

- **响应式设计**: 适配桌面端、平板和移动设备
- **现代化UI**: 使用CSS3和JavaScript实现美观的用户界面
- **平滑动画**: 包含滚动动画、悬停效果和页面转场
- **交互功能**: 联系表单、移动端菜单、平滑滚动等
- **自动部署**: 使用GitHub Actions实现代码推送后自动部署
- **SEO优化**: 包含meta标签、robots.txt等SEO基础配置

## 📁 项目结构

```
Serial_story/
├── index.html          # 主页面
├── 404.html           # 404错误页面
├── robots.txt          # 搜索引擎爬虫配置
├── css/
│   └── style.css       # 主样式文件
├── js/
│   └── script.js       # JavaScript功能文件
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Actions部署配置
└── README.md           # 项目说明文档
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/Serial_story.git
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
   - 部署完成后，访问：`https://yourusername.github.io/Serial_story/`

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
- **CSS3**: Flexbox、Grid布局，CSS动画
- **JavaScript**: ES6+语法，DOM操作，事件处理
- **GitHub Actions**: 自动化部署流程

### 主要功能

1. **响应式导航栏**
   - 桌面端水平菜单
   - 移动端汉堡菜单
   - 滚动时背景透明效果

2. **英雄区域**
   - 渐变背景
   - 动画文字效果
   - 行动按钮

3. **内容区域**
   - 关于我们
   - 项目展示
   - 联系表单

4. **交互功能**
   - 平滑滚动
   - 表单验证
   - 通知系统
   - 返回顶部按钮

### 自定义配置

#### 修改网站信息

编辑 `index.html` 文件中的以下内容：

```html
<title>你的网站标题</title>
<meta name="description" content="你的网站描述">
```

#### 修改样式

编辑 `css/style.css` 文件：

```css
:root {
  --primary-color: #007bff;  /* 主色调 */
  --secondary-color: #6c757d; /* 辅助色 */
}
```

#### 添加新功能

在 `js/script.js` 中添加新的JavaScript功能。

## 🔧 故障排除

### 常见问题

1. **GitHub Pages没有更新**
   - 检查Actions是否成功运行
   - 确认分支名称是否正确
   - 清除浏览器缓存

2. **样式或脚本不加载**
   - 检查文件路径是否正确
   - 确认文件名大小写匹配

3. **移动端显示异常**
   - 检查viewport meta标签
   - 测试CSS媒体查询

### 调试技巧

1. **使用浏览器开发者工具**
   - F12打开开发者工具
   - 检查Console错误信息
   - 使用Network面板检查资源加载

2. **本地测试**
   - 在本地服务器上测试
   - 使用不同设备和浏览器测试

## 📝 更新日志

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

- 项目链接: [https://github.com/yourusername/Serial_story](https://github.com/yourusername/Serial_story)
- 网站地址: [https://yourusername.github.io/Serial_story/](https://yourusername.github.io/Serial_story/)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和设计师。
