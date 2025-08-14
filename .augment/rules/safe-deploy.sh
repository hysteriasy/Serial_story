#!/bin/bash
# Serial Story 安全部署脚本

set -e  # 遇到错误立即退出

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

# 清理函数
cleanup() {
    log_info "清理临时文件..."
    find . -name "*.swp" -delete 2>/dev/null || true
    find . -name "*.swo" -delete 2>/dev/null || true
    find . -name "*~" -delete 2>/dev/null || true
    rm -f .git/.MERGE_MSG.swp 2>/dev/null || true
    rm -f .git/.COMMIT_EDITMSG.swp 2>/dev/null || true
}

# 检查Git状态
check_git_status() {
    log_info "检查Git状态..."
    
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "当前目录不是Git仓库"
        exit 1
    fi
    
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        log_warning "当前分支是 '$current_branch'，不是 'main'"
        read -p "是否切换到main分支? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git checkout main
        fi
    fi
    
    log_success "Git状态检查通过"
}

# 执行推送前检查
run_pre_push_checks() {
    log_info "执行推送前检查..."
    
    if [ -f ".augment/rules/pre-push-check.sh" ]; then
        bash .augment/rules/pre-push-check.sh
    elif [ -f "scripts/pre-push-check.sh" ]; then
        bash scripts/pre-push-check.sh
    else
        log_warning "推送前检查脚本不存在，跳过检查"
    fi
}

# 安全拉取
safe_pull() {
    log_info "拉取远程更改..."
    
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "拉取尝试 $attempt/$max_attempts"
        
        if git fetch origin main; then
            log_success "远程获取成功"
            break
        else
            log_warning "远程获取失败，等待5秒后重试..."
            sleep 5
            attempt=$((attempt + 1))
        fi
        
        if [ $attempt -gt $max_attempts ]; then
            log_error "远程获取失败，请检查网络连接"
            exit 1
        fi
    done
    
    # 尝试合并
    if git pull origin main --no-edit; then
        log_success "合并成功"
    else
        log_warning "自动合并失败，尝试手动处理..."
        
        # 检查是否有冲突
        if git status | grep -q "both modified"; then
            log_error "存在合并冲突，请手动解决后重新运行脚本"
            git status
            exit 1
        fi
        
        # 尝试强制合并
        git pull origin main --allow-unrelated-histories --no-edit
    fi
}

# 提交更改
commit_changes() {
    log_info "检查是否有更改需要提交..."
    
    if git diff --quiet && git diff --cached --quiet; then
        log_info "没有更改需要提交"
        return 0
    fi
    
    # 添加所有更改
    git add .
    
    # 获取提交消息
    if [ -z "$1" ]; then
        commit_message="自动部署: $(date '+%Y-%m-%d %H:%M:%S')"
    else
        commit_message="$1"
    fi
    
    log_info "提交更改: $commit_message"
    git commit -m "$commit_message"
}

# 安全推送
safe_push() {
    log_info "开始推送到远程仓库..."
    
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "推送尝试 $attempt/$max_attempts"
        
        if git push origin main; then
            log_success "推送成功！"
            return 0
        else
            log_warning "推送失败，尝试重新同步..."
            
            # 重新拉取并尝试推送
            if [ $attempt -lt $max_attempts ]; then
                safe_pull
                sleep 2
            fi
            
            attempt=$((attempt + 1))
        fi
    done
    
    log_error "推送失败，已达到最大重试次数"
    return 1
}

# 验证部署
verify_deployment() {
    log_info "验证GitHub Pages部署..."
    
    # 等待几秒让GitHub处理
    sleep 5
    
    # 检查GitHub Pages状态（需要curl）
    if command -v curl > /dev/null; then
        local site_url="https://hysteriasy.github.io/Serial_story/"
        local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$site_url" || echo "000")
        
        if [ "$status_code" = "200" ]; then
            log_success "网站可访问: $site_url"
        else
            log_warning "网站状态码: $status_code，可能需要等待几分钟"
        fi
    fi
    
    log_info "GitHub Actions状态: https://github.com/hysteriasy/Serial_story/actions"
}

# 显示帮助信息
show_help() {
    echo "Serial Story 安全部署脚本"
    echo ""
    echo "用法:"
    echo "  bash safe-deploy.sh [提交消息]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -f, --force    强制推送（跳过部分检查）"
    echo "  -q, --quiet    静默模式"
    echo ""
    echo "示例:"
    echo "  bash safe-deploy.sh \"修复管理员界面bug\""
    echo "  bash safe-deploy.sh --force \"紧急修复\""
}

# 主函数
main() {
    # 处理命令行参数
    FORCE_MODE=false
    QUIET_MODE=false
    COMMIT_MESSAGE=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -f|--force)
                FORCE_MODE=true
                shift
                ;;
            -q|--quiet)
                QUIET_MODE=true
                shift
                ;;
            *)
                COMMIT_MESSAGE="$1"
                shift
                ;;
        esac
    done
    
    if [ "$QUIET_MODE" = false ]; then
        echo "🚀 Serial Story 安全部署脚本"
        echo "================================"
    fi
    
    # 执行部署流程
    cleanup
    check_git_status
    
    if [ "$FORCE_MODE" = false ]; then
        run_pre_push_checks
    else
        log_warning "强制模式：跳过推送前检查"
    fi
    
    safe_pull
    commit_changes "$COMMIT_MESSAGE"
    
    if safe_push; then
        verify_deployment
        log_success "部署完成！"
        
        if [ "$QUIET_MODE" = false ]; then
            echo ""
            echo "📊 部署信息:"
            echo "   🌐 网站地址: https://hysteriasy.github.io/Serial_story/"
            echo "   📋 Actions: https://github.com/hysteriasy/Serial_story/actions"
            echo "   📝 提交历史: https://github.com/hysteriasy/Serial_story/commits/main"
        fi
    else
        log_error "部署失败"
        exit 1
    fi
}

# 运行主函数
main "$@"
