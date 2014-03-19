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

tdl.require('tdl.math');

define(['./2d', './ships', './shot'], function(M2D, Ships, Shot) {
  /**
   * Player represnt a player in the game.
   * @constructor
   */
  var Player = (function() {
    var g_playerCount = 1;
    var g_startCount = Math.floor(Math.random() * 100);

    return function(services, x, y, direction, name, netPlayer) {
      this.services = services;
      this.renderer = services.renderer;

      var isMetaQueuePlayer = netPlayer === undefined;
      services.entitySystem.addEntity(this);
      if (!isMetaQueuePlayer) {
        ++g_playerCount;
        this.netPlayer = netPlayer;
      }

      this.isMetaQueuePlayer = isMetaQueuePlayer;
      this.position = [x, y];
      this.hp = 3;
      this.color = Ships.makeColor(g_playerCount + g_startCount);

      if (netPlayer) {
        netPlayer.addEventListener('turn', Player.prototype.handleTurnMsg.bind(this));
        netPlayer.addEventListener('target', Player.prototype.handleTargetMsg.bind(this));
        netPlayer.addEventListener('fire', Player.prototype.handleFireMsg.bind(this));
        netPlayer.addEventListener('setName', Player.prototype.handleNameMsg.bind(this));
        netPlayer.addEventListener('busy', Player.prototype.handleBusyMsg.bind(this));
        this.sendCmd('setColor', {
          color: this.color.canvasColor,
          style: this.color.style,
        });
      }

      var g = this.services.globals;

      this.playerName = name;
      this.turn = 0;
      this.targetDir = -1;
      this.direction = direction;
      this.fire = false;
      this.vel = g.playerVelocity;
      this.turnVel = g.playerTurnVelocity;
      this.shots = [];
      this.maxShots = g.maxShots;
      this.shotDuration = g.shotDuration;
      this.shootTimer = 0;
      this.score = 0;
      this.timer = 0;
      this.launchDuration = 0.5;
      this.showPlaceInQueue = false;
      this.invincibilityTimer = 0;

      // If true the player is entering their name.
      // Don't launch them if they are in the queue.
      // TODO(gman): Implement this?
      this.busy = false;

      if (isMetaQueuePlayer) {
        this.setState('fly');
      } else {
        if (g.haveServer || g_activePlayers.length >= 2) {
          this.addToQueue();
        } else {
          this.setState('fly');
          g_activePlayers.push(this);
        }
      }
    };
  }());

  Player.prototype.timesUp = function(elapsedTime) {
    this.timer -= elapsedTime;
    return this.timer <= 0;
  };

  Player.prototype.addToQueue = function() {
    this.services.queueManager.addToQueue(this);
    this.setState('queued');
  }

  Player.prototype.setState = function(state) {
    //tdl.log(this.id, state);
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
    g_shotsById[shot.id] = shot;
    this.shots.push(shot);
  };

  Player.prototype.removeShot = function(shot) {
    var ndx = this.shots.indexOf(shot);
    this.shots.splice(ndx, 1);
    delete g_shotsById[shot.id];
    this.services.entitySystem.deleteEntityById(shot.id);
  };

  Player.prototype.removeFromActive = function() {
    for (var ii = 0; ii < g_activePlayers.length; ++ii) {
      if (g_activePlayers[ii].id == this.id) {
        g_activePlayers.splice(ii, 1);
        return;
      }
    }
  };

  Player.prototype.removeFromGame = function() {
    this.services.queueManager.removeFromQueue(this);
    this.removeFromActive();
    while (this.shots.length) {
      this.removeShot(this.shots[0]);
    }
    this.services.entitySystem.deleteEntity(this);
  }

  Player.prototype.handleTurnMsg = function(msg) {
    this.turn = msg.turn;
    this.targetDir = -1;
  };

  Player.prototype.handleTargetMsg = function(msg) {
    this.targetDir = msg.target;
    this.turn = 0;
  };

  Player.prototype.handleFireMsg = function(msg) {
    this.fire = msg.fire;
    if (this.fire == 0) {
      this.shootTimer = 0;
    }
  };

  Player.prototype.handleNameMsg = function(msg) {
    if (!msg.name) {
      this.sendCmd('setName', {
        name: this.playerName
      });
    } else {
      this.showPlaceInQueue = true;
      this.playerName = msg.name.replace(/[<>]/g, '');
      g_updateStatus = true;
    }
  };

  Player.prototype.handleBusyMsg = function(msg) {
    this.busy = msg.busy;
  };

  Player.prototype.state_queued = function(elapsedTime) {
    this.updateDirection(elapsedTime);

    // I'm not sure of an easy way to separate this.
    // I could make every player have a onQueued callback.
    // Then I could register this code with every player. That
    // seems dumb to me having to go
    //
    //   var p = new Player(...);
    //   p.registerOnQueued(processMetaQueuePlayer);
    //
    g_metaQueuePlayer.accum.turn += this.turn;
    g_metaQueuePlayer.accum.turnCount += (this.turn != 0) ? 1 : 0;
    if (this.targetDir >= 0) {
      g_metaQueuePlayer.accum.targetDirVec[0] += Math.sin(this.targetDir);
      g_metaQueuePlayer.accum.targetDirVec[1] += Math.cos(this.targetDir);
    }
    g_metaQueuePlayer.accum.fire += this.fire;
    g_metaQueuePlayer.accum.count += 1;
  };

  Player.prototype.sendCmd = function(cmd, data) {
    this.netPlayer.sendCmd(cmd, data);
  };

  Player.prototype.countdown = function() {
    this.timer = 3;
    this.setState('countdown');
    if (this.showPlaceInQueue) {
      this.sendCmd('launch');
    }
  };

  Player.prototype.state_countdown = function(elapsedTime) {
    this.updateDirection(elapsedTime);
    if (this.timesUp(elapsedTime)) {
      this.position[0] = Math.random() * this.services.globals.width / 2;
      this.position[1] = Math.random() * this.services.globals.height;
      this.direction = Math.random() * Math.PI * 2;

      this.timer = this.launchDuration;
      this.setState('launch');
      g_activePlayers.push(this);
      this.services.queueManager.removeFromQueue(this);
      this.services.audioManager.playSound('launch');
    }
  };

  Player.prototype.state_launch = function(elapsedTime) {
    this.updateDirection(elapsedTime);
    if (this.timesUp(elapsedTime)) {
      this.invincibilityTimer = this.services.globals.invincibilityDuration;
      this.setState('fly');
    }
  };

  Player.prototype.updateDirection = function(elapsedTime) {
    // turn player based on this.turn (-1, 0, 1)
    this.direction += this.turnVel * this.turn * elapsedTime;
    this.direction = this.direction % (Math.PI * 2);
    // turn player based on target
    if (this.targetDir >= 0) {
      var targetDir = this.targetDir;
      var delta = targetDir - this.direction;
      if (Math.abs(delta) > Math.PI) {
        if (delta > 0) {
          targetDir -= Math.PI * 2;
        } else {
          targetDir += Math.PI * 2;
        }
      }
      delta = targetDir - this.direction;
      var turn = delta > 0 ? 1 : -1;
      var turnVel = Math.min(Math.abs(delta), this.turnVel);
      this.direction += turnVel * turn * elapsedTime;
      this.direction = this.direction % (Math.PI * 2);
    }
  };

  Player.prototype.state_fly = function(elapsedTime) {
    this.updateDirection(elapsedTime);
    var dx = -Math.sin(this.direction) * this.vel * elapsedTime;
    var dy =  Math.cos(this.direction) * this.vel * elapsedTime;
    M2D.updatePosWithWrap(this.position, dx, dy, this.services.globals.width, this.services.globals.height);
    this.shootTimer = Math.max(this.shootTimer - elapsedTime, 0);
    if (this.fire && this.shootTimer <= 0) {
      this.shoot();
      this.shootTimer = this.maxShots / this.shotDuration;
    }
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= elapsedTime;
    }
    this.checkCollisions();
  };

  Player.prototype.checkCollisions = function() {
    // collide with other players?
    // TODO(gman): try to optimize this. Player 1 should check
    // 2, 3, 4.  2 against 3, 4,  3 against 4.
    var hit = null;
    for (var ii = 0; ii < g_activePlayers.length; ++ii) {
      var player = g_activePlayers[ii];
      // If we are not ourself and we are not the ghost
      if (player.id != this.id) {
        if (player.collide(this.position[0], this.position[1], 5)) {
          player.die(this, this, true);
          hit = player;
        }
      }
    }
    // If we collided with someone
    if (hit && this.invincibilityTimer <= 0) {
      this.die(player, player, true);
    }
  };

  /**
   * Puts the player in the death state.
   * Returns true if the killer should get a point.
   */
  Player.prototype.die = function(killer, collider, crash) {
    if (this.invincibilityTimer > 0) {
      this.services.audioManager.playSound('hitshield');
      this.renderer.startShieldHit(collider.position);
      return false;
    }
    this.services.audioManager.playSound('explosion');
    this.timer = 2;
    this.setState('die');
    this.removeFromActive();
    this.sendCmd('die', {
      killer: killer.playerName,
      crash: crash
    });
    if (!crash) {
      killer.sendCmd('kill', {
        killed: this.playerName
      });
    }
    this.showPlaceInQueue = true;
    this.renderer.startExplosion(
        this.position,
        this.direction,
        this.color);
    this.onDie(killer);
    return true;
  };

  Player.prototype.onDie = function(killer) {
  };

  Player.prototype.state_die = function(elapsedTime) {
    if (this.timesUp(elapsedTime)) {
      this.addToQueue();
    }
  };

  Player.prototype.collide = function(x, y, radius) {
    // TODO: need to put colliables on their own list or something
    // so queued players are not being checked.
    if (this.state != 'fly') {
      return false
    }
    var dx = x - this.position[0];
    var dy = y - this.position[1];
    var distSq = dx * dx + dy * dy;
    var radius =  ((this.invincibilityTimer > 0) ? 20 : 10) + radius;
    return distSq < radius * radius;
  };

  Player.prototype.draw = function(renderer) {
    var shipRenderFunc = renderer[Ships.styles[this.color.style]];

    switch (this.state) {
      case 'fly':
        shipRenderFunc.call(
            renderer, this.position, this.direction, this.color);
        if (this.invincibilityTimer > 0) {
          renderer.drawShield(this.position, this.direction, this.color);
        }
        return;
      case 'launch':
        var sy = this.services.globals.height / 2 + 20;
        var sx = this.services.globals.width + 20;
        var t = this.timer / this.launchDuration;
        shipRenderFunc.call(
            renderer,
            [tdl.math.lerpScalar(this.position[0], sx, t),
             tdl.math.lerpScalar(this.position[1], sy, t)],
            tdl.math.lerpCircular(this.direction, Math.PI, t, Math.PI * 2),
            this.color);
        return;
    }
  };

  return Player;
});

