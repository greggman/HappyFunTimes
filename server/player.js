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

var debug = require('debug')('player');

var Player = function(client, relayServer, id) {
  this.game;
  this.client = client;
  this.relayServer = relayServer;
  this.id = id;
  this.intervalId;
  this.timeout = 5; // 5 seconds
  this.timeoutCheckInterval = 2; // check every 2 seconds
  this.waitingForPing = false;

  var getTime = function() {
    return Date.now() * 0.001;
  };

  var checkTimeout = function() {
    // How much time has passed since last message
    var now = getTime();
    var elapsedTime = getTime() - this.timeOfLastMessageFromPlayer;
    if (elapsedTime >= this.timeout) {
      if (this.waitingForPing) {
        // No ping from player. Kill this
        this.game.removePlayer(this);
        this.disconnect();
      } else {
        // send ping
        this.waitingForPing = true;
        this.send({cmd: '__ping__'});
      }
    }
  }.bind(this);
  this.intervalId = setInterval(checkTimeout, this.timeoutCheckInterval * 1000);

  var addPlayerToGame = function(data) {
    var game = this.relayServer.addPlayerToGame(this, data.gameId);
    this.game = game;
  }.bind(this);

  var assignAsServerForGame = function(data) {
    // Seems like player should stop existing at this point?
    //this.client('onmessage', undefined);
    //this.client('ondisconnect', undefined);
    this.relayServer.assignAsClientForGame(data, this.client);
  }.bind(this);

  var passMessageFromPlayerToGame = function(data) {
    this.timeOfLastMessageFromPlayer = getTime();
    this.game.send(this, {
      cmd: 'update',
      id: this.id,
      data: data,
    });
  }.bind(this);

  var pingAcknowledged = function(data) {
    this.timeOfLastMessageFromPlayer = getTime();
    this.waitingForPing = false;
  }.bind(this);

  var messageHandlers = {
    'join':   addPlayerToGame,
    'server': assignAsServerForGame,
    'update': passMessageFromPlayerToGame,
    'pong':   pingAcknowledged,
  };

  var onMessage = function(message) {
    var cmd = message.cmd;
    var handler = messageHandlers[cmd];
    if (!handler) {
      console.error("unknown player message: " + cmd);
      return;
    }

    handler(message.data);
  }.bind(this);

  var onDisconnect = function() {
    if (this.game) {
      this.game.removePlayer(this);
    }
    this.disconnect();
  }.bind(this);

  client.on('message', onMessage);
  client.on('disconnect', onDisconnect);
};

Player.prototype.send = function(msg) {
  try {
    this.client.send(msg);
  } catch (e) {
    console.error("error sending to client: " + e);
    console.error("disconnecting");
    this.disconnect();
  }
};

Player.prototype.sendToGame = function(msg) {
  if (this.game) {
    this.game.send(this, msg);
  }
};

Player.prototype.disconnect = function() {
  clearInterval(this.intervalId);
  this.client.on('message', undefined);
  this.client.on('disconnect', undefined);
  this.client.close();

};

module.exports = Player;

