# 页面可见性切换修复 - 完整解决方案

## 问题描述

**原始问题**：页面最小化后，只有第一次会上报 `module_leave` 事件，后续再次最小化/恢复不会上报。

**根本原因**：
1. 第一次最小化时，调用 `leave(true)` 上报 `module_leave` 并清空 `tracker.current`
2. 页面恢复显示时，没有监听 `visibilityState === 'visible'` 事件
3. 第二次最小化时，因为 `tracker.current` 为 `null`，`leave()` 直接返回，不上报任何数据

## 解决方案

### 核心思路

实现**完整的生命周期管理**：
- **页面隐藏** → 上报 `module_leave` → 保存模块信息
- **页面显示** → 使用保存的信息重新 `enter` → 上报 `module_enter`

这样每次页面切换都会产生成对的 `module_leave` 和 `module_enter` 事件。

### 实现细节

#### 1. 添加模块信息缓存

```javascript
// 用于保存页面隐藏前的模块信息
let hiddenModule = null;
```

#### 2. 页面隐藏时保存模块信息

```javascript
const flushData = () => {
    // 保存当前模块信息，以便页面恢复时重新 enter
    if (this.current) {
        hiddenModule = { ...this.current };
        console.log('[Tracker SDK] Saved module info for restoration:', hiddenModule.module);
    }
    
    this.leave(true);
    this.queue.flush(true);
};
```

#### 3. 页面显示时恢复模块

```javascript
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        flushData();
    } else if (document.visibilityState === 'visible') {
        // 如果之前有保存的模块信息，重新 enter
        if (hiddenModule) {
            // 清除 enterTime，使用当前时间作为新的进入时间
            const { enterTime, ...moduleInfo } = hiddenModule;
            
            this.enter(moduleInfo);
            
            // 重置 hiddenModule
            hiddenModule = null;
        }
    }
});
```

## 执行流程

### 场景 1：首次进入页面

```
用户打开页面
  ↓
routerPlugin 调用 tracker.enter({ module: 'home' })
  ↓
上报 module_enter 事件
  ↓
tracker.current = { module: 'home', enterTime: 1234567890 }
```

### 场景 2：第一次最小化页面

```
用户切换到其他标签页
  ↓
visibilityState 变为 'hidden'
  ↓
保存模块信息: hiddenModule = { module: 'home', enterTime: 1234567890 }
  ↓
调用 leave(true)
  ↓
计算 duration = now() - enterTime
  ↓
上报 module_leave 事件（duration: 5000ms）
  ↓
tracker.current = null
  ↓
强制刷新队列，发送所有数据
```

### 场景 3：第一次恢复页面显示

```
用户切回当前标签页
  ↓
visibilityState 变为 'visible'
  ↓
检测到 hiddenModule 存在
  ↓
清除 enterTime: moduleInfo = { module: 'home' }
  ↓
调用 enter(moduleInfo)
  ↓
设置新的 enterTime: tracker.current = { module: 'home', enterTime: 1234567900 }
  ↓
上报 module_enter 事件
  ↓
重置 hiddenModule = null
```

### 场景 4：第二次最小化页面

```
用户再次切换到其他标签页
  ↓
visibilityState 变为 'hidden'
  ↓
保存模块信息: hiddenModule = { module: 'home', enterTime: 1234567900 }
  ↓
调用 leave(true)
  ↓
计算 duration = now() - enterTime（这次是上次恢复后的时间）
  ↓
上报 module_leave 事件（duration: 3000ms）
  ↓
tracker.current = null
  ↓
强制刷新队列，发送所有数据
```

### 场景 5：第二次恢复页面显示

```
用户再次切回当前标签页
  ↓
visibilityState 变为 'visible'
  ↓
检测到 hiddenModule 存在
  ↓
清除 enterTime 并重新 enter
  ↓
上报 module_enter 事件
  ↓
...循环往复...
```

## 预期日志输出

### 第一次最小化

