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

define(function() {
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
});

