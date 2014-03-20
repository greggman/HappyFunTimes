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

define(['./player'], function(Player) {

  var PlayerManager = function(services) {
    this.services = services;
    this.players = [];
    this.activePlayers = [];
  };

  PlayerManager.prototype.createPlayer = function(x, y, direction, name, netPlayer) {
    var player = new Player(this.services, x, y, direction, name, netPlayer);
    if (this.players.length == 0) {
      this.services.audioManager.playSound('play');
    }
    this.players.push(player);
    return player;
  }

  PlayerManager.prototype.removePlayer = function(playerToRemove) {
    var netPlayer = playerToRemove.netPlayer;
    for (var ii = 0; ii < this.players.length; ++ii) {
      var player = this.players[ii];
      if (player.netPlayer === netPlayer) {
        this.players.splice(ii, 1);
        if (this.players.length == 0) {
          this.services.audioManager.playSound('gameover');
        }
        return;
      }
    }
  };

  PlayerManager.prototype.getNumActivePlayers = function() {
    return this.activePlayers.length;
  };

  PlayerManager.prototype.addToActive = function(player) {
    this.activePlayers.push(player);
  };

  PlayerManager.prototype.removeFromActive = function(player) {
    for (var ii = 0; ii < this.activePlayers.length; ++ii) {
      if (this.activePlayers[ii].id == player.id) {
        this.activePlayers.splice(ii, 1);
        return;
      }
    }
  };

  PlayerManager.prototype.forEachPlayer = function(callback) {
    this.players.forEach(callback);
  };

  PlayerManager.prototype.forEachActivePlayer = function(callback) {
    this.activePlayers.forEach(callback);
  };

  // Should probably have a renderable object managed by a render manager or some shit like
  // that
  PlayerManager.prototype.draw = function(renderer) {
    this.activePlayers.forEach(function(player) {
      player.draw(renderer);
    });
  };

  return PlayerManager;
});

