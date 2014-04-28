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
  ], function(
    Buffers,
    Fast,
    math,
    Models,
    Primitives,
    Programs) {

  var bombFrames;

  var explosionTable = [];

  var Bomb = function(services) {
    if (!bombFrames) {
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

    var levelManager = services.levelManager;
    var numTiles = levelManager.tilesAcross * tilesDown;
    if (explosionTable.length != numTiles) {
      explosionTable = new Uint16Array(numTiles);
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
    this.setFrame(0);
    this.bombTimer = 0;
    this.setState('tick');
  };

  Bomb.prototype.returnToOwner = function() {
    this.owner.returnBomb(this);
  };

  Bomb.prototype.setFrame = function(frame) {
    this.bombFrame = frame;
    var levelManager = this.services.levelManager;
    levelManager.layer1.setTile(this.tx, this.ty, bombFrames[frame]);
  };

  Bomb.prototype.state_off = function() {
  };

  Bomb.prototype.state_tick = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;

    this.bombTimer += globals.elapsedTime;
    if (this.bombTimer >= globals.bombDuration) {
      this.setState('exploding');
      return;
    }
    var frame = this.bombTimer * (bombFrames.length + 1) / globals.bombDuration | 0;
    if (frame != this.bombFrame) {
      this.setFrame(frame);
    }
  };

  Bomb.prototype.init_exploding = function() {

  };

  Bomb.prototype.state_exploding = function() {

  };

  return Bomb;
});

