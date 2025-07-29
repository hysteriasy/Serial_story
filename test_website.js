#!/usr/bin/env node

/**
 * 网站功能测试脚本
 * 使用Node.js验证网站的基本功能
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

// 测试配置
const TEST_CONFIG = {
    baseDir: __dirname,
    testPort: 8080,
    timeout: 5000
};

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// 日志函数
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// 测试结果统计
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
};

// 运行测试并记录结果
function runTest(testName, testFunction) {
    testResults.total++;
    try {
        const result = testFunction();
        if (result === true) {
            logSuccess(`${testName} - 通过`);
            testResults.passed++;
        } else if (result === 'warning') {
            logWarning(`${testName} - 警告`);
            testResults.warnings++;
        } else {
            logError(`${testName} - 失败`);
            testResults.failed++;
        }
    } catch (error) {
        logError(`${testName} - 错误: ${error.message}`);
        testResults.failed++;
    }
}

// 1. 文件存在性测试
function testFileExistence() {
    log('\n📁 开始文件存在性测试...', 'cyan');
    
    const requiredFiles = [
        'index.html',
        'css/style.css',
        'js/script.js',
        '404.html',
        'robots.txt',
        'README.md',
        '.github/workflows/deploy.yml'
    ];
    
    requiredFiles.forEach(file => {
        runTest(`文件存在: ${file}`, () => {
            return fs.existsSync(path.join(TEST_CONFIG.baseDir, file));
        });
    });
}

// 2. HTML内容验证
function testHTMLContent() {
    log('\n🏗️ 开始HTML内容验证...', 'cyan');
    
    runTest('index.html 内容验证', () => {
        const indexPath = path.join(TEST_CONFIG.baseDir, 'index.html');
        if (!fs.existsSync(indexPath)) return false;
        
        const content = fs.readFileSync(indexPath, 'utf8');
        
        // 检查基本HTML结构
        const checks = [
            content.includes('<!DOCTYPE html>'),
            content.includes('<html lang="zh-CN">'),
            content.includes('<meta charset="UTF-8">'),
            content.includes('<meta name="viewport"'),
            content.includes('<title>'),
            content.includes('css/style.css'),
            content.includes('js/script.js')
        ];
        
        return checks.every(check => check);
    });
    
    runTest('404.html 内容验证', () => {
        const path404 = path.join(TEST_CONFIG.baseDir, '404.html');
        if (!fs.existsSync(path404)) return false;
        
        const content = fs.readFileSync(path404, 'utf8');
        return content.includes('404') && content.includes('页面未找到');
    });
}

// 3. CSS文件验证
function testCSSContent() {
    log('\n🎨 开始CSS文件验证...', 'cyan');
    
    runTest('CSS文件内容验证', () => {
        const cssPath = path.join(TEST_CONFIG.baseDir, 'css/style.css');
        if (!fs.existsSync(cssPath)) return false;
        
        const content = fs.readFileSync(cssPath, 'utf8');
        
        // 检查关键CSS规则
        const checks = [
            content.includes('* {'),  // 重置样式
            content.includes('.navbar'),  // 导航栏
            content.includes('.hero'),  // 英雄区域
            content.includes('@media'),  // 响应式设计
            content.includes('animation'),  // 动画
            content.includes('transition')  // 过渡效果
        ];
        
        return checks.filter(check => check).length >= 4; // 至少4个检查通过
    });
}

// 4. JavaScript文件验证
function testJavaScriptContent() {
    log('\n⚡ 开始JavaScript文件验证...', 'cyan');
    
    runTest('JavaScript文件内容验证', () => {
        const jsPath = path.join(TEST_CONFIG.baseDir, 'js/script.js');
        if (!fs.existsSync(jsPath)) return false;
        
        const content = fs.readFileSync(jsPath, 'utf8');
        
        // 检查关键JavaScript功能
        const checks = [
            content.includes('addEventListener'),
            content.includes('scrollToSection'),
            content.includes('scrollToTop'),
            content.includes('initMobileMenu'),
            content.includes('initContactForm')
        ];
        
        return checks.filter(check => check).length >= 3; // 至少3个检查通过
    });
}

// 5. GitHub Actions配置验证
function testGitHubActions() {
    log('\n🚀 开始GitHub Actions配置验证...', 'cyan');
    
    runTest('GitHub Actions工作流配置', () => {
        const workflowPath = path.join(TEST_CONFIG.baseDir, '.github/workflows/deploy.yml');
        if (!fs.existsSync(workflowPath)) return false;
        
        const content = fs.readFileSync(workflowPath, 'utf8');
        
        // 检查关键配置
        const checks = [
            content.includes('name: Deploy to GitHub Pages'),
            content.includes('on:'),
            content.includes('push:'),
            content.includes('branches: [ main ]'),
            content.includes('actions/checkout@v4'),
            content.includes('actions/deploy-pages@v4')
        ];
        
        return checks.every(check => check);
    });
}

// 6. 项目文档验证
function testDocumentation() {
    log('\n📚 开始项目文档验证...', 'cyan');
    
    runTest('README.md 文档验证', () => {
        const readmePath = path.join(TEST_CONFIG.baseDir, 'README.md');
        if (!fs.existsSync(readmePath)) return false;
        
        const content = fs.readFileSync(readmePath, 'utf8');
        
        // 检查文档内容
        const checks = [
            content.includes('# '),  // 标题
            content.includes('GitHub Pages'),
            content.includes('部署'),
            content.includes('项目特性'),
            content.includes('快速开始')
        ];
        
        return checks.filter(check => check).length >= 3;
    });
    
    runTest('DEPLOYMENT.md 部署文档验证', () => {
        const deployPath = path.join(TEST_CONFIG.baseDir, 'DEPLOYMENT.md');
        if (!fs.existsSync(deployPath)) return 'warning';
        
        const content = fs.readFileSync(deployPath, 'utf8');
        return content.includes('部署') && content.includes('GitHub Pages');
    });
}

// 7. 文件大小检查
function testFileSize() {
    log('\n📊 开始文件大小检查...', 'cyan');
    
    const fileSizeChecks = [
        { file: 'index.html', maxSize: 50 * 1024 }, // 50KB
        { file: 'css/style.css', maxSize: 100 * 1024 }, // 100KB
        { file: 'js/script.js', maxSize: 100 * 1024 } // 100KB
    ];
    
    fileSizeChecks.forEach(({ file, maxSize }) => {
        runTest(`文件大小检查: ${file}`, () => {
            const filePath = path.join(TEST_CONFIG.baseDir, file);
            if (!fs.existsSync(filePath)) return false;
            
            const stats = fs.statSync(filePath);
            const fileSize = stats.size;
            
            if (fileSize > maxSize) {
                logWarning(`${file} 文件大小 ${Math.round(fileSize/1024)}KB 超过建议大小 ${Math.round(maxSize/1024)}KB`);
                return 'warning';
            }
            
            return true;
        });
    });
}

// 8. 语法检查（简单版本）
function testSyntax() {
    log('\n🔍 开始语法检查...', 'cyan');
    
    runTest('HTML语法基础检查', () => {
        const indexPath = path.join(TEST_CONFIG.baseDir, 'index.html');
        if (!fs.existsSync(indexPath)) return false;
        
        const content = fs.readFileSync(indexPath, 'utf8');
        
        // 简单的HTML语法检查
        const openTags = (content.match(/<[^\/][^>]*>/g) || []).length;
        const closeTags = (content.match(/<\/[^>]*>/g) || []).length;
        const selfClosingTags = (content.match(/<[^>]*\/>/g) || []).length;
        
        // 粗略检查标签是否平衡
        return Math.abs(openTags - closeTags - selfClosingTags) < 5;
    });
    
    runTest('CSS语法基础检查', () => {
        const cssPath = path.join(TEST_CONFIG.baseDir, 'css/style.css');
        if (!fs.existsSync(cssPath)) return false;
        
        const content = fs.readFileSync(cssPath, 'utf8');
        
        // 检查CSS基本语法
        const openBraces = (content.match(/{/g) || []).length;
        const closeBraces = (content.match(/}/g) || []).length;
        
        return openBraces === closeBraces;
    });
}

// 显示测试结果摘要
function showTestSummary() {
    log('\n📋 测试结果摘要', 'magenta');
    log('='.repeat(50), 'magenta');
    log(`总计测试: ${testResults.total}`);
    logSuccess(`通过: ${testResults.passed}`);
    logError(`失败: ${testResults.failed}`);
    logWarning(`警告: ${testResults.warnings}`);
    
    const successRate = testResults.total > 0 ? 
        Math.round((testResults.passed / testResults.total) * 100) : 0;
    
    log(`成功率: ${successRate}%`, successRate >= 80 ? 'green' : 'red');
    
    if (testResults.failed === 0) {
        logSuccess('\n🎉 所有关键测试都通过了！网站已准备好部署。');
    } else {
        logError('\n⚠️ 发现一些问题，请修复后再部署。');
    }
}

// 主测试函数
function runAllTests() {
    log('🧪 开始网站功能测试...', 'cyan');
    log('='.repeat(50), 'cyan');
    
    testFileExistence();
    testHTMLContent();
    testCSSContent();
    testJavaScriptContent();
    testGitHubActions();
    testDocumentation();
    testFileSize();
    testSyntax();
    
    showTestSummary();
}

// 如果直接运行此脚本
if (require.main === module) {
    runAllTests();
}

module.exports = {
    runAllTests,
    testResults
};
