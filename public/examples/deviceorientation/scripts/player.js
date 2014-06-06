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

define(
  [ '../../../scripts/misc/cssparse',
    './shot',
  ], function(CSSParse, Shot) {
  /**
   * Player represnt a player in the game.
   * @constructor
   */
  var Player = (function() {

    return function(services, name, netPlayer) {
      this.services = services;
      this.renderer = services.renderer;
      var globals = services.globals;

      services.entitySystem.addEntity(this);
      this.netPlayer = netPlayer;
      this.material = new THREE.MeshPhongMaterial({
        ambient: 0x808080,
        color: 0x8080FF,
        specular: 0xFFFFFF,
        shininess: 30,
        shading: THREE.FlatShading,
      });
      this.mesh = new THREE.Mesh(services.geometry.playerMesh, this.material);
      this.root = new THREE.Object3D();
      this.mid = new THREE.Object3D();

      this.pickNewPosition();

      this.mid.add(this.mesh);
      this.root.add(this.mid);
      services.scene.add(this.root);

      netPlayer.addEventListener('disconnect', Player.prototype.handleDisconnect.bind(this));
      netPlayer.addEventListener('orient', Player.prototype.handleOrient.bind(this));
      netPlayer.addEventListener('setColor', Player.prototype.handleSetColor.bind(this));

      var g = this.services.globals;

      this.playerName = name;
      this.shots = [];
      this.maxShots = g.maxShots;
      this.shotDuration = g.shotDuration;
      this.shootTimer = 0;
      this.score = 0;
      this.timer = 0;
      this.invincibilityTimer = 0;
      this.lookAt = new THREE.Vector3(0,0,0);

      this.setState('fire');
    };
  }());

  Player.prototype.pickNewPosition = function() {
    var globals = this.services.globals;
    this.root.position.x = (Math.random() * 2 - 1) * globals.areaSize;
    this.root.position.y = (Math.random() * 2 - 1) * globals.areaSize;
    this.root.position.z = (Math.random() * 2 - 1) * globals.areaSize;
  };

  Player.prototype.timesUp = function() {
    var globals = this.services.globals;
    this.timer -= globals.elapsedTime;
    return this.timer <= 0;
  };

  Player.prototype.setState = function(state) {
    this.state = state;
    this.process = this["state_" + state];
  }

  Player.prototype.scored = function() {
    this.sendCmd('scored', { points: 1 });
    this.pickNewPosition();
  };

  Player.prototype.shoot = function() {
    if (this.shots.length >= this.maxShots) {
      this.removeShot(this.shots[0]);
    }

    this.services.audioManager.playSound('fire');
    var mat = this.mesh.matrixWorld.elements;
    var direction = new THREE.Vector3(mat[4], mat[5], mat[6]);
    var shot = new Shot(
      this.services,
      this.root.position,
      direction,
      this);
    this.shots.push(shot);
  };

  Player.prototype.removeShot = function(shot) {
    var ndx = this.shots.indexOf(shot);
    this.shots.splice(ndx, 1);
    shot.destroy();
  };

  Player.prototype.removeFromGame = function() {
    while (this.shots.length) {
      this.removeShot(this.shots[0]);
    }
    this.services.scene.remove(this.root);
    this.services.entitySystem.removeEntity(this);
    this.services.playerManager.removePlayer(this);
  };

  Player.prototype.handleDisconnect = function() {
    this.removeFromGame();
  };

  Player.prototype.handleOrient = function(msg) {
    this.mesh.rotation.z = msg.gamma * -Math.PI / 180;
    this.mid.rotation.x  = msg.beta  *  Math.PI / 180;
    this.root.rotation.y = msg.alpha *  Math.PI / 180;

    this.targetDir = -1;
  };

  Player.prototype.handleSetColor = function(msg) {
    var color = CSSParse.parseCSSColor(msg.color, true);
    this.material.color.setRGB(color[0], color[1], color[2]);
  };

  Player.prototype.sendCmd = function(cmd, data) {
    this.netPlayer.sendCmd(cmd, data);
  };

  Player.prototype.state_fire = function() {
    var globals = this.services.globals;
    this.shootTimer += globals.elapsedTime;
    if (this.shootTimer >= globals.shotInterval) {
      this.shootTimer = 0;
      this.shoot();
    }
  };

  return Player;
});

