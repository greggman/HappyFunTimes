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

'use strict';

var debug        = require('debug')('happyfuntimes:websocketserver');
var HeartMonitor = require('./heart-monitor');

var WSServer = function(server) {
  debug('Using WebSockets directly');

  var WebSocketServer = require('ws').Server;
  var wss = new WebSocketServer({server: server});

  var WSClient = function(client) {
    this.client = client;

    var eventHandlers = { };
    var heartMonitor;

    this.send = function(msg) {
      var str = JSON.stringify(msg);
      try {
        this.client.send(str);
      } catch (e) {
        console.error(e);
      }
    };

    this.on = function(eventName, fn) {
      if (eventName === 'disconnect') {
        eventName = 'close';
        // Wrap close event so it only happens once.
        if (fn) {
          fn = function (origFn) {
            return function() {
              eventHandlers[eventName] = undefined;
              origFn();
            };
          }(fn);
        }
      }

      if (!eventHandlers[eventName]) {
        this.client.on(eventName, function() {
          var fn = eventHandlers[eventName];
          if (fn) {
            fn.apply(this, arguments);
          }
        }.bind(this));
      }

      if (eventName === 'message') {
        fn = function(origFn) {
          return function(data) {
            if (data === 'P') {
              heartMonitor.acknowledgePing();
              return;
            }
            if (origFn) {
              try {
                origFn(JSON.parse(data));
              } catch (e) {
                console.error(e, data.substr(0, 40));
              }
            }
          };
        }(fn);
      }
      eventHandlers[eventName] = fn;
    };

    this.clearTimeout = function() {
      heartMonitor.close();
    };

    this.close = function() {
      debug('close wsclient');
      heartMonitor.close();
      this.client.close();
    };

    heartMonitor = new HeartMonitor({
      onDead: function() {
        debug('dead: closed');
        this.close();
      }.bind(this),
      pingFn: function() {
        try {
          this.client.send('P');
        } catch (e) {
          console.error(e);
        }
      }.bind(this),
    });
  };

  this.on = function(eventName, fn) {
    if (eventName === 'connection') {
      wss.on(eventName, function(client) {
        var wrapper = new WSClient(client);
        fn(wrapper);
      });
    } else {
      wss.on(eventName, fn);  // does this case exist?
    }
  };

  this.close = function() {
    wss.close();
  };
};

module.exports = WSServer;

