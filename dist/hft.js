(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["HFT"] = factory();
	else
		root["HFT"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(1),
	    __webpack_require__(6),
	    __webpack_require__(8),
	    __webpack_require__(9),
	  ], __WEBPACK_AMD_DEFINE_RESULT__ = function (
	    GameClient,
	    GameServer,
	    LocalNetPlayer,
	    SyncedClock) {
	    return {
	      GameClient: GameClient,
	      GameServer: GameServer,
	      LocalNetPlayer: LocalNetPlayer,
	      SyncedClock: SyncedClock,
	    };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*
	 * Copyright 2014, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of its
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	"use strict";

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(2),
	    __webpack_require__(3),
	    __webpack_require__(4),
	    __webpack_require__(5),
	  ], __WEBPACK_AMD_DEFINE_RESULT__ = function(
	    Cookie,
	    io,
	    misc,
	    VirtualSocket) {
	  /**
	   * @typedef {Object} GameClient~Options
	   * @property {bool} [reconnect] Reconnect after disconnected (default: true)
	   */

	  /**
	   * Event that we've connected to happyFunTimes
	   *
	   * @event GameClient#connected
	   */

	  /**
	   * Event that we've been disconnected from happyFunTimes
	   *
	   * @event GameClient#disconnected
	   */

	  /**
	   * GameClient is what a controller(phone) uses to talk with a
	   * game's GameServer(the game).
	   *
	   * Messages sent with `sendCmd` get sent to the game. Messages
	   * from the game are delivered to callbacks registered with
	   * `addEventListener`.
	   *
	   * @constructor
	   * @alias GameClient
	   * @param {GameClient~Options} [options] options.
	   */
	  var GameClient = function(options) {
	    options = options || {};
	    var g_socket;
	    var g_sendQueue = [];
	    var eventListeners = {};
	    var log = options.quiet === true ? console.log.bind(console) : function() {};

	    if (!options.gameId) {
	      options.gameId = "HFTHTML5";
	    }

	    /**
	     * @callback GameClient~Listener
	     * @param {Object} data data from sender.
	     */

	    /**
	     * Adds an event listener for the given event type.
	     * event types are made up by you. Sending a command
	     * from the game with
	     *
	     *     someNetPlayer.sendCmd('foo', {data: "bar"});
	     *
	     * Will arrive at the event listener registered for 'foo' here
	     * and given an object `{data: "bar"}`.
	     *
	     * Note: Currently only 1 listener is allowed per eventType.
	     * Adding a second listener for an specific eventType replaces
	     * the previous listener for that type.
	     *
	     * @param {string} eventType name of event
	     * @param {GameClient~Listener} listener callback to call for
	     *        event.
	     */
	    this.addEventListener = function(eventType, listener) {
	      eventListeners[eventType] = listener;
	    };

	    /**
	     * Same as addEventListener
	     */
	    this.on = this.addEventListener;

	    /**
	     * Removes an eventListener
	     * @param {string} eventType name of event
	     */
	    this.removeEventListener = function(eventType) {
	      eventListeners[eventType] = undefined;
	    };

	    var sendEvent_ = function(eventType, args) {
	      var fn = eventListeners[eventType];
	      if (fn) {
	        fn.apply(this, args);
	      } else {
	        console.error("GameClient[" + options.gameId + "]: unknown event: " + eventType);
	      }
	    }.bind(this);

	    var connected_ = function() {
	      for (var ii = 0; ii < g_sendQueue.length; ++ii) {
	        g_socket.send(g_sendQueue[ii]);
	      }
	      g_sendQueue = [];
	      log("connected");
	      sendEvent_('connect');
	    };

	    function makeHFTPingRequest(fn) {
	      io.sendJSON(window.location.href, {cmd: 'happyFunTimesPing'}, function(err, obj) {
	        fn(err, obj);
	      }, { timeout: 2000 });
	    };

	    function noop() {
	    }

	    function reconnect() {
	      reconnect_ = noop;
	      function waitForPing() {
	        makeHFTPingRequest(function(err, obj) {
	          if (err) {
	            setTimeout(waitForPing, 1000);
	            return;
	          }
	          window.location.href = "/";
	        });
	      }
	      // give it a moment to recover
	      setTimeout(waitForPing, 2000);

	      // Maybe needed for app?
	      // var redirCookie = new Cookie("redir");
	      // var url = redirCookie.get() || "http://happyfuntimes.net";
	      // console.log("goto: " + url);
	      // window.location.href = url;
	    }

	    var reconnect_ = options.reconnect !== false ? reconnect : noop;

	    var disconnected_ = function() {
	      if (g_socket) {
	        g_socket = undefined;
	        log("disconnected");
	        sendEvent_('disconnect');
	        eventListeners = {};
	      }
	      reconnect_();
	    };

	    var processMessage_ = function(msg) {
	      sendEvent_(msg.cmd, [msg.data]); // FIX: no need for this array?
	    };

	    var handleError_ = function(err) {
	      log(err);
	      sendEvent_('error');
	      if (g_socket) {
	        g_socket.close();
	      }
	      disconnected_();
	    };

	    var connect_ = function() {
	      g_sendQueue = [];
	      g_socket = options.socket || new VirtualSocket(options);
	      g_socket.on('connect', connected_.bind(this));
	      g_socket.on('message', processMessage_.bind(this));
	      g_socket.on('disconnect', disconnected_.bind(this));
	      g_socket.on('error', handleError_.bind(this));
	    }.bind(this);

	    var sendCmdLowLevel = function(cmd, data) {
	      if (!g_socket) {
	        return;
	      }
	      var msg = {
	        cmd: cmd,
	        data: data,
	      };
	      if (!g_socket.isConnected()) {
	        g_sendQueue.push(msg);
	      } else {
	        g_socket.send(msg);
	      }
	    };

	    var sendCmd = function(cmd, data) {
	      sendCmdLowLevel('update', {
	        cmd: cmd,
	        data: data,
	      });
	    };

	    /**
	     * Sends a command to the game
	     * @param {string} cmd name of command
	     * @param {Object=} data any jsonifyable object.
	     * @example
	     *
	     *     client.sendCmd('position', {
	     *        x: 123,
	     *        y: 456,
	     *     });
	     */
	    this.sendCmd = sendCmd;

	    function sendLogMsg(type, msg) {
	      sendCmd("_hft_log_", { type: type, msg: msg });
	    }

	    this.error = function() {
	      console.error.apply(console, arguments);
	      sendLogMsg("error", Array.prototype.join.call(arguments, " "));
	    };

	    this.errorImpl = function() {
	      sendLogMsg("error", Array.prototype.join.call(arguments, " "));
	    };

	    this.log = function() {
	      console.log.apply(console, arguments);
	      sendLogMsg("log", Array.prototype.join.call(arguments, " "));
	    };

	    this.logImpl = function() {
	      sendLogMsg("log", Array.prototype.join.call(arguments, " "));
	    };

	    connect_();

	    var idCookie = new Cookie("__hft_id__");
	    var opts = misc.mergeObjects(options);
	    var id = idCookie.get();
	    if (!id) {
	      id = misc.makeRandomId();
	      idCookie.set(id);
	    }

	    var nameCookie = new Cookie("name");

	    opts.data = misc.mergeObjects(opts.data);
	    opts.data.__hft_session_id__ = id;  // eslint-disable-line
	    opts.data.__hft_name__ = nameCookie.get() || "";  // eslint-disable-line
	    sendCmdLowLevel('join', opts);
	  };
	  return GameClient;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));



