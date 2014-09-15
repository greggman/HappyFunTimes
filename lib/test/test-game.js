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

var debug          = require('debug')('test-game');
var requirejs      = require('requirejs');
var path           = require('path');

requirejs.config({
  nodeRequire: require,
  paths: {
    hft: path.join(__dirname, '../../public/hft/0.x.x/scripts'),
  },
});

var GameServer = requirejs('hft/gameserver');

// Not to be confused with TestController (client side)
var TestGamePlayer = function(netPlayer) {
  this.netPlayer = netPlayer;
};

var TestGame = function(options) {
  var players = [];
  var wsclient = options.socket || new LoopbackClient();
  var server = new GameServer({
    gameId: "__test__",
    socket: wsclient,
  });

  server.addEventListener('connnect', function() {
    debug("connected");
  });
  server.addEventListener('disconnnect', function() {
    debug("disconnected");
  });
  server.addEventListener('playerconnect', function(netPlayer, name) {
    debug("player added")
    players.push(new TestGamePlayer(netPlayer));
  }.bind(this));

  this.getNumPlayers = function() {
    return players.length;
  };
};

module.exports = TestGame;

