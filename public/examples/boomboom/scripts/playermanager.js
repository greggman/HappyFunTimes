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

define([
    '../../../scripts/misc/misc',
    './player',
  ], function(Misc, Player) {

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
    this.playersPlaying = [];
window.p = this.players;
  };

  PlayerManager.prototype.reset = function() {
    var levelManager = this.services.levelManager;
    var tiles = levelManager.tiles;
    var canvas = this.services.canvas;
    var globals = this.services.globals;
    var mapSize = levelManager.computeMapSize(canvas.width, canvas.height, globals.scale);

    // Always choose corners first?
    // Then choose others at random?
    var lastRow = mapSize.numRows - 1;
    var lastCol = mapSize.numColumns - 1;
    var numPositionsIfBy3 = ((mapSize.numColumns + 2) / 3 | 0) * ((mapSize.numRows + 2) / 3 | 0);
    var numPositionsIfBy2 = ((mapSize.numColumns + 1) / 2 | 0) * ((mapSize.numRows + 1) / 2 | 0);

    var step = 1;
    if (this.players.length <= numPositionsIfBy3) {
      step = 3;
    } else if (this.players.length <= numPositionsIfBy2) {
      step = 2;
    }

    var corners = [
      { x:               1, y:               1, },
      { x: 1 + lastCol * 2, y:               1, },
      { x:               1, y: 1 + lastRow * 2, },
      { x: 1 + lastCol * 2, y: 1 + lastRow * 2, },
    ];
    var others = [];
    for (var y = 0, yy = 0; yy < mapSize.numRows; ++y, yy += step) {
      for (var x = 0, xx = 0; xx < mapSize.numColumns; ++x, xx += step) {
        var isCorner = (xx == 0 && yy == 0) ||
                       (xx == 0 && yy == lastRow) ||
                       (xx == lastCol && yy == 0) ||
                       (xx == lastCol && yy == lastRow);
        if (!isCorner) {
          var tx = Math.min(mapSize.across - 2, 1 + (xx + y % step) * 2);
          var ty = Math.min(mapSize.down   - 2, 1 + (yy + x % step) * 2);
          others.push({x: tx, y: ty});
        }
      }
    }

    // make opposite corners #0 and #1
    var t = corners[1];
    corners[1] = corners[3];
    corners[3] = t;

    // window.o = others.slice();
    // console.log("step: " + step + ", cols: " + mapSize.numColumns + " rows: " + mapSize.numRows);
    // console.log("positions available: " + (others.length + 4));
    // console.log("positions needed   : " + this.players.length);

    // To corners add numPlayers - 4 random others.
    var numNeeded = this.players.length - 4;
    for (var ii = 0; ii < numNeeded; ++ii) {
      var index = Misc.randInt(others.length);
      corners.push(others.splice(index, 1)[0]);
    }

    // Keep only what we need (there might be 4 corners and 2 players for example)
    corners = corners.slice(0, this.players.length);

    // now choose random places to start players from valid place.
    this.forEachPlayer(function(player, ii) {
      var index = Misc.randInt(corners.length);
      var pos = corners.splice(index, 1)[0];
      var tx = pos.x;
      var ty = pos.y;

      if (tx < 1 || ty < 1 || tx > mapSize.across - 2 || ty > mapSize.down - 2) {
        throw 'WTF';
      }
      for (var ii = 0; ii < clearOffsets.length; ++ii) {
        var off = clearOffsets[ii];
        levelManager.layer1.setTile(tx + off.x, ty + off.y, tiles.empty.id);
      }
      player.reset(
        (tx + 0.5) * levelManager.tileset.tileWidth  | 0,
        (ty + 0.5) * levelManager.tileset.tileHeight | 0);
    });

    levelManager.setWalls();
    // Players that connect while a session will increase players.length so
    // record the players playing at the time the game starts.
    this.playersPlaying = this.players.slice();
    this.numPlayersAlive = this.players.length;
  };

  PlayerManager.prototype.playerDied = function() {
    --this.numPlayersAlive;
  }

  PlayerManager.prototype.getNumPlayersAlive = function() {
    return this.numPlayersAlive;
  };

  PlayerManager.prototype.getNumPlayersPlaying = function() {
    return this.playersPlaying.length;
  };

  PlayerManager.prototype.getNumPlayersConnected = function() {
    return this.players.length;
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
    var index = this.players.indexOf(playerToRemove);
    if (index >= 0) {
      this.players.splice(index, 1);
    }
    index = this.playersPlaying.indexOf(playerToRemove);
    if (index >= 0) {
      this.playersPlaying.splice(index, 1);
    }
  };

  PlayerManager.prototype.forEachPlayerPlaying = function(callback) {
    for (var ii = 0; ii < this.playersPlaying.length; ++ii) {
      if (callback(this.playersPlaying[ii], ii)) {
        return this;
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