/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/*
	 * Copyright 2014, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of its
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	"use strict";

	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  const window = (Function('return this;')());
	  const document = window.document || {
	    cookie: '',
	  };

	  /**
	   * Represents a cookie.
	   *
	   * This is an object, that way you set the name just once so
	   * calling set or get you don't have to worry about getting the
	   * name wrong.
	   *
	   * @example
	   *     var fooCookie = new Cookie("foo");
	   *     var value = fooCookie.get();
	   *     fooCookie.set(newValue);
	   *     fooCookie.erase();
	   *
	   * @constructor
	   * @alias Cookie
	   * @param {string} name of cookie
	   * @param {string?} opt_path path for cookie. Default "/"
	   */
	  var Cookie = function(name, opt_path) {
	    var path = opt_path || "/";

	    /**
	     * Sets the cookie
	     * @param {string} value value for cookie
	     * @param {number?} opt_days number of days until cookie
	     *        expires. Default = none
	     */
	    this.set = function(value, opt_days) {
	      if (value === undefined) {
	        this.erase();
	        return;
	      }
	      // Cordova/Phonegap doesn't support cookies so use localStorage?
	      if (window.hftSettings && window.hftSettings.inApp) {
	        window.localStorage.setItem(name, value);
	        return;
	      }
	      var expires = "";
	      opt_days = opt_days || 9999;
	      var date = new Date();
	      date.setTime(Date.now() + Math.floor(opt_days * 24 * 60 * 60 * 1000));  // > 32bits. Don't use | 0
	      expires = "; expires=" + date.toGMTString();
	      var cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=" + path;
	      document.cookie = cookie;
	    };

	    /**
	     * Gets the value of the cookie
	     * @return {string?} value of cookie
	     */
	    this.get = function() {
	      // Cordova/Phonegap doesn't support cookies so use localStorage?
	      if (window.hftSettings && window.hftSettings.inApp) {
	        return window.localStorage.getItem(name);
	      }

	      var nameEQ = encodeURIComponent(name) + "=";
	      var ca = document.cookie.split(';');
	      for (var i = 0; i < ca.length; ++i) {
	        var c = ca[i];
	        while (c.charAt(0) === ' ') {
	          c = c.substring(1, c.length);
	        }
	        if (c.indexOf(nameEQ) === 0) {
	          return decodeURIComponent(c.substring(nameEQ.length, c.length));
	        }
	      }
	    };

	    /**
	     * Erases the cookie.
	     */
	    this.erase = function() {
	      if (window.hftSettings && window.hftSettings.inApp) {
	        return window.localStorage.removeItem(name);
	      }
	      document.cookie = this.set(" ", -1);
	    };
	  };

	  return Cookie;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));




/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/*
	 * Copyright 2014, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of its
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	"use strict";

	/**
	 * Misc IO functions
	 * @module IO
	 */
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	  var log = function() { };
	  //var log = console.log.bind(console);

	  /**
	   * @typedef {Object} SendJson~Options
	   * @memberOf module:IO
	   * @property {number?} timeout. Timeout in ms to abort.
	   *        Default = no-timeout
	   */

	  /**
	   * sends a JSON 'POST' request, returns JSON repsonse
	   * @memberOf module:IO
	   * @param {string} url url to POST to.
	   * @param {Object=} jsonObject JavaScript object on which to
	   *        call JSON.stringify.
	   * @param {!function(error, object)} callback Function to call
	   *        on success or failure. If successful error will be
	   *        null, object will be json result from request.
	   * @param {module:IO~SendJson~Options?} options
	   */
	  var sendJSON = function(url, jsonObject, callback, option) {
	    option = option || { };
	//    var error = 'sendJSON failed to load url "' + url + '"';
	    var request = new XMLHttpRequest();
	    if (request.overrideMimeType) {
	      request.overrideMimeType('text/plain');
	    }
	    var timeout = option.timeout || 0;
	    if (timeout) {
	      request.timeout = timeout;
	      log("set timeout to: " + request.timeout);
	    }
	    request.open('POST', url, true);
	    var js = JSON.stringify(jsonObject);
	    var callCallback = function(error, json) {
	      if (callback) {
	        log("calling-callback:" + (error ? " has error" : "success"));
	        callback(error, json);
	        callback = undefined;  // only call it once.
	      }
	    };
	//    var handleAbort = function(e) {
	//      log("--abort--");
	//      callCallback("error (abort) sending json to " + url);
	//    }
	    var handleError = function(/*e*/) {
	      log("--error--");
	      callCallback("error sending json to " + url);
	    };
	    var handleTimeout = function(/*e*/) {
	      log("--timeout--");
	      callCallback("timeout sending json to " + url);
	    };
	    var handleForcedTimeout = function(/*e*/) {
	      if (callback) {
	        log("--forced timeout--");
	        request.abort();
	        callCallback("forced timeout sending json to " + url);
	      }
	    };
	    var handleFinish = function() {
	      log("--finish--");
	      var json = undefined;
	      // HTTP reports success with a 200 status. The file protocol reports
	      // success with zero. HTTP does not use zero as a status code (they
	      // start at 100).
	      // https://developer.mozilla.org/En/Using_XMLHttpRequest
	      var success = request.status === 200 || request.status === 0;
	      if (success) {
	        try {
	          json = JSON.parse(request.responseText);
	        } catch (e) {
	          success = false;
	        }
	      }
	      callCallback(success ? null : 'could not load: ' + url, json);
	    };
	    try {
	      // Safari 7 seems to ignore the timeout.
	      if (timeout) {
	        setTimeout(handleForcedTimeout, timeout + 50);
	      }
	      request.addEventListener('load', handleFinish, false);
	      request.addEventListener('timeout', handleTimeout, false);
	      request.addEventListener('error', handleError, false);
	      request.setRequestHeader("Content-type", "application/json");
	      request.send(js);
	      log("--sent: " + url);
	    } catch (e) {
	      log("--exception--");
	      setTimeout(function() {
	        callCallback('could not load: ' + url, null);
	      }, 0);
	    }
	  };

	  return {
	    sendJSON: sendJSON,
	  };
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));



