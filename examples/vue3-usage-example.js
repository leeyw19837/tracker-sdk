/**
 * Vue3 项目中使用 tracker-sdk 的示例代码
 * 
 * 使用方法：
 * 1. 将此文件复制到你的 Vue3 项目中
 * 2. 根据实际路径调整 import 语句
 * 3. 在 main.js 中引入并调用 initTracker()
 */

import { 
  initTracker, 
  routerPlugin, 
  errorPlugin, 
  performancePlugin, 
  autoTracker 
} from '@jasolar/tracker-sdk';
// 如果直接引用文件，使用以下路径：
// import { ... } from './libs/tracker-sdk/index.esm.js';

let tracker = null;

/**
 * 初始化埋点 SDK
 */
export function setupTracker() {
  if (tracker) {
    console.warn('[Tracker] 已经初始化过了');
    return tracker;
  }

  // 1. 初始化 SDK
  tracker = initTracker({
    endPoint: import.meta.env.VITE_TRACKER_ENDPOINT || 'http://localhost:3000/api/collect',
    delay: 1000,           // 批量上报延迟：1秒
    maxBatchSize: 10,      // 累计10条数据立即上报
    token: import.meta.env.VITE_TRACKER_TOKEN || '' // 可选：认证 token
  });

  // 2. 注册插件
  tracker.use(routerPlugin);      // 路由监控
  tracker.use(errorPlugin);       // 错误捕获
  tracker.use(performancePlugin); // 性能监控
  tracker.use(autoTracker);       // 自动埋点

  // 3. 设置全局参数（可选）
  tracker.setExt({
    app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE || 'development'
  });

  console.log('[Tracker] SDK 初始化成功');
  
  return tracker;
}

/**
 * 获取 tracker 实例
 */
export function getTrackerInstance() {
  if (!tracker) {
    throw new Error('[Tracker] SDK 尚未初始化，请先调用 setupTracker()');
  }
  return tracker;
}

/**
 * 在 Vue 组件中使用的示例
 */
export function useTracker() {
  const instance = getTrackerInstance();

  return {
    // 追踪自定义事件
    track(eventName, params = {}) {
      instance.track(eventName, params);
    },

    // 进入模块（手动控制）
    enter(module) {
      instance.enter(module);
    },

    // 离开模块（手动控制）
    leave() {
      instance.leave();
    },

    // 设置用户 ID
    setUser(userId) {
      instance.setUser(userId);
    }
  };
}
