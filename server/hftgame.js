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
 * THEORY OF2 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

var requirejs = require('requirejs');

var child_process = require('child_process');
var fs = require('fs');
var GameServer = requirejs('../public/hft/0.0.0/scripts/gameserver');
var LoopbackClient = require('./loopbackclient');
var msgbox = require('native-msg-box');
var os = require('os');
var platform = os.platform().toLowerCase();
var path = require('path');
var Promise = require('promise');
var release = require('../management/release');

requirejs.config({
  nodeRequire: require,
});

var HFTPlayer = function(netPlayer, game, gameDB) {
  this.netPlayer = netPlayer;
  this.game = game;
  this.gameDB = gameDB;

  netPlayer.addEventListener('disconnect', HFTPlayer.prototype.disconnect.bind(this));
  netPlayer.addEventListener('getGameInfo', HFTPlayer.prototype.handleGetGameInfo.bind(this));
  netPlayer.addEventListener('install', HFTPlayer.prototype.handleInstall.bind(this));
  netPlayer.addEventListener('launch', HFTPlayer.prototype.handleLaunch.bind(this));
  netPlayer.addEventListener('quit', HFTPlayer.prototype.handleQuit.bind(this));
};

HFTPlayer.prototype.disconnect = function() {
  this.game.removePlayer(this);
};

HFTPlayer.prototype.sendCmd = function(cmd, data) {
  this.netPlayer.sendCmd(cmd, data);
};

HFTPlayer.prototype.sendInstallProgress = function(gameId, size, bytesDownloaded, msg) {
  this.sendCmd("installProgress", {
    gameId: gameId,
    size: size,
    bytesDownloaded: bytesDownloaded,
    msg: msg,
  });
};

HFTPlayer.prototype.sendError = function(msg) {
  this.sendCmd("errorMsg", {
    msg: msg,
  });
};

HFTPlayer.prototype.handleQuit = function() {
  console.log("exiting happyFunTimes");
  process.exit(0);
};

HFTPlayer.prototype.handleGetGameInfo = function(data) {
  var gameInfo = this.gameDB.getGameById(data.gameId);
  if (!gameInfo) {
    // No version means game is not installed.
    gameInfo = {
      happyFunTimes: {
        gameId: data.gameId,
      }
    };
  }
  this.sendCmd("gameInfo", gameInfo);
};

HFTPlayer.prototype.download = function(gameId) {
  var emitter = release.download(gameId, undefined, {
    verbose: true,
  });
  var size = 0;
  var bytesDownloaded = 0;
  emitter.on('status', function(e) {
    this.sendInstallProgress(gameId, size, bytesDownloaded, e.status);
  }.bind(this));
  emitter.on('progress', function(e) {
    size = e.size;
    bytesDownloaded = e.bytesDownloaded;
    this.sendInstallProgress(gameId, size, bytesDownloaded, "downloading");
  }.bind(this));
  emitter.on('error', function(e) {
    this.sendCmd('installError', { gameId: gameId, msg: e.toString() + (e.stack ? e.stack.toString() : '') });
    emitter.removeAllListeners();
  }.bind(this));
  emitter.on('end', function(e) {
    this.sendCmd('installCompleted', { gameId: gameId });
    emitter.removeAllListeners();
  }.bind(this));
};

HFTPlayer.prototype.handleInstall = function(data) {
  var upgrade = data.upgrade;
  var gameId = data.gameId;

  msgbox.prompt({
    msg: "Install '" + gameId + "'?",
    title: "HappyFunTimes"
  }, function(err, result) {
    switch (result) {
      case msgbox.Result.YES:
        this.sendInstallProgress(gameId, 0, 0, "starting install");
        this.download(gameId);
        break;
      case msgbox.Result.NO:
        this.sendCmd("installCancelled", {gameId: gameId});
        break;
    }
  }.bind(this));

};

HFTPlayer.prototype.handleLaunch = function(data) {
  var gameId = data.gameId;
  var info = this.gameDB.getGameById(gameId);

  if (!info) {
    this.sendError("no such game: " + gameId);
    return;
  }

  var nativeName;
  var launcher;
  var hftInfo = info.happyFunTimes;
  switch (hftInfo.gameType.toLowerCase()) {
    case 'html':
      this.sendCmd('redirect', { url: hftInfo.gameUrl });
      break;
    case 'unity3d':
      if (platform == 'darwin') {
        nativeName = gameId + "-osx.app";
        launcher = "open"
      } else if (platform.substr(0, 3) == "win") {
        nativeName = gameId + "-win.exe";
      } else {
        nativeName = gameId + "-linux";
      }
      break;
    default:
      this.sendError("can not handle gameType: " + hftInfo.gameType);
      return;
  }

  if (nativeName) {
    var nativePath = path.join(hftInfo.basePath, "bin", nativeName);
    if (!fs.existsSync(nativePath)) {
      this.sendError("native game does not exist: " + nativePath);
      return;
    }

    var args = [];
    if (!launcher) {
      launcher = nativePath;
    } else {
      args.push(nativePath);
    }
    var child = child_process.spawn(launcher, args);
    child.unref();
  }

};

/**
 * This pseudo game is used to manage system level stuff.
 *
 * @constructor
 */
var HFTGame = function(options) {
  var gameDB = options.gameDB;
  var players = [];
  var client = new LoopbackClient();
  var server = new GameServer({
    gameId: "__hft__",
    socket: client,
  });

  server.addEventListener('playerconnect', function(netPlayer, name) {
    players.push(new HFTPlayer(netPlayer, this, gameDB));
  }.bind(this));

  this.removePlayer = function(player) {
    var index = players.indexOf(player);
    if (index >= 0) {
      players.splice(index, 1);
    }
  };

  this.getClientForGame = function() {
    return client.server;
  };
};


module.exports = HFTGame;