/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/*
	 * Copyright 2014, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of its
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */
	"use strict";

	/**
	 * @module Misc
	 */
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {

	  const window = (Function('return this;')());
	  if (!window.location) {
	    window.location = {
	      search: '',
	    };
	  }

	  /**
	   * Copies properties from obj to dst recursively.
	   * @param {Object} obj Object with new settings.
	   * @param {Object} dst Object to receive new settings.
	   * @param {number?} opt_overwriteBehavior
	   *     *   0/falsy = overwrite
	   *
	   *         src    = {foo:'bar'}
	   *         dst    = {foo:'abc'}
	   *         result = {foo:'bar'}
	   *
	   *     *   1 = don't overwrite but descend if deeper
	   *
	   *         src    = {foo:{bar:'moo','abc':def}}
	   *         dst    = {foo:{bar:'ghi'}}
	   *         result = {foo:{bar:'ghi','abc':def}}
	   *
	   *         'foo' exists but we still go deeper and apply 'abc'
	   *
	   *     *   2 = don't overwrite don't descend
	   *
	   *             src    = {foo:{bar:'moo','abc':def}}
	   *             dst    = {foo:{bar:'ghi'}}
	   *             result = {foo:{bar:'ghi'}}
	   *
	   *         'foo' exists so we don't go any deeper
	   *
	   */
	  var copyProperties = function(src, dst, opt_overwriteBehavior) {
	    Object.keys(src).forEach(function(key) {
	      if (opt_overwriteBehavior === 2 && dst[key] !== undefined) {
	        return;
	      }
	      var value = src[key];
	      if (value instanceof Array) {
	        var newDst = dst[key];
	        if (!newDst) {
	          newDst = [];
	          dst[name] = newDst;
	        }
	        copyProperties(value, newDst, opt_overwriteBehavior);
	      } else if (value instanceof Object &&
	                 !(value instanceof Function) &&
	                 !(value instanceof HTMLElement)) {
	        var newDst2 = dst[key];
	        if (!newDst2) {
	          newDst2 = {};
	          dst[key] = newDst2;
	        }
	        copyProperties(value, newDst2, opt_overwriteBehavior);
	      } else {
	        if (opt_overwriteBehavior === 1 && dst[key] !== undefined) {
	          return;
	        }
	        dst[key] = value;
	      }
	    });
	    return dst;
	  };

	  function searchStringToObject(str, opt_obj) {
	    if (str[0] === '?') {
	      str = str.substring(1);
	    }
	    var results = opt_obj || {};
	    str.split("&").forEach(function(part) {
	      var pair = part.split("=").map(decodeURIComponent);
	      results[pair[0]] = pair[1] !== undefined ? pair[1] : true;
	    });
	    return results;
	  }

	  function objectToSearchString(obj) {
	    return "?" + Object.keys(obj).filter(function(key) {
	      return obj[key] !== undefined;
	    }).map(function(key) {
	      return encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]);
	    }).join("&");
	  }

	  /**
	   * Reads the query values from a URL like string.
	   * @param {String} url URL like string eg. http://foo?key=value
	   * @param {Object} [opt_obj] Object to attach key values to
	   * @return {Object} Object with key values from URL
	   * @memberOf module:Misc
	   */
	  var parseUrlQueryString = function(str, opt_obj) {
	    var dst = opt_obj || {};
	    try {
	      var q = str.indexOf("?");
	      var e = str.indexOf("#");
	      if (e < 0) {
	        e = str.length;
	      }
	      var query = str.substring(q + 1, e);
	      searchStringToObject(query, dst);
	    } catch (e) {
	      console.error(e);
	    }
	    return dst;
	  };

	  /**
	   * Reads the query values from the current URL.
	   * @param {Object=} opt_obj Object to attach key values to
	   * @return {Object} Object with key values from URL
	   * @memberOf module:Misc
	   */
	  var parseUrlQuery = function(opt_obj) {
	    return searchStringToObject(window.location.search, opt_obj);
	  };

	  /**
	   * Read `settings` from URL. Assume settings it a
	   * JSON like URL as in http://foo?settings={key:value},
	   * Note that unlike real JSON we don't require quoting
	   * keys if they are alpha_numeric.
	   *
	   * @param {Object=} opt_obj object to apply settings to.
	   * @param {String=} opt_argumentName name of key for settings, default = 'settings'.
	   * @return {Object} object with settings
	   * @func applyUrlSettings
	   * @memberOf module:Misc
	   */
	  var fixKeysRE = new RegExp("([a-zA-Z0-9_]+)\:", "g");

	  var applyUrlSettings = function(opt_obj, opt_argumentName) {
	    var argumentName = opt_argumentName || 'settings';
	    var src = parseUrlQuery();
	    var dst = opt_obj || {};
	    var settingsStr = src[argumentName];
	    if (settingsStr) {
	      var json = settingsStr.replace(fixKeysRE, '"$1":');
	      var settings = JSON.parse(json);
	      copyProperties(settings, dst);
	    }
	    return dst;
	  };

	  /**
	   * Gets a function checking for prefixed versions
	   *
	   * example:
	   *
	   *     var lockOrientation = misc.getFunctionByPrefix(window.screen, "lockOrientation");
	   *
	   * @param {object} obj object that has function
	   * @param {string} funcName name of function
	   * @return {function?} or undefined if it doesn't exist
	   */
	  var prefixes = ["", "moz", "webkit", "ms"];
	  function getFunctionByPrefix(obj, funcName) {
	    var capitalName = funcName.substr(0, 1).toUpperCase() + funcName.substr(1);
	    for (var ii = 0; ii < prefixes.length; ++ii) {
	      var prefix = prefixes[ii];
	      var name = prefix + prefix ? capitalName : funcName;
	      var func = obj[name];
	      if (func) {
	        return func.bind(obj);
	      }
	    }
	  }

	  /**
	   * Creates an invisible iframe and sets the src
	   * @param {string} src the source for the iframe
	   * @return {HTMLIFrameElement} The iframe
	   */
	  function gotoIFrame(src) {
	    var iframe = document.createElement("iframe");
	    iframe.style.display = "none";
	    iframe.src = src;
	    document.body.appendChild(iframe);
	    return iframe;
	  }

	  /**
	   * get a random int
	   * @param {number} value max value exclusive. 5 = random 0 to 4
	   * @return {number} random int
	   * @memberOf module:Misc
	   */
	  var randInt = function(value) {
	    return Math.floor(Math.random() * value);
	  };

	  /**
	   * get a random CSS color
	   * @param {function(number): number?) opt_randFunc function to generate random numbers
	   * @return {string} random css color
	   * @memberOf module:Misc
	   */
	  var randCSSColor = function(opt_randFunc) {
	    var randFunc = opt_randFunc || randInt;
	    var strong = randFunc(3);
	    var colors = [];
	    for (var ii = 0; ii < 3; ++ii) {
	      colors.push(randFunc(128) + (ii === strong ? 128 : 64));
	    }
	    return "rgb(" + colors.join(",") + ")";
	  };

	  /**
	   * Gets a random element from array
	   * @param {Array<*>} array array to select element from
	   * @return {*} picked element
	   */
	  function pickRandomElement(array) {
	    return array[randInt(array.length)];
	  }

	  /**
	   * get a random 32bit color
	   * @param {function(number): number?) opt_randFunc function to generate random numbers
	   * @return {string} random 32bit color
	   * @memberOf module:Misc
	   */
	  var rand32BitColor = function(opt_randFunc) {
	    var randFunc = opt_randFunc || randInt;
	    var strong = randFunc(3);
	    var color = 0xFF;
	    for (var ii = 0; ii < 3; ++ii) {
	      color = (color << 8) | (randFunc(128) + (ii === strong ? 128 : 64));
	    }
	    return color;
	  };

	  /**
	   * finds a CSS rule.
	   * @param {string} selector
	   * @return {Rule?} matching css rule
	   * @memberOf module:Misc
	   */
	  var findCSSStyleRule = function(selector) {
	    for (var ii = 0; ii < document.styleSheets.length; ++ii) {
	      var styleSheet = document.styleSheets[ii];
	      var rules = styleSheet.cssRules || styleSheet.rules;
	      if (rules) {
	        for (var rr = 0; rr < rules.length; ++rr) {
	          var rule = rules[rr];
	          if (rule.selectorText === selector) {
	            return rule;
	          }
	        }
	      }
	    }
	  };

	  /**
	   * Inserts a text node into an element
	   * @param {HTMLElement} element element to have text node insert
	   * @return {HTMLTextNode} the created text node
	   * @memberOf module:Misc
	   */
	  var createTextNode = function(element) {
	    var txt = document.createTextNode("");
	    element.appendChild(txt);
	    return txt;
	  };

	  /**
	   * Returns the absolute position of an element for certain browsers.
	   * @param {HTMLElement} element The element to get a position
	   *        for.
	   * @returns {Object} An object containing x and y as the
	   *        absolute position of the given element.
	   * @memberOf module:Misc
	   */
	  var getAbsolutePosition = function(element) {
	    var r = { x: element.offsetLeft, y: element.offsetTop };
	    if (element.offsetParent) {
	      var tmp = getAbsolutePosition(element.offsetParent);
	      r.x += tmp.x;
	      r.y += tmp.y;
	    }
	    return r;
	  };

	  /**
	   * Clamp value
	   * @param {Number} v value to clamp
	   * @param {Number} min min value to clamp to
	   * @param {Number} max max value to clamp to
	   * @returns {Number} v clamped to min and max.
	   * @memberOf module:Misc
	   */
	  var clamp = function(v, min, max) {
	    return Math.max(min, Math.min(max, v));
	  };

	  /**
	   * Clamp in both positive and negative directions.
	   * Same as clamp(v, -max, +max)
	   *
	   * @param {Number} v value to clamp
	   * @param {Number} max max value to clamp to
	   * @returns {Number} v clamped to -max and max.
	   * @memberOf module:Misc
	   */
	  var clampPlusMinus = function(v, max) {
	    return clamp(v, -max, max);
	  };

	  /**
	   * Return sign of value
	   *
	   * @param {Number} v value
	   * @returns {Number} -1 if v < 0, 1 if v > 0, 0 if v == 0
	   * @memberOf module:Misc
	   */
	  var sign = function(v) {
	    return v < 0 ? -1 : (v > 0 ? 1 : 0);
	  };

	  /**
	   * Takes which ever is closer to zero
	   * In other words minToZero(-2, -1) = -1 and minToZero(2, 1) = 1
	   *
	   * @param {Number} v value to min
	   * @param {Number} min min value to use if v is less then -min
	   *        or greater than +min
	   * @returns {Number} min or v, which ever is closer to zero
	   * @memberOf module:Misc
	   */
	  var minToZero = function(v, min) {
	    return Math.abs(v) < Math.abs(min) ? v : min;
	  };

	  /**
	   * flips 0->max to max<-0 and 0->min to min->0
	   * In otherwords
	   *     max: 3, v: 2.7  =  0.3
	   *     max: 3, v:-2.7  = -0.3
	   *     max: 3, v: 0.2  =  2.8
	   *     max: 3, v:-0.2  = -2.8
	   *
	   * @param {Number} v value to flip.
	   * @param {Number} max range to flip inside.
	   * @returns {Number} flipped value.
	   * @memberOf module:Misc
	   */
	  var invertPlusMinusRange = function(v, max) {
	    return sign(v) * (max - Math.min(max, Math.abs(v)));
	  };

	  /**
	   * Convert degrees to radians
	   *
	   * @param {Number} d value in degrees
	   * @returns {Number} d in radians
	   * @memberOf module:Misc
	   */
	  var degToRad = function(d) {
	    return d * Math.PI / 180;
	  };

	  /**
	   * Converts radians to degrees
	   * @param {Number} r value in radians
	   * @returns {Number} r in degrees
	   * @memberOf module:Misc
	   */
	  var radToDeg = function(r) {
	    return r * 180 / Math.PI;
	  };

	  /**
	   * Resizes a cavnas to match its CSS displayed size.
	   * @param {Canvas} canvas canvas to resize.
	   * @param {boolean?} useDevicePixelRatio if true canvas will be
	   *        created to match devicePixelRatio.
	   * @memberOf module:Misc
	   */
	  var resize = function(canvas, useDevicePixelRatio) {
	    var mult = useDevicePixelRatio ? window.devicePixelRatio : 1;
	    mult = mult || 1;
	    var width  = Math.floor(canvas.clientWidth  * mult);
	    var height = Math.floor(canvas.clientHeight * mult);
	    if (canvas.width !== width ||
	        canvas.height !== height) {
	      canvas.width = width;
	      canvas.height = height;
	      return true;
	    }
	  };

	  /**
	   * Copies all the src properties to the dst
	   * @param {Object} src an object with some properties
	   * @param {Object} dst an object to receive copes of the properties
	   * @return returns the dst object.
	   */
	  function applyObject(src, dst) {
	    Object.keys(src).forEach(function(key) {
	      dst[key] = src[key];
	    });
	    return dst;
	  }

	  /**
	   * Merges the proprties of all objects into a new object
	   *
	   * Example:
	   *
	   *     var a = { abc: "def" };
	   *     var b = { xyz: "123" };
	   *     var c = Misc.mergeObjects(a, b);
	   *
	   *     // c = { abc: "def", xyz: "123" };
	   *
	   * Later object properties take precedence
	   *
	   *     var a = { abc: "def" };
	   *     var b = { abc: "123" };
	   *     var c = Misc.mergeObjects(a, b);
	   *
	   *     // c = { abc: "123" };
	   *
	   * @param {...Object} object objects to merge.
	   * @return an object containing the merged properties
	   */
	  function mergeObjects(object) {  // eslint-disable-line
	    var merged = {};
	    Array.prototype.slice.call(arguments).forEach(function(src) {
	      if (src) {
	        applyObject(src, merged);
	      }
	    });
	    return merged;
	  }

	  /**
	   * Creates a random id
	   * @param {number} [digits] number of digits. default 16
	   */
	  function makeRandomId(digits) {
	    digits = digits || 16;
	    var id = "";
	    for (var ii = 0; ii < digits; ++ii) {
	      id = id + ((Math.random() * 16 | 0)).toString(16);
	    }
	    return id;
	  }

	  /**
	   * Applies an object of listeners to an emitter.
	   *
	   * Example:
	   *
	   *     applyListeners(someDivElement, {
	   *       mousedown: someFunc1,
	   *       mousemove: someFunc2,
	   *       mouseup: someFunc3,
	   *     });
	   *
	   * Which is the same as
	   *
	   *     someDivElement.addEventListener("mousedown", someFunc1);
	   *     someDivElement.addEventListener("mousemove", someFunc2);
	   *     someDivElement.addEventListener("mouseup", someFunc3);
	   *
	   * @param {Emitter} emitter some object that emits events and has a function `addEventListener`
	   * @param {Object.<string, function>} listeners eventname function pairs.
	   */
	  function applyListeners(emitter, listeners) {
	    Object.keys(listeners).forEach(function(name) {
	      emitter.addEventListener(name, listeners[name]);
	    });
	  }

	  return {
	    applyObject: applyObject,
	    applyUrlSettings: applyUrlSettings,
	    applyListeners: applyListeners,
	    clamp: clamp,
	    clampPlusMinus: clampPlusMinus,
	    copyProperties: copyProperties,
	    createTextNode: createTextNode,
	    degToRad: degToRad,
	    findCSSStyleRule: findCSSStyleRule,
	    getAbsolutePosition: getAbsolutePosition,
	    getFunctionByPrefix: getFunctionByPrefix,
	    gotoIFrame: gotoIFrame,
	    invertPlusMinusRange: invertPlusMinusRange,
	    makeRandomId: makeRandomId,
	    mergeObjects: mergeObjects,
	    minToZero: minToZero,
	    objectToSearchString: objectToSearchString,
	    parseUrlQuery: parseUrlQuery,
	    parseUrlQueryString: parseUrlQueryString,
	    pickRandomElement: pickRandomElement,
	    radToDeg: radToDeg,
	    randInt: randInt,
	    randCSSColor: randCSSColor,
	    rand32BitColor: rand32BitColor,
	    resize: resize,
	    sign: sign,
	    searchStringToObject: searchStringToObject,
	  };
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));



