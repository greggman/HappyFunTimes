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
    ExampleUI,
    HandJS,
    Misc,
    Input,
    MobileHacks,
    Touch,
    Ships) {

  var g_name = "";
  var g_left = false;
  var g_right = false;
  var g_fire = false;
  var g_state = ""
  var g_count;
  var g_playerColor = "#00A";
  var g_playerStyle;
  var g_client;
  var g_audioManager;
  var g_clearMsgTimeoutId;

  var globals = {
    messageDuration: 5,
  };
  Misc.applyUrlSettings(globals);
  MobileHacks.fixHeightHack();

  function $(id) {
    return document.getElementById(id);
  }

  var msgElem = $("msg");
  var colorElem = $("buttons");

  var clearMessage = function() {
    g_clearMsgTimeoutId = undefined;
    msgElem.innerHTML = "";
  };

  var setClearMessageTimeout = function() {
    if (g_clearMsgTimeoutId !== undefined) {
      clearTimeout(g_clearMsgTimeoutId);
    }
    g_clearMsgTimeoutId = setTimeout(clearMessage, globals.messageDuration * 1000);
  };

  var setMessage = function(color, msg) {
    msgElem.innerHTML = msg;
    msgElem.style.color = color;
    setClearMessageTimeout();
  };

  var process;
  var g_states = {
    launch: function() {
      --g_count;
      if (g_count > 0) {
        colorElem.style.backgroundColor = (g_count % 2) ? "#0f0" : "#fff";
        setTimeout(process, 100);
      } else {
        colorElem.style.backgroundColor = g_playerColor;
      }
    },

    die: function() {
      --g_count;
      if (g_count > 0) {
        colorElem.style.backgroundColor = (g_count % 2) ? "#f00" : "#ff0";
        setTimeout(process, 100);
      } else {
        colorElem.style.backgroundColor = g_playerColor;
      }
    }
  };

  process = function() {
    g_states[g_state]();
  };


  function handleSetColorMsg(msg) {
    var canvas = document.createElement("canvas");
    canvas.width = 150;
    canvas.height = 150;
    var xOff = canvas.width / 2;
    var yOff = canvas.height / 2;
    var ctx = canvas.getContext("2d");
    var styleName = Ships.styles[msg.style];
    for (var yy = -2; yy <= 2; ++yy) {
      for (var xx = -2; xx <=2; ++xx) {
        Ships.drawShip(ctx, xx + xOff, yy + yOff, Math.PI, "#000");
      }
    }
    Ships[styleName](ctx, xOff, yOff, Math.PI, msg.color);
    $("avatar").src = canvas.toDataURL();
  }

  function handleKillMsg(msg) {
    setMessage('#0FF', 'Killed ' + msg.killed);
  }

  function handleDieMsg(msg) {
    g_audioManager.playSound('explosion');
    setMessage('#F00', (msg.crash ? 'Crashed into ' : 'Killed by ') + msg.killer);
    g_state = "die";
    g_count = 20;
    setTimeout(process, 100);
  }

  function handleLaunchMsg(msg) {
    g_audioManager.playSound('launching');
    setMessage('#FF0', 'Launch!');
    g_state = "launch";
    g_count = 30;
    setTimeout(process, 100);
  }

  function handleQueueMsg(msg) {
    setMessage('#FFF', msg.count > 0 ?
        (msg.count.toString() + " ahead of you") : "Next Up");
  }

  var leftDown = function() {
    if (!g_left) {
      g_left = true;
      g_client.sendCmd('turn', {
          turn: -1
      });
    }
  };

  var leftUp = function() {
    g_left = false;
    g_client.sendCmd('turn', {
        turn: (g_right) ? 1 : 0
    });
  };

  var rightDown = function() {
    if (!g_right) {
      g_right = true;
      g_client.sendCmd('turn', {
          turn: 1
      });
    }
  };

  var rightUp = function() {
    g_right = false;
    g_client.sendCmd('turn', {
        turn: (g_left) ? -1 : 0
    });
  };

  var fireDown = function() {
    if (!g_fire) {
      g_fire = true;
      g_client.sendCmd('fire', {
          fire: true,
      });
    }
  };

  var fireUp = function() {
    g_fire = false;
    g_client.sendCmd('fire', {
        fire: false,
    });
  };

  function handleKeyDown(keyCode, state) {
    switch(keyCode) {
    case 37: // left
      leftDown();
      break;
    case 39: // right
      rightDown();
      break;
    case 90: // z
      fireDown();
      break;
    }
  }

  function handleKeyUp(keyCode, state) {
    switch(keyCode) {
    case 37: // left
      leftUp();
      break;
    case 39: // right
      rightUp();
      break;
    case 90: // z
      fireUp();
      break;
    }
  }

  g_client = new GameClient({
    gameId: "powpow",
  });

  g_client.addEventListener('setColor', handleSetColorMsg);
  g_client.addEventListener('kill', handleKillMsg);
  g_client.addEventListener('die', handleDieMsg);
  g_client.addEventListener('launch', handleLaunchMsg);
  g_client.addEventListener('queue', handleQueueMsg);

  ExampleUI.setupStandardControllerUI(g_client, globals);

  var sounds = {
    explosion: {
      filename: "assets/explosion.ogg",
      samples: 1,
    },
    launching: {
      filename: "assets/launching.ogg",
      samples: 1,
    }
  };
  g_audioManager = new AudioManager(sounds);

  Ships.setShipSize(60);

  var handleLeftTouch = function(e) {
    if (e.pressed) {
      leftDown();
    } else {
      leftUp();
    }
  };

  var handleRightTouch = function(e) {
    if (e.pressed) {
      rightDown();
    } else {
      rightUp();
    }
  };

  var handleFireTouch = function(e) {
    if (e.pressed) {
      fireDown();
    } else {
      fireUp();
    }
  };

  Touch.setupButtons({
    inputElement: $("buttons"),
    buttons: [
      { element: $("left"),  callback: handleLeftTouch,  },
      { element: $("right"), callback: handleRightTouch, },
      { element: $("fire"),  callback: handleFireTouch,    },
    ],
  });

  var haveTouch = 'ontouchstart' in document
  if (!haveTouch) {
    //var keyControls = $("keyControls");
    //var touchControls = $("touchControls");
    //keyControls.style.display = "block";
    //touchControls.style.display = "none";
  }

  Input.setupControllerKeys(handleKeyDown, handleKeyUp);
};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameclient',
    '../../scripts/audio',
    '../../scripts/exampleui',
    '../../scripts/hand-1.3.7',
    '../../scripts/misc',
    '../../scripts/input',
    '../../scripts/mobilehacks',
    '../../scripts/touch',
    'ships',
  ],
  main
);

