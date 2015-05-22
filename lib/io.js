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

"use strict";

var url = require('url');

/**
 * @typedef {sendJSON~Options}
 * @property {string?} method Default = 'POST'
 * @property {object?} headers key/value headers
 * @property {number?} timeout timeout
 */

/**
 * @callback {sendJSON~Callback}
 * @param {??} error
 * @param {object} result
 */

/**
 * make a json based request.
 *
 * @param {string} apiurl
 * @param {object} obj Object to send
 * @param {sendJSON~Options} options
 * @param {sendJSON~Callback} callback
 */
var validProtocols = {
  http: true,
  https: true,
};

var sendJSON = function(apiurl, obj, options, callback) {
  options = JSON.parse(JSON.stringify(options));
  var parsedUrl = url.parse(apiurl);

  options.hostname = parsedUrl.hostname || "";
  options.port     = parsedUrl.port || "";
  options.method   = options.method || 'POST';
  options.headers  = options.headers || {};
  options.path     = parsedUrl.path || "";
  var protocol     = parsedUrl.protocol || "";

  var callCallback = function(err, res) {
    if (callback) {
      var cb = callback;
      callback = undefined;
      cb(err, res);
    }
  };

  protocol = protocol.substring(0, protocol.length - 1);
  if (!validProtocols[protocol]) {
    setTimeout(function() {
      callCallback(new Error("unknown protocol for url: " + apiurl));
    }, 0);
    return;
  }

  var body = JSON.stringify(obj);
  var headers = options.headers;

  headers["content-length"] = Buffer.byteLength(body, "utf8");
  headers["content-type"]   = "application/json; charset=utf-8";
  var req = require(protocol).request(options, function(res) {
    res.setEncoding("utf8");
    var data = "";
    res.on("data", function(chunk) {
      data += chunk;
    });
    res.on("error", function(err) {
      callCallback(err);
    });
    res.on("end", function() {
      if (res.statusCode === 301 ||
          res.statusCode === 302 ||
          res.statusCode === 307 ||
          res.statusCode === 308) {
        sendJSON(res.headers["location"].toString(), obj, options, callCallback);
      } else if (res.statusCode >= 400 && res.statusCode < 600 || res.statusCode < 10) {
        callCallback(new Error("StatusCode: " + res.statusCode + "\n" + JSON.stringify(data, undefined, "  ")));
      } else {
        try {
          // TODO: based on content-type parse differently?
          callCallback(null, JSON.parse(data));
        } catch (e) {
          e.content = data;
          callCallback(e);
        }
      }
    });
  });

  if (options.timeout) {
    req.setTimeout(options.timeout);
  }

  req.on("error", function(e) {
    callCallback(e.message);
  });

  req.on("timeout", function() {
    callCallback(new error.GatewayTimeout());
  });

  req.write(body);
  req.end();
};

exports.sendJSON = sendJSON;




