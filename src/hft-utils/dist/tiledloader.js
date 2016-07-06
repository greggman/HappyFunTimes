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
  'hft/misc/strings',
  './io',
  './tiled',
], function(
  Strings,
  IO,
  Tiled) {

  // 0x80000000 xflip
  // 0x40000000 yflip

  // 0x20000000 swap x,y?

  // 0xA0000000 rot right 90
  // 0xC0000000 rot right 180
  // 0x60000000 rot right 270


  var loadMap = function(url, callback) {
console.log(url);
    if (Strings.endsWith(url, ".json")) {
      var onLoad = function(err, map) {
        if (err) {
          callback(err);
        } else {
          callback(null, map);
        }
      };

      var options = {
        method: "GET",
      };
      IO.sendJSON(url, {}, onLoad, options);
    } else if (Strings.endsWith(url, ".tmx")) {
      var onLoad = function(err, str) {
        if (err) {
          callback(err);
        } else {
          try {
            var map = Tiled.parseMap(str);
          } catch (e) {
            console.log(e);
            callback(e);
            return;
          }
          callback(null, map);
        }
      };
      IO.get(url, "", onLoad, {
        inMimeType: "text/xml",
      });
    } else {
      throw ("unknown format: " + url);
    }
  };

  return {
    loadMap: loadMap,
  };
});