/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/*
	 * Copyright 2014, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of its
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	"use strict";

	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	  //var SocketIOClient = function(options) {
	  //  options = options || {};
	  //  console.log("Using direct Socket.io");
	  //  var _socket;
	  //  var _connected = false;
	  //
	  //  if (!window.io) {
	  //    console.log("no socket io");
	  //    _socket = {
	  //      send: function() { }
	  //    };
	  //    return;
	  //  }
	  //
	  //  var url = options.url || "http://" + window.location.host;
	  //  console.log("connecting to: " + url);
	  //  _socket = io.connect(url);
	  //
	  //  this.isConnected = function() {
	  //    return _socket.readyState === WebSocket.OPEN;
	  //  };
	  //
	  //  this.on = function(eventName, fn) {
	  //    _socket.on(eventName, fn);
	  //  };
	  //
	  //  this.send = function(msg) {
	  //    _socket.emit('message', msg);
	  //  };
	  //};

	  var WebSocketClient = function(options) {
	    options = options || {};
	    var log = options.quiet === true ? console.log.bind(console) : function() {};
	    var _socket;

	    var url = options.url || "ws://" + window.location.host;
	    log("connecting to: " + url);
	    _socket = new WebSocket(url);

	    this.__defineGetter__("readyState", function() {
	      return _socket.readyState;
	    });

	    this.isConnected = function() {
	      return _socket.readyState === WebSocket.OPEN;
	    };

	    var sendLowLevel = function(str) {
	      if (_socket.readyState === WebSocket.OPEN) {
	        _socket.send(str);
	      }
	    };

	    this.on = function(eventName, fn) {
	      switch (eventName) {
	      case 'connect':
	        _socket.onopen = fn;
	        break;
	      case 'disconnect':
	        _socket.onclose = fn;
	        break;
	      case 'error':
	        _socket.onerror = fn;
	        break;
	      case 'message':
	        _socket.onmessage = function(event) {
	          // Respond to ping.
	          if (event.data === 'P') {
	            sendLowLevel('P');
	            return;
	          }
	          try {
	            var obj = JSON.parse(event.data);
	          } catch (e) {
	            console.log(e);
	          }
	          if (obj) {
	            fn(obj);
	          }
	        };
	        break;
	      }
	    };

	    this.send = function(msg) {
	      sendLowLevel(JSON.stringify(msg));
	    };

	    this.close = function() {
	     _socket.close();
	    };
	  };

	  //return SocketIOClient;
	  return WebSocketClient;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));



/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*
	 * Copyright 2014, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of its
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	"use strict";

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(2),
	    __webpack_require__(4),
	    __webpack_require__(7),
	    __webpack_require__(5),
	  ], __WEBPACK_AMD_DEFINE_RESULT__ = function(
	    Cookie,
	    misc,
	    NetPlayer,
	    VirtualSocket) {

	  var emptyMsg = { };

	  /**
	   * @typedef {Object} GameServer~Options
	   * @property {Socket} [socket] Socket to use for communications
	   * @property {boolean} [quiet] true = don't print any console messages
	   * @property {boolean} [reconnectOnDisconnect]
	   */

	  /**
	   * GameServer is used by a game to talk to the various
	   * controllers (phones) of the people playing the game.
	   * @constructor
	   * @alias GameServer
	   * @param {GameServer~Options} [options] options.
	   */
	  var GameServer = function(options) {
	    options = options || {};
	    var log = options.quiet ? function() {} : console.log.bind(console);
	    var _connected = false;
	    var _socket;

	    if (!options.url) {
	      var query = misc.parseUrlQuery();
	      options.url = query.hftUrl;
	    }

	    // Used in case the game tries to send messages to the server before it's connected.
	    // This way the game does not have to wait for a connection to send startup messages.
	    // Not sure there's a point to that :(
	    var _sendQueue = [];
	    var _numPlayers = 0;
	    var _players = {};  // by id
	    var _totalPlayerCount = 0;
	    var _eventListeners = {};
	    var _systemMsgHandler;
	    var _connectData = {
	      id: undefined,
	      needNewHFT: undefined,
	    };
	    var _getters = {};
	    Object.keys(_connectData).forEach(function(key) {
	      _getters[key] = function() {
	        throw "you can't read " + key + " before you've connected";
	      };
	      Object.defineProperty(this, key, {
	        get: function() {
	          return _getters[key]();
	        },
	        set: function() {},
	        enumerable: true,
	        configurable: true,
	      });
	    }.bind(this));
	    var _reloaded = false;

	    if (!options.gameId) {
	      options.gameId = "HFTHTML5";
	    }

	    this.setSystemMsgHandler_ = function(handler) {
	      _systemMsgHandler = handler;
	    };

	    /**
	     * Event that we've connected to happyFunTimes
	     *
	     * @event GameServer#connected
	     */

	    /**
	     * Event that we've been disconnected from happyFunTimes
	     *
	     * @event GameServer#disconnected
	     */

	    /**
	     * Event that a new player has joined the game.
	     *
	     * @event GameServer#playerconnected
	     * @param {NetPlayer} netPlayer a NetPlayer used to communicate
	     *        with the controller for the player.
	     */

	    /**
	     * Adds an event listener for the given event type. Valid
	     * commands include 'connect' (we connected to happyFunTimes),
	     * 'disconnect' we were disconnected from the relaysefver,
	     * 'playerconnect' a new player has joined the game.
	     *
	     * @param {string} eventType name of event
	     * @param {GameServer~Listener} listener callback to call for
	     *        event.
	     */
	    this.addEventListener = function(eventType, listener) {
	      _eventListeners[eventType] = listener;
	    };

	    /**
	     * Same as addEventListener
	     */
	    this.on = this.addEventListener;

	    /**
	     * @callback GameServer~Listener
	     * @param {Object} data data from sender.
	     */

	    /**
	     * Removes an eventListener
	     * @param {string} eventType name of event
	     */
	    this.removeEventListener = function(eventType) {
	      _eventListeners[eventType] = undefined;
	    };

	    var sendEvent_ = function(eventType, args) {
	      var fn = _eventListeners[eventType];
	      if (fn) {
	        fn.apply(this, args);
	      }
	    }.bind(this);

	    var removePlayer_ = function(id) {
	      var player = _players[id];
	      if (player) {
	        player.sendEvent_('disconnect', []);
	        delete _players[id];
	        --_numPlayers;
	      }
	    };

	    var handleStartPlayer_ = function(msg) {
	      var id = msg.id;
	      var name = msg.name;

	      // Ignore if we already have a player with this id.
	      if (_players[id]) {
	        return;
	      }

	      // Make up a name if no name given.
	      if (!name) {
	        name = "Player" + (++_totalPlayerCount);
	      }

	      var player = new NetPlayer(this, id, msg.data, name);
	      _players[id] = player;
	      ++_numPlayers;
	      sendEvent_('playerconnect', [player, name, msg.data]);
	    }.bind(this);

	    var getPlayer_ = function(id) {
	      var player = _players[id];
	      return player;
	    };

	    var handleUpdatePlayer_ = function(msg) {
	      var player = getPlayer_(msg.id);
	      if (!player) {
	        return;
	      }
	      player.sendEvent_(msg.data.cmd, [msg.data.data]); // FIX: Seems like gameserver should not know how to deal with this.
	    };

	    var handleRemovePlayer_ = function(msg) {
	      removePlayer_(msg.id);
	    };

	    var handleSystemMsg_ = function(msg) {
	      if (_systemMsgHandler) {
	        _systemMsgHandler(msg.data);
	      }
	    };

	    var handleLogMsg_ = function(data) {
	      var fn = console[data.type] || console.log;
	      fn.call(console, data.msg);
	    };

	    var handleGameMsg_ = function(msg) {
	      sendEvent_(msg.data.cmd, [msg.data.data, msg.id]);
	    };

	    var handleGameStart_ = function(msg) {
	      Object.keys(_connectData).forEach(function(key) {
	        _connectData[key] = msg.data[key];
	        _getters[key] = function() {
	          return _connectData[key];
	        };
	      });
	      sendEvent_('connect', [msg.data]);
	    };

	    var messageHandlers = {
	      gamestart: handleGameStart_,
	      update: handleUpdatePlayer_,
	      upgame: handleGameMsg_,
	      remove: handleRemovePlayer_,
	      start: handleStartPlayer_,
	      system: handleSystemMsg_,
	      log: handleLogMsg_,
	    };

	    var processMessage_ = function(msg) {
	      var fn = messageHandlers[msg.cmd];
	      if (fn) {
	        fn(msg);
	      } else {
	        console.error("Unknown Message: " + msg.cmd);
	      }
	    };

	    /**
	     * True if we're connected to happyFunTimes
	     * @returns {Boolean} true if were connected.
	     */
	    this.isConnected = function() {
	      return _connected;
	    };

	    /**
	     * True if we were auto-reloaded after a disconnect.
	     * This happens if HFT stops running and then is re-started
	     * @return {Boolean} true if this is a reload.
	     */
	    this.isReloaded = function() {
	      return _reloaded;
	    };

	    var connect_ = function() {
	      _socket = options.socket || new VirtualSocket(options);
	      _sendQueue = [];
	      _socket.on('connect', connected_.bind(this));  // eslint-disable-line
	      _socket.on('message', processMessage_.bind(this));
	      _socket.on('disconnect', disconnected_.bind(this));  // eslint-disable-line
	    }.bind(this);

	    var connected_ = function() {
	      log("connected");
	      _connected = true;
	      this.sendCmd("server", -1, options);
	      for (var ii = 0; ii < _sendQueue.length; ++ii) {
	        _socket.send(_sendQueue[ii]);
	      }
	      _sendQueue = [];

	      // This `preconnect` message is a kind of hack.
	      // This used to be a `connect` message but
	      // I needed to be able to pass an `id` back to the
	      // connect message. On top of that, GameSupport
	      // was using the `connect` message. In order to allow
	      // games using `GameSupport` to use the `connect` message
	      // I changed this to `_hft_preconnect`. Games can therefore
	      // receive teh `connect` message. I changed `GameSupport`
	      // to a watch for `_hft_preconnect`
	      sendEvent_('_hft_preconnect');
	    }.bind(this);

	    var disconnected_ = function() {
	      log("disconnected");
	      _connected = false;
	      sendEvent_('disconnect');
	      while (_numPlayers > 0) {
	        for (var id in _players) {
	          if (Object.hasOwnProperty.call(_players, id)) {
	            removePlayer_(id);
	          }
	          break;
	        }
	      }

	      if (options.reconnectOnDisconnect) {
	        setTimeout(connect_, 2000);
	      }
	    };

	    var send_ = function(msg) {
	      if (!_socket.isConnected()) {
	        _sendQueue.push(msg);
	      } else {
	        _socket.send(msg);
	      }
	    };

	    /**
	     * This sends a command to the 'happyFunTimes'. happyFunTimes uses 'cmd' to figure out what to do
	     *  and 'id' to figure out which client this is for. 'data' will be delieved to that client.
	     *
	     * Only NetPlayer should call this.
	     *
	     * @private
	     * @param {String} cmd name of command to send
	     * @param {String} id id of client to relay command to
	     * @param {Object=} data a jsonifiable object to send.
	     */
	    this.sendCmd = function(cmd, id, data) {
	      if (data === undefined) {
	        data = emptyMsg;
	      }
	      var msg = {
	        cmd: cmd,
	        id: id,
	        data: data,
	      };
	      send_(msg);
	    };

	    /**
	     * Sends a command to all controllers connected to this server.
	     * It's effectively the same as iterating over all NetPlayers
	     * returned in playerconnect events and calling sendCmd on each
	     * one. The difference is only one message is sent from the
	     * server (here) to happyFunTimes. happyFunTimes then sends
	     * the same message to each client.
	     *
	     * @param {String} cmd name of command to send
	     * @param {Object} [data] a jsonifyable object.
	     */
	    this.broadcastCmd = function(cmd, data) {
	      if (data === undefined) {
	        data = emptyMsg;
	      }
	      this.sendCmd('broadcast', -1, {cmd: cmd, data: data});
	    };

	    this.sendCmdToGame = function(cmd, id, data) {
	      if (data === undefined) {
	        data = emptyMsg;
	      }
	      this.sendCmd('peer', id, {cmd: cmd, data: data});
	    };

	    /**
	     * Sends a command to all games, including yourself.
	     */
	    this.broadcastCmdToGames = function(cmd, data) {
	      if (data === undefined) {
	        data = emptyMsg;
	      }
	      this.sendCmd('bcastToGames', -1, {cmd: cmd, data: data});
	    };

	    connect_();
	  };

	  return GameServer;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));




