'use strict';

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}
function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || false, o.configurable = true, "value" in o && (o.writable = true), Object.defineProperty(e, _toPropertyKey(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), Object.defineProperty(e, "prototype", {
    writable: false
  }), e;
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r] = t, e;
}
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function _objectWithoutProperties(e, t) {
  if (null == e) return {};
  var o,
    r,
    i = _objectWithoutPropertiesLoose(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
function _toConsumableArray(r) {
  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

/**
 * 数据上报队列，支持批量发送和定时发送。
 */
var Queue = /*#__PURE__*/function () {
  /**
   * @param {Function} flushFn - 实际发送数据的函数，接收一个数据数组作为参数。
   * @param {Object} options - 配置项
   * @param {number} [options.delay=1000] - 批量发送的延迟时间（毫秒）。
   * @param {number} [options.maxBatchSize=10] - 最大批量大小，达到此数量时立即发送。
   */
  function Queue(flushFn) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    _classCallCheck(this, Queue);
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
  return _createClass(Queue, [{
    key: "push",
    value: function push(data) {
      var _this = this;
      this.list.push(data);

      // 如果达到最大批量大小，立即发送
      if (this.list.length >= this.maxBatchSize) {
        this.flush();
        return;
      }

      // 如果没有定时器，则设置一个定时器在延迟后发送
      if (!this.timer) {
        this.timer = setTimeout(function () {
          _this.flush();
        }, this.delay);
      }
    }

    /**
     * 立即发送队列中的所有数据。
     * @param {boolean} isFlush - 是否为强制刷新（如页面关闭）
     */
  }, {
    key: "flush",
    value: function flush() {
      var _this2 = this;
      var isFlush = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      if (!this.list.length) {
        return;
      }

      // 复制一份数据列表，防止在发送过程中 list 被修改
      var dataToSend = _toConsumableArray(this.list);
      this.list = []; // 清空队列

      try {
        // 逐条发送数据，而不是批量发送
        dataToSend.forEach(function (item) {
          _this2.flushFn(item, isFlush);
        });
      } catch (error) {
        console.error("[Tracker SDK] Failed to flush data:", error);
      } finally {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
  }]);
}();

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
function send(url, data) {
  var token = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var useBeacon = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  if (!url) return;
  var body = JSON.stringify(data);

  // 构造请求头
  var headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = "Bearer ".concat(token);
  }

  // 1. 如果强制使用 Beacon 或 fetch 不可用，直接使用 sendBeacon
  if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    var beaconUrl = url;
    if (token) {
      var separator = url.includes('?') ? '&' : '?';
      beaconUrl = "".concat(url).concat(separator, "Authorization=").concat(encodeURIComponent('Bearer ' + token));
    }
    var blob = new Blob([body], {
      type: 'application/json'
    });
    return navigator.sendBeacon(beaconUrl, blob);
  }

  // 2. 正常场景优先使用 fetch + keepalive
  if (typeof fetch === 'function') {
    try {
      fetch(url, {
        method: 'POST',
        body: body,
        headers: headers,
        keepalive: true,
        mode: 'cors'
      }).catch(function (err) {
        console.warn('[Tracker SDK] fetch report failed:', err);
      });
      return;
    } catch (e) {
      console.warn('[Tracker SDK] fetch keepalive failed, trying sendBeacon:', e);
    }
  }

  // 3. 备选方案：navigator.sendBeacon
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    var _beaconUrl = url;
    if (token) {
      var _separator = url.includes('?') ? '&' : '?';
      _beaconUrl = "".concat(url).concat(_separator, "Authorization=").concat(encodeURIComponent('Bearer ' + token));
    }
    var _blob = new Blob([body], {
      type: 'application/json'
    });
    var success = navigator.sendBeacon(_beaconUrl, _blob);
    if (success) return;
  }
  console.warn('[Tracker SDK] No available transport method.');
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c === 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}

/**
 * 简单的本地存储封装
 */
var storage = {
  get: function get(key) {
    try {
      var val = localStorage.getItem(key);
      if (!val) return null;
      return JSON.parse(val);
    } catch (e) {
      console.warn("[Tracker SDK] Error parsing storage key \"".concat(key, "\":"), e);
      return null;
    }
  },
  set: function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("[Tracker SDK] Error saving to storage key \"".concat(key, "\":"), e);
    }
  },
  remove: function remove(key) {
    localStorage.removeItem(key);
  }
};

