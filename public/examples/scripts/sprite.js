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
    '../../3rdparty/tdl/buffers',
    '../../3rdparty/tdl/fast',
    '../../3rdparty/tdl/math',
    '../../3rdparty/tdl/models',
    '../../3rdparty/tdl/primitives',
    '../../3rdparty/tdl/programs',
  ], function(
    Buffers,
    Fast,
    math,
    Models,
    Primitives,
    Programs) {

  var m4 = Fast.matrix4;

  var s_spriteVertexShader = [
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

  var s_spriteFragmentShader = [
    "precision mediump float;                                                          ",
    "                                                                                  ",
    "uniform sampler2D u_texture;                                                      ",
    "uniform vec2 u_adjustRange;                                                       ",
    "uniform vec4 u_hsvaAdjust;                                                        ",
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
    "  vec3 rgb = hsv2rgb(hsv + u_hsvaAdjust.xyz * affectMult);                        ",
    "  gl_FragColor = vec4(rgb, color.a + u_hsvaAdjust.a);                             ",
    "}                                                                                 ",
  ].join("\n");

  var s_spriteModel;

  var makeSpriteModel = function() {
    if (s_spriteModel) {
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
        s_spriteVertexShader, s_spriteFragmentShader);
    s_spriteModel = new Models.Model(program, arrays, textures);
  };

  var SpriteRenderer = function() {
    makeSpriteModel();
  };

  SpriteRenderer.prototype.getUniforms = function() {
    return {
      u_matrix: new Float32Array(16),
      u_adjustRange: [0, 1],
      u_hsvaAdjust: [0,0,0,0],
    };
  };

  SpriteRenderer.prototype.drawPrep = function() {
    s_spriteModel.drawPrep();
  }

  SpriteRenderer.prototype.draw = function(uniforms, x, y, width, height, rotation, xScale, yScale) {
    var matrix = uniforms.u_matrix;
    m4.identity(matrix);
    m4.scale(matrix, [2 / gl.canvas.width, -2 / gl.canvas.height, 1]);
    m4.translate(matrix, [
                 -gl.canvas.width  * 0.5 + x,
                 -gl.canvas.height * 0.5 + y,
                 0]);
    m4.rotateZ(matrix, rotation);
    m4.scale(matrix, [width * xScale, height * yScale, 1]);
    m4.translate(matrix, [-0.5, -0.5, 0]);

    s_spriteModel.draw(uniforms);
  };

  return SpriteRenderer;
});
