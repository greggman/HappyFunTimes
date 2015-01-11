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
 * @typedef {Object} HeartMonitor~Options
 * @property {callback} onDead
 * @property {callback} pingFn
 * @property {string?} id // used for debugging
 */

var HeartMonitor = function(options) {

  var intervalId;
  var timeout = 15; // 15 seconds
  var timeoutCheckInterval = timeout / 2;
  var waitingForPing = false;
  var timeOfLastMessageFromPlayer;

  var getTime = function() {
    return Date.now() * 0.001;
  };

  var resetTimeout = function() {
    timeOfLastMessageFromPlayer = getTime();
  };
  this.stillAlive = resetTimeout();

  var checkTimeout = function() {
    // How much time has passed since last message
    var now = getTime();
    var elapsedTime = now - timeOfLastMessageFromPlayer;
    if (elapsedTime >= timeout) {
      if (waitingForPing) {
        // No ping from player. Kill this
        this.close();
        options.onDead();
      } else {
        // send ping
        waitingForPing = true;
        options.pingFn();
      }
    }
  };
  intervalId = setInterval(checkTimeout, timeoutCheckInterval * 1000);
  resetTimeout();

  var pingAcknowledged = function() {
    waitingForPing = false;
    resetTimeout();
  };
  this.acknowledgePing = pingAcknowledged;

  this.close = function() {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };
};

module.exports = HeartMonitor;


