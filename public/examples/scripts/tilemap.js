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
  [ '../../3rdparty/tdl/buffers',
    '../../3rdparty/tdl/fast',
    '../../3rdparty/tdl/math',
    '../../3rdparty/tdl/models',
    '../../3rdparty/tdl/primitives',
    '../../3rdparty/tdl/programs',
    '../../3rdparty/tdl/textures',
    '../../scripts/misc/misc',
  ], function(
    Buffers,
    Fast,
    math,
    Models,
    Primitives,
    Programs,
    Textures,
    Misc) {

  var s_tileVertexShader = [
    "attribute vec4 position;                   ",
    "attribute vec4 texcoord;                   ",
    "                                           ",
    "uniform mat4 u_matrix;                     ",
    "uniform mat4 u_texMatrix;                  ",
    "                                           ",
    "varying vec2 v_texcoord;                   ",
    "                                           ",
    "void main() {                              ",
    "  gl_Position = u_matrix * position;       ",
    "  v_texcoord = (u_texMatrix * texcoord).xy;",
    "}                                          ",
  ].join("\n");

  var s_tileFragmentShader = [
    "precision mediump float;                                                   ",
    "                                                                           ",
    "uniform sampler2D u_tilemap;                                               ",
    "uniform sampler2D u_tiles;                                                 ",
    "uniform vec2 u_tilemapSize;                                                ",
    "uniform vec2 u_tilesetSize;                                                ",
    "                                                                           ",
    "varying vec2 v_texcoord;                                                   ",
    "                                                                           ",
    "void main() {                                                              ",
    "  vec2 tilemapCoord = floor(v_texcoord);                                   ",
    "  vec2 texcoord = fract(v_texcoord);                                       ",
    "  vec2 tileFoo = fract((tilemapCoord + vec2(0.5, 0.5)) / u_tilemapSize);   ",
    "  vec4 tile = floor(texture2D(u_tilemap, tileFoo) * 256.0);                ",
    "                                                                           ",
    "  vec2 tileCoord = (tile.xy + texcoord) / u_tilesetSize;                   ",
    "                                                                           ",
    "  vec4 color = texture2D(u_tiles, tileCoord);                              ",
    "  if (color.a <= 0.1) {                                                    ",
    "    discard;                                                               ",
    "  }                                                                        ",
    "  gl_FragColor = color;                                                    ",
    "}                                                                          ",
  ].join("\n");

  var s_tileProgram;
  var s_tileModel;

  var setupTileModel = function(textures) {
    if (s_tileModel) {
      return;
    }

    s_tileProgram = new Programs.Program(s_tileVertexShader, s_tileFragmentShader);

    var position = new Primitives.AttribBuffer(2, [
        0, 0,
        1, 0,
        0, 1,
        1, 1,
      ]);
    var texcoord = new Primitives.AttribBuffer(2, [
        0, 0,
        1, 0,
        0, 1,
        1, 1,
      ]);
    var indices = new Primitives.AttribBuffer(3, [
        0, 1, 2,
        2, 1, 3,
      ], 'Uint16Array');

    var arrays = {
      position: position,
      texcoord: texcoord,
      indices: indices,
    };

    s_tileModel = new Models.Model(s_tileProgram, arrays, textures);
  };

  // options:
  //   mapTilesAcross: number of tiles across map
  //   mapTilesDown: number of tiles down map;
  //   tilemap: Uint8Array tilemap where each tile is 4 bytes.
  //
  //      first byte is tile across
  //      second byte is tile down
  //      3rd byte unused
  //      4th byte unused
  //
  //      In other words if your tile texture is
  //
  //      +--+--+--+
  //      |  |  |  |
  //      +--+--+--+
  //      |  |  |AB|
  //      +--+--+--+
  //
  //      and you want tile 'AB' you'd need to put 0x02,0x01,0x00,0x00 in your tilemap.
  //
  // todo:
  //   Add some flags to let you:
  //     choose a z-level per tile?
  //     hflip/vflip a tile
  var TileMap = function(options) {

    this.tilemapTexture = {
      width: options.mapTilesAcross,
      height: options.mapTilesDown,
      pixels: options.tilemap,
    };
    var texture = new Textures.ColorTexture(this.tilemapTexture);
    this.tilemapTexture.texture = texture;
    texture.setParameter(gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    texture.setParameter(gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    this.textures = {
      u_tilemap: this.tilemapTexture.texture,
      u_tiles: options.tileset.texture,
    };

    setupTileModel(this.textures);

    this.tileset = options.tileset;

    this.tilemapSize = [options.mapTilesAcross, options.mapTilesDown];
    this.tilesetSize = [options.tileset.tilesAcross, options.tileset.tilesDown];
    this.mapOffset = [0, 0];
    this.matrix = new Float32Array([
      2,0,0,0,
      0,-2,0,0,
      0,0,1,0,
     -1,1,0,1,
    ]);
    this.texMatrix = new Float32Array([
      1,0,0,0,
      0,1,0,0,
      0,0,1,0,
      0,0,0,1,
    ]);
    this.uniforms = {
      u_tilemapSize: this.tilemapSize,
      u_tilesetSize: this.tilesetSize,
      u_mapOffset: this.mapOffset,
      u_matrix: this.matrix,
      u_texMatrix: this.texMatrix,
    };

    this.originMat = new Float32Array(16);
    this.scalingMat = new Float32Array(16);
    this.translationMat = new Float32Array(16);
    this.rotationMat = new Float32Array(16);
    this.workMat = new Float32Array(16);
  };

  TileMap.prototype.uploadTilemap = function() {
    this.tilemapTexture.texture.uploadTexture();
  };

  // options:
  //    x: where to draw in pixels
  //    y: where to draw in pixels
  //
  //    width: amount to draw in pixels
  //    height: amount to draw in pixels
  //
  //    canvasWidth:  size of canvas
  //    canvasHeight: size of canvas
  //
  //    originX: point to scale and rotate around
  //    originY: point to scale and rotate around
  //
  //    --  this pixel of the map will be at the origin;
  //    scrollX: pixel position to scroll map.
  //    scrollY: pixel position to scroll map
  //
  //    scaleX: 1.0 = 1 pixel = 1 pixel
  //    scaleY: 1.0 = 1 pixel = 1 pixel
  //
  //    rotaton: in Radians
  //
  TileMap.prototype.draw = function(options) {
    if (options.tiles) {
      this.textures.u_tiles = options.tiles;
    }

    var scaleX = options.scaleX || 1;
    var scaleY = options.scaleY || 1;

    var dispScaleX = options.width / options.canvasWidth;
    var dispScaleY = options.height / options.canvasHeight;

    var m4 = Fast.matrix4;
    m4.translation(this.originMat,
      [ -options.originX / options.canvasWidth,
        -options.originY / options.canvasHeight,
         0,
      ]);
    m4.scaling(this.scalingMat,
      [ options.canvasWidth  / this.tileset.tileWidth  / scaleX * (dispScaleX),
        options.canvasHeight / this.tileset.tileHeight / scaleY * (dispScaleY),
        1,
      ]);
    m4.translation(this.translationMat, [options.scrollX, options.scrollY, 0]);
    m4.rotationZ(this.rotationMat, options.rotation);
    var mat = this.texMatrix;
    m4.identity(mat);
    m4.mul(mat, mat, this.originMat);
    m4.mul(mat, mat, this.scalingMat);
    m4.mul(mat, mat, this.rotationMat);
    m4.mul(mat, mat, this.translationMat);

    this.matrix[ 0] =  2 * dispScaleX;
    this.matrix[ 5] = -2 * dispScaleY;
    this.matrix[12] = -1 + 2 * options.x / options.canvasWidth;
    this.matrix[13] =  1 - 2 * options.y / options.canvasHeight;

    s_tileModel.drawPrep();
    s_tileModel.draw(this.uniforms, this.textures);
  };

  return TileMap;
});

