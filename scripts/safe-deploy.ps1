# Serial Story PowerShell 安全部署脚本
# 适用于Windows环境的Git推送脚本

param(
    [string]$CommitMessage = "自动部署: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

# 颜色定义
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# 日志函数
function Write-LogInfo {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Blue
}

function Write-LogSuccess {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Green
}

function Write-LogWarning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Colors.Yellow
}

function Write-LogError {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Red
}

# 清理函数
function Invoke-Cleanup {
    Write-LogInfo "清理临时文件..."
    
    # 清理交换文件
    Get-ChildItem -Path . -Recurse -Filter "*.swp" -ErrorAction SilentlyContinue | Remove-Item -Force
    Get-ChildItem -Path . -Recurse -Filter "*.swo" -ErrorAction SilentlyContinue | Remove-Item -Force
    Get-ChildItem -Path . -Recurse -Filter "*~" -ErrorAction SilentlyContinue | Remove-Item -Force
    
    # 清理Git合并文件
    if (Test-Path ".git\.MERGE_MSG.swp") { Remove-Item ".git\.MERGE_MSG.swp" -Force -ErrorAction SilentlyContinue }
    if (Test-Path ".git\.COMMIT_EDITMSG.swp") { Remove-Item ".git\.COMMIT_EDITMSG.swp" -Force -ErrorAction SilentlyContinue }
    if (Test-Path ".git\MERGE_HEAD") { Remove-Item ".git\MERGE_HEAD" -Force -ErrorAction SilentlyContinue }
    if (Test-Path ".git\MERGE_MODE") { Remove-Item ".git\MERGE_MODE" -Force -ErrorAction SilentlyContinue }
    
    Write-LogSuccess "临时文件清理完成"
}

# 检查Git状态
function Test-GitStatus {
    Write-LogInfo "检查Git状态..."
    
    try {
        $gitDir = git rev-parse --git-dir 2>$null
        if (-not $gitDir) {
            Write-LogError "当前目录不是Git仓库"
            return $false
        }
        
        $currentBranch = git branch --show-current 2>$null
        if ($currentBranch -ne "main") {
            Write-LogWarning "当前分支是 '$currentBranch'，不是 'main'"
            $response = Read-Host "是否切换到main分支? (y/N)"
            if ($response -eq "y" -or $response -eq "Y") {
                git checkout main
            }
        }
        
        Write-LogSuccess "Git状态检查通过"
        return $true
    }
    catch {
        Write-LogError "Git状态检查失败: $($_.Exception.Message)"
        return $false
    }
}

# 安全拉取
function Invoke-SafePull {
    Write-LogInfo "拉取远程更改..."
    
    $maxAttempts = 3
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        Write-LogInfo "拉取尝试 $attempt/$maxAttempts"
        
        try {
            git fetch origin main 2>$null
            Write-LogSuccess "远程获取成功"
            break
        }
        catch {
            Write-LogWarning "远程获取失败，等待5秒后重试..."
            Start-Sleep -Seconds 5
            $attempt++
        }
        
        if ($attempt -gt $maxAttempts) {
            Write-LogError "远程获取失败，请检查网络连接"
            return $false
        }
    }
    
    # 尝试合并
    try {
        git pull origin main --no-edit 2>$null
        Write-LogSuccess "合并成功"
        return $true
    }
    catch {
        Write-LogWarning "自动合并失败，尝试手动处理..."
        
        # 检查是否有冲突
        $status = git status --porcelain 2>$null
        if ($status -match "UU") {
            Write-LogError "存在合并冲突，请手动解决后重新运行脚本"
            git status
            return $false
        }
        
        # 尝试强制合并
        try {
            git pull origin main --allow-unrelated-histories --no-edit 2>$null
            Write-LogSuccess "强制合并成功"
            return $true
        }
        catch {
            Write-LogError "合并失败: $($_.Exception.Message)"
            return $false
        }
    }
}

