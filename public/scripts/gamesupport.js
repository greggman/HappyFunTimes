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
    '../3rdparty/stats/stats.min',
    './misc/gameclock',
    './misc/logger',
    './misc/misc',
    './hft-splash',
  ], function(
    StatsJS,
    GameClock,
    Logger,
    Misc,
    HFTSplash) {

  var $ = function(id) {
    return document.getElementById(id);
  };

  var stats = {
    begin: function() { },
    end: function() { },
  };

  var statusNode;
  var logger = new Logger.NullLogger();

  // options:
  //   showFPS: true adds a fps display
  //   debug: un-hides the debug html elements
  //   numConsoleLines: number of lines to show for the debug console.
  //
  // You can add text to the debug console with
  // `GameSupport.log(msg)` or `GameSupport.error(msg)`
  // which are no-ops if `debug` is false.
  //
  // Similarly you can display status with
  // `GameSupport.setStatus("foo\nbar");`
  var init = function(server, options) {
    var showConnected = function() {
      $('hft-disconnected').style.display = "none";
    }

    var showDisconnected = function() {
      $('hft-disconnected').style.display = "block";
    }

    if (options.haveServer !== false && server) {
      server.addEventListener('connect', showConnected);
      server.addEventListener('disconnect', showDisconnected);
    }

    if (options.showGithub) {
      var gh = $("hft-github");
      if (gh) {
        gh.style.display = "block";
      }
    }

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
      statusNode = document.createTextNode("");
      $("hft-status").appendChild(statusNode);
      var debugCSS = Misc.findCSSStyleRule("#hft-debug");
      debugCSS.style.display = "block";

      logger = new Logger.HTMLLogger($("hft-console"), options.numConsoleLines);
    }
  };

  // globals that are checked/effected
  //
  //   elapsedTime: time elapsed in seconds since last frame
  //   frameCount:  count of frames
  //   haveServer:  if false will pause when it doens't have the focus.
  //   pauseOnBlur: if true will pause when it doesn't have the focus.
  //   step:        if true will step one tick for each mouse click
  //
  var run = function(globals, fn) {
    var clock = new GameClock();
    globals.frameCount = 0;

    var requestId;
    var loop = function() {
      stats.begin();

      globals.elapsedTime = clock.getElapsedTime();
      ++globals.frameCount;

      var result = fn();

      stats.end();

      requestId = result ? undefined : requestAnimationFrame(loop);
    };

    var start = function() {
      if (requestId === undefined) {
        loop();
      }
    };

    var stop = function() {
      if (requestId !== undefined) {
        cancelAnimationFrame(requestId);
        requestId = undefined;
      }
    };

    // The only reason this is here is because when you
    // open devtools in Chrome the game blurs. As the
    // devtools is expanded and contracted, if the game
    // is not running it won't respond to being resized.
    var updateOnce = function() {
      if (requestId === undefined) {
        start();
        stop();
      }
    };

    // This is here because running a game at 60fps
    // in my MacBook Pro switches the discrete GPU
    // and uses a ton of CPU as well, eating up my
    // battery. So, if I'm running locally I make
    // the game pause on blur which means effectively
    // it will stop anytime I switch back to my editor.
    if ((globals.haveServer === false && globals.pauseOnBlur !== false) || globals.pauseOnBlur) {
      window.addEventListener('blur', stop, false);
      window.addEventListener('focus', start, false);
      window.addEventListener('resize', updateOnce, false);
    }

    if (globals.step) {
      updateOnce();
      window.addEventListener('click', updateOnce, false);
    } else {
      start();
    }
  };

  var setStatus = function(str) {
    if (statusNode) {
      statusNode.nodeValue = str;
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

