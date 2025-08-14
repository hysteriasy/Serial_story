#!/bin/bash
# Git配置脚本 - 为Serial Story项目设置标准Git配置

echo "🔧 配置Serial Story项目的Git设置..."

# 基本用户配置
git config user.name "hysteriasy"
git config user.email "hysteriasy@users.noreply.github.com"

# 推送和拉取策略
git config push.default simple
git config pull.rebase false
git config merge.ff false

# 避免vim编辑器问题
git config core.editor "nano"
git config merge.tool "vimdiff"

# 设置行尾处理
git config core.autocrlf true
git config core.safecrlf warn

# 设置凭据缓存
git config credential.helper store

# 设置别名
git config alias.safe-push '!f() { 
    echo "🔍 执行安全推送流程..."; 
    git fetch origin main && 
    git pull origin main --no-edit && 
    echo "📤 推送到远程仓库..." &&
    git push origin main; 
}; f'

git config alias.quick-commit '!f() { 
    git add . && 
    git commit -m "${1:-快速提交: $(date +%Y-%m-%d\ %H:%M:%S)}"; 
}; f'

git config alias.status-check '!f() {
    echo "📊 Git状态检查:";
    echo "当前分支: $(git branch --show-current)";
    echo "未跟踪文件: $(git ls-files --others --exclude-standard | wc -l)";
    echo "已修改文件: $(git diff --name-only | wc -l)";
    echo "已暂存文件: $(git diff --cached --name-only | wc -l)";
    git status --short;
}; f'

# 设置网络超时
git config http.timeout 300
git config http.postBuffer 524288000

# 设置合并策略
git config merge.ours.driver true
git config core.mergeoptions "--no-edit"

# 设置忽略文件权限变化（Windows环境）
git config core.filemode false

# 设置默认分支名
git config init.defaultBranch main

# 设置颜色输出
git config color.ui auto
git config color.branch auto
git config color.diff auto
git config color.status auto

# 设置日志格式
git config alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

# 设置清理别名
git config alias.cleanup '!f() {
    echo "🧹 清理临时文件...";
    find . -name "*.swp" -delete 2>/dev/null || true;
    find . -name "*.swo" -delete 2>/dev/null || true;
    find . -name "*~" -delete 2>/dev/null || true;
    rm -f .git/.MERGE_MSG.swp 2>/dev/null || true;
    rm -f .git/.COMMIT_EDITMSG.swp 2>/dev/null || true;
    echo "✅ 清理完成";
}; f'

# 设置强制同步别名
git config alias.force-sync '!f() {
    echo "🔄 强制同步远程仓库...";
    git fetch origin main;
    git reset --hard origin/main;
    echo "✅ 同步完成";
}; f'

echo "✅ Git配置完成！"
echo ""
echo "💡 可用的新命令:"
echo "   git safe-push          - 安全推送"
echo "   git quick-commit       - 快速提交"
echo "   git status-check       - 状态检查"
echo "   git cleanup            - 清理临时文件"
echo "   git force-sync         - 强制同步远程"
echo "   git lg                 - 美化的日志显示"
echo ""
echo "🔧 配置验证:"
git config --list | grep -E "(user|push|pull|merge|alias)" | head -10
