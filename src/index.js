import Tracker from "./core/tracker.js";

// 导出插件
export { default as performancePlugin } from './plugins/performance.js';
export { default as errorPlugin } from './plugins/error.js';
export { default as routerPlugin } from './plugins/router.js';
export { default as autoTracker } from './plugins/autoTracker.js';

let instance = null;

/**
 * 初始化 Tracker SDK。
 * 如果 SDK 已经被初始化，将抛出错误。
 * @param {Object} options - 初始化选项
 * @returns {Tracker} Tracker 实例
 * @throws {Error} 如果 SDK 已经被初始化
 */
export function initTracker(options) {
    console.log('[Tracker SDK] Initializing with options:', options);
    
    if (instance) {
        console.warn("[Tracker SDK] Tracker has already been initialized. Returning existing instance.");
        return instance;
    }
    instance = new Tracker(options);
    console.log('[Tracker SDK] Initialized successfully, instance:', instance);
    return instance;
}

/**
 * 获取 Tracker SDK 实例。
 * 如果 SDK 尚未初始化，将抛出错误。
 * @returns {Tracker} Tracker 实例
 * @throws {Error} 如果 SDK 尚未初始化
 */
export function getTracker() {
    if (!instance) {
        throw new Error("[Tracker SDK] Tracker has not been initialized. Call initTracker() first.");
    }
    return instance;
}