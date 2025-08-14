---
type: "agent_requested"
description: "Example description"
---
# Serial Story 推送工作流程

## 🔄 日常开发流程

### 1. 开始工作
```bash
# 拉取最新更改
git pull origin main

# 检查状态
git status-check
```

### 2. 开发和测试
- 进行代码修改
- 本地测试功能
- 验证无错误

### 3. 提交更改
```bash
# 快速提交
git quick-commit "功能描述"

# 或标准提交
git add .
git commit -m "详细的提交消息"
```

### 4. 推送部署
```bash
# 安全部署（推荐）
bash scripts/safe-deploy.sh "部署说明"

# 或使用别名
git safe-push
```

## 🚨 紧急情况流程

### 紧急修复
```bash
# 紧急推送
bash scripts/emergency-push.sh "紧急修复说明"
```

### 回滚操作
```bash
# 查看提交历史
git log --oneline -10

# 回滚到指定提交
git reset --hard <commit-hash>
git push origin main --force
```

## 📋 推送检查清单

### 推送前必检
- [ ] 代码无语法错误
- [ ] 本地功能测试通过
- [ ] 无敏感信息泄露
- [ ] 文件大小合理
- [ ] 提交消息清晰

### 推送后验证
- [ ] GitHub Actions成功
- [ ] 网站正常访问
- [ ] 核心功能正常
- [ ] 无控制台错误

## 🛠️ 故障排除

### 常见问题
1. **推送被拒绝**: 先拉取远程更改
2. **合并冲突**: 手动解决冲突文件
3. **vim编辑器卡住**: 使用 `:wq` 退出
4. **网络超时**: 检查网络连接，重试推送

### 紧急联系
- GitHub仓库: https://github.com/hysteriasy/Serial_story
- GitHub Pages: https://hysteriasy.github.io/Serial_story/
- Actions状态: https://github.com/hysteriasy/Serial_story/actions

## 📊 推送流程图

```
开始
  ↓
检查Git状态
  ↓
拉取最新更改
  ↓
有冲突？ → 是 → 解决冲突 → 继续
  ↓ 否
添加文件
  ↓
提交更改
  ↓
推送到远程
  ↓
验证部署
  ↓
完成
```

## 🔧 自动化脚本使用

### 安全部署脚本
```bash
# 基本用法
bash scripts/safe-deploy.sh

# 带提交消息
bash scripts/safe-deploy.sh "修复管理员界面bug"

# 检查脚本状态
echo $?  # 0表示成功，非0表示失败
```

### 紧急推送脚本
```bash
# 紧急推送（跳过检查）
bash scripts/emergency-push.sh "紧急修复"

# 确认提示
# 输入 "yes" 确认执行
```

### Git配置脚本
```bash
# 初始化项目配置
bash scripts/git-config.sh

# 验证配置
git config --list | grep -E "(user|push|pull|merge)"
```

## 📝 提交消息模板

### 功能开发
```
feat(模块): 添加新功能

- 具体功能描述
- 相关文件修改
- 测试情况

相关: #issue编号
```

### Bug修复
```
fix(模块): 修复具体问题

问题描述:
- 问题现象
- 影响范围

解决方案:
- 修复方法
- 测试验证

相关: #issue编号
```

### 文档更新
```
docs: 更新文档内容

- 更新内容概述
- 修改原因
- 影响范围
```

## 🔍 调试和监控

### 本地调试
```bash
# 检查Git状态
git status-check

# 查看提交历史
git log --oneline -10

# 检查远程状态
git remote show origin
```

### 远程监控
```bash
# 检查GitHub Pages状态
curl -I https://hysteriasy.github.io/Serial_story/

# 检查最新部署
curl -s https://api.github.com/repos/hysteriasy/Serial_story/deployments | jq '.[0]'
```

## 📋 团队协作规范

### 分支管理
- `main`: 主分支，用于生产部署
- `develop`: 开发分支（如需要）
- `feature/*`: 功能分支
- `hotfix/*`: 紧急修复分支

### 代码审查
- 重要功能需要代码审查
- 使用Pull Request进行协作
- 确保CI/CD检查通过

### 发布管理
- 使用语义化版本号
- 创建Release标签
- 维护CHANGELOG文档

## 🚀 持续集成/部署

### GitHub Actions工作流
- 自动构建检查
- 代码质量检查
- 自动部署到GitHub Pages
- 通知机制

### 部署策略
- 蓝绿部署
- 滚动更新
- 回滚机制

## 📚 相关文档

- [Git推送规则](.augment/rules/git-push-rules.md)
- [项目部署指南](../DEPLOYMENT.md)
- [故障排除指南](../TROUBLESHOOTING.md)
- [开发环境设置](../DEVELOPMENT.md)

## 🔄 流程优化

### 定期评估
- 每月评估推送流程效率
- 收集团队反馈
- 优化自动化脚本

### 工具升级
- 定期更新Git版本
- 优化CI/CD流程
- 引入新的开发工具

### 培训计划
- 新成员Git培训
- 最佳实践分享
- 问题案例分析
