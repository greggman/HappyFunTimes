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
 * Various hacks to try to get mobile browsers to do what I want but that
 * probably wouldn't be needed if I actually understood the platform.
 *
 * @module MobileHacks
 */
define(function() {

  var $ = document.getElementById.bind(document);

  // shit hacks for iOS8 because iOS8 barfs toolbars on the screen and
  // (a) the user can NOT dismiss them and (b) there is no way for the
  // webpage to see they exist. This only happens on iPhone 4/4s/5/s.
  //var isIOS;
  var shittyOldIPhoneWithShittyIOS8Plus = function() {
    var iPhone4 = (window.screen.height === (960 / 2));
    var iPhone5 = (window.screen.height === (1136 / 2));
    var iOS8Plus = function() {
      if (/iP(hone|od|ad)/.test(navigator.platform)) {
        // supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
        var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
        //isIOS = true;
        return parseInt(v[1], 10) >= 8;
      }
    }();
    return iOS8Plus && (iPhone4 || iPhone5);
  }();

  var isIOS8OrNewerAndiPhone4OrIPhone5 = function() {
    return shittyOldIPhoneWithShittyIOS8Plus;
  };

  var isIOS = function() {
    var itsIOS = (/iP(hone|od|ad)/i).test(navigator.platform);
    return function() {
      return itsIOS;
    };
  }();

  var isMobile = function() {
    // yes I know I should feature detect. FUCK YOU!
    var mobile = (/Android|webOS|Phone|Pad|Pod|Tablet|BlackBerry/i).test(navigator.userAgent);
    return function() {
      return mobile;
    };
  }();

  /**
   * resets the height of any element with CSS class "fixeight"
   * by setting its hight to the cliehgtHeight of its parent
   *
   * The problem this is trying to solve is sometimes you have
   * an element set to 100% but when the phone rotates
   * the browser does not reset the size of the element even
   * though it's parent has been resized.
   *
   * This will be called automatically when the phone rotates
   * or the window is resized but I found I often needed to
   * call it manually at the start of a controller
   *
   * @memberOf module:MobileHacks
   */
  var fixHeightHack = function() {
    // Also fix all fucked up sizing
    var elements = document.querySelectorAll(".fixheight");
    for (var ii = 0; ii < elements.length; ++ii) {
      var element = elements[ii];
      var parent = element.parentNode;
      if (parseInt(element.style.height) !== parent.clientHeight) {
        element.style.height = parent.clientHeight + "px";
      }
    }
  };

  var adjustCSSBasedOnPhone = function(perPhoneClasses) {
    perPhoneClasses.forEach(function(phone) {
      if (phone.test()) {
        Array.prototype.forEach.call(document.styleSheets, function(sheet) {
          var classes = sheet.rules || document.sheet.cssRules;
          Array.prototype.forEach.call(classes, function(c) {
            var adjustments = phone.styles[c.selectorText];
            if (adjustments) {
              Object.keys(adjustments).forEach(function(key) {
//console.log(key + ": old " + c.style[key]);
                if (c.style.setProperty) {
                  c.style.setProperty(key, adjustments[key]);
                } else {
                  c.style[key] = adjustments[key];
                }
//console.log(key + ": new " + c.style[key]);
              });
            }
          });
        });
      }
    });
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
  var stopSliding = function() {
    if (!document.body) {
      setTimeout(stopSliding, 4);
    } else {
      document.body.addEventListener('touchmove', function(e) {
        e.preventDefault();
      }, false);
    }
  };
  stopSliding();


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

  function preventEvent(e) {
    e.preventDefault();
    return false;
  }

  /**
   * Disable the context menus!
   * At least on Android if you long press on an image it asks if you
   * want to save it. I'd think "user-select: none" CSS should handle that
   * but nope
   */
  function disableContextMenu() {
    // for now just images.
    Array.prototype.forEach.call(document.getElementsByTagName("img"), function(img) {
      img.addEventListener('contextmenu', preventEvent, false);
    });
  }


  window.scrollTo(0, 0);

  return {
    disableContextMenu: disableContextMenu,
    fixHeightHack: fixHeightHack,
    forceLandscape: forceLandscape,
    adjustCSSBasedOnPhone: adjustCSSBasedOnPhone,
    isIOS8OrNewerAndiPhone4OrIPhone5: isIOS8OrNewerAndiPhone4OrIPhone5,
    isIOS: isIOS,
    isMobile: isMobile,
  };
});

