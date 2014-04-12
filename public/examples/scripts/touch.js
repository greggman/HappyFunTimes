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
    './input'
  ], function(HandJS, Input) {

  // Simulates 2 virtual dpads using touch events
  // Assumes left half of container is left dpad
  // and right half is right.
  //
  // For each change in direction callback will be
  // called with an event info where
  //
  // pad = (0 left, 1 right)
  // direction =
  //
  //
  //    2     -1 = no touch
  //  3 | 1
  //   \|/
  // 4--+--0
  //   /|\
  //  5 | 7
  //    6
  //
  // dx   = -1, 0, 1
  // dy   = -1, 0, 1
  // bits = 1 for right, 2 for left, 4 for up, 8 for down
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

  // options:
  //
  // inputElement: element used to capture input (for example window, body,)
  // callback: callback to pass event
  // fixedCenter: true = center stays the same place, false = each time finger touches a new center is picked
  // deadSpaceRadius: size of dead area in center of pad.
  // pads: Array
  //   referenceElement: element that is reference for position of pad
  //   offsetX: offset from left of reference element to center of pad
  //   offsetY: offset from top of reference element to center of pad

  var setupVirtualDPads = function(options) {
    var callback = options.callback;
    var container = options.inputElement;
    options.deadSpaceRadius = options.deadSpaceRadius || 10;
    var deadSpaceRadiusSq = options.deadSpaceRadius * options.deadSpaceRadius;

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

    var makePad = function(padId) {
      return {
        pointerId: -1,                      // touch id
        pointerPos: new Vector2(0, 0),      // current position
        pointerStartPos: new Vector2(0, 0), // position when first touched
        vector: new Vector2(0, 0),          // vector from start to current position
        dir: -1,                            // octant
        lastDir: 0,                         // previous octant
        event: Input.createDirectionEventInfo(padId),
      };
    };

    var pads = [
      makePad(0),
      makePad(1),
    ];

    var computeDir = function(x, y) {
      var angle = Math.atan2(-y, x) + Math.PI * 2 + Math.PI / 8;
      return (Math.floor(angle / (Math.PI / 4))) % 8;
    };

    var callCallback = function(padId, dir) {
      var pad = pads[padId];
      Input.emitDirectionEvent(padId, dir, pad.event, callback);
    };

    var updatePad = function(pad, padId) {
      var newDir = -1;
      if (pad.pointerId >= 0) {
        var distSq = pad.vector.x * pad.vector.x + pad.vector.y * pad.vector.y;
        if (distSq > deadSpaceRadiusSq) {
          newDir = computeDir(pad.vector.x, pad.vector.y);
          pad.lastDir = newDir;
        }
      }
      if (pad.dir != newDir) {
        pad.dir = newDir;
        callCallback(padId, newDir);
      }
    };

    var checkStart = function(padId, e) {
      var pad = pads[padId];
      if (pad.pointerId < 0) {
        var padOptions = options.pads[padId];
        pad.pointerId = e.pointerId;
        var relPos = Input.getRelativeCoordinates(padOptions.referenceElement, e);
        var x = relPos.x - padOptions.offsetX;
        var y = relPos.y - padOptions.offsetY;
        if (options.fixedCenter) {
          pad.pointerStartPos.reset(0, 0);
          pad.pointerPos.reset(x, y);
          pad.vector.reset(x, y);
          updatePad(pad, padId);
        } else {
          pad.pointerStartPos.reset(x, y);
          pad.pointerPos.copyFrom(pad.pointerStartPos);
          pad.vector.reset(0, 0);
          pad.dir = pad.lastDir;
          callCallback(padId, pad.lastDir);
        }
      }
    };

    var onPointerDown = function(e) {
      var relPos = Input.getRelativeCoordinates(options.inputElement, e);
      checkStart(relPos.x < options.inputElement.clientWidth / 2 ? 0 : 1, e);
    };

    var onPointerMove = function(e) {
      for (var ii = 0; ii < pads.length; ++ii) {
        var pad = pads[ii];
        if (pad.pointerId == e.pointerId) {
          var padOptions = options.pads[ii];
          var relPos = Input.getRelativeCoordinates(padOptions.referenceElement, e);
          var x = relPos.x - padOptions.offsetX;
          var y = relPos.y - padOptions.offsetY;
          pad.pointerPos.reset(x, y);
          pad.vector.copyFrom(pad.pointerPos);
          pad.vector.minusEq(pad.pointerStartPos);
          updatePad(pad, ii);
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

  return {
    setupVirtualDPads: setupVirtualDPads,
  };
});


