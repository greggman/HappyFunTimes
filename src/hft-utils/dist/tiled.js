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
    '../../pako/dist/pako_inflate.min',
  ], function(pako) {

  var base64ToTypedArray = function(
     d, // base64 data (in IE7 or older, use .split('') to get this working
     b, // replacement map ("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/")
     h, // typed array subarray method (.subarray || .subset || .slice)
     g,  // result buffer
     c, // character and - ascii value buffer
     u, // bit storage
     r, // result byte counter
     q, // bit counter
     x  // char counter
  ){
  // buffer and character map, not assuming well-formed input.
     g=new Uint8Array(d.length);
     h=g.subarray||g.subset||g.slice;
     b="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
     for (
        // initialize result and counters
        r = 0, q = x = '';
        // get next character
        c = d[x++];
        // character found in table? initialize bit storage and add its ascii value;
        ~c && (u = q%4 ? u*64+c : c,
            // and if not first of each 4 characters, convert the first 8bits to one ascii character
            q++ % 4) ? r += String.fromCharCode(255&u>>(-2*q&6)) : 0
     )
        // try to find character in table (0-63, not found => -1)
        c = b.indexOf(c);
     // return result
     return r;
  };

  var parseStr = function(v) { return v; };
  var applyAttributes = function(typeMap, node, dest) {
    dest = dest || {};
    for (var ii = 0; ii < node.attributes.length; ++ii) {
      var attr = node.attributes[ii];
      var parseFn = typeMap[attr.name] ? typeMap[attr.name] : parseStr;
      dest[attr.name] = parseFn(attr.value);
    }
    return dest;
  };

  var parseChildren = function(node, handlers) {
    for (var ii = 0; ii < node.childNodes.length; ++ii) {
      var child = node.childNodes[ii];
      var handler = handlers[child.nodeName];
      if (!handler) {
        console.warn("unknown nodeName: " + child.nodeName);
      } else {
        handler(child);
      }
    }
  };

  var noop = function() { };

  var layerTypeMap = {
    width: parseInt,
    height: parseInt,
  };
  var tileTypeMap = {
    gid: parseInt,
  };
  var parseLayer = function(node) {
    var layer = applyAttributes(layerTypeMap, node);
    parseChildren(node, {
      data: function(node) {
        if (layer.data) {
          throw("more than one <data> element in layer");
        }
        var attrs = applyAttributes({}, node);
        if (attrs.encoding == "csv") {
          var data = node.childNodes[0].nodeValue.split(",").map(function(str) {
            return parseInt(str.trim());
          });
          data = new Uint32Array(data);
        } else if (attrs.encoding == "base64") {
           var mapDataStr = atob(node.childNodes[0].nodeValue.trim());
           var mapData = new Uint8Array(mapDataStr.length);
           for (var ii = 0; ii < mapDataStr.length; ++ii) {
             mapData[ii] = mapDataStr.charCodeAt(ii);
           }
           if (attrs.compression == "zlib") {
             var binData = pako.inflate(mapData);
             var data = new Uint32Array(binData.buffer);
           } else {
             throw ("unknown compression format");
           }
        } else if (attrs.encoding === undefined) {
          var data = [];
          for (var ii = 0; ii < node.childNodes.length; ++ii) {
            var child = node.childNodes[ii];
            if (child.nodeName == "tile") {
              data.push(applyAttributes(tileTypeMap, child).gid);
            }
          }
          data = new Uint32Array(data);
        } else {
          throw ("unsupported format: " + attrs.encoding);
        }
        layer.data = data;
      },
      "#text": noop,
    });
    return layer;
  };

  var tilesetTypeMap = {
    firstgid: parseInt,
    tilewidth: parseInt,
    tileheight: parseInt,
    margin: parseInt,
    spacing: parseInt,
  };
  var imageTypeMap = {
    width: parseInt,
    height: parseInt,
  };
  var parseTileset = function(node) {
    var tilemap = applyAttributes(tilesetTypeMap, node);
    parseChildren(node, {
      image: function(node) {
        if (tilemap.image) {
          throw("more than one <image> element in tilemap");
        }
        var image = applyAttributes(imageTypeMap, node);
        tilemap.image = image.source;
        tilemap.imagewidth = image.width;
        tilemap.imageheight = image.height;
      },
      "#text": noop,
    });
    return tilemap;
  };

  var parsePoints = function(str) {
    var points = [];
    str.split(" ").forEach(function(point) {
      var coords = point.split(",");
      points.push(parseFloat(coords[0], parseFloat(coords[1])));
    });
    return points;
  };

  var objectTypeMap = {
    x: parseFloat,
    y: parseFloat,
    width: parseFloat,
    height: parseFloat,
    rotation: parseFloat,
    gid: parseInt,
  };
  var polygonTypeMap = {
    points: parsePoints,
  };
  var polylineTypeMap = {
    points: parsePoints,
  };
  var parseObject = function(node) {
    var ob = applyAttributes(objectTypeMap, node);
    parseChildren(node, {
      ellipse: function(node) {
        ob.type = "ellipse";
      },
      polygon: function(node) {
        ob.type = "polygon";
        applyAttributes(polygonTypeMap, node, ob);
      },
      polyline: function(node) {
        ob.type = "polyline";
        applyAttributes(polyLineTypeMap, node, ob);
      },
      "#text": noop,
    });
    if (!ob.type) {
      if (ob.gid) {
        ob.type = "tile";
      } else if (ob.width && ob.height) {
        ob.type = "rectangle";
      }
    }
    return ob;
  }

  var objectGroupTypeMap = {
  };
  var parseObjectGroup = function(node) {
    var og = {
      objects: [],
    };
    applyAttributes(objectGroupTypeMap, node, og);
    parseChildren(node, {
      object: function(node) {
        og.objects.push(parseObject(node));
      },
      "#text": noop,
    });
    return og;
  };

  var mapTypeMap = {
    width: parseInt,
    height: parseInt,
    tilewidth: parseInt,
    tileheight: parseInt,
  };

  var parseMap = function(str) {
    var map = {
      tilesets: [],
      layers: [],
      objectGroups: [],
      order: [],
    };

    var xml = (new window.DOMParser()).parseFromString(str, "text/xml");
    var mapNode = xml.childNodes[0];
    applyAttributes(mapTypeMap, mapNode, map);
    parseChildren(mapNode, {
      tileset: function(node) {
        map.tilesets.push(parseTileset(node));
      },
      layer: function(node) {
        var layer = parseLayer(node);
        map.layers.push(layer);
        map.order.push(layer);
      },
      objectgroup: function(node) {
        var objectGroup = parseObjectGroup(node);
        map.objectGroups.push(objectGroup);
        map.order.push(objectGroup);
      },
      "#text": noop,
    });

    return map;
  };

  return {
    parseMap: parseMap,
  }
});


