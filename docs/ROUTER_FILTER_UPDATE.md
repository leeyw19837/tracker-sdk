# Router Plugin 路由过滤功能 - 更新总结

## 📋 需求背景

用户需要 router plugin 能够监听指定的路由变化进行上报，而不是全部路由，方便用户自定义配置。

## ✨ 实现的功能

### 1. 三种过滤模式

#### 白名单模式 (include)
只监听配置的路由，其他路由被忽略。

```javascript
tracker.use(routerPlugin, {
  include: [
    '/dashboard',           // 完全匹配
    '/user/*',              // 前缀匹配
    /^\/product\/\d+$/     // 正则匹配
  ]
});
```

#### 黑名单模式 (exclude)
排除配置的路由，其他路由都被监听。

```javascript
tracker.use(routerPlugin, {
  exclude: [
    '/login',
    '/register',
    '/admin/*'
  ]
});
```

#### 自定义过滤函数 (filter)
最灵活的方式，可以实现任意复杂的过滤逻辑。

```javascript
tracker.use(routerPlugin, {
  filter: (path) => {
    // 只追踪包含 'dashboard' 或 'user' 的路由
    return path.includes('dashboard') || path.includes('user');
  }
});
```

### 2. 灵活的匹配方式

- **字符串完全匹配**: `'/dashboard'` 匹配 `/dashboard`
- **字符串前缀匹配**: `'/user/*'` 匹配所有以 `/user/` 开头的路径
- **正则表达式**: `/^\/product\/\d+$/` 匹配 `/product/123` 等

### 3. 优先级规则

当同时配置多个过滤选项时，优先级为：
**filter > include > exclude**

只有优先级最高的选项会生效。

## 📝 修改的文件

### 核心文件
1. **src/plugins/router.js** - 主要功能实现
   - 新增 `shouldTrack()` 函数：判断路由是否应该被追踪
   - 新增 `matchPath()` 函数：实现路径匹配逻辑
   - 修改 `trackPageView()` 函数：添加过滤检查
   - 修改初始化逻辑：对初始页面也应用过滤规则

### 文档文件
2. **README.md** - 更新使用说明
   - 添加 routerPlugin 配置选项详细说明
   - 提供白名单、黑名单、自定义过滤的使用示例
   - 说明匹配模式和优先级规则

3. **MODULE_ENTER_LEAVE.md** - 新建完整功能文档
   - module_enter 和 module_leave 事件格式说明
   - 5个实际应用场景示例
   - 使用注意事项

### 示例文件
4. **examples/router-filter-examples.js** - 新建示例代码
   - 5个完整的使用示例
   - 涵盖各种使用场景
   - 详细的注释说明

5. **examples/demo.js** - 更新示例
   - 添加 system 参数演示
   - 更新注释说明

### 测试文件
6. **test-router-filter.sh** - 新建测试脚本
   - 验证文件完整性
   - 展示功能特性
   - 提供下一步操作指引

## 🔧 技术实现细节

### 核心算法

```javascript
// 1. 检查是否应该追踪路由
const shouldTrack = (path) => {
  // 优先使用自定义过滤函数
  if (typeof filter === 'function') {
    return filter(path);
  }

  // 检查白名单
  if (include && include.length > 0) {
    const isIncluded = include.some(pattern => matchPath(path, pattern));
    if (!isIncluded) return false;
  }

  // 检查黑名单
  if (exclude && exclude.length > 0) {
    const isExcluded = exclude.some(pattern => matchPath(path, pattern));
    if (isExcluded) return false;
  }

  return true;
};

// 2. 路径匹配逻辑
const matchPath = (path, pattern) => {
  // 正则表达式匹配
  if (pattern instanceof RegExp) {
    return pattern.test(path);
  }
  
  // 字符串匹配
  if (typeof pattern === 'string') {
    // 前缀匹配（以 * 结尾）
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return path.startsWith(prefix);
    }
    // 完全匹配（包括查询参数和 hash）
    return path === pattern || 
           path.startsWith(pattern + '?') || 
           path.startsWith(pattern + '#');
  }

  return false;
};
```

