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
  [ './hand-1.3.7',
  ], function(HandJS) {
  // Simulates 2 virtual dpads using touch events
  // Assumes left half of container is left dpad
  // and right half is right.
  //
  // For each change in direction callback will be
  // called with pad id (0 left, 1 right) and direction
  // where
  //
  //    2     -1 = no touch
  //  3 | 1
  //   \|/
  // 4--+--0
  //   /|\
  //  5 | 7
  //    6
  //
  // Note: this matches trig functions you can do this
  //
  //     var angle = dir * Math.PI / 4;
  //     var dx    = Math.cos(angle);
  //     var dy    = Math.sin(angle);
  //
  // for +y up (ie, normal for 3d)
  //
  // In 2d you'd probably want
  //
  //     var angle =  dir * Math.PI / 4;
  //     var dx    =  Math.cos(angle);
  //     var dy    = -Math.sin(angle);
  //
  var setupVirtualDPads = function(container, callback) {
    //var ctx = $("c").getContext("2d");
    //ctx.canvas.width = ctx.canvas.clientWidth;
    //ctx.canvas.height = ctx.canvas.clientHeight;

    var Vector2 = function(x, y) {
      this.reset(x, y);
    };

    Vector2.prototype.reset = function(x, y) {
      this.x = x;
      this.y = y;
      return this;
    };

    Vector2.prototype.copyFrom = function(src) {
      this.x = src.x;
      this.y = src.y;
    };

    Vector2.prototype.minusEq = function(v) {
      this.x -= v.x;
      this.y -= v.y;
      return this;
    };

    var makePad = function() {
      return {
        pointerId: -1,                      // touch id
        pointerPos: new Vector2(0, 0),      // current position
        pointerStartPos: new Vector2(0, 0), // position when first touched
        vector: new Vector2(0, 0),          // vector from start to current position
        dir: -1,                            // octant
        lastDir: 0,                         // previous octant
      };
    };

    var pads = [
      makePad(),
      makePad(),
    ];

    var computeDir = function(x, y) {
      var angle = Math.atan2(-y, x) + Math.PI * 2 + Math.PI / 8;
      return (Math.floor(angle / (Math.PI / 4))) % 8;
    };

    var updatePad = function(pad, padId) {
      var newDir = -1;
      if (pad.pointerId >= 0) {
        newDir = computeDir(pad.vector.x, pad.vector.y);
        pad.lastDir = newDir;
      }
      if (pad.dir != newDir) {
        pad.dir = newDir;
        callback(padId, newDir);
      }
    };

    var checkStart = function(padId, e) {
      var pad = pads[padId];
      if (pad.pointerId < 0) {
        pad.pointerId = e.pointerId;
        pad.pointerStartPos.reset(e.clientX, e.clientY);
        pad.pointerPos.copyFrom(pad.pointerStartPos);
        pad.vector.reset(0, 0);
        // This needs work!

        // The problem is this code assumes
        // the place the user touches is the
        // center of the joypad
        //
        // The problem with that design is
        // if the user lifts his finger
        // and places it back down again
        // he assume's he'll get the same
        // result but with this code
        // he won't because the new touch
        // becomes the new center.


        pad.dir = pad.lastDir;
        callback(padId, pad.lastDir);
      }
    };

    var onPointerDown = function(e) {
      checkStart(e.clientX < e.target.clientWidth / 2 ? 0 : 1, e);
    };

    var onPointerMove = function(e) {
      for (var ii = 0; ii < pads.length; ++ii) {
        var pad = pads[ii];
        if (pad.pointerId == e.pointerId) {
          pad.pointerPos.reset(e.clientX, e.clientY);
          pad.vector.copyFrom(pad.pointerPos);
          pad.vector.minusEq(pad.pointerStartPos);
          updatePad(pad, ii);

          //ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
          //ctx.beginPath();
          //ctx.moveTo(pad.pointerStartPos.x, pad.pointerStartPos.y);
          //ctx.lineTo(pad.pointerPos.x, pad.pointerPos.y);
          //ctx.stroke();
        }
      }
    };

    var onPointerUp = function(e) {
      for (var ii = 0; ii < pads.length; ++ii) {
        var pad = pads[ii];
        if (pad.pointerId == e.pointerId) {
          pad.pointerId = -1;
          pad.vector.reset(0, 0);
          updatePad(pad, ii);
        }
      }
    };

    container.addEventListener('pointerdown', onPointerDown, false);
    container.addEventListener('pointermove', onPointerMove, false);
    container.addEventListener('pointerup', onPointerUp, false);
    container.addEventListener('pointerout', onPointerUp, false);
  };

  // Provides a map from direction to unicode arrows.
  //
  // Example:
  //
  //   Touch,setupVirtualDPads(container, function(padId, dir) {
  //     console.log("dir: " + Touch.dirSymbols[dir]);
  //   });
  var dirSymbols = { };
  dirSymbols[-1] = String.fromCharCode(0x2751);
  dirSymbols[ 0] = String.fromCharCode(0x2192); // right
  dirSymbols[ 1] = String.fromCharCode(0x2197); // up-right
  dirSymbols[ 2] = String.fromCharCode(0x2191); // up
  dirSymbols[ 3] = String.fromCharCode(0x2196); // up-left
  dirSymbols[ 4] = String.fromCharCode(0x2190); // left
  dirSymbols[ 5] = String.fromCharCode(0x2199); // down-left
  dirSymbols[ 6] = String.fromCharCode(0x2193); // down
  dirSymbols[ 7] = String.fromCharCode(0x2198); // down-right

  return {
    dirSymbols: dirSymbols,
    setupVirtualDPads: setupVirtualDPads,
  };
}());


