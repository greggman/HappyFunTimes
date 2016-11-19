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

var debug        = require('debug')('happyfuntimes:game');
var hftSite      = require('./hftsite');

/**
 * @typedef {object} Game~Options
 */

/**
 * Represents one game running through the relaysever.
 *
 * @constructor
 *
 * @param {string} id id of game
 * @param {GameGroup} gameGroup the group this game belongs to.
 * @param {Game~Options} options
 */
var Game = function(id, gameGroup, options) {
  options = options || {};
  this.id = id;
  this.gameGroup = gameGroup;
  this.players = {};
  this.numPlayers = 0;
  this.sendQueue = [];
  this.options = options;
  this.setGameId();
  debug("create game " + this.gameId);
};

Game.prototype.getControllerUrl = function() {
  return "/controller.html";
};

Game.prototype.setGameId = function() {
  this.gameId = " id=" + this.id;
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
 * connect to happyfuntimes before the game starts the
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
 * @param {Player} player player to add.
 * @param {Object?} data data to send on connect
 */
Game.prototype.addPlayer = function(player, data) {
  debug("addPlayer:" + player.id + " to game " + this.gameId);
  var id = player.id;
  if (this.players[id]) {
    console.error("player " + id + " is already member of game " + this.gameId);
    return;
  }
  player.setGame(this);
  ++this.numPlayers;
  this.players[id] = player;
  this.send(null, {cmd: 'start', id: id, data: data});
};

/**
 * Removes a player from the game and sends a messge to the game
 * telling it the player left the game.
 *
 * @param {!Player} player player to remove.
 */
Game.prototype.removePlayer = function(player) {
  debug("removePlayer:" + player.id + " from game " + this.gameId);
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
      if (e.stack) {
        console.warn(e.stack);
      }
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
  }
};

/**
 * @typedef {Object} Game~GameOptions
 * @property {string} gameId id of game (not used here)
 * @property {boolean?} disconnectPlayersIfGameDisconnects.
 *           Default = true.
 * @property {boolean?} showInList
 * @property {boolean?} master Make this game the game that
 *           receives new players
 * @property {boolean?} allowMultipleGames. Normally if a new
 *           game with the same id connects it will replace the
 *           old game. With this set to true the old game will
 *           remain, the new game will be added, players are
 *           still added to the old game. Use
 *           `NetPlayer.switchGame` to move a player between
 *           games.
 * @property {string?} id can be used to switch player to
 *           another game
 */

/**
 *
 * @param {!Client} client Websocket client that's connected to
 *        the game.
 * @param {Game~GameOptions} data Data sent from the game which
 *        includes
 */
Game.prototype.assignClient = function(client, data) {
  hftSite.inform();
  if (this.client) {
    console.error("this game already has a client!" + this.gameId);
    this.client.close();
  }
  this.client = client;
  this.client.clearTimeout();
  this.disconnectPlayersIfGameDisconnects = data.disconnectPlayersIfGameDisconnects === undefined ? true : data.disconnectPlayersIfGameDisconnects;
  this.showInList = data.showInList;
  if (data.files) {
    this.gameGroup.addFiles(data.files);
  }
  this.setGameId();

  var sendMessageToPlayer = function(id, message) {
    var player = this.players[id];
    if (!player) {
      console.error("sendMessageToPlayer: no player " + id + " for game " + this.gameId);
      return;
    }
    player.send(message);
  }.bind(this);

  var broadcast = function(id, message) {
    this.forEachPlayer(function(player) {
      player.send(message);
    });
  }.bind(this);

  var switchGame = function(id, data) {
    var player = this.players[id];
    if (!player) {
      console.error("switchGame: no player " + id + " for game " + this.gameId);
      return;
    }
    this.removePlayer(player);
    this.gameGroup.addPlayerToGame(player, data.gameId, data.data);
  }.bind(this);

  var sendMessageToGame = function(destId, data) {
    this.gameGroup.sendMessageToGame(this.id, destId, data);
  }.bind(this);

  var broadcastToGames = function(id, data) {
    this.gameGroup.broadcastMessageToGames(this.id, id, data);
  }.bind(this);

  var messageHandlers = {
    'client': sendMessageToPlayer,
    'broadcast': broadcast,
    'switchGame': switchGame,
    'peer': sendMessageToGame,
    'bcastToGames': broadcastToGames,
  };

  var onMessage = function(message) {
    var cmd = message.cmd;
    var id = message.id;
    var handler = messageHandlers[cmd];
    if (!handler) {
      console.error("unknown game message: " + cmd + " for :" + this.gameId);
      return;
    }

    handler(id, message.data);
  }.bind(this);

  var onDisconnect = function() {
    debug("closing:" + this.gameId);
    if (this.client) {
      var client = this.client;
      this.client = undefined;
      debug("closing client:" + this.gameId);
      client.close();
    }
    this.gameGroup.removeGame(this);
    if (this.disconnectPlayersIfGameDisconnects) {
      this.forEachPlayer(function(player) {
        this.removePlayer(player);
        player.disconnect();
      }.bind(this));
    }
  }.bind(this);

  client.on('message', onMessage);
  client.on('disconnect', onDisconnect);

  // Tell the game it's id
  this.client.send({
    cmd: 'gamestart',
    data: {
      id: this.id,
      gameId: (this.runtimeInfo ? this.runtimeInfo.info.happyFunTimes.gameId : ""),
      needNewHFT: (this.runtimeInfo ? this.runtimeInfo.needNewHFT : false),
    },
  });

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

  this.close = function() {
    onDisconnect();
  };
};

// report error back to game
Game.prototype.error = function(msg) {
  console.error(msg);
  if (this.client) {
    this.client.send({
      cmd: 'log',
      data: {
        type: 'error',
        msg: msg,
      },
    });
  }
};

Game.prototype.sendSystemCmd = function(cmd, data) {
  this.send(null, {cmd: "system", data: {cmd: cmd, id: -1, data: data}});
};

Game.prototype.sendQuit = function() {
  this.sendSystemCmd('exit', {});
};

Game.prototype.sendGameDisconnect = function(otherGame) {
  if (this.client) {  // this check is needed because in GameGroup.assignClient the new game has been added to games but not yet assigned a client

    var data = {};

    data.id = otherGame.id;

    this.client.send({
      cmd: 'upgame',
      id: otherGame.id,
      data: {
        cmd: 'gamedisconnect',
        data: data,
      },
    });
  }
};

module.exports = Game;

