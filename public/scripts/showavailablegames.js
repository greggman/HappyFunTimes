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
  [ 'hft/gameclient',
    'hft/hft-system',
    'hft/misc/dialog',
    'hft/misc/dragdropmanager',
    'hft/misc/misc',
    'hft/misc/strings',
    './semver',
  ], function(
    GameClient,
    HFTSystem,
    dialog,
    DragDropManager,
    misc,
    strings,
    semver) {

  var $ = document.getElementById.bind(document);
  var g = {
    elementToShowOnDisconnect: $("disconnected"),
    gamesById: {},
    hftData: {},
  };
  misc.applyUrlSettings(g);

  g.dd = new DragDropManager({
    inputElem: document.body,
    showElem: $("hft-install-drop"),
  });

  var handleCmdErrorMsg = function(data) {
    dialog.modal({
      title: "Error",
      msg: data.msg,
      choices: [
        { msg: "Ok", },
      ],
    });
  };

  var handleRedirectMsg = function(data) {
    window.location.href = data.url;
  };

  var handleDisconnect = function() {
    g.elementToShowOnDisconnect.style.display = "block";
    var hftSystem = new HFTSystem();
    hftSystem.on('connect', function() {
        window.location.reload();
    });
  };

  var handleGameExited = function(data) {
    var runtimeInfo = g.gamesById[data.gameId];
    if (runtimeInfo && runtimeInfo.cleanupFn) {
      runtimeInfo.cleanupFn();
    }
  };

  var handleHFTInfo = function(data) {
    g.hftData = data;
    $("versionnum").innerHTML = "v" + data.version;
  };

  var params = misc.parseUrlQuery();

  var client = new GameClient({
    gameId: "__hft__",
  });

  client.addEventListener('error', function() {});
  client.addEventListener('connect', function() {});
  client.addEventListener('errorMsg', handleCmdErrorMsg);
  client.addEventListener('redirect', handleRedirectMsg);
  client.addEventListener('disconnect', handleDisconnect);
  client.addEventListener('gameExited', handleGameExited);
  client.addEventListener('hftInfo', handleHFTInfo);

  $('quit').addEventListener('click', function() {
    g.elementToShowOnDisconnect = $("exited");
    client.sendCmd('quit');
  }, false);

  var gamemenu = $("gamemenu");

  var itemTemplateSuffix = "-item-template";
  var hiddenMsgSuffix = "-msg";
  var buttonIdSuffix = "-button";
  var getInfoTemplate = $("get-info-template").text;

  var templates = {};
  Array.prototype.forEach.call(document.querySelectorAll(".item-template"), function(elem) {
    templates[elem.id.toLowerCase().substr(0, elem.id.length - itemTemplateSuffix.length)] = elem.text;
  });

  var hiddenMsgs = {};
  Array.prototype.forEach.call(document.querySelectorAll(".hidden-msg"), function(elem) {
    hiddenMsgs[elem.id.toLowerCase().substr(0, elem.id.length - hiddenMsgSuffix.length)] = elem;
  });

  var quitGame = function(gameId) {
    console.log("sending quitGame: " + gameId);
    client.sendCmd('quitGame', {gameId: gameId});
  };

  var ContextMenuManager = function(options) {

    var _menuElem = options.menuElem;
    var _inputElem = options.inputElem;
    var _showing = false;
    var _runtimeInfo;
    var _canSelect = true;  // not sure how to fix
    // the issue is if an option is directly under the mouse when
    // we get contextmenu event then we also for some reason
    // get mouseup event in that element

    var _getInfoElem   = _menuElem.querySelector("#hft-get-info");
    var _uninstallElem = _menuElem.querySelector("#hft-uninstall");
    var _removeElem    = _menuElem.querySelector("#hft-remove");

    var getGameId = function(element) {
      if (!element) {
        return false;
      }

      var gameId;
      if (element.getAttribute) {
        gameId = element.getAttribute("gameid");
      }

      return gameId || getGameId(element.parentNode);
    };

    var getName = function() {
      return _runtimeInfo.dev + _runtimeInfo.info.name;
    };

    var allowSelection = function() {
      _canSelect = true;
    };

    var isContextMenu = function(element) {
      if (!element) {
        return false;
      }
      if (element.id === "hft-contextmenu") {
        return true;
      }
      return isContextMenu(element.parentNode);
    };

    var hideContextMenu = function(e) {
      if (_showing) {
        _showing = false;
        if (e) {
          e.preventDefault();
        }
        _menuElem.style.display = "none";
      }
    };

    var showContextMenu = function(event) {
      var gameId = getGameId(event.target);
      if (!gameId) {
        return hideContextMenu(event);
      }

      _runtimeInfo = g.gamesById[gameId];

      _canSelect = false;
      setTimeout(allowSelection, 50);
      event.preventDefault();
      _showing = true;
      _menuElem.style.display = "block";

      var gameInfo = _runtimeInfo.info;
      var name = _runtimeInfo.dev + gameInfo.name;
      Array.prototype.forEach.call(_menuElem.querySelectorAll(".hft-gameid"), function(elem) {
        elem.innerHTML = name;
      });

      if (_runtimeInfo.dev) {
        _uninstallElem.style.display = "none";
        _removeElem.style.display = "block";
      } else {
        _uninstallElem.style.display = "block";
        _removeElem.style.display = "none";
      }

      _menuElem.style.left = '0';
      _menuElem.style.top  = '0';

      var padding = 20;
      var width  = _menuElem.clientWidth  + padding;
      var height = _menuElem.clientHeight + padding;

      var x = event.clientX;// + scrollLeft;
      var y = event.clientY;// + scrollTop;

      var bound = function(v, size, max) {
        if (v + size > max) {
          v = Math.max(0, max - size);
        }
        return v;
      };

      x = bound(x, width, window.innerWidth);
      y = bound(y, height, window.innerHeight);

      _menuElem.style.left = x + 'px';
      _menuElem.style.top  = y + 'px';


      _menuElem.style.display = 'block';
    };

    var setupOption = function(elem, fn) {
      elem.addEventListener('mouseup', function(e) {
        if (_canSelect) {
          fn(e);
        }
      });
    };

    var handleGetInfo = function() {
      hideContextMenu();
      // TODO! change to better
      var div = document.createElement("div");
      div.innerHTML = strings.replaceParams(getInfoTemplate, _runtimeInfo);
      dialog.modal({
        title: "Info for " +  getName(),
        msg: div,
        choices: [
          { msg: "Ok" },
        ],
      });
    };

    var handleUninstall = function() {
      hideContextMenu();
      client.sendCmd('uninstall', { gameId: _runtimeInfo.info.happyFunTimes.gameId });
    };

    var handleRemove = function() {
      hideContextMenu();
      client.sendCmd('remove', { gameId: _runtimeInfo.info.happyFunTimes.gameId });
    };

    setupOption(_getInfoElem, handleGetInfo);
    setupOption(_uninstallElem, handleUninstall);
    setupOption(_removeElem, handleRemove);

    var handleMouseDown = function(e) {
      if (!isContextMenu(e.target)) {
        hideContextMenu(e);
      }
    };

    _inputElem.addEventListener('contextmenu', showContextMenu);
    _inputElem.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('blur', hideContextMenu);
  };

  g.cm = new ContextMenuManager({
    inputElem: document.body,
    menuElem: $("hft-contextmenu"),
  });


  var handleAvailableGames = function(obj) {
    var html = [];
    var gamesById = {};
    g.gamesById = gamesById;
    obj.forEach(function(runtimeInfo, ndx) {
      var gameInfo = runtimeInfo.info;
      var hftInfo = gameInfo.happyFunTimes;
      gameInfo.name = gameInfo.name.replace(/ /g, "&nbsp;");
      gamesById[hftInfo.gameId] = runtimeInfo;
      runtimeInfo.dev = (runtimeInfo.originalGameId !== hftInfo.gameId) ? "(*)" : "";
      if (g.hftData.apiVersion) {
        if (semver.gt(hftInfo.apiVersion, g.hftData.apiVersion)) {
          runtimeInfo.needsUpgrade = true;
        }
      }
      runtimeInfo.count = ndx;
      var templateId = runtimeInfo.needsUpgrade ? "upgrade" : hftInfo.gameType.toLowerCase();
      var template = templates[templateId];
      if (!template) {
        console.error("missing template: " + templateId);
        return;
      }
      html.push(strings.replaceParams(template, runtimeInfo));
    });

    gamemenu.innerHTML = html.join("");

    // change .msg-button elements to bring up message

    var forEachElementOnSelector = function(selector, fn) {
      Array.prototype.forEach.call(document.querySelectorAll(selector), function(elem) {
        var buttonId = elem.id;
        var count = parseInt(buttonId.substr(0, buttonId.length - buttonIdSuffix.length));
        var runtimeInfo = obj[count];
        fn(elem, runtimeInfo);
      });
    };

    var addOverlayMessgaeOnClickToSelector = function(selector, onDisplay, onHide) {
      forEachElementOnSelector(selector, function(elem, runtimeInfo) {
        var gameInfo = runtimeInfo.info;
        var hftInfo = gameInfo.happyFunTimes;
        var gameType = hftInfo.gameType;
        if (!gameType) {
          console.warn("missing happyFunTimes.gameType in package.json");
          return;
        }
        var msgId = (runtimeInfo.needsUpgrade ? "upgrade" : gameType.toLowerCase()) + hiddenMsgSuffix;
        var msgElement = $(msgId);
        if (!msgElement) {
          console.error("missing msg element: " + msgId);
          return;
        }
        elem.addEventListener('click', function(element, runtimeInfo) {
          return function(e) {
            e.preventDefault(true);
            element.style.display = "block";
            onDisplay(element, runtimeInfo);
          };
        }(msgElement, runtimeInfo), false);
        var cleanupFn = function(element) {
          return function() {
            element.style.display = "none";
          };
        }(msgElement);
        msgElement.addEventListener('click', function(fn, element, runtimeInfo) {
          return function(e) {
            e.preventDefault(true);
            fn();
            onHide(element, runtimeInfo);
          };
        }(cleanupFn, msgElement, runtimeInfo), false);
        gamesById[hftInfo.gameId].cleanupFn = cleanupFn;
      });
    };

    var noop = function() { };

    addOverlayMessgaeOnClickToSelector(".msg-button", noop, noop);

    var launch = function(element, runtimeInfo) {
      client.sendCmd('launch', {gameId: runtimeInfo.info.happyFunTimes.gameId});
    };
    var quit = function(element, runtimeInfo) {
      quitGame(runtimeInfo.info.happyFunTimes.gameId);
    };

    addOverlayMessgaeOnClickToSelector(".launch-button", launch, quit);

    forEachElementOnSelector(".upgrade-hft", function(elem/*, runtimeInfo*/) {
      elem.addEventListener('click', function() {
        window.location.href = "http://docs.happyfuntimes.net/install.html";
      });
    });

    // If we started with a gameId param just launch it?
    // NOTE: this is kind of wonky. Seems like we should just go directly
    // instead of waiting
    if (params.gameId) {
      var runtimeInfo = gamesById[params.gameId];
      if (!runtimeInfo) {
        console.error("unknown gameId: " + params.gameId);
      } else {
        // LOL. If we don't replace the history then pressing back will just end up going forward again :P
        // Yet another reason maybe we should just go directly to the game?
        window.history.replaceState({}, "", window.location.origin + window.location.pathname);
        var event = new Event('click');
        var elem = $(runtimeInfo.count + "-button");
        elem.dispatchEvent(event);
      }
    }

    // If there's only one game just go to it.
    if (obj.length === 1 && obj[0].controllerUrl) {
      window.location.href = obj[0].controllerUrl;
      return;
    }
  };

  if (gamemenu) {
    client.addEventListener('availableGames', handleAvailableGames);
    client.sendCmd('getAvailableGames');
  }

  (function() {
    var elem = document.querySelector(".unhidden-msg");
    if (elem && g.how) {
      window.history.replaceState({}, "", window.location.origin + window.location.pathname);
      elem.style.display = "block";
      elem.addEventListener('click', function() {
        elem.style.display = "none";
      }, false);
    }
  }());
});



