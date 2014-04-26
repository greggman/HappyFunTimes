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
    '../../scripts/imageprocess',
    '../../scripts/misc',
  ], function(
    Buffers,
    Fast,
    math,
    Models,
    Primitives,
    Programs,
    ImageProcess,
    Misc) {

  var availableColors = [];
  var nameFontOptions = {
    yOffset: 8,
    height: 10,
    fillStyle: "black",
  };

  var s_playerModel;

  var makePlayerModel = function() {
    var arrays = {
      position: new Primitives.AttribBuffer(2, [
          0,  15,
         15, -15,
          0, -10,
        -15, -15
      ]),
      indices: new Primitives.AttribBuffer(3, [
        0, 1, 2, 0, 2, 3
      ], 'Uint16Array')
    }
    var textures = {
    };
    var program = Programs.loadProgramFromScriptTags(
        "screenVertexShader", "screenFragmentShader");
    return new Models.Model(program, arrays, textures);
  };

  /**
   * Player represnt a player in the game.
   * @constructor
   */
  var Player = (function() {
    return function(services, x, y, width, height, direction, name, netPlayer) {
      this.services = services;
      this.renderer = services.renderer;

      services.entitySystem.addEntity(this);
      services.drawSystem.addEntity(this);
      this.netPlayer = netPlayer;
      this.position = [x, y];
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
      this.animTimer = 0;
      this.width = width;
      this.height = height;

      netPlayer.addEventListener('disconnect', Player.prototype.handleDisconnect.bind(this));
      netPlayer.addEventListener('move', Player.prototype.handleMoveMsg.bind(this));
      netPlayer.addEventListener('jump', Player.prototype.handleJumpMsg.bind(this));
      netPlayer.addEventListener('setName', Player.prototype.handleNameMsg.bind(this));
      netPlayer.addEventListener('busy', Player.prototype.handleBusyMsg.bind(this));

      this.setName(name);
      this.direction = 0;         // direction player is pushing (-1, 0, 1)
      this.facing = direction;    // direction player is facing (-1, 1)

      this.setState('waiting');
    };
  }());

  Player.prototype.setName = function(name) {
    if (name != this.playerName) {
      this.playerName = name;
      this.nameImage = ImageProcess.makeTextImage(name, nameFontOptions);
    }
  };

  Player.prototype.setState = function(state) {
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
  }

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

  // This state is when you're waiting to join a game.
  Player.prototype.init_wait = function() {
    this.netPlayer.sendCmd('wait', {});
  };

  Player.prototype.state_wait = function() {
  };

  Player.prototype.init_idle = function() {
  };

  Player.prototype.state_idle = function() {
  };

  Player.prototype.init_move = function() {
    this.animTimer = 0;
  };

  Player.prototype.state_move = function() {
    if (!this.direction) {
      this.setState('idle');
      return;
    }
  };

  Player.prototype.draw = function(renderer) {
    var globals = this.services.globals;
    var images = this.services.images;
  };

  return Player;
});

