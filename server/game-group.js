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

var debug        = require('debug')('game-group');
var Game         = require('./game');
var gamedb       = require('../lib/gamedb');

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
  this.runtimeInfo = gamedb.getGameById(gameId);
  this.relayServer = relayServer;
  this.games = [];  // first game is the "master"
};

GameGroup.prototype.removeGame = function(game) {
  var ndx = this.games.indexOf(game);
  if (ndx >= 0) {
    this.games.splice(ndx, 1);
  }
  debug("remove game: num games = " + this.games.length);
  if (this.games.length == 0) {
    this.relayServer.removeGameGroup(this.gameId);
  }
};

GameGroup.prototype.addPlayer = function(player) {
  if (this.games.length) {
    this.games[0].addPlayer(player);
    return this.games[0];
  }

  console.error("no games to add player to in gamegroup: " + this.gameId)
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
  var game = new Game(this.gameId, this, this.options);
  this.games.push(game);
  if (this.games.length > 1 && !this.runtimeInfo.info.happyFunTimes.allowMultipleGames) {
    var oldGame = this.games.shift();
    debug("tell old game to quit");
    oldGame.sendQuit();
    oldGame.close();
  }
  debug("add game: num games = " + this.games.length);
  game.assignClient(client, data);
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

GameGroup.prototype.controllerUrl = function() {
  return this.games.length > 0 ? this.games[0].controllerUrl : undefined;
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

module.exports = GameGroup;
