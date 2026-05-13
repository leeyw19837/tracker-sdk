# 快速开始 - 本地测试流程

## 🚀 一键测试（推荐）

### 使用 npm link

```bash
# 1. 在 tracker-sdk 项目根目录执行
yarn build
npm link

# 2. 在你的 Vue3 项目中执行
npm link @jasolar/tracker-sdk

# 3. 在 Vue3 项目的 main.js 中添加
import { initTracker, routerPlugin, errorPlugin } from '@jasolar/tracker-sdk';

const tracker = initTracker({
  endPoint: 'http://localhost:3000/api/collect',
  delay: 1000,
  maxBatchSize: 5
});

tracker.use(routerPlugin);
tracker.use(errorPlugin);
```

---
## 👍 最佳实践
在 `main.js` 中初始化并全局注册是最佳实践，这样可以确保 SDK 在应用启动时最早加载。

要在项目代码（如 `.vue` 组件或其他 `.js` 文件）中获取这个实例，有以下几种推荐方案：

### 方案一：使用 `getTracker()` 单例方法（最推荐 ⭐⭐⭐）

你的 SDK 已经提供了 `getTracker()` 方法，这是最标准、最解耦的方式。

#### 1. 在 `main.js` 中初始化
```javascript
// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import { initTracker, routerPlugin } from '@jasolar/tracker-sdk';

// 1. 初始化并获取实例
const tracker = initTracker({
  endPoint: window.config.USER_ACTION_URL,
  token: getToken(), // 假设你有这个函数
});

// 2. 注册插件
tracker.use(routerPlugin, {
  system: '驾驶舱',
  moduleMapper: (path) => {
    // 你的映射逻辑
    return path; 
  }
});

// 3. 挂载 Vue 应用
const app = createApp(App);
app.mount('#app');
```


#### 2. 在任何地方使用
你不需要导入 `tracker` 变量，只需要导入 `getTracker` 函数即可。

**在 Vue 组件中：**
```vue
<script setup>
import { getTracker } from '@jasolar/tracker-sdk';

// 直接获取实例
const tracker = getTracker();

function handleClick() {
  // 上报自定义事件
  tracker.track('button_click', {
    button_name: 'submit'
  });
}

// 如果需要手动追踪模块进入
tracker.enter({
  system: 'dashboard',
  module: 'user-center'
});
</script>
```


**在 Vuex/Pinia Store 中：**
```javascript
// src/store/user.js
import { getTracker } from '@jasolar/tracker-sdk';

export default {
  actions: {
    login({ commit }, userInfo) {
      // 登录成功后设置用户 ID
      const tracker = getTracker();
      tracker.setUser(userInfo.id);
      
      // 上报登录事件
      tracker.track('user_login', {
        user_id: userInfo.id
      });
    }
  }
}
```


---

### 方案二：挂载到 Vue 全局属性（方便模板中使用 ⭐⭐）

如果你希望在 `.vue` 文件的 `<template>` 或 `this` 中直接使用，可以挂载到 Vue 实例上。

#### 1. 在 `main.js` 中挂载
```javascript
// src/main.js
import { initTracker } from '@jasolar/tracker-sdk';

const tracker = initTracker({ ... });

const app = createApp(App);

// 挂载到全局属性
app.config.globalProperties.$tracker = tracker;

app.mount('#app');
```


#### 2. 在 Options API 组件中使用
```vue
<script>
export default {
  methods: {
    handleClick() {
      // 通过 this 访问
      this.$tracker.track('click_event');
    }
  }
}
</script>
```


#### 3. 在 Composition API (`<script setup>`) 中使用
```vue
<script setup>
import { getCurrentInstance } from 'vue';

const instance = getCurrentInstance();
const tracker = instance.appContext.config.globalProperties.$tracker;

tracker.track('click_event');
</script>
```


---

### 方案三：封装一个 Composable 函数（Vue 3 最佳实践 ⭐⭐⭐⭐）

为了更符合 Vue 3 的风格，你可以创建一个 `useTracker` 钩子。

#### 1. 创建 `src/composables/useTracker.js`
```javascript
import { getTracker } from '@jasolar/tracker-sdk';

export function useTracker() {
  const tracker = getTracker();

  return {
    track: (event, params) => tracker.track(event, params),
    enter: (module) => tracker.enter(module),
    setUser: (id) => tracker.setUser(id),
    setExt: (ext) => tracker.setExt(ext)
  };
}
```


#### 2. 在组件中使用
```vue
<script setup>
import { useTracker } from '@/composables/useTracker';

const { track, enter } = useTracker();

function handleBuy() {
  track('buy_product', { price: 99 });
}

// 页面加载时自动调用
enter({ module: 'product-detail' });
</script>
```


---

### 💡 总结建议

| 方案 | 适用场景 | 优点 | 缺点 |
| :--- | :--- | :--- | :--- |
| **方案一 (`getTracker`)** | **通用推荐** | 简单、解耦、无需配置 | 需确保已初始化 |
| **方案二 (`$tracker`)** | 旧版 Options API 项目 | 模板中可直接用 | Composition API 中获取稍繁琐 |
| **方案三 (`useTracker`)** | **Vue 3 大型项目** | 类型安全、易于维护 | 需要额外创建一个文件 |

