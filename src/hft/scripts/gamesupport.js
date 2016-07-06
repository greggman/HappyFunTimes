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
 * Implements the common parts of HappyFunTimes games written in
 * JavaScript.
 *
 * It provides a render loop with frame count and game clock as
 * well as handles pausing the game during development so as
 * not to deplete the battries on your laptop. It can also show
 * the framerate and display debugging info.
 *
 * @module GameSupport
 */
define([
    './misc/cookies',
    './misc/gameclock',
    './misc/logger',
    './misc/misc',
    './misc/strings',
  ], function(
    Cookie,
    GameClock,
    Logger,
    Misc,
    strings) {

  var $ = function(id) {
    return document.getElementById(id);
  };

  var stats = {
    begin: function() { },
    end: function() { },
  };

  var statusNode;
  var logger = new Logger.NullLogger();

  /**
   * @typedef {Object} GameSupport~InitOptions
   * @property {boolean?} showFPS true adds a fps display
   * @property {boolean?} debug un-hides the debug html elements
   * @property {number?} numConsoleLines number of lines to show for the debug console.
   * @property {boolean?} haveServer false This is bad name but
   *           it's used to suggest you don't want to connect to
   *           happyFunTimes
   * @memberOf module:GameSupport
   *
   * You can add text to the debug console with
   * `GameSupport.log(msg)` or `GameSupport.error(msg)`
   * which are no-ops if `debug` is false.
   *
   * Similarly you can display status with
   * `GameSupport.setStatus("foo\nbar");`
   */

  /**
   * Initializes the game support
   * @param {GameServer?} server The GameServer you created for
   *        the game.
   * @param {module:GameSupport.GameSupport~InitOptions} options
   * @memberOf module:GameSupport
   *
   */
  var init = function(server, options) {
    var handleConnected = function() {
      $('hft-disconnected').style.display = "none";
    };

    var handleDisconnected = function() {
      $('hft-disconnected').style.display = "block";
    };

    if (options.haveServer !== false && server) {
      server.addEventListener('connect', handleConnected);
      server.addEventListener('disconnect', handleDisconnected);
    }

    var handleInstructions = function(data) {
      var hftConnectElem = $("hft-connect");
      var hftConnectStyle = hftConnectElem.style;
      hftConnectStyle.display = data.msg ? "block" : "none";
      if (!data.msg) {
        return;
      }
      if (data.bottom) {
        hftConnectStyle.top = "auto";
        hftConnectStyle.bottom = "0";
      } else {
        hftConnectStyle.top = "0";
        hftConnectStyle.bottom = "auto";
      }
      $("hft-ins").innerHTML = data.msg;

      var style = document.createElement("style");
      var css = document.createTextNode("");

      var computeAnim = function() {
        var padding = 100;
        var msgWidth = $("hft-ins").clientWidth;
        var bodyWidth = document.body.clientWidth;

        if (msgWidth < bodyWidth) {
          css.nodeValue = "";
          return;
        }

        var width = msgWidth + padding;
        var start = bodyWidth;
        var end = -width - padding;
        var duration = Math.abs(start - end) / 60;

        var anim = strings.replaceParams([
          "#hft-ins { animation: hft-ins-anim %(duration)ss linear infinite; }",
          "@keyframes hft-ins-anim { 0% { transform: translateX(%(start)spx); } 100% { transform: translateX(%(end)spx); } }",
        ].join("\n"), {
          duration: duration,
          start: start,
          end: end,
        });

        css.nodeValue = anim;
      };

      style.appendChild(css);
      document.body.appendChild(style);
      computeAnim();
      window.addEventListener('resize', computeAnim, false);

    };

    if (options.debug) {
      statusNode = document.createTextNode("");
      $("hft-status").appendChild(statusNode);
      var debugCSS = Misc.findCSSStyleRule("#hft-debug");
      debugCSS.style.display = "block";

      logger = new Logger.HTMLLogger($("hft-console"), options.numConsoleLines);
    }
  };

  /**
   * @typedef {Object} GameSupport~RunGlobals
   *
   * @param {number} elapsedTime time elapsed in seconds since
   *        last frame
   * @param {number} frameCount count of frames since the game
   *        started
   * @param {boolean?} haveServer if false will pause when it
   *        doens't have the focus.
   * @param {boolean?} pauseOnBlur if true will pause when it
   *        doesn't have the focus.
   * @param {boolean?} step:        if true will step one tick for
   *        each mouse click
   * @param {number?} fixedFramerate If set will advance the clock
   *        this amount each frame. Useful for debugging because
   *        otherwise when you pause in the debugger the clock
   *        keeps ticking and you get some larger timestep
   *
   */

  /**
   * Starts the render loop.
   * @memberOf module:GameSupport
   * @param {module:GameSupport.GameSupport~RunGlobals} globals
   * @param {callback} fn This function will be called once every
   *        60th of a second but may be paused if haveServer =
   *        false or pauseOnBlur = true when the window does not
   *        have the focus.
   */
  function run(globals, fn) {
    var clock = new GameClock();
    globals.frameCount = 0;
    globals.gameTime = 0;

    var requestId;

    function requestLoop(result) {
      requestId = result ? undefined : requestAnimationFrame(loop);  // eslint-disable-line
    }

    function loop() {
      globals.elapsedTime = globals.fixedFramerate || clock.getElapsedTime();
      globals.gameTime += globals.elapsedTime;
      ++globals.frameCount;

      var result = fn();
      requestLoop(result);
    }

    var start = function() {
      if (requestId === undefined) {
        requestLoop(false);
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
  }

  /**
   * Sets the content of the status element. Only visible of debug
   * is true.
   * @memberOf module:GameSupport
   * @param {string} str value to set the status
   */
  var setStatus = function(str) {
    if (statusNode) {
      statusNode.nodeValue = str;
    }
  };

  /**
   * Logs a msg to the HTML based console that is only visible
   * when debug = true.
   * @memberOf module:GameSupport
   * @param {string} str msg to add to log
   */
  var log = function(str) {
    logger.log(str);
  };

  /**
   * Logs an error to the HTML based console that is only visible
   * when debug = true.
   * @memberOf module:GameSupport
   * @param {string} str msg to add to log
   */
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

