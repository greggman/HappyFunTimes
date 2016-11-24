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

var events    = require('events');
var Promise   = require('promise');
var request   = require('request');

var getP = function(url) {
  return new Promise(function(fulfill, reject) {
    request.get(url, function(err, res, body) {
      if (err || res.statusCode !== 200) {
        reject(err || res.body.msg);
      } else {
        fulfill(res, body);
      }
    });
  });
};

var createServer = function() {
  return new Promise(function(resolve, reject) {
    var server = new HFTServer({
      port: 8087,
      extraPorts: [],
      privateServer: true,
    });
    server.on('ports', () => {
      resolve(server);
    });
    server.on('error', (...args) => {
      reject(...args);
    });
  });
};

var createMockHTTPServer = function() {
  var MockHTTPServer = function() {
    var eventEmitter = new events.EventEmitter();
    var self = this;

    this.once = eventEmitter.once.bind(eventEmitter);

    this.listen = function() {
      eventEmitter.emit('listening', self, 0);
    };

    this.close = function() {
    };
  };

  return new MockHTTPServer();
};

var createHFTServerWithMocks = function(callback) {

  var LocalWebSocketServer = require('../../server/localwebsocketserver');
  var HFTServer            = require('../../server/hft-server');
  var RelayServer          = require('../../server/relayserver.js');

  var MockResponse = function(callback) {
    this.headers = {};
    this.statusCode = -1;
    this.body = undefined;

    this.setHeader = function(key, value) {
      this.headers[key] = value;
    }.bind(this);

    this.writeHead = function(statusCode, headers) {
      this.statusCode = statusCode;
      if (headers) {
        Object.keys(headers).forEach(function(key) {
          this.headers[key] = headers[key];
        }.bind(this));
      }
      return this;
    }.bind(this);

    this.write = function(data, encoding) {
      if (this.body === undefined) {
        this.body = "";
      }
      this.body += data.toString(encoding);
      return this;
    }.bind(this);

    this.end = function(data, encoding) {
      if (data) {
        this.write(data, encoding);
      }
      var fn = callback;
      callback = undefined;
      setTimeout(function() {
        fn(this);
      }.bind(this), 0);
    }.bind(this);

  };

  var MockedHFTServer = function(callback) {
    var httpServer = createMockHTTPServer();
    var relayServer = new RelayServer([httpServer], {
      WebSocketServer: LocalWebSocketServer,
    });
    var hftServer = hftServer = new HFTServer({
      port: 0, // should not be used.
      extraPorts: [],
      privateServer: true,
      httpServer: httpServer,
      relayServer: relayServer,
    });
    hftServer.on('ports', (ports) => {
      callback(null, ports);
    });
    hftServer.on('error', (err) => {
      callback(err);
    });

    this.close = function() {
      hftServer.close();
    };

    var request = function(req, callback) {
      var eventEmitter = new events.EventEmitter();
      req.on = eventEmitter.on.bind(eventEmitter);
      req.once = eventEmitter.once.bind(eventEmitter);
      req.addListener = eventEmitter.addListener.bind(eventEmitter);
      var res = new MockResponse(callback);
      hftServer.handleRequest(req, res);
      return eventEmitter;
    };

    var getP = function(url) {
      return new Promise(function(resolve /*, reject */) {
        request({
          url: url,
          method: 'GET',
          headers: {
          },
        }, resolve);
      });
    };

    var postP = function(url, body) {
      return new Promise(function(resolve /*, reject */) {
        var emitter = request({
          url: url,
          method: 'POST',
          headers: {
            "content-type": "application/json",
            "content-length": Buffer.byteLength(body, 'utf8'),
          },
        }, resolve);
        emitter.emit('data', body);
        emitter.emit('end');
        emitter.emit('close');
      });
    };

    var postJSONP = function(url, obj) {
      return postP(url, JSON.stringify(obj));
    };

    var getSocketServer = function() {
      return relayServer.getSocketServers()[0];
    };

    this.getP = getP;
    this.postP = postP;
    this.postJSONP = postJSONP;
    this.request = request;
    this.getSocketServer = getSocketServer;
  };

  return new MockedHFTServer(callback);
};

exports.getP = getP;
exports.createServer = createServer;
exports.createMockHTTPServer = createMockHTTPServer;
exports.createHFTServerWithMocks = createHFTServerWithMocks;


