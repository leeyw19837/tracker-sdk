# Tracker SDK

`tracker-sdk` 是一个轻量级、模块化、可扩展的通用前端埋点 SDK，旨在为企业提供统一的用户行为监控、性能分析和错误上报解决方案。

## 核心特性

- 🧩 **插件化架构**：核心逻辑与具体功能解耦，支持按需加载性能监控、路由监控、错误收集等插件。
- 📊 **多维数据上报**：支持自定义事件、用户身份标识（UID）、设备指纹（UUID）以及会话管理（Session）。
- ⏱️ **精准性能指标**：基于 Navigation Timing Level 2 API 捕获页面加载和 DOM 构建耗时。
- 🚀 **智能队列管理**：内置上报队列，支持批量上报与页面卸载前的强制刷新（Flush），确保数据不丢失。
- 🛡️ **自动活跃检测**：通过监听用户交互（点击、滚动等）自动更新活跃状态，计算精确的停留时长。
- 🔗 **全路径追踪**：支持模块进入/退出（Enter/Leave）模式，自动计算各模块使用时长。

## 安装

```bash
npm install @jasolar/tracker-sdk
```

## 本地测试

在发布到 npm 之前，你可以在本地 Vue3/React 项目中测试 SDK：

### 方式一：使用 npm link（推荐）

```bash
# 在 tracker-sdk 项目中
yarn build
npm link

# 在你的 Vue3 项目中
npm link @jasolar/tracker-sdk
```

### 方式二：使用 yalc（更稳定）

```bash
# 安装 yalc
npm install -g yalc

# 在 tracker-sdk 项目中
yarn build
yalc publish

# 在你的 Vue3 项目中
yalc add @jasolar/tracker-sdk
yarn install
```

详细测试指南请查看 [LOCAL_TEST.md](./LOCAL_TEST.md)

## 快速上手

### 1. 基本使用

```javascript
import { initTracker } from 'tracker-sdk';

// 初始化 SDK
const tracker = initTracker({
  endPoint: 'https://your-api-endpoint.com/collect',
  appId: 'my-project-id'
});

// 设置用户信息
tracker.setUser('user-123');
```

### 2. 使用插件
```javascript
import { performancePlugin, errorPlugin, routerPlugin, autoTracker } from '@jasolar/tracker-sdk';

tracker.use(performancePlugin);
tracker.use(errorPlugin);

// 路由监控 - 基础用法（监听所有路由）
tracker.use(routerPlugin);

// 路由监控 - 只监听指定路由（白名单）
tracker.use(routerPlugin, {
  system: 'my-app',
  include: ['/dashboard', '/user/*', /^\/product\//]
});

// 路由监控 - 排除指定路由（黑名单）
tracker.use(routerPlugin, {
  system: 'my-app',
  exclude: ['/login', '/register', '/admin/*']
});

// 路由监控 - 自定义过滤函数
tracker.use(routerPlugin, {
  system: 'my-app',
  filter: (path) => !path.startsWith('/test-')  // 排除测试路由
});

tracker.use(autoTracker);
```

### 3. 在页面中实现 track
```javascript
import { getTracker } from '@jasolar/tracker-sdk';

const tracker = getTracker();
tracker.enter({
  system: 'dashboard', // 系统
  module: 'energy', // 模块
})
```

## API 说明

### `initTracker(options)`
初始化 SDK 并返回单例实例。
- **options.endPoint**: 数据上报的接口地址。
- **options.appId**: 应用唯一标识。

### `tracker.enter(module)`
记录进入某个模块/页面的开始，并自动上报 `module_enter` 事件。
- **module**: 对象，通常包含 `system` (系统名), `module` (模块名), `sub_module` (子模块名) 等字段。调用此方法会自动计算上一个模块的停留时长并上报 `module_leave` 事件，然后上报当前模块的 `module_enter` 事件。

### `tracker.leave()`
手动记录离开当前模块。通常配合 `enter` 使用。在 `enter` 新模块或页面关闭/隐藏时会自动触发。

### `tracker.track(event, params)`
上报一个自定义行为事件。
- **event**: 事件名称。
- **params**: 事件携带的参数对象。

### `tracker.setUser(userId)`
关联当前用户信息。
- **userId**: 用户唯一 ID。设置后，后续所有上报数据都会携带此 ID。

### `tracker.setExt(globalExt)`
设置全局扩展参数。
- **globalExt**: 对象。设置后的参数会合并到后续每一个上报事件的 `ext` 字段中。

### `tracker.use(plugin)`
加载并启用插件。
- **plugin**: 插件函数。用于扩展 SDK 的采集能力（如 `performancePlugin`, `errorPlugin` 等）。

#### Router Plugin 配置选项

`routerPlugin` 支持以下配置项：

```javascript
tracker.use(routerPlugin, {
  system: 'my-app',              // 系统标识，默认 'router'
  
  // 模块名称映射函数（可选）
  moduleMapper: (path) => {
    if (path === '/dashboard') return '仪表盘';
    return path;
  },
  
  // 白名单：只监听这些路由（可选）
  include: [
    '/dashboard',        // 完全匹配
    '/user/*',           // 前缀匹配（所有 /user/ 开头的路径）
    /^\/product\/\d+$/  // 正则表达式匹配
  ],
  
  // 黑名单：排除这些路由（可选）
  exclude: [
    '/login',
    '/admin/*'
  ],
  
  // 自定义过滤函数（优先级最高）
  filter: (path) => {
    // 返回 true 表示追踪，false 表示不追踪
    return !path.startsWith('/test-');
  }
});
```

**过滤选项说明：**
- **include**（白名单）：只有匹配的路由会被追踪，其他路由被忽略
- **exclude**（黑名单）：匹配的路由不会被追踪，其他路由都被追踪
- **filter**（自定义函数）：最灵活的方式，可以实现任意复杂的过滤逻辑
- **优先级**：filter > include > exclude（如果同时配置多个，只有优先级最高的生效）

**匹配模式：**
- 字符串完全匹配：`'/dashboard'` 匹配 `/dashboard`
- 字符串前缀匹配：`'/user/*'` 匹配所有以 `/user/` 开头的路径
- 正则表达式：`/^\/product\/\d+$/` 匹配 `/product/123` 等

## 插件系统

SDK 通过插件机制扩展功能。目前内置支持：

- **Performance**: 自动收集页面加载（Load）和 DOM 解析耗时。
- **Error**: 自动捕获运行时错误和未处理的 Promise 拒绝。
- **Router**: 监听路由变化，自动记录页面浏览路径（PV）。
- **AutoTracker**: 自动收集带有特定属性（如 `data-track`）的元素点击事件。

## 技术方案

- **UUID**: 采用 RFC 4122 标准生成设备唯一标识。
- **数据传输**: 使用 `navigator.sendBeacon`（优先）或 `Image/XHR` 确保在页面关闭时也能成功发送数据。
- **节流处理**: 对高频事件（如 `scroll`, `mousemove`）进行节流，降低性能损耗。

## 许可证

ISC
