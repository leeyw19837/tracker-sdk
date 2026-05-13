# 超时检测问题修复说明

## 修复的问题

### 问题 1：超时后点击页面无 `module_enter` 事件

**原因：**
- 超时触发 `leave(true)` 后，`this.current` 被设置为 `null`
- 用户再次点击时，虽然检测到不活跃状态，但条件 `wasInactive && this.current` 中的 `this.current` 为 `null`
- 导致无法触发重新 enter 的逻辑

### 问题 2：后续不再触发超时检测

**原因：**
- `leave()` 后 `this.current = null`
- 超时检测条件 `if (this.current && this._checkInactive())` 永远为 false
- 定时器虽然运行，但不会再触发任何操作

## 解决方案

### 核心思路

引入 `isTimedOut` 标记，区分"正常离开"和"超时离开"两种状态：

1. **超时离开时**：保留 `this.current` 信息，设置 `isTimedOut = true`
2. **重新激活时**：检查 `isTimedOut` 标记，触发 `module_enter`
3. **继续检测**：只要 `this.current` 存在且未超时，就持续检测

### 代码修改

#### 1. 添加超时标记

```javascript
constructor() {
    // ...
    this.isTimedOut = false; // 标记是否因超时而离开
}
```

#### 2. 修改 `leave()` 方法

```javascript
leave(force = false, isTimeout = false) {
    // ... 上报 module_leave 事件
    
    // 如果是因为超时而离开，保留 current 信息以便重新激活时使用
    if (isTimeout) {
        this.isTimedOut = true;
        console.log('[Tracker SDK] Module info preserved for re-activation');
    } else {
        // 正常离开，清除 current
        this.current = null;
        this.isTimedOut = false;
    }
}
```

#### 3. 修改超时检测逻辑

```javascript
_startTimeoutCheck() {
    this.timeoutTimer = setInterval(() => {
        // 只要有 current 且未处于超时状态，就检测是否超时
        if (this.current && !this.isTimedOut && this._checkInactive()) {
            this.leave(true, true); // 标记为超时
            this.sessionId = resetSession();
        }
    }, checkInterval);
}
```

#### 4. 修改活跃检测逻辑

```javascript
_bindActivity() {
    const update = () => {
        const wasInactive = this._checkInactive();
        this.lastActiveTime = now();
        refreshSession();
        
        // 如果之前因为超时而离开了，现在重新激活，需要重新 enter
        if (wasInactive && this.isTimedOut && this.current) {
            this.isTimedOut = false; // 重置超时标记
            this.current.enterTime = now();
            
            // 上报 module_enter 事件
            // ...
        }
    };
}
```

#### 5. 修改 `enter()` 方法

```javascript
enter(module) {
    // ...
    this.isTimedOut = false; // 清除超时标记
    // ...
}
```

## 工作流程

### 完整的时间线示例（60秒超时）

```
时间     事件                          this.current    isTimedOut
─────────────────────────────────────────────────────────────────
0s      用户进入页面                   ✅ 有值          false
10s     用户点击                       ✅ 有值          false
70s     超时检测触发                   ✅ 有值          true ⬅️ 保留
        - 上报 module_leave
        - 重置 Session
        - 不清除 current
80s     用户点击表格分页               ✅ 有值          false ⬅️ 重置
        - 检测到 isTimedOut=true
        - 上报 module_enter
        - 重置 enterTime
90s     用户滚动                       ✅ 有值          false
150s    超时检测再次触发               ✅ 有值          true ⬅️ 可重复
        - 上报 module_leave
        - 重置 Session
160s    用户再次点击                   ✅ 有值          false ⬅️ 再次重置
        - 上报 module_enter
```

### 与之前的对比

**修复前：**
```
0s   → enter (current=✅)
60s  → timeout leave (current=null ❌)
70s  → click (无反应，current 已为空)
∞    → 不再触发超时检测
```

**修复后：**
```
0s   → enter (current=✅, isTimedOut=false)
60s  → timeout leave (current=✅, isTimedOut=true) ⬅️ 保留
70s  → click (检测到 isTimedOut，触发 re-enter) ⬅️ 正常工作
80s  → 继续检测 (current=✅, isTimedOut=false) ⬅️ 可重复
140s → timeout leave (再次触发) ⬅️ 循环工作
```

## 测试验证

### 测试步骤

1. 初始化 SDK，设置 `sessionTimeout: 60 * 1000`（60秒）
2. 调用 `tracker.enter({ module: 'test_page' })`
3. 等待 60-70 秒，不操作页面
4. 观察日志：应该看到 `module_leave` 事件
5. 点击页面任意位置
6. 观察日志：应该看到 `module_enter` 事件
7. 继续等待 60-70 秒
8. 观察日志：应该再次看到 `module_leave` 事件（证明可以重复触发）

### 预期日志输出

```
[Tracker SDK] Timeout check interval: 10.0 s
[Tracker SDK] User entered test_page

// 60-70秒后
[Tracker SDK] User inactive for too long, triggering auto leave
[Tracker SDK] Leaving module: { module: 'test_page', duration: 60000, force: true, isTimeout: true }
[Tracker SDK] Module info preserved for re-activation
[Tracker SDK] Session reset due to inactivity, new sessionId: xxx

// 点击后
[Tracker SDK] User became active again after timeout
[Tracker SDK] Re-entered module after inactivity: test_page

// 再等 60-70秒
[Tracker SDK] User inactive for too long, triggering auto leave
[Tracker SDK] Leaving module: { module: 'test_page', duration: 60000, force: true, isTimeout: true }
[Tracker SDK] Session reset due to inactivity, new sessionId: yyy
```

## 边界情况处理

### 1. 正常切换模块

```javascript
tracker.enter({ module: 'page_a' });
// ... 用户操作
tracker.enter({ module: 'page_b' }); // 自动触发 page_a 的 leave
```

此时 `isTimedOut` 会被 `enter()` 清除，不会影响正常流程。

### 2. 页面隐藏/恢复

```javascript
// 页面隐藏
document.visibilityState === 'hidden'
→ flushData() 调用 leave(true) // 非超时，清除 current
→ 保存 hiddenModule

// 页面恢复
document.visibilityState === 'visible'
→ 调用 enter(hiddenModule) // 重新进入
→ isTimedOut 被清除
```

### 3. 多次超时循环

用户可以反复经历"超时离开 → 重新激活"的循环，每次都会：
- 上报 `module_leave`
- 重置 Session
- 上报 `module_enter`
- 开始新的计时

这符合业务需求：长时间不操作视为会话结束，再次操作视为新会话开始。

## 性能影响

- **内存**：仅增加一个布尔标记 `isTimedOut`，几乎无影响
- **CPU**：超时检测逻辑不变，仍然是定期检查
- **网络**：可能会增加一些 `module_enter/leave` 事件，但这是预期的业务行为

## 兼容性

此修复完全向后兼容：
- 现有的 `leave()` 调用不受影响（默认 `isTimeout=false`）
- 只有超时检测内部调用使用 `leave(true, true)`
- 不影响其他功能和插件
