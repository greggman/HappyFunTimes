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
    '../../scripts/2d',
    '../../scripts/misc',
  ], function(
    M2D, Misc) {

  /**
   * Collectable represnt a collectable in the game.
   * @constructor
   */
  var Collectable = (function() {
    return function(services) {
      this.services = services;
      this.renderer = services.renderer;

      services.entitySystem.addEntity(this);
      services.drawSystem.addEntity(this);

      this.animTimer = 0;
      this.anim = this.services.images.coin.colors[0];

      var levelManager = this.services.levelManager;
      var level = levelManager.getLevel();

      this.width = level.tileWidth;
      this.height = level.tileHeight;

      this.chooseNewPosition();
      this.setState("fall");
    };
  }());

  Collectable.prototype.setState = function(state) {
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
    this.drawFn = this["draw_" + state] || this.defaultDraw;
  };

  Collectable.prototype.checkCollected = function() {
    if (!this.checkPlayer) {
      this.checkPlayer = function(player) {
        var dx = player.position[0] - this.position[0];
        var dy = player.position[1] - this.position[1];
        var distSq = dx * dx + dy * dy;
        var radiusSq = 16 * 16;
        if (distSq < radiusSq) {
          this.setState("collected");
          return true;
        }
      }.bind(this);
    }
    this.services.playerManager.forEachPlayer(this.checkPlayer);
  };

  Collectable.prototype.init_collected = function() {
    this.collectTime = 0;
  };

  Collectable.prototype.state_collected = function() {
    var globals = this.services.globals;
    this.animTime += globals.elapsedTime * globals.coinAnimSpeed;
    this.collectTime += globals.elapsedTime;
    if (this.collectTime > 0.125) {
      this.chooseNewPosition();
      this.setState("fall");
    }
  };

  Collectable.prototype.draw_collected = function(ctx) {
    var frameNumber = Math.floor(this.animTimer % this.anim.length);
    var img = this.anim[frameNumber];
    ctx.save();
    ctx.translate(-img.width / 2, -img.height);
    for (var ii = -1; ii < 2; ++ii) {
      var a = ii * Math.PI / 4;
      var x =  Math.sin(a) * 512 * this.collectTime;
      var y = -Math.cos(a) * 512 * this.collectTime;
      ctx.drawImage(img, x, y);
    }
    ctx.restore();

  };

  Collectable.prototype.state_idle = function() {
    var globals = this.services.globals;
    this.animTimer += globals.elapsedTime * globals.coinAnimSpeed;

    if (this.checkCollected()) {
      return;
    }
  };

  Collectable.prototype.state_fall = function() {
    var globals = this.services.globals;
    this.animTimer += globals.elapsedTime * globals.coinAnimSpeed;

    if (this.checkCollected()) {
      return;
    }

    this.velocity[1] += globals.gravity * globals.elapsedTime * globals.elapsedTime;
    this.velocity[1] = Misc.clampPlusMinus(this.velocity[1], globals.maxVelocity[1]);
    this.position[1] += this.velocity[1] * globals.elapsedTime;

    var levelManager = this.services.levelManager;
    var tile = levelManager.getTileInfoByPixel(this.position[0], this.position[1]);
    if (tile.collisions) {
      var level = levelManager.getLevel();
      this.position[1] = Math.floor(this.position[1] / level.tileHeight) * level.tileHeight;
      this.velocity[1] = 0;
      this.setState('idle');
    }
  };

  Collectable.prototype.chooseNewPosition = function() {
    var levelManager = this.services.levelManager;
    var position = levelManager.getRandomOpenPosition();
    this.position = [position.x + this.width / 2, position.y];
    this.velocity = [0, 0];
    this.falling = true;
  };

  Collectable.prototype.defaultDraw = function(ctx) {
    var globals = this.services.globals;
    var images = this.services.images;
    var frameNumber = Math.floor(this.animTimer % this.anim.length);
    var img = this.anim[frameNumber];
    ctx.save();
    ctx.translate(-img.width / 2, -img.height);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  };

  Collectable.prototype.draw = function(ctx) {
    var globals = this.services.globals;
    ctx.save();
    ctx.translate(Math.floor(this.position[0]), Math.floor(this.position[1]));
    this.drawFn(ctx);
    if (globals.showState) {
      ctx.fillStyle = (globals.frameCount & 4) ? "white" : "black";
      ctx.fillRect(0, 0, 1, 1);
    }
    ctx.restore();
  };

  return Collectable;
});

