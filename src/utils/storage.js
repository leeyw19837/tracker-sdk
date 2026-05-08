/**
 * 简单的本地存储封装
 */
export const storage = {
    get(key) {
        try {
            const val = localStorage.getItem(key);
            if (!val) return null;
            return JSON.parse(val);
        } catch (e) {
            console.warn(`[Tracker SDK] Error parsing storage key "${key}":`, e);
            return null;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn(`[Tracker SDK] Error saving to storage key "${key}":`, e);
        }
    },
    remove(key) {
        localStorage.removeItem(key);
    }
};
