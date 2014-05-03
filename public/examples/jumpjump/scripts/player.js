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
    '../../scripts/imageprocess',
    '../../scripts/misc',
  ], function(
    M2D,
    ImageProcess,
    Misc) {

  var availableColors = [];
  var nameFontOptions = {
    yOffset: 8,
    height: 10,
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

      netPlayer.addEventListener('disconnect', Player.prototype.handleDisconnect.bind(this));
      netPlayer.addEventListener('move', Player.prototype.handleMoveMsg.bind(this));
      netPlayer.addEventListener('jump', Player.prototype.handleJumpMsg.bind(this));
      netPlayer.addEventListener('setName', Player.prototype.handleNameMsg.bind(this));
      netPlayer.addEventListener('busy', Player.prototype.handleBusyMsg.bind(this));

      this.setName(name);
      this.direction = 0;         // direction player is pushing (-1, 0, 1)
      this.facing = direction;    // direction player is facing (-1, 1)
      this.score = 0;

      this.setState('idle');
      this.reset();
      this.checkBounds();
    };
  }());

  Player.prototype.setName = function(name) {
    if (name != this.playerName) {
      this.playerName = name;
      this.nameImage = ImageProcess.makeTextImage(name, nameFontOptions);
    }
  };

  Player.prototype.reset = function() {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    var position = levelManager.getRandomOpenPosition();
    this.position = [position.x + level.tileWidth / 2, position.y];
  };

  Player.prototype.setState = function(state) {
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
  }

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
    this.services.entitySystem.removeEntity(this);
    this.services.drawSystem.removeEntity(this);
    this.services.playerManager.removePlayer(this);
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

  Player.prototype.updatePosition = function(axis) {
    var axis = axis || 3;
    var globals = this.services.globals;
    if (axis & 1) {
      this.position[0] += this.velocity[0] * globals.elapsedTime;
    }
    if (axis & 3) {
      this.position[1] += this.velocity[1] * globals.elapsedTime;
    }
  };

  Player.prototype.updateVelocity = function(axis) {
    var globals = this.services.globals;
    var axis = axis || 3;
    if (axis & 1) {
      this.velocity[0] += this.acceleration[0] * globals.elapsedTime * globals.elapsedTime;
      this.velocity[0] = Misc.clampPlusMinus(this.velocity[0], globals.maxVelocity[0]);
    }
    if (axis & 2) {
      this.velocity[1] += (this.acceleration[1] + globals.gravity) * globals.elapsedTime * globals.elapsedTime;
      this.velocity[1] = Misc.clampPlusMinus(this.velocity[1], globals.maxVelocity[1]);
    }
  };

  Player.prototype.updatePhysics = function(axis) {
    this.updateVelocity(axis);
    this.updatePosition(axis);
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
    this.checkWall();
    if (this.checkLand()) {
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
        this.setState('move');
        return true;
      }
    }
    return false;
  };

  Player.prototype.checkLand = function() {
    if (this.velocity[1] > 0) {
      this.checkDown();
    } else {
      this.checkUp();
    }
  };

  Player.prototype.init_move = function() {
    this.animTimer = 0;
    this.anim = this.services.images.move.colors[this.color.id];
  };

  Player.prototype.state_move = function() {
    if (this.checkJump()) {
      return;
    }

    if (!this.direction) {
      this.setState('idle');
      return;
    }

    var globals = this.services.globals;
    this.acceleration[0] = this.direction * globals.moveAcceleration;
    this.animTimer += globals.moveAnimSpeed * Math.abs(this.velocity[0]) * globals.elapsedTime;
    this.updatePhysics(1);
    this.checkWall();
    this.checkFall();
  };

  Player.prototype.init_jump = function(elaspedTime) {
    var globals = this.services.globals;
    this.jumpTimer = 0;
    this.animTimer = 0;
    this.anim = this.services.images.jump.colors[this.color.id];
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

  Player.prototype.draw = function(ctx) {
    var globals = this.services.globals;
    var images = this.services.images;
    ctx.save();
    ctx.translate(Math.floor(this.position[0]), Math.floor(this.position[1]));

//    ctx.fillStyle = this.color;
//    ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);

    ctx.save();
    var frameNumber = Math.floor(this.animTimer % this.anim.length);
    var img = this.anim[frameNumber];
window.p = this;
window.f = frameNumber;
    if (this.facing > 0) {
      ctx.translate(-img.width / 2, -img.height);
    } else {
      ctx.translate(img.width / 2, -img.height);
      ctx.scale(this.facing, 1);
    }
    ctx.drawImage(img, 0, 0);
    ctx.restore();

//    ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
    if (globals.showState) {
      ctx.fillStyle = (globals.frameCount & 4) ? "white" : "black";
      ctx.fillRect(0, 0, 1, 1);
    }
    ctx.fillStyle = "black";
//    ctx.fillText(this.playerName, -this.width / 2,  -this.height - 10);
    ctx.drawImage(this.nameImage, -this.width / 2, -this.height - 10);
    if (globals.showState) {
      ctx.fillText(this.state, -this.width / 2,  -this.height - 20);
      ctx.fillText(this.velocity[1].toFixed(2), -this.width / 2,  -this.height - 30);
    }
    ctx.restore();
  };

  return Player;
});

