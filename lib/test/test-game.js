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

var assert         = require('assert');
var debug          = require('debug')('happyfuntimes:test-game');
var LoopbackClient = require('../../server/loopbackclient');
var requirejs      = require('requirejs');
var path           = require('path');

requirejs.config({
  nodeRequire: require,
  paths: {
    hft: path.join(__dirname, '../../src/hft/scripts'),
  },
});

var GameServer = requirejs('hft/gameserver');

// Not to be confused with TestController (client side)
var TestGamePlayer = function(netPlayer, testGame, data) {
  var connected = true;
  var self = this;
  var receivedMessages = [{cmd: 'connect', data: data}];

  netPlayer.addEventListener('disconnect', function() {
    debug("TestGamePlayer: disconnect");
    assert(connected, "connected");
    connected = false;
    testGame.removePlayer(self);
  });
  netPlayer.addEventListener('testmsg', function(data) {
    receivedMessages.push({cmd: 'testmsg', data: data});
  });

  this.switchGame = function(id, data) {
    debug("TestGamePlayer: switchGame: " + id);
    netPlayer.switchGame(id, data);
  };

  this.sendCmd = function(data) {
    netPlayer.sendCmd('testmsg', data);
  };

  this.getReceivedMessages = function() {
    return receivedMessages.slice();
  };

  Object.defineProperty(this, 'sessionId', {
    get: function() {
      return netPlayer.getSessionId();
    },
  });
};

var TestGame = function(options) {
  options = options || {};
  var players = [];
  var receivedMessages = [];
  var wsclient = options.socket || new LoopbackClient();
  var server = new GameServer({
    gameId: options.gameId || "__test__",
    socket: wsclient,
    quiet: true,
    id: options.id,
    allowMultipleGames: options.allowMultipleGames,
  });
  var connected = false;
  var id = options.id || "*not-yet-known*";

  server.addEventListener('connect', function(data) {
    assert(!connected, "not connected");
    connected = true;
    id = data.id;
    debug("connected" + id);
  });

  server.addEventListener('disconnect', function() {
    debug("disconnected" + id);
    assert(connected, "connected");
    connected = false;
  });

  server.addEventListener('playerconnect', function(netPlayer, name, data) {
    debug("player added" + id);
    players.push(new TestGamePlayer(netPlayer, this, data));
  }.bind(this));

  server.addEventListener('testmsg', function(data, id) {
    receivedMessages.push({cmd: 'testmsg', id: id, data: data});
  });

  server.addEventListener('gamedisconnect', function(data, id) {
    receivedMessages.push({cmd: 'gamedisconnect', id: id, data: data});
  });

  this.getNumPlayers = function() {
    return players.length;
  };

  this.removePlayer = function(player) {
    debug("removing player" + id);
    var ndx = players.indexOf(player);
    assert(ndx >= 0);
    players.splice(ndx, 1);
  };

  this.sendMessageToPlayers = function(data) {
    players.forEach(function(player) {
      player.sendCmd(data);
    });
  };

  this.socket = wsclient;

  this.getId = function() {
    return id;
  };

  this.getIdFromGameServer = function() {
    return server.id;
  };

  this.getNeedNewHFT = function() {
    return server.needNewHFT;
  };

  this.close = function() {
    wsclient.close();
  };

  this.isConnected = function() {
    return connected;
  };

  this.getPlayers = function() {
    return players.slice();
  };

  this.broadcastCmd = function(cmd, data) {
    server.broadcastCmd(cmd, data);
  };

  this.broadcastCmdToGames = function(cmd, data) {
    server.broadcastCmdToGames(cmd, data);
  };

  this.sendCmdToGame = function(cmd, id, data) {
    server.sendCmdToGame(cmd, id, data);
  };

  this.getReceivedMessages = function() {
    return receivedMessages.slice();
  };

  this.getPlayers = function() {
    return players.slice();
  };

  options.hftServer.getSocketServer().emit('connection', wsclient.server);
  wsclient.connect();
};

module.exports = TestGame;

