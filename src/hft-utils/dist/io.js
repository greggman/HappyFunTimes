/*
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

/**
 * Misc IO functions
 * @module IO
 */
define(function() {
  var log = function() { };
  //var log = console.log.bind(console);

  /**
   * @typedef {Object} Request~Options
   * @memberOf module:IO
   * @property {number?} timeout. Timeout in ms to abort.
   *        Default = no-timeout
   * @property {string?} method default = POST.
   * @property {string?} inMimeType default = text/plain
   * @property {Object{key,value}} headers
   */

  /**
   * Make an http request request
   * @memberOf module:IO
   * @param {string} url url to request.
   * @param {string?} content to send.
   * @param {!function(error, string, xml)} callback Function to
   *        call on success or failure. If successful error will
   *        be null, object will be result from request.
   * @param {module:IO~Request~Options?} options
   */
  var request = function(url, content, callback, options) {
    content = content || "";
    options = options || { };
    var error = 'send failed to load url "' + url + '"';
    var request = new XMLHttpRequest();
    if (request.overrideMimeType) {
      request.overrideMimeType(options.mimeTime || 'text/plain');
    }
    var timeout = options.timeout || 0;
    if (timeout) {  // IE11 doesn't like setting timeout to 0???!?
      request.timeout = timeout;
    }
    log("set timeout to: " + request.timeout);
    request.open(options.method || 'POST', url, true);
    var callCallback = function(error, json) {
      if (callback) {
        log("calling-callback:" + (error ? " has error" : "success"));
        callback(error, json);
        callback = undefined;  // only call it once.
      }
    };
    var handleAbort = function(e) {
      log("--abort--");
      callCallback("error (abort) sending json to " + url);
    }
    var handleError = function(e) {
      log("--error--");
      callCallback("error sending json to " + url);
    }
    var handleTimeout = function(e) {
      log("--timeout--");
      callCallback("timeout sending json to " + url);
    };
    var handleForcedTimeout = function(e) {
      if (callback) {
        log("--forced timeout--");
        request.abort();
        callCallback("forced timeout sending json to " + url);
      }
    }
    var handleFinish = function() {
      log("--finish--");
      // HTTP reports success with a 200 status. The file protocol reports
      // success with zero. HTTP does not use zero as a status code (they
      // start at 100).
      // https://developer.mozilla.org/En/Using_XMLHttpRequest
      var success = request.status == 200 || request.status == 0;
      callCallback(success ? null : 'could not load: ' + url, request.responseText);
    };
    try {
      // Safari 7 seems to ignore the timeout.
      if (timeout) {
        setTimeout(handleForcedTimeout, timeout + 50);
      }
      request.addEventListener('load', handleFinish, false);
      request.addEventListener('timeout', handleTimeout, false);
      request.addEventListener('error', handleError, false);
      if (options.headers) {
        Object.keys(options.headers).forEach(function(header) {
          request.setRequestHeader(header, options.headers[header]);
        });
      }
      request.send(content);
      log("--sent: " + url);
    } catch (e) {
      log("--exception--");
      setTimeout(function() { callCallback('could not load: ' + url, null) }, 0);
    }
  };

  /**
   * sends a JSON 'POST' request, returns JSON repsonse
   * @memberOf module:IO
   * @param {string} url url to POST to.
   * @param {Object=} jsonObject JavaScript object on which to
   *        call JSON.stringify.
   * @param {!function(error, object)} callback Function to call
   *        on success or failure. If successful error will be
   *        null, object will be json result from request.
   * @param {module:IO~Request~Options?} options
   */
  var sendJSON = function(url, jsonObject, callback, options) {
    var options = JSON.parse(JSON.stringify(options || {}));
    options.headers = options.headers || {};
    options.headers["Content-type"] = "application/json";
    return request(
      url,
      JSON.stringify(jsonObject),
      function(err, content) {
        if (err) {
          return callback(err);
        }
        try {
          var json = JSON.parse(content);
        } catch (e) {
          return callback(e);
        }
        callback(null, json);
      },
      options);
  };

  var makeMethodFunc = function(method) {
    return function(url, content, callback, options) {
      var options = JSON.parse(JSON.stringify(options || {}));
      options.method = method;
      return request(url, content, callback, options);
    };
  };

  return {
    get: makeMethodFunc("GET"),
    post: makeMethodFunc("POST"),
    "delete": makeMethodFunc("DELETE"),
    put: makeMethodFunc("PUT"),
    request: request,
    sendJSON: sendJSON,
  };
});


