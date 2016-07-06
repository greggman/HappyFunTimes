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
    '../hft-settings',
    './misc',
  ], function(
    hftSettings,
    misc) {

  var lockOrientation = misc.getFunctionByPrefix(window.screen, "lockOrientation");
  var unlockOrientation = misc.getFunctionByPrefix(window.screen, "unlockOrientation");
  var currentOrientation = "none";
  var _canOrient = true;

  if (!hftSettings.isApp && window.screen.orientation && window.screen.orientation.lock) {
    lockOrientation = function(orientation) {
      window.screen.orientation.lock(orientation).then(function() {
        console.log("orientation set");
      }, function(err) {
        console.error("can not set orientation:", err);
      });
    };
    unlockOrientation = function() {
      window.screen.orientation.unlock().then(function() {
        console.log("orientation unlocked");
      }, function(err) {
        console.error("can not unlock orientation:", err);
      });
    };
  }

  if (!lockOrientation) {
    _canOrient = false;
    lockOrientation = function() {
      console.warn("orientation locking not supported");
    };
    unlockOrientation = function() {
    };
  }

  /**
   * Sets the orientation of the screen
   * @param {string} [orienation] The orientation to set the phone.
   *   Only works on Android or the App.
   *
   *   Valid values are:
   *
   *     "portrait-primary"    // normal way people hold phones
   *     "portrait-secondary"  // upsidedown
   *     "landscape-primary"   // phone turned clockwise 90 degrees from normal
   *     "landscape-secondary" // phone turned counter-clockwise 90 degrees from normal
   *     "none" (or undefined) // unlocked
   */
  function set(orientation) {
    orientation = orientation || "none";
    if (orientation !== currentOrientation) {
      currentOrientation = orientation;
      if (currentOrientation === "none") {
        console.log("unlock orienation");
        unlockOrientation();
      } else {
        console.log("set orienation: " + orientation);
        lockOrientation(orientation);
      }
    }
  }

  /**
   * Returns true if orientation is supported.
   * @return {boolean} true if orientation is supported
   */
  function canOrient() {
    return _canOrient;
  }

  return {
    set: set,
    canOrient: canOrient,
  };
});
