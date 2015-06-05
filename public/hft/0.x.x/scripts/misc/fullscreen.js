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
  ], function(
    hftSettings) {

  var requestFullScreen = function(element) {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    } else if (element.webkitRequestFullScreen) {
      element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.mozRequestFullscreen) {
      element.mozRequestFullscreen();
    }
  };

  var noop = function() {
  };

  var cancelFullScreen = (
      document.exitFullscreen ||
      document.exitFullScreen ||
      document.msExitFullscreen ||
      document.msExitFullScreen ||
      document.webkitCancelFullscreen ||
      document.webkitCancelFullScreen ||
      document.mozCancelFullScreen ||
      document.mozCancelFullscreen ||
      noop).bind(document);

  function isFullScreen() {
    var f = document.fullscreenElement ||
            document.fullScreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.webkitIsFullScreen;
    return (f !== undefined && f !== null && f !== false) || hftSettings.isApp;
  }

  var onFullScreenChange = function(element, callback) {
    document.addEventListener('fullscreenchange', function(/*event*/) {
        callback(isFullScreen());
      });
    element.addEventListener('webkitfullscreenchange', function(/*event*/) {
        callback(isFullScreen());
      });
    document.addEventListener('mozfullscreenchange', function(/*event*/) {
        callback(isFullScreen());
      });
  };

  function canGoFullScreen() {
    var body = window.document.body || {};
    var r = body.requestFullscreen ||
            body.requestFullScreen ||
            body.msRequestFullscreen ||
            body.msRequestFullScreen ||
            body.webkitRequestFullScreen ||
            body.webkitRequestFullscreen ||
            body.mozRequestFullScreen ||
            body.mozRequestFullscreen;
    return r !== undefined && r !== null;
  }

  return {
    cancelFullScreen: cancelFullScreen,
    isFullScreen: isFullScreen,
    canGoFullScreen: canGoFullScreen,
    onFullScreenChange: onFullScreenChange,
    requestFullScreen: requestFullScreen,
  };
});
