# 桑梓平台 - 部署和使用指南

## 🚀 快速部署

### GitHub Pages 自动部署（推荐）

1. **Fork 本仓库**
   - 访问：https://github.com/hysteriasy/Serial_story
   - 点击右上角 "Fork" 按钮

2. **启用 GitHub Pages**
   - 进入你的仓库设置页面
   - 找到 "Pages" 选项
   - Source 选择 "GitHub Actions"
   - 等待自动部署完成

3. **访问你的网站**
   - 地址：`https://你的用户名.github.io/Serial_story/`

### 本地部署

```bash
# 克隆仓库
git clone https://github.com/hysteriasy/Serial_story.git
cd Serial_story

# 启动本地服务器（任选一种）
python -m http.server 8080        # Python 3
python -m SimpleHTTPServer 8080   # Python 2
npx http-server -p 8080           # Node.js
php -S localhost:8080             # PHP

# 访问：http://localhost:8080
```

## 🔑 管理员登录

**默认管理员账户**：
- 用户名：`hysteria`
- 密码：`hysteria7816`

**⚠️ 安全提醒**：首次登录后请立即修改密码！

## 📋 功能使用指南

### 1. 用户管理
- **位置**：上传作品页面 → 用户管理标签
- **功能**：创建用户、编辑权限、查看登录记录
- **权限**：仅管理员可访问

### 2. 文件权限管理
- **位置**：上传作品页面 → 文件权限标签
- **功能**：设置文件访问权限、批量权限操作
- **支持**：白名单/黑名单、权限继承

### 3. 登录记录查看
- **位置**：用户管理 → 点击"📋 登录记录"按钮
- **功能**：查看用户登录历史、导出数据
- **筛选**：按用户名、时间、状态筛选

### 4. 系统统计
- **位置**：首页管理员面板
- **功能**：实时用户统计、作品统计、存储使用情况
- **更新**：5分钟自动缓存，点击可手动刷新

### 5. 作品管理
- **上传**：支持文学作品表单输入、媒体文件上传
- **分类**：生活随笔、诗歌、小说、绘画、音乐、视频
- **权限**：可设置公开/好友/管理员专用

## 👥 用户权限说明

### 访客 (Visitor)
- ✅ 浏览公开内容
- ❌ 发布内容
- ❌ 访问受限内容

### 好友 (Friend)
- ✅ 访客权限 + 浏览好友内容
- ✅ 发布和编辑自己的作品
- ❌ 管理其他用户

### 管理员 (Admin)
- ✅ 所有权限
- ✅ 用户管理
- ✅ 系统管理
- ✅ 数据统计

## 🔧 常见问题

### Q: 无法登录管理员账户？
**A**: 
1. 确认用户名密码：`hysteria` / `hysteria7816`
2. 清除浏览器缓存
3. 尝试无痕模式

### Q: 权限设置不生效？
**A**: 
1. 确认有管理员权限
2. 刷新页面重新加载
3. 检查浏览器控制台错误

### Q: 统计数据异常？
**A**: 
1. 点击"重新加载"按钮
2. 清除缓存：在控制台执行 `systemStatsManager.clearCache()`

### Q: GitHub Pages 部署失败？
**A**: 
1. 检查 GitHub Actions 状态
2. 确认 Pages 设置正确
3. 验证所有文件已提交

## 🛠️ 开发者信息

### 技术栈
- 前端：HTML5, CSS3, JavaScript (ES6+)
- 存储：LocalStorage + Firebase (可选)
- 部署：GitHub Pages + GitHub Actions

### 项目结构
```
Serial_story/
├── index.html              # 首页
├── upload.html             # 管理中心
├── essays.html             # 随笔页面
├── js/                     # JavaScript 模块
│   ├── auth.js             # 认证系统
│   ├── system-stats.js     # 统计系统
│   ├── login-records-manager.js # 登录记录
│   └── file-permissions-*.js    # 权限系统
├── css/style.css           # 样式文件
└── images/                 # 图片资源
```

### 数据存储
- **用户数据**：`localStorage.user_*`
- **作品数据**：`localStorage.work_*`
- **权限数据**：`localStorage.file_permissions`
- **登录记录**：`localStorage.loginRecords`

## 📞 获取帮助

- **GitHub Issues**: [报告问题](https://github.com/hysteriasy/Serial_story/issues)
- **项目地址**: https://github.com/hysteriasy/Serial_story
- **在线演示**: https://hysteriasy.github.io/Serial_story/

---

**祝您使用愉快！** 🎉

如果觉得项目有用，请给个 ⭐ Star 支持一下！
