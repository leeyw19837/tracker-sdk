/**
 * Tracker SDK 完整使用示例
 * 该示例展示了如何集成所有插件并调用核心 API
 */

import { initTracker, getTracker } from '../src/index.js';
import performancePlugin from '../src/plugins/performance.js';
import errorPlugin from '../src/plugins/error.js';
import routerPlugin from '../src/plugins/router.js';
import autoTrackPlugin from '../src/plugins/autoTracker.js';

// 1. 初始化 SDK
const tracker = initTracker({
    endPoint: 'https://api.example.com/collect', // 替换为你的上报地址
    appId: 'demo-app-001',
    delay: 2000,          // 批量上报延迟：2秒
    maxBatchSize: 5       // 累计5条数据立即上报
});

// 2. 加载增强插件
tracker.use(performancePlugin); // 性能监控
tracker.use(errorPlugin);       // 错误监控
tracker.use(routerPlugin);      // 路由自动追踪
tracker.use(autoTrackPlugin);   // 声明式自动打点 (data-track)

// 3. 用户上下文设置
// 模拟登录后设置用户ID
setTimeout(() => {
    tracker.setUser('user_9527');
    tracker.setExt({
        platform: 'Web',
        version: '1.2.0',
        environment: 'production'
    });
    console.log('[Demo] User context updated');
}, 1000);

// 4. 手动追踪：模块进入与离开（时长统计）
function simulatePageFlow() {
    console.log('[Demo] Entering Dashboard...');
    tracker.enter({
        system: 'demo-system',
        module: 'dashboard',
        sub_module: 'data_overview'
    });

    setTimeout(() => {
        console.log('[Demo] Switching to Settings...');
        // 再次调用 enter 会自动触发上一个模块的 leave 和当前模块的 enter
        tracker.enter({
            system: 'demo-system',
            module: 'settings',
            sub_module: 'profile'
        });
    }, 5000); // 模拟在仪表盘呆了5秒
}

// 5. 手动追踪：自定义业务事件
function trackCustomEvent() {
    tracker.track('order_confirm', {
        order_id: 'SN_123456',
        price: 99.8,
        currency: 'CNY'
    });
    console.log('[Demo] Custom event "order_confirm" tracked');
}

// 6. 模拟错误捕获测试
function simulateErrors() {
    // 模拟 JS 运行时错误
    // setTimeout(() => {
    //     throw new Error("Demo Runtime Error");
    // }, 2000);

    // 模拟 Promise 拒绝
    setTimeout(() => {
        Promise.reject("Demo Promise Rejection");
    }, 3000);
}

// 7. 演示 getTracker 导出
function checkInstance() {
    const instance = getTracker();
    console.log('[Demo] Current Device ID:', instance.deviceId);
    console.log('[Demo] Current Session ID:', instance.sessionId);
}

// --- 执行演示逻辑 ---
simulatePageFlow();
trackCustomEvent();
simulateErrors();
checkInstance();

/**
 * HTML 配合自动打点 (autoTracker.js) 的示例：
 * 
 * <button 
 *    data-track="buy_now" 
 *    data-track-item-id="prod_001" 
 *    data-track-price="299">
 *    立即购买
 * </button>
 */
