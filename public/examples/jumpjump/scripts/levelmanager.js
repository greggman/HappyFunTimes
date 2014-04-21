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

define(['../../scripts/Misc'], function(Misc) {

  var Level = function(width, height, tileWidth, tileHeight, tiles) {
    this.width = width + 2;
    this.height = height + 2;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.levelWidth = this.width * this.tileWidth;
    this.levelHeight = this.height * this.tileHeight;
    this.outOfBoundsTile = "#".charCodeAt(0);
    if (typeof(tiles) == 'string') {
      var t = [];
      // Add top line
      for (var ii = 0; ii < this.width; ++ii) {
        t.push(this.outOfBoundsTile);
      }
      // Add lines of original plus abounds
      for (var yy = 0; yy < height; ++yy) {
        t.push(this.outOfBoundsTile);
        for (var xx = 0; xx < width; ++xx) {
          t.push(tiles.charCodeAt(yy * width + xx));
        }
        t.push(this.outOfBoundsTile);
      }
      // Add bottom line
      for (var ii = 0; ii < this.width; ++ii) {
        t.push(this.outOfBoundsTile);
      }
      tiles = t;
    }
    this.tiles = tiles;
    this.needsUpdate = true;
  };

  Level.prototype.getTile = function(tileX, tileY) {
    if (tileX >= 0 && tileX < this.width &&
        tileY >= 0 && tileY < this.height) {
      return this.tiles[tileY * this.width + tileX];
    }
    return this.outOfBoundsTile;
  };

  Level.prototype.getTileByPixel = function(x, y) {
    var tileX = Math.floor(x / this.tileWidth);
    var tileY = Math.floor(y / this.tileHeight);
    return this.getTile(tileX, tileY);
  };

  Level.prototype.getTransformOffset = function(ctx) {
    return {
      x: ((ctx.canvas.width  - this.levelWidth ) / 2) | 0,
      y: ((ctx.canvas.height - this.levelHeight) / 2) | 0,
    };
  };

  Level.prototype.setTransformForDrawing = function(ctx) {
    var offset = this.getTransformOffset(ctx);
    ctx.translate(offset.x, offset.y);
  };

  Level.prototype.draw = function(ctx, levelManager) {
    if (!this.needsUpdate) {
      return;
    }

    ctx.fillStyle = "#444";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.save();
    this.setTransformForDrawing(ctx);

    ctx.fillStyle = "lightblue";
    ctx.fillRect(0, 0, this.levelWidth, this.levelHeight);

    for (var ty = 0; ty < this.height; ++ty) {
      for (var tx = 0; tx < this.width; ++tx) {
        var tile = this.tiles[ty * this.width + tx];
        var info = levelManager.getTileInfo(tile);
        var x = tx * this.tileWidth;
        var y = ty * this.tileHeight;
        if (info) {
          if (info.imgName) {
            var imgInfo = levelManager.services.images[info.imgName];
            var frames = imgInfo.colors[0];
            var img = frames[0];
            ctx.drawImage(img, x, y);
          } else if (info.color) {
            ctx.fillStyle = info.color;
            ctx.fillRect(x, y, this.tileWidth, this.tileHeight);
          }
        }
      }
    }

    ctx.restore();
  };

  var level1 = new Level(
    20, 10,
    32, 32,
    [ // 01234567890123456789
        "                    ", // 0
        "                    ", // 1
        "                    ", // 2
        "         #####      ", // 3
        "                    ", // 4
        "                    ", // 5
        "     ####      ##   ", // 6
        "              ####  ", // 7
        " #           ###### ", // 8
        "###         ########", // 9
    ].join(""));

  var tileInfoSky = {
    collisions: false,
  };

  var tileInfoWall = {
    collisions: true,
    color: "white",
    imgName: "brick",
  };

  var tileInfoMap = {};
  tileInfoMap[' '.charCodeAt(0)] = tileInfoSky;
  tileInfoMap['#'.charCodeAt(0)] = tileInfoWall;

  var LevelManager = function(services) {
    this.services = services;
    this.level = level1;
  };

  LevelManager.prototype.getTileInfo = function(tileId) {
    return tileInfoMap[tileId];
  };

  LevelManager.prototype.getTileInfoByPixel = function(x, y) {
    var tileId = this.level.getTileByPixel(x, y);
    return this.getTileInfo(tileId);
  }

  LevelManager.prototype.draw = function(ctx) {
    this.level.draw(ctx, this);
  };

  LevelManager.prototype.getLevel = function() {
    return this.level;
  };

  LevelManager.prototype.getRandomOpenPosition = function() {
    var level = this.level;
    var found = false;
    while (!found) {
      var x = (2 + Misc.randInt(level.width  - 4)) * level.tileWidth;
      var y = (2 + Misc.randInt(level.height - 4)) * level.tileHeight;
      var tile = this.getTileInfoByPixel(x, y);
      found = !tile.collisions;
    }
    return {x: x, y: y};
  };

  return LevelManager;
});

