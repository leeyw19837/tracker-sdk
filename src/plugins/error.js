/**
 * 错误监控插件
 * 捕获运行时 JS 错误、未处理的 Promise 拒绝以及资源加载错误。
 */
export default function errorPlugin(tracker) {
    // 捕获 JS 运行时错误和资源加载错误
    window.addEventListener('error', (event) => {
        // 如果是资源加载错误（如 img, script 标签加载失败）
        if (event.target && (event.target.src || event.target.href)) {
            tracker.track('resource_error', {
                target: event.target.tagName,
                url: event.target.src || event.target.href,
                pageUrl: window.location.href
            });
        } else {
            // 普通 JS 运行时错误
            tracker.track('js_error', {
                message: event.message,
                url: event.filename,
                line: event.lineno,
                col: event.colno,
                stack: event.error && event.error.stack,
                pageUrl: window.location.href
            });
        }
    }, true); // 使用捕获阶段以捕获资源加载错误

    // 捕获未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason || {};
        tracker.track('promise_error', {
            reason: reason.message || reason,
            stack: reason.stack,
            pageUrl: window.location.href
        });
    });
}
