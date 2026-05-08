/**
 * Router Plugin 路由过滤功能使用示例
 * 展示如何配置只监听指定的路由
 */

import { initTracker, routerPlugin } from '../src/index.js';

const tracker = initTracker({
    endPoint: 'https://api.example.com/collect',
    delay: 1000,
    maxBatchSize: 5
});

// ============================================
// 示例 1: 使用白名单 - 只监听特定路由
// ============================================
console.log('\n=== 示例 1: 白名单模式 ===');

tracker.use(routerPlugin, {
    system: 'my-app',
    // 只监听这些路由，其他路由不会被追踪
    include: [
        '/dashboard',           // 完全匹配 /dashboard
        '/settings',            // 完全匹配 /settings
        '/user/*',              // 前缀匹配所有 /user/ 开头的路径
        /^\/product\/\d+$/     // 正则匹配 /product/数字 的路径
    ]
});

// 以上配置的效果：
// ✅ /dashboard - 会被追踪
// ✅ /settings?tab=profile - 会被追踪（包含查询参数）
// ✅ /user/profile - 会被追踪（匹配 /user/*）
// ✅ /user/settings - 会被追踪（匹配 /user/*）
// ✅ /product/123 - 会被追踪（匹配正则）
// ❌ /about - 不会被追踪
// ❌ /help - 不会被追踪
// ❌ /admin/panel - 不会被追踪


// ============================================
// 示例 2: 使用黑名单 - 排除特定路由
// ============================================
console.log('\n=== 示例 2: 黑名单模式 ===');

// 注意：实际使用时只能选择一个配置，这里只是演示
/*
tracker.use(routerPlugin, {
    system: 'my-app',
    // 排除这些路由，其他路由都会被追踪
    exclude: [
        '/login',               // 不追踪登录页
        '/register',            // 不追踪注册页
        '/admin/*',             // 不追踪所有 admin 路径
        /^\/test\//            // 不追踪所有 /test/ 开头的路径
    ]
});

// 以上配置的效果：
// ❌ /login - 不会被追踪
// ❌ /register - 不会被追踪
// ❌ /admin/dashboard - 不会被追踪
// ❌ /test/page - 不会被追踪
// ✅ /dashboard - 会被追踪
// ✅ /user/profile - 会被追踪
*/


// ============================================
// 示例 3: 使用自定义过滤函数 - 最灵活的方式
// ============================================
console.log('\n=== 示例 3: 自定义过滤函数 ===');

// 注意：实际使用时只能选择一个配置，这里只是演示
/*
tracker.use(routerPlugin, {
    system: 'my-app',
    // 自定义过滤逻辑
    filter: (path) => {
        // 示例 1: 只追踪包含特定关键字的路径
        return path.includes('dashboard') || path.includes('user');
        
        // 示例 2: 排除测试环境的路由
        // return !path.startsWith('/test-');
        
        // 示例 3: 基于复杂逻辑判断
        // const publicRoutes = ['/login', '/register', '/about'];
        // return !publicRoutes.includes(path);
    }
});
*/


// ============================================
// 示例 4: 结合 moduleMapper 使用
// ============================================
console.log('\n=== 示例 4: 白名单 + 模块映射 ===');

// 注意：实际使用时只能选择一个配置，这里只是演示
/*
tracker.use(routerPlugin, {
    system: 'ecommerce',
    // 只追踪关键业务路由
    include: [
        '/product/*',
        '/cart/*',
        '/checkout/*'
    ],
    // 将路径映射为更易读的模块名
    moduleMapper: (path) => {
        if (path.startsWith('/product/')) {
            return '商品详情页';
        }
        if (path.startsWith('/cart/')) {
            return '购物车';
        }
        if (path.startsWith('/checkout/')) {
            return '结算页面';
        }
        return path;
    }
});
*/


// ============================================
// 示例 5: 实际应用场景 - 电商网站
// ============================================
console.log('\n=== 示例 5: 电商网站实战配置 ===');

// 注意：实际使用时只能选择一个配置，这里只是演示
/*
tracker.use(routerPlugin, {
    system: 'ecommerce-platform',
    
    // 策略：排除不需要追踪的路由，其他都追踪
    exclude: [
        '/login',
        '/register',
        '/forgot-password',
        '/static/*',           // 静态资源页面
        /^\/dev-/,            // 开发调试页面
    ],
    
    // 为不同业务模块设置友好的名称
    moduleMapper: (path) => {
        const pathMap = {
            '/': '首页',
            '/products': '商品列表',
            '/cart': '购物车',
            '/checkout': '结算',
            '/order': '订单中心',
            '/user/profile': '个人中心',
            '/user/orders': '我的订单'
        };
        
        // 精确匹配
        if (pathMap[path]) {
            return pathMap[path];
        }
        
        // 动态路径处理
        if (path.startsWith('/product/')) {
            return '商品详情';
        }
        if (path.startsWith('/category/')) {
            return '商品分类';
        }
        
        return path;
    }
});
*/


console.log('\n💡 提示：请根据实际需求选择合适的过滤策略');
console.log('- 白名单 (include): 适合只需要追踪少数几个页面的场景');
console.log('- 黑名单 (exclude): 适合大部分页面都需要追踪，只需排除少数页面的场景');
console.log('- 自定义函数 (filter): 适合需要复杂判断逻辑的场景');
console.log('\n⚠️  注意：include、exclude、filter 三个选项优先级为：filter > include > exclude');
console.log('   如果同时配置了多个，只有优先级最高的会生效');