/**
 * 获取当前时间戳（毫秒）
 */
var now = function now() {
  return Date.now();
};

/**
 * 格式化时间为 YYYY-MM-DD HH:mm:ss 格式
 * @param {number} timestamp - 时间戳（毫秒），默认为当前时间
 * @returns {string} 格式化后的时间字符串
 */
function formatTime() {
  var timestamp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Date.now();
  var date = new Date(timestamp);
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var day = String(date.getDate()).padStart(2, '0');
  var hours = String(date.getHours()).padStart(2, '0');
  var minutes = String(date.getMinutes()).padStart(2, '0');
  var seconds = String(date.getSeconds()).padStart(2, '0');
  return "".concat(year, "-").concat(month, "-").concat(day, " ").concat(hours, ":").concat(minutes, ":").concat(seconds);
}

// src/core/session.js


var SESSION_KEY = 'TRACKER_SESSION_ID';
var SESSION_TIME_KEY = 'TRACKER_SESSION_TIME';

// 默认 30 分钟过期
var SESSION_EXPIRE = 30 * 60 * 1000;

/**
 * 获取或创建 session_id。
 * 如果 session 不存在或已过期，则生成新的 session_id。
 * @returns {string} 当前的 session_id
 */
function getSessionId() {
  var sid = storage.get(SESSION_KEY);
  var lastTime = Number(storage.get(SESSION_TIME_KEY) || 0); // 确保是数字

  // 如果不存在 或 已过期
  if (!sid || now() - lastTime > SESSION_EXPIRE) {
    var newSid = uuid();
    storage.set(SESSION_KEY, newSid);
    storage.set(SESSION_TIME_KEY, now());
    return newSid;
  }
  return sid;
}

/**
 * 刷新 session 的活跃时间（用户活跃时调用），延长 session 生命周期。
 */
function refreshSession() {
  storage.set(SESSION_TIME_KEY, now());
}

/**
 * 节流函数：在指定的时间间隔内，无论触发多少次，函数只执行一次。
 * 包含最后一次触发的延迟执行（trailing edge）。
 * 
 * @param {Function} fn - 需要节流的函数
 * @param {number} delay - 间隔时间（毫秒）
 * @returns {Function} - 节流后的函数
 */
function throttle(fn, delay) {
  var lastTime = 0;
  var timer = null;
  return function () {
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
      timer = setTimeout(function () {
        fn.apply(context, args);
        lastTime = Date.now();
        timer = null;
      }, delay - (now - lastTime));
    }
  };
}

var _excluded = ["system", "module", "sub_module"];

/**
 * Tracker 核心类
 */
