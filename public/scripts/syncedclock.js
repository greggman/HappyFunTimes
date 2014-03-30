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

define(["./io"], function(IO) {
  return {
    createClock: (function(online, opt_syncRateSeconds, opt_callback) {

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
      var SyncedClock = function(opt_syncRateSeconds, opt_callback) {
        this.url = window.location.href;
        this.syncRateMS = (opt_syncRateSeconds || 10) * 1000;
        this.timeOffset = 0;
        this.callback = opt_callback;
        this.syncToServer();
      };

      SyncedClock.prototype.syncToServer = function() {
        var that = this;
        var sendTime = getLocalTime();
        IO.sendJSON(this.url, {cmd: 'time'}, function(obj, exception) {
          if (exception) {
            //g_services.logger.error("syncToServer: " + exception);
          } else {
            var receiveTime = getLocalTime();
            var duration = receiveTime - sendTime;
            var serverTime = obj.time + duration * 0.5;
            that.timeOffset = serverTime - receiveTime;
            if (that.callback) {
              that.callback();
              that.callback = undefined;
            }
            //g_services.logger.log("duration: ", duration, " timeOff:", that.timeOffset);
          }
          setTimeout(function() {
              that.syncToServer();
            }, that.syncRateMS);
        });
      };

      /**
       * Gets the current time in seconds.
       * @private
       */
      SyncedClock.prototype.getTime = function() {
        return getLocalTime() + this.timeOffset;
      };

      return online ? new SyncedClock(opt_syncRateSeconds, opt_callback) : new LocalClock(opt_callback);
    }),
  };
});

