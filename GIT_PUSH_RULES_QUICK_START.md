# Git推送规则快速开始指南

## 🚀 立即开始使用

### 1. 初始化项目（一次性设置）
```bash
# 在项目根目录执行
bash .augment/rules/setup-project.sh
```

### 2. 日常推送流程
```bash
# 方法1: 使用安全部署脚本（推荐）
bash scripts/safe-deploy.sh "你的提交消息"

# 方法2: 使用Git别名
git safe-push

# 方法3: 使用快速部署脚本
./quick-deploy.sh "你的提交消息"
```

### 3. 紧急推送（跳过检查）
```bash
bash scripts/emergency-push.sh "紧急修复描述"
```

## 📋 已创建的文件

### 规则文件（`.augment/rules/`）
- `git-push-rules.md` - 完整推送规则
- `PUSH_WORKFLOW.md` - 工作流程说明
- `README.md` - 详细说明文档

### 脚本文件
- `scripts/safe-deploy.sh` - 安全部署脚本
- `quick-deploy.sh` - 快速部署脚本
- `check-status.sh` - 状态检查脚本
- `GIT_USAGE.md` - 使用说明

### 配置文件
- `.gitattributes` - Git属性配置
- `.git/hooks/pre-push` - 推送前检查钩子
- `.git/hooks/commit-msg` - 提交消息验证钩子

## 💡 常用命令

### Git别名（已自动配置）
```bash
git safe-push          # 安全推送
git quick-commit "消息" # 快速提交
git status-check       # 状态检查
git cleanup            # 清理临时文件
git force-sync         # 强制同步远程
git lg                 # 美化的日志显示
```

### 便捷脚本
```bash
./quick-deploy.sh "消息"    # 快速部署
./check-status.sh          # 检查项目状态
```

## 🔍 推送前自动检查

每次推送前会自动检查：
- ✅ JavaScript语法错误
- ✅ HTML文件结构
- ✅ 敏感信息泄露
- ✅ 文件大小限制
- ✅ 提交消息格式
- ✅ 分支状态

## 📝 提交消息格式

使用标准格式：
```
类型(范围): 简短描述

详细描述（可选）
```

**类型说明**：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建工具

**示例**：
```bash
git commit -m "feat(admin): 添加文件权限管理功能"
git commit -m "fix(ui): 修复按钮显示问题"
git commit -m "docs: 更新部署指南"
```

## 🚨 故障排除

### 常见问题
1. **推送被拒绝**
   ```bash
   git pull origin main
   git push origin main
   ```

2. **合并冲突**
   ```bash
   # 手动编辑冲突文件
   git add .
   git commit -m "解决合并冲突"
   git push origin main
   ```

3. **脚本权限问题**
   ```bash
   chmod +x scripts/*.sh
   chmod +x *.sh
   ```

4. **vim编辑器卡住**
   ```bash
   # 在vim中输入
   :wq  # 保存并退出
   ```

### 重置Git配置
```bash
# 重新运行配置脚本
bash .augment/rules/git-config.sh
```

## 📊 监控和验证

### 检查推送状态
```bash
# 检查项目状态
./check-status.sh

# 查看最近提交
git log --oneline -5

# 检查远程同步
git status
```

### 验证部署
- 🌐 网站: https://hysteriasy.github.io/Serial_story/
- 📋 Actions: https://github.com/hysteriasy/Serial_story/actions
- 📝 提交: https://github.com/hysteriasy/Serial_story/commits/main

## 🔄 工作流程图

```
开始工作
    ↓
git pull origin main
    ↓
进行开发和修改
    ↓
bash scripts/safe-deploy.sh "消息"
    ↓
自动执行检查
    ↓
推送到GitHub
    ↓
GitHub Pages自动部署
    ↓
验证网站更新
    ↓
完成
```

## 📚 详细文档

如需了解更多详细信息，请查看：
- `.augment/rules/git-push-rules.md` - 完整推送规则
- `.augment/rules/PUSH_WORKFLOW.md` - 详细工作流程
- `.augment/rules/README.md` - 文件说明
- `GIT_USAGE.md` - 使用说明

## 🎯 最佳实践

1. **每天开始工作前先拉取**
   ```bash
   git pull origin main
   ```

2. **小而频繁的提交**
   ```bash
   git quick-commit "小功能完成"
   ```

3. **使用描述性提交消息**
   ```bash
   git commit -m "feat(upload): 添加文件上传进度显示"
   ```

4. **定期检查项目状态**
   ```bash
   ./check-status.sh
   ```

5. **重要更改前备份**
   ```bash
   git branch backup-$(date +%Y%m%d)
   ```

## 🆘 紧急情况处理

如果遇到严重问题：

1. **备份当前工作**
   ```bash
   cp -r . ../Serial_story_backup
   ```

2. **使用紧急推送**
   ```bash
   bash scripts/emergency-push.sh "紧急修复"
   ```

3. **如果需要回滚**
   ```bash
   git log --oneline -5
   git reset --hard <commit-hash>
   git push origin main --force
   ```

---

**🎉 现在您可以安全、高效地推送代码了！**

有问题请查看详细文档或联系技术支持。
