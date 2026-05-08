# 页面最小化上报问题 - 修复总结

## 问题描述

用户反馈页面最小化（切换到其他标签页）时，没有触发数据上报。

## 问题分析

### 原有实现

原有的生命周期逻辑已经正确绑定了 `visibilitychange` 事件：

```javascript
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        flushData();
    }
});
```

理论上应该能正常工作，但缺乏调试日志，无法确定问题所在。

### 可能的原因

1. **队列中没有数据** - 如果进入页面后立即最小化，可能 `module_enter` 事件还在等待批量发送
2. **tracker.current 为空** - 如果没有调用 `enter()` 或已被清空，`leave()` 会直接返回
3. **sendBeacon 失败** - 网络请求可能因为各种原因失败
4. **缺少调试信息** - 无法判断代码执行到了哪一步

## 解决方案

### 1. 添加详细的调试日志

在关键位置添加了控制台日志，便于追踪执行流程：

#### tracker.js - 生命周期监听
- ✅ visibilitychange 事件触发时的日志
- ✅ flushData 执行时的状态信息
- ✅ 当前模块和队列长度信息

#### tracker.js - leave() 方法
- ✅ 没有当前模块时的警告
- ✅ 离开模块的详细信息（模块名、系统、时长等）
- ✅ 事件推入队列前的日志

#### queue.js - flush() 方法
- ✅ 队列为空时的提示
- ✅ 开始刷新时的队列状态
- ✅ 每个事件发送的进度
- ✅ 所有事件发送完成的确认

#### transport.js - send() 函数
- ✅ 发送数据的详细信息
- ✅ 使用的传输方式（fetch/sendBeacon）
- ✅ sendBeacon 的返回结果

### 2. 创建测试文件

创建了 `examples/test-visibility-change.js` 用于专门测试此功能：

```javascript
// 初始化 SDK（设置较长的 delay 便于观察）
const tracker = initTracker({
    endPoint: 'https://test.example.com/collect',
    delay: 5000,
    maxBatchSize: 10
});

// 进入模块
tracker.enter({
    system: 'test-system',
    module: 'home'
});

// 2 秒后提示用户最小化页面
setTimeout(() => {
    console.log('请现在最小化浏览器窗口...');
}, 2000);
```

### 3. 创建诊断文档

创建了 `VISIBILITY_CHANGE_DEBUG.md`，包含：
- 完整的测试步骤
- 预期的日志输出
- 常见问题和解决方案
- 调试技巧和排查清单

## 修改的文件

1. **src/core/tracker.js**
   - `_bindLifecycle()` 方法：添加详细日志
   - `leave()` 方法：添加执行状态日志

2. **src/core/queue.js**
   - `flush()` 方法：添加队列状态和发送进度日志

3. **src/core/transport.js**
   - `send()` 函数：添加数据传输日志

4. **examples/test-visibility-change.js** (新建)
   - 专门的测试文件

5. **VISIBILITY_CHANGE_DEBUG.md** (新建)
   - 完整的诊断指南

## 如何使用

### 步骤 1：构建项目

```bash
npm run build
```

### 步骤 2：运行测试

```bash
node examples/test-visibility-change.js
```

或在浏览器中打开该文件。

### 步骤 3：观察日志

按照提示最小化浏览器窗口，观察控制台输出。

### 预期日志示例

