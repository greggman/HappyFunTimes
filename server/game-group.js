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

var debug  = require('debug')('happyfuntimes:game-group');
var Game   = require('./game');

/**
 * Represents a group of games.
 *
 * Normally a group only has 1 game but
 * for situations where we need more than
 * 1 game ...
 *
 */
var GameGroup = function(gameId, relayServer, options) {
  options = options || {};
  this.options = options;
  this.gameId = gameId;
  this.relayServer = relayServer;
  this.games = [];  // first game is the "master"
  this.nextGameId = 0;  // start at 0 because it's easy to switch games with (gameNum + numGames + dir) % numGames
};

GameGroup.prototype.getGameById = function(id) {
  // This is LAME! Should switch to hash like players
  for (var ii = 0; ii < this.games.length; ++ii) {
    var game = this.games[ii];
    if (game.id === id) {
      return game;
    }
  }
};

GameGroup.prototype.removeGame = function(game) {
  var ndx = this.games.indexOf(game);
  if (ndx >= 0) {
    this.games.splice(ndx, 1);
  }

  for (var ii = 0; ii < this.games.length; ++ii) {
    var otherGame = this.games[ii];
    otherGame.sendGameDisconnect(game);
  }

  debug("remove game: num games = " + this.games.length);
  if (this.games.length === 0) {
    this.relayServer.removeGameGroup(this.gameId);
  }
};

GameGroup.prototype.addPlayer = function(player, data) {
  if (this.games.length) {
    this.games[0].addPlayer(player, data);
    return this.games[0];
  }

  console.error("no games to add player to in gamegroup: " + this.gameId);
};

/**
 * Adds a player to a specific game.
 * @param {Player} player to add
 * @param {string} id
 * @param {Object?} data add to send in connect msg
 */
GameGroup.prototype.addPlayerToGame = function(player, id, data) {
  for (var ii = 0; ii < this.games.length; ++ii) {
    var game = this.games[ii];
    if (game.id === id) {
      game.addPlayer(player, data);
      return;
    }
  }
  console.error("no game with id '" + id + "' in gamegroup: " + this.gameId);
};

/**
 *
 * @param {!Client} client Websocket client that's connected to
 *        the game.
 * @param {!RelayServer} relayserver relayserver the game is
 *        connected to.
 * @param {Game~GameOptions} data Data sent from the game which
 *        includes
 */
GameGroup.prototype.assignClient = function(client, data) {
  // If there are no games make one
  // If multiple games are allowed make one
  // If multiple games are not allowed re-assign
  var game = new Game(data.id || ("_hft_" + this.nextGameId++), this, this.options);
  // Add it to 'games' immediately because if we remove the old game games would go to 0
  // for a moment and that would trigger this GameGroup getting removed because there'd be no games
  this.games.push(game);
  var allowMultipleGames = false;
  if (data.allowMultipleGames) {
    allowMultipleGames = true;
  }
  if (this.games.length > 1) {
    var oldGame;
    if (!allowMultipleGames) {
      oldGame = this.games[0];
    } else {
      // See if there is any game with the same id
      if (data.id) {
        // Don't check the last game, that's the one we just added.
        for (var ii = 0; ii < this.games.length - 1; ++ii) {
          if (this.games[ii].id === data.id) {
            oldGame = this.games[ii];
            break;
          }
        }
      }
    }
    if (oldGame) {
      debug("tell old game to quit");
      oldGame.sendQuit();
      oldGame.close();
    }
  }

  debug("add game: num games = " + this.games.length);
  game.assignClient(client, data);

  // If this is the master make it the first one
  if (data.master) {
    var ndx = this.games.indexOf(game);
    this.games.splice(ndx, 1);
    this.games.unshift(game);
  }

  return game;
};

GameGroup.prototype.addFiles = function(files) {
  this.relayServer.addFilesForGame(this.gameId, files);
};

GameGroup.prototype.hasClient = function() {
  return this.games.length > 0 && this.games[0].hasClient();
};

GameGroup.prototype.showInList = function() {
  return this.games.length > 0 &&
         this.games[0].hasClient() &&
         this.games[0].showInList !== false;
};

GameGroup.prototype.getNumPlayers = function() {
  return this.games.reduce(function(prev, curr) {
    return prev + curr.getNumPlayers();
  }, 0);
};

GameGroup.prototype.getControllerUrl = function(baseUrl) {
  return this.games.length > 0 ? this.games[0].getControllerUrl(baseUrl) : undefined;
};

GameGroup.prototype.sendQuit = function() {
  this.games.forEach(function(game) {
    game.sendQuit();
  });
};

GameGroup.prototype.disconnectGames = function() {
  this.games.forEach(function(game) {
    game.close();
  });
};

GameGroup.prototype.sendMessageToGame = function(senderId, receiverId, data) {
  // this is lame! should change to ids like player.
  var game = this.getGameById(receiverId);
  if (game) {
    game.send(this, {cmd: 'upgame', id: senderId, data: data});
  } else {
    console.warn("no game for id: " + receiverId);
  }
};

GameGroup.prototype.broadcastMessageToGames = function(senderId, receiverId, data) {
  this.games.forEach(function(game) {
    game.send(this, {cmd: 'upgame', id: senderId, data: data});
  });
};

module.exports = GameGroup;
