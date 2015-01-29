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


var debug           = require('debug')('hftgame-client');
var path            = require('path');
var Promise         = require('promise');
var requirejs       = require('requirejs');
var WebSocketClient = require('../lib/websocketclient');

requirejs.config({
  nodeRequire: require,
  paths: {
    hft: path.join(__dirname, '../public/hft/0.x.x/scripts'),
  },
});

var HFTGameClient = function(options) {
  options = options || {};
  var GameClient = requirejs('hft/gameclient');
  var wsclient = options.socket || new WebSocketClient({url: "ws://localhost:18679"});
  var client = new GameClient({
    gameId: "__hft__",
    socket: wsclient,
    quiet: true,
  });

  var noop = function() { };
  client.addEventListener('hftInfo', noop);
  client.addEventListener('connect', noop);
  client.addEventListener('error', noop);

  this.disconnectGame = function(filter) {
    return new Promise(function(resolve, reject) {
      var handleDisconnected = function(/* data */) {
        reject("disconnected from hft");
      };

      var handleGameExited = function(data) {
        console.log("game exited: " + data.gameId);
        resolve();
      };

      var handleRunningGames = function(data) {
        data.forEach(function(game) {
          if (filter(game)) {
            console.log("issuing quitGame to: " + game.gameId);
            client.sendCmd('disconnectGame', {gameId: game.gameId});
          }
        });
        resolve();
      };

      var handleConnect = function() {
        debug("connect");
      };

      client.addEventListener('gameExited', handleGameExited);
      client.addEventListener('connect', handleConnect);
      client.addEventListener('disconnect', handleDisconnected);
      client.addEventListener('runningGames', handleRunningGames);
      client.sendCmd('getRunningGames');
    });
  };

  this.exitGame = function(filter) {
    return new Promise(function(resolve, reject) {
      var handleDisconnected = function(/* data */) {
        reject("disconnected from hft");
      };

      var handleGameExited = function(data) {
        console.log("game exited: " + data.gameId);
        resolve();
      };

      var handleRunningGames = function(data) {
        data.forEach(function(game) {
          if (filter(game)) {
            console.log("issuing quitGame to: " + game.gameId);
            client.sendCmd('quitGame', {gameId: game.gameId});
          }
        });
        resolve();
      };

      client.addEventListener('gameExited', handleGameExited);
      client.addEventListener('connect', noop);
      client.addEventListener('disconnect', handleDisconnected);
      client.addEventListener('runningGames', handleRunningGames);
      client.sendCmd('getRunningGames');
    });
  };

  this.getRunningGames = function() {
    return new Promise(function(resolve, reject) {
      var handleDisconnected = function(/* data */) {
        reject("disconnected from hft");
      };

      var handleRunningGames = function(data) {
        resolve(data);
      };

      var handleConnect = function() {
        debug("connect");
      };

      client.addEventListener('connect', handleConnect);
      client.addEventListener('disconnect', handleDisconnected);
      client.addEventListener('runningGames', handleRunningGames);
      client.sendCmd('getRunningGames');
    });
  };

  this.getAvailableGames = function() {
    return new Promise(function(resolve, reject) {
      var handleDisconnected = function(/* data */) {
        reject("disconnected from hft");
      };

      var handleAvailableGames = function(data) {
        resolve(data);
      };

      var handleConnect = function() {
        debug("connect");
      };

      client.addEventListener('connect', handleConnect);
      client.addEventListener('disconnect', handleDisconnected);
      client.addEventListener('availableGames', handleAvailableGames);
      client.sendCmd('getAvailableGames');
    });
  };
};

module.exports = HFTGameClient;
