#!/bin/bash

# 本地测试辅助脚本
# 用法: ./test-local.sh [vue-project-path]

set -e

echo "🔧 Tracker SDK 本地测试工具"
echo "=========================="

# 1. 清理并重新构建
echo ""
echo "📦 Step 1: 清理旧的构建文件..."
rm -rf dist/

echo "🔨 Step 2: 构建 SDK..."
yarn build

# 检查构建结果
if [ ! -f "dist/index.cjs.js" ] || [ ! -f "dist/index.esm.js" ]; then
    echo "❌ 构建失败：缺少输出文件"
    exit 1
fi

echo "✅ 构建成功！"
echo ""
echo "📄 构建产物:"
ls -lh dist/

# 2. 检查导出内容
echo ""
echo "🔍 Step 3: 检查导出内容..."
echo "ESM 模块导出:"
grep -E "^export" dist/index.esm.js | head -10

echo ""
echo "CJS 模块导出:"
grep -E "module\.exports|exports\." dist/index.cjs.js | head -10

# 3. 提供使用说明
echo ""
echo "=========================="
echo "✨ 下一步操作："
echo ""
echo "方案 A - 使用 npm link（推荐）:"
echo "  在 tracker-sdk 项目中执行:"
echo "    npm link"
echo ""
echo "  在 Vue3 项目中执行:"
echo "    npm link @jasolar/tracker-sdk"
echo ""
echo "方案 B - 使用 yalc（更稳定）:"
echo "  安装 yalc: npm install -g yalc"
echo ""
echo "  在 tracker-sdk 项目中执行:"
echo "    yalc publish"
echo ""
echo "  在 Vue3 项目中执行:"
echo "    yalc add @jasolar/tracker-sdk"
echo "    yarn install"
echo ""
echo "方案 C - 直接引用文件:"
echo "  将 dist/ 文件夹复制到 Vue3 项目中"
echo "  然后导入: import { initTracker } from './libs/tracker-sdk/index.esm.js'"
echo ""

# 4. 如果提供了 Vue 项目路径，自动配置
if [ -n "$1" ]; then
    VUE_PROJECT="$1"
    
    if [ -d "$VUE_PROJECT" ]; then
        echo "🎯 检测到 Vue 项目路径: $VUE_PROJECT"
        echo ""
        read -p "是否自动配置 npm link？(y/n) " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            echo "🔗 正在配置 npm link..."
            
            # 在当前项目执行 link
            npm link
            
            # 切换到 Vue 项目
            cd "$VUE_PROJECT"
            npm link @jasolar/tracker-sdk
            
            echo ""
            echo "✅ npm link 配置完成！"
            echo "   现在可以在 Vue 项目中导入使用了"
            echo ""
            echo "   示例代码:"
            echo "   import { initTracker, routerPlugin } from '@jasolar/tracker-sdk';"
            echo ""
        fi
    else
        echo "⚠️  目录不存在: $VUE_PROJECT"
    fi
fi

echo ""
echo "💡 提示: 修改 SDK 代码后，只需重新运行 'yarn build' 即可更新"
echo ""
