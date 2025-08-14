# 页眉页脚组件使用指南

## 概述

本项目已将页眉（导航栏）和页脚组件化，创建了可复用的模块供所有页面调用。组件包含完整的HTML结构、CSS样式和JavaScript功能，确保在不同页面中的一致性和易维护性。

## 组件文件

- `js/header.js` - 页眉组件模块
- `js/footer.js` - 页脚组件模块
- `js/header-footer.js` - 统一的页眉页脚管理器（保留兼容性）

## 快速开始

### 方法一：使用独立组件（推荐）

在HTML页面中引入组件文件并初始化：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>页面标题</title>
    
    <!-- 引入主样式文件 -->
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- 页眉将通过组件动态插入 -->
    
    <!-- 页面主要内容 -->
    <main>
        <h1>页面内容</h1>
        <p>这里是页面的主要内容...</p>
    </main>
    
    <!-- 页脚将通过组件动态插入 -->
    
    <!-- 引入组件文件 -->
    <script src="js/header.js"></script>
    <script src="js/footer.js"></script>
    
    <!-- 初始化组件 -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 初始化页眉
            if (typeof initHeader === 'function') {
                window.headerComponent = initHeader();
            }
            
            // 初始化页脚
            if (typeof initFooter === 'function') {
                window.footerComponent = initFooter();
            }
        });
    </script>
</body>
</html>
```

### 方法二：使用自动初始化

在HTML的`<head>`部分添加meta标签来启用自动初始化：

```html
<head>
    <!-- 启用页眉自动初始化 -->
    <meta name="auto-header" content="true">
    
    <!-- 启用页脚自动初始化 -->
    <meta name="auto-footer" content="true">
    
    <!-- 或者同时启用页眉页脚（使用统一管理器） -->
    <meta name="auto-header-footer" content="true">
</head>
```

然后引入相应的组件文件即可自动初始化。

### 方法三：使用统一管理器

```html
<!-- 引入统一管理器 -->
<script src="js/header-footer.js"></script>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        // 使用统一管理器初始化
        window.headerFooterManager = initHeaderFooter();
    });
</script>
```

## 组件功能特性

### 页眉组件功能

1. **响应式导航栏**
   - 桌面端水平导航菜单
   - 移动端汉堡菜单
   - 平滑的展开/收起动画

2. **下拉菜单**
   - 作品展示下拉菜单
   - 悬停显示，点击导航
   - 支持移动端适配

3. **用户认证状态**
   - 登录/退出功能
   - 用户信息显示
   - 管理员权限标识

4. **滚动效果**
   - 滚动时导航栏背景透明度变化
   - 毛玻璃效果（backdrop-filter）

5. **平滑滚动**
   - 锚点链接平滑滚动
   - 自动处理页面内导航

### 页脚组件功能

1. **简洁页脚**
   - 版权信息
   - 快速链接
   - 响应式布局

2. **返回顶部按钮**
   - 滚动超过300px时显示
   - 平滑滚动到顶部
   - 现代化按钮样式

## API 参考

### 页眉组件 (HeaderComponent)

#### 方法

- `init()` - 初始化页眉组件
- `updateAuthNavigation()` - 更新认证状态显示
- `generateHeader()` - 生成页眉HTML
- `injectStyles()` - 注入必要的CSS样式

#### 全局函数

- `initHeader()` - 手动初始化页眉组件
- `showLoginModal()` - 显示登录模态框
- `closeLoginModal()` - 关闭登录模态框
- `logout()` - 用户退出登录
- `scrollToSection(sectionId)` - 滚动到指定区域

### 页脚组件 (FooterComponent)

#### 方法

- `init()` - 初始化页脚组件
- `generateFooter()` - 生成页脚HTML
- `initBackToTop()` - 初始化返回顶部功能
- `injectStyles()` - 注入必要的CSS样式

#### 全局函数

- `initFooter()` - 手动初始化页脚组件
- `scrollToTop()` - 滚动到页面顶部

## 样式定制

### CSS类名

页眉相关：
- `.navbar` - 导航栏容器
- `.nav-container` - 导航内容容器
- `.nav-logo` - Logo区域
- `.nav-menu` - 导航菜单
- `.nav-item` - 导航项
- `.nav-link` - 导航链接
- `.nav-dropdown` - 下拉菜单容器
- `.nav-dropdown-menu` - 下拉菜单
- `.nav-toggle` - 移动端菜单切换按钮

页脚相关：
- `.footer` - 页脚容器
- `.footer-content` - 页脚内容
- `.footer-links` - 页脚链接
- `.back-to-top` - 返回顶部按钮

### 自定义样式

如果需要自定义样式，可以在页面中添加额外的CSS：

```css
/* 自定义导航栏颜色 */
.navbar {
    background-color: #your-color !important;
}

/* 自定义Logo样式 */
.nav-logo h2 {
    color: #your-brand-color !important;
}

/* 自定义返回顶部按钮 */
.back-to-top {
    background: linear-gradient(135deg, #your-color1, #your-color2) !important;
}
```

## 兼容性说明

### 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- iOS Safari 12+
- Android Chrome 60+

### 依赖要求

1. **CSS文件**：需要引入主样式文件 `css/style.css`
2. **认证系统**：如果使用登录功能，需要 `auth` 对象
3. **消息系统**：可选的 `showSuccessMessage` 函数

## 故障排除

### 常见问题

1. **组件未显示**
   - 检查是否正确引入了组件文件
   - 确认初始化函数是否被调用
   - 查看浏览器控制台是否有错误信息

2. **样式异常**
   - 确认引入了 `css/style.css` 文件
   - 检查是否有CSS冲突
   - 确认组件的样式注入是否成功

3. **移动端菜单无法工作**
   - 检查触摸事件是否被正确绑定
   - 确认CSS媒体查询是否生效
   - 查看是否有JavaScript错误

4. **登录功能异常**
   - 确认 `auth` 对象是否已加载
   - 检查认证相关的JavaScript文件是否引入
   - 查看登录模态框是否正确创建

### 调试技巧

1. **启用详细日志**：组件会在控制台输出详细的初始化和运行日志
2. **检查DOM元素**：使用浏览器开发者工具检查组件是否正确插入
3. **验证事件绑定**：确认点击和滚动事件是否正确绑定

## 更新日志

### v1.0.0 (当前版本)
- 首次发布页眉页脚组件
- 支持响应式设计
- 集成用户认证功能
- 提供完整的API和样式系统

## 贡献指南

如需修改或扩展组件功能，请遵循以下原则：

1. 保持向后兼容性
2. 确保响应式设计
3. 添加适当的错误处理
4. 更新相关文档
5. 进行充分测试

## 许可证

本组件遵循项目的整体许可证协议。
