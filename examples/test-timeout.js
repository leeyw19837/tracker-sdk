/**
 * 超时自动离开功能测试示例
 * 
 * 测试场景：
 * 1. 用户进入页面后，如果30分钟（可配置）没有任何操作，自动上报 module_leave
 * 2. Session 被重置，生成新的 sessionId
 * 3. 当用户再次操作时，自动上报 module_enter，重新开始计时
 */

import { initTracker } from '../src/index.js';

// 初始化 SDK，设置超时时间为 5 秒（方便测试，实际使用建议 30 分钟）
const tracker = initTracker({
    endPoint: 'https://api.example.com/collect',
    appId: 'timeout-test-001',
    delay: 1000,
    maxBatchSize: 10,
    sessionTimeout: 5 * 1000 // 5秒超时，方便测试
});

console.log('[Timeout Test] Initial Session ID:', tracker.sessionId);
console.log('[Timeout Test] Session Timeout:', tracker.options.sessionTimeout, 'ms');

// 模拟用户进入页面
tracker.enter({
    system: 'test-system',
    module: 'home_page',
    sub_module: 'main_content'
});

console.log('[Timeout Test] User entered home_page');

// 模拟用户在页面上进行操作
let activityCount = 0;

function simulateUserActivity() {
    activityCount++;
    console.log(`[Timeout Test] User activity #${activityCount} at ${new Date().toLocaleTimeString()}`);
    
    // 触发鼠标移动事件（会更新 lastActiveTime）
    const event = new Event('mousemove');
    document.dispatchEvent(event);
}

// 在前 3 秒内，每隔 1 秒模拟一次用户活动
const activityInterval = setInterval(() => {
    if (activityCount < 3) {
        simulateUserActivity();
    } else {
        clearInterval(activityInterval);
        console.log('[Timeout Test] Stopped simulating user activity');
        console.log('[Timeout Test] Wait for timeout...');
    }
}, 1000);

// 监听超时后的重新进入
const originalEnter = tracker.enter.bind(tracker);
tracker.enter = function(module) {
    console.log('[Timeout Test] >>> ENTER called:', module.module);
    return originalEnter(module);
};

const originalLeave = tracker.leave.bind(tracker);
tracker.leave = function(force) {
    console.log('[Timeout Test] >>> LEAVE called, force:', force);
    return originalLeave(force);
};

// 定期检查状态
setInterval(() => {
    console.log('[Timeout Test] --- Status Check ---');
    console.log('[Timeout Test] Current Module:', tracker.current ? tracker.current.module : 'none');
    console.log('[Timeout Test] Session ID:', tracker.sessionId);
    console.log('[Timeout Test] Last Active Time:', new Date(tracker.lastActiveTime).toLocaleTimeString());
    console.log('[Timeout Test] Time Since Last Active:', ((Date.now() - tracker.lastActiveTime) / 1000).toFixed(1), 's');
    console.log('');
}, 2000);

/**
 * 测试步骤说明：
 * 
 * 1. 脚本启动后，用户"进入" home_page 模块
 * 2. 前 3 秒内，每秒模拟一次用户活动（鼠标移动）
 * 3. 3 秒后停止模拟活动
 * 4. 等待约 5 秒（sessionTimeout），超时检测器会发现用户不活跃
 * 5. 自动触发 leave(true)，上报 module_leave 事件
 * 6. Session 被重置，生成新的 sessionId
 * 7. 此时如果再触发用户活动（如手动在控制台调用 simulateUserActivity()）
 * 8. 会自动触发 enter，上报 module_enter 事件，使用新的 sessionId
 * 
 * 预期输出：
 * - 初始进入时：module_enter 事件
 * - 5秒无活动后：module_leave 事件 + Session 重置
 * - 再次活动时：module_enter 事件（新的 Session）
 */

console.log('\n[Timeout Test] ========================================');
console.log('[Timeout Test] Test started. Watch the console output.');
console.log('[Timeout Test] After 5 seconds of inactivity, you should see:');
console.log('[Timeout Test]   1. Auto leave triggered');
console.log('[Timeout Test]   2. Session reset with new sessionId');
console.log('[Timeout Test]   3. On next activity, auto re-enter');
console.log('[Timeout Test] ========================================\n');
