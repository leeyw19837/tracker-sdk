# 页面最小化上报问题诊断指南

## 问题描述

用户反馈：页面最小化（切换到其他标签页）时，没有触发数据上报。

## 已添加的调试日志

为了诊断问题，我在以下位置添加了详细的控制台日志：

### 1. 生命周期监听 (`tracker.js`)

```javascript
// visibilitychange 事件触发时
console.log('[Tracker SDK] Visibility changed:', document.visibilityState);
console.log('[Tracker SDK] Page is now hidden, triggering flush...');

// flushData 执行时
console.log('[Tracker SDK] Lifecycle: Page hidden/unloading, flushing data...');
console.log('[Tracker SDK] Current module:', this.current);
console.log('[Tracker SDK] Queue length:', this.queue.list.length);
console.log('[Tracker SDK] Data flushed successfully');
```

### 2. leave() 方法 (`tracker.js`)

```javascript
// 如果没有当前模块
console.log('[Tracker SDK] Leave called but no current module');

// 离开模块时
console.log('[Tracker SDK] Leaving module:', {
    module: this.current.module,
    system: this.current.system,
    duration,
    force
});

// 推送事件到队列
console.log('[Tracker SDK] Pushing module_leave event to queue:', event);
```

### 3. 队列刷新 (`queue.js`)

```javascript
// 队列为空时
console.log('[Tracker SDK] Queue flush called but queue is empty');

// 开始刷新
console.log('[Tracker SDK] Flushing queue, items:', this.list.length, 'isFlush:', isFlush);

// 发送每个事件
console.log(`[Tracker SDK] Sending event ${index + 1}/${dataToSend.length}:`, item.event);
console.log('[Tracker SDK] All events sent successfully');
```

### 4. 数据传输 (`transport.js`)

```javascript
// 发送数据时
console.log('[Tracker SDK] Sending data:', {
    url,
    event: data.event,
    module: data.module,
    useBeacon,
    hasToken: !!token
});

// 使用 sendBeacon
console.log('[Tracker SDK] Using sendBeacon for transport');
console.log('[Tracker SDK] sendBeacon result:', result);
```

## 测试步骤

### 方法 1：使用测试文件

```bash
node examples/test-visibility-change.js
```

然后在浏览器中打开该文件，按照提示操作。

### 方法 2：在实际项目中测试

1. 在你的 Vue/React 项目中引入 SDK
2. 打开浏览器开发者工具的控制台
3. 进入任意页面（触发 `module_enter`）
4. 切换到其他标签页或最小化浏览器
5. 观察控制台输出

## 预期日志输出

如果一切正常，你应该看到类似以下的日志：

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
[Tracker SDK] Sending data: { url: '...', event: 'module_enter', ... }
[Tracker SDK] Using sendBeacon for transport
[Tracker SDK] sendBeacon result: true
[Tracker SDK] Sending event 2/2: module_leave
[Tracker SDK] Sending data: { url: '...', event: 'module_leave', ... }
[Tracker SDK] Using sendBeacon for transport
[Tracker SDK] sendBeacon result: true
[Tracker SDK] All events sent successfully
[Tracker SDK] Data flushed successfully
```

## 可能的问题和解决方案

### 问题 1：没有看到 "Visibility changed" 日志

**原因**：`visibilitychange` 事件没有被触发

**检查**：
- 确认浏览器支持 `visibilitychange` 事件（所有现代浏览器都支持）
- 确认你真的切换了标签页或最小化了窗口，而不是关闭了窗口

**解决**：
- 尝试手动触发事件测试：
  ```javascript
  document.dispatchEvent(new Event('visibilitychange'));
  ```

### 问题 2：看到 "Leave called but no current module"

**原因**：调用 `leave()` 时 `tracker.current` 为空

**可能原因**：
1. 还没有调用 `enter()` 就最小化了页面
2. `enter()` 调用失败或被覆盖
3. 之前的 `leave()` 已经清空了 `current`

**解决**：
- 确保在最小化之前调用了 `tracker.enter()`
- 检查是否有其他地方调用了 `tracker.leave()`

### 问题 3：看到 "Queue flush called but queue is empty"

**原因**：队列中没有待发送的数据

**可能原因**：
1. `module_enter` 事件已经被自动发送（达到了 `maxBatchSize` 或 `delay` 时间）
2. `leave()` 没有成功生成 `module_leave` 事件

**解决**：
- 增加 `delay` 时间，例如设置为 5000ms
- 减少 `maxBatchSize`，例如设置为 10

### 问题 4：sendBeacon 返回 false

**原因**：`sendBeacon` 调用失败

**可能原因**：
1. 数据太大（超过 64KB）
2. 浏览器不支持
3. URL 格式错误

**解决**：
- 检查数据大小
- 确认浏览器支持 `navigator.sendBeacon`
- 检查 URL 是否正确

### 问题 5：看到所有日志但服务器没有收到数据

**原因**：网络请求失败

**可能原因**：
1. CORS 问题
2. 服务器地址错误
3. Token 认证失败
4. 后端不支持 URL 参数传递 Token

**解决**：
- 检查 Network 面板中的请求状态
- 确认后端支持通过 URL 参数接收 Token
- 检查 CORS 配置

## 常见问题排查清单

- [ ] 浏览器控制台是否打开了？
- [ ] 是否看到了 `[Tracker SDK] Visibility changed: hidden` 日志？
- [ ] 是否看到了 `[Tracker SDK] Current module: {...}` 且不为 null？
- [ ] 是否看到了 `[Tracker SDK] Queue length:` 且大于 0？
- [ ] 是否看到了 `[Tracker SDK] Flushing queue, items: X`？
- [ ] 是否看到了 `[Tracker SDK] Using sendBeacon for transport`？
- [ ] 是否看到了 `[Tracker SDK] sendBeacon result: true`？
- [ ] Network 面板中是否有请求发出？
- [ ] 请求的状态码是多少？（200 表示成功）

## 调试技巧

### 1. 手动触发 visibilitychange

在控制台中运行：

```javascript
// 模拟页面隐藏
Object.defineProperty(document, 'visibilityState', {
    value: 'hidden',
    configurable: true
});
document.dispatchEvent(new Event('visibilitychange'));
```

### 2. 检查 tracker 状态

```javascript
const tracker = getTracker();
console.log('Current module:', tracker.current);
console.log('Queue length:', tracker.queue.list.length);
console.log('Device ID:', tracker.deviceId);
console.log('Session ID:', tracker.sessionId);
```

### 3. 检查队列内容

```javascript
const tracker = getTracker();
console.log('Queue items:', tracker.queue.list);
```

### 4. 强制刷新队列

```javascript
const tracker = getTracker();
tracker.queue.flush(true);
```

## 已知限制

1. **sendBeacon 的限制**：
   - 最大数据大小：通常为 64KB
   - 不支持自定义 Headers（Token 通过 URL 参数传递）
   - 不返回详细的错误信息

2. **浏览器兼容性**：
   - `visibilitychange`：所有现代浏览器都支持
   - `sendBeacon`：IE 不支持，但所有现代浏览器都支持

3. **页面关闭 vs 页面隐藏**：
   - 页面关闭：触发 `beforeunload` 和 `visibilitychange`
   - 页面隐藏（最小化/切换标签）：只触发 `visibilitychange`

## 下一步

如果按照以上步骤仍然无法解决问题，请：

1. 复制完整的控制台日志
2. 复制 Network 面板中的请求信息
3. 提供浏览器版本信息
4. 提供 SDK 版本信息

然后联系技术支持团队。
