# 本地测试指南

本文档说明如何在 Vue3 项目中本地测试 tracker-sdk，确认功能正常后再发布到 npm。

## 方案一：使用 npm link（推荐）

### 1. 在 tracker-sdk 项目中执行

```bash
# 构建 SDK
yarn build

# 创建全局链接
yarn link
# 或者使用 npm link
npm link
```

### 2. 在 Vue3 测试项目中执行

```bash
# 链接本地 SDK
yarn link @jasolar/tracker-sdk
# 或者使用 npm link
npm link @jasolar/tracker-sdk
```

### 3. 在 Vue3 项目中使用

```javascript
// main.js 或 app.js
import { initTracker, routerPlugin, errorPlugin, performancePlugin, autoTracker } from '@jasolar/tracker-sdk';

// 初始化
const tracker = initTracker({
  endPoint: 'http://localhost:3000/api/collect', // 你的测试接口
  delay: 1000,
  maxBatchSize: 5
});

// 使用插件
tracker.use(routerPlugin);
tracker.use(errorPlugin);
tracker.use(performancePlugin);
tracker.use(autoTracker);

// 设置用户信息
tracker.setUser('test-user-001');
```

### 4. 修改 SDK 后重新测试

```bash
# 在 tracker-sdk 项目中
yarn build  # 重新构建

# Vue3 项目会自动使用最新构建的文件，刷新页面即可
```

### 5. 测试完成后解除链接

```bash
# 在 Vue3 测试项目中
yarn unlink @jasolar/tracker-sdk
# 或者
npm unlink @jasolar/tracker-sdk

# 重新安装正式版
yarn install
# 或
npm install
```

---

## 方案二：直接引用构建文件

### 1. 构建 SDK

```bash
yarn build
```

### 2. 在 Vue3 项目中直接引用

```javascript
// 方式 A: 通过相对路径引入（如果将 dist 文件夹复制到 Vue 项目中）
import { initTracker, routerPlugin } from './libs/tracker-sdk/index.esm.js';

// 方式 B: 通过绝对路径引入
import { initTracker, routerPlugin } from '/absolute/path/to/tracker-sdk/dist/index.esm.js';
```

### 3. 配置 Vite（如果使用 Vite）

如果使用方案 B，可能需要在 `vite.config.js` 中配置：

```javascript
export default defineConfig({
  resolve: {
    alias: {
      '@jasolar/tracker-sdk': '/absolute/path/to/tracker-sdk/dist/index.esm.js'
    }
  }
})
```

---

## 方案三：使用 yalc（更稳定）

yalc 比 npm link 更稳定，模拟真实的包安装过程。

### 1. 安装 yalc

```bash
# 全局安装
yarn global add yalc
# 或
npm install -g yalc
```

### 2. 在 tracker-sdk 项目中

```bash
# 发布到本地 yalc 仓库
yalc publish
```

### 3. 在 Vue3 测试项目中

```bash
# 添加本地包
yalc add @jasolar/tracker-sdk

# 安装依赖
yarn install
# 或
npm install
```

### 4. 修改 SDK 后更新

```bash
# 在 tracker-sdk 项目中
yarn build
yalc push  # 自动推送并通知所有使用的项目

# 或在 Vue3 项目中手动更新
yalc update
```

### 5. 测试完成后移除

```bash
# 在 Vue3 测试项目中
yalc remove @jasolar/tracker-sdk
yarn install  # 重新安装正式版本
```

---

## 测试检查清单

### ✅ 基础功能测试
- [ ] SDK 能成功初始化
- [ ] 能正确设置用户 ID (`setUser`)
- [ ] 能正确设置全局扩展参数 (`setExt`)
- [ ] 自定义事件上报正常 (`track`)

### ✅ 插件功能测试
- [ ] **routerPlugin**: 路由变化能正确触发上报
  - Hash 模式路由跳转
  - History 模式路由跳转
  - URL 查询参数变化能被检测
- [ ] **errorPlugin**: 错误捕获正常
  - JS 运行时错误
  - Promise rejection
  - 资源加载错误
- [ ] **performancePlugin**: 性能数据上报正常
  - 页面加载时间
  - DOM 解析时间
- [ ] **autoTracker**: 自动埋点正常
  - 带 `data-track` 属性的元素点击能被捕获
  - 自定义参数正确传递

### ✅ 数据传输测试
- [ ] Token 能正确携带（Header 或 URL 参数）
- [ ] fetch 方式正常工作
- [ ] sendBeacon 回退机制正常
- [ ] 批量上报机制正常（maxBatchSize）
- [ ] 页面关闭时数据不丢失（keepalive / beforeunload）

### ✅ 边界情况测试
- [ ] 重复初始化有警告但不报错
- [ ] Session 过期后能生成新的 session_id
- [ ] 长时间无操作后 Session 正确过期

---

## 常见问题

### Q1: npm link 后模块找不到？
**A:** 确保：
1. tracker-sdk 已执行 `yarn build`
2. package.json 中的 `main` 和 `module` 字段指向正确的文件
3. Vue3 项目使用的是 ESM 格式（`index.esm.js`）

### Q2: 插件导出为 undefined？
**A:** 检查 `src/index.js` 是否正确导出了所有插件：
```javascript
export { default as routerPlugin } from './plugins/router.js';
```

### Q3: 修改代码后 Vue3 项目没更新？
**A:** 
- 使用 npm link: 需要重新执行 `yarn build`
- 使用 yalc: 执行 `yalc push` 会自动更新

### Q4: CORS 跨域问题？
**A:** 确保后端接口支持跨域，或在开发环境中配置代理。

---

## 发布前最后检查

```bash
# 1. 清理并重新构建
rm -rf dist
yarn build

# 2. 检查构建产物
ls -la dist/
# 应该包含: index.cjs.js 和 index.esm.js

# 3. 检查文件大小
du -h dist/*

# 4. 运行测试（如果有测试脚本）
# npm test

# 5. 更新版本号（如果需要）
npm version patch  # 或 minor, major

# 6. 发布到 npm
npm publish
```

---

## 推荐的本地测试流程

```bash
# === tracker-sdk 项目 ===
cd /path/to/tracker-sdk
yarn build
yalc publish

# === Vue3 测试项目 ===
cd /path/to/vue3-project
yalc add @jasolar/tracker-sdk
yarn install

# 启动 Vue3 项目进行测试
yarn dev

# === 修改 SDK 后 ===
# 在 tracker-sdk 项目中
yarn build
yalc push  # Vue3 项目会自动热更新

# === 测试完成后 ===
# 在 Vue3 项目中
yalc remove @jasolar/tracker-sdk
yarn install

# 正式发布
cd /path/to/tracker-sdk
npm publish
```
