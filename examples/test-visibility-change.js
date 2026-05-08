/**
 * 测试页面最小化/恢复时的数据上报
 */

import { initTracker } from '../src/index.js';

console.log('\n========================================');
console.log('测试页面最小化/恢复时的数据上报');
console.log('========================================\n');

// 初始化 SDK
const tracker = initTracker({
    endPoint: 'https://test.example.com/collect',
    delay: 5000, // 设置较长的延迟，便于观察
    maxBatchSize: 10
});

console.log('✅ Tracker 已初始化');
console.log('📝 配置：delay=5000ms, maxBatchSize=10\n');

// 进入一个模块
console.log('📍 步骤 1: 进入首页模块...');
tracker.enter({
    system: 'test-system',
    module: 'home',
    sub_module: 'main'
});

console.log('✅ module_enter 事件已推入队列\n');

// 等待 2 秒后提示用户测试
setTimeout(() => {
    console.log('\n========================================');
    console.log('📍 步骤 2: 请进行以下操作测试');
    console.log('========================================\n');
    
    console.log('测试场景：');
    console.log('1️⃣  第一次最小化页面（切换到其他标签页）');
    console.log('    预期：上报 module_leave 事件\n');
    
    console.log('2️⃣  恢复页面显示（切回当前标签页）');
    console.log('    预期：自动上报 module_enter 事件\n');
    
    console.log('3️⃣  第二次最小化页面');
    console.log('    预期：再次上报 module_leave 事件\n');
    
    console.log('4️⃣  再次恢复页面显示');
    console.log('    预期：再次上报 module_enter 事件\n');
    
    console.log('💡 请观察控制台输出，确认每次切换都有日志！\n');
}, 2000);

// 60 秒后自动离开
setTimeout(() => {
    console.log('\n⏰ 测试超时，手动离开模块...');
    tracker.leave();
}, 60000);