var Tracker = /*#__PURE__*/function () {
  /**
   * @param {Object} options - 初始化配置项
   * @param {string} options.endPoint - 数据上报接口地址
   * @param {number} [options.delay=1000] - 批量上报延迟
   * @param {number} [options.maxBatchSize=10] - 批量上报最大条数
   * @param {string} [options.token] - 数据上报接口的 Token
   */
  function Tracker() {
    var _this = this;
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _classCallCheck(this, Tracker);
    if (!options.endPoint) {
      console.error("[Tracker SDK] endPoint is required for initialization.");
    }
    this.options = _objectSpread2({
      delay: 1000,
      maxBatchSize: 10
    }, options);
    this.deviceId = uuid();
    this.sessionId = getSessionId();
    this.userId = null;
    this.globalExt = {};
    this.current = null;
    this.lastActiveTime = now();
    this.queue = new Queue(function (data, isFlush) {
      if (_this.options.endPoint) {
        // 如果是 flush 触发的（通常是页面关闭），强制使用 sendBeacon
        send(_this.options.endPoint, data, _this.options.token, isFlush);
      }
    }, {
      delay: this.options.delay,
      maxBatchSize: this.options.maxBatchSize
    });
    this.plugins = [];

    // 自动绑定活跃检测和生命周期监听
    this._bindActivity();
    this._bindLifecycle();
  }

  /***********插件**********/
  /**
   * 使用插件扩展 SDK 功能
   * @param {Function} plugin - 插件函数
   * @param {Object} [options] - 插件配置项（可选）
   */
  return _createClass(Tracker, [{
    key: "use",
    value: function use(plugin, options) {
      if (typeof plugin === 'function') {
        // 如果提供了 options，传递给插件函数
        if (options !== undefined) {
          plugin(this, options);
        } else {
          plugin(this);
        }
        this.plugins.push(plugin);
      } else {
        console.warn("[Tracker SDK] Plugin must be a function.");
      }
    }

    /***********用户**********/
    /**
     * 设置用户 ID
     * @param {string|number} userId 
     */
  }, {
    key: "setUser",
    value: function setUser(userId) {
      this.userId = userId;
    }

    /**
     * 设置全局扩展参数
     * @param {Object} ext 
     */
  }, {
    key: "setExt",
    value: function setExt(ext) {
      this.globalExt = _objectSpread2(_objectSpread2({}, this.globalExt), ext);
    }

    /***********行为**********/
    /**
     * 记录进入模块
     * @param {Object} module 
     */
  }, {
    key: "enter",
    value: function enter(module) {
      // 如果当前已经在某个模块中，先触发离开逻辑
      if (this.current) {
        this.leave();
      }
      this.current = _objectSpread2(_objectSpread2({}, module), {}, {
        enterTime: now()
      });
    }

    /**
     * 记录离开模块
     * @param {boolean} force - 是否强制使用当前时间作为结束时间（用于页面卸载等场景）
     */
  }, {
    key: "leave",
    value: function leave() {
      var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      if (!this.current) {
        return;
      }
      var endTime = force ? now() : this.lastActiveTime;
      var duration = Math.max(0, endTime - this.current.enterTime);

      // 构建 context 对象
      var context = {
        device_id: this.deviceId,
        session_id: this.sessionId,
        user_id: this.userId
      };

      // 构建 ext 对象（合并全局扩展参数和当前模块的额外信息）
      var extData = _objectSpread2(_objectSpread2({}, this.globalExt), this.current.ext);
      var event = {
        system: this.current.system || '',
        module: this.current.module || '',
        sub_module: this.current.sub_module || '',
        duration: duration,
        event: 'module_leave',
        timestamp: formatTime(now()),
        context: context,
        ext: extData
      };
      this.queue.push(event);
      this.current = null;
    }

    /**
     * 上报自定义事件
     * @param {string} eventName 
     * @param {Object} params - 扩展参数，可包含 system, module, sub_module
     */
  }, {
    key: "track",
    value: function track(eventName) {
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      // 从 params 中提取模块信息（如果存在）
      var _params$system = params.system,
        system = _params$system === void 0 ? '' : _params$system,
        _params$module = params.module,
        module = _params$module === void 0 ? '' : _params$module,
        _params$sub_module = params.sub_module,
        sub_module = _params$sub_module === void 0 ? '' : _params$sub_module,
        restParams = _objectWithoutProperties(params, _excluded);

      // 构建 context 对象
      var context = {
        device_id: this.deviceId,
        session_id: this.sessionId,
        user_id: this.userId
      };

      // 构建 ext 对象（合并全局扩展参数和剩余的事件参数）
      var extData = _objectSpread2(_objectSpread2({}, this.globalExt), restParams);
      this.queue.push({
        system: system,
        module: module,
        sub_module: sub_module,
        duration: 0,
        event: eventName,
        timestamp: formatTime(now()),
        context: context,
        ext: extData
      });
    }

    /***********活跃检测**********/
  }, {
    key: "_bindActivity",
    value: function _bindActivity() {
      var _this2 = this;
      var update = function update() {
        _this2.lastActiveTime = now();
        refreshSession(); // 用户活跃时刷新 Session 有效期
      };
      var events = ['click', 'keydown', 'touchstart'];
      events.forEach(function (event) {
        document.addEventListener(event, update, {
          passive: true
        });
      });

      // 对高频事件进行节流
      document.addEventListener('mousemove', throttle(update, 5000), {
        passive: true
      });
      document.addEventListener('scroll', throttle(update, 500), {
        passive: true
      });
    }

    /***********生命周期**********/
  }, {
    key: "_bindLifecycle",
    value: function _bindLifecycle() {
      var _this3 = this;
      // 页面卸载或隐藏时，上报当前模块的停留时间并强制刷新队列
      var flushData = function flushData() {
        _this3.leave(true);
        _this3.queue.flush(true); // 传入 true，标记为页面关闭场景
      };
      window.addEventListener('beforeunload', flushData);
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
          flushData();
        }
      });
    }
  }]);
}();