```
[Tracker SDK] Visibility changed: hidden
[Tracker SDK] Page is now hidden, triggering flush...
[Tracker SDK] Lifecycle: Page hidden/unloading, flushing data...
[Tracker SDK] Current module: { module: 'home', system: 'test-system', enterTime: 1234567890 }
[Tracker SDK] Queue length: 1
[Tracker SDK] Saved module info for restoration: home
[Tracker SDK] Leaving module: { module: 'home', system: 'test-system', duration: 5000, force: true }
[Tracker SDK] Pushing module_leave event to queue
[Tracker SDK] Flushing queue, items: 2, isFlush: true
[Tracker SDK] Sending event 1/2: module_enter
[Tracker SDK] Using sendBeacon for transport
[Tracker SDK] sendBeacon result: true
[Tracker SDK] Sending event 2/2: module_leave
[Tracker SDK] Using sendBeacon for transport
[Tracker SDK] sendBeacon result: true
[Tracker SDK] All events sent successfully
[Tracker SDK] Data flushed successfully
```

### 第一次恢复显示

```
[Tracker SDK] Visibility changed: visible
[Tracker SDK] Page is now visible
[Tracker SDK] Restoring module: home
[Tracker SDK] Entering module: { module: 'home', system: 'test-system' }
[Tracker SDK] Pushing module_enter event to queue
[Tracker SDK] Module restored successfully
```

### 第二次最小化

```
[Tracker SDK] Visibility changed: hidden
[Tracker SDK] Page is now hidden, triggering flush...
[Tracker SDK] Lifecycle: Page hidden/unloading, flushing data...
[Tracker SDK] Current module: { module: 'home', system: 'test-system', enterTime: 1234567900 }
[Tracker SDK] Queue length: 1
[Tracker SDK] Saved module info for restoration: home
[Tracker SDK] Leaving module: { module: 'home', system: 'test-system', duration: 3000, force: true }
[Tracker SDK] Pushing module_leave event to queue
[Tracker SDK] Flushing queue, items: 2, isFlush: true
[Tracker SDK] Sending event 1/2: module_enter
[Tracker SDK] Using sendBeacon for transport
[Tracker SDK] sendBeacon result: true
[Tracker SDK] Sending event 2/2: module_leave
[Tracker SDK] Using sendBeacon for transport
[Tracker SDK] sendBeacon result: true
[Tracker SDK] All events sent successfully
[Tracker SDK] Data flushed successfully
```

## 关键改进点

### 1. 完整的状态管理

- ✅ 页面隐藏时保存状态
- ✅ 页面显示时恢复状态
- ✅ 每次切换都产生成对的事件

### 2. 准确的时间计算

- ✅ 每次 `enter` 都会设置新的 `enterTime`
- ✅ `leave` 计算的 duration 是基于上一次 `enter` 的时间
- ✅ 能够准确记录用户在页面上的实际停留时间

### 3. 防止状态丢失

- ✅ 使用局部变量 `hiddenModule` 保存状态
- ✅ 恢复后立即重置，避免重复恢复
- ✅ 即使多次切换也能正确追踪

## 测试方法

### 快速测试

```bash
node examples/test-visibility-change.js
```

然后在浏览器中：
1. 切换到其他标签页（观察日志）
2. 切回当前标签页（观察日志）
3. 再次切换到其他标签页（观察日志）
4. 再次切回当前标签页（观察日志）

### 验证要点

- [ ] 每次最小化都看到 "Saved module info for restoration"
- [ ] 每次最小化都看到 "Leaving module" 和 "module_leave" 事件
- [ ] 每次恢复都看到 "Restoring module" 和 "module_enter" 事件
- [ ] 每次恢复后，再次最小化仍能正常上报
- [ ] Network 面板中看到对应的请求

## 边界情况处理

### 情况 1：页面关闭（不是最小化）

```
用户关闭浏览器标签
  ↓
触发 beforeunload 事件
  ↓
调用 flushData()
  ↓
保存 hiddenModule（但不会恢复）
  ↓
上报 module_leave
  ↓
页面关闭，hiddenModule 被销毁
```

