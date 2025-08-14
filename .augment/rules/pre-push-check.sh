#!/bin/bash
# 推送前检查脚本

echo "🔍 开始推送前检查..."

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

# 检查工作目录状态
check_working_directory() {
    log_info "检查工作目录..."
    
    # 检查是否有未跟踪的重要文件
    untracked_files=$(git ls-files --others --exclude-standard)
    if [ ! -z "$untracked_files" ]; then
        log_warning "发现未跟踪的文件:"
        echo "$untracked_files"
        read -p "是否继续推送? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "推送已取消"
            exit 1
        fi
    fi
    
    log_success "工作目录检查通过"
}

# 检查敏感信息
check_sensitive_info() {
    log_info "检查敏感信息..."
    
    # 检查是否包含API密钥模式
    sensitive_patterns=(
        "ghp_[a-zA-Z0-9]{36}"  # GitHub Personal Access Token
        "sk-[a-zA-Z0-9]{48}"   # OpenAI API Key
        "AIza[0-9A-Za-z\\-_]{35}"  # Google API Key
        "AKIA[0-9A-Z]{16}"     # AWS Access Key
        "ya29\\.[0-9A-Za-z\\-_]+"  # Google OAuth Token
    )
    
    for pattern in "${sensitive_patterns[@]}"; do
        if git diff --cached | grep -E "$pattern" > /dev/null; then
            log_error "检测到可能的API密钥，请检查暂存的更改"
            log_error "模式: $pattern"
            exit 1
        fi
    done
    
    # 检查常见的敏感文件
    sensitive_files=(
        ".env"
        "config.json"
        "firebase-config.js"
        "github-token.js"
        "*.key"
        "*.pem"
    )
    
    for file_pattern in "${sensitive_files[@]}"; do
        if git diff --cached --name-only | grep -E "$file_pattern" > /dev/null; then
            log_warning "检测到敏感文件: $file_pattern"
            read -p "确认要提交此文件? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_error "推送已取消"
                exit 1
            fi
        fi
    done
    
    log_success "未发现敏感信息"
}

# 检查文件大小
check_file_sizes() {
    log_info "检查文件大小..."
    
    # 检查大文件 (>10MB)
    large_files=$(git diff --cached --name-only | xargs -I {} find {} -size +10M 2>/dev/null)
    if [ ! -z "$large_files" ]; then
        log_warning "发现大文件 (>10MB):"
        echo "$large_files"
        read -p "是否继续推送? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "推送已取消"
            exit 1
        fi
    fi
    
    # 检查超大文件 (>50MB)
    huge_files=$(git diff --cached --name-only | xargs -I {} find {} -size +50M 2>/dev/null)
    if [ ! -z "$huge_files" ]; then
        log_error "发现超大文件 (>50MB)，GitHub不允许推送:"
        echo "$huge_files"
        exit 1
    fi
    
    log_success "文件大小检查通过"
}

# 检查JavaScript语法
check_javascript_syntax() {
    log_info "检查JavaScript语法..."
    
    js_files=$(git diff --cached --name-only | grep '\.js$')
    if [ ! -z "$js_files" ]; then
        for file in $js_files; do
            if [ -f "$file" ]; then
                # 使用node检查语法（如果可用）
                if command -v node > /dev/null; then
                    if ! node -c "$file" 2>/dev/null; then
                        log_error "JavaScript语法错误: $file"
                        exit 1
                    fi
                else
                    # 简单的语法检查
                    if grep -E "(console\.log|debugger)" "$file" > /dev/null; then
                        log_warning "发现调试代码在文件: $file"
                        read -p "是否继续推送? (y/N): " -n 1 -r
                        echo
                        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                            log_error "推送已取消"
                            exit 1
                        fi
                    fi
                fi
            fi
        done
        log_success "JavaScript语法检查通过"
    fi
}

# 检查HTML文件
check_html_files() {
    log_info "检查HTML文件..."
    
    html_files=$(git diff --cached --name-only | grep '\.html$')
    if [ ! -z "$html_files" ]; then
        for file in $html_files; do
            if [ -f "$file" ]; then
                # 检查基本HTML结构
                if ! grep -q "<!DOCTYPE" "$file"; then
                    log_warning "HTML文件缺少DOCTYPE声明: $file"
                fi
                
                if ! grep -q "<html" "$file"; then
                    log_warning "HTML文件缺少html标签: $file"
                fi
                
                # 检查字符编码
                if ! grep -q "charset.*utf-8" "$file"; then
                    log_warning "HTML文件可能缺少UTF-8编码声明: $file"
                fi
            fi
        done
        log_success "HTML文件检查通过"
    fi
}

# 检查CSS文件
check_css_files() {
    log_info "检查CSS文件..."
    
    css_files=$(git diff --cached --name-only | grep '\.css$')
    if [ ! -z "$css_files" ]; then
        for file in $css_files; do
            if [ -f "$file" ]; then
                # 检查CSS语法（简单检查）
                if grep -E "\{[^}]*\{" "$file" > /dev/null; then
                    log_warning "CSS文件可能有语法错误（嵌套大括号）: $file"
                fi
            fi
        done
        log_success "CSS文件检查通过"
    fi
}

# 检查提交消息
check_commit_message() {
    log_info "检查提交消息..."
    
    # 获取最新的提交消息
    commit_msg=$(git log -1 --pretty=%B 2>/dev/null || echo "")
    
    if [ -z "$commit_msg" ]; then
        log_warning "没有找到提交消息"
        return
    fi
    
    # 检查提交消息长度
    if [ ${#commit_msg} -lt 10 ]; then
        log_warning "提交消息过短，建议提供更详细的描述"
    fi
    
    # 检查是否包含常见的无意义消息
    meaningless_patterns=(
        "^test$"
        "^fix$"
        "^update$"
        "^wip$"
        "^temp$"
    )
    
    for pattern in "${meaningless_patterns[@]}"; do
        if echo "$commit_msg" | grep -iE "$pattern" > /dev/null; then
            log_warning "提交消息可能不够描述性: $commit_msg"
            break
        fi
    done
    
    log_success "提交消息检查通过"
}

# 检查分支状态
check_branch_status() {
    log_info "检查分支状态..."
    
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        log_warning "当前分支是 '$current_branch'，不是 'main'"
        read -p "是否继续推送到 $current_branch 分支? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "推送已取消"
            exit 1
        fi
    fi
    
    log_success "分支状态检查通过"
}

# 主检查函数
main() {
    echo "🔍 Serial Story 推送前检查"
    echo "=========================="
    
    # 执行所有检查
    check_branch_status
    check_working_directory
    check_sensitive_info
    check_file_sizes
    check_javascript_syntax
    check_html_files
    check_css_files
    check_commit_message
    
    echo ""
    log_success "所有检查通过，可以安全推送"
    echo ""
}

# 运行主函数
main
