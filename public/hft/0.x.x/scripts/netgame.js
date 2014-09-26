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

define([
  ], function() {

  var NetGame = function(gameServer, id, subId) {
    var _eventListeners = {};
    var _connected = true;

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
     * Removes an event listener
     * @param {string} eventType name of event to remove
     */
    this.removeEventListener = function(eventType) {
      _eventHandlers[eventType] = undefined;
    };

    /**
     * Removes all listeners
     */
    this.removeAllListeners = function() {
      _eventHanders = { };
    };

    var sendEvent_ = function(eventType, args) {
      var fn = _eventListeners[eventType];
      if (fn) {
        fn.apply(this, args);
      }
    }.bind(this);
    this.sendEvent_ = sendEvent_;

    this.sendCmd = function(cmd, data) {
      if (_connected) {
        gameServer.sendCmd("peer", this.id, {cmd: cmd, data: data});
      }
    };

    this.id = id;
    this.subId = subId;
  };

  return NetGame;
});


