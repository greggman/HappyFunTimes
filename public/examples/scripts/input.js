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

define(['./misc'], function(Misc) {

  var cursorKeys = {
    kLeft: 37,
    kRight: 39,
    kUp: 38,
    kDown: 40,
  };

  // You can use these to make your own options for setupKeyboardDPadKeys
  var kCursorKeys = [37, 39, 38, 40];
  var kASWDKeys = [65, 68, 87, 83];

  // You can pass these into setupKeyboardDPadKeys
  var kASWDPadOnly = {
    pads: [
      { keys: kASWDKeys, },
    ],
  };
  var kCursorPadOnly = {
    pads: [
      { keys: kCursorKeys, },
    ],
  };

  var isNumRE = /^\d+$/;

  // Provides a map from direction to various info.
  //
  // Example:
  //
  //   Input.setupKeyboardDPadsKeys(container, function(event) {
  //     console.log("dir: " + event.info.symbol]);
  //   });
  var RIGHT = 0x1;
  var LEFT = 0x2;
  var UP = 0x4;
  var DOWN = 0x8;

  var dirInfo = { };
  dirInfo[-1] = { direction: -1, dx:  0, dy:  0, bits: 0           , symbol: String.fromCharCode(0x2751), };
  dirInfo[ 0] = { direction:  0, dx:  1, dy:  0, bits: RIGHT       , symbol: String.fromCharCode(0x2192), }; // right
  dirInfo[ 1] = { direction:  1, dx:  1, dy:  1, bits: UP | RIGHT  , symbol: String.fromCharCode(0x2197), }; // up-right
  dirInfo[ 2] = { direction:  2, dx:  0, dy:  1, bits: UP          , symbol: String.fromCharCode(0x2191), }; // up
  dirInfo[ 3] = { direction:  3, dx: -1, dy:  1, bits: UP | LEFT   , symbol: String.fromCharCode(0x2196), }; // up-left
  dirInfo[ 4] = { direction:  4, dx: -1, dy:  0, bits: LEFT        , symbol: String.fromCharCode(0x2190), }; // left
  dirInfo[ 5] = { direction:  5, dx: -1, dy: -1, bits: DOWN | LEFT , symbol: String.fromCharCode(0x2199), }; // down-left
  dirInfo[ 6] = { direction:  6, dx:  0, dy: -1, bits: DOWN        , symbol: String.fromCharCode(0x2193), }; // down
  dirInfo[ 7] = { direction:  7, dx:  1, dy: -1, bits: DOWN | RIGHT, symbol: String.fromCharCode(0x2198), }; // down-right

  var createDirectionEventInfo = function(padId) {
    return {
      pad: padId,
      info: undefined,
    };
  };

  var emitDirectionEvent = function(padId, direction, eventInfo, callback) {
    var info = dirInfo[direction];
    eventInfo.pad = padId;
    eventInfo.info = info;
    callback(eventInfo);
  };

  var getDirectionInfo = function(direction) {
    return dirInfo[direction];
  };

  var getRelativeCoordinates = (function(window, undefined) {
    return function(reference, event) {
      // Use absolute coordinates
      var pos = Misc.getAbsolutePosition(reference);
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

  // Simulates N virtual dpads using keys
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
  var setupKeyboardDPadKeys = function(callback, options) {
    if (!options) {
      options = {
        pads: [
         { keys: kASWDKeys,   }, // LRUD
         { keys: kCursorKeys, }, // LRUD
        ],
      }
    }

    var g_dirBits = [];
    var g_excludeBits = [];
    var g_dir = [];
    var g_eventInfos = [];

    var bitInfos = [
      { bit: 1, exclude: 2, mask: 0x3 }, // left
      { bit: 2, exclude: 1, mask: 0x3 }, // right
      { bit: 4, exclude: 8, mask: 0xC }, // up
      { bit: 8, exclude: 4, mask: 0xC }, // down
    ];

    var keyToBit = { };

    for (var ii = 0; ii < options.pads.length; ++ii) {
      var pad = options.pads[ii];
      g_dirBits.push(0);
      g_excludeBits.push(0);
      g_dir.push(-1);
      g_eventInfos.push(createDirectionEventInfo(ii));
      for (var kk = 0; kk < 4; ++kk) {
        var bitInfo = bitInfos[kk];
        var keyInfo = { pad: ii, };
        Misc.copyProperties(bitInfos[kk], keyInfo);
        keyToBit[pad.keys[kk]] = keyInfo;
      }
    }

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
            emitDirectionEvent(pad, dir, g_eventInfos[pad], callback);
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

  //
  var setupKeys = function(keys) {
    var keyCodes = {};

    // Convert single characters to char codes.
    for (var key in keys) {
      var value = keys[key];
      if (!isNumRE.test(key)) {
        if (key.length != 1) {
          throw "bad key code: '" + key + "'";
        }
        key = key.charCodeAt(0);
      }
      keyCodes[key] = value;
    }

    var handleKey = function(keyCode, state, pressed) {
      var key = keyCodes[keyCode];
      if (key) {
        key({keyCode: keyCode, pressed:pressed});
      }
    };

    var handleKeyDown = function(keyCode, state) {
      handleKey(keyCode, state, true);
    };
    var handleKeyUp = function(keyCode, state) {
      handleKey(keyCode, state, false);
    };

    setupControllerKeys(handleKeyDown, handleKeyUp);
  };

  return {
    cursorKeys: cursorKeys,
    createDirectionEventInfo: createDirectionEventInfo,
    emitDirectionEvent: emitDirectionEvent,
    getDirectionInfo: getDirectionInfo,
    kCursorKeys: kCursorKeys,
    kCursorPadOnly: kCursorPadOnly,
    kASWDKeys: kASWDKeys,
    kASWDPadOnly: kASWDPadOnly,
    getRelativeCoordinates: getRelativeCoordinates,
    setupControllerKeys: setupControllerKeys,
    setupKeyboardDPadKeys: setupKeyboardDPadKeys,
    setupKeys: setupKeys,
  };
});