**建议：**
1. 在 `main.js` 中完成 `initTracker` 和 `use(plugin)`。
2. 在项目代码中统一使用 **方案一 (`getTracker`)** 或 **方案三 (`useTracker`)**。
3. **不要**在 `store/index.js` 中初始化，因为 Store 的加载时机可能晚于某些组件，导致竞态问题。

---
## 📝 完整测试流程

### Step 1: 构建 SDK

```bash
cd /Users/liyanwen/JA_Projects/tracker-sdk
yarn build
```

构建成功后会生成：
- `dist/index.cjs.js` - CommonJS 格式（适用于 Node.js、Webpack）
- `dist/index.esm.js` - ESM 格式（适用于 Vite、现代浏览器）

### Step 2: 链接到本地项目

#### 方案 A: npm link（简单快速）

```bash
# 在 tracker-sdk 项目中
npm link

# 在 Vue3 项目中
npm link @jasolar/tracker-sdk
```

**优点**：配置简单，实时更新  
**缺点**：某些情况下可能出现依赖冲突

#### 方案 B: yalc（更稳定）

```bash
# 全局安装 yalc
npm install -g yalc

# 在 tracker-sdk 项目中
yalc publish

# 在 Vue3 项目中
yalc add @jasolar/tracker-sdk
yarn install
```

**优点**：模拟真实安装过程，更稳定  
**缺点**：需要额外安装工具

### Step 3: 在 Vue3 项目中使用

创建 `src/plugins/tracker.js`:

```javascript
import { 
  initTracker, 
  routerPlugin, 
  errorPlugin, 
  performancePlugin,
  autoTracker 
} from '@jasolar/tracker-sdk';

let tracker = null;

export function setupTracker() {
  if (tracker) return tracker;

  tracker = initTracker({
    endPoint: import.meta.env.VITE_TRACKER_ENDPOINT || 'http://localhost:3000/api/collect',
    delay: 1000,
    maxBatchSize: 10,
    token: import.meta.env.VITE_TRACKER_TOKEN || ''
  });

  // 注册插件
  tracker.use(routerPlugin);
  tracker.use(errorPlugin);
  tracker.use(performancePlugin);
  tracker.use(autoTracker);

  return tracker;
}

export function getTracker() {
  if (!tracker) {
    throw new Error('Tracker not initialized');
  }
  return tracker;
}
```

在 `main.js` 中初始化：

```javascript
import { createApp } from 'vue';
import App from './App.vue';
import { setupTracker } from './plugins/tracker';

// 初始化埋点
setupTracker();

const app = createApp(App);
app.mount('#app');
```

在组件中使用：

```vue
<script setup>
import { getTracker } from '@/plugins/tracker';

const tracker = getTracker();

// 追踪自定义事件
function handleClick() {
  tracker.track('button_click', {
    button_name: 'submit',
    page: 'home'
  });
}

// 手动追踪页面进入
tracker.enter({
  system: 'user-center',
  module: 'profile'
});
</script>

<template>
  <button @click="handleClick">提交</button>
</template>
```

### Step 4: 修改代码后重新测试

```bash
# 在 tracker-sdk 项目中修改代码后
yarn build

# Vue3 项目会自动使用最新构建的文件
# 刷新浏览器即可看到效果
```

如果使用 yalc：

```bash
# 在 tracker-sdk 项目中
yarn build
yalc push  # 自动推送并通知所有使用的项目
```

### Step 5: 测试完成后解除链接

```bash
# 在 Vue3 项目中
npm unlink @jasolar/tracker-sdk
npm install  # 重新安装正式版本

# 或在 tracker-sdk 项目中
npm unlink
```

---

## ✅ 测试检查清单

在发布前，确保以下功能都正常工作：

- [ ] SDK 能成功初始化
- [ ] 路由变化能正确触发上报（hashchange、pushState）
- [ ] URL 查询参数变化能被检测
- [ ] 错误捕获正常（JS error、Promise rejection）
- [ ] 性能数据上报正常
- [ ] 自动埋点正常（data-track 属性）
- [ ] Token 能正确携带
- [ ] 批量上报机制正常
- [ ] 页面关闭时数据不丢失

---

## 🐛 常见问题

### Q: 导入时报错 "Module not found"
**A:** 确保已经执行了 `yarn build`，并且 `dist/` 文件夹存在。

### Q: 插件导出为 undefined
**A:** 检查 `src/index.js` 是否正确导出了插件：
```javascript
export { default as routerPlugin } from './plugins/router.js';
```

### Q: 修改代码后 Vue 项目没有更新
**A:** 
- 使用 npm link: 重新执行 `yarn build`
- 使用 yalc: 执行 `yalc push`

### Q: 报 CORS 跨域错误
**A:** 确保后端接口支持跨域，或在开发环境中配置代理。

---

## 📦 发布到 npm

测试通过后，正式发布：

```bash
# 1. 清理并重新构建
rm -rf dist
yarn build

# 2. 检查构建产物
ls -la dist/

# 3. 更新版本号（如果需要）
npm version patch  # 或 minor, major

# 4. 发布
npm publish
```

---

## 💡 提示

- 查看 `examples/vue3-usage-example.js` 获取完整的 Vue3 使用示例
- 查看详细文档：[LOCAL_TEST.md](LOCAL_TEST.md)
- 运行自动化测试脚本：`./test-local.sh [vue-project-path]`