/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/*
	 * Copyright 2014, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of its
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	"use strict";

	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	  /**
	   * Manages a player across the net.
	   *
	   * **NOTE: YOU DO NOT CREATE THESE DIRECTLY**. They are created
	   * by the `GameServer` whenever a new player joins your game.
	   * They are passed to you in the 'playerconnect' event from
	   * `GameServer`
	   *
	   * @constructor
	   * @private
	   * @alias NetPlayer
	   * @param {GameServer} server
	   * @param {number} id
	   * @param {string} name
	   */
	  var NetPlayer = function(server, id, data) {
	    var _server = server;
	    var _id = id;
	    var _eventListeners = { };
	    var _internalListeners = { };
	    var _connected = true;
	    var _sessionId = data ? data.__hft_session_id__ : undefined;
	    var _self = this;
	    var _emptyMsg = {};
	    var _busy = false;

	    function sendCmd(cmd, msg) {
	      if (!_connected) {
	        return;
	      }
	      if (msg === undefined) {
	        msg = _emptyMsg;
	      }
	      _server.sendCmd("client", _id, {cmd: cmd, data: msg});
	    }

	    /**
	     * Sends a message to this player.
	     *
	     * @method
	     * @param {string} cmd
	     * @param {object} [msg] a jsonifyable object.
	     */
	    this.sendCmd = sendCmd;

	    /**
	     * Adds an event listener
	     *
	     * You make up these events. Calling
	     *
	     *     GameClient.sendCmd('someEvent', { foo: 123 });
	     *
	     * In the controller (the phone) will emit an event `someEvent`
	     * which will end up calling the listener. That listener will be
	     * passed the data. In the example above that data is
	     * `{foo:123}`
	     *
	     *     function handleSomeEvent(data) {
	     *       console.log("foo = " + data.foo);
	     *     }
	     *
	     *     someNetPlayer.addEventListener('someEvent', handleSomeEvent);
	     *
	     *
	     * @param {string} eventType name of event.
	     * @param {function(object)} listener function to call when event
	     *        arrives
	     */
	    this.addEventListener = function(eventType, listener) {
	      switch (eventType) {
	        case 'disconnect':
	          listener = function(listener) {
	            return function() {
	               _self.removeAllListeners();
	               _connected = false;
	               return listener.apply(_self, arguments);
	            };
	          }(listener);
	          break;
	      }
	      _eventListeners[eventType] = listener;
	    };

	    /**
	     * Synonym for {@link Netplayer#addEventListener}.
	     * @method
	     * @param {string} eventType name of event.
	     * @param {function(object)} listener function to call when event
	     *        arrives
	     */
	    this.on = this.addEventListener;

	    /**
	     * Removes an event listener
	     * @param {string} eventType name of event to remove
	     */
	    this.removeEventListener = function(eventType) {
	      _eventListeners[eventType] = undefined;
	    };

	    /**
	     * Removes all listeners
	     */
	    this.removeAllListeners = function() {
	      _eventListeners = { };
	    };

	    var _sendEvent = function(eventType, args) {
	      var fn = _eventListeners[eventType] || _internalListeners[eventType];
	      if (fn) {
	        fn.apply(this, args);
	      } else {
	        console.error("NetPlayer: Unknown Event: " + eventType);
	      }
	    };
	    this.sendEvent_ = _sendEvent;

	    var _sendEventIfHandler = function(eventType, args) {
	      if (_eventListeners[eventType]) {
	        _sendEvent(eventType, args);
	      }
	    };

	    /**
	     * Moves this player to another game.
	     *
	     * You can use this function to make multi-computer / multi-screen
	     * games. See [hft-tonde-iko](http://github.com/greggman/hft-tonde-iko)
	     * as an example.
	     *
	     * @param {string} gameId id of game to send player to
	     * @param {*} data data to give to game receiving the player.
	     */
	    this.switchGame = function(gameId, data) {
	      if (_connected) {
	        _server.sendCmd("switchGame", _id, {gameId: gameId, data: data});
	        _connected = false;
	      }
	    };

	    function ignoreMsg() {
	    }

	    function handleLogMsg(data) {
	      var fn = console[data.type] || console.log;
	      fn.call(console, data.msg);
	    }

	    _internalListeners["_hft_log_"] = handleLogMsg;

	    /**
	     * Whether or not this netplayer is connected.
	     * you shouldn't need to look at this. Use 'disconnect' event.
	     * @return {boolean} true if player is connected.
	     */
	    this.isConnected = function() {
	      return _connected;
	    };

	    /**
	     * A sessionId for this player
	     *
	     * This id should be the same if they disconnect and later reconnect
	     * so you can use it to restore their state if you want.
	     * @return {string} session id for player
	     */
	    this.getSessionId = function() {
	      return _sessionId;
	    };

	    /**
	     * A unique id for this NetPlayer object.
	     *
	     * this id will not repeat even if the user disconnects and reconnects.
	     * @return {string} id for player
	     */
	    this.getId = function() {
	      return _id;
	    };
	  };

	  /**
	   * Event that the player has left.
	   * @event NetPlayer#disconnected
	   */

	  return NetPlayer;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));



