/**
 * 数据上报队列，支持批量发送和定时发送。
 */
export default class Queue {
    /**
     * @param {Function} flushFn - 实际发送数据的函数，接收一个数据数组作为参数。
     * @param {Object} options - 配置项
     * @param {number} [options.delay=1000] - 批量发送的延迟时间（毫秒）。
     * @param {number} [options.maxBatchSize=10] - 最大批量大小，达到此数量时立即发送。
     */
    constructor(flushFn, options = {}) {
        this.list = [];
        this.flushFn = flushFn;
        this.timer = null;
        this.delay = options.delay || 1000;
        this.maxBatchSize = options.maxBatchSize || 10;
    }

    /**
     * 将数据推入队列。
     * @param {Object} data - 要推入队列的数据。
     */
    push(data) {
        this.list.push(data);

        // 如果达到最大批量大小，立即发送
        if (this.list.length >= this.maxBatchSize) {
            this.flush();
            return;
        }

        // 如果没有定时器，则设置一个定时器在延迟后发送
        if (!this.timer) {
            this.timer = setTimeout(() => {
                this.flush();
            }, this.delay);
        }
    }

    /**
     * 立即发送队列中的所有数据。
     * @param {boolean} isFlush - 是否为强制刷新（如页面关闭）
     */
    flush(isFlush = false) {
        if (!this.list.length) {
            return;
        }

        // 复制一份数据列表，防止在发送过程中 list 被修改
        const dataToSend = [...this.list];
        this.list = []; // 清空队列

        try {
            // 逐条发送数据，而不是批量发送
            dataToSend.forEach(item => {
                this.flushFn(item, isFlush);
            });
        } catch (error) {
            console.error("[Tracker SDK] Failed to flush data:", error);
        } finally {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}
