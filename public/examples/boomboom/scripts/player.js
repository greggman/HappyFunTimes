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
    '../../scripts/gamebutton',
    '../../scripts/imageprocess',
    '../../scripts/misc',
  ], function(
    Buffers,
    Fast,
    math,
    Models,
    Primitives,
    Programs,
    GameButton,
    ImageProcess,
    Misc) {

  var m4 = Fast.matrix4;

  var availableColors = [];
  var nameFontOptions = {
    yOffset: 8,
    height: 10,
    fillStyle: "black",
  };


  var s_playerVertexShader = [
    "attribute vec4 position;                  ",
    "attribute vec2 texcoord;                  ",
    "                                          ",
    "uniform mat4 u_matrix;                    ",
    "                                          ",
    "varying vec2 v_texcoord;                  ",
    "                                          ",
    "void main() {                             ",
    "  gl_Position = u_matrix * position;      ",
    "  v_texcoord = texcoord;                  ",
    "}                                         ",
  ].join("\n");

  var s_playerFragmentShader = [
    "precision mediump float;                                                          ",
    "                                                                                  ",
    "uniform sampler2D u_texture;                                                      ",
    "uniform vec2 u_adjustRange;                                                       ",
    "uniform vec3 u_hsvAdjust;                                                         ",
    "                                                                                  ",
    "varying vec2 v_texcoord;                                                          ",
    "                                                                                  ",
    "vec3 rgb2hsv(vec3 c) {                                                            ",
    "  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);                                ",
    "  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));               ",
    "  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));               ",
    "                                                                                  ",
    "  float d = q.x - min(q.w, q.y);                                                  ",
    "  float e = 1.0e-10;                                                              ",
    "  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);        ",
    "}                                                                                 ",
    "                                                                                  ",
    "vec3 hsv2rgb(vec3 c) {                                                            ",
    "  c = vec3(c.x, clamp(c.yz, 0.0, 1.0));                                           ",
    "  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);                                  ",
    "  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);                               ",
    "  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);                       ",
    "}                                                                                 ",
    "                                                                                  ",
    "void main() {                                                                     ",
    "  vec4 color = texture2D(u_texture, v_texcoord);                                  ",
    "  if (color.a < 0.1) {                                                            ",
    "    discard;                                                                      ",
    "  }                                                                               ",
    "  vec3 hsv = rgb2hsv(color.rgb);                                                  ",
    "  float affectMult = step(u_adjustRange.x, hsv.r) * step(hsv.r, u_adjustRange.y); ",
    "  vec3 rgb = hsv2rgb(hsv + u_hsvAdjust * affectMult);                             ",
    "  gl_FragColor = vec4(rgb, color.a);                                              ",
    "}                                                                                 ",
  ].join("\n");

  var s_playerModel;

  var makePlayerModel = function() {
    if (s_playerModel) {
      return;
    }

    var arrays = {
      position: new Primitives.AttribBuffer(2, [
          0,  0,
          1,  0,
          0,  1,
          1,  1,
      ]),
      texcoord: new Primitives.AttribBuffer(2, [
          0,  0,
          1,  0,
          0,  1,
          1,  1,
      ]),
      indices: new Primitives.AttribBuffer(3, [
          0, 1, 2,
          2, 1, 3,
      ], 'Uint16Array')
    }
    var textures = {
    };
    var program = new Programs.Program(
        s_playerVertexShader, s_playerFragmentShader);
    s_playerModel = new Models.Model(program, arrays, textures);
  };

  /**
   * Player represents a player in the game.
   * @constructor
   */
  var Player = (function() {
    return function(services, position, name, netPlayer) {
      this.services = services;
      this.renderer = services.renderer;

      // add the button before the player so it will get
      // processed first.
      this.abutton = new GameButton(services.entitySystem);

      services.entitySystem.addEntity(this);
      services.drawSystem.addEntity(this);
      this.netPlayer = netPlayer;
      this.position = position;

      makePlayerModel();

      var images = this.services.images;
      this.matrix = new Float32Array(16);
      m4.identity(this.matrix);
      this.uniforms = {
        u_matrix: this.matrix,
        u_adjustRange: [0, 1],
        u_hsvAdjust: [0, 0, 0],
      };

      this.textures = {
        u_texture: images.avatar[0].avatarStandU,
      };

      //if (availableColors.length == 0) {
      //  var colors = services.colors;
      //  for (var ii = 0; ii < colors.length; ++ii) {
      //    availableColors.push(colors[ii]);
      //  }
      //}

      //this.color = availableColors[Math.floor(Math.random() * availableColors.length)];
      //netPlayer.sendCmd('setColor', this.color);
      //availableColors.splice(this.color, 1);

      this.animTimer = 0;

      netPlayer.addEventListener('disconnect', Player.prototype.handleDisconnect.bind(this));
      netPlayer.addEventListener('pad', Player.prototype.handlePadMsg.bind(this));
      netPlayer.addEventListener('abutton', Player.prototype.handleAButtonMsg.bind(this));
      netPlayer.addEventListener('setName', Player.prototype.handleNameMsg.bind(this));
      netPlayer.addEventListener('busy', Player.prototype.handleBusyMsg.bind(this));

      this.setName(name);
      this.direction = 6;            // direction player is pushing (-1, 0, 1)
      this.facing = this.direction;  // direction player is facing (-1, 1)

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
    this.abutton.destroy();
    availableColors.push(this.color);
  };

  Player.prototype.handleDisconnect = function() {
    this.removeFromGame();
  };

  Player.prototype.handleBusyMsg = function(msg) {
    // We ignore this message
  };

  Player.prototype.handlePadMsg = function(msg) {
    this.direction = msg.dir;
    if (this.direction) {
      this.facing = this.direction;
    }
  };

  Player.prototype.handleAButtonMsg = function(msg) {
    this.abutton.setState(msg.pressed);
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
  Player.prototype.init_waiting = function() {
    this.netPlayer.sendCmd('wait', {});
  };

  Player.prototype.state_waiting = function() {
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
    var off = {};
    this.services.levelManager.getDrawOffset(off);

    s_playerModel.drawPrep();
    s_playerModel.draw(this.uniforms, this.textures);
  };

  return Player;
});

