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

// TODO: replace console stuff

define(function() {

  var emptyMsg = {};

  /**
   * Manages a player across the net.
   *
   * @constructor
   *
   * @param {!GameServer} server
   * @param {number} id
   * @param {string} name
   */
  var NetPlayer = function(server, id) {
    this.server = server;
    this.id = id;
    this.eventHandlers = { };
  };

  /**
   * Sends a message to this player.
   *
   * @param msg
   */
  NetPlayer.prototype.sendCmd = function(cmd, msg) {
    if (msg === undefined) {
      msg = emptyMsg;
    }
    this.server.sendCmd("client", this.id, {cmd: cmd, data: msg});
  };

  NetPlayer.prototype.addEventListener = function(eventType, handler) {
    this.eventHandlers[eventType] = handler;
  };

  NetPlayer.prototype.removeEventListener = function(eventType) {
    this.eventHandlers[eventType] = undefined;
  };

  NetPlayer.prototype.removeAllListeners = function() {
    this.eventHanders = { };
  };

  NetPlayer.prototype.sendEvent_ = function(eventType, args) {
    var fn = this.eventHandlers[eventType];
    if (fn) {
      fn.apply(this, args);
    } else {
      console.error("Unknown Event: " + eventType);
    }
  };

  return NetPlayer;
});

