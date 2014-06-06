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
    [
      '../../../3rdparty/tdl/buffers',
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

  var WebGLRenderer = function(services, canvas) {
    var math = tdl.math;
    var fast = tdl.fast;
    this.services = services;
    this.canvas = canvas;
    this.gl = tdl.webgl.setupWebGL(canvas, {alpha:false}, function() {});
    if (!this.gl) {
      return;
    }

    function makeCircle() {
      var positions = [];
      var indices = [];
      var numVertices = 24;
      for (var ii = 0; ii < numVertices; ++ii) {
        var angle = ii * Math.PI * 2 / numVertices;
        positions.push(Math.cos(angle), Math.sin(angle));
      };
      for (var ii = 1; ii < numVertices; ++ii) {
        indices.push(0, ii, (ii + 1) % numVertices);
      }
      var arrays = {
        position: new tdl.primitives.AttribBuffer(2, positions),
        indices: new tdl.primitives.AttribBuffer(3, indices, 'Uint16Array'),
      };
      var textures = {
      };
      var program = tdl.programs.loadProgramFromScriptTags(
          "screenVertexShader", "screenFragmentShader");
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

    this.renderCount = 0;
    this.circle = makeCircle();
    this.screenDimensions = [2 / canvas.width, 2 / canvas.height];

    this.matrix = new Float32Array([1,0,0,0,1,0,0,0,1]);
    this.constUniforms = {
      screenDimensions: this.screenDimensions
    };
    this.uniforms = {
      matrix: this.matrix
    };

    this.persistMatrix = new Float32Array([1,0,0,0,1,0,0,0,1]);
    this.persistUniforms = {
      persistence: 0.1,
      matrix: this.persistMatrix,
    };

    this.particleSystem = new tdl.particles.ParticleSystem(
        gl, null, tdl.math.pseudoRandom);
    this.explosions = setupExplosions(this.particleSystem, 20);

    this.world = fast.matrix4.identity(new Float32Array(16));
    this.view = fast.matrix4.identity(new Float32Array(16));
    //this.projection = fast.matrix4.identity(new Float32Array(16));
    this.viewProjection = fast.matrix4.identity(new Float32Array(16));
    this.viewInverse = fast.matrix4.identity(new Float32Array(16));

    this.resize();
    this.baseFBO = tdl.framebuffers.createFramebuffer(
        this.canvas.width, this.canvas.height, true);
    this.persistentFBO1 = tdl.framebuffers.createFramebuffer(
        this.canvas.width, this.canvas.height);
    this.persistentFBO2 = tdl.framebuffers.createFramebuffer(
        this.canvas.width, this.canvas.height);

    this.persistPlane = makePersist(
        this.baseFBO.texture, this.persistentFBO1.texture);
    this.lastPlane = makeLastPlane(this.persistentFBO2.texture);

    this.circles = [];
  };

  WebGLRenderer.prototype.resize = function() {
    var canvas = this.gl.canvas;
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    if (canvas.width != width ||
        canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      this.screenDimensions[0] = 2 / width;
      this.screenDimensions[1] = 2 / height;
      this.projection = [
        2 / width, 0, 0, 0,
        0, -2 / height, 0, 0,
        0, 0, 1, 0,
        -1 + 1 / width, 1 - 1 / height, 0, 1];
    }
  };

  WebGLRenderer.prototype.canRender = function() {
    return !!this.gl;
  };

  WebGLRenderer.prototype.begin = function() {
    this.resize();
    ++this.renderCount;
    this.screenDimensions[0] = 2 / this.canvas.width;
    this.screenDimensions[1] = 2 / this.canvas.height;
    this.baseFBO.bind();
    gl.colorMask(true, true, true, true);
//    gl.depthMask(true);
    gl.clearColor(0,0,0,0);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
  };

  WebGLRenderer.prototype.end = function() {
    this.renderCircles();

    this.particleSystem.draw(this.projection, this.world, this.viewInverse);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    this.baseFBO.unbind();

    // blend base with persist1 into persist2
    this.persistentFBO2.bind();
    this.persistPlane.drawPrep(this.persistUniforms);
    this.persistPlane.draw({oldRender: this.persistentFBO1.texture});
    this.persistentFBO2.unbind();

    // draw on the backbuffer.
    gl.colorMask(true, true, true, false);
    gl.clearColor(0,0,0,1);
    gl.clearDepth(1);
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    this.lastPlane.drawPrep();
    this.lastPlane.draw({texture: this.persistentFBO2.texture});
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    // swap persist FBOs.
    var temp = this.persistentFBO1;
    this.persistentFBO1 = this.persistentFBO2;
    this.persistentFBO2 = temp;
  };

  WebGLRenderer.prototype.drawCircle = function(position, radius, color) {
    var info = {
      x: position[0],
      y: position[1],
      scale: radius,
      color: color,
    };
    this.circles.push(info);
  };

  WebGLRenderer.prototype.renderCircles = function() {
    var model = this.circle;
    model.drawPrep(this.constUniforms);
    for (var ii = 0; ii < this.circles.length; ++ii) {
      var info = this.circles[ii];

      var m = this.matrix;
      m[0] = info.scale;
      m[1] = 0;
      m[3] = 0;
      m[4] = info.scale;
      m[6] = info.x;
      m[7] = info.y;

      this.uniforms.color = info.color;
      model.draw(this.uniforms);
    }

    this.circles = [];
  };

  WebGLRenderer.prototype.startExplosion = function(position, direction, color) {
    var _tp_ = tdl.fast.matrix4.rotationZ(new Float32Array(16), Math.random() * Math.PI * 2);
    _tp_[12] = position[0];
    _tp_[13] = position[1];
    // We have multiple explosions because if you only have one and it is still going
    // when you trigger it a second time it will immediately start over.
    this.explosions.startOneShot(_tp_);
  };

  return WebGLRenderer;
});
