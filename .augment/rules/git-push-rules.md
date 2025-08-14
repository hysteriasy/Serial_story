---
type: "agent_requested"
description: "Example description"
---
# Serial Story 项目 Git 推送规则

## 🎯 推送目标
- **主分支**: main
- **远程仓库**: https://github.com/hysteriasy/Serial_story.git
- **部署目标**: GitHub Pages (https://hysteriasy.github.io/Serial_story/)

## 📋 推送前必检项目

### 1. 代码质量检查
- [ ] 所有JavaScript文件无语法错误
- [ ] CSS文件格式正确
- [ ] HTML文件结构完整
- [ ] 控制台无严重错误

### 2. 敏感信息检查
- [ ] 确认没有硬编码的API密钥
- [ ] 检查.gitignore是否正确排除敏感文件
- [ ] 验证GitHub Token等敏感信息已被忽略

### 3. 文件大小检查
- [ ] 单个文件不超过100MB
- [ ] 总推送大小合理
- [ ] 媒体文件已压缩优化

### 4. 功能测试
- [ ] 本地测试所有核心功能正常
- [ ] 管理员界面功能验证
- [ ] 文件上传和权限系统测试

## 🚫 禁止推送的内容
- 包含真实API密钥的文件
- 超大媒体文件（>50MB）
- 临时测试文件
- 个人敏感信息
- node_modules目录
- .env配置文件

## ⚠️ 推送注意事项
- 每次推送前必须先拉取最新更改（重要）
- 提交信息必须清晰描述更改内容
- 重大功能更改需要详细的提交说明
- 紧急修复需要标注优先级

## 🔧 Git配置要求

### 基本配置
```bash
git config user.name "hysteriasy"
git config user.email "hysteriasy@users.noreply.github.com"
git config push.default simple
git config pull.rebase false
git config merge.ff false
```

### 编辑器配置
```bash
git config core.editor "nano"
git config merge.tool "vimdiff"
git config core.autocrlf true
git config core.safecrlf warn
```

### 推送别名
```bash
git config alias.safe-push '!f() { 
    echo "🔍 执行安全推送流程..."; 
    git fetch origin main && 
    git pull origin main --no-edit && 
    echo "📤 推送到远程仓库..." &&
    git push origin main; 
}; f'
```

## 🔄 标准推送流程

### 1. 推送前检查
```bash
# 检查Git状态
git status

# 检查当前分支
git branch

# 清理临时文件
find . -name "*.swp" -delete
find . -name "*.swo" -delete
find . -name "*~" -delete
```

### 2. 拉取最新更改
```bash
# 强制拉取最新更改
git fetch origin main
git pull origin main --no-edit
```

### 3. 提交更改
```bash
# 添加文件
git add .

# 提交更改
git commit -m "清晰的提交消息"
```

### 4. 安全推送
```bash
# 使用安全推送别名
git safe-push

# 或手动执行
git push origin main
```

## 🚨 冲突处理

### 自动合并处理
```bash
# 设置合并策略
git config merge.tool vimdiff
git config core.editor "vim"
git config pull.rebase false
git config merge.ours.driver true
```

### vim编辑器处理
如果遇到vim编辑器：
- 保存退出：`:wq`
- 不保存退出：`:q!`
- 设置默认合并消息：`git config core.mergeoptions "--no-edit"`

### 清理交换文件
```bash
rm -f .git/.MERGE_MSG.swp
rm -f .git/.COMMIT_EDITMSG.swp
rm -f .git/MERGE_HEAD
```

## 🔁 重试机制

### 推送失败处理
```bash
# 如果推送被拒绝，强制同步
git fetch origin main
git reset --hard origin/main
git add .
git commit -m "重新同步并提交更改"
git push origin main
```

### 网络问题处理
```bash
# 增加超时时间
git config http.timeout 300
git config http.postBuffer 524288000
```

## 📊 推送后验证

### 检查部署状态
```bash
# 检查GitHub Pages状态
curl -I https://hysteriasy.github.io/Serial_story/

# 检查最新提交
git log --oneline -5

# 验证远程同步
git fetch origin main
git status
```

### 监控链接
- GitHub Actions: https://github.com/hysteriasy/Serial_story/actions
- GitHub Pages: https://hysteriasy.github.io/Serial_story/
- 提交历史: https://github.com/hysteriasy/Serial_story/commits/main

## 🛠️ 故障排除

### 常见问题解决方案

#### 推送被拒绝 (non-fast-forward)
```bash
git fetch origin main
git rebase origin/main
git push origin main
```

#### 合并冲突
```bash
git status  # 查看冲突文件
# 手动编辑冲突文件
git add .
git commit -m "解决合并冲突"
git push origin main
```

#### vim编辑器卡住
```bash
export EDITOR=nano
# 或者
git config --global core.editor nano
```

#### 网络超时
```bash
git config http.timeout 300
git config http.postBuffer 524288000
```

## 📋 最佳实践

1. **小而频繁的提交**：避免大量更改一次性提交
2. **描述性提交消息**：使用清晰的提交消息格式
3. **分支策略**：考虑使用feature分支进行开发
4. **定期同步**：每天开始工作前先拉取最新更改
5. **备份重要更改**：在重大更改前创建备份分支

## 🚨 紧急情况处理

### 严重Git问题恢复
```bash
# 备份当前工作
cp -r . ../Serial_story_backup

# 重新克隆仓库
git clone https://github.com/hysteriasy/Serial_story.git Serial_story_new
cd Serial_story_new

# 复制更改的文件
cp -r ../Serial_story_backup/* .

# 重新提交
git add .
git commit -m "恢复工作进度"
git push origin main
```

## 📝 提交消息规范

### 格式要求
```
类型(范围): 简短描述

详细描述（可选）

相关问题或链接（可选）
```

### 类型说明
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例
```
feat(admin): 添加文件权限管理功能

- 实现文件权限设置界面
- 添加批量权限操作
- 修复权限验证逻辑

相关问题: #123
```
