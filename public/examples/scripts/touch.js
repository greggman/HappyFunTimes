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
    './input',
    './misc',
  ], function(HandJS, Input, Misc) {

  // Simulates N virtual dpads using touch events
  //
  // For each change in direction callback will be
  // called with an event info where
  //
  // pad = (index of pad)
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

    var pads = [];
    for (var ii = 0; ii < options.pads.length; ++ii) {
      pads.push(makePad(ii));
    }

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

    var getClosestPad = function(e) {
      var closestId = 0;
      var closestDist;
      for (var ii = 0; ii < pads.length; ++ii) {
        var padOptions = options.pads[ii];
        var relPos = Input.getRelativeCoordinates(padOptions.referenceElement, e);
        var distSq = relPos.x * relPos.x + relPos.y * relPos.y;
        if (closestDist == undefined || distSq < closestDist) {
          closestDist = distSq;
          closestId = ii;
        }
      }
      return closestId;
    };

    var onPointerDown = function(e) {
      var padId = getClosestPad(e);
      checkStart(padId, e);
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

  //
  // options:
  //  inputElement: element that receives all input. Should be above all buttons
  //  buttons: Array of object where
  //    element: element that represents area of buttton (need not be visible)
  //    callback: function to call when button is pressed or released
  //
  var setupButtons = function(options) {
    var buttonInfos = [];
    var buttons = options.buttons;
    var inputElement = options.inputElement;

    for (var ii = 0; ii < buttons.length; ++ii) {
      var button = buttons[ii];
      var buttonInfo = {
        pointerIds: {},   // Pointers currently in this button
        numPointerIds: 0, // Number of pointers in this button
      };
      Misc.copyProperties(button, buttonInfo);
      buttonInfos.push(buttonInfo);
    }

    var printButtonInfo = function(buttonInfo) {
      console.log("button: " + buttonInfo.element.id + ", " + buttonInfo.numPointerIds);
    };

    var addPointerId = function(buttonInfo, pointerId) {
      if (!buttonInfo.pointerIds[pointerId]) {
        buttonInfo.pointerIds[pointerId] = true;
        ++buttonInfo.numPointerIds;
        buttonInfo.callback({pressed: true});
      }
    };

    var removePointerId = function(buttonInfo, pointerId) {
      if (buttonInfo.pointerIds[pointerId]) {
        delete buttonInfo.pointerIds[pointerId];
        --buttonInfo.numPointerIds;
        if (buttonInfo.numPointerIds == 0) {
          buttonInfo.callback({pressed: false});
        } else if (buttonInfo.numPointerIds < 0) {
          throw ("numPointerIds went negative: how did I get here!?");
        }
      }
    };

    var handleButtonDown = function(e, buttonInfo) {
      addPointerId(buttonInfo, e.pointerId);
    };

    var handleButtonMove = function(e, buttonInfo) {
      addPointerId(buttonInfo, e.pointerId);
    };

    var handleButtonOut = function(e, buttonInfo) {
      removePointerId(buttonInfo, e.pointerId);
    };

    for (var ii = 0; ii < buttonInfos.length; ++ii) {
      var buttonInfo = buttonInfos[ii];
      var elem = buttonInfo.element;
      elem.addEventListener('pointerdown', function(buttonInfo) {
        return function(e) {
          handleButtonDown(e, buttonInfo);
        }
      }(buttonInfo), false);
      elem.addEventListener('pointermove', function(buttonInfo) {
        return function(e) {
          handleButtonMove(e, buttonInfo);
        }
      }(buttonInfo), false);
      elem.addEventListener('pointerup', function(buttonInfo) {
        return function(e) {
          handleButtonOut(e, buttonInfo);
        }
      }(buttonInfo), false);
      elem.addEventListener('pointerout', function(buttonInfo) {
        return function(e) {
          handleButtonOut(e, buttonInfo);
        }
      }(buttonInfo), false);
    }
  };

  return {
    setupVirtualDPads: setupVirtualDPads,
    setupButtons: setupButtons,
  };
});


