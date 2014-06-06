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
    './io',
    './hft-splash',
    './misc/misc',
    './misc/playername',
  ], function(
    IO,
    HFTSplash,
    Misc,
    PlayerNameHandler) {

  var $ = function(id) {
    return document.getElementById(id);
  };

  var setupStandardControllerUI = function(client, options) {
    var menu = $("hft-menu");
    var settings = $("hft-settings");
    var disconnected = $("hft-disconnected");

    var playerNameHandler = new PlayerNameHandler(client, $("hft-name"));

    menu.addEventListener('click', function() {
      settings.style.display = "block";
    }, false);
    $("hft-setname").addEventListener('click', function() {
      settings.style.display = "none";
      playerNameHandler.startNameEntry();
    }, false);
    $("hft-restart").addEventListener('click', function() {
      window.location.reload();
    }, false);
    $("hft-exit").addEventListener('click', function() {
      window.location.href = "/";
    }, false);
    $("hft-back").addEventListener('click', function() {
      settings.style.display = "none";
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
      disconnected.style.display = "none";
      if (options.connectFn) {
        options.connectFn();
      }
    });

    client.addEventListener('disconnect', function() {
      disconnected.style.display = "block";
      if (options.disconnectFn) {
        options.disconnectFn();
      }

      //
      var checkForGame = function() {
        IO.sendJSON(window.location.href, {cmd: 'listRunningGames'}, function (obj, exception) {
          if (exception) {
            // the server is down. Try again?. I'm not sure what to do here. Currently the display
            // will say "restart"/"main menu" but neither have a point if the server is down.
            // Maybe there should be no options?
            setTimeout(checkForGame, 1000);
            return;
          }

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

          // Note: If we knew the path each game and there was only 1 game running
          // we could jump directly to that game. Right now gameIds don't correspond
          // to their URL.

          setTimeout(checkForGame, 1000);
        });
      };

      // Give the game a moment to restart and connect to the relayserver
      setTimeout(checkForGame, 1000);
    });

    if (options.debug) {
      statusNode = document.createTextNode("");
      $("hft-status").appendChild(statusNode);
      var debugCSS = Misc.findCSSStyleRule("#hft-debug");
      debugCSS.style.display = "block";
    }
  };

  return {
    setupStandardControllerUI: setupStandardControllerUI,
  };
});



