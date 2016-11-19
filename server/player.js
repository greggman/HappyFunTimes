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

var debug        = require('debug')('happyfuntimes:player');

/**
 * A Player in a game.
 *
 * @constructor
 * @param {!Client} client The websocket for this player
 * @param {!RelayServer} relayServer The server managing this
 *        player.
 * @param {string} id a unique id for this player.
 */
var Player = function(client, relayServer, id) {
  this.client = client;
  this.relayServer = relayServer;
  this.id = id;

  debug("" + id + ": start player");

  var addPlayerToGame = function(data) {
    var game = this.relayServer.addPlayerToGame(this, data.gameId, data.data);
    if (!game) {
      // TODO: Make this URL set from some global so we can set it some place else.
      debug("game does not exist:", data.gameId);
      this.disconnect();
    } else {
      this.setGame(game);
    }
  }.bind(this);

  this.setGame = function(game) {
    this.game = game;
  }.bind(this);

  var assignAsServerForGame = function(data) {
    this.client.on('message', undefined);
    this.client.on('disconnect', undefined);
    this.relayServer.assignAsClientForGame(data, this.client);
  }.bind(this);

  var passMessageFromPlayerToGame = function(data) {
    if (!this.game) {
      console.warn("player " + this.id + " has no game");
      return;
    }
    this.game.send(this, {
      cmd: 'update',
      id: this.id,
      data: data,
    });
  }.bind(this);

  var messageHandlers = {
    'join':   addPlayerToGame,
    'server': assignAsServerForGame,
    'update': passMessageFromPlayerToGame,
  };

  var onMessage = function(message) {
    var cmd = message.cmd;
    var handler = messageHandlers[cmd];
    if (!handler) {
      console.error("unknown player message: " + cmd);
      return;
    }

    handler(message.data);
  };

  var onDisconnect = function() {
    debug("" + this.id + ": disconnected");
    if (this.game) {
      this.game.removePlayer(this);
    }
    this.disconnect();
  }.bind(this);

  client.on('message', onMessage);
  client.on('disconnect', onDisconnect);
};

/**
 * Sends a message to this player's controller.
 * @param {object} msg data to send.
 */
Player.prototype.send = function(msg) {
  try {
    this.client.send(msg);
  } catch (e) {
    console.error("error sending to client");
    console.error(e);
    console.error("disconnecting");
    this.disconnect();
  }
};

Player.prototype.sendCmd = function(cmd, data) {
  this.send({cmd: cmd, data: data});
};


/**
 * Sends a message to the game this player is in.
 * If the player is not in a game nothing is sent.
 * @param {object} msg data to send.
 */
Player.prototype.sendToGame = function(msg) {
  if (this.game) {
    this.game.send(this, msg);
  }
};

/**
 * Disconnect this player. Drop their WebSocket connection.
 */
Player.prototype.disconnect = function() {
  this.client.on('message', undefined);
  this.client.on('disconnect', undefined);
  this.client.close();
};

module.exports = Player;

