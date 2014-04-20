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
    './gameclock',
    './logger',
    './misc',
    './stats.min',
  ], function(
    GameClock,
    Logger,
    Misc,
    StatsJS) {

  var stats = {
    begin: function() { },
    end: function() { },
  };

  var statusNode;
  var logger = new Logger.NullLogger();

  var init = function(server, options) {
    if (options.showFPS) {
      stats = new Stats();
      stats.setMode(0); // 0: fps, 1: ms

      // Align top-left
      var s = stats.domElement.style;
      s.position = 'absolute';
      s.right = '0px';
      s.top = '0px';

      document.body.appendChild(stats.domElement);
    }

    if (options.debug) {
      statusNode = $("hft-status").firstChild;
      var debugCSS = Misc.findCSSStyleRule("#hft-debug");
      debugCSS.style.display = "block";

      logger = new Logger.HTMLLogger($("hft-console"), options.numConsoleLines);
    }
  };

  var run = function(globals, fn) {
    var clock = new GameClock();

    var loop = function() {
      stats.begin();

      globals.elapsedTime = clock.getElapsedTime();
      ++globals.frameCount;

      fn();

      stats.end();
      requestAnimationFrame(loop);
    };
    loop();
  };

  var setStatus = function(str) {
    if (statusNode) {
      statusNode.value = str;
    }
  };

  var log = function(str) {
    logger.log(str);
  };

  var error = function(str) {
    logger.error(str);
  };

  return {
    init: init,
    run: run,
    log: log,
    error: error,
    setStatus: setStatus,
  };
});