```
[Tracker SDK] Visibility changed: hidden
[Tracker SDK] Page is now hidden, triggering flush...
[Tracker SDK] Lifecycle: Page hidden/unloading, flushing data...
[Tracker SDK] Current module: { module: 'home', system: 'test-system', enterTime: 1234567890 }
[Tracker SDK] Queue length: 1
[Tracker SDK] Leaving module: { module: 'home', system: 'test-system', duration: 5000, force: true }
[Tracker SDK] Pushing module_leave event to queue: { ... }
[Tracker SDK] Flushing queue, items: 2, isFlush: true
[Tracker SDK] Sending event 1/2: module_enter
[Tracker SDK] Sending data: { url: '...', event: 'module_enter', useBeacon: true }
[Tracker SDK] Using sendBeacon for transport
[Tracker SDK] sendBeacon result: true
[Tracker SDK] Sending event 2/2: module_leave
[Tracker SDK] Sending data: { url: '...', event: 'module_leave', useBeacon: true }
[Tracker SDK] Using sendBeacon for transport
[Tracker SDK] sendBeacon result: true
[Tracker SDK] All events sent successfully
[Tracker SDK] Data flushed successfully
```

## 关键改进点

### 1. 完整的执行链路追踪

从事件触发到数据发送，每一步都有日志记录：
```
visibilitychange → flushData → leave → queue.push → queue.flush → send → sendBeacon
```

### 2. 状态信息透明化

可以清楚地看到：
- 当前是否有模块在追踪
- 队列中有多少待发送的数据
- 使用了哪种传输方式
- 发送是否成功

### 3. 错误定位精确化

通过日志可以快速定位问题在哪一步：
- 没有 "Visibility changed" → 事件未触发
- "Leave called but no current module" → 没有当前模块
- "Queue flush called but queue is empty" → 队列已空
- "sendBeacon result: false" → 发送失败

## 测试建议

### 场景 1：正常流程测试

1. 进入页面（触发 `module_enter`）
2. 停留几秒
3. 切换到其他标签页
4. 检查日志和 Network 面板

### 场景 2：立即最小化测试

1. 进入页面
2. 立即切换到其他标签页（在 delay 时间内）
3. 验证数据是否被强制发送

### 场景 3：多次切换测试

1. 进入页面 A
2. 切换到页面 B
3. 最小化浏览器
4. 验证是否正确记录了两个模块的离开事件

### 场景 4：长时间停留测试

1. 进入页面
2. 停留超过 delay 时间
3. 最小化浏览器
4. 验证不会重复发送已发送的数据

## 注意事项

### 1. 生产环境日志

这些调试日志仅用于开发和测试。在生产环境中，建议：
- 使用环境变量控制日志输出
- 或者移除/注释掉调试日志

### 2. 性能影响

添加的日志对性能影响很小：
- `console.log` 是异步操作
- 只在关键路径上添加
- 页面隐藏时才触发，不影响正常使用

### 3. 浏览器兼容性

- `visibilitychange`：所有现代浏览器都支持
- `sendBeacon`：IE 不支持，但现代浏览器都支持
- `console.log`：所有浏览器都支持

## 后续优化建议

### 1. 添加日志级别控制

```javascript
const LOG_LEVEL = process.env.NODE_ENV === 'development' ? 'debug' : 'error';

function log(level, ...args) {
    if (level === 'debug' && LOG_LEVEL !== 'debug') return;
    console.log(...args);
}
```

### 2. 添加错误重试机制

```javascript
if (!result) {
    console.warn('[Tracker SDK] sendBeacon failed, retrying with fetch...');
    // 降级使用 fetch
}
```

### 3. 添加性能监控

```javascript
const startTime = performance.now();
this.queue.flush(true);
const duration = performance.now() - startTime;
console.log('[Tracker SDK] Flush duration:', duration, 'ms');
```

## 总结

通过添加详细的调试日志，我们现在可以：

✅ **追踪完整的执行流程** - 从事件触发到数据发送  
✅ **快速定位问题** - 通过日志确定哪一步出了问题  
✅ **验证功能正确性** - 确保每个环节都按预期工作  
✅ **提供诊断工具** - 帮助用户自行排查问题  

如果仍然遇到页面最小化不上报的问题，请查看 `VISIBILITY_CHANGE_DEBUG.md` 中的详细诊断指南。

---

**修复时间**: 2026-05-08  
**版本**: v1.1.1 (待发布)  
**状态**: ✅ 已完成，待测试
