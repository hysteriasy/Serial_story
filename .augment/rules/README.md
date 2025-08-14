# Serial Story Git推送规则文件说明

## 📁 文件结构

```
.augment/rules/
├── README.md                    # 本文件 - 说明文档
├── git-push-rules.md           # Git推送规则配置文件
├── PUSH_WORKFLOW.md            # 推送工作流程说明
├── git-config.sh               # Git配置脚本
├── pre-push-check.sh           # 推送前检查脚本
├── safe-deploy.sh              # 安全部署脚本
├── emergency-push.sh           # 紧急推送脚本
├── gitattributes-template      # Git属性配置模板
└── setup-project.sh            # 项目初始化脚本
```

## 📋 文件功能说明

### 1. `git-push-rules.md`
**功能**: 完整的Git推送规则配置文档
**内容包括**:
- 推送目标和基本配置
- 推送前必检项目清单
- 禁止推送的内容列表
- Git配置要求和别名设置
- 标准推送流程步骤
- 冲突处理和重试机制
- 故障排除指南
- 最佳实践建议
- 提交消息规范

### 2. `PUSH_WORKFLOW.md`
**功能**: 详细的推送工作流程说明
**内容包括**:
- 日常开发流程
- 紧急情况处理流程
- 推送检查清单
- 故障排除指南
- 自动化脚本使用说明
- 提交消息模板
- 团队协作规范

### 3. `git-config.sh`
**功能**: 自动配置Git设置的脚本
**主要配置**:
- 用户信息设置
- 推送和拉取策略
- 编辑器配置
- 有用的Git别名
- 网络超时设置
- 颜色输出配置

### 4. `pre-push-check.sh`
**功能**: 推送前自动检查脚本
**检查项目**:
- 工作目录状态
- 敏感信息检测
- 文件大小验证
- JavaScript语法检查
- HTML文件结构检查
- CSS文件语法检查
- 提交消息质量
- 分支状态验证

### 5. `safe-deploy.sh`
**功能**: 安全部署脚本，包含完整的部署流程
**主要功能**:
- 清理临时文件
- Git状态检查
- 执行推送前检查
- 安全拉取远程更改
- 智能提交处理
- 重试机制推送
- 部署验证

### 6. `emergency-push.sh`
**功能**: 紧急情况下的快速推送脚本
**特点**:
- 跳过大部分检查
- 强制同步选项
- 快速推送流程
- 安全确认机制
- 后续建议提示

### 7. `gitattributes-template`
**功能**: Git属性配置模板文件
**配置内容**:
- 文本文件行尾处理
- 二进制文件识别
- 语言检测设置
- 合并策略配置
- 导出忽略设置
- 平台特定处理

### 8. `setup-project.sh`
**功能**: 项目初始化脚本，一键设置所有Git推送规则
**执行操作**:
- 创建必要目录结构
- 复制脚本到scripts目录
- 设置脚本执行权限
- 配置Git设置
- 创建Git hooks
- 生成便捷脚本
- 创建使用说明文档

## 🚀 使用方法

### 初始化项目
```bash
# 在项目根目录执行
bash .augment/rules/setup-project.sh
```

### 日常使用
```bash
# 快速部署
./quick-deploy.sh "提交消息"

# 检查状态
./check-status.sh

# 使用Git别名
git safe-push
git quick-commit "消息"
git status-check
```

### 紧急情况
```bash
# 紧急推送
bash scripts/emergency-push.sh "紧急修复"
```

## 📊 脚本依赖关系

```
setup-project.sh
    ├── 复制 git-config.sh → scripts/
    ├── 复制 pre-push-check.sh → scripts/
    ├── 复制 safe-deploy.sh → scripts/
    ├── 复制 emergency-push.sh → scripts/
    ├── 复制 gitattributes-template → .gitattributes
    └── 创建 Git hooks

safe-deploy.sh
    ├── 调用 pre-push-check.sh
    └── 执行完整部署流程

Git hooks
    ├── pre-push → 调用 pre-push-check.sh
    └── commit-msg → 验证提交消息格式
```

## 🔧 自定义配置

### 修改检查规则
编辑 `pre-push-check.sh` 中的检查函数：
- `check_sensitive_info()` - 敏感信息检查
- `check_file_sizes()` - 文件大小限制
- `check_javascript_syntax()` - JavaScript语法检查

### 修改Git配置
编辑 `git-config.sh` 中的配置项：
- 用户信息
- 推送策略
- 别名定义

### 修改部署流程
编辑 `safe-deploy.sh` 中的部署步骤：
- 检查流程
- 重试机制
- 验证步骤

## 📋 最佳实践

### 1. 定期更新
- 定期检查和更新脚本
- 根据项目需求调整检查规则
- 更新Git配置以适应新版本

### 2. 团队协作
- 确保所有团队成员都运行初始化脚本
- 统一Git配置和工作流程
- 定期培训和分享最佳实践

### 3. 监控和优化
- 监控推送成功率
- 收集团队反馈
- 持续优化脚本性能

## 🛠️ 故障排除

### 常见问题
1. **脚本权限问题**: 运行 `chmod +x scripts/*.sh`
2. **Git配置问题**: 重新运行 `bash scripts/git-config.sh`
3. **Hook不生效**: 检查 `.git/hooks/` 目录权限

### 调试方法
```bash
# 检查脚本语法
bash -n scripts/safe-deploy.sh

# 详细执行日志
bash -x scripts/safe-deploy.sh

# 检查Git配置
git config --list | grep -E "(user|push|pull|alias)"
```

## 📚 相关文档

- [Git官方文档](https://git-scm.com/doc)
- [GitHub Pages文档](https://docs.github.com/en/pages)
- [GitHub Actions文档](https://docs.github.com/en/actions)

## 🔄 版本历史

- v1.0 - 初始版本，包含基本推送规则和脚本
- 后续版本将根据使用反馈进行优化和扩展

## 📞 支持

如有问题或建议，请：
1. 检查相关文档
2. 查看故障排除部分
3. 提交Issue或Pull Request
