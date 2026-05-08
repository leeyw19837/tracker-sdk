/**
 * 测试 module_enter 和 module_leave 事件
 */

import { initTracker } from '../src/index.js';

// 初始化 SDK（使用一个假的 endpoint 用于测试）
const tracker = initTracker({
    endPoint: 'https://test.example.com/collect',
    delay: 100, // 快速上报便于观察
    maxBatchSize: 1
});

console.log('[Test] Tracker initialized');

// 模拟进入第一个页面
console.log('\n[Test] Entering home page...');
tracker.enter({
    system: 'test-system',
    module: 'home',
    sub_module: 'main'
});

// 等待一段时间
setTimeout(() => {
    console.log('\n[Test] Switching to about page...');
    // 进入新页面，应该会自动触发 home 的 leave 和 about 的 enter
    tracker.enter({
        system: 'test-system',
        module: 'about',
        sub_module: 'info'
    });
    
    setTimeout(() => {
        console.log('\n[Test] Leaving about page manually...');
        tracker.leave();
        
        console.log('\n[Test] All tests completed!');
    }, 500);
}, 500);
