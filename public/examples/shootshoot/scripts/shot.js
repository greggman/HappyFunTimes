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

define(['../../scripts/2d'], function(M2D) {
  /**
   * A shot.
   * @constructor
   */
  function Shot(services, x, y, direction, owner) {
    var globals = services.globals;
    this.services = services;
    this.owner = owner;
    this.position = [x, y];
    this.vel = globals.shotVelocity;
    this.duration = globals.shotDuration;
    this.direction = direction;
    this.drawCount = 0;

    this.matrix = new Float32Array([1,0,0,0,1,0,0,0,1]);
    this.uniforms = {
      matrix: this.matrix
    };

    this.services.entitySystem.addEntity(this);
    this.services.drawSystem.addEntity(this);
  }

  Shot.prototype.remove = function() {
    if (this.owner) {
      this.owner.removeShot(this);
      this.owner = undefined;
    }
  };

  Shot.prototype.destroy = function() {
    this.services.entitySystem.removeEntity(this);
    this.services.drawSystem.removeEntity(this);
  };

  Shot.prototype.process = function() {
    var globals = this.services.globals;
    this.duration -= globals.elapsedTime;
    if (this.duration <= 0) {
      this.remove();
    } else {
      var dx =  Math.cos(this.direction) * this.vel * globals.elapsedTime;
      var dy = -Math.sin(this.direction) * this.vel * globals.elapsedTime;
      if (!M2D.updatePosWithRange(this.position, dx, dy, globals.width, globals.height)) {
        this.remove();
        return;
      }

      var hit = false;
      var self = this;
//      this.services.playerManager.forEachPlayer(function(player) {
//        if (player.id != self.owner.id) {
//          if (player.collide(self.position[0], self.position[1], 3)) {
//            hit = true;
//            if (player.die(self.owner, self, false)) {
//              ++self.owner.score;
//            }
//          }
//        }
//      });
      if (hit) {
        this.remove();
      }
    }
  };

  Shot.prototype.draw = function(ctx) {
    ctx.fillStyle = (++this.drawCount & 1) ? "white" : "red";
    ctx.fillRect(this.position[0], this.position[1], 16, 16);
  };

  return Shot;
});

