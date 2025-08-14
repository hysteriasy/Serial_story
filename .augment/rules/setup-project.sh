#!/bin/bash
# 项目初始化脚本 - Serial Story Git推送规则设置

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "🔧 初始化Serial Story项目Git推送规则"
echo "===================================="

# 检查是否在正确的目录
if [ ! -f "index.html" ] || [ ! -d ".augment" ]; then
    log_error "请在Serial Story项目根目录中运行此脚本"
    exit 1
fi

# 创建必要的目录
log_info "创建必要的目录结构..."
mkdir -p scripts
mkdir -p .github/workflows

# 复制脚本文件到scripts目录
log_info "复制脚本文件到scripts目录..."

if [ -f ".augment/rules/git-config.sh" ]; then
    cp ".augment/rules/git-config.sh" "scripts/"
    log_success "复制 git-config.sh"
fi

if [ -f ".augment/rules/pre-push-check.sh" ]; then
    cp ".augment/rules/pre-push-check.sh" "scripts/"
    log_success "复制 pre-push-check.sh"
fi

if [ -f ".augment/rules/safe-deploy.sh" ]; then
    cp ".augment/rules/safe-deploy.sh" "scripts/"
    log_success "复制 safe-deploy.sh"
fi

if [ -f ".augment/rules/emergency-push.sh" ]; then
    cp ".augment/rules/emergency-push.sh" "scripts/"
    log_success "复制 emergency-push.sh"
fi

