/**
 * 发送数据到服务器。
 *
 * 优化逻辑：
 * 1. 优先使用 fetch + keepalive，以支持自定义 Authorization Header。
 * 2. 如果 fetch 不可用或由于 payload 过大导致失败，回退到 navigator.sendBeacon。
 * 3. 由于 sendBeacon 不支持 Headers，Token 会被附加到 URL 参数中。
 */

/*
@param {string} url - 服务器地址
@param {Object} data - 要发送的数据
@param {Object} token - 认证令牌
@param {boolean} useBeacon - 是否强制使用 sendBeacon（用于页面关闭场景）
 */
export function send(url, data, token = {}, useBeacon = false) {
    if (!url) return;

    const body = JSON.stringify(data);

    // 构造请求头
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 1. 如果强制使用 Beacon 或 fetch 不可用，直接使用 sendBeacon
    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        let beaconUrl = url;
        if (token) {
            const separator = url.includes('?') ? '&' : '?';
            beaconUrl = `${url}${separator}Authorization=${encodeURIComponent('Bearer ' + token)}`;
        }
        const blob = new Blob([body], {type: 'application/json'});
        return navigator.sendBeacon(beaconUrl, blob);
    }

    // 2. 正常场景优先使用 fetch + keepalive
    if (typeof fetch === 'function') {
        try {
            fetch(url, {
                method: 'POST',
                body,
                headers,
                keepalive: true,
                mode: 'cors'
            }).catch(err => {
                console.warn('[Tracker SDK] fetch report failed:', err);
            });
            return;
        } catch (e) {
            console.warn('[Tracker SDK] fetch keepalive failed, trying sendBeacon:', e);
        }
    }

    // 3. 备选方案：navigator.sendBeacon
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        let beaconUrl = url;
        if (token) {
            const separator = url.includes('?') ? '&' : '?';
            beaconUrl = `${url}${separator}Authorization=${encodeURIComponent('Bearer ' +token)}`;
        }
        const blob = new Blob([body], {type: 'application/json'});
        const success = navigator.sendBeacon(beaconUrl, blob);
        if (success) return;
    }

    console.warn('[Tracker SDK] No available transport method.');
}