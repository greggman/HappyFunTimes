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

// TODO: should this really be based on player?

define(["./2d", "./player"], function(M2D, Player) {
  /**
   * MetaQueuePlayer is a group controlled player when players are in queue
   * @constructor
   */
  function MetaQueuePlayer(services, x, y, direction) {
    Player.call(this, services, x, y, direction, "The Ghost");
    this.accumClear();
    this.fadeOutRate = 1; /* seconds == 1 */
    this.fade = 0;
  };
  tdl.base.inherit(MetaQueuePlayer, Player);

  MetaQueuePlayer.prototype.send = function() {
    // do nothing.
  };

  MetaQueuePlayer.prototype.checkCollisions = function() {
    if (this.fade < 0.3) {
      return;
    }
    return Player.prototype.checkCollisions.call(this);
  };

  MetaQueuePlayer.prototype.collide = function(x, y, radius) {
    if (this.fade < 0.3) {
      return false;
    }
    return Player.prototype.collide.call(this, x, y, radius);
  };

  MetaQueuePlayer.prototype.accumClear = function() {
    if (!this.accum)
      this.accum = new Object();
    this.accum.turn = 0;
    this.accum.turnCount = 0;
    this.accum.targetDirVec = [0,0];
    this.accum.fire = 0;
    this.accum.count = 0;
  };

  MetaQueuePlayer.prototype.draw = function(renderer) {
    // comment in for debug rendering
    //renderer.drawShip(
    //    this.position, this.direction,
    //    {glColor: [1,0,0,1], canvasColor:"rgb(255,0,0)"});
    var a = Math.max(0, Math.min(1, this.fade));
    if (a == 0)
      return;
    var black = {glColor: [0,0,0,1], canvasColor: "rgb(0,0,0)"};
    var white = {glColor: [1,1,1,1], canvasColor: "rgb(255,255,255)"};
    switch (0) {
    case 0:
      var randShakePixels = 4;
      renderer.drawShip(
        M2D.add2D(this.position,
          a*(-randShakePixels+2*randShakePixels*Math.random()),
          a*(-randShakePixels+2*randShakePixels*Math.random())),
        this.direction, white);
      break;
    case 1:
      renderer.drawShip(M2D.add2D(this.position, 0, 2*a), this.direction, white);
      renderer.drawShip(M2D.add2D(this.position, 2*a, 0), this.direction, white);
      break;
    }
    renderer.drawShip(this.position, this.direction, black);
  };

  MetaQueuePlayer.prototype.state_fly = function(elapsedTime) {
    this.turn = 0;
    this.targetDir = [0, 0];
    this.fire = 0;
    this.fade -= elapsedTime * this.fadeOutRate;

    if (this.accum.turnCount) {
      this.turn = this.accum.turn / this.accum.turnCount;
      this.fade = 1;
    }
    if (this.accum.targetDirVec[0] != 0 || this.accum.targetDirVec[1] != 0) {
      this.targetDir = Math.atan2(
        this.accum.targetDirVec[0],
        this.accum.targetDirVec[1]);
      this.targetDir = (2 * Math.PI + this.targetDir) % (2 * Math.PI);
      this.fade = 1;
    }
    if (this.accum.fire > 0) {
      this.fire = 1;
      this.fade = 1;
    }
    this.accumClear();
    Player.prototype.state_fly.call(this, elapsedTime);
  };

  MetaQueuePlayer.prototype.state_die = function(elapsedTime) {
    this.fade -= elapsedTime * this.fadeOutRate;
    if (this.timesUp(elapsedTime)) {
      this.position[0] = Math.random() * this.services.globals.width;
      this.position[1] = Math.random() * this.services.globals.height;
      this.direction = Math.random() * Math.PI * 2;
      this.setState('fly');
    }
  };

  MetaQueuePlayer.prototype.onDie = function(killer) {
    if (killer == this) {
      this.timer = 3;
      this.setState('die');
    }
  };

  return MetaQueuePlayer;
});


