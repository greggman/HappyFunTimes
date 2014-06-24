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
var LoopbackClient = require('./loopbackclient');
var GameServer = requirejs('../public/hft/0.0.0/scripts/gameserver')

requirejs.config({
  nodeRequire: require,
});

var HFTPlayer = function(netPlayer, game, gameDB) {
  this.netPlayer = netPlayer;
  this.game = game;
  this.gameDB = gameDB;

  netPlayer.addEventListener('disconnect', HFTPlayer.prototype.disconnect.bind(this));
  netPlayer.addEventListener('getGameInfo', HFTPlayer.prototype.handleGetGameInfo.bind(this));
};

HFTPlayer.prototype.disconnect = function() {
  this.game.removePlayer(this);
};

HFTPlayer.prototype.handleGetGameInfo = function(data) {
  var gameInfo = this.gameDB.getGameById(data.gameId);
  this.netPlayer.sendCmd("gameInfo", gameInfo);
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

