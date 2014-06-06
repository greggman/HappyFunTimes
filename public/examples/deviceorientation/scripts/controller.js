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

var main = function(
    GameClient,
    CommonUI,
    Misc,
    MobileHacks) {

  var g_name = "";
  var g_client;

  var globals = {
  };
  Misc.applyUrlSettings(globals);
  MobileHacks.fixHeightHack();

  function $(id) {
    return document.getElementById(id);
  }

  function onScored(data) {

  };

  g_client = new GameClient({
    gameId: "orient",
  });

  g_client.addEventListener('scored', onScored);

  CommonUI.setupStandardControllerUI(g_client, globals);

  var color = Misc.randCSSColor();
  g_client.sendCmd('setColor', { color: color });
  document.body.style.backgroundColor = color;

  var sendDeviceOrientation = function(eventData) {
    g_client.sendCmd('orient', {
      gamma: eventData.gamma,
      beta: eventData.beta,
      alpha: eventData.alpha,
    });
  };

  if (!window.DeviceOrientationEvent) {
    alert("Your device/browser does not support device orientation. Sorry");
    return;
  }

  window.addEventListener('deviceorientation', sendDeviceOrientation, false);
};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameclient',
    '../../../scripts/commonui',
    '../../../scripts/misc/misc',
    '../../../scripts/misc/mobilehacks',
  ],
  main
);

