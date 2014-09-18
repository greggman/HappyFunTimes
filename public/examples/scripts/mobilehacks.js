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

  var $ = function(id) {
    return document.getElementById(id);
  };

  var fixHeightHack = function() {
    // Also fix all fucked up sizing
    var elements = document.querySelectorAll(".fixheight");
    for (var ii = 0; ii < elements.length; ++ii) {
      var element = elements[ii];
      var parent = element.parentNode;
      if (parseInt(element.style.height) != parent.clientHeight) {
        element.style.height = parent.clientHeight + "px";
      }
    }
  };

  var fixupAfterSizeChange = function() {
    window.scrollTo(0, 0);
    fixHeightHack();
    window.scrollTo(0, 0);
  };

  // When the device re-orients, at least on iOS, the page is scrolled down :(
  window.addEventListener('orientationchange', fixupAfterSizeChange, false);
  window.addEventListener('resize', fixupAfterSizeChange, false);

  // Prevents the browser from sliding the page when the user slides their finger.
  // At least on iOS.
  document.body.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, false);

  // This DOESN'T WORK! I'm leaving it here so I can revisit it.
  // The issue is all kinds of things mess up. Events are not rotated,
  // the page does strange things.
  var forceLandscape = function() {
    // Note: This code is for games that require a certain orientation
    // on phones only. I'm making the assuption that tablets don't need
    // this.
    //
    // The issue I ran into is I tried to show several people games
    // and they had their phone orientation locked to portrait. Having
    // to go unlock just to play the game was frustrating. So, for
    // controllers than require landscape just try to make the page
    // show up in landscape. They'll understand they need to turn the phone.
    //
    // If the orientation is unlocked they'll turn and the page will
    // switch to landscape. If the orientation is locked then turning
    // the phone will not switch to landscape NOR will we get an orientation
    // event.
    var everything = $("hft-everything");
    var detectPortrait = function() {
      if (screen.width < screen.height) {
        everything.className = "hft-portrait-to-landscape";
        everything.style.width = window.innerHeight + "px";
        everything.style.height = window.innerWidth + "px";

        var viewport = document.querySelector("meta[name=viewport]");
        viewport.setAttribute('content', 'width=device-height, initial-scale=1.0, maximum-scale=1, user-scalable=no, minimal-ui');
      } else {
        everything.className = "";
      }
    };

    detectPortrait();
    window.addEventListener('resize', detectPortrait, false);
  };

  window.scrollTo(0, 0);

  return {
    fixHeightHack: fixHeightHack,
    forceLandscape: forceLandscape,
  };
});

