/**
 * 获取当前时间戳（毫秒）
 */
export const now = () => Date.now();

/**
 * 格式化时间为 YYYY-MM-DD HH:mm:ss 格式
 * @param {number} timestamp - 时间戳（毫秒），默认为当前时间
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(timestamp = Date.now()) {
    const date = new Date(timestamp);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}