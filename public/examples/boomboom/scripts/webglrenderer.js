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
    [ '../../../3rdparty/tdl/buffers',
      '../../../3rdparty/tdl/fast',
      '../../../3rdparty/tdl/framebuffers',
      '../../../3rdparty/tdl/log',
      '../../../3rdparty/tdl/math',
      '../../../3rdparty/tdl/models',
      '../../../3rdparty/tdl/particles',
      '../../../3rdparty/tdl/primitives',
      '../../../3rdparty/tdl/programs',
      '../../../3rdparty/tdl/textures',
      '../../../3rdparty/tdl/webgl',
    ], function(
      Buffers,
      Fast,
      Framebuffers,
      Log,
      Maths,
      Models,
      Particles,
      Primitives,
      Programs,
      Textures,
      WebGL) {
  var WebGLRenderer = function(services, canvas, gl) {
    var math = tdl.math;
    var fast = tdl.fast;
    this.services = services;
    this.canvas = canvas;

    this.gl = gl;
    this.screenDimensions = [2 / this.canvas.width, 2 / this.canvas.height];
    this.renderCount = 0;
    this.resize();
    var width = this.canvas.width;
    var height = this.canvas.height;

    function makePersist(newTexture, oldTexture) {
      var textures = {
          newRender: newTexture,
          oldRender: oldTexture
      };
      var program = tdl.programs.loadProgramFromScriptTags(
          'persistVertexShader',
          'persistFragmentShader');
      var arrays = tdl.primitives.createPlane(2, 2, 1, 1);
      tdl.primitives.reorient(arrays,
          [1, 0, 0, 0,
           0, 0,-1, 0,
           0, 1, 0, 0,
           0, 0, 0, 1]);
      delete arrays.normal;
      return new tdl.models.Model(program, arrays, textures);
    }

    function makeLastPlane(texture) {
      var textures = {
          texture: texture
      };
      var program = tdl.programs.loadProgramFromScriptTags(
          'mainVertexShader',
          'mainFragmentShader');
      var arrays = tdl.primitives.createPlane(2, 2, 1, 1);
      tdl.primitives.reorient(arrays,
          [1, 0, 0, 0,
           0, 0,-1, 0,
           0, 1, 0, 0,
           0, 0, 0, 1]);
      delete arrays.normal;
      return new tdl.models.Model(program, arrays, textures);
    }

    function setupFlame(particleSystem) {
      var emitter = particleSystem.createParticleEmitter();
      emitter.setTranslation(0, 0, 0);
      emitter.setState(tdl.particles.ParticleStateIds.ADD);
      emitter.setColorRamp(
          [1, 1, 0, 1,
           1, 0, 0, 1,
           0, 0, 0, 1,
           0, 0, 0, 0.5,
           0, 0, 0, 0]);
      emitter.setParameters({
          numParticles: 20,
          lifeTime: 2,
          timeRange: 2,
          startSize: 0.5,
          endSize: 0.9,
          velocity:[0, 0.60, 0], velocityRange: [0.15, 0.15, 0.15],
          worldAcceleration: [0, -0.20, 0],
          spinSpeedRange: 4});
    }

    function setupStars(particleSystem) {
      var emitter = particleSystem.createParticleEmitter();
      emitter.setTranslation(0, 0, 0);
      emitter.setState(tdl.particles.ParticleStateIds.ADD);
      emitter.setColorRamp(
          [0, 0, 1, 0.5,
           0, 0, 1, 1,
           0.5, 0.5, 1, 1,
           1, 1, 1, 1,
           0.5, 0.5, 1, 1,
           0, 0, 1, 1,
           0, 0, 1, 0.5,
           0, 0, 0, 0]);
      emitter.setParameters({
          numParticles: 1000,
          lifeTime: 5,
          lifeTimeRange: 5,
          timeRange: 5,
          startSize: 10,
          startSizeRange: 10,
          endSize: 10,
          position: [width / 2, height / 2, 0],
          positionRange: [width / 2 + 40, height / 2 + 40, 0],
          velocity: [-20, 10, 0],
          //colorMultRange: [1, 1, 1, 0],
        });
    }

    function setupExplosions(particleSystem, maxExplosions) {
      var emitter = particleSystem.createParticleEmitter();
      emitter.setState(tdl.particles.ParticleStateIds.ADD);
      emitter.setColorRamp(
          [1, 1, 1, 1,
           1, 1, 0, 1,
           1, 0, 0, 1,
           1, 1, 1, 0.5,
           1, 1, 1, 0]);
      emitter.setParameters({
          numParticles: 60,
          lifeTime: 1.5,
          startTime: 0,
          startSize: 20.0,
          endSize: 40.0,
          spinSpeedRange: 10},
          function(index, parameters) {
              var speed = Math.random() * 40 + 40;
              var angle = Math.random() * 2 * Math.PI;
              parameters.velocity = math.matrix4.transformPoint(
                  math.matrix4.rotationZ(angle), [speed, 0, 0]);
              parameters.acceleration = math.mulVectorVector(
                  parameters.velocity, [speed * -0.001, speed * -0.001, 0]);
          });
      return tdl.particles.createOneShotManager(emitter, maxExplosions);
    }

    function setupShieldhits(particleSystem, maxShieldhits) {
      var shieldhits = [];
      var emitter = particleSystem.createParticleEmitter();
      emitter.setState(tdl.particles.ParticleStateIds.ADD);
      emitter.setColorRamp(
          [1, 1, 1, 1,
           0, 1, 1, 1,
           0, 0, 1, 1,
           0, 0, 1, 0.5,
           0, 0, 1, 0]);
      emitter.setParameters({
          numParticles: 60,
          lifeTime: 0.7,
          startTime: 0,
          startSize: 10.0,
          endSize: 10.0,
          spinSpeedRange: 10},
          function(index, parameters) {
              var speed = Math.random() * 40 + 40;
              var angle = Math.random() * 2 * Math.PI;
              parameters.velocity = math.matrix4.transformPoint(
                  math.matrix4.rotationZ(angle), [speed, 0, 0]);
              parameters.acceleration = math.mulVectorVector(
                  parameters.velocity, [speed * -0.001, speed * -0.001, 0]);
          });
      return tdl.particles.createOneShotManager(emitter, maxShieldhits);
    }

    this.matrix = new Float32Array([1,0,0,0,1,0,0,0,1]);
    this.constUniforms = {
      screenDimensions: this.screenDimensions
    };
    this.uniforms = {
      matrix: this.matrix
    };

    this.starParticleSystem = new tdl.particles.ParticleSystem(
        gl, null, tdl.math.pseudoRandom);
    setupStars(this.starParticleSystem);
    this.particleSystem = new tdl.particles.ParticleSystem(
        gl, null, tdl.math.pseudoRandom);
    this.explosions = setupExplosions(this.particleSystem, 20);
    this.shieldhits = setupShieldhits(this.particleSystem, 20);
    this.world = fast.matrix4.identity(new Float32Array(16));
    this.view = fast.matrix4.identity(new Float32Array(16));
    //this.projection = fast.matrix4.identity(new Float32Array(16));
    this.viewProjection = fast.matrix4.identity(new Float32Array(16));
    this.viewInverse = fast.matrix4.identity(new Float32Array(16));

    this.baseFBO = tdl.framebuffers.createFramebuffer(
        this.canvas.width, this.canvas.height, true);
    this.persistentFBO1 = tdl.framebuffers.createFramebuffer(
        this.canvas.width, this.canvas.height);
    this.persistentFBO2 = tdl.framebuffers.createFramebuffer(
        this.canvas.width, this.canvas.height);

    this.persistPlane = makePersist(
        this.baseFBO.texture, this.persistentFBO1.texture);

    this.lastPlane = makeLastPlane(this.persistentFBO2.texture);
    this.leadMarkInfo = {on:false,x:0,y:0,direction:0,color:[1,1,1,1]};
  }

  WebGLRenderer.prototype.resize = function() {
    var width = this.canvas.clientWidth;
    var height = this.canvas.clientHeight;
    if (this.canvas.width != width ||
        this.canvas.height != height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.screenDimensions[0] = 2 / width;
      this.screenDimensions[1] = 2 / height;
      gl.viewport(0, 0, width, height);
      this.projection = [
        2 / width, 0, 0, 0,
        0, -2 / height, 0, 0,
        0, 0, 1, 0,
        -1 + 1 / width, 1 - 1 / height, 0, 1];
      return true;
    }
  };

  WebGLRenderer.prototype.begin = function() {
    ++this.renderCount;
    this.leadMarkInfo.on = false;
    this.screenDimensions[0] = 2 / this.canvas.width;
    this.screenDimensions[1] = 2 / this.canvas.height;
//    this.baseFBO.bind();
    gl.colorMask(true, true, true, true);
    gl.depthMask(true);
    gl.clearColor(0.2,0.3,0.1,1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

  };

  WebGLRenderer.prototype.end = function() {
    //this.particleSystem.draw(this.viewProjection, this.world, this.viewInverse);
//    this.particleSystem.draw(this.projection, this.world, this.viewInverse);
//    gl.disable(gl.BLEND);
//    gl.disable(gl.DEPTH_TEST);
//    this.baseFBO.unbind();

    // blend base with persist1 into persist2
//    this.persistentFBO2.bind();
//    this.persistPlane.drawPrep({persistence: 0.1});
//    this.persistPlane.draw({oldRender: this.persistentFBO1.texture});
//    this.persistentFBO2.unbind();
//
//    // draw on the backbuffer.
//    gl.colorMask(true, true, true, false);
//    gl.clearColor(0,0,0,0);
//    gl.clearDepth(1);
//    gl.depthMask(true);
//    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
//    this.lastPlane.drawPrep();
//    this.lastPlane.draw({texture: this.persistentFBO2.texture});
//    this.starParticleSystem.draw(this.projection, this.world, this.viewInverse);
//    var lm = this.leadMarkInfo;
//    if (lm.on) {
//      this.drawLeadMark_([lm.x, lm.y], lm.direction, lm.color);
//    }
//    gl.disable(gl.DEPTH_TEST);
//    gl.disable(gl.BLEND);
//
//    // swap persist FBOs.
//    var temp = this.persistentFBO1;
//    this.persistentFBO1 = this.persistentFBO2;
//    this.persistentFBO2 = temp;
  };

//      var info = this.outlineShips[ii];
//      var c = Math.cos(info.direction);
//      var s = Math.sin(info.direction);
//
//      var m = this.matrix;
//      m[0] = c;
//      m[1] = s;
//      m[3] = -s;
//      m[4] = c;
//      m[6] = info.x;
//      m[7] = info.y;
//
//      this.uniforms.color = info.color;
//      model.draw(this.uniforms);

  WebGLRenderer.prototype.startExplosion = function(position, direction, color) {
    var _tp_ = tdl.fast.matrix4.rotationZ(new Float32Array(16), Math.random() * Math.PI * 2);
    _tp_[12] = position[0];
    _tp_[13] = position[1];
    // We have multiple explosions because if you only have one and it is still going
    // when you trigger it a second time it will immediately start over.
    this.explosions.startOneShot(_tp_);
  };

  WebGLRenderer.prototype.startShieldHit = function(position) {
    var _tp_ = tdl.fast.matrix4.rotationZ(new Float32Array(16), Math.random() * Math.PI * 2);
    _tp_[12] = position[0];
    _tp_[13] = position[1];
    // We have multiple shieldhits because if you only have one and it is still going
    // when you trigger it a second time it will immediately start over.
    this.shieldhits.startOneShot(_tp_);
  };

  return WebGLRenderer;
});

