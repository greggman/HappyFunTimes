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

define(['../../../3rdparty/three/three.min'], function(ThreeFoo) {

  var g_meshes = [];
  var getShotMesh = function(services) {
    if (g_meshes.length == 0) {
      var material = new THREE.MeshBasicMaterial({color: 0xFF0000});
      var mesh = new THREE.Mesh(services.geometry.shotMesh, material);
      g_meshes.push(mesh);
    }
    return g_meshes.pop();
  };

  var putShotMesh = function(mesh) {
    g_meshes.push(mesh);
  };

  /**
   * A shot.
   * @constructor
   */
  function Shot(services, position, direction, owner) {
    var globals = services.globals;
    this.services = services;
    this.owner = owner;
    this.duration = owner.shotDuration;
    this.direction = direction;
    this.drawCount = 0;

    this.services.entitySystem.addEntity(this);

    this.root = getShotMesh(this.services);
    this.services.scene.add(this.root);
    this.root.position.copy(position);
  }

  Shot.prototype.remove = function() {
    if (this.owner) {
      this.owner.removeShot(this);
      this.owner = undefined;
    }
  };

  Shot.prototype.destroy = function() {
    this.services.entitySystem.removeEntity(this);
    this.services.scene.remove(this.root);
    putShotMesh(this.root);
  };

  Shot.prototype.process = function() {
    var globals = this.services.globals;
    ++this.drawCount;
    this.duration -= globals.elapsedTime;
    if (this.duration <= 0) {
      this.remove();
      return;
    }

    this.root.rotation.x += globals.elapsedTime * 1.1;
    this.root.rotation.z += globals.elapsedTime * 1.31;

    this.root.position.x += this.direction.x * globals.shotVelocity * globals.elapsedTime;
    this.root.position.y += this.direction.y * globals.shotVelocity * globals.elapsedTime;
    this.root.position.z += this.direction.z * globals.shotVelocity * globals.elapsedTime;

    this.root.material.color.setHex(((this.drawCount >> 1) % 2) ? 0xFFFFFF : 0xFF0000);
    this.root.material.needsUpdate;

    var goal = this.services.goal;
    if (goal.hit(this.root.position, globals.goalSize)) {
      goal.pickNewPosition();
      this.owner.scored();
    }
  };

  return Shot;
});

