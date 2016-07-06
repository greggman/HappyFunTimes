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

/**
 * Various functions for touch input.
 *
 * @module Touch
 */
define(
  [ '../../../3rdparty/pep.min',
    './input',
    './misc',
  ], function(pep, Input, Misc) {

  /**
   * @typedef {Object} PadInfo
   * @property {HTMLElement} referenceElement element that is reference for position of pad
   * @property {number} offsetX offset from left of reference element to center of pad
   * @property {number} offsetY offset from top of reference element to center of pad
   * @memberOf module:Touch
   */

  /**
   * @typedef {Object} TouchDPad~Options
   * @property {HTMLElement} inputElement element used to capture input (for example window, body,)
   * @property {callback} callback callback to pass event
   * @property {boolean?} fixedCenter true = center stays the same place, false = each time finger touches a new center is picked
   * @property {number?} deadSpaceRadius size of dead area in center of pad.
   * @property {number?} axisSize use axis.
   * @property {module:Touch~PadInfo[]} pads array of PadInfos, one for each DPad
   * @memberOf module:Touch
   */

  /**
   * Simulates N virtual dpads using touch events
   *
   * For each change in direction callback will be
   * called with an event info where
   *
   *     pad = (index of pad)
   *     direction =
   *
   *
   *        2     -1 = no touch
   *      3 | 1
   *       \|/
   *     4--+--0
   *       /|\
   *      5 | 7
   *        6
   *
   *     dx   = -1, 0, 1
   *     dy   = -1, 0, 1
   *     bits = 1 for right, 2 for left, 4 for up, 8 for down
   *
   * Note: this matches trig functions so you can do this
   *
   *     if (dir >= 0) {
   *       var angle = dir * Math.PI / 4;
   *       var dx    = Math.cos(angle);
   *       var dy    = Math.sin(angle);
   *     }
   *
   * for +y up (ie, normal for 3d)
   *
   * In 2d you'd probably want to flip dy
   *
   *     if (dir >= 0) {
   *       var angle =  dir * Math.PI / 4;
   *       var dx    =  Math.cos(angle);
   *       var dy    = -Math.sin(angle);
   *     }
   *
   * The default way of figuring out the direction is to take the angle from the center to
   * the place of touch, compute an angle, divide a circle into octants, which ever octant is the direction
   *
   * If axisSize is passed in then instead the space is divided into 3x3 boxes. Which ever box the finger is
   * in is the direction. axisSize determines the width height of the axis boxes
   *
   *          | ax |
   *          | is |
   *     -----+----+-----
   *          |    | axis
   *     -----+----+-----
   *          |    |
   *          |    |
   *
   * if `divisions: 4` is passed in then instead of getting 8 directions decided
   * by octant you get 4 decided by quadrant as in
   *
   *            2
   *         \  |  /
   *          \ | /
   *     4 <---   ---> 0
   *          / | \
   *         /  V  \
   *            6
   *
   * @param {module:Touch.TouchDPad~Options} options
   * @memberOf module:Touch
   */

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

    var computeDirByAngle = function(x, y) {
      var angle = Math.atan2(-y, x) + Math.PI * 2 + Math.PI / 8;
      return (Math.floor(angle / (Math.PI / 4))) % 8;
    };

    var computeDirByAngle4 = function(x, y) {
      if (Math.abs(x) < Math.abs(y)) {
        return y < 0 ? 2 : 6;
      } else {
        return x < 0 ? 4 : 0;
      }
    };

    //      |   |
    //      | V |x
    // -----+---+-----
    //  H   |HV |x H
    // -----+---+-----
    //  y   | Vy|xy
    //      |   |

    var axisBitsToDir = [
       3, // 0
       4, // 1   h
       2, // 2    v
      -1, // 3   hv
       1, // 4     x
       0, // 5   h x
       2, // 6    vx
      -1, // 7   hvx
       5, // 8      y
       4, // 9   h  y
       6, // 10   v y
      -1, // 11  hv y
       7, // 12    xy
       0, // 13  h xy
       6, // 14   vxy
      -1, // 15  hvxy
    ];

    var computeDirByAxis = function(x, y) {
      var h = (Math.abs(y) < options.axisSize / 2) ? 1 : 0;
      var v = (Math.abs(x) < options.axisSize / 2) ? 2 : 0;
      var bits = h | v |
          (x > 0 ? 4 : 0) |
          (y > 0 ? 8 : 0);
      return axisBitsToDir[bits];
    };

    var computeDir = options.axisSize ? computeDirByAxis : computeDirByAngle;

    if (options.divisions === 4) {
      computeDir = computeDirByAngle4;
    }

    var callCallback = function(padId, dir) {
      var pad = pads[padId];
      Input.emitDirectionEvent(padId, dir, pad.event, callback);
    };

    var updatePad = function(pad, padId, out) {
      var newDir = -1;
      if (!out && pad.pointerId >= 0) {
        var distSq = pad.vector.x * pad.vector.x + pad.vector.y * pad.vector.y;
        if (distSq > deadSpaceRadiusSq) {
          newDir = computeDir(pad.vector.x, pad.vector.y);
          pad.lastDir = newDir;
        }
      }
      if (pad.dir !== newDir) {
        pad.dir = newDir;
        callCallback(padId, newDir);
      }
    };

    var checkStart = function(padId, e) {
      var pad = pads[padId];
      var padOptions = options.pads[padId];
      pad.pointerId = e.pointerId;
      var relPos = Input.getRelativeCoordinates(padOptions.referenceElement, e);
      var x = relPos.x - (padOptions.offsetX || padOptions.referenceElement.clientWidth  / 2);
      var y = relPos.y - (padOptions.offsetY || padOptions.referenceElement.clientHeight / 2);
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
    };

    var getClosestPad = function(e) {
      var closestId = 0;
      var closestDist;
      for (var ii = 0; ii < pads.length; ++ii) {
        var padOptions = options.pads[ii];
        var refElement = padOptions.referenceElement;
        var relPos = Input.getRelativeCoordinates(refElement, e);
        var centerX = refElement.clientWidth / 2;
        var centerY = refElement.clientHeight / 2;
        var dx = relPos.x - centerX;
        var dy = relPos.y - centerY;
        var distSq = dx * dx + dy * dy;
        if (closestDist === undefined || distSq < closestDist) {
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
        if (pad.pointerId === e.pointerId) {
          var padOptions = options.pads[ii];
          var relPos = Input.getRelativeCoordinates(padOptions.referenceElement, e);
          var x = relPos.x - (padOptions.offsetX || padOptions.referenceElement.clientWidth / 2);
          var y = relPos.y - (padOptions.offsetY || padOptions.referenceElement.clientHeight / 2);
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
        if (pad.pointerId === e.pointerId) {
          pad.pointerId = -1;
          pad.vector.reset(0, 0);
          updatePad(pad, ii);
        }
      }
    };

    var onPointerOut = function(e) {
      for (var ii = 0; ii < pads.length; ++ii) {
        var pad = pads[ii];
        if (pad.pointerId === e.pointerId) {
          updatePad(pad, ii, true);
        }
      }
    };

    container.addEventListener('pointerdown', onPointerDown, false);
    container.addEventListener('pointermove', onPointerMove, false);
    container.addEventListener('pointerup', onPointerUp, false);
    container.addEventListener('pointerout', onPointerOut, false);
  };

  /**
   * @typedef {Object} ButtonInfo
   * @property {HTMLElement} element element that represents area of buttton (need not be visible)
   * @property {callback} callback function to call when button is pressed or released
   * @memberOf module:Touch
   */

  /**
   * @typedef {Object} Buttons~Options
   * @property {HTMLElement} inputElement element that receives all input. Should be above all buttons
   * @memberOf module:Touch
   */

  /**
   * Sets up touch buttons.
   *
   * For example
   *
   *     var $ = document.getElementById.bind(document);
   *
   *     Touch.setupButtons({
   *       inputElement: $("buttons"),
   *       buttons: [
   *         { element: $("abuttoninput"), callback: handleAbutton, },
   *         { element: $("avatarinput"),  callback: handleShow, },
   *       ],
   *     });
   *
   * The code above sets up 2 buttons. The HTML elements "abuttoninput" and "avatarinput".
   * The actual touch input events come from an HTML element "buttons" which is an div
   * that covers the entire display.
   *
   * @param {module:Touch.Buttons~Options} options
   * @memberOf module:Touch
   */
  var setupButtons = function(options) {
    var buttonInfos = [];
    var buttons = options.buttons;
    //var expirationTime = 2000;  // 2 seconds, 2000ms

    // I don't really know what to make this number
    // If the person has steady hands they can make
    // this fail but I'm going to assume most players
    // most of the time won't hold steady for this long.
    // On the other hand if the button does get stuck
    // It will take this long to un-stick.

    for (var ii = 0; ii < buttons.length; ++ii) {
      var button = buttons[ii];
      var buttonInfo = {
        pointerIds: {},   // Pointers currently in this button
        numPointerIds: 0, // Number of pointers in this button
      };
      Misc.copyProperties(button, buttonInfo);
      buttonInfos.push(buttonInfo);
    }

    // var printButtonInfo = function(buttonInfo) {
    //   console.log("button: " + buttonInfo.element.id + ", " + buttonInfo.numPointerIds);
    // };

    var addPointerId = function(buttonInfo, pointerId, timeStamp) {
      if (!buttonInfo.pointerIds[pointerId]) {
        buttonInfo.pointerIds[pointerId] = timeStamp;
        ++buttonInfo.numPointerIds;
        buttonInfo.callback({pressed: true});
      }
    };

    var removePointerId = function(buttonInfo, pointerId) {
      if (buttonInfo.pointerIds[pointerId]) {
        delete buttonInfo.pointerIds[pointerId];
        --buttonInfo.numPointerIds;
        if (buttonInfo.numPointerIds === 0) {
          buttonInfo.callback({pressed: false});
        } else if (buttonInfo.numPointerIds < 0) {
          throw ("numPointerIds went negative: how did I get here!?");
        }
      }
    };

    // This is because (maybe because my programming sucks?)
    // sometimes it seems we miss an out/up event and buttons
    // get stuck. So, for a particlar id, if no event has come in
    // for a while assume it was released.
    //var expireOldButtons = function() {
    //  var now = Date.now();
    //  buttonInfos.forEach(function(buttonInfo) {
    //    Object.keys(buttonInfo.pointerIds).forEach(function(pointerId) {
    //      var timeStamp = buttonInfo.pointerIds[pointerId];
    //      var age = now - timeStamp;
    //      if (age > expirationTime) {
    //        removePointerId(buttonInfo, pointerId);
    //      }
    //    });
    //  });
    //};

    var handleButtonDown = function(e, buttonInfo) {
      addPointerId(buttonInfo, e.pointerId, e.timeStamp);
    };

    var handleButtonUp = function(e, buttonInfo) {
      removePointerId(buttonInfo, e.pointerId, e.timeStamp);
    };

    var handleButtonMove = function(/*e, buttonInfo*/) {
//      addPointerId(buttonInfo, e.pointerId, e.timeStamp);
    };

    var handleButtonOut = function(e, buttonInfo) {
      removePointerId(buttonInfo, e.pointerId, e.timeStamp);
    };

    var handleButtonEnter = function(e, buttonInfo) {
      addPointerId(buttonInfo, e.pointerId, e.timeStamp);
    };

    var handleButtonLeave = function(e, buttonInfo) {
      removePointerId(buttonInfo, e.pointerId, e.timeStamp);
    };

    var handleButtonCancel = function(e, buttonInfo) {
      removePointerId(buttonInfo, e.pointerId, e.timeStamp);
    };

    var funcs = {
      pointerdown: handleButtonDown,
      pointermove: handleButtonMove,
      pointerup: handleButtonUp,
      pointerout: handleButtonOut,
      pointerenter: handleButtonEnter,
      pointerleave: handleButtonLeave,
      pointercancel: handleButtonCancel,
    };

    buttonInfos.forEach(function(buttonInfo) {
      var elem = buttonInfo.element;
      Object.keys(funcs).forEach(function(eventName) {
        var func = funcs[eventName];
        elem.addEventListener(eventName, function(buttonInfo) {
          return function(e) {
            func(e, buttonInfo);
          };
        }(buttonInfo));
      });
    });

//    setInterval(expireOldButtons, 100);
  };

  return {
    setupVirtualDPads: setupVirtualDPads,
    setupButtons: setupButtons,
  };
});


