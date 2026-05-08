import Queue from "./queue.js";
import { send } from "./transport.js";
import { getSessionId, refreshSession } from "./session.js"; // 引入 refreshSession
import { uuid } from "../utils/uuid.js";
import { now, formatTime } from "../utils/time.js";
import { throttle } from "../utils/throttle.js";

/**
 * Tracker 核心类
 */
export default class Tracker {
    /**
     * @param {Object} options - 初始化配置项
     * @param {string} options.endPoint - 数据上报接口地址
     * @param {number} [options.delay=1000] - 批量上报延迟
     * @param {number} [options.maxBatchSize=10] - 批量上报最大条数
     * @param {string} [options.token] - 数据上报接口的 Token
     */
    constructor(options = {}) {
        if (!options.endPoint) {
            console.error("[Tracker SDK] endPoint is required for initialization.");
        }

        this.options = {
            delay: 1000,
            maxBatchSize: 10,
            ...options
        };
        
        this.deviceId = uuid();
        this.sessionId = getSessionId();

        this.userId = null;
        this.globalExt = {};

        this.current = null;
        this.lastActiveTime = now();

        this.queue = new Queue((data, isFlush) => {
            if (this.options.endPoint) {
                // 如果是 flush 触发的（通常是页面关闭），强制使用 sendBeacon
                send(this.options.endPoint, data, this.options.token, isFlush);
            }
        }, {
            delay: this.options.delay,
            maxBatchSize: this.options.maxBatchSize
        });

        this.plugins = [];

        // 自动绑定活跃检测和生命周期监听
        this._bindActivity();
        this._bindLifecycle();
    }

    /***********插件**********/
    /**
     * 使用插件扩展 SDK 功能
     * @param {Function} plugin - 插件函数
     * @param {Object} [options] - 插件配置项（可选）
     */
    use(plugin, options) {
        if (typeof plugin === 'function') {
            // 如果提供了 options，传递给插件函数
            if (options !== undefined) {
                plugin(this, options);
            } else {
                plugin(this);
            }
            this.plugins.push(plugin);
        } else {
            console.warn("[Tracker SDK] Plugin must be a function.");
        }
    }

    /***********用户**********/
    /**
     * 设置用户 ID
     * @param {string|number} userId 
     */
    setUser(userId) {
        this.userId = userId;
    }

    /**
     * 设置全局扩展参数
     * @param {Object} ext 
     */
    setExt(ext) {
        this.globalExt = {
            ...this.globalExt,
            ...ext
        };
    }

    /***********行为**********/
    /**
     * 记录进入模块
     * @param {Object} module 
     */
    enter(module) {
        // 如果当前已经在某个模块中，先触发离开逻辑
        if (this.current) {
            this.leave();
        }

        this.current = {
            ...module,
            enterTime: now()
        };

        // 构建 context 对象
        const context = {
            device_id: this.deviceId,
            session_id: this.sessionId,
            user_id: this.userId
        };

        // 构建 ext 对象（合并全局扩展参数和当前模块的额外信息）
        const extData = {
            ...this.globalExt,
            ...this.current.ext
        };

        // 上报 module_enter 事件
        const event = {
            system: this.current.system || '',
            module: this.current.module || '',
            sub_module: this.current.sub_module || '',
            duration: 0,
            event: 'module_enter',
            timestamp: formatTime(now()),
            context,
            ext: extData
        };

        this.queue.push(event);
    }

