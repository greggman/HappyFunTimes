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

/**
 * This pseudo socket used to manage system level stuff. It
 * masqueraes as both a `WSClient` as defined in
 * WebSocketServer.js and as a 'WebSocketClient` as normally
 * defined in virutalsocket.js
 *
 * In other words, normally a WSClient is a server side object
 * and a WebSocketClient is a client side object. Data is passed
 * between them.
 *
 * This object those exists only on the server to simulate
 * a connection between the 2 things but allows the client
 * to stay on the server.
 *
 * @constructor
 */
var LoopbackServerSide = function() {
  var eventCallbacks = { };
  var client;
  var connected = true;

  this.setClient = function(c) {
    client = c;
  };

  this.send = function(msg) {
    if (connected) {
      client.emitEvent('message', {data:JSON.stringify(msg)});
    }
  };

  this.on = function(eventName, fn) {
    if (eventName === 'message') {
      fn = (function(fn) {
        return function(event) {
          fn(JSON.parse(event.data));
        };
      }(fn));
    }
    eventCallbacks[eventName] = fn;
  };

  this.emitEvent = function(eventName, event) {
    var cb = eventCallbacks[eventName];
    if (cb) {
      cb(event);
    }
  };

  this.disconnect = function() {
    if (connected) {
      connected = false;
      this.emitEvent('disconnect');
      client.disconnect();
    }
  };

  this.close = function() {
    this.disconnect();
  };

  this.clearTimeout = function() {
    // noop
  };

  this.isConnected = function() {
    return connected;
  };
};

var LoopbackClient = function() {
  var eventCallbacks = { };
  var connected = false;

  var server = new LoopbackServerSide();
  server.setClient(this);

  this.readyState = 1; //WebSocket.OPEN;
  this.server = server;

  this.on = function(eventName, fn) {
    if (eventName === 'message') {
      fn = (function(fn) {
        return function(event) {
          fn(JSON.parse(event.data));
        };
      }(fn));
    }
    eventCallbacks[eventName] = fn;
  };

  this.emitEvent = function(eventName, event) {
    var cb = eventCallbacks[eventName];
    if (cb) {
      cb(event);
    }
  };

  this.send = function(msg) {
    if (connected) {
      server.emitEvent('message', {data:JSON.stringify(msg)});
    }
  };

  this.isConnected = function() {
    return connected;
  };

  this.connect = function() {
    connected = true;
    this.emitEvent('connect');
  };

  this.disconnect = function() {
    if (connected) {
      connected = false;
      this.emitEvent('disconnect');
      server.disconnect();
    }
  };

  this.close = function() {
    this.disconnect();
  };
};

module.exports = LoopbackClient;

