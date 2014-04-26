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
    AudioManager,
    DPad,
    ExampleUI,
    ImageLoader,
    ImageProcess,
    Input,
    Misc,
    MobileHacks,
    Touch) {
  var g_client;
  var g_audioManager;
  var g_clock;
  var g_grid;
  var g_instrument;
  var g_leftRight = 0;
  var g_oldLeftRight = 0;
  var g_abutton = false;

  var globals = {
    debug: false,
  };
  Misc.applyUrlSettings(globals);
  MobileHacks.fixHeightHack();

  function $(id) {
    return document.getElementById(id);
  }

  var startClient = function() {

    g_client = new GameClient({
      gameId: "boomboom",
    });

    var handleScore = function() {
    };

    var handleDeath = function() {
    };

    var handleSetColor = function(msg) {
      var canvas = $("avatar");
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      var ctx = canvas.getContext("2d");
      var coloredImage = ImageProcess.adjustHSV(images.idle.img, msg.h, msg.s, msg.v, msg.range)
      var frame = ImageProcess.cropImage(coloredImage, 0, 0, 16, 16);
      var frame = ImageProcess.scaleImage(frame, 128, 128);
      ctx.drawImage(frame, 0, 0);
    };

    g_client.addEventListener('score', handleScore);
    g_client.addEventListener('die', handleDeath);
    g_client.addEventListener('setColor', handleSetColor);

    var sounds = {};
    g_audioManager = new AudioManager(sounds);

    ExampleUI.setupStandardControllerUI(g_client, globals);

    var dpadSize = 160;
    var dpads = [
      new DPad({size: dpadSize, element: $("dpadleft")}),
    ];

    var handleAbutton = function(pressed) {
      if (g_abutton != pressed) {
        g_abutton = pressed;
        g_client.sendCmd('abutton', {
            abutton: pressed,
        });
      }
    };

    var handleDPad = function(e) {
      dpads[e.pad].draw(e.info);
      g_client.sendCmd('pad', {pad: e.pad, dir: e.info.direction});
    };

    var keys = { };
    keys["Z".charCodeAt(0)] = function(e) { handleAbutton(e.pressed); }
    Input.setupKeys(keys);
    Input.setupKeyboardDPadKeys(handleDPad, Input.kASWDPadOnly);

    Touch.setupButtons({
      inputElement: $("buttons"),
      buttons: [
        { element: $("abutton"), callback: function(e) { handleAbutton(e.pressed); }, },
      ],
    });

    var container = $("dpadleft");
    Touch.setupVirtualDPads({
      inputElement: container,
      callback: handleDPad,
      fixedCenter: true,
      pads: [
        {
          referenceElement: $("dpadleft"),
          offsetX: dpadSize / 2,
          offsetY: dpadSize / 2,
        },
      ],
    });
  };
  startClient();
//  var images = {
//    idle:  { url: "assets/spr_idle.png", },
//  };
//
//  ImageLoader.loadImages(images, startClient);
};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameclient',
    '../../scripts/audio',
    '../../scripts/dpad',
    '../../scripts/exampleui',
    '../../scripts/imageloader',
    '../../scripts/imageprocess',
    '../../scripts/input',
    '../../scripts/misc',
    '../../scripts/mobilehacks',
    '../../scripts/touch',
  ],
  main
);

