# Module Enter/Leave 事件功能说明

## 概述

Tracker SDK 现在支持完整的模块进入/离开事件追踪，包括：
- `module_enter` - 当用户进入一个模块/页面时触发
- `module_leave` - 当用户离开一个模块/页面时触发

## 实现原理

### 1. enter() 方法增强

在 `src/core/tracker.js` 中的 `enter()` 方法现在会：
1. 如果当前已在某个模块中，先自动触发 `leave()` 上报上一个模块的 `module_leave` 事件
2. 设置新的当前模块状态
3. 立即上报 `module_enter` 事件

### 2. leave() 方法保持不变

`leave()` 方法继续负责：
1. 计算在当前模块的停留时长
2. 上报 `module_leave` 事件
3. 清空当前模块状态

## 数据结构

### module_enter 事件格式

```javascript
{
  system: 'system_name',           // 系统名称
  module: 'module_name',           // 模块名称
  sub_module: 'sub_module_name',   // 子模块名称（可选）
  duration: 0,                     // 进入事件duration为0
  event: 'module_enter',           // 事件类型
  timestamp: 'YYYY-MM-DD HH:mm:ss',// 时间戳
  context: {
    device_id: 'xxx',              // 设备ID
    session_id: 'xxx',             // 会话ID
    user_id: 'xxx'                 // 用户ID（如果已设置）
  },
  ext: {                           // 扩展参数
    // 全局扩展参数 + 模块特定参数
  }
}
```

### module_leave 事件格式

```javascript
{
  system: 'system_name',           // 系统名称
  module: 'module_name',           // 模块名称
  sub_module: 'sub_module_name',   // 子模块名称（可选）
  duration: 12345,                 // 停留时长（毫秒）
  event: 'module_leave',           // 事件类型
  timestamp: 'YYYY-MM-DD HH:mm:ss',// 时间戳
  context: {
    device_id: 'xxx',              // 设备ID
    session_id: 'xxx',             // 会话ID
    user_id: 'xxx'                 // 用户ID（如果已设置）
  },
  ext: {                           // 扩展参数
    // 全局扩展参数 + 模块特定参数
  }
}
```

## 使用示例

### 基本用法

```javascript
import { initTracker } from '@jasolar/tracker-sdk';

const tracker = initTracker({
  endPoint: 'https://your-api-endpoint.com/collect'
});

// 进入首页 - 会自动上报 module_enter 事件
tracker.enter({
  system: 'main-app',
  module: 'home',
  sub_module: 'landing'
});

// 切换到关于页面 - 会自动上报 home 的 module_leave 和 about 的 module_enter
tracker.enter({
  system: 'main-app',
  module: 'about',
  sub_module: 'company-info'
});

// 手动离开 - 会上报 module_leave 事件
tracker.leave();
```

### 与路由插件配合使用

路由插件 (`routerPlugin`) 会自动监听路由变化并调用 `enter()` 和 `leave()` 方法：

```javascript
import { initTracker, routerPlugin } from '@jasolar/tracker-sdk';

const tracker = initTracker({
  endPoint: 'https://your-api-endpoint.com/collect'
});

// 启用路由监控插件
tracker.use(routerPlugin, {
  system: 'web-app',
  moduleMapper: (path) => {
    // 自定义路径到模块名的映射
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/settings')) return 'settings';
    return path;
  }
});
```

当用户导航时，会自动产生以下事件流：
1. 初始加载 → `module_enter` (首页)
2. 导航到新页面 → `module_leave` (首页) + `module_enter` (新页面)
3. 关闭页面 → `module_leave` (当前页面)

## 注意事项

1. **成对出现**: `module_enter` 和 `module_leave` 事件通常是成对出现的
2. **Duration 字段**: `module_enter` 事件的 duration 始终为 0，`module_leave` 事件的 duration 表示停留时长
3. **自动处理**: 当调用 `enter()` 时如果已有当前模块，会自动先调用 `leave()`
4. **页面卸载**: 页面关闭或隐藏时会自动触发 `leave()` 确保数据不丢失

## 测试

运行测试文件验证功能：

```bash
node examples/test-module-enter-leave.js
```

查看控制台输出确认事件正确生成。