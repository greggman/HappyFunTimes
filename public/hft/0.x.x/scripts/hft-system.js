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

define([
    './eventemitter',
    './gameclient',
    './misc/gameclock',
  ], function(
    EventEmitter,
    GameClient,
    GameClock
  ) {

  /**
   * Handles talking to the HFT System for system level stuff.
   */
  var HFTSystem = function() {
    var g = {
      clock: new GameClock(),
      eventEmitter: new EventEmitter(),
      connected: false,
    };

    var noop = function() {
    };

    var handleConnect = function() {
      g.connected = true;
      g.eventEmitter.emit('connect');
    };

    var handleDisconnect = function() {
      if (g.connected) {
        g.connected = false;
        g.eventEmitter.emit('disconnect');
      }
      g.client = undefined;
      // Don't try more than once a second.
      var elapsedTime = Math.floor(g.clock.getElapsedTime() * 1000);
      var timeout = Math.max(1000 - elapsedTime, 0);
      setTimeout(tryToConnect, timeout);
    };

    var handleRunningGames = function(data) {
      g.eventEmitter.emit('runningGames', data);
    };

    var tryToConnect = function() {
      // just read time so the next time we read it we'll get the time since this read.
      g.clock.getElapsedTime();

      g.client = new GameClient({gameId: "__hft__"});
      g.client.addEventListener('connect', handleConnect);
      g.client.addEventListener('disconnect', handleDisconnect);
      g.client.addEventListener('hftInfo', noop);
      g.client.addEventListener('gameExited', noop);
      g.client.addEventListener('runningGames', handleRunningGames);
      g.client.sendCmd('getRunningGames');
    };

    setTimeout(tryToConnect, 0);

    this.on = g.eventEmitter.on.bind(g.eventEmitter);
    this.addEventListener = this.on;
    this.removeEventListener = g.eventEmitter.removeEventListener.bind(g.eventEmitter);
  };

  return HFTSystem;
});