function performancePlugin(tracker) {
  window.addEventListener('load', function () {
    // 使用 setTimeout 确保 loadEventEnd 等指标已完成采集
    setTimeout(function () {
      var performanceData = null;

      // 优先使用 Navigation Timing Level 2 API
      if (typeof performance.getEntriesByType === 'function') {
        var navEntry = performance.getEntriesByType('navigation')[0];
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
        var timing = performance.timing;
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

/**
 * 错误监控插件
 * 捕获运行时 JS 错误、未处理的 Promise 拒绝以及资源加载错误。
 */
function errorPlugin(tracker) {
  // 捕获 JS 运行时错误和资源加载错误
  window.addEventListener('error', function (event) {
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
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason || {};
    tracker.track('promise_error', {
      reason: reason.message || reason,
      stack: reason.stack,
      pageUrl: window.location.href
    });
  });
}

/**
 * 路由监控插件
 * 自动追踪页面路由变化，支持 History API 和 Hash 模式。
 *
 * @param tracker - Tracker 实例
 * @param {Object} options - 插件配置项
 * @param {string} [options.system='router'] - 系统标识，默认为 'router'
 * @param {Function} [options.moduleMapper] - 自定义模块名称映射函数，接收路径作为参数，返回模块名称
 */
function routerPlugin(tracker) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _options$system = options.system,
    system = _options$system === void 0 ? 'router' : _options$system,
    _options$moduleMapper = options.moduleMapper,
    moduleMapper = _options$moduleMapper === void 0 ? null : _options$moduleMapper;

  // 获取完整路径：pathname + search + hash
  var lastPath = window.location.pathname + window.location.search + window.location.hash;

  /**
   * 根据路径获取模块名称
   */
  var getModuleName = function getModuleName(path) {
    // 如果提供了自定义映射函数，使用它
    if (typeof moduleMapper === 'function') {
      return moduleMapper(path);
    }
    // 否则使用完整路径
    return path;
  };

  /**
   * 追踪页面视图变化
   */
  var trackPageView = function trackPageView() {
    // 使用 setTimeout 确保在路由更新完成后再获取 location
    setTimeout(function () {
      var currentPath = window.location.pathname + window.location.search + window.location.hash;
      console.log('[Tracker SDK] Checking route change:', {
        lastPath: lastPath,
        currentPath: currentPath,
        trackerCurrent: tracker.current
      });

      // 避免重复追踪相同的路径
      if (currentPath === lastPath) {
        console.log('[Tracker SDK] Route unchanged:', currentPath, moduleMapper ? moduleMapper(currentPath) : currentPath);

        // 如果路径没变，但 tracker.current 为空（可能被生命周期清空了），需要重新 enter
        if (!tracker.current) {
          console.log('[Tracker SDK] Tracker current is null, re-entering current route');
          tracker.enter({
            module: getModuleName(currentPath),
            system: system
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
        module: getModuleName(currentPath),
        // 使用映射后的模块名
        system: system // 使用配置的 system
      });
      lastPath = currentPath;
    }, 0);
  };

  // 1. 追踪初始页面加载（延迟执行，确保 DOM 和路由已就绪）
  setTimeout(function () {
    var initialPath = window.location.pathname + window.location.search + window.location.hash;
    lastPath = initialPath; // 更新 lastPath 为实际初始路径

    tracker.enter({
      module: getModuleName(initialPath),
      system: system
    });
    console.log('[Tracker SDK] Initial route tracked:', initialPath);
  }, 0);

  // 2. 监听 Hash 模式路由变化
  window.addEventListener('hashchange', trackPageView);

  // 3. 监听 History API 模式路由变化 (pushState, replaceState, popstate)

  // 劫持 history.pushState 和 history.replaceState
  var patchHistoryMethod = function patchHistoryMethod(method) {
    var original = history[method];
    history[method] = function () {
      var rv = original.apply(this, arguments);
      // 派发一个自定义事件，以便外部监听
      var event = new CustomEvent(method, {
        detail: {
          args: arguments
        }
      });
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

/**
 * 自动埋点插件
 * 自动收集带有 data-track 属性的元素点击事件。
 */
function autoTrackPlugin(tracker) {
  document.addEventListener('click', function (e) {
    var el = e.target;

    // 向外寻找第一个带有 data-track 属性的元素，直到 body
    while (el && el !== document.body) {
      var eventName = el.getAttribute('data-track');
      if (eventName) {
        // 提取所有以 data-track- 开头的自定义属性
        var params = {};
        var attributes = el.attributes;
        for (var i = 0; i < attributes.length; i++) {
          var attr = attributes[i];
          if (attr.name.startsWith('data-track-')) {
            var key = attr.name.replace('data-track-', '');
            params[key] = attr.value;
          }
        }

        // 上报事件
        tracker.track(eventName, _objectSpread2({
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          class: el.className || undefined,
          text: el.innerText ? el.innerText.slice(0, 50) : undefined
        }, params));

        // 找到第一个符合条件的就停止寻找
        break;
      }
      el = el.parentElement;
    }
  }, true); // 使用捕获模式，确保能更早捕获事件
}

var instance = null;

/**
 * 初始化 Tracker SDK。
 * 如果 SDK 已经被初始化，将抛出错误。
 * @param {Object} options - 初始化选项
 * @returns {Tracker} Tracker 实例
 * @throws {Error} 如果 SDK 已经被初始化
 */
function initTracker(options) {
  console.log('[Tracker SDK] Initializing with options:', options);
  if (instance) {
    console.warn("[Tracker SDK] Tracker has already been initialized. Returning existing instance.");
    return instance;
  }
  instance = new Tracker(options);
  console.log('[Tracker SDK] Initialized successfully, instance:', instance);
  return instance;
}

/**
 * 获取 Tracker SDK 实例。
 * 如果 SDK 尚未初始化，将抛出错误。
 * @returns {Tracker} Tracker 实例
 * @throws {Error} 如果 SDK 尚未初始化
 */
function getTracker() {
  if (!instance) {
    throw new Error("[Tracker SDK] Tracker has not been initialized. Call initTracker() first.");
  }
  return instance;
}

exports.autoTracker = autoTrackPlugin;
exports.errorPlugin = errorPlugin;
exports.getTracker = getTracker;
exports.initTracker = initTracker;
exports.performancePlugin = performancePlugin;
exports.routerPlugin = routerPlugin;