/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/*
	 * Copyright 2014, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of its
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	"use strict";

	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	  /**
	   * Shell class for offline use.
	   *
	   * You can use this class as a substitute for NetPlayer when
	   * offline. It provides a no-op version of sendCmd so when
	   * your game tries to send a message to the contoller nothing
	   * happens.
	   *
	   * It also provides a sendEvent method you can use to trigger
	   * events in your game as though they were from the controller.
	   *
	   *     if (!globals.haveServer) {
	   *       // We're testing locally so just manually create a
	   *       // player.
	   *
	   *       var localNetPlayer1 = new LocalNetPlayer();
	   *       var player1 = new MyPlayer(localNetPlayer1);
	   *       addPlayer(player1);
	   *
	   *       // pretend player1 one got a message from the
	   *       // controller when any key is pressed
	   *
	   *       window.addEventListner('keypress', function() {
	   *         localNetPlayer1.sendEvent('jump', { power: 10 });
	   *       });
	   *
	   *     } else {
	   *
	   *       // We're online so create players as they connect.
	   *       var server = new GameServer(...);
	   *       server.addEventListener(
	   *           'playerconnect',
	   *           function(netPlayer) {
	   *             addPlayer(new MyPlayer(netPlayer));
	   *           });
	   *
	   * @constructor
	   * @alias LocalNetPlayer
	   */
	  var LocalNetPlayer = (function() {
	    var _count = 0;
	    return function() {
	      this.id = ++_count;
	      this.eventHandlers = { };
	      this.gameEventHandlers = { };
	    };
	  }());

	  /**
	   * see {@link NetPlayer.addEventListener}
	   */
	  LocalNetPlayer.prototype.addEventListener = function(eventType, handler) {
	    this.eventHandlers[eventType] = handler;
	  };

	  /**
	   * see {@link NetPlayer.addEventListener}
	   */
	  LocalNetPlayer.prototype.on = LocalNetPlayer.prototype.addEventListener;

	  /**
	   * see {@link NetPlayer.removeEventListener}
	   */
	  LocalNetPlayer.prototype.removeEventListener = function(eventType) {
	    this.eventHandlers[eventType] = undefined;
	  };

	  /**
	   * see {@link NetPlayer.removeAllListeners}
	   */
	  LocalNetPlayer.prototype.removeAllListeners = function() {
	    this.eventHanders = { };
	  };

	  /*
	   */
	  LocalNetPlayer.prototype.addGameEventListener = function(eventType, handler) {
	    this.gameEventHandlers[eventType] = handler;
	  };

	  /*
	   */
	  LocalNetPlayer.prototype.removeGameEventListener = function(eventType) {
	    this.gameEventHandlers[eventType] = undefined;
	  };

	  /*
	   */
	  LocalNetPlayer.prototype.removeGameAllListeners = function() {
	    this.gameEventHanders = { };
	  };

	  LocalNetPlayer.prototype.sendCmd = function(cmd, data) {
	    var fn = this.gameEventHandlers[cmd];
	    if (fn) {
	      fn.call(this, data);
	    }
	  };

	  /**
	   * Sends an event to this netplayer.
	   *
	   * Use this to emit synthetic events into the game. Effectively
	   * whatever messages you're sending from your controller you can
	   * send here based on events on the computer. In other words to
	   * simulate having a phone connected you can emit events based
	   * on mouse movement or keypressed that correspond to the same
	   * events that would have been emitted if a phone was actually
	   * connected and programmed to send similar events.
	   */
	  LocalNetPlayer.prototype.sendEvent = function(eventType, data) {
	    var fn = this.eventHandlers[eventType];
	    if (fn) {
	      fn.call(this, data);
	    } else {
	      console.error("LocalNetPlayer: Unknown Event: " + eventType);
	    }
	  };

	  LocalNetPlayer.prototype.switchGame = function(/*id, data*/) {
	  };

	  return LocalNetPlayer;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));