### 关键改进点

1. **初始页面也应用过滤**：确保页面首次加载时也遵循过滤规则
2. **控制台日志**：添加详细的日志输出，方便调试
3. **向后兼容**：不配置过滤选项时，保持原有行为（追踪所有路由）
4. **性能优化**：使用短路求值，提高匹配效率

## 📊 使用场景

### 场景 1：电商网站
```javascript
// 只追踪关键业务页面
tracker.use(routerPlugin, {
  system: 'ecommerce',
  include: [
    '/product/*',
    '/cart/*',
    '/checkout/*',
    '/order/*'
  ],
  moduleMapper: (path) => {
    if (path.startsWith('/product/')) return '商品详情';
    if (path.startsWith('/cart/')) return '购物车';
    if (path.startsWith('/checkout/')) return '结算';
    return path;
  }
});
```

### 场景 2：后台管理系统
```javascript
// 排除登录和管理员页面
tracker.use(routerPlugin, {
  system: 'admin-panel',
  exclude: [
    '/login',
    '/register',
    '/admin/*',
    /^\/dev-/
  ]
});
```

### 场景 3：多环境配置
```javascript
// 根据环境动态配置
const isProduction = process.env.NODE_ENV === 'production';

tracker.use(routerPlugin, {
  system: 'my-app',
  filter: (path) => {
    // 生产环境排除测试页面
    if (isProduction) {
      return !path.startsWith('/test-');
    }
    // 开发环境追踪所有页面
    return true;
  }
});
```

## ✅ 测试建议

### 单元测试
1. 测试白名单匹配逻辑
2. 测试黑名单匹配逻辑
3. 测试自定义过滤函数
4. 测试字符串完全匹配
5. 测试字符串前缀匹配
6. 测试正则表达式匹配
7. 测试优先级规则

### 集成测试
1. 在 Vue/React 项目中测试
2. 测试初始页面加载
3. 测试路由跳转
4. 测试浏览器前进/后退
5. 测试带参数的路由

### 手动测试
运行示例文件：
```bash
node examples/router-filter-examples.js
```

## 🚀 部署步骤

1. **本地测试**
   ```bash
   npm run build
   node examples/test-module-enter-leave.js
   ```

2. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 添加路由过滤功能，支持白名单/黑名单/自定义过滤"
   ```

3. **发布新版本**
   ```bash
   npm version minor  # 1.0.5 -> 1.1.0
   npm publish
   ```

## 📚 相关文档

- [README.md](../README.md) - 项目主文档
- [MODULE_ENTER_LEAVE.md](MODULE_ENTER_LEAVE.md) - 模块进入/离开事件详细说明
- [examples/router-filter-examples.js](../examples/router-filter-examples.js) - 完整使用示例
- [LOCAL_TEST.md](LOCAL_TEST.md) - 本地测试指南

## 💡 最佳实践

1. **选择合适的过滤策略**
   - 需要追踪的页面少 → 使用白名单
   - 需要排除的页面少 → 使用黑名单
   - 复杂逻辑 → 使用自定义函数

2. **合理使用 moduleMapper**
   - 将路径映射为易读的中文名称
   - 便于数据分析和报表展示

3. **注意性能**
   - 避免过于复杂的正则表达式
   - 过滤函数应保持简洁高效

4. **调试技巧**
   - 查看控制台日志了解过滤情况
   - 使用浏览器开发者工具监控网络请求

## 🎯 后续优化方向

1. 支持通配符的高级用法（如 `**` 匹配多级路径）
2. 支持基于路由元数据的过滤
3. 支持动态更新过滤规则
4. 添加路由追踪统计信息

---

**完成时间**: 2026-05-08  
**版本**: v1.1.0 (待发布)  
**状态**: ✅ 已完成，待测试
