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

var debug = require('debug')('Game');

/**
 * Represents one game running through the relaysever.
 *
 * @constructor
 *
 * @param {string} gameId id of game
 * @param {!RelayServer} relayServer relaysever managing
 *        communication for this game.
 */
var Game = function(gameId, relayServer) {
  this.gameId = gameId;
  this.relayServer = relayServer;
  this.players = {};
  this.numPlayers = 0;
  this.sendQueue = [];
};

/**
 * Returns the number of players connected to this game.
 * @return num of players connected to game.
 */
Game.prototype.getNumPlayers = function() {
  return this.numPlayers;
};

/**
 * Game objects can exist without a 'game'. If controllers
 * connect to the relayserver before the game starts the
 * `Game` object will exist but no client (the websocket
 * connected to the game) will exist yet.
 *
 * @return {boolean} true if this game object has a client
 *         (game) connected to it.
 */
Game.prototype.hasClient = function() {
  return this.client !== undefined;
};

/**
 * Adds a player to the game and sends a message to the game
 * informing the game of the new player.
 *
 * @param {!Player} player player to add.
 */
Game.prototype.addPlayer = function(player) {
  var id = player.id;
  if (this.players[id]) {
    console.error("player " + id + " is already member of game " + this.gameId);
    return;
  }
  ++this.numPlayers;
  this.players[id] = player;
  this.send(null, {cmd: 'start', id: id});
};

/**
 * Removes a player from the game and sends a messge to the game
 * telling it the player left the game.
 *
 * @param {!Player} player player to remove.
 */
Game.prototype.removePlayer = function(player) {
  var id = player.id;
  if (!this.players[id]) {
    console.error("player " + id + " is not a member of game " + this.gameId);
    return;
  }
  // remove queued messages from this player
  this.sendQueue = this.sendQueue.filter(function(msg) {
    return msg.owner !== player;
  });
  --this.numPlayers;
  delete this.players[player.id];
  this.send(null, {
    cmd: 'remove',
    id: id,
  });
};

/**
 * Sends a message to the game.
 *
 * @param {!Player} owner Player sending the message
 * @param {Object} msg the message
 */
Game.prototype.send = function(owner, msg) {
  if (this.client) {
    try {
      this.client.send(msg);
    } catch (e) {
      // This happens if the game disconnects where there are messages to send?
      console.warn("Attempt to send message to game failed: " + e.toString());
    }
  } else {
    this.sendQueue.push({owner: owner, msg: msg});
  }
};

/**
 * Call a function on each player.
 *
 * @param {!function(!Player)} fn function to call for each
 *        player
 */
Game.prototype.forEachPlayer = function(fn) {
  for (var id in this.players) {
    var player = this.players[id];
    fn(player);
  };
};

/**
 * @typedef {Object} Game~GameOptions
 * @property {string} gameId id of game (not used here
 * @property {string} controllerUrl url of controller.
 * @property {boolean} disconnectPlayersOnGameDisconnects.
 *           Default = true.
 */

/**
 *
 * @param {!Client} client Websocket client that's connected to
 *        the game.
 * @param {!RelayServer} relayserver relayserver the game is
 *        connected to.
 * @param {Game~GameOptions} data Data sent from the game which
 *        includes
 */
Game.prototype.assignClient = function(client, relayserver, data) {
  if (this.client) {
    console.error("this game already has a client!");
  }
  this.client = client;
  this.controllerUrl = data.controllerUrl;
  this.disconnectPlayersIfGameDisconnects = data.disconnectPlayersIfGameDisconnects === undefined ? true : data.disconnectPlayersIfGameDisconnects;

  var sendMessageToPlayer = function(id, message) {
    var player = this.players[id];
    if (!player) {
      console.error("no player " + id + " for game " + this.gameId);
      return;
    }
    player.send(message);
  }.bind(this);

  var broadcast = function(message) {
    this.forEachPlayer(function(player) {
      player.send(message);
    });
  }.bind(this);

  var messageHandlers = {
    'client': sendMessageToPlayer,
    'broadcast': broadcast,
  };

  var onMessage = function(message) {
    var cmd = message.cmd;
    var id = message.id;
    var handler = messageHandlers[cmd];
    if (!handler) {
      console.error("unknown game message: " + cmd);
      return;
    }

    handler(id, message.data);
  }.bind(this);

  var onDisconnect = function() {
    this.client = undefined;
    if (this.disconnectPlayersIfGameDisconnects) {
      this.relayServer.removeGame(this.gameId);
      this.forEachPlayer(function(player) {
        this.removePlayer(player);
        player.disconnect();
      }.bind(this));
    }
  }.bind(this);

  client.on('message', onMessage);
  client.on('disconnect', onDisconnect);

  // start each player
  this.forEachPlayer(function(player) {
    this.client.send({
      cmd: 'start',
      id: player.id,
    });
  }.bind(this));

  // Not sure why I even have a sendQueue
  // as the game should be running before anyone
  // joins but it seems to be useful for debugging
  // since contollers start and often immediately
  // send a name and color cmd.
  this.sendQueue.forEach(function(msg) {
    this.client.send(msg.msg);
  }.bind(this));
  this.sendQueue = [];
};

module.exports = Game;

