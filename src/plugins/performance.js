export default function performancePlugin(tracker) {
    window.addEventListener('load', () => {
        // 使用 setTimeout 确保 loadEventEnd 等指标已完成采集
        setTimeout(() => {
            let performanceData = null;

            // 优先使用 Navigation Timing Level 2 API
            if (typeof performance.getEntriesByType === 'function') {
                const navEntry = performance.getEntriesByType('navigation')[0];
                if (navEntry) {
                    performanceData = {
                        // loadEventEnd 已经是相对于 startTime 的时长
                        load: navEntry.loadEventEnd,
                        // 使用 domComplete - domInteractive 作为 DOM 解析完成的耗时指标
                        dom: navEntry.domComplete - navEntry.domInteractive
                    };
                }
            }

            // 如果不支持新 API，则回退到 performance.timing
            if (!performanceData && performance.timing) {
                const timing = performance.timing;
                performanceData = {
                    load: timing.loadEventEnd - timing.navigationStart,
                    dom: timing.domComplete - timing.domLoading
                };
            }

            if (performanceData) {
                tracker.track('performance', performanceData);
            }
        }, 0);
    });
}
