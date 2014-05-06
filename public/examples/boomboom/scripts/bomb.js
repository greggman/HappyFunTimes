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
    '../../scripts/tdl/buffers',
    '../../scripts/tdl/fast',
    '../../scripts/tdl/math',
    '../../scripts/tdl/models',
    '../../scripts/tdl/primitives',
    '../../scripts/tdl/programs',
    '../../scripts/Misc',
  ], function(
    Buffers,
    Fast,
    math,
    Models,
    Primitives,
    Programs,
    Misc) {

  var g_services;
  var bombFrames;

  var tickingBombs = [];

  var explosionTableWidth  = 0;
  var explosionTableHeight = 0;
  var explosionTable = new Int16Array(0);
  var explosionExpandOffsets = [
    { x: -1, y:  0, },
    { x:  1, y:  0, },
    { x:  0, y: -1, },
    { x:  0, y:  1, },
  ];

  // L = 1
  // R = 2
  // U = 4
  // D = 8
  var bitsToTile = [
    'empty',  //  0
    'flameL', //  1   L
    'flameR', //  2   R
    'flameH', //  3   LR
    'flameU', //  4   U
    'flameM', //  5   LU
    'flameM', //  6   RU
    'flameM', //  7   LRU
    'flameD', //  8   D
    'flameM', //  9   LD
    'flameM', // 10   RD
    'flameM', // 11   LRD
    'flameV', // 12   UD
    'flameM', // 13   LUD
    'flameM', // 14   RUD
    'flameM', // 15   LRUD

    'flameH', //  0  H
    'flameH', //  1  HL
    'flameH', //  2  HR
    'flameH', //  3  HLR
    'flameM', //  4  HU
    'flameM', //  5  HLU
    'flameM', //  6  HRU
    'flameM', //  7  HLRU
    'flameM', //  8  HD
    'flameM', //  9  HLD
    'flameM', // 10  HRD
    'flameM', // 11  HLRD
    'flameM', // 12  HUD
    'flameM', // 13  HLUD
    'flameM', // 14  HRUD
    'flameM', // 15  HLRUD

    'flameV', //  0  V
    'flameM', //  1  VL
    'flameM', //  2  VR
    'flameM', //  3  VLR
    'flameV', //  4  VU
    'flameM', //  5  VLU
    'flameM', //  6  VRU
    'flameM', //  7  VLRU
    'flameV', //  8  VD
    'flameM', //  9  VLD
    'flameM', // 10  VRD
    'flameM', // 11  VLRD
    'flameV', // 12  VUD
    'flameM', // 13  VLUD
    'flameM', // 14  VRUD
    'flameM', // 15  VLRUD

    'flameM', //  0  VH
    'flameM', //  1  VHL
    'flameM', //  2  VHR
    'flameM', //  3  VHLR
    'flameM', //  4  VHU
    'flameM', //  5  VHLU
    'flameM', //  6  VHRU
    'flameM', //  7  VHLRU
    'flameM', //  8  VHD
    'flameM', //  9  VHLD
    'flameM', // 10  VHRD
    'flameM', // 11  VHLRD
    'flameM', // 12  VHUD
    'flameM', // 13  VHLUD
    'flameM', // 14  VHRUD
    'flameM', // 15  VHLRUD
  ];


  var flameDirInfo = [
    { dx: -1, dy:  0, dirNdx: 0, tipId: 'flameL', midId: 'flameH', },
    { dx:  1, dy:  0, dirNdx: 1, tipId: 'flameR', midId: 'flameH', },
    { dx:  0, dy: -1, dirNdx: 2, tipId: 'flameU', midId: 'flameV', },
    { dx:  0, dy:  1, dirNdx: 3, tipId: 'flameD', midId: 'flameV', },
  ];

  var initExplosionTable = function(levelManager) {
    var numTiles = levelManager.tilesAcross * levelManager.tilesDown;
    var tableLength = numTiles * 4;
    if (numTiles && explosionTable.length != tableLength) {
      explosionTable = new Int16Array(tableLength);
      explosionTableWidth  = levelManager.tilesAcross;
      explosionTableHeight = levelManager.tilesDown;
    }
  };

  var incDecExplosion = function(nx, ny, tiles, flameInfo, layer, delta) {
    var offset = (ny * explosionTableWidth + nx) * 4;
    if (offset < 0 || offset >= explosionTable.length) {
      throw 'bad offset!';
    }
    if (offset % 1 != 0) {
      throw 'bad offset 2';
    }
    if (nx % 1 != 0 || ny % 1 != 0) {
      throw 'bad nx or ny';
    }
    explosionTable[offset + flameInfo.dirNdx] += delta;
    var l = explosionTable[offset + 0];
    var r = explosionTable[offset + 1];
    var u = explosionTable[offset + 2];
    var d = explosionTable[offset + 3];
    var h = (l > 1 || r > 1) ? 16 : 0;
    var v = (u > 1 || d > 1) ? 32 : 0;
    var bits = (l > 0 ? 1 : 0) |
               (r > 0 ? 2 : 0) |
               (u > 0 ? 4 : 0) |
               (d > 0 ? 8 : 0) |
               h | v;
    var tileId = tiles[bitsToTile[bits]].id;
    layer.setTile(nx, ny, tileId);
    if (g_services.gridTable) {
      try {
        g_services.gridTable[ny][nx].nodeValue = "01: " +
          explosionTable[offset + 0] + ", " +
          explosionTable[offset + 1] + "\n23: " +
          explosionTable[offset + 2] + ", " +
          explosionTable[offset + 3] + "\n" +
          "t: " + tileId.toString(16);
      } catch (e) {
        throw e;
      }
    }
  };

  var Bomb = function(services) {
    if (!bombFrames) {
      g_services = services;
      var tiles = services.levelManager.tiles;
      bombFrames = [
        tiles.bomb0.id,
        tiles.bomb1.id,
        tiles.bomb2.id,
        tiles.bomb1.id,
        tiles.bomb2.id,
        tiles.bomb1.id,
        tiles.bomb2.id,
        tiles.bomb3.id,
        tiles.bomb4.id,
        tiles.bomb3.id,
        tiles.bomb4.id,
        tiles.bomb3.id,
        tiles.bomb4.id,
        tiles.bomb5.id,
        tiles.bomb4.id,
        tiles.bomb5.id,
        tiles.bomb4.id,
        tiles.bomb5.id,
        tiles.bomb5.id,
      ];
    }

    this.services = services;
    this.reset();
    this.setState('off');

    services.entitySystem.addEntity(this);
  };

  Bomb.prototype.reset = function() {
    this.owner = undefined;
  };

  Bomb.prototype.setState = function(state) {
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
  };

  Bomb.prototype.place = function(owner, tx, ty, size) {
    this.owner = owner;
    this.size = size;
    this.tx = tx;
    this.ty = ty;
    var levelManager = this.services.levelManager;
    var tile = levelManager.layer1.getTile(tx, ty);
    var tileInfo = levelManager.getTileInfo(tile);
    if (tileInfo.info.flame) {
      this.setState('explode');
      return;
    }

    this.bombTimer = 0;
    this.setFrame(0);
    this.setState('tick');
  };

  Bomb.prototype.returnToOwner = function() {
    this.owner.returnBomb(this);
  };

  Bomb.prototype.setTile = function(tileId) {
    var levelManager = this.services.levelManager;
    levelManager.layer1.setTile(this.tx, this.ty, tileId);
  };

  Bomb.prototype.setFrame = function(frame) {
    this.bombFrame = frame;
    this.setTile(bombFrames[frame]);
  };

  Bomb.prototype.expandExplosion = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;
    var layer = levelManager.layer1;
    var tiles = levelManager.tiles;
    for (var ii = 0; ii < this.flames.length; ++ii) {
      var flame = this.flames[ii];
      var flameInfo = flame.info;

      var nx = this.tx + flame.size * flameInfo.dx;
      var ny = this.ty + flame.size * flameInfo.dy;
      incDecExplosion(nx, ny, tiles, flameInfo, layer, 1);
      if (flame.stopped) {
        continue;
      }

      nx += flameInfo.dx;
      ny += flameInfo.dy;
      var tile = layer.getTile(nx, ny);
      var tileInfo = levelManager.getTileInfo(tile);
      if (tileInfo.info.flameStop) {
        flame.stopped = true;
      }

      var placedCrate = false;
      if (tileInfo.info.crate) {
        // change this to a random crate.
        var crateType = globals.crateProbTable[Misc.randInt(globals.crateProbTable.length)];
        if (crateType.tileName != 'empty') {
          layer.setTile(nx, ny, tiles[crateType.tileName].id);
          placedCrate = true;
        }
      }

      // advance
      if (!flame.stopped || (tileInfo.info.flameEat && !placedCrate)) {
          incDecExplosion(nx, ny, tiles, flameInfo, layer, 1);
          ++flame.size;
      }

      if (tileInfo.info.bomb) {
        // Find the corresponding bomb and set its state
        for (var jj = 0; jj < tickingBombs.length; ++jj) {
          var bomb = tickingBombs[jj];
          if (bomb.tx == nx && bomb.ty == ny) {
            bomb.setState('explode');
            break;
          }
        };
      }
    }
    ++this.explosionSize;
  };

  Bomb.prototype.contractExplosion = function() {
    var levelManager = this.services.levelManager;
    var layer = levelManager.layer1;
    var tiles = levelManager.tiles;
    for (var ii = 0; ii < this.flames.length; ++ii) {
      var flame = this.flames[ii];
      var flameInfo = flame.info;

      var nx = this.tx + flame.size * flameInfo.dx;
      var ny = this.ty + flame.size * flameInfo.dy;
      incDecExplosion(nx, ny, tiles, flameInfo, layer, -1);

      if (this.explosionSize > 0 && this.explosionSize <= flame.size) {
        nx -= flameInfo.dx;
        ny -= flameInfo.dy;
        incDecExplosion(nx, ny, tiles, flameInfo, layer, -1);
        --flame.size;
      }
    }
    --this.explosionSize;
  };

  Bomb.prototype.state_off = function() {
  };

  Bomb.prototype.init_tick = function() {
    tickingBombs.push(this);
  };

  Bomb.prototype.state_tick = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;

    this.bombTimer += globals.elapsedTime;
    if (this.bombTimer >= globals.bombDuration) {
      this.setState('explode');
      return;
    }
    var frame = this.bombTimer * (bombFrames.length + 1) / globals.bombDuration | 0;
    if (frame != this.bombFrame) {
      this.setFrame(frame);
    }
  };

  Bomb.prototype.init_explode = function() {
    this.services.audioManager.playSound('explode');
    tickingBombs.splice(tickingBombs.indexOf(this), 1);
    this.flames = [
     { stopped: false, size: 0, info: flameDirInfo[0], },
     { stopped: false, size: 0, info: flameDirInfo[1], },
     { stopped: false, size: 0, info: flameDirInfo[2], },
     { stopped: false, size: 0, info: flameDirInfo[3], },
    ];
    var levelManager = this.services.levelManager;
    initExplosionTable(levelManager);
    this.setTile(levelManager.tiles.empty.id);
    this.explosionSize = 0;
    this.expandExplosion();
  };

  // Expand the explosion
  Bomb.prototype.state_explode = function() {
    if (this.explosionSize == this.size) {
      this.setState('exploding_wait');
      return;
    }
    this.expandExplosion();
  };

  Bomb.prototype.init_exploding_wait = function() {
    var globals = this.services.globals;
    this.explosionTimer = globals.explosionDuration;
  };

  Bomb.prototype.state_exploding_wait = function() {
    var globals = this.services.globals;
    this.explosionTimer -= globals.elapsedTime;
    if (this.explosionTimer <= 0) {
      this.setState('unexploding');
    }
  };

  Bomb.prototype.init_unexploding = function() {
    this.explosionTimer = 0;
  };

  Bomb.prototype.state_unexploding = function() {
    var globals = this.services.globals;
    this.explosionTimer -= globals.elapsedTime;
    if (this.explosionTimer <= 0) {
      this.explosionTimer = globals.unexplodeTickDuration;
      this.contractExplosion();
      if (this.explosionSize == 0) {
        this.owner.restoreBomb(this);
        this.setState('off');
      }
    }
  };

  return Bomb;
});

