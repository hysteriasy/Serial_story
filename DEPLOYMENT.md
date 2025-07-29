# GitHub Pages 部署完整指南

本文档提供了将项目部署到 GitHub Pages 的详细步骤说明。

## 📋 部署前准备

### 1. 确保项目结构正确

```
Serial_story/
├── index.html          # 必需：GitHub Pages的入口文件
├── 404.html           # 可选：自定义404页面
├── robots.txt          # 可选：SEO配置
├── css/
├── js/
└── .github/workflows/  # 可选：自动部署配置
```

### 2. 检查文件内容

- 确保 `index.html` 存在且内容完整
- 检查所有链接和资源路径是否正确
- 验证CSS和JavaScript文件路径

## 🚀 部署步骤

### 方法一：GitHub Actions 自动部署（推荐）

#### 步骤1：创建GitHub仓库

1. 登录 [GitHub](https://github.com)
2. 点击右上角的 "+" 按钮，选择 "New repository"
3. 填写仓库信息：
   - Repository name: `Serial_story`（或你喜欢的名称）
   - Description: 项目描述
   - 选择 "Public"（GitHub Pages免费版需要公开仓库）
   - 不要勾选 "Add a README file"（我们已经有了）

#### 步骤2：推送代码到GitHub

```bash
# 初始化Git仓库（如果还没有）
git init

# 添加远程仓库
git remote add origin https://github.com/yourusername/Serial_story.git

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: Add website files"

# 推送到GitHub
git push -u origin main
```

#### 步骤3：配置GitHub Pages

1. 进入你的GitHub仓库页面
2. 点击 "Settings" 选项卡
3. 在左侧菜单中找到 "Pages"
4. 在 "Source" 部分选择 "GitHub Actions"
5. 保存设置

#### 步骤4：等待部署完成

1. 推送代码后，GitHub Actions会自动开始部署
2. 在仓库的 "Actions" 选项卡中可以查看部署进度
3. 部署成功后，你的网站将在以下地址可用：
   ```
   https://yourusername.github.io/Serial_story/
   ```

### 方法二：传统分支部署

#### 步骤1-2：同上（创建仓库并推送代码）

#### 步骤3：配置GitHub Pages

1. 进入GitHub仓库设置页面
2. 找到 "Pages" 选项
3. 在 "Source" 中选择 "Deploy from a branch"
4. 选择 "main" 分支
5. 选择 "/ (root)" 文件夹
6. 点击 "Save"

#### 步骤4：等待部署

- GitHub会自动部署你的网站
- 通常需要几分钟时间
- 部署完成后访问：`https://yourusername.github.io/Serial_story/`

## 🔧 高级配置

### 自定义域名

如果你有自己的域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 在文件中写入你的域名：
   ```
   www.yourdomain.com
   ```
3. 在域名提供商处配置DNS记录：
   ```
   CNAME www yourusername.github.io
   ```

### 强制HTTPS

1. 在GitHub Pages设置中
2. 勾选 "Enforce HTTPS" 选项

### 环境变量配置

如果需要在GitHub Actions中使用环境变量：

1. 进入仓库设置
2. 选择 "Secrets and variables" > "Actions"
3. 添加需要的环境变量

## 📊 监控和维护

### 查看部署状态

1. **Actions页面**：查看自动部署的执行情况
2. **Environments页面**：查看部署历史和状态
3. **Settings > Pages**：查看当前配置和网站地址

### 常用Git命令

```bash
# 查看状态
git status

# 添加文件
git add .

# 提交更改
git commit -m "Update website content"

# 推送到GitHub
git push origin main

# 查看提交历史
git log --oneline

# 创建新分支
git checkout -b feature/new-feature

# 合并分支
git checkout main
git merge feature/new-feature
```

## 🐛 故障排除

### 常见问题及解决方案

#### 1. 网站显示404错误

**可能原因：**
- `index.html` 文件不存在或位置错误
- 仓库是私有的（免费版GitHub Pages需要公开仓库）

**解决方案：**
- 确保根目录有 `index.html` 文件
- 将仓库设置为公开

#### 2. CSS/JS文件不加载

**可能原因：**
- 文件路径错误
- 文件名大小写不匹配

**解决方案：**
- 检查HTML中的文件路径
- 确保文件名大小写完全匹配

#### 3. GitHub Actions部署失败

**可能原因：**
- 工作流配置错误
- 权限设置问题

**解决方案：**
- 检查 `.github/workflows/deploy.yml` 文件
- 确保仓库有正确的权限设置

#### 4. 网站更新不及时

**可能原因：**
- 浏览器缓存
- GitHub Pages缓存

**解决方案：**
- 清除浏览器缓存（Ctrl+F5）
- 等待几分钟让GitHub Pages更新

### 调试技巧

1. **使用浏览器开发者工具**
   ```
   F12 → Console → 查看错误信息
   F12 → Network → 检查资源加载
   ```

2. **检查GitHub Actions日志**
   - 进入仓库的Actions页面
   - 点击失败的工作流
   - 查看详细错误信息

3. **本地测试**
   ```bash
   # 启动本地服务器
   python -m http.server 8000
   # 或
   npx http-server
   ```

## 📈 性能优化

### 图片优化

1. 压缩图片文件大小
2. 使用适当的图片格式（WebP、AVIF）
3. 实现懒加载

### 代码优化

1. 压缩CSS和JavaScript文件
2. 移除未使用的代码
3. 使用CDN加载第三方库

### 缓存策略

1. 设置适当的缓存头
2. 使用版本号管理静态资源
3. 实现Service Worker缓存

## 📞 获取帮助

如果遇到问题，可以：

1. 查看 [GitHub Pages文档](https://docs.github.com/en/pages)
2. 查看 [GitHub Actions文档](https://docs.github.com/en/actions)
3. 在项目Issues中提问
4. 联系项目维护者

---

**注意：** 请将文档中的 `yourusername` 替换为你的实际GitHub用户名。
