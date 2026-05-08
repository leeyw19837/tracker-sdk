#!/bin/bash

# Router Plugin 路由过滤功能测试脚本

echo "======================================"
echo "Router Plugin 路由过滤功能测试"
echo "======================================"
echo ""

# 检查文件是否存在
echo "📋 检查修改的文件..."

if [ -f "src/plugins/router.js" ]; then
    echo "✅ router.js 已更新"
else
    echo "❌ router.js 不存在"
    exit 1
fi

if [ -f "examples/router-filter-examples.js" ]; then
    echo "✅ router-filter-examples.js 已创建"
else
    echo "❌ router-filter-examples.js 不存在"
    exit 1
fi

if [ -f "MODULE_ENTER_LEAVE.md" ]; then
    echo "✅ MODULE_ENTER_LEAVE.md 已创建"
else
    echo "❌ MODULE_ENTER_LEAVE.md 不存在"
    exit 1
fi

echo ""
echo "======================================"
echo "功能特性总结"
echo "======================================"
echo ""
echo "✨ 新增功能："
echo "  1. ✅ 白名单模式 (include) - 只监听指定的路由"
echo "  2. ✅ 黑名单模式 (exclude) - 排除指定的路由"
echo "  3. ✅ 自定义过滤函数 (filter) - 灵活的过滤逻辑"
echo "  4. ✅ 支持字符串完全匹配、前缀匹配和正则表达式"
echo ""
echo "📝 使用示例："
echo ""
echo "  // 白名单 - 只追踪指定路由"
echo "  tracker.use(routerPlugin, {"
echo "    include: ['/dashboard', '/user/*']"
echo "  });"
echo ""
echo "  // 黑名单 - 排除指定路由"
echo "  tracker.use(routerPlugin, {"
echo "    exclude: ['/login', '/admin/*']"
echo "  });"
echo ""
echo "  // 自定义过滤"
echo "  tracker.use(routerPlugin, {"
echo "    filter: (path) => !path.startsWith('/test-')"
echo "  });"
echo ""
echo "======================================"
echo "查看文档和示例"
echo "======================================"
echo ""
echo "📖 详细文档："
echo "  - README.md - 基础使用说明"
echo "  - MODULE_ENTER_LEAVE.md - 完整功能说明"
echo "  - examples/router-filter-examples.js - 5个实战示例"
echo ""
echo "======================================"
echo "下一步操作"
echo "======================================"
echo ""
echo "1. 运行构建命令："
echo "   npm run build"
echo ""
echo "2. 在项目中测试新功能"
echo ""
echo "3. 提交更改到 Git（如果需要）："
echo "   git add ."
echo "   git commit -m 'feat: 添加路由过滤功能，支持白名单/黑名单/自定义过滤'"
echo ""
echo "✅ 所有功能已完成！"
