# 超时自动离开功能说明

## 功能概述

当用户在某个页面停留超过指定时间（默认30分钟）没有任何操作时，SDK 会自动认为用户已离开该页面，并执行以下操作：

1. **自动上报 `module_leave` 事件** - 记录用户在页面的停留时长
2. **重置 Session** - 生成新的 `sessionId`，表示当前会话结束
3. **重新激活时自动上报 `module_enter`** - 当用户再次操作时，自动认为用户重新进入页面，开始新的计时

## 配置项

在初始化 SDK 时，可以通过 `sessionTimeout` 配置超时时间：

```javascript
import { initTracker } from '@tracker/sdk';

const tracker = initTracker({
    endPoint: 'https://api.example.com/collect',
    sessionTimeout: 30 * 60 * 1000, // 30分钟（默认值）
    // 其他配置...
});
```

**参数说明：**
- `sessionTimeout`: 超时时间（毫秒），默认值为 `1800000`（30分钟）
- 建议设置范围：15分钟 ~ 60分钟

## 工作流程

### 场景 1：用户长时间不活跃

```
时间线：
0s     → 用户进入页面 (enter)
30min  → 用户无任何操作
30min  → 超时检测器触发
         ├─ 上报 module_leave (duration: 1800000ms)
         └─ 重置 Session (新 sessionId)
```

### 场景 2：用户重新激活

```
时间线：
30min  → 用户已超时离开
31min  → 用户点击鼠标
         ├─ 检测到从非活跃状态恢复
         ├─ 上报 module_enter (新的 Session)
         └─ 重新开始计时
```

### 场景 3：正常活跃状态

```
时间线：
0s     → 用户进入页面 (enter)
5min   → 用户点击按钮 (更新 lastActiveTime)
10min  → 用户滚动页面 (更新 lastActiveTime)
15min  → 用户输入文本 (更新 lastActiveTime)
...    → 持续活跃，不会触发超时
```

## 技术实现

### 1. 超时检测机制

- **检测频率**：动态调整，根据 `sessionTimeout` 自动计算
  - 计算公式：`sessionTimeout / 6`
  - 最小值：5 秒（避免过于频繁的检查）
  - 最大值：30 秒（避免检查间隔过长）
  - 示例：
    - `sessionTimeout = 60s` → 检测间隔 = 10s
    - `sessionTimeout = 300s (5min)` → 检测间隔 = 50s → 限制为 30s
    - `sessionTimeout = 1800s (30min)` → 检测间隔 = 300s → 限制为 30s
- **判断条件**：`当前时间 - lastActiveTime >= sessionTimeout`
- **触发条件**：仅在当前有模块处于活跃状态时才检测
- **最大延迟**：最多延迟一个检测间隔（通常 < 30 秒）

### 2. 活跃度追踪

以下用户行为会被视为活跃：

- 鼠标点击 (`click`)
- 键盘按键 (`keydown`)
- 触摸开始 (`touchstart`)
- 鼠标移动 (`mousemove`) - 节流 5 秒
- 页面滚动 (`scroll`) - 节流 0.5 秒

### 3. Session 管理

- **超时前**：每次用户活跃时调用 `refreshSession()` 延长 Session 有效期
- **超时后**：调用 `resetSession()` 生成新的 `sessionId`
- **重新激活**：使用新的 `sessionId` 上报 `module_enter`

## 使用示例

### 基础用法

```javascript
// 使用默认 30 分钟超时
const tracker = initTracker({
    endPoint: 'https://api.example.com/collect'
});

tracker.enter({
    system: 'my-system',
    module: 'dashboard'
});

// 如果用户 30 分钟无操作，会自动上报 leave 并重置 Session
```

### 自定义超时时间

```javascript
// 设置 15 分钟超时
const tracker = initTracker({
    endPoint: 'https://api.example.com/collect',
    sessionTimeout: 15 * 60 * 1000
});
```

### 测试超时功能

项目中提供了测试脚本 `examples/test-timeout.js`，使用 5 秒超时方便测试：

```bash
node examples/test-timeout.js
```

## 注意事项

### 1. 与页面可见性的关系

- **页面隐藏**：会立即触发 `leave(true)` 并停止超时检测
- **页面恢复**：重新启动超时检测，并根据情况重新 `enter`
- **超时检测**：仅在页面可见且用户未操作时生效

### 2. 定时器管理

- **启动时机**：SDK 初始化时自动启动
- **停止时机**：页面卸载或隐藏时自动停止
- **重启时机**：页面从隐藏恢复时自动重启

### 3. 性能考虑

- **动态检测间隔**：根据超时时间自动调整，平衡精度和性能
  - 短超时（如 60s）→ 频繁检查（10s），快速响应
  - 长超时（如 30min）→ 稀疏检查（30s），节省资源
- 活跃度监听使用了事件节流，避免高频触发
- 所有定时器在页面卸载时都会清理，不会造成内存泄漏

## 日志输出

SDK 会在关键节点输出日志，方便调试：

```
[Tracker SDK] User inactive for too long, triggering auto leave
[Tracker SDK] Leaving module: { module: 'home_page', duration: 1800000, force: true }
[Tracker SDK] Session reset due to inactivity, new sessionId: xxx-xxx-xxx
[Tracker SDK] User became active again after timeout
[Tracker SDK] Re-entered module after inactivity: home_page
```

## 常见问题

### Q1: 为什么需要这个功能？

**A**: 传统的前端埋点无法准确统计用户真实停留时长。如果用户打开页面后切换到其他标签页或最小化浏览器，页面仍然处于"活跃"状态，导致停留时长虚高。超时机制可以更准确地反映用户的实际使用情况。

### Q2: 超时时间设置多少合适？

**A**: 取决于你的业务场景：
- **内容阅读类**：建议 30-60 分钟（用户可能长时间阅读）
- **工具类应用**：建议 15-30 分钟（用户操作频率较高）
- **电商类**：建议 20-40 分钟（用户可能在浏览商品）

### Q3: 超时后 Session 为什么要重置？

**A**: 从数据分析的角度，用户长时间不操作后再回来，应该视为一个新的会话。这样可以更准确地统计：
- 会话数量
- 平均会话时长
- 用户访问频次

### Q4: 如何禁用这个功能？

**A**: 将 `sessionTimeout` 设置为一个非常大的值：

```javascript
const tracker = initTracker({
    endPoint: 'https://api.example.com/collect',
    sessionTimeout: 24 * 60 * 60 * 1000 // 24小时，相当于禁用
});
```

## 版本历史

- **v1.x** - 初始版本，支持超时自动离开和重新进入功能
