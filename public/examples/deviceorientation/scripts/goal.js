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

  /**
   * The Goal.
   * @constructor
   */
  function Goal(services) {
    var globals = services.globals;
    this.services = services;

    this.services.entitySystem.addEntity(this);

    this.material = new THREE.MeshPhongMaterial({
      ambient: 0x808080,
      color: 0x8080FF,
      specular: 0xFFFFFF,
      shininess: 30,
      shading: THREE.FlatShading,
    });
    this.root = new THREE.Mesh(services.geometry.goalMesh, this.material);
    this.services.scene.add(this.root);

    this.pickNewPosition();
  }

  Goal.prototype.pickNewPosition = function() {
    var globals = this.services.globals;
    this.root.position.x = (Math.random() * 2 - 1) * globals.areaSize;
    this.root.position.y = (Math.random() * 2 - 1) * globals.areaSize;
    this.root.position.z = (Math.random() * 2 - 1) * globals.areaSize;
  };

  Goal.prototype.hit = function(position, radius) {
    var radiusSq = radius * radius;
    var dx = position.x - this.root.position.x;
    var dy = position.y - this.root.position.y;
    var dz = position.z - this.root.position.z;
    var distSq = dx * dx + dy * dy + dz * dz;
    return distSq < radiusSq;
  };

  Goal.prototype.remove = function() {
  };

  Goal.prototype.destroy = function() {
    this.services.entitySystem.removeEntity(this);
    this.services.scene.remove(this.root);
  };

  Goal.prototype.process = function() {
    var globals = this.services.globals;
    this.material.color.setHSL(globals.time % 1, 1, 0.5);
    this.material.needsUpdate = true;
    this.root.rotation.x += globals.elapsedTime * 4.1;
    this.root.rotation.z += globals.elapsedTime * 3.31;
  };

  return Goal;
});


