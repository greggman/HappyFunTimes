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

define(function() {
  var getRelativeCoordinates = (function(window, undefined) {
    /**
     * Returns the absolute position of an element for certain browsers.
     * @param {HTML Element} element The element to get a position for.
     * @return {Object} An object containing x and y as the absolute position
     *   of the given element.
     */
    var getAbsolutePosition = function(element) {
      var r = { x: element.offsetLeft, y: element.offsetTop };
      if (element.offsetParent) {
        var tmp = getAbsolutePosition(element.offsetParent);
        r.x += tmp.x;
        r.y += tmp.y;
      }
      return r;
    };

    return function(reference, event) {
      // Use absolute coordinates
      var pos = getAbsolutePosition(reference);
      var x = event.pageX - pos.x;
      var y = event.pageY - pos.y;
      return { x: x, y: y };
    };
  }());

  var setupControllerKeys = function(keyDownFn, keyUpFn) {
    var g_keyState = {};
    var g_oldKeyState = {};

    var updateKey = function(keyCode, state) {
      g_keyState[keyCode] = state;
      if (g_oldKeyState != g_keyState) {
        g_oldKeyState = state;
        if (state) {
          keyDownFn(keyCode);
        } else {
          keyUpFn(keyCode);
        }
      }
    };

    var keyUp = function(event) {
      updateKey(event.keyCode, false);
    };

    var keyDown = function(event) {
      updateKey(event.keyCode, true);
    };

    window.addEventListener("keyup", keyUp, false);
    window.addEventListener("keydown", keyDown, false);
  };

  // Simulates 2 virtual dpads using keys
  // asdw for pad 0, arrow keys for pad 1
  //
  // For each change in direction callback will be
  // called with pad id (0 left, 1 right) and direction
  // where
  //
  //    2     -1 = not pressed
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
  var setupKeyboardDPadKeys = function(callback) {
    var g_dirBits = [0, 0];
    var g_excludeBits = [0, 0];
    var g_dir = [-1, -1];

    var keyToBit = { };
    keyToBit[37] = { bit: 1, pad: 1, exclude: 2, mask: 0x3 }; // left (cursor left)
    keyToBit[39] = { bit: 2, pad: 1, exclude: 1, mask: 0x3 }; // right (cursor right)
    keyToBit[38] = { bit: 4, pad: 1, exclude: 8, mask: 0xC }; // up (cursor up)
    keyToBit[40] = { bit: 8, pad: 1, exclude: 4, mask: 0xC }; // down (cursor down)
    keyToBit[65] = { bit: 1, pad: 0, exclude: 2, mask: 0x3 }; // left 'a'
    keyToBit[68] = { bit: 2, pad: 0, exclude: 1, mask: 0x3 }; // right 'd'
    keyToBit[87] = { bit: 4, pad: 0, exclude: 8, mask: 0xC }; // up 'w'
    keyToBit[83] = { bit: 8, pad: 0, exclude: 4, mask: 0xC }; // down 's'

    var bitsToDir = [
      -1, // 0
       4, // 1      l
       0, // 2     r
      -1, // 3     rl
       2, // 4    u
       3, // 5    u l
       1, // 6    ur
      -1, // 7    url
       6, // 8   d
       5, // 9   d  l
       7, // 10  d r
      -1, // 11  d rl
      -1, // 12  du
      -1, // 13  du l
      -1, // 14  dur
      -1, // 15  durl
    ];

    var setBit = function(keyCode, value) {
      // get info for this key
      var info = keyToBit[keyCode];
      if (info) {
        // or in or and out bit for button
        var pad = info.pad;
        var bit = info.bit;
        var bits = g_dirBits[pad];
        if (value) {
          bits |= bit;
          g_excludeBits[pad] = (g_excludeBits[pad] & ~info.mask) | info.exclude;
        } else {
          bits &= ~bit;
          g_excludeBits[pad] &= ~info.mask;
        }
        // If they've changed
        if (bits != g_dirBits[pad]) {
          g_dirBits[pad] = bits;
          var dir = bitsToDir[bits & ~g_excludeBits[pad]];
          // If the dir has changed.
          if (dir != g_dir[pad]) {
            g_dir[pad] = dir;
            callback(pad, dir);
          }
        }
      }
    };

    var keyUp = function(keyCode) {
      setBit(keyCode, 0);
    };

    var keyDown = function(keyCode) {
      setBit(keyCode, 1);
    };

    setupControllerKeys(keyDown, keyUp);
  };

  return {
    getRelativeCoordinates: getRelativeCoordinates,
    setupControllerKeys: setupControllerKeys,
    setupKeyboardDPadKeys: setupKeyboardDPadKeys,
  };
}());

