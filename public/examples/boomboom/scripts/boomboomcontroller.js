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
    Ticker,
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
  //MobileHacks.forceLandscape();

  function $(id) {
    return document.getElementById(id);
  }

  var msgContainerStyle = $("msgcontainer").style;
  var msgText = Misc.createTextNode($("msg"));
  var msgContainerOriginalDisplay = msgContainerStyle.display;

  var flashNdx;
  var ticker = new Ticker();
  var cancelFlash = function() {
    ticker.cancel();
  };
  var flash = function(colors) {
    flashNdx = 0;
    cancelFlash();
    ticker.tick(2, 0.1, function() {
      msgContainerStyle.backgroundColor = colors[(flashNdx++) % colors.length];
    });
  };

  var showMsg = function(msg, color) {
    cancelFlash()
    msgContainerStyle.backgroundColor = color;
    msgContainerStyle.display = msgContainerOriginalDisplay;
    msgText.nodeValue = msg;
  };

  var hideMsg = function() {
    msgContainerStyle.display = "none";
  };

  var images = {
    tiles0:  { url: "assets/bomb_party-00.png", },
  };
  var avatarTileId = 0x0101;

  var startClient = function() {
    var cutTile = function(xy, ii) {
      var tx = (((xy >> 0) & 0xFF)     );
      var ty = (((xy >> 8) & 0xFF) + ii);
      var img = ImageProcess.cropImage(images.tiles0.img, tx * 16, ty * 16, 16, 16);
      return img = ImageProcess.scaleImage(img, 128, 128);
    };

    images.avatars = [];
    for (var ii = 0; ii < 4; ++ii) {
      images.avatars.push(cutTile(avatarTileId, ii));
    }

    g_client = new GameClient({
      gameId: "boomboom",
    });

    var handleScore = function() {
    };

    var handleDeath = function() {
      showMsg("DEAD!", "red");
      flash(["red", "yellow"]);
    };

    var handleWinner = function() {
      showMsg("WINNER!!!", "yellow");
      flash(["green", "blue", "purple", "red", "orange", "yellow", "purple"]);
    };

    var handleTie = function() {
      showMsg("tie", "green");
    };

    var handleWaitForStart = function(data) {
      showMsg("Start In: " + data.waitTime, "blue");
    };

    var handleWaitForNextGame = function(data) {
      showMsg("Please Wait For Next Game", "orange");
    };

    var handleWaitForMorePlayers = function(data) {
      showMsg("Please Wait For More Players", "orange");
    };

    var handleStart = function() {
      hideMsg();
    };

    var handleSetColor = function(msg) {
      var canvas = $("avatar");
      var width = canvas.clientWidth;
      var height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext("2d");
      var frame = ImageProcess.adjustHSV(images.avatars[msg.set], msg.hsv[0], msg.hsv[1], msg.hsv[2]);
      ctx.drawImage(frame, 0, 0);
    };

    g_client.addEventListener('score', handleScore);
    g_client.addEventListener('start', handleStart);
    g_client.addEventListener('tied', handleTie);
    g_client.addEventListener('died', handleDeath);
    g_client.addEventListener('winner', handleWinner);
    g_client.addEventListener('setColor', handleSetColor);
    g_client.addEventListener('waitForStart', handleWaitForStart);
    g_client.addEventListener('waitForNextGame', handleWaitForNextGame);
    g_client.addEventListener('waitForMorePlayers', handleWaitForMorePlayers);

    var sounds = {};
    g_audioManager = new AudioManager(sounds);

    ExampleUI.setupStandardControllerUI(g_client, globals);

    var dpads = [
      new DPad({element: $("dpadleft")}),
    ];
    var dpadSize = dpads[0].getSize();

    var handleAbutton = function(pressed) {
      if (g_abutton != pressed) {
        g_abutton = pressed;
        g_client.sendCmd('abutton', {
            abutton: pressed,
        });
      }
    };

    var handleShow = function(pressed) {
      g_client.sendCmd('show', {show:pressed});
    };

    var handleDPad = function(e) {
      dpads[e.pad].draw(e.info);
      g_client.sendCmd('pad', {pad: e.pad, dir: e.info.direction});
    };

    var keys = { };
    keys["Z".charCodeAt(0)] = function(e) { handleAbutton(e.pressed); }
    keys["X".charCodeAt(0)] = function(e) { handleShow(e.pressed); }
    Input.setupKeys(keys);
    Input.setupKeyboardDPadKeys(handleDPad, Input.kASWDPadOnly);

    Touch.setupButtons({
      inputElement: $("buttons"),
      buttons: [
        { element: $("abutton"), callback: function(e) { handleAbutton(e.pressed); }, },
        { element: $("avatar"),  callback: function(e) { handleShow(e.pressed); }, },
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

  ImageLoader.loadImages(images, startClient);
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
    '../../scripts/Ticker',
    '../../scripts/touch',
  ],
  main
);

