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
    '../../scripts/tilemap',
  ], function(Misc, TileMap) {

  var charToTileId = {
    ' ': { tileId: 0x0001, },
    '#': { tileId: 0x0002, },
  };

  var Level = function(tileset, width, height, tiles) {
    this.width = width + 2;
    this.height = height + 2;
    this.tileWidth = tileset.tileWidth;
    this.tileHeight = tileset.tileHeight;
    this.levelWidth = this.width * this.tileWidth;
    this.levelHeight = this.height * this.tileHeight;
    this.outOfBoundsTile = charToTileId['#'].tileId;
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
          t.push(charToTileId[tiles.substr(yy * width + xx, 1)].tileId);
        }
        t.push(this.outOfBoundsTile);
      }
      // Add bottom line
      for (var ii = 0; ii < this.width; ++ii) {
        t.push(this.outOfBoundsTile);
      }
      tiles = t;
    }

    this.tiles = new Uint32Array(tiles);
    this.uint8view = new Uint8Array(this.tiles.buffer);
    this.uint16view = new Uint16Array(this.tiles.buffer);
    this.tilemap = new TileMap({
      mapTilesAcross: this.width,
      mapTilesDown: this.height,
      tilemap: this.uint8view,
      tileset: tileset,
    });

    this.tileDrawOptions = {
      x: 0,
      y: 0,
      width:  this.width  * this.tileWidth ,
      height: this.height * this.tileHeight,
      canvasWidth: 0, //this.canvas.width,
      canvasHeight: 0, //this.canvas.height,
      scrollX: 0,
      scrollY: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      originX: 0,
      originY: 0,
    };
  };

  Level.prototype.getTile = function(tileX, tileY) {
    if (tileX >= 0 && tileX < this.width &&
        tileY >= 0 && tileY < this.height) {
      return this.uint16view[(tileY * this.width + tileX) * 2];
    }
    return this.outOfBoundsTile;
  };

  Level.prototype.getTileByPixel = function(x, y) {
    var tileX = Math.floor(x / this.tileWidth);
    var tileY = Math.floor(y / this.tileHeight);
    return this.getTile(tileX, tileY);
  };

  Level.prototype.getDrawOffset = function(obj) {
    obj.x = ((gl.canvas.width  - this.levelWidth ) / 2) | 0;
    obj.y = ((gl.canvas.height - this.levelHeight) / 2) | 0;
  };

  Level.prototype.draw = function(levelManager) {
    if (this.dirty) {
      this.tilemap.uploadTilemap();
      this.dirty = false;
    }

    var opt = this.tileDrawOptions;
    this.getDrawOffset(opt);
    opt.canvasWidth = gl.canvas.width;
    opt.canvasHeight = gl.canvas.height;
    this.tilemap.draw(opt);
  };

  var levels = [];

  var initLevels = function(tileset) {
    levels.push(new Level(
      tileset,
      20, 10,
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
      ].join("")));

    levels.push(new Level(
      tileset,
      30, 15,
      [ // 012345678901234567890123456789
          "                              ", // 0
          "                              ", // 1
          "                              ", // 2
          "         #####                ", // 3
          "                   ######     ", // 4
          "                              ", // 5
          "     ####                     ", // 6
          "             ##########       ", // 7
          " #                            ", // 8
          "###                           ", // 9
          "#####                 ###     ", //
          "#######              #####    ", //
          "########            #######   ", //
          "#####      ###     #########  ", //
          "###               ########### ", //
      ].join("")));

    levels.push(new Level(
      tileset,
      40, 20,
      [ // 0123456789012345678901234567890123456789
          "                                        ", // 0
          "                                        ", // 1
          "                                        ", // 2
          "         #####                          ", // 3
          "                           ####         ", // 4
          "                                        ", // 5
          "     ####      ##                       ", // 6
          "                      #####             ", // 7
          "                                        ", // 8
          "###    ########                         ", // 9
          "                           #####        ", //
          "                                        ", //
          "     #####                              ", //
          "                               #######  ", //
          "                                        ", //
          "                                        ", //
          "                           ###          ", //
          "  #    ########          #######        ", //
          " ###                   ###########      ", //
          "#####                ################   ", //
      ].join("")));
  };

  var tileInfoSky = {
    collisions: false,
  };

  var tileInfoWall = {
    collisions: true,
    color: "white",
    imgName: "brick",
  };

  var tileInfoMap = {};
  tileInfoMap[charToTileId[' '].tileId] = tileInfoSky;
  tileInfoMap[charToTileId['#'].tileId] = tileInfoWall;

  var LevelManager = function(services, tileset) {
    this.services = services;
    this.tileset = tileset;

    initLevels(tileset);
  };

  LevelManager.prototype.reset = function(canvasWidth, canvasHeight) {
    // pick the largest level that fits
    var largestLevel = levels[0];
    var largestSize = 0;
    for (var ii = 0; ii < levels.length; ++ii) {
      var level = levels[ii];
      var hSpace = canvasWidth  - level.levelWidth;
      var vSpace = canvasHeight - level.levelHeight;
      if (hSpace >= 0 && vSpace >= 0) {
        var size = level.levelWidth * level.levelHeight;
        if (size > largestSize) {
          largestSize = size;
          largestLevel = level;
        }
      }
    }
    this.level = largestLevel;
    this.level.needsUpdate = true;
  };

  LevelManager.prototype.getTileInfo = function(tileId) {
    return tileInfoMap[tileId];
  };

  LevelManager.prototype.getTileInfoByPixel = function(x, y) {
    var tileId = this.level.getTileByPixel(x, y);
    return this.getTileInfo(tileId);
  }

  LevelManager.prototype.draw = function() {
    this.level.draw(this);
  };

  LevelManager.prototype.getLevel = function() {
    return this.level;
  };

  LevelManager.prototype.getDrawOffset = function(obj) {
    this.level.getDrawOffset(obj);
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

