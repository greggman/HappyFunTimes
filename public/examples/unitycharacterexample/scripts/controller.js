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
    CommonUI,
    GameClient,
    DPad,
    Input,
    Misc,
    MobileHacks,
    Touch,
    AudioManager) {
  var g_client;
  var g_audioManager;

  var globals = {
    debug: false,
  };
  Misc.applyUrlSettings(globals);
  MobileHacks.fixHeightHack();

  function $(id) {
    return document.getElementById(id);
  }

  g_client = new GameClient({
    gameId: "unitycharacterexample",
  });

  function handleScore() {
  };

  function handleDeath() {
  };

  g_client.addEventListener('score', handleScore);
  g_client.addEventListener('die', handleDeath);

  var color = Misc.randCSSColor();
  g_client.sendCmd('setColor', { color: color });
  document.body.style.backgroundColor = color;

  g_audioManager = new AudioManager();

  var dpadSize = 160;
  var dpads = [
    new DPad({size: dpadSize, element: $("dpadleft")}),
    new DPad({size: dpadSize, element: $("dpadright")}),
  ];

  var sendPad = function(e) {
    if (globals.debug) {
      console.log("pad: " + e.pad + " dir: " + e.info.symbol + " (" + e.info.direction + ")");
    }
    dpads[e.pad].draw(e.info);
    g_client.sendCmd('pad', {pad: e.pad, dir: e.info.direction});
  };

  CommonUI.setupStandardControllerUI(g_client, globals);

  Input.setupKeyboardDPadKeys(sendPad);
  var container = $("dpadinput");
  Touch.setupVirtualDPads({
    inputElement: container,
    callback: sendPad,
    fixedCenter: true,
    pads: [
      {
        referenceElement: $("dpadleft"),
        offsetX: dpadSize / 2,
        offsetY: dpadSize / 2,
      },
      {
        referenceElement: $("dpadright"),
        offsetX: dpadSize / 2,
        offsetY: dpadSize / 2,
      },
    ],
  });

};

// Start the main app logic.
requirejs([
    '../../../scripts/commonui',
    '../../../scripts/gameclient',
    '../../../scripts/misc/dpad',
    '../../../scripts/misc/input',
    '../../../scripts/misc/misc',
    '../../../scripts/misc/mobilehacks',
    '../../../scripts/misc/touch',
    '../../scripts/audio',
  ],
  main
);

