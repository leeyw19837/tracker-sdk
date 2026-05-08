/**
 * 路由监控插件
 * 自动追踪页面路由变化，支持 History API 和 Hash 模式。
 *
 * @param tracker - Tracker 实例
 * @param {Object} options - 插件配置项
 * @param {string} [options.system='router'] - 系统标识，默认为 'router'
 * @param {Function} [options.moduleMapper] - 自定义模块名称映射函数，接收路径作为参数，返回模块名称
 */
export default function routerPlugin(tracker, options = {}) {
    const { 
        system = 'router',
        moduleMapper = null 
    } = options;

    // 获取完整路径：pathname + search + hash
    let lastPath = window.location.pathname + window.location.search + window.location.hash;

    /**
     * 根据路径获取模块名称
     */
    const getModuleName = (path) => {
        // 如果提供了自定义映射函数，使用它
        if (typeof moduleMapper === 'function') {
            return moduleMapper(path);
        }
        // 否则使用完整路径
        return path;
    };

    /**
     * 追踪页面视图变化
     */
    const trackPageView = () => {
        // 使用 setTimeout 确保在路由更新完成后再获取 location
        setTimeout(() => {
            const currentPath = window.location.pathname + window.location.search + window.location.hash;

            console.log('[Tracker SDK] Checking route change:', { 
                lastPath, 
                currentPath, 
                trackerCurrent: tracker.current 
            });

            // 避免重复追踪相同的路径
            if (currentPath === lastPath) {
                console.log('[Tracker SDK] Route unchanged:', currentPath, moduleMapper ? moduleMapper(currentPath) : currentPath);
                
                // 如果路径没变，但 tracker.current 为空（可能被生命周期清空了），需要重新 enter
                if (!tracker.current) {
                    console.log('[Tracker SDK] Tracker current is null, re-entering current route');
                    tracker.enter({
                        module: getModuleName(currentPath),
                        system
                    });
                }
                return;
            }

            console.log('[Tracker SDK] Route changed:', lastPath, '->', currentPath, moduleMapper ? moduleMapper(currentPath) : currentPath);
            
            // 如果 tracker.current 存在，先 leave
            if (tracker.current) {
                tracker.leave();
            }
            
            tracker.enter({
                module: getModuleName(currentPath), // 使用映射后的模块名
                system // 使用配置的 system
            });
            lastPath = currentPath;
        }, 0);
    };

    // 1. 追踪初始页面加载（延迟执行，确保 DOM 和路由已就绪）
    setTimeout(() => {
        const initialPath = window.location.pathname + window.location.search + window.location.hash;
        lastPath = initialPath; // 更新 lastPath 为实际初始路径
        
        tracker.enter({
            module: getModuleName(initialPath),
            system
        });
        console.log('[Tracker SDK] Initial route tracked:', initialPath);
    }, 0);

    // 2. 监听 Hash 模式路由变化
    window.addEventListener('hashchange', trackPageView);

    // 3. 监听 History API 模式路由变化 (pushState, replaceState, popstate)

    // 劫持 history.pushState 和 history.replaceState
    const patchHistoryMethod = (method) => {
        const original = history[method];
        history[method] = function() {
            const rv = original.apply(this, arguments);
            // 派发一个自定义事件，以便外部监听
            const event = new CustomEvent(method, { detail: { args: arguments } });
            window.dispatchEvent(event);
            return rv;
        };
    };

    patchHistoryMethod('pushState');
    patchHistoryMethod('replaceState');

    // 监听劫持后派发的自定义事件
    window.addEventListener('pushState', trackPageView);
    window.addEventListener('replaceState', trackPageView);

    // 监听浏览器前进/后退按钮 (popstate)
    window.addEventListener('popstate', trackPageView);
}
