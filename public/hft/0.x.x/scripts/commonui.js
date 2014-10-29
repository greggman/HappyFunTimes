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
 * Implements the common UI parts of HappyFunTimes for
 * contollers.
 * @module CommonUI
 */
define([
    './io',
    './hft-splash',
    './hft-system',
    './misc/fullscreen',
    './misc/misc',
    './misc/playername',
  ], function(
    IO,
    HFTSplash,
    HFTSystem,
    FullScreen,
    Misc,
    PlayerNameHandler) {

  var $ = function(id) {
    return document.getElementById(id);
  };

  /**
   * @typedef {Object} ControllerUI~Options
   * @property {callback?} function to call when controller
   *           connects to HappyFunTimes
   * @property {callback?} function to call when controller is
   *           disconncted from game.
   * @property {boolean?} debug True displays a status and debug
   *           html element
   * @memberOf module:CommonUI
   */

  /**
   * Sets up the standard UI for a happyFunTimes controller
   * (phone). Including handling being disconnected from the
   * current game and switching to new games as well as name
   * input and the gear menu.
   *
   * @param {GameClient} client The `GameClient` for the phone
   * @param {module:CommonUI.ControllerUI~Options} options
   * @memberOf module:CommonUI
   */
  var setupStandardControllerUI = function(client, options) {
    var hftSettings = window.hftSettings || {};
    var menuElement = $("hft-menu");
    var settingsElement = $("hft-settings");
    var disconnectedElement = $("hft-disconnected");
    var touchStartElement = $("hft-touchstart");

    if (!hftSettings.menu) {
      menuElement.style.display = "none";
    } else {
      menuElement.addEventListener('click', function() {
        settingsElement.style.display = "block";
      }, false);
    }

    // setup full screen support
    var requestFullScreen = function() {
      touchStartElement.removeEventListener('click', requestFullScreen, false);
      touchStartElement.style.display = "none";
      FullScreen.requestFullScreen(document.body);
    };

    var goFullScreenIfNotFullScreen = function(isFullScreen) {
      if (!isFullScreen) {
        touchStartElement.addEventListener('click', requestFullScreen, false);
        touchStartElement.style.display = "block";
      }
    };
    FullScreen.onFullScreenChange(document.body, goFullScreenIfNotFullScreen);

    // Try to detect if we're on mobile. I'm assuming it's not
    // common for window.innerWidth to match screen.availWidth
    // on desktop but that it is on mobile.
    var landscape = window.orientation == 90 || window.orientation == 270;
    var effectiveWidth = landscape ? screen.height : screen.width;
    if (window.innerWidth == effectiveWidth) {
      goFullScreenIfNotFullScreen(false);
    }

    var playerNameHandler = new PlayerNameHandler(client, $("hft-name"));

    $("hft-setname").addEventListener('click', function() {
      settingsElement.style.display = "none";
      playerNameHandler.startNameEntry();
    }, false);
    $("hft-restart").addEventListener('click', function() {
      window.location.reload();
    }, false);
    $("hft-exit").addEventListener('click', function() {
      window.location.href = "/";
    }, false);
    $("hft-back").addEventListener('click', function() {
      settingsElement.style.display = "none";
    });

//    $("hft-mainmenu").addEventListener('click', function() {
//      window.location.href = "/";
//    }, false);
//    $("hft-reload").addEventListener('click', function() {
//      window.location.reload();
//    });

    // This is not currently needed. The idea
    // was to show something else like "connecting"
    // until the user connected but that's mostly
    // pointless.
    client.addEventListener('connect', function() {
      disconnectedElement.style.display = "none";
      if (options.connectFn) {
        options.connectFn();
      }
    });

    client.addEventListener('disconnect', function() {
      disconnectedElement.style.display = "block";
      if (options.disconnectFn) {
        options.disconnectFn();
      }

      var hftSystem = new HFTSystem();
      hftSystem.on('runningGames', function(obj) {
        // Is the game running
        for (var ii = 0; ii < obj.length; ++ii) {
          var game = obj[ii];
          if (game.gameId == client.getGameId()) {
            // Yes! Reload
            window.location.reload();
            return;
          }
        }

        // Are any games running? If 1 game, go to it.
        if (obj.length == 1 && obj[0].controllerUrl) {
          window.location.href = obj[0].controllerUrl;
          return;
        }
        // If 2+ games, go to the menu.
        if (obj.length > 1) {
          // Go to main menu
          window.location.href = "/";
          return;
        }
      });
    });

    client.addEventListener('_hft_redirect_', function(data) {
      window.location.href = data.url;
    });

    if (options.debug) {
      var statusNode = document.createTextNode("");
      $("hft-status").appendChild(statusNode);
      var debugCSS = Misc.findCSSStyleRule("#hft-debug");
      debugCSS.style.display = "block";
    }
  };

  return {
    setupStandardControllerUI: setupStandardControllerUI,
  };
});



