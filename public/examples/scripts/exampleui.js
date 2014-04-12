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
  ['./misc'], function(Misc) {

  var $ = function(id) {
    return document.getElementById(id);
  };

  var setupStandardControllerUI = function(client, options) {
    var menu = $("menu");
    var settings = $("settings");
    var disconnected = $("disconnected");

    menu.addEventListener('click', function() {
      settings.style.display = "block";
    }, false);
    $("restart").addEventListener('click', function() {
      window.location.reload();
    }, false);
    $("exit").addEventListener('click', function() {
      window.location.href = window.location.origin;
    }, false);
    $("back").addEventListener('click', function() {
      settings.style.display = "none";
    });

    // This is not currently needed. The idea
    // was to show something else like "connecting"
    // until the user connected but that's mostly
    // pointless.
    client.addEventListener('connect', function() {
      disconnected.style.display = "none";
    });

    client.addEventListener('disconnect', function() {
      disconnected.style.display = "block";
      if (options.disconnectFn) {
        options.disconnectFn();
      }
    });

    $("reload").addEventListener('click', function() {
      window.location.reload();
    });

    if (options.debug) {
      var status = $("status").firstChild;
      var debugCSS = Misc.findCSSStyleRule("#debug");
      debugCSS.style.display = "block";
    }
  };

  return {
    setupStandardControllerUI: setupStandardControllerUI,
  };
});



