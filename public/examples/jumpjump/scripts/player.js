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
    '../../../scripts/misc/strings',
    '../../scripts/2d',
    '../../scripts/imageprocess',
  ], function(
    Misc,
    Strings,
    M2D,
    ImageProcess) {

  var availableColors = [];
  var nameFontOptions = {
    font: "20px sans-serif",
    yOffset: 18,
    height: 20,
    fillStyle: "black",
  };

  /**
   * Player represnt a player in the game.
   * @constructor
   */
  var Player = (function() {
    return function(services, width, height, direction, name, netPlayer) {
      this.services = services;
      this.renderer = services.renderer;
      services.entitySystem.addEntity(this);
      services.drawSystem.addEntity(this);
      this.netPlayer = netPlayer;
      this.velocity = [0, 0];
      this.acceleration = [0, 0];
      if (availableColors.length == 0) {
        var colors = services.colors;
        for (var ii = 0; ii < colors.length; ++ii) {
          availableColors.push(colors[ii]);
        }
      }
      this.color = availableColors[Math.floor(Math.random() * availableColors.length)];
window.p = this;
      netPlayer.sendCmd('setColor', this.color);
      availableColors.splice(this.color, 1);
      this.color.id;
      this.animTimer = 0;
      this.width = width;
      this.height = height;
      this.canJump = false;
      this.checkWallOffset = [
        -this.width / 2,
        this.width / 2 - 1,
      ];
      this.timeAccumulator = 0;

      this.scoreLine = this.services.scoreManager.createScoreLine(this, this.color);
      this.scoreLine.ctx.drawImage(
        this.services.images.idle.imgColors[this.color.id][0], 0, 0);

      this.sprite = this.services.spriteManager.createSprite();
      this.nameSprite = this.services.spriteManager.createSprite();

      netPlayer.addEventListener('disconnect', Player.prototype.handleDisconnect.bind(this));
      netPlayer.addEventListener('move', Player.prototype.handleMoveMsg.bind(this));
      netPlayer.addEventListener('jump', Player.prototype.handleJumpMsg.bind(this));
      netPlayer.addEventListener('setName', Player.prototype.handleNameMsg.bind(this));
      netPlayer.addEventListener('busy', Player.prototype.handleBusyMsg.bind(this));

      this.setName(name);
      this.direction = 0;         // direction player is pushing (-1, 0, 1)
      this.facing = direction;    // direction player is facing (-1, 1)
      this.score = 0;
      this.addPoints(0);

      this.setState('idle');
      this.reset();
      this.checkBounds();
    };
  }());

  Player.prototype.setName = function(name) {
    if (name != this.playerName) {
      this.playerName = name;
      this.nameImage = this.services.createTexture(
          ImageProcess.makeTextImage(name, nameFontOptions));
      this.scoreLine.setName(":" + name);
    }
  };

  Player.prototype.reset = function() {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    var position = levelManager.getRandomOpenPosition();
    this.position = [position.x + level.tileWidth / 2, position.y];
    this.lastPosition = [this.position[0], this.position[1]];
  };

  Player.prototype.addPoints = function(points) {
    this.score += points;
    this.scoreLine.setMsg(Strings.padLeft(this.score, 3, "0"));
  };

  Player.prototype.setState = function(state) {
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
  };

  Player.prototype.checkBounds = function() {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    if (this.position[1] > level.width * level.tileHeight) {
      debugger;
    }
  };

  Player.prototype.checkJump = function() {
    if (this.canJump) {
      if (this.jump) {
        this.canJump = false;
        this.setState('jump');
      }
    } else {
      if (!this.jump) {
        this.canJump = true;
      }
    }
  };

//  Player.prototype.process = function() {
//    this.checkBounds();
//    this["state_" + this.state].call(this);
//  };

  Player.prototype.removeFromGame = function() {
    this.services.spriteManager.deleteSprite(this.sprite);
    this.services.spriteManager.deleteSprite(this.nameSprite);
    this.services.entitySystem.removeEntity(this);
    this.services.drawSystem.removeEntity(this);
    this.services.playerManager.removePlayer(this);
    this.services.scoreManager.deleteScoreLine(this.scoreLine);
    availableColors.push(this.color);
  };

  Player.prototype.handleDisconnect = function() {
    this.removeFromGame();
  };

  Player.prototype.handleBusyMsg = function(msg) {
    // We ignore this message
  };

  Player.prototype.handleMoveMsg = function(msg) {
    this.direction = msg.dir;
    if (this.direction) {
      this.facing = this.direction;
    }
  };

  Player.prototype.handleJumpMsg = function(msg) {
    this.jump = msg.jump;
    if (this.jump == 0) {
      this.jumpTimer = 0;
    }
  };

  Player.prototype.handleNameMsg = function(msg) {
    if (!msg.name) {
      this.sendCmd('setName', {
        name: this.playerName
      });
    } else {
      this.setName(msg.name.replace(/[<>]/g, ''));
    }
  };

  Player.prototype.sendCmd = function(cmd, data) {
    this.netPlayer.sendCmd(cmd, data);
  };

  Player.prototype.updatePosition = function(axis, elapsedTime) {
    var axis = axis || 3;
    this.lastPosition[0] = this.position[0];
    this.lastPosition[1] = this.position[1];
    if (axis & 1) {
      this.position[0] += this.velocity[0] * elapsedTime;
    }
    if (axis & 3) {
      this.position[1] += this.velocity[1] * elapsedTime;
    }
  };

  Player.prototype.updateVelocity = function(axis, elapsedTime) {
    var globals = this.services.globals;
    var axis = axis || 3;
    if (axis & 1) {
      this.velocity[0] += this.acceleration[0] * elapsedTime;
      this.velocity[0] = Misc.clampPlusMinus(this.velocity[0], globals.maxVelocity[0]);
    }
    if (axis & 2) {
      this.velocity[1] += (this.acceleration[1] + globals.gravity) * elapsedTime;
      this.velocity[1] = Misc.clampPlusMinus(this.velocity[1], globals.maxVelocity[1]);
    }
  };

  Player.prototype.updatePhysics = function(axis) {
    var kOneTick = 1 / 60;
    var globals = this.services.globals;
    this.timeAccumulator += globals.elapsedTime;
    var ticks = (this.timeAccumulator / kOneTick) | 0;
    this.timeAccumulator -= ticks * kOneTick;
    for (var ii = 0; ii < ticks; ++ii) {
      this.updateVelocity(axis, kOneTick);
      this.updatePosition(axis, kOneTick);
    }
  };

  Player.prototype.init_idle = function() {
    this.velocity[0] = 0;
    this.velocity[1] = 0;
    this.acceleration[0] = 0;
    this.acceleration[1] = 0;
    this.animTimer = 0;
    this.anim = this.services.images.idle.colors[this.color.id];
  };

  Player.prototype.state_idle = function() {
    if (this.checkJump()) {
      return;
    } else if (this.direction) {
      this.setState('move');
      return;
    }
    var globals = this.services.globals;
    this.animTimer += globals.elapsedTime * globals.idleAnimSpeed;
    this.checkFall();
  };

  Player.prototype.init_fall = function() {
    this.animTimer = 1;
    this.anim = this.services.images.jump.colors[this.color.id];
  };

  Player.prototype.state_fall = function() {
    var globals = this.services.globals;
    this.acceleration[0] = this.direction * globals.moveAcceleration;
    this.updatePhysics();
    var landed = this.checkLand();
    this.checkWall();
    if (landed) {
      return;
    }
    if (Math.abs(this.velocity[1]) < globals.fallTopAnimVelocity) {
      this.animTimer = 2;
    } else if (this.velocity[1] >= globals.fallTopAnimVelocity) {
      this.animTimer = 3;
    }
  };

  Player.prototype.checkWall = function() {
    var levelManager = this.services.levelManager;
    var off = this.velocity[0] < 0 ? 0 : 1;
    for (var ii = 0; ii < 2; ++ii) {
      var xCheck = this.position[0] + this.checkWallOffset[off];
      var tile = levelManager.getTileInfoByPixel(xCheck, this.position[1] - this.height / 4 - this.height / 2 * ii);
      if (tile.collisions) {
        var level = levelManager.getLevel();
        this.velocity[0] = 0;
        var distInTile = xCheck % level.tileWidth;
        var xoff = off ? -distInTile : level.tileWidth - distInTile;
        this.position[0] += xoff;
      }
    }
  };

  Player.prototype.checkFall = function() {
    var levelManager = this.services.levelManager;
    for (var ii = 0; ii < 2; ++ii) {
      var tile = levelManager.getTileInfoByPixel(this.position[0] - this.width / 4 + this.width / 2 * ii, this.position[1]);
      if (tile.collisions) {
        return false;
      }
    }
    this.setState('fall');
    return true;
  };

  Player.prototype.checkUp = function() {
    var levelManager = this.services.levelManager;
    for (var ii = 0; ii < 2; ++ii) {
      var tile = levelManager.getTileInfoByPixel(this.position[0] - this.width / 4 + this.width / 2 * ii, this.position[1] - this.height);
      if (tile.collisions) {
        var level = levelManager.getLevel();
        this.velocity[1] = 0;
        this.position[1] = (Math.floor(this.position[1] / level.tileHeight) + 1) * level.tileHeight;
        if (!this.bonked) {
          this.bonked = true;
          this.services.audioManager.playSound('bonkhead');
        }
        return true;
      }
    }
    return false;
  };

  Player.prototype.checkDown = function() {
    var levelManager = this.services.levelManager;
    for (var ii = 0; ii < 2; ++ii) {
      var tile = levelManager.getTileInfoByPixel(this.position[0] - this.width / 4 + this.width / 2 * ii, this.position[1]);
      if (tile.collisions) {
        var level = levelManager.getLevel();
        this.position[1] = Math.floor(this.position[1] / level.tileHeight) * level.tileHeight;
        this.velocity[1] = 0;
        this.services.audioManager.playSound('land');
        this.setState('move');
        return true;
      }
    }
    return false;
  };

  Player.prototype.checkLand = function() {
    if (this.velocity[1] > 0) {
      return this.checkDown();
    } else {
      return this.checkUp();
    }
  };

  Player.prototype.init_move = function() {
    this.animTimer = 0;
    this.anim = this.services.images.move.colors[this.color.id];
    this.lastDirection = this.direction;
  };

  Player.prototype.state_move = function() {
    if (this.checkJump()) {
      return;
    }

    var globals = this.services.globals;
    this.acceleration[0] = this.lastDirection * globals.moveAcceleration;
    this.animTimer += globals.moveAnimSpeed * Math.abs(this.velocity[0]) * globals.elapsedTime;
    this.updatePhysics(1);

    this.checkWall();
    this.checkFall();

    if (!this.direction) {
      this.setState('stop');
      return;
    }

    this.lastDirection = this.direction;
  };

  Player.prototype.init_stop = function() {
    this.lastDirection = this.direction;
    this.acceleration[0] = 0;
  };

  Player.prototype.state_stop = function() {
    if (this.checkJump()) {
      return;
    }

    if (this.direction) {
      this.setState('move');
      return;
    }

    var globals = this.services.globals;
    this.velocity[0] *= globals.stopFriction;
    if (Math.abs(this.velocity[0]) < globals.minStopVelocity) {
      this.setState('idle');
      return;
    }

    this.animTimer += globals.moveAnimSpeed * Math.abs(this.velocity[0]) * globals.elapsedTime;
    this.updatePhysics(1);
    this.checkWall();
    this.checkFall();
  };

  Player.prototype.init_jump = function(elaspedTime) {
    var globals = this.services.globals;
    this.jumpTimer = 0;
    this.animTimer = 0;
    this.bonked = false;
    this.anim = this.services.images.jump.colors[this.color.id];
    this.services.audioManager.playSound('jump');
  };

  Player.prototype.state_jump = function(elaspedTime) {
    var globals = this.services.globals;
    this.acceleration[0] = this.direction * globals.moveAcceleration;
    this.velocity[1] = globals.jumpVelocity;
    this.jumpTimer += globals.elapsedTime;
    this.updatePhysics();
    this.checkLand();
    this.checkWall();
    if (this.jumpTimer >= globals.jumpFirstFrameTime) {
      this.animTimer = 1;
    }
    if (this.jumpTimer >= globals.jumpDuration || !this.jump) {
      this.setState('fall');
    }
  };

  Player.prototype.draw = function() {
    var globals = this.services.globals;
    var images = this.services.images;
    var spriteRenderer = this.services.spriteRenderer;
    var frameNumber = Math.floor(this.animTimer % this.anim.length);
    var img = this.anim[frameNumber];

    var off = {};
    this.services.levelManager.getDrawOffset(off);

    var width  = 32;
    var height = 32;

    var sprite = this.sprite;
    sprite.uniforms.u_texture = img;
    sprite.x = (off.x + this.position[0]) | 0;
    sprite.y = (off.y + height / -2 + this.position[1]) | 0;
    sprite.width = width;
    sprite.height = height;
    sprite.xScale = this.facing > 0 ? 1 : -1;

    var nameSprite = this.nameSprite;
    nameSprite.uniforms.u_texture = this.nameImage;
    nameSprite.x = (off.x + this.position[0]) | 0;
    nameSprite.y = (off.y + height / -2 + this.position[1] - 24) | 0;
    nameSprite.width = this.nameImage.img.width;
    nameSprite.height = this.nameImage.img.height;
  };

  return Player;
});

