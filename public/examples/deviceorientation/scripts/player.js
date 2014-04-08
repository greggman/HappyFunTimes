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

define(['../../scripts//2d', './shot'], function(M2D, Ships, Shot) {
  /**
   * Player represnt a player in the game.
   * @constructor
   */
  var Player = (function() {

    return function(services, name, netPlayer) {
      this.services = services;
      this.renderer = services.renderer;

      services.entitySystem.addEntity(this);
      this.netPlayer = netPlayer;
      this.material = new THREE.MeshBasicMaterial({ color: 0x44AA44 });
      this.mesh = new THREE.Mesh(services.geometry.cube, this.material);
      services.scene.add(this.mesh);

      netPlayer.addEventListener('disconnect', Player.prototype.handleDisconnect.bind(this));
      netPlayer.addEventListener('orient', Player.prototype.handleOrient.bind(this));

      var g = this.services.globals;

      this.playerName = name;
      this.shots = [];
      this.maxShots = g.maxShots;
      this.shotDuration = g.shotDuration;
      this.shootTimer = 0;
      this.score = 0;
      this.timer = 0;
      this.invincibilityTimer = 0;

      this.setState('fire');
    };
  }());

  Player.prototype.timesUp = function() {
    var globals = this.services.globals;
    this.timer -= globals.elapsedTime;
    return this.timer <= 0;
  };

  Player.prototype.setState = function(state) {
    this.state = state;
    this.process = this["state_" + state];
  }

  Player.prototype.shoot = function() {
    if (this.shots.length >= this.maxShots) {
      this.removeShot(this.shots[0]);
    }

    this.services.audioManager.playSound('fire');
    var shot = new Shot(
      this.services,
      this.position[0] + -Math.sin(this.direction) * 15,
      this.position[1] +  Math.cos(this.direction) * 15,
      this.direction, this);
    this.shots.push(shot);
  };

  Player.prototype.removeShot = function(shot) {
    var ndx = this.shots.indexOf(shot);
    this.shots.splice(ndx, 1);
    shot.destroy();
  };

  Player.prototype.removeFromGame = function() {
    this.services.queueManager.removeFromQueue(this);
    while (this.shots.length) {
      this.removeShot(this.shots[0]);
    }
    this.sevices.scene.remove(this.mesh);
    this.services.entitySystem.deleteEntity(this);
    this.services.playerManager.removePlayer(this);
  };

  Player.prototype.handleDisconnect = function() {
    this.removeFromGame();
  };

  Player.prototype.handleOrient = function(msg) {
    this.mesh.rotation.z = msg.gamma * -Math.PI / 180;
    this.mesh.rotation.x = msg.beta * Math.PI / 180;
    this.targetDir = -1;
  };

  Player.prototype.handleFireMsg = function(msg) {
    this.fire = msg.fire;
    if (this.fire == 0) {
      this.shootTimer = 0;
    }
  };

  Player.prototype.sendCmd = function(cmd, data) {
    this.netPlayer.sendCmd(cmd, data);
  };

  Player.prototype.state_fire = function() {
  };

  return Player;
});

