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

var computerName = require('../lib/computername');
var debug        = require('debug')('relayserver');
var events       = require('events');
var fs           = require('fs');
var GameGroup    = require('./game-group');
var gameInfo     = require('../lib/gameinfo');
var path         = require('path');
var Player       = require('./player');
var strings      = require('../lib/strings');
var WSServer     = require('./websocketserver');

var safeishName = function(gameId) {
  return gameId.replace(/[^a-zA-Z0-9-_()]/g, '_');
};

/**
 * RelayServer options
 * @typedef {Object} RelayServer~Options
 * @property {AvailableGames} gameDB The game db
 * @property {String?} baseUrl ???
 * @property {WebSocketServer?} WebSocketServer constructor for WebSocketServer (for testing)
 */

/**
 * Game list entry
 * @typedef {Object} RelayServer~GameEntry
 * @property {String} gameId - id of game
 * @property {Number} numPlayers - number of players currently
 *           connected.
 * @property {String} controllerUrl - url of controller for game
 */

/**
 * The relaysever manages a websocket server. It accepts
 * connections from games and controllers, notifies the game of
 * controllers joining and leaving the game and passes messages
 * between them.
 *
 * @constructor
 * @params {HTTPServer[]} servers. An array of of node
 *       httpservers to run websocket servers. This is an array
 *       because we'd to be able to run multiple servers on
 *       different ports but have the relayserver pass messages
 *       between them.
 * @params {RelayServer~Options} options
 */
