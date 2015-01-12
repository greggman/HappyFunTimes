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
 * A module or provide `setTimeout` and `setInterval` like functionality
 * but that's based on a clock provided by the game. This is useful
 * especially during debugging because you might pause in the debugger.
 * normal timeouts and intervals will not pause. These will. Similarly
 * if you slowed the clock down (bullet time) these timers could slow
 * down too.
 *
 * @module Timeout
 */
define(function() {

  var s_nextId = 0;
  var s_clockInMs = 0;

  // always sorted by next to trigger.
  var s_timeouts = [];
  var s_timeoutsToInsert = [];
  var s_timeoutsToRemoveById = [];

  var insertTimeout = function(timeout) {
    var timeToTrigger = timeout.timeToTrigger;
    var start = 0;
    var end   = s_timeouts.length;
    while (start < end) {
      var index = start + (end - start) / 2 | 0;
      var otherTimeToTrigger = s_timeouts[index].timeToTrigger;
      if (timeToTrigger < otherTimeToTrigger) {
        end = index;
      } else if (timeToTrigger > otherTimeToTrigger) {
        start = index + 1;
      } else {
        break;
      }
    }
    s_timeouts.splice(index, 0, timeout);
  };

  //var removeTimeout = function(timeout) {
  //  var ndx = s_timeouts[timeout];
  //  if (ndx >= 0) {
  //    s_timeouts.splice(ndx, 1);
  //  }
  //};

  var removeTimeoutById = function(id) {
    for (var ii = 0; ii < s_timeouts.length; ++ii) {
      if (s_timeouts[ii].id === id) {
        s_timeouts.splice(ii, 1);
        return;
      }
    }
  };

  var makeTimeout = function(callback) {
    return {
      id: ++s_nextId,
      callback: callback,
    };
  };

  var setTriggerTime = function(timeout, timeInMs) {
    timeout.timeToTrigger = s_clockInMs + timeInMs;
  };

  /**
   * Same as normal setTimeout
   * @param {callback} callback function to call when it times out
   * @param {number} timeInMs duration of timeout
   * @return {number} id for timeout
   * @memberOf module:Timeout
   */
  var setTimeout = function(callback, timeInMs) {
    var timeout = makeTimeout(callback);
    setTriggerTime(timeout, timeInMs);
    s_timeoutsToInsert.push(timeout);
    return timeout.id;
  };

  /**
   * Same as normal setInterval
   * @param {callback} callback function to call at each interval
   * @param {number} timeInMs duration of internval
   * @return {number} id for interval
   * @memberOf module:Timeout
   */
  var setInterval = function(callback, timeInMs) {
    var timeout = makeTimeout(function() {
      setTriggerTime(timeout, timeout.timeInMs);
      s_timeoutsToInsert.push(timeout);
      callback();
    });
    timeout.timeInMs = timeInMs;
    s_timeoutsToInsert.push(timeout);
    return timeout.id;
  };

  /**
   * Same as normal clearTimeout
   * @param {number} id of timeout to clear.
   * @memberOf module:Timeout
   */
  var clearTimeout = function(id) {
    s_timeoutsToRemoveById.push(id);
  };

  /**
   * Same as normal clearInterval
   * @param {number} id of interval to clear.
   * @memberOf module:Timeout
   */
  var clearInterval = function(id) {
    s_timeoutsToRemoveById.push(id);
  };

  /**
   * Processes the intervals and timeouts
   *
   * This is how you control the clock for the timouts
   *
   * A typical usage might be
   *
   *
   *     var g = {};
   *     GameSupport.run(g, mainloop);
   *
   *     function mainloop() {
   *       Timeout.process(globals.elapsedTime);
   *     };
   *
   * @param {number} elapsedTimeInSeconds number of seconds to advance the clock.
   * @memberOf module:Timeout
   */
  var process = function(elapsedTimeInSeconds) {
    // insert any unscheduled timeouts
    if (s_timeoutsToInsert.length) {
      s_timeoutsToInsert.forEach(insertTimeout);
      s_timeoutsToInsert = [];
    }

    // Now remove any
    if (s_timeoutsToRemoveById.length) {
      s_timeoutsToRemoveById.forEach(removeTimeoutById);
      s_timeoutsToRemoveById = [];
    }

    s_clockInMs += elapsedTimeInSeconds * 1000;

    // process timeouts
    for (var ii = 0; ii < s_timeouts.length; ++ii) {
      var timeout = s_timeouts[ii];
      if (s_clockInMs < timeout.timeToTrigger) {
        break;
      }
      timeout.callback();
    }

    // remove expired timeouts
    s_timeouts.splice(0, ii);
  };

  return {
    clearInterval: clearInterval,
    clearTimeout: clearTimeout,
    process: process,
    setInterval: setInterval,
    setTimeout: setTimeout,
  };
});
