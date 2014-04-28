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

  var clearOffsets = [
    { x:  0, y:  0, },
    { x:  1, y:  0, },
    { x: -1, y:  0, },
    { x:  0, y:  1, },
    { x:  0, y: -1, },
  ];

  var PlayerManager = function(services) {
    this.services = services;
    this.players = [];
window.p = this.players;
  };

  PlayerManager.prototype.reset = function() {
    var levelManager = this.services.levelManager;
    var tiles = levelManager.tiles;

    this.forEachPlayer(function(player, ii) {
      var tx = (1 + ii * 4);
      var ty = (1 + ii * 2);

      for (var ii = 0; ii < clearOffsets.length; ++ii) {
        var off = clearOffsets[ii];
        levelManager.layer1.setTile(tx + off.x, ty + off.y, tiles.empty.id);
      }
      player.reset(
        (tx + 0.5) * levelManager.tileset.tileWidth,
        (ty + 0.5) * levelManager.tileset.tileHeight);
    });

    levelManager.setWalls();
  };

  PlayerManager.prototype.startPlayer = function(netPlayer, name) {
    var misc = this.services.misc;
    var levelManager = this.services.levelManager;
    var position = [
      (1 + this.players.length * 4) * levelManager.tileset.tileWidth,
      (1 + this.players.length * 2) * levelManager.tileset.tileHeight,
    ];
    var player = new Player(this.services, position, name, netPlayer);
    this.players.push(player);
    return player;
  };

  PlayerManager.prototype.removePlayer = function(playerToRemove) {
    var netPlayer = playerToRemove.netPlayer;
    for (var ii = 0; ii < this.players.length; ++ii) {
      var player = this.players[ii];
      if (player.netPlayer === netPlayer) {
        this.players.splice(ii, 1);
        return;
      }
    }
  };

  PlayerManager.prototype.forEachPlayer = function(callback) {
    for (var ii = 0; ii < this.players.length; ++ii) {
      if (callback(this.players[ii], ii)) {
        return this;
      }
    }
  };

  return PlayerManager;
});

