/**
 * 节流函数：在指定的时间间隔内，无论触发多少次，函数只执行一次。
 * 包含最后一次触发的延迟执行（trailing edge）。
 * 
 * @param {Function} fn - 需要节流的函数
 * @param {number} delay - 间隔时间（毫秒）
 * @returns {Function} - 节流后的函数
 */
export function throttle(fn, delay) {
  var lastTime = 0;
  var timer = null;

  return function() {
    var context = this;
    var args = arguments;
    var now = Date.now();

    if (now - lastTime >= delay) {
      // 如果距离上次执行时间超过了延迟时间，立即执行
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      fn.apply(context, args);
      lastTime = now;
    } else if (!timer) {
      // 否则，如果没有设置定时器，则设置一个定时器在剩余时间后执行
      // 这保证了最后一次触发一定会被执行（trailing edge）
      timer = setTimeout(function() {
        fn.apply(context, args);
        lastTime = Date.now();
        timer = null;
      }, delay - (now - lastTime));
    }
  };
}