/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*
	 * Copyright 2014, Gregg Tavares.
	 * All rights reserved.
	 *
	 * Redistribution and use in source and binary forms, with or without
	 * modification, are permitted provided that the following conditions are
	 * met:
	 *
	 *     * Redistributions of source code must retain the above copyright
	 * notice, this list of conditions and the following disclaimer.
	 *     * Redistributions in binary form must reproduce the above
	 * copyright notice, this list of conditions and the following disclaimer
	 * in the documentation and/or other materials provided with the
	 * distribution.
	 *     * Neither the name of Gregg Tavares. nor the names of its
	 * contributors may be used to endorse or promote products derived from
	 * this software without specific prior written permission.
	 *
	 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	"use strict";

	/**
	 * Synced clock support
	 * @module SyncedClock
	 */
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = function(IO) {

	  /**
	   * A clock, optionally synced across the network
	   * @constructor
	   * @alias Clock
	   * @memberof module:SyncedClock
	   * @private
	   */

	  /**
	   * @method getTime
	   * @memberOf module:SyncedClock.Clock
	   * @returns {number} current time in seconds.
	   */

	  /**
	   * Creates a clock, optionally synced across machines.
	   *
	   * @param {boolean} online true = synced, false = local
	   * @param {number?} opt_syncRateSeconds how often to sync clocks
	   *        in seconds. Default is once every 10 seconds
	   * @param {callback?} opt_callback called the first time the
	   *        clock is synchronized.
	   * @returns {Clock} the created clock
	   * @memberOf module:SyncedClock
	   */
	  var createClock = function(online, opt_syncRateSeconds, opt_callback) {

	    if (!window.performance) {
	      window.performance = {};
	    }
	    if (!window.performance.now) {
	      window.performance.now = function() {
	        return Date.now();
	      };
	    }

	    var lrClock = function() {
	      return (new Date()).getTime() * 0.001;
	    };

	    var hrClock = (function() {
	      var startTime = lrClock();
	      var startHrTime = window.performance.now();

	      return function() {
	        var currentHrTime = window.performance.now();
	        var elapsedHrTime = currentHrTime - startHrTime;
	        return startTime + elapsedHrTime * 0.001;
	      };
	    }());

	    var getLocalTime = (window.performance && window.performance.now) ? hrClock : lrClock;

	    /**
	     * A clock that gets the local current time in seconds.
	     * @private
	     */
	    var LocalClock = function(opt_callback) {
	      if (opt_callback) {
	        setTimeout(opt_callback, 1);
	      }
	    };

	    /**
	     * Gets the current time in seconds.
	     */
	    LocalClock.prototype.getTime = function() {
	      return getLocalTime();
	    };

	    /**
	     * A clock that gets the current time in seconds attempting to
	     * keep the clock synced to the server.
	     * @constructor
	     */
	    var SyncedClock = function(opt_syncRateSeconds, callback) {
	      var url = window.location.href;
	      var syncRateMS = (opt_syncRateSeconds || 10) * 1000;
	      var timeOffset = 0;

	      var syncToServer = function(queueNext) {
	        var sendTime = getLocalTime();
	        IO.sendJSON(url, {cmd: 'time'}, function(exception, obj) {
	          if (exception) {
	            console.error("syncToServer: " + exception);
	          } else {
	            var receiveTime = getLocalTime();
	            var duration = receiveTime - sendTime;
	            var serverTime = obj.time + duration * 0.5;
	            timeOffset = serverTime - receiveTime;
	            if (callback) {
	              callback();
	              callback = undefined;
	            }
	            //g_services.logger.log("duration: ", duration, " timeOff:", timeOffset);
	          }

	          if (queueNext) {
	            setTimeout(function() {
	              syncToServer(true);
	            }, syncRateMS);
	          }
	        });
	      };
	      var syncToServerNoQueue = function() {
	        syncToServer(false);
	      };
	      syncToServer(true);
	      setTimeout(syncToServerNoQueue, 1000);
	      setTimeout(syncToServerNoQueue, 2000);
	      setTimeout(syncToServerNoQueue, 4000);

	      /**
	       * Gets the current time in seconds.
	       * @private
	       */
	      this.getTime = function() {
	        return getLocalTime() + timeOffset;
	      };

	    };

	    return online ? new SyncedClock(opt_syncRateSeconds, opt_callback) : new LocalClock(opt_callback);
	  };

	  return {
	    createClock: createClock,
	  };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));



/***/ }
/******/ ])
});
;