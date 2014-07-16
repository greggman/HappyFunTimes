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

// Start the main app logic.
requirejs(
  [ 'hft/io',
    'hft/gameclient',
    'hft/misc/misc',
    'hft/misc/strings',
  ], function(
    IO,
    GameClient,
    Misc,
    Strings) {

  var handleCmdErrorMsg = function(data) {
    // TODO: change to html dialog.
    alert(data.msg);
  };

  var handleRedirectMsg = function(data) {
    window.location.href = data.url;
  };

  var client = new GameClient({
    gameId: "__hft__",
  });

  client.addEventListener('errorMsg', handleCmdErrorMsg);
  client.addEventListener('redirect', handleRedirectMsg);

  var gamemenu = document.getElementById("gamemenu");
  var params = Misc.parseUrlQuery();

  var itemTemplateSuffix = "-item-template";
  var hiddenMsgSuffix = "-msg";
  var buttonIdSuffix = "-button";

  var templates = {};
  var elements = document.querySelectorAll(".item-template");
  for (var ii = 0; ii < elements.length; ++ii) {
    var elem = elements[ii];
    templates[elem.id.toLowerCase().substr(0, elem.id.length - itemTemplateSuffix.length)] = elem.text;
  };

  var hiddenMsgs = {};
  var elements = document.querySelectorAll(".hidden-msg");
  for (var ii = 0; ii < elements.length; ++ii) {
    var elem = elements[ii];
    hiddenMsgs[elem.id.toLowerCase().substr(0, elem.id.length - hiddenMsgSuffix.length)] = elem;
  };

  var getGames = function() {
    IO.sendJSON(window.location.href, {cmd: 'listAvailableGames'}, function (exception, obj) {
      if (exception) {
        throw exception;
      }

      var html = [];
      var gamesById = {};
      for (var ii = 0; ii < obj.length; ++ii) {
        var gameInfo = obj[ii];
        gamesById[gameInfo.happyFunTimes.gameId] = gameInfo;
        gameInfo.count = ii;
        var templateId = gameInfo.happyFunTimes.gameType.toLowerCase();
        var template = templates[templateId];
        if (!template) {
          console.error("missing template: " + templateId);
          continue;
        }
        html.push(Strings.replaceParams(template, gameInfo));
      }

      gamemenu.innerHTML = html.join("");

      // change .msg-button elements to bring up message
      var elements = document.querySelectorAll(".msg-button");
      for (var ii = 0; ii < elements.length; ++ii) {
        var elem = elements[ii];
        var buttonId = elem.id;
        var count = parseInt(buttonId.substr(0, buttonId.length - buttonIdSuffix.length));
        var gameInfo = obj[count];
        var gameType = gameInfo.happyFunTimes.gameType;
        if (!gameType) {
          console.warn("missing happyFunTimes.gameType in package.json")
          continue;
        }
        var msgId = gameType.toLowerCase() + hiddenMsgSuffix;
        var msgElement = document.getElementById(msgId);
        if (!msgElement) {
          console.error("missing msg element: " + msgId);
          continue;
        }
        elem.addEventListener('click', function(msgElement) {
          return function(e) {
            e.preventDefault(true)
            msgElement.style.display = "block";
          };
        }(msgElement), false);
        msgElement.addEventListener('click', function(msgElement) {
          return function(e) {
            e.preventDefault(true);
            msgElement.style.display = "none";
          }
        }(msgElement), false);
      }

      // change .launch-button elements to bring up message
      var elements = document.querySelectorAll(".launch-button");
      for (var ii = 0; ii < elements.length; ++ii) {
        var elem = elements[ii];
        var buttonId = elem.id;
        var count = parseInt(buttonId.substr(0, buttonId.length - buttonIdSuffix.length));
        var gameInfo = obj[count];
        var gameType = gameInfo.happyFunTimes.gameType;
        if (!gameType) {
          console.warn("missing happyFunTimes.gameType in package.json")
          continue;
        }
        var msgId = gameType.toLowerCase() + hiddenMsgSuffix;
        var msgElement = document.getElementById(msgId);
        if (!msgElement) {
          console.error("missing msg element: " + msgId);
          continue;
        }
        elem.addEventListener('click', function(msgElement, gameId) {
          return function(e) {
            e.preventDefault(true)
            msgElement.style.display = "block";
            client.sendCmd('launch', {gameId: gameId});
          };
        }(msgElement, gameInfo.happyFunTimes.gameId), false);
        msgElement.addEventListener('click', function(msgElement) {
          return function(e) {
            e.preventDefault(true);
            msgElement.style.display = "none";
          }
        }(msgElement), false);
      }

      // If we started with a gameId param just launch it?
      // NOTE: this is kind of wonky. Seems like we should just go directly
      // instead of waiting
      if (params.gameId) {
        var gameInfo = gamesById[params.gameId];
        if (!gameInfo) {
          console.error("unknown gameId: " + params.gameId);
        } else {
          // LOL. If we don't replace the history then pressing back will just end up going forward again :P
          // Yet another reason maybe we should just go directly to the game?
          window.history.replaceState({}, "", window.location.origin + window.location.pathname);
          var event = new Event('click');
          var elem = document.getElementById(gameInfo.count + "-button");
          elem.dispatchEvent(event);
        }
      }

      // If there's only one game just go to it.
      if (obj.length == 1 && obj[0].controllerUrl) {
        window.location.href = obj[0].controllerUrl;
        return;
      }
    });
  };
  getGames();
});



