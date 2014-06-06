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

  var s_vertexBasedTileVertexShader = [
    "attribute vec4 position;                   ",
    "attribute vec4 texcoord;                   ",
    "                                           ",
    "uniform mat4 u_matrix;                     ",
    "uniform sampler2D u_tilemap;               ",
    "uniform vec2 u_tilemapSize;                ",
    "uniform vec2 u_tilesetSize;                ",
    "uniform mat4 u_texMatrix;                  ",
    "                                           ",
    "varying vec2 v_texcoord;                   ",
    "                                           ",
    "void main() {                              ",
    "  gl_Position = u_matrix * position;       ",
    "                                                                                                     ",
    "   vec2 tilePosition = (u_texMatrix * vec4(texcoord.xy, 0, 1)).xy;                                   ",
    "   vec2 tileLocation = floor(tilePosition);                                                          ",
    "   vec4 tile = texture2D(u_tilemap, fract((tileLocation + vec2(0.5,0.5)) / u_tilemapSize)) * 256.0;  ",
    "   vec2 tileBaseUV = tile.xy / u_tilesetSize;                                                        ",
    "   v_texcoord = tileBaseUV + texcoord.zw / u_tilesetSize;                                            ",
    "}                                          ",
  ].join("\n");

  var s_vertexBasedTileFragmentShader = [
    "precision mediump float;                                                   ",
    "                                                                           ",
    "uniform sampler2D u_tiles;                                                 ",
    "                                                                           ",
    "varying vec2 v_texcoord;                                                   ",
    "                                                                           ",
    "void main() {                                                              ",
    "  vec4 color = texture2D(u_tiles, v_texcoord);                             ",
    "  if (color.a <= 0.1) {                                                    ",
    "    discard;                                                               ",
    "  }                                                                        ",
    "  gl_FragColor = color;                                                    ",
    "}                                                                          ",
  ].join("\n");

  var s_vertexBasedTileProgram;

  var makeTileMesh = function(tilesAcross, tilesDown) {
    var numTiles    = tilesAcross * tilesDown;
    var numVertices = numTiles * 4;
    var numIndices  = numTiles * 6;

    var position = new Primitives.AttribBuffer(2, numVertices);
    var texcoord = new Primitives.AttribBuffer(4, numVertices);
    var indices  = new Primitives.AttribBuffer(3, numIndices, 'Uint16Array');

    var offset = 0;
    for (var yy = 0; yy < tilesDown; ++yy) {
      for (var xx = 0; xx < tilesAcross; ++xx) {
        position.push([xx + 0, yy + 0]);
        position.push([xx + 1, yy + 0]);
        position.push([xx + 0, yy + 1]);
        position.push([xx + 1, yy + 1]);

        texcoord.push([xx, yy, 0, 0]);
        texcoord.push([xx, yy, 1, 0]);
        texcoord.push([xx, yy, 0, 1]);
        texcoord.push([xx, yy, 1, 1]);

        indices.push([offset + 0, offset + 1, offset + 2]);
        indices.push([offset + 2, offset + 1, offset + 3]);

        offset += 4;
      }
    }

    return {
      position: position,
      texcoord: texcoord,
      indices: indices,
    };
  };

  var setTileMesh = function(model, tilesAcross, tilesDown) {
    var arrays = makeTileMesh(tilesAcross, tilesDown);
    for (var name in arrays) {
      model.setBuffer(name, arrays[name]);
    }
  };

  var createVertexBasedTileModel = function(textures) {
    if (!s_vertexBasedTileProgram) {
      s_vertexBasedTileProgram = new Programs.Program(s_vertexBasedTileVertexShader, s_vertexBasedTileFragmentShader);
    }

    var arrays = makeTileMesh(1, 1);

    return new Models.Model(s_vertexBasedTileProgram, arrays, textures);
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

    this.vertexModel = createVertexBasedTileModel(this.textures);
    this.vertexMeshTilesAcross = 1;
    this.vertexMeshTilesDown   = 1;
    this.tileset = options.tileset;

    this.tilemapSize = [options.mapTilesAcross, options.mapTilesDown];
    this.tilesetSize = [options.tileset.tilesAcross, options.tileset.tilesDown];
    this.mapOffset = [0, 0];
    this.matrix = new Float32Array([
      1,0,0,0,
      0,1,0,0,
      0,0,1,0,
      0,0,0,1,
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

    // TODO: Add in rotation, etc.
    // Figure out how to get the tiles to stop bleeding into each other.
    // Maybe load them into a canvas and expand them (pad) by 1 pixel each?
    var scaleX = options.scaleX || 1;
    var scaleY = options.scaleY || 1;

    var dispScaleX = options.width / options.canvasWidth;
    var dispScaleY = options.height / options.canvasHeight;

    var tilesAcrossMesh = this.tilemapSize[0];
    var tilesDownMesh   = this.tilemapSize[1];

    if (this.vertexMeshTilesAcross < tilesAcrossMesh ||
        this.vertexMeshTilesDown   < tilesDownMesh) {
      setTileMesh(this.vertexModel, tilesAcrossMesh, tilesDownMesh);
      this.vertexMeshTilesAcross = tilesAcrossMesh;
      this.vertexMeshTilesDown   = tilesDownMesh;
    }

    this.matrix[0] =  2 / tilesAcrossMesh * dispScaleX;
    this.matrix[5] = -2 / tilesDownMesh   * dispScaleY;
    this.matrix[12] = -1 + 2 * options.x / options.canvasWidth;
    this.matrix[13] =  1 - 2 * options.y / options.canvasHeight;

    this.vertexModel.drawPrep();
    this.vertexModel.draw(this.uniforms, this.textures);

  };

  return TileMap;
});

