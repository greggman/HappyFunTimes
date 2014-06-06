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

  var iEmpty = {
    bombOk: true,
  };
  var iSolid = {
    solid: true,
    flameStop: true,
  };
  var iGoldCrate = {
    flameStop: true,
    flameEat: true,
    crateType: 'gold',
  };
  var iKickCrate = {
    flameStop: true,
    flameEat: true,
    crateType: 'kick',
  };
  var iBombCrate = {
    flameStop: true,
    flameEat: true,
    crateType: 'bomb',
  };
  var iFlameCrate = {
    flameStop: true,
    flameEat: true,
    crateType: 'flame',
  };
  var iCrate = {
    solid: true,
    flameStop: true,
    flameEat: true,
    crate: true,
  };
  var iBush = {
    solid: true,
    flameStop: true,
    flameEat: true,
  };
  var iFlame = {
    bombOk: true,  // yes you can place a bomb here. If you do it will blow up
    flame: true,
  };
  var iBomb = {
    solid: true,
    flameStop: true,
    bomb: true,
  };
  var iPipeH = {
    solid: true,
    flameStop: true,
  };
  var iPipeV = {
    solid: true,
    flameStop: true,
  };
  var iPipeU = {
    solid: true,
    flameStop: true,
  };
  var iPipeD = {
    solid: true,
    flameStop: true,
  };
  var iPipeL = {
    solid: true,
    flameStop: true,
  };
  var iPipeR = {
    solid: true,
    flameStop: true,
  };
  var iPipeRU = {
    solid: true,
    flameStop: true,
  };
  var iPipeLU = {
    solid: true,
    flameStop: true,
  };
  var iPipeRD = {
    solid: true,
    flameStop: true,
  };
  var iPipeLD = {
    solid: true,
    flameStop: true,
  };

  // normal I'd make this at build time. Either I'd much a a bunch of icons representing
  // meanings and using a tile based level editor make a special kind of map that
  // associates meanings with images. As one example I might decide the first column
  // is the image and the following columns are means so
  //
  // [ground][empty  ]
  // [grass1][empty  ]
  // [grass2][empty  ]
  // [bush  ][solid  ]
  // [pipel ][pipe   ][left    ]
  // [piper ][pipe   ][right   ]
  // [pipelu][pipe   ][left    ][up      ]
  //
  // At build time I'd read that map and generate this table.
  //
  // Or, I could let you select the images and assign meanings (bring up a dialog,
  // select bits). I like the visual way better because at a glance you can see
  // multple tiles.
  //
  // Thought it's more common, what I would be less likely to do is put the meanings
  // in the map. Many games of a set of bits for each tile in the map. A few things
  // I don't like about that solution
  //
  // 1.  It's error prone.
  //
  //     Beacuse you manually have to set bits if you forget to set all the right
  //     bits for each tile there's bugs. Forget to set a solid bit on a wall for example
  //     and you can walk through that wall. You might be thinking that lets you make
  //     secrets but you can also do that by just making an identical image that associates
  //     to different meanings.
  //
  //     In general, with the meanings associated with the tiles, not the map, it's much
  //     harder to make a mistake.
  //
  // 2.  It encourages better design.
  //
  //     I'd argue better games are consistent. When you move the meaning to the map
  //     You allow designs where any image can have any meaning. Someone can mark a
  //     piece of grass has deadly or a bomb as fake. IMO those kind of inconisitencies
  //     almost always make for a worse game.
  //
  //     You can still do the same with meanings associated with the tiles but it's
  //     a much more deliberate act because you have to make a duplicate image. You
  //     can just go around the map willy nilly marking any image do have any random
  //     meaning.

  var tiles = {
    ground:     { id: 0x0000, info: iEmpty, },
    grass1:     { id: 0x0001, info: iEmpty, },
    grass2:     { id: 0x0002, info: iEmpty, },
    bush:       { id: 0x0003, info: iBush, },
    empty:      { id: 0x0004, info: iEmpty, },
    goldCrate:  { id: 0x0005, info: iGoldCrate, },
    kickCrate:  { id: 0x0006, info: iKickCrate, },
    bombCrate:  { id: 0x0007, info: iBombCrate, },
    flameCrate: { id: 0x0008, info: iFlameCrate, },
    crate:      { id: 0x0009, info: iCrate, },
    pipeRD:     { id: 0x000A, info: iPipeRD, },
    flameU:     { id: 0x000E, info: iFlame, },
    pipeLD:     { id: 0x010A, info: iPipeLD, },
    pipeV:      { id: 0x010D, info: iPipeV, },
    flameV:     { id: 0x010E, info: iFlame, },
    pipeLU:     { id: 0x020A, info: iPipeLU, },
    pipeU:      { id: 0x020C, info: iPipeU, },
    flameD:     { id: 0x020E, info: iFlame, },
    pipeRU:     { id: 0x030A, info: iPipeRU, },
    pipeD:      { id: 0x030C, info: iPipeD, },
    wall:       { id: 0x040A, info: iSolid, },
    pipeL:      { id: 0x040C, info: iPipeL, },
    pipeR:      { id: 0x040D, info: iPipeR, },
    flameL:     { id: 0x0500, info: iFlame, },
    flameH:     { id: 0x0501, info: iFlame, },
    flameM:     { id: 0x0502, info: iFlame, },
    flameR:     { id: 0x0503, info: iFlame, },
    bomb0:      { id: 0x0504, info: iBomb, },
    bomb1:      { id: 0x0505, info: iBomb, },
    bomb2:      { id: 0x0506, info: iBomb, },
    bomb3:      { id: 0x0507, info: iBomb, },
    bomb4:      { id: 0x0508, info: iBomb, },
    bomb5:      { id: 0x0509, info: iBomb, },
    road:       { id: 0x050A, info: iEmpty, },
    pipeH:      { id: 0x050B, info: iPipeH, },
  };

  var s_outOfBoundsTile = 0x040A; // wall

  var tileInfoMap = {};
  for (var tileName in tiles) {
    var tile = tiles[tileName];
    tileInfoMap[tile.id] = tile;
  }

  var Layer = function(width, height, scale, tileset, opt_outOfBoundsTile) {
    var numTiles = width * height;
    this.width = width;
    this.height = height;
    this.tileWidth = tileset.tileWidth;
    this.tileHeight = tileset.tileHeight;
    this.outOfBoundsTile = opt_outOfBoundsTile || 0;
    this.uint32View = new Uint32Array(numTiles);
    this.uint8View = new Uint8Array(this.uint32View.buffer);
    this.uint16View = new Uint16Array(this.uint32View.buffer);
    this.dirty = false;

    this.tilemap = new TileMap({
      mapTilesAcross: width,
      mapTilesDown: height,
      tilemap: this.uint8View,
      tileset: tileset,
    });

    this.tileDrawOptions = {
      x: 0,
      y: 0,
      width:  width  * tileset.tileWidth  * scale,
      height: height * tileset.tileHeight * scale,
      canvasWidth: 0, //this.canvas.width,
      canvasHeight: 0, //this.canvas.height,
      scrollX: 0,
      scrollY: 0,
      rotation: 0,
      scaleX: scale,
      scaleY: scale,
      originX: 0,
      originY: 0,
    };
  };

  Layer.prototype.setTile = function(tx, ty, value) {
    this.uint16View[(ty * this.width + tx) * 2] = value;
    this.dirty = true;
  };

  Layer.prototype.getTile = function(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
      return this.outOfBoundsTile;
    }
    return this.uint16View[(ty * this.width + tx) * 2];
  };

  Layer.prototype.getTileByPixels = function(x, y) {
    return this.getTile((x / this.tileWidth) | 0, (y / this.tileHeight) | 0);
  };

  Layer.prototype.setTileByPixels = function(x, y, value) {
    this.setTile((x / this.tileWidth) | 0, (y / this.tileHeight) | 0, value);
  };

  Layer.prototype.setTiles = function(tilesTexture) {
    this.tileDrawOptions.tiles = tilesTexture;
  };

  Layer.prototype.draw = function(renderer, levelManager) {
    if (this.dirty) {
      this.tilemap.uploadTilemap();
      this.dirty = false;
    }

    var opt = this.tileDrawOptions;
    levelManager.getDrawOffset(opt);
    opt.canvasWidth = renderer.canvas.width;
    opt.canvasHeight = renderer.canvas.height;
    this.tilemap.draw(opt);
  };

  var LevelManager = function(services, tileset) {
    this.services = services;
    this.tileset = tileset;
    this.tiles = tiles;
  };

  LevelManager.prototype.getTileInfo = function(tileId) {
    return tileInfoMap[tileId];
  };

  LevelManager.prototype.setWalls = function() {
    var layer1 = this.layer1;
    var tilesAcross = this.tilesAcross;
    var tilesDown = this.tilesDown;

    var wall = tiles.wall.id;

    // put in the edges
    for (var ii = 0; ii < tilesAcross; ++ii) {
      layer1.setTile(ii, 0, wall);
      layer1.setTile(ii, tilesDown - 1, wall);
    }
    for (var ii = 0; ii < tilesDown; ++ii) {
      layer1.setTile(0, ii, wall);
      layer1.setTile(tilesAcross - 1, ii, wall);
    }
    // put in the grid
    var numColumns = (tilesAcross - 1) / 2;
    var numRows    = (tilesDown   - 1) / 2;
    for (var yy = 0; yy < numRows - 1; ++yy) {
      for (var xx = 0; xx < numColumns - 1; ++xx) {
        layer1.setTile(xx * 2 + 2, yy * 2 + 2, wall);
      }
    };
  };

  LevelManager.prototype.computeMapSize = function(width, height, scale) {
    // figure out how many tiles we can fit.
    var mapSize = {
      across: Math.floor(width  / (this.tileset.tileWidth  * scale)),
      down:   Math.floor(height / (this.tileset.tileHeight * scale)),
    };
    // We need an odd number of tiles.
    if (mapSize.across % 2 == 0) {
      mapSize.across -= 1;
    }
    if (mapSize.down % 2 == 0) {
      mapSize.down -= 1;
    }
    mapSize.numColumns = (mapSize.across - 1) / 2;
    mapSize.numRows    = (mapSize.down   - 1) / 2;
    return mapSize;
  };

  LevelManager.prototype.computeMaxPlayersForScale = function(width, height, scale, step) {
    var mapSize = this.computeMapSize(width, height, scale);
    return ((mapSize.numColumns + step - 1) / step | 0) * ((mapSize.numRows + step - 1) / step | 0);
  };

  LevelManager.prototype.makeLevel = function(canvasWidth, canvasHeight) {
    var globals = this.services.globals;
    var scale = globals.scale;

    // figure out how many tiles we can fit.
    var mapSize = this.computeMapSize(canvasWidth, canvasHeight, scale);
    var tilesAcross = mapSize.across;
    var tilesDown   = mapSize.down;

    var layer0 = new Layer(tilesAcross, tilesDown, scale, this.tileset, s_outOfBoundsTile);
    var layer1 = new Layer(tilesAcross, tilesDown, scale, this.tileset, s_outOfBoundsTile);

    this.tilesAcross = tilesAcross;
    this.tilesDown = tilesDown;
    this.layer0 = layer0;
    this.layer1 = layer1;

    // fill level1 with "air"
    var numTiles = tilesAcross * tilesDown;
    for (var ii = 0; ii < numTiles; ++ii) {
      layer1.setTile(ii % tilesAcross, Math.floor(ii / tilesAcross), tiles.empty.id);
    }

    this.setWalls();

    var rows = [{range: numColumns * 2 - 1, mult: 1}, {range: numRows, mult: 2}];
    var cols = [{range: numColumns, mult: 2}, {range: numRows * 2 - 1, mult: 1}];
    var rowsCols = [rows, cols]

    var pickValidPosition = function() {
      var rc = rowsCols[Misc.randInt(2)];
      var pos = [];
      for (var ii = 0; ii < 2; ++ii) {
        pos.push(Misc.randInt(rc[ii].range) * rc[ii].mult + 1);
      };
      return pos;
    };

    var freeSpots = [];
    var numColumns = (tilesAcross - 1) / 2;
    var numRows    = (tilesDown   - 1) / 2;
    var numInColumn = numRows * 2 - 1;
    for (var ii = 0; ii < numColumns; ++ii) {
      for (var jj = 0; jj < numInColumn; ++jj) {
        freeSpots.push([ii * 2 + 1, jj + 1]);
      }
    }
    for (var ii = 0; ii < numColumns - 1; ++ii) {
      for (var jj = 0; jj < numRows; ++jj) {
        freeSpots.push([ii * 2 + 2, jj * 2 + 1]);
      }
    }

    var stuff = [
      { tile: tiles.crate, count: Math.floor(freeSpots.length * 0.8), },
      { tile: tiles.bush,  count: Math.floor(freeSpots.length * 0.1), },
    ];
    for (var ii = 0; ii < stuff.length; ++ii) {
      var s = stuff[ii];
      for (var jj = 0; jj < s.count; ++jj) {
        var ndx = Misc.randInt(freeSpots.length);
        var p = freeSpots[ndx];
        freeSpots.splice(ndx, 1);
        var t = layer1.getTile(p[0], p[1]);
        layer1.setTile(p[0], p[1], s.tile.id);
      }
    }
  };


  LevelManager.prototype.getTileInfo = function(tileId) {
    return tileInfoMap[tileId];
  };

  // This needs to go. We should be passing in the offset
  // when drawing the level not querying it when using it
  // else where.
  LevelManager.prototype.getDrawOffset = function(obj) {
    var renderer = this.services.renderer;
    var opt = this.layer0.tileDrawOptions;
    obj.x = Math.floor((renderer.canvas.width  - opt.width ) / 2);
    obj.y = Math.floor((renderer.canvas.height - opt.height));
    if (obj.y > 4) {
      obj.y -= 4;
    }
  };

  LevelManager.prototype.draw = function(renderer) {
    this.layer0.draw(renderer, this);
    this.layer1.draw(renderer, this);
  };

  return LevelManager;
});

