/**
 * 自动埋点插件
 * 自动收集带有 data-track 属性的元素点击事件。
 */
export default function autoTrackPlugin(tracker) {
    document.addEventListener('click', (e) => {
        let el = e.target;

        // 向外寻找第一个带有 data-track 属性的元素，直到 body
        while (el && el !== document.body) {
            const eventName = el.getAttribute('data-track');

            if (eventName) {
                // 提取所有以 data-track- 开头的自定义属性
                const params = {};
                const attributes = el.attributes;
                for (let i = 0; i < attributes.length; i++) {
                    const attr = attributes[i];
                    if (attr.name.startsWith('data-track-')) {
                        const key = attr.name.replace('data-track-', '');
                        params[key] = attr.value;
                    }
                }

                // 上报事件
                tracker.track(eventName, {
                    tag: el.tagName.toLowerCase(),
                    id: el.id || undefined,
                    class: el.className || undefined,
                    text: el.innerText ? el.innerText.slice(0, 50) : undefined, // 记录部分文本内容
                    ...params
                });

                // 找到第一个符合条件的就停止寻找
                break;
            }
            el = el.parentElement;
        }
    }, true); // 使用捕获模式，确保能更早捕获事件
}