    /**
     * 记录离开模块
     * @param {boolean} force - 是否强制使用当前时间作为结束时间（用于页面卸载等场景）
     */
    leave(force = false) {
        if (!this.current) {
            console.log('[Tracker SDK] Leave called but no current module');
            return;
        }

        const endTime = force ? now() : this.lastActiveTime;
        const duration = Math.max(0, endTime - this.current.enterTime);

        console.log('[Tracker SDK] Leaving module:', {
            module: this.current.module,
            system: this.current.system,
            duration,
            force
        });

        // 构建 context 对象
        const context = {
            device_id: this.deviceId,
            session_id: this.sessionId,
            user_id: this.userId
        };

        // 构建 ext 对象（合并全局扩展参数和当前模块的额外信息）
        const extData = {
            ...this.globalExt,
            ...this.current.ext
        };

        const event = {
            system: this.current.system || '',
            module: this.current.module || '',
            sub_module: this.current.sub_module || '',
            duration,
            event: 'module_leave',
            timestamp: formatTime(now()),
            context,
            ext: extData
        };

        console.log('[Tracker SDK] Pushing module_leave event to queue:', event);
        this.queue.push(event);
        this.current = null;
    }

    /**
     * 上报自定义事件
     * @param {string} eventName 
     * @param {Object} params - 扩展参数，可包含 system, module, sub_module
     */
    track(eventName, params = {}) {
        // 从 params 中提取模块信息（如果存在）
        const { system = '', module = '', sub_module = '', ...restParams } = params;

        // 构建 context 对象
        const context = {
            device_id: this.deviceId,
            session_id: this.sessionId,
            user_id: this.userId
        };

        // 构建 ext 对象（合并全局扩展参数和剩余的事件参数）
        const extData = {
            ...this.globalExt,
            ...restParams
        };

        this.queue.push({
            system,
            module,
            sub_module,
            duration: 0,
            event: eventName,
            timestamp: formatTime(now()),
            context,
            ext: extData
        });
    }

    /***********活跃检测**********/
    _bindActivity() {
        const update = () => {
            this.lastActiveTime = now();
            refreshSession(); // 用户活跃时刷新 Session 有效期
        };

        const events = ['click', 'keydown', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, update, { passive: true });
        });

        // 对高频事件进行节流
        document.addEventListener('mousemove', throttle(update, 5000), { passive: true });
        document.addEventListener('scroll', throttle(update, 500), { passive: true });
    }

    /***********生命周期**********/
    _bindLifecycle() {
        // 用于保存页面隐藏前的模块信息
        let hiddenModule = null;

        // 页面卸载或隐藏时，上报当前模块的停留时间并强制刷新队列
        const flushData = () => {
            console.log('[Tracker SDK] Lifecycle: Page hidden/unloading, flushing data...');
            console.log('[Tracker SDK] Current module:', this.current);
            console.log('[Tracker SDK] Queue length:', this.queue.list.length);
            
            // 保存当前模块信息，以便页面恢复时重新 enter
            if (this.current) {
                hiddenModule = { ...this.current };
                console.log('[Tracker SDK] Saved module info for restoration:', hiddenModule.module);
            }
            
            this.leave(true);
            this.queue.flush(true); // 传入 true，标记为页面关闭场景
            
            console.log('[Tracker SDK] Data flushed successfully');
        };

        window.addEventListener('beforeunload', flushData);

        document.addEventListener('visibilitychange', () => {
            console.log('[Tracker SDK] Visibility changed:', document.visibilityState);
            
            if (document.visibilityState === 'hidden') {
                console.log('[Tracker SDK] Page is now hidden, triggering flush...');
                flushData();
            } else if (document.visibilityState === 'visible') {
                console.log('[Tracker SDK] Page is now visible');
                
                // 如果之前有保存的模块信息，重新 enter
                if (hiddenModule) {
                    console.log('[Tracker SDK] Restoring module:', hiddenModule.module);
                    
                    // 清除 enterTime，使用当前时间作为新的进入时间
                    const { enterTime, ...moduleInfo } = hiddenModule;
                    
                    this.enter(moduleInfo);
                    
                    // 重置 hiddenModule
                    hiddenModule = null;
                    
                    console.log('[Tracker SDK] Module restored successfully');
                } else {
                    console.log('[Tracker SDK] No module to restore');
                }
            }
        });
    }
}
