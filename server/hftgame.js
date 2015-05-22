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

var debug     = require('debug')('hftgame');
var requirejs = require('requirejs');
var path      = require('path');
var config    = require('../lib/config');
var semver    = require('semver');

requirejs.config({
  nodeRequire: require,
  paths: {
    hft: path.join(__dirname, '../public/hft/0.x.x/scripts'),
  },
});

var childProcess   = require('child_process');
var fs             = require('fs');
var LoopbackClient = require('./loopbackclient');
var msgbox         = require('native-msg-box');
var platformInfo   = require('../lib/platform-info.js');
var download       = require('../management/download').download;

var GameServer     = requirejs('hft/gameserver');

var HFTPlayer = function(netPlayer, game, gameDB, relayServer) {
  this.netPlayer = netPlayer;
  this.game = game;
  this.gameDB = gameDB;
  this.relayServer = relayServer;
  this.subscribedGetAvailableGames = false;
  this.subscribedGetRunningGames = false;

  // Remember these must be safe.
  netPlayer.addEventListener('disconnect',            HFTPlayer.prototype.disconnect.bind(this));
  netPlayer.addEventListener('getGameInfo',           HFTPlayer.prototype.handleGetGameInfo.bind(this));
  netPlayer.addEventListener('getAvailableGames',     HFTPlayer.prototype.handleGetAvailableGames.bind(this));
  netPlayer.addEventListener('getRunningGames',       HFTPlayer.prototype.handleGetRunningGames.bind(this));
  netPlayer.addEventListener('install',               HFTPlayer.prototype.handleInstall.bind(this));
  netPlayer.addEventListener('upgrade',               HFTPlayer.prototype.handleUpgrade.bind(this));
  netPlayer.addEventListener('launch',                HFTPlayer.prototype.handleLaunch.bind(this));
  netPlayer.addEventListener('quit',                  HFTPlayer.prototype.handleQuit.bind(this));
  netPlayer.addEventListener('quitGame',              HFTPlayer.prototype.handleQuitGame.bind(this));
  netPlayer.addEventListener('disconnectGame',        HFTPlayer.prototype.handleDisconnectGame.bind(this));

  this.handleGameExited = HFTPlayer.prototype.handleGameExited.bind(this);
  relayServer.on('gameExited', this.handleGameExited);

  var highestVersion = Object.keys(config.getSettings().apiVersionSettings).sort(function(a, b) {
    if (a === b) {
      return 0;
    }
    return semver.lt(a, b) ? 1 : -1;
  })[0];

  this.sendCmd('hftInfo', {
    version: config.getPackageInfo().version,
    apiVersion: highestVersion,
  });
};

HFTPlayer.prototype.disconnect = function() {
  if (this.subscribedGetAvailableGames) {
    this.gameDB.removeListener('changed', this.subscribedGetAvailableGames);
    this.gameAvailableGamesSubscribed = undefined;
  }
  this.relayServer.removeListener('gameExited', this.handleGameExited);
  this.netPlayer.removeAllListeners();
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
  process.exit(0);  // eslint-disable-line
};

HFTPlayer.prototype.handleGetGameInfo = function(data) {
  var gameInfo = this.gameDB.getGameById(data.gameId);
  if (!gameInfo) {
    // No version means game is not installed.
    gameInfo = {
      info: {
        happyFunTimes: {
          gameId: data.gameId,
        },
      },
    };
  }
  this.sendCmd("gameInfo", gameInfo);
};

HFTPlayer.prototype.handleGetAvailableGames = function(/* data */) {
  if (!this.subscribedGetAvailableGames) {
    this.subscribedGetAvailableGames = HFTPlayer.prototype.handleGetAvailableGames.bind(this);
    this.gameDB.on('changed', this.subscribedGetAvailableGames);
  }

  debug("sending available games");
  this.sendCmd("availableGames", this.gameDB.getGames());
};

HFTPlayer.prototype.handleGetRunningGames = function(/* data */) {
  this.subscribedGetRunningGames = true;
  this.sendRunningGames();
};

HFTPlayer.prototype.sendRunningGames = function() {
  debug("sending running games");
  this.sendCmd("runningGames", this.relayServer.getGames());
};

HFTPlayer.prototype.sendRunningGamesIfSubscribed = function() {
  if (this.subscribedGetRunningGames) {
    this.sendRunningGames();
  }
};