var RelayServer = function(servers, inOptions) {
  var nextSessionId = 0;
  var gameGroups = {};
  var numGameGroups = 0;
  var options = {};
  var socketServers = [];
  var eventEmitter = new events.EventEmitter();
  var gameDB = inOptions.gameDB;

  this.setOptions = function(srcOptions) {
    ["baseUrl"].forEach(function(key) {
      var value = srcOptions[key];
      if (value !== undefined) {
        options[key] = value;
      }
    });
  };

  this.setOptions(inOptions);

  this.on = eventEmitter.on.bind(eventEmitter);
  this.addListener = this.on;
  this.removeListener = eventEmitter.removeListener.bind(eventEmitter);

  // --- messages to relay server ---
  //
  // join  :
  //   desc: joins a game
  //   args:
  //      gameId: name of game
  //
  // server:
  //   desc: identifies this session as a server (the machine running the game)
  //   args: none
  //
  // client:
  //   desc: sends a message to a specific client
  //   args:
  //      id:   session id of client
  //      data: object
  //
  // update:
  //   desc: sends an update to the game server (the machine running the game)
  //   args:
  //      anything

  // -- messages to the game server (machine running the game) --
  //
  // update:
  //   desc: updates a player
  //   args:
  //      id: id of player to update
  //      data: data
  //
  // remove:
  //   desc: removes a player
  //   args:
  //      id: id of player to remove.
  //

  var getGameGroup = function(gameId, makeGroup) {
    var gameGroup;
    if (!gameId) {
      console.error("no game id!");
    } else {
      gameGroup = gameGroups[gameId];
      if (!gameGroup && makeGroup) {
        gameGroup = new GameGroup(gameId, this, { gameDB: gameDB });
        gameGroups[gameId] = gameGroup;
        ++numGameGroups;
        debug("added game group: " + gameId + ", num game groups = " + numGameGroups);
      }
    }
    return gameGroup;
  }.bind(this);

  /**
   * Gets a game by id.
   * @param {string} gameId id of game
   * @return {Game?} Game for game.
   */
  this.getGameGroupById = function(gameId) {
    return gameGroups[gameId];
  };

  /**
   * Gets an array of game currently running.
   * @method
   * @returns {RelayServer~GameEntry[]}
   */
  this.getGames = function() {
    var gameList = [];
    for (var id in gameGroups) {
      var gameGroup = gameGroups[id];
      if (gameGroup.showInList()) {
        gameList.push({
          gameId: id,
          serverName: computerName.get().trim(),
          numPlayers: gameGroup.getNumPlayers(),
          controllerUrl: gameGroup.getControllerUrl(options.baseUrl),
          runtimeInfo: gameGroup.runtimeInfo,
        });
      }
    }
    return gameList;
  };

  /**
   * Adds the given player to the game group
   * @method
   * @param {Player} player the player to add
   * @param {String} gameId id of the game.
   * @returns {Game} game that player was added to
   */
  this.addPlayerToGame = function(player, gameId) {
    /*eslint consistent-return:0*/
    debug("adding player to game: " + gameId);
    var gameGroup = getGameGroup(gameId);
    if (!gameGroup) {
      return;
    }
    return gameGroup.addPlayer(player);
  };

  /**
   * Removes a game group from the game groups known by this relayserver
   * @method
   * @param {String} gameId id of game group to remove.
   */
  this.removeGameGroup = function(gameId) {
    if (!gameGroups[gameId]) {
      console.error("no game group '" + gameId + "' to remove");
      return;
    }
    --numGameGroups;
    debug("removed game group: " + gameId + ", num game groups = " + numGameGroups);
    eventEmitter.emit('gameExited', {gameId: gameId});
    delete gameGroups[gameId];
  };

  var findPackageJSON = function(dirPath) {
    for (;;) {
      if (path.dirname(dirPath).length < 10) {
        break;
      }
      var testPath = path.join(dirPath, "package.json");
      if (fs.existsSync(testPath)) {
        return testPath;
      }
      dirPath = path.dirname(dirPath);
    }
  };

  /**
   * Assigns a client as the server for a specific game.
   * @method
   * @param {Object} data Data passed from game.
   * @param {Client} client Websocket client object.
   */
  this.assignAsClientForGame = function(data, client) {
    var gameId = safeishName(data.gameId);
    var cwd = data.cwd;
    if (cwd) {
      var origCwd = cwd;
      debug("cwd: " + cwd);
      // Not clear where this belongs. Unity can be in bin
      // so should we fix it in unity or here? Seems like
      // here since Unity isn't aware. It's HFT that specifies
      // the 'bin' convension

      // First check deeper
      debug("gameId:" + gameId);
      cwd = findPackageJSON(path.join(origCwd, "WebPlayerTemplates/HappyFunTimes", gameId));
      if (!cwd) {
        cwd = findPackageJSON(path.join(origCwd, "WebPlayerTemplates/HappyFunTimes"));
        if (!cwd) {
          cwd = findPackageJSON(path.join(origCwd, "../../../Assets/WebPlayerTemplates/HappyFunTimes", gameId));
          if (!cwd) {
            cwd = findPackageJSON(path.join(origCwd, "../../../Assets/WebPlayerTemplates/HappyFunTimes"));
          }
        }
      }

      var read = false;
      if (cwd) {
        var suffixes = [
          "Assets/WebPlayerTemplates/HappyFunTimes/" + gameId + "/package.json",
          "Assets/WebPlayerTemplates/HappyFunTimes/package.json",
          "HappyFunTimes/package.json",
          "package.json",
        ];
        cwd = cwd.replace(/\\/g, "/");
        for (var xx = 0; xx < suffixes.length; ++xx) {
          var suffix = suffixes[xx];
          if (strings.endsWith(cwd, suffix)) {
            cwd = cwd.substring(0, cwd.length - suffix.length - 1);
            break;
          }
        }
        try {
          var runtimeInfo = gameInfo.readGameInfo(cwd, gameId);
          if (runtimeInfo) {
            gameId = runtimeInfo.info.happyFunTimes.gameId;
            gameDB.add(runtimeInfo);
            read = true;
          }
        } catch (e) {
        }
      }
      if (!read) {
        gameId = gameInfo.makeRuntimeGameId(gameId, origCwd);
      }
    }
    if (!gameId) {
      console.error("unknown game id. Can not start game");
      eventEmitter.emit('gameStartFailed');
      return;
    }
    debug("starting game: " + gameId);
    var gameGroup = getGameGroup(gameId, true);
    gameGroup.assignClient(client, data);
    eventEmitter.emit('gameStarted', {gameId: gameId});
  };

  servers.forEach(function(server) {
    //var io = new SocketIOServer(server);
    var io = inOptions.WebSocketServer ? new inOptions.WebSocketServer(server) : new WSServer(server);
    socketServers.push(io);

    io.on('connection', function(client) {
        return new Player(client, this, ++nextSessionId);
    }.bind(this));
  }.bind(this));

  /**
   * Close the relayserver
   * @todo make it no-op after it's closed?
   */
  this.close = function() {
    socketServers.forEach(function(server) {
      server.close();
    });
  };

  this.getSocketServers = function() {
    return socketServers.slice();
  };
};

module.exports = RelayServer;

