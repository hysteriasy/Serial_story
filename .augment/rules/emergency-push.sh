#!/bin/bash
# 紧急推送脚本 - 用于紧急情况下的快速部署

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

echo "🚨 紧急推送模式"
echo "================"
log_warning "此脚本将跳过大部分检查，仅用于紧急情况"
echo ""

# 显示当前状态
log_info "当前Git状态:"
git status --short

echo ""
log_warning "紧急推送将执行以下操作:"
echo "1. 清理临时文件"
echo "2. 强制同步远程仓库"
echo "3. 添加所有更改"
echo "4. 提交更改"
echo "5. 强制推送到远程"
echo ""

read -p "确认执行紧急推送? 请输入 'yes' 确认: " -r
if [ "$REPLY" != "yes" ]; then
    log_error "紧急推送已取消"
    exit 1
fi

echo ""
log_info "开始执行紧急推送..."

# 清理临时文件
log_info "🧹 清理临时文件..."
find . -name "*.swp" -delete 2>/dev/null || true
find . -name "*.swo" -delete 2>/dev/null || true
find . -name "*~" -delete 2>/dev/null || true
rm -f .git/.MERGE_MSG.swp 2>/dev/null || true
rm -f .git/.COMMIT_EDITMSG.swp 2>/dev/null || true

# 检查是否在Git仓库中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "当前目录不是Git仓库"
    exit 1
fi

# 强制同步远程仓库
log_info "🔄 强制同步远程仓库..."
if git fetch origin main; then
    log_success "远程获取成功"
else
    log_warning "远程获取失败，继续执行..."
fi

# 尝试重置到远程状态（可选）
read -p "是否重置到远程最新状态? 这将丢失本地未提交的更改 (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_warning "重置到远程状态..."
    git reset --hard origin/main
fi

# 添加所有更改
log_info "📝 添加所有更改..."
git add .

# 检查是否有更改需要提交
if git diff --cached --quiet; then
    log_info "没有更改需要提交"
else
    # 提交更改
    commit_msg="${1:-紧急修复: $(date '+%Y-%m-%d %H:%M:%S')}"
    log_info "💾 提交更改: $commit_msg"
    git commit -m "$commit_msg"
fi

# 强制推送
log_info "🚀 执行强制推送..."
if git push origin main --force; then
    log_success "紧急推送成功！"
    echo ""
    log_info "📊 部署信息:"
    echo "   🌐 网站地址: https://hysteriasy.github.io/Serial_story/"
    echo "   📋 Actions: https://github.com/hysteriasy/Serial_story/actions"
    echo "   📝 最新提交: $(git log -1 --oneline)"
    echo ""
    log_warning "网站将在几分钟内更新"
    
    # 可选：打开浏览器查看状态
    read -p "是否打开GitHub Actions页面查看部署状态? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v start > /dev/null; then
            start https://github.com/hysteriasy/Serial_story/actions
        elif command -v open > /dev/null; then
            open https://github.com/hysteriasy/Serial_story/actions
        elif command -v xdg-open > /dev/null; then
            xdg-open https://github.com/hysteriasy/Serial_story/actions
        else
            echo "请手动访问: https://github.com/hysteriasy/Serial_story/actions"
        fi
    fi
    
else
    log_error "紧急推送失败"
    echo ""
    log_info "可能的解决方案:"
    echo "1. 检查网络连接"
    echo "2. 验证GitHub访问权限"
    echo "3. 检查仓库状态"
    echo "4. 尝试手动推送: git push origin main --force"
    exit 1
fi

echo ""
log_success "紧急推送流程完成"

# 显示后续建议
echo ""
log_info "📋 后续建议:"
echo "1. 监控GitHub Actions的部署状态"
echo "2. 验证网站功能是否正常"
echo "3. 如有问题，考虑回滚到之前的版本"
echo "4. 在非紧急时间补充完整的测试"

# 显示回滚命令
echo ""
log_info "🔄 如需回滚，可使用以下命令:"
echo "   git log --oneline -5  # 查看最近的提交"
echo "   git reset --hard <commit-hash>  # 回滚到指定提交"
echo "   git push origin main --force  # 强制推送回滚"
