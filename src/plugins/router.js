/**
 * 路由监控插件
 * 自动追踪页面路由变化，支持 History API 和 Hash 模式。
 *
 * @param tracker - Tracker 实例
 * @param {Object} options - 插件配置项
 * @param {string} [options.system='router'] - 系统标识，默认为 'router'
 * @param {Function} [options.moduleMapper] - 自定义模块名称映射函数，接收路径作为参数，返回模块名称
 * @param {Array<string>} [options.include] - 白名单：只监听匹配的路由（支持字符串前缀匹配或正则表达式）
 * @param {Array<string>} [options.exclude] - 黑名单：排除匹配的路由（支持字符串前缀匹配或正则表达式）
 * @param {Function} [options.filter] - 自定义过滤函数，接收路径作为参数，返回 true 表示需要追踪
 */
export default function routerPlugin(tracker, options = {}) {
    const { 
        system = 'router',
        moduleMapper = null,
        include = null,
        exclude = null,
        filter = null
    } = options;

    // 获取完整路径：pathname + search + hash
    let lastPath = window.location.pathname + window.location.search + window.location.hash;

    /**
     * 根据路径获取模块信息
     */
    const getModuleInfo = (path) => {
        // 如果提供了自定义映射函数，使用它
        if (typeof moduleMapper === 'function') {
            const result = moduleMapper(path);
            if (typeof result === 'string') {
                return { module: result };
            }
            return result || { module: path };
        }
        // 否则使用完整路径
        return { module: path };
    };

    /**
     * 检查路径是否应该被追踪
     * @param {string} path - 要检查的路径
     * @returns {boolean} - 是否应该追踪
     */
    const shouldTrack = (path) => {
        // 如果提供了自定义过滤函数，优先使用
        if (typeof filter === 'function') {
            return filter(path);
        }

        // 检查白名单
        if (include && include.length > 0) {
            const isIncluded = include.some(pattern => matchPath(path, pattern));
            if (!isIncluded) {
                console.log('[Tracker SDK] Route excluded by whitelist:', path);
                return false;
            }
        }

        // 检查黑名单
        if (exclude && exclude.length > 0) {
            const isExcluded = exclude.some(pattern => matchPath(path, pattern));
            if (isExcluded) {
                console.log('[Tracker SDK] Route excluded by blacklist:', path);
                return false;
            }
        }

        return true;
    };

    /**
     * 匹配路径和模式
     * @param {string} path - 路径
     * @param {string|RegExp} pattern - 匹配模式（字符串或正则表达式）
     * @returns {boolean} - 是否匹配
     */
    const matchPath = (path, pattern) => {
        // 如果是正则表达式
        if (pattern instanceof RegExp) {
            return pattern.test(path);
        }
        
        // 如果是字符串，进行前缀匹配或完全匹配
        if (typeof pattern === 'string') {
            // 如果模式以 * 结尾，进行前缀匹配
            if (pattern.endsWith('*')) {
                const prefix = pattern.slice(0, -1);
                return path.startsWith(prefix);
            }
            // 否则进行完全匹配
            return path === pattern || path.startsWith(pattern + '?') || path.startsWith(pattern + '#');
        }

        return false;
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

            // 检查是否应该追踪此路由
            if (!shouldTrack(currentPath)) {
                console.log('[Tracker SDK] Route filtered out:', currentPath);
                return;
            }

            // 避免重复追踪相同的路径
            if (currentPath === lastPath) {
                console.log('[Tracker SDK] Route unchanged:', currentPath, moduleMapper ? moduleMapper(currentPath) : currentPath);
                
                // 如果路径没变，但 tracker.current 为空（可能被生命周期清空了），需要重新 enter
                if (!tracker.current) {
                    console.log('[Tracker SDK] Tracker current is null, re-entering current route');
                    tracker.enter({
                        ...getModuleInfo(currentPath),
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
                ...getModuleInfo(currentPath), // 使用映射后的模块信息
                system // 使用配置的 system
            });
            lastPath = currentPath;
        }, 0);
    };

    // 1. 追踪初始页面加载（延迟执行，确保 DOM 和路由已就绪）
    setTimeout(() => {
        const initialPath = window.location.pathname + window.location.search + window.location.hash;
        
        // 检查初始页面是否应该被追踪
        if (shouldTrack(initialPath)) {
            lastPath = initialPath; // 更新 lastPath 为实际初始路径
            
            tracker.enter({
                ...getModuleInfo(initialPath),
                system
            });
            console.log('[Tracker SDK] Initial route tracked:', initialPath);
        } else {
            console.log('[Tracker SDK] Initial route filtered out:', initialPath);
        }
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