HFTPlayer.prototype.download = function(gameId, upgrade) {
  var emitter = download(gameId, undefined, {
    //verbose: true,
    overwrite: upgrade,
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
  emitter.on('end', function(/* e */) {
    this.sendCmd('installCompleted', { gameId: gameId });
    emitter.removeAllListeners();
  }.bind(this));
};

HFTPlayer.prototype.handleInstall = function(data) {
  var gameId = data.gameId;

  msgbox.prompt({
    msg: "Install '" + gameId + "'?",
    title: "HappyFunTimes",
  }, function(err, result) {    // eslint-disable-line
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

HFTPlayer.prototype.handleUpgrade = function(data) {
  var gameId = data.gameId;

  msgbox.prompt({
    msg: "Upgrade '" + gameId + "'?",
    title: "HappyFunTimes",
  }, function(err, result) {  // eslint-disable-line
    switch (result) {
      case msgbox.Result.YES:
        this.sendInstallProgress(gameId, 0, 0, "starting upgrade");
        this.download(gameId, true);
        break;
      case msgbox.Result.NO:
        this.sendCmd("installCancelled", {gameId: gameId});
        break;
    }
  }.bind(this));

};

HFTPlayer.prototype.handleLaunch = function(data) {
  var gameId = data.gameId;
  var runtimeInfo = this.gameDB.getGameById(gameId);

  if (!runtimeInfo) {
    this.sendError("no such game: " + gameId);
    return;
  }

  var nativeName;
  var launcher;
  var hftInfo = runtimeInfo.info.happyFunTimes;
  switch (hftInfo.gameType.toLowerCase()) {
    case 'html':
      this.sendCmd('redirect', { url: runtimeInfo.gameUrl });
      break;
    case 'unity3d':
      var originalGameId = runtimeInfo.originalGameId;
      nativeName = originalGameId + platformInfo.exeSuffix;
      break;
    default:
      this.sendError("can not handle gameType: " + hftInfo.gameType);
      return;
  }

  if (nativeName) {
    var nativePath = path.join(runtimeInfo.rootPath, "bin", nativeName);
    if (!fs.existsSync(nativePath)) {
      this.sendError("native game does not exist: " + nativePath);
      return;
    }

    var args = [];
    var stderr = [];
    launcher = platformInfo.launcher;
    if (!launcher) {
      launcher = nativePath;
    } else {
      args.push(nativePath);
    }
    if (platformInfo.extraArgs) {
      args = args.concat(platformInfo.extraArgs);
    }
    args.push("--hft-url=ws://localhost:" + config.getSettings().settings.port);
    try {
      var child = childProcess.spawn(launcher, args, {
        stdio: [
          0,
          1,
          'pipe',
        ],
      });
      child.on('error', function() {
        this.sendError("unable to run game: " + launcher);
      }.bind(this));
      child.on('exit', function(exitCode) {
        if (exitCode !== 0) {
          this.sendError("error from game: " + stderr);
          stderr = [];
        }
      }.bind(this));
      child.stderr.on('data', function(chunk) {
        stderr.push(chunk);
      });
      child.unref();
    } catch (e) {
      this.sendError("unable to run game: " + launcher);
    }
  }
};

HFTPlayer.prototype.handleQuitGame = function(data) {
  var gameGroup = this.relayServer.getGameGroupById(data.gameId);
  if (gameGroup) {
    gameGroup.sendQuit();
  }
};

HFTPlayer.prototype.handleDisconnectGame = function(data) {
  var gameGroup = this.relayServer.getGameGroupById(data.gameId);
  if (gameGroup) {
    gameGroup.disconnectGames();
  }
};

HFTPlayer.prototype.handleGameExited = function(data) {
  this.sendCmd("gameExited", {gameId: data.gameId});
};

/**
 * This pseudo game is used to manage system level stuff.
 *
 * @constructor
 */
var HFTGame = function(options) {
  var gameDB = options.gameDB;
  var relayServer = options.relayServer;
  var players = [];
  var client = new LoopbackClient();
  var server = new GameServer({
    gameId: "__hft__",
    socket: client,
    quiet: true,
  });

  server.addEventListener('playerconnect', function(netPlayer, name) {    // eslint-disable-line
    players.push(new HFTPlayer(netPlayer, this, gameDB, relayServer));
  }.bind(this));

  relayServer.on('gameStarted', function() {
    players.forEach(function(player) {
      player.sendRunningGamesIfSubscribed();
    });
  });

  relayServer.on('gameExited', function() {
    players.forEach(function(player) {
      player.sendRunningGamesIfSubscribed();
    });
  });

  this.removePlayer = function(player) {
    var index = players.indexOf(player);
    if (index >= 0) {
      players.splice(index, 1);
    }
  };

  this.getClientForGame = function() {
    return client.server;
  };

  client.connect();
};


module.exports = HFTGame;

