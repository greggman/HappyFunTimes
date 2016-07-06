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
    'hft/misc/cssparse',
    'hft/misc/strings',
    '../../tdl/tdl/textures',
    './imageloader',
    './tiledloader',
    './uri',
  ], function(
    CSSParse,
    Strings,
    Textures,
    ImageLoader,
    TiledLoader,
    Uri) {

  // note sure where to put these.
  // They must end in "-real.png" for now.

  var createTexture = function(img) {
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    var tex = Textures.loadTexture(img);
    tex.setParameter(gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    tex.setParameter(gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    tex.setParameter(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    tex.setParameter(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  };


  var makeLevel = function(gl, map, callback) {
    // convert level to what we need
    // First get tileset. Let's assume just 1
    map.tilesets.sort(function(a, b) {
      return a.firstgid == b.firstgid ? 0 : (a.firstgid < b.firstgid ? -1 : 1);
    });

    // count tiles.
    var ts0 = map.tilesets[0];
    var numTiles = 0;
    map.tilesets.forEach(function(ts) {
      var tilesAcross = ts.image.width  / ts.tilewidth;
      var tilesDown   = ts.image.height / ts.tileheight;
      if (ts.tilewidth != ts0.tilewidth || ts.tileheight != ts0.tileheight) {
        throw("all tilesets must use the same size tiles");
      }
      numTiles += tilesAcross * tilesDown;
    });

    // make a new tileset
    var superAcross = Math.floor(1024 / ts0.tilewidth);
    var superDown   = Math.floor((numTiles + numTiles - 1) / superAcross);
    var superWidth  = superAcross * ts0.tilewidth;
    var superHeight = superDown   * ts0.tileheight;

    var loadCount = 0;
    var canvas = document.createElement("canvas");
    canvas.width  = superWidth;
    canvas.height = superHeight;
    var ctx = canvas.getContext("2d");
//canvas.style.backgroundColor = "#444";
//canvas.style.width = superWidth + "px";
//canvas.style.height = superHeight + "px";
//canvas.style.display = "block";
//canvas.style.position = "absolute";
//canvas.style.top = "0px";
//canvas.style.zIndex = "100";
//canvas.style.border = "5px solid red";
//document.body.appendChild(canvas);

    var drawImage = function(img, sx, sy, sw, sh, dx, dy, dw, dh) {
      var args = Array.prototype.slice.apply(arguments);
//      console.log(args.join(", "));
      ctx.drawImage.apply(ctx, arguments);
    }

    var dstX = 1; // skip first tile so it's the empty tile
    var dstY = 0;
    map.tilesets.forEach(function(ts) {
      var srcX = 0;
      var srcY = 0;
      var tilesAcross = ts.image.width  / ts.tilewidth  | 0;
      var tilesDown   = ts.image.height / ts.tileheight | 0;
      var numTiles    = tilesAcross * tilesDown;
      while (srcY < tilesDown) {
        var dstSize = superAcross - dstX;
        var srcSize = tilesAcross - srcX;
        var takeSize = Math.min(dstSize, srcSize);
        drawImage(
          ts.image,
          srcX * ts.tilewidth, srcY * ts.tileheight, takeSize * ts.tilewidth, ts.tileheight,
          dstX * ts.tilewidth, dstY * ts.tileheight, takeSize * ts.tilewidth, ts.tileheight);
        srcX += takeSize;
        dstX += takeSize;
        if (srcX == tilesAcross) {
          srcX = 0;
          ++srcY;
        }
        if (dstX == superAcross) {
          dstX = 0;
          ++dstY;
        }
      }

      ++loadCount;
      var meaningUrl = (ts.image.src.substring(0, ts.image.src.length - 4) + "-meaning.json").replace("-real", "");
      TiledLoader.loadMap(meaningUrl, function(err, meaningMap) {
        --loadCount;
        if (err) {
          console.warn(err);
        }
        ts.meaningMap = meaningMap;
        if (loadCount == 0) {
          makeMapPhase2()
        }
      });
    });

    var makeMapPhase2 = function() {
      console.log("setup tileset");
      var tileset = {
        tileWidth: ts0.tilewidth,
        tileHeight: ts0.tileheight,
        tilesAcross: superAcross,
        tilesDown: superDown,
        texture: createTexture(canvas),
      };

      var meaningTable = [];

      map.tilesets.forEach(function(ts) {
        var meaningTS;
        var visualTS;
        var meaningMap = ts.meaningMap;
        if (meaningMap) {
          meaningMap.tilesets.forEach(function(mts) {
            if (Strings.endsWith(mts.image, "meaning-icons.png")) {
              meaningTS = mts;
            } else {
              visualTS = mts;
            }
          });

          var layer = meaningMap.layers[0];
          for (var y = 0; y < layer.height - 1; y += 2) {
            for (var x = 0; x < layer.width; ++x) {
              var tileId    = layer.data[(y + 0) * layer.width + x];
              var meaningId = layer.data[(y + 1) * layer.width + x];
              if (tileId && meaningId) {
                var id      = tileId    - visualTS.firstgid + ts.firstgid;
                var xid     = id % superAcross;
                var yid     = id / superAcross | 0;
                var tile    = xid + yid * 256;
                var meaning = meaningId - meaningTS.firstgid;
  //  console.log("" + x + ", " + y + ": tileId: " + tileId + ", meaningId: " + meaningId + ", id: " + id + ", tile: " + tile + ", meaning: " + meaning);
                if (meaningTable[tile] == undefined) {
                  meaningTable[tile] = meaning;
                } else if (meaningTable[tile] != meaning) {
                  console.error("tile " + tile + " assigned more than one meaning, A = " + meaningTable[tile] + ", B = " + meaning);
                }
              }
            }
          }
        }
      });

      // Fill out missing meanings. All will be meaning 0.
      var numTiles = superDown * 256;
      for (var ii = 0; ii < numTiles; ++ii) {
        if (!meaningTable[ii]) {
          meaningTable[ii] = 0;
        }
      }

      var layers = map.layers.map(function(l) {
        // Tiled is 1 based (0 = no tile). We're 0 based so subtract 1.
        var data = new Uint32Array(l.data.length);
        for (var ii = 0; ii < l.data.length; ++ii) {
          var tile = Math.max(0, l.data[ii]);
          var id  = tile & 0xFFFFFF;
          var xid = id % superAcross;
          var yid = id / superAcross | 0;
          data[ii] = xid + yid * 256 + (tile & 0xFF000000);
        }
        return {
          tileset: tileset,
          width: l.width,
          height: l.height,
          tiles: data,
          meaningTable: meaningTable,
          name: l.name,
        };
      });

      callback(null, {
        layers: layers,
        tileset: tileset,
        meaningTable: meaningTable,
        backgroundColor: CSSParse.parseCSSColor(map.backgroundcolor || "#808080", true),
      });
    };
  };


  var load = function(gl, url, options, callback) {
    TiledLoader.loadMap(url, function(err, map) {
      if (err) {
        console.error(err);
        return;
      }

//console.log(JSON.stringify(map, undefined, "  "));

      var images = {};
      var imageMappings = options.imageMappings || {};
      var baseUrl = Uri.dirname(url);
      map.tilesets.forEach(function(ts) {
        var imgUrl = Uri.join(baseUrl, ts.image);
        imgUrl = imageMappings[imgUrl] || imgUrl;
        images[ts.image] = { url: imgUrl };
      });

      ImageLoader.loadImages(images, function() {
        map.tilesets.forEach(function(ts) {
          ts.image = images[ts.image].img;
        });

        makeLevel(gl, map, callback);
      });
    });
  };

  return {
    load: load,
  };
});


