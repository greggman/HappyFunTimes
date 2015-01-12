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

/**
 * Synced clock support
 * @module SyncedClock
 */
define(["./io"], function(IO) {

  /**
   * A clock, optionally synced across the network
   * @constructor
   * @alias Clock
   * @memberof module:SyncedClock
   * @private
   */

  /**
   * @method getTime
   * @memberOf module:SyncedClock.Clock
   * @returns {number} current time in seconds.
   */

  /**
   * Creates a clock, optionally synced across machines.
   *
   * @param {boolean} online true = synced, false = local
   * @param {number?} opt_syncRateSeconds how often to sync clocks
   *        in seconds. Default is once every 10 seconds
   * @param {callback?} opt_callback called the first time the
   *        clock is synchronized.
   * @returns {Clock} the created clock
   * @memberOf module:SyncedClock
   */
  var createClock = function(online, opt_syncRateSeconds, opt_callback) {

    if (!window.performance) {
      window.performance = {};
    }
    if (!window.performance.now) {
      window.performance.now = function() {
        return Date.now();
      };
    }

    var lrClock = function() {
      return (new Date()).getTime() * 0.001;
    };

    var hrClock = (function() {
      var startTime = lrClock();
      var startHrTime = window.performance.now();

      return function() {
        var currentHrTime = window.performance.now();
        var elapsedHrTime = currentHrTime - startHrTime;
        return startTime + elapsedHrTime * 0.001;
      };
    }());

    var getLocalTime = (window.performance && window.performance.now) ? hrClock : lrClock;

    /**
     * A clock that gets the local current time in seconds.
     * @private
     */
    var LocalClock = function(opt_callback) {
      if (opt_callback) {
        setTimeout(opt_callback, 1);
      }
    };

    /**
     * Gets the current time in seconds.
     */
    LocalClock.prototype.getTime = function() {
      return getLocalTime();
    };

    /**
     * A clock that gets the current time in seconds attempting to
     * keep the clock synced to the server.
     * @constructor
     */
    var SyncedClock = function(opt_syncRateSeconds, callback) {
      var url = window.location.href;
      var syncRateMS = (opt_syncRateSeconds || 10) * 1000;
      var timeOffset = 0;

      var syncToServer = function(queueNext) {
        var sendTime = getLocalTime();
        IO.sendJSON(url, {cmd: 'time'}, function(exception, obj) {
          if (exception) {
            console.error("syncToServer: " + exception);
          } else {
            var receiveTime = getLocalTime();
            var duration = receiveTime - sendTime;
            var serverTime = obj.time + duration * 0.5;
            timeOffset = serverTime - receiveTime;
            if (callback) {
              callback();
              callback = undefined;
            }
            //g_services.logger.log("duration: ", duration, " timeOff:", timeOffset);
          }

          if (queueNext) {
            setTimeout(function() {
              syncToServer(true);
            }, syncRateMS);
          }
        });
      };
      var syncToServerNoQueue = function() {
        syncToServer(false);
      };
      syncToServer(true);
      setTimeout(syncToServerNoQueue, 1000);
      setTimeout(syncToServerNoQueue, 2000);
      setTimeout(syncToServerNoQueue, 4000);

      /**
       * Gets the current time in seconds.
       * @private
       */
      this.getTime = function() {
        return getLocalTime() + timeOffset;
      };

    };

    return online ? new SyncedClock(opt_syncRateSeconds, opt_callback) : new LocalClock(opt_callback);
  };

  return {
    createClock: createClock,
  };
});