✅ **正确处理**：只上报离开，不再上报进入

### 情况 2：路由切换 + 页面最小化

```
用户在页面 A
  ↓
切换到页面 B（路由变化）
  ↓
routerPlugin 自动调用 leave(A) 和 enter(B)
  ↓
用户最小化页面
  ↓
保存页面 B 的信息
  ↓
上报 B 的 module_leave
  ↓
用户恢复页面
  ↓
重新 enter B
  ↓
上报 B 的 module_enter
```

✅ **正确处理**：与路由插件协同工作

### 情况 3：快速多次切换

```
最小化 → 恢复 → 最小化 → 恢复（快速操作）
  ↓
每次都有对应的 save/restore
  ↓
每次都产生成对的事件
  ↓
duration 可能很短（几百毫秒）
```

✅ **正确处理**：如实记录每次停留时间

### 情况 4：没有模块时最小化

```
用户打开页面但未调用 enter()
  ↓
直接最小化
  ↓
hiddenModule = null（因为没有 current）
  ↓
leave() 直接返回（没有 current）
  ↓
恢复时检测到 hiddenModule 为 null，不执行 restore
```

✅ **正确处理**：不会产生错误

## 性能考虑

### 内存占用

- `hiddenModule` 只保存一个简单的对象引用
- 恢复后立即释放（设置为 null）
- 内存占用可以忽略不计

### 计算开销

- 只在页面切换时执行（低频操作）
- 对象解构和复制非常快
- 对性能影响可以忽略

### 网络请求

- 每次切换都会产生 1-2 个请求
- 使用 `sendBeacon`，不会阻塞页面
- 建议后端做好去重和批量处理

## 数据分析建议

### 如何统计页面停留时间

```sql
-- 计算每个模块的平均停留时间
SELECT 
    module,
    AVG(duration) as avg_duration,
    COUNT(*) as visit_count
FROM events
WHERE event = 'module_leave'
GROUP BY module;
```

### 如何识别页面切换模式

```sql
-- 查找频繁的页面切换（可能是用户在犹豫）
SELECT 
    user_id,
    module,
    COUNT(*) as switch_count,
    AVG(duration) as avg_stay_time
FROM events
WHERE event IN ('module_enter', 'module_leave')
GROUP BY user_id, module
HAVING switch_count > 10
ORDER BY avg_stay_time ASC;
```

### 如何计算真实会话时长

```sql
-- 基于 module_leave 事件的 duration 总和
SELECT 
    session_id,
    SUM(duration) as total_active_time
FROM events
WHERE event = 'module_leave'
GROUP BY session_id;
```

## 注意事项

### 1. 不要与路由插件冲突

如果使用 `routerPlugin`，它也会调用 `enter()` 和 `leave()`。当前的实现已经考虑了这一点：
- 路由切换时会先 `leave` 再 `enter`
- 页面最小化时只会 `leave`，不会干扰路由状态
- 页面恢复时会重新 `enter` 当前路由

### 2. 生产环境日志

记得在生产环境中关闭调试日志：

```javascript
// 可以通过环境变量控制
if (process.env.NODE_ENV === 'development') {
    console.log('[Tracker SDK] ...');
}
```

### 3. 后端去重

由于每次页面切换都会上报，后端可能需要：
- 对同一用户的连续 `module_enter` 进行去重
- 对异常的 duration 值进行过滤（如负数或过大值）
- 聚合短时间内的多次切换

## 总结

通过这次修复，我们实现了：

✅ **完整的生命周期追踪** - 页面隐藏和显示都能正确上报  
✅ **准确的时长统计** - 每次停留时间都被精确记录  
✅ **可靠的状态管理** - 多次切换也不会丢失状态  
✅ **良好的兼容性** - 与路由插件和其他功能协同工作  

现在，无论用户如何切换页面，SDK 都能准确追踪他们的行为轨迹！🎉