# 提交更改
function Invoke-CommitChanges {
    param([string]$Message)
    
    Write-LogInfo "检查是否有更改需要提交..."
    
    try {
        $diffOutput = git diff --quiet 2>$null; $diffExitCode = $LASTEXITCODE
        $diffCachedOutput = git diff --cached --quiet 2>$null; $diffCachedExitCode = $LASTEXITCODE
        
        if ($diffExitCode -eq 0 -and $diffCachedExitCode -eq 0) {
            Write-LogInfo "没有更改需要提交"
            return $true
        }
        
        # 添加所有更改
        git add . 2>$null
        
        Write-LogInfo "提交更改: $Message"
        git commit -m "$Message" 2>$null
        Write-LogSuccess "提交成功"
        return $true
    }
    catch {
        Write-LogError "提交失败: $($_.Exception.Message)"
        return $false
    }
}

# 安全推送
function Invoke-SafePush {
    Write-LogInfo "开始推送到远程仓库..."
    
    $maxAttempts = 3
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        Write-LogInfo "推送尝试 $attempt/$maxAttempts"
        
        try {
            git push origin main 2>$null
            Write-LogSuccess "推送成功！"
            return $true
        }
        catch {
            Write-LogWarning "推送失败，尝试重新同步..."
            
            # 重新拉取并尝试推送
            if ($attempt -lt $maxAttempts) {
                Invoke-SafePull
                Start-Sleep -Seconds 2
            }
            
            $attempt++
        }
    }
    
    Write-LogError "推送失败，已达到最大重试次数"
    return $false
}

# 验证部署
function Test-Deployment {
    Write-LogInfo "验证GitHub Pages部署..."
    
    # 等待几秒让GitHub处理
    Start-Sleep -Seconds 5
    
    # 检查GitHub Pages状态
    try {
        $siteUrl = "https://hysteriasy.github.io/Serial_story/"
        $response = Invoke-WebRequest -Uri $siteUrl -Method Head -TimeoutSec 10 -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Write-LogSuccess "网站可访问: $siteUrl"
        } else {
            Write-LogWarning "网站状态码: $($response.StatusCode)，可能需要等待几分钟"
        }
    }
    catch {
        Write-LogWarning "无法检查网站状态，可能需要等待几分钟"
    }
    
    Write-LogInfo "GitHub Actions状态: https://github.com/hysteriasy/Serial_story/actions"
}

# 主函数
function Main {
    param([string]$CommitMsg)
    
    Write-Host "🚀 Serial Story 安全部署脚本 (PowerShell版)" -ForegroundColor $Colors.Blue
    Write-Host "=============================================" -ForegroundColor $Colors.Blue
    
    # 执行部署流程
    Invoke-Cleanup
    
    if (-not (Test-GitStatus)) {
        Write-LogError "Git状态检查失败"
        exit 1
    }
    
    if (-not (Invoke-SafePull)) {
        Write-LogError "拉取远程更改失败"
        exit 1
    }
    
    if (-not (Invoke-CommitChanges $CommitMsg)) {
        Write-LogError "提交更改失败"
        exit 1
    }
    
    if (Invoke-SafePush) {
        Test-Deployment
        Write-LogSuccess "部署完成！"
        Write-Host ""
        Write-Host "📊 部署信息:" -ForegroundColor $Colors.Green
        Write-Host "   🌐 网站地址: https://hysteriasy.github.io/Serial_story/" -ForegroundColor $Colors.White
        Write-Host "   📋 Actions: https://github.com/hysteriasy/Serial_story/actions" -ForegroundColor $Colors.White
        Write-Host "   📝 提交历史: https://github.com/hysteriasy/Serial_story/commits/main" -ForegroundColor $Colors.White
    } else {
        Write-LogError "部署失败"
        exit 1
    }
}

# 运行主函数
Main $CommitMessage
