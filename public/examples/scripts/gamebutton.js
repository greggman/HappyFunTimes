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

// I don't know if this is overkill or not. In most games I've
// written in the past they are local player game. I'd have
// a joypad library that reads that pads and has flags for
// which buttons are currently held down and which buttons
// where pressed this frame.
//
// In this case though I have N players that join at random.
// Seems kind of silly to have a class/object per button per
// player but it does make it simple to use
//
// Similarly the fact that it assumes entitySystem exists
// and actually uses it to "process" seems overkill but
// at the same time to removes the need for the user of
// this class to have to manually call some `update` function.
//
// I could make it so calling 'on' or 'justOn' does the processing
// but that also seems like it might be hard for the user to remember
// he can only call `on' or 'justOn` once per frame and only
// one or the other.
//

define(function() {
  var GameButton = function(entitySystem) {
    entitySystem.addEntity(this);
    var currentState = false;
    var lastState = false;
    var justOn = false;

    this.setState = function(state) {
      currentState = state;
    };

    this.process = function() {
      justOn = (currentState && !lastState);
      lastState = currentState;
    }

    this.on = function() {
      return currentState;
    };

    this.justOn = function() {
      return justOn;
    };

    this.destroy = function() {
      entitySystem.removeEntity(this);
    }
  };

  return GameButton;
});
