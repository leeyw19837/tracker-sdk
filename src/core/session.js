// src/core/session.js

import { uuid } from '../utils/uuid.js';
import { storage } from '../utils/storage.js';
import { now } from '../utils/time.js'; // 引入统一的 now 函数

const SESSION_KEY = 'TRACKER_SESSION_ID';
const SESSION_TIME_KEY = 'TRACKER_SESSION_TIME';

// 默认 30 分钟过期
const SESSION_EXPIRE = 30 * 60 * 1000;

/**
 * 获取或创建 session_id。
 * 如果 session 不存在或已过期，则生成新的 session_id。
 * @returns {string} 当前的 session_id
 */
export function getSessionId() {
    const sid = storage.get(SESSION_KEY);
    const lastTime = Number(storage.get(SESSION_TIME_KEY) || 0); // 确保是数字

    // 如果不存在 或 已过期
    if (!sid || now() - lastTime > SESSION_EXPIRE) {
        const newSid = uuid();
        storage.set(SESSION_KEY, newSid);
        storage.set(SESSION_TIME_KEY, now());
        return newSid;
    }

    return sid;
}

/**
 * 刷新 session 的活跃时间（用户活跃时调用），延长 session 生命周期。
 */
export function refreshSession() {
    storage.set(SESSION_TIME_KEY, now());
}

/**
 * 手动重置 session（比如用户登录切换）。
 * @returns {string} 新的 session_id
 */
export function resetSession() {
    const newSid = uuid();
    storage.set(SESSION_KEY, newSid);
    storage.set(SESSION_TIME_KEY, now());
    return newSid;
}
