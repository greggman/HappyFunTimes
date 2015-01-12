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
 * THEORY OF2 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

var WebSocketClient = function(options) {
  options = options || {};
  var socket;

  var url = options.url;
  var WebSocket = require('ws');

  socket = new WebSocket(url);

  Object.defineProperty(this, "readyState", {
    get: function() {
      return socket.readyState;
    },
  });

  var sendLowLevel = function(str) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(str);
    }
  };

  this.on = function(eventName, fn) {
    switch (eventName) {
    case 'connect':
      socket.onopen = fn;
      break;
    case 'disconnect':
      socket.onclose = fn;
      break;
    case 'error':
      socket.onerror = fn;
      break;
    case 'message':
      socket.onmessage = function(event) {
        // Respond to ping.
        if (event.data === 'P') {
          sendLowLevel('P');
          return;
        }
        fn(JSON.parse(event.data));
      };
      break;
    }
  };

  this.isConnected = function() {
    return socket.readyState === WebSocket.OPEN;
  };

  this.send = function(msg) {
    sendLowLevel(JSON.stringify(msg));
  };

  this.close = function() {
    socket.close();
  };
};

module.exports = WebSocketClient;