# 设置脚本权限
log_info "设置脚本执行权限..."
chmod +x scripts/*.sh 2>/dev/null || true
chmod +x .augment/rules/*.sh 2>/dev/null || true

# 复制.gitattributes文件
log_info "设置.gitattributes文件..."
if [ -f ".augment/rules/gitattributes-template" ]; then
    if [ ! -f ".gitattributes" ]; then
        cp ".augment/rules/gitattributes-template" ".gitattributes"
        log_success "创建 .gitattributes 文件"
    else
        log_warning ".gitattributes 文件已存在，跳过创建"
    fi
fi

# 配置Git
log_info "配置Git设置..."
if [ -f "scripts/git-config.sh" ]; then
    bash scripts/git-config.sh
else
    log_warning "git-config.sh 不存在，跳过Git配置"
fi

# 创建Git hooks
log_info "设置Git hooks..."
mkdir -p .git/hooks

# 创建pre-push hook
if [ -f "scripts/pre-push-check.sh" ]; then
    cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
# Pre-push hook for Serial Story

echo "🔍 执行推送前检查..."

if [ -f "scripts/pre-push-check.sh" ]; then
    bash scripts/pre-push-check.sh
elif [ -f ".augment/rules/pre-push-check.sh" ]; then
    bash .augment/rules/pre-push-check.sh
else
    echo "⚠️  推送前检查脚本不存在，跳过检查"
fi
EOF
    chmod +x .git/hooks/pre-push
    log_success "创建 pre-push hook"
fi

# 创建commit-msg hook
cat > .git/hooks/commit-msg << 'EOF'
#!/bin/bash
# Commit message hook for Serial Story

commit_regex='^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "❌ 提交消息格式不正确"
    echo "格式应为: type(scope): description"
    echo "类型: feat, fix, docs, style, refactor, test, chore"
    echo "示例: feat(admin): 添加文件权限管理功能"
    exit 1
fi
EOF
chmod +x .git/hooks/commit-msg
log_success "创建 commit-msg hook"

# 创建便捷脚本
log_info "创建便捷脚本..."

# 创建快速部署脚本
cat > quick-deploy.sh << 'EOF'
#!/bin/bash
# 快速部署脚本

if [ -f "scripts/safe-deploy.sh" ]; then
    bash scripts/safe-deploy.sh "$1"
elif [ -f ".augment/rules/safe-deploy.sh" ]; then
    bash .augment/rules/safe-deploy.sh "$1"
else
    echo "❌ 部署脚本不存在"
    exit 1
fi
EOF
chmod +x quick-deploy.sh
log_success "创建 quick-deploy.sh"

# 创建快速状态检查脚本
cat > check-status.sh << 'EOF'
#!/bin/bash
# 快速状态检查脚本

echo "📊 Serial Story 项目状态检查"
echo "=========================="

echo "🔍 Git状态:"
git status --short

echo ""
echo "📝 最近提交:"
git log --oneline -5

echo ""
echo "🌐 远程状态:"
git remote -v

echo ""
echo "📋 分支信息:"
git branch -a

echo ""
echo "📊 文件统计:"
echo "JavaScript文件: $(find . -name "*.js" -not -path "./node_modules/*" | wc -l)"
echo "CSS文件: $(find . -name "*.css" -not -path "./node_modules/*" | wc -l)"
echo "HTML文件: $(find . -name "*.html" | wc -l)"

echo ""
echo "🔧 Git配置:"
echo "用户名: $(git config user.name)"
echo "邮箱: $(git config user.email)"
echo "默认分支: $(git config init.defaultBranch)"
EOF
chmod +x check-status.sh
log_success "创建 check-status.sh"

# 更新.gitignore（如果需要）
log_info "检查.gitignore文件..."
if [ -f ".gitignore" ]; then
    # 添加一些常见的忽略项（如果不存在）
    if ! grep -q "quick-deploy.sh" .gitignore; then
        echo "" >> .gitignore
        echo "# 项目脚本（可选忽略）" >> .gitignore
        echo "# quick-deploy.sh" >> .gitignore
        echo "# check-status.sh" >> .gitignore
    fi
    log_success ".gitignore 文件已更新"
else
    log_warning ".gitignore 文件不存在"
fi

# 创建使用说明文件
log_info "创建使用说明文件..."
cat > GIT_USAGE.md << 'EOF'
# Git推送规则使用说明

## 🚀 快速开始

### 日常开发流程
```bash
# 1. 开始工作前
git pull origin main

# 2. 进行开发
# ... 编辑文件 ...

# 3. 快速部署
./quick-deploy.sh "功能描述"

# 4. 检查状态
./check-status.sh
```

### 可用命令

#### Git别名
- `git safe-push` - 安全推送
- `git quick-commit "消息"` - 快速提交
- `git status-check` - 状态检查
- `git cleanup` - 清理临时文件
- `git force-sync` - 强制同步远程

#### 脚本命令
- `bash scripts/safe-deploy.sh "消息"` - 安全部署
- `bash scripts/emergency-push.sh "消息"` - 紧急推送
- `./quick-deploy.sh "消息"` - 快速部署
- `./check-status.sh` - 状态检查

## 📋 推送检查清单

推送前会自动检查：
- [ ] JavaScript语法
- [ ] HTML结构
- [ ] 敏感信息
- [ ] 文件大小
- [ ] 提交消息格式

## 🚨 紧急情况

如遇紧急情况需要快速推送：
```bash
bash scripts/emergency-push.sh "紧急修复描述"
```

## 📚 更多信息

详细规则请查看：
- `.augment/rules/git-push-rules.md` - 完整推送规则
- `.augment/rules/PUSH_WORKFLOW.md` - 工作流程说明
EOF
log_success "创建 GIT_USAGE.md"

echo ""
log_success "项目初始化完成！"
echo ""
echo "📋 已创建的文件和功能:"
echo "   📁 scripts/ - 脚本目录"
echo "   🔧 .git/hooks/ - Git钩子"
echo "   📄 .gitattributes - Git属性配置"
echo "   🚀 quick-deploy.sh - 快速部署脚本"
echo "   📊 check-status.sh - 状态检查脚本"
echo "   📚 GIT_USAGE.md - 使用说明"
echo ""
echo "💡 可用命令:"
echo "   ./quick-deploy.sh \"提交消息\"     - 快速部署"
echo "   ./check-status.sh                - 检查项目状态"
echo "   git safe-push                    - 安全推送"
echo "   git quick-commit \"消息\"         - 快速提交"
echo "   git status-check                 - Git状态检查"
echo ""
echo "📖 使用说明请查看: GIT_USAGE.md"
echo "📋 完整规则请查看: .augment/rules/git-push-rules.md"
