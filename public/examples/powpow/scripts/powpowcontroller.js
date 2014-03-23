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

var main = function(GameClient, AudioManager, Cookies, Input, Ships) {

  var g_name = "";
  var g_turn = 0;
  var g_oldTurn = 0;
  var g_left = false;
  var g_right = false;
  var g_fire = false;
  var g_keyState = {};
  var g_oldKeyState = {};
  var g_dirTouchStart = 0;
  var g_numTouches = 0;
  var g_ctx = 0;
  var g_canvas;
  var g_startX;
  var g_startY;
  var g_startTime;
  var g_state = ""
  var g_count;
  var g_playerColor = "black";
  var g_playerStyle;
  var g_client;
  var g_audioManager;

  function $(id) {
    return document.getElementById(id);
  }

  function logTo(id, str) {
    var c = $(id);
    var d = document.createElement("div");
    d.appendChild(document.createTextNode(str));
    c.appendChild(d);
    while(d.children.length > 6) {
      d.removeChild(d.firstChild);
    }
  }

  function log() {
    var s = ""
    for (var ii = 0; ii < arguments.length; ++ii) {
      s += arguments[ii].toString();
    }
    logTo("console", s);
  }

  function showConnected() {
    $("disconnected").style.display = "none";
  }

  function showDisconnected() {
    $("disconnected").style.display = "block";
  }

  var g_states = {
    launch: function() {
      --g_count;
      var e = $("surface");
      if (g_count > 0) {
        e.style.backgroundColor = (g_count % 2) ? "#0f0" : "#fff";
        setTimeout(process, 100);
      } else {
        e.style.backgroundColor = g_playerColor;
      }
    },

    die: function() {
      --g_count;
      var e = $("surface");
      if (g_count > 0) {
        e.style.backgroundColor = (g_count % 2) ? "#f00" : "#ff0";
        setTimeout(process, 100);
      } else {
        e.style.backgroundColor = g_playerColor;
      }
    }
  };

  function process() {
    g_states[g_state]();
  };

  function handleSetColorMsg(msg) {
    //var e = $("surface");
    //e.style.backgroundColor = msg.color;
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
    $("ship").src = canvas.toDataURL();
    //e.style.backgroundImage = "url(" + canvas.toDataURL() + ")";
  }

  function handleSetNameMsg(msg) {
    g_name = msg.name;
    $('msg').innerHTML = "Name: " + g_name + " -- click to edit";
    $('msg').style.color = '#FFF';
    $('input').value = g_name;
  }

  function handleKillMsg(msg) {
    $('msg').innerHTML = 'Killed ' + msg.killed;
    $('msg').style.color = '#0FF';
  }

  function handleDieMsg(msg) {
    g_audioManager.playSound('explosion');
    $('msg').innerHTML = (msg.crash ? 'Crashed into ' : 'Killed by ') + msg.killer;
    $('msg').style.color = '#F00';
    g_state = "die";
    g_count = 20;
    setTimeout(process, 100);
  }

  function handleLaunchMsg(msg) {
    g_audioManager.playSound('launching');
    $('msg').innerHTML = 'Launch!';
    $('msg').style.color = '#FF0';
    g_state = "launch";
    g_count = 30;
    setTimeout(process, 100);
  }

  function handleQueueMsg(msg) {
    $('msg').innerHTML = msg.count > 0 ?
        (msg.count.toString() + " ahead of you") : "Next Up";
    $('msg').style.color = '#FFF';
  }

  function debugTouch(label, event) {
    var allTouches = event.touches;
    logTo("status", label);
    for (var ii = 0; ii < allTouches.length; ++ii) {
      var touch = allTouches[ii];
      logTo("status", "  " + ii + ": " + touch.pageX + ", " + touch.pageY +
            " cw: " + event.target.clientWidth +
            " ch: " + event.target.clientHeight);
    }
    var s = $("status");
    s.scrollTop = s.scrollHeight;
  }

  function touchMoveStart(event) {
    event.preventDefault();
    var allTouches = event.touches;
    for (var ii = 0; ii < allTouches.length; ++ii) {
      ++g_numTouches;
      var touch = allTouches[ii];
      g_dirTouchStart = touch.pageX;
      break;
    }

    //debugTouch("start", event);
  }

  function touchMoveMove(event) {
    event.preventDefault();
    //debugTouch("move", event);
    var allTouches = event.touches;
    for (var ii = 0; ii < allTouches.length; ++ii) {
      var touch = allTouches[ii];
      var dx = touch.pageX - g_dirTouchStart;
      //logTo("status", dx)
      var fudge = 10
      if (dx < -fudge) {
        if (!g_left) {
          g_left = 1;
          g_right = 0;
          g_client.sendCmd('turn', {
              turn: -1
          });
        }
      } else if (dx > fudge) {
        if (!g_right) {
          g_left = 0;
          g_right = 1;
          g_client.sendCmd('turn', {
              turn: 1
          });
        }
      } else {
        if (g_right || g_left) {
          g_left = 0;
          g_right = 0;
          g_client.sendCmd('turn', {
              turn: 0
          });
        }
      }
      break;
    }
  }

  function touchMoveEnd(event) {
    event.preventDefault();
    if (g_right || g_left) {
      g_left = 0;
      g_right = 0;
      g_client.sendCmd('turn', {
         turn: 0
      });
    }
    //debugTouch("end", event);
  }

  function touchMoveCancel(event) {
    touchMoveEnd(event)
  }

  function touchFireStart(event) {
    event.preventDefault();
    if (!g_fire) {
      g_fire = true;
      g_client.sendCmd('fire', {
          fire: 1
      });
    }

    //debugTouch("start", event);
  }

  function touchFireMove(event) {
    event.preventDefault();
    //debugTouch("move", event);
  }

  function touchFireEnd(event) {
    event.preventDefault();
    if (g_fire) {
      g_fire = false;
      g_client.sendCmd('fire', {
          fire: 0
      });
    }
    //debugTouch("end", event);
  }

  function touchFireCancel(event) {
    touchFireEnd(event);
    //debugTouch("cancel", event);
  }

  function updateTarget(element, x, y) {
    var centerX = element.clientWidth / 2;
    var centerY = element.clientHeight / 2;
    var dx = x - centerX;
    var dy = y - centerY;
    var direction = Math.atan2(dy, dx);
    g_client.sendCmd('target', {
        target: (direction + Math.PI / 2 * 3) % (Math.PI * 2)
    });

    var ctx = g_ctx;
    ctx.clearRect(0, 0, g_canvas.width, g_canvas.height);
    ctx.save();
    ctx.translate(g_canvas.width / 2, g_canvas.height / 2);
    ctx.rotate(direction - Math.PI / 2);
    ctx.fillStyle = "#FF0";
    ctx.beginPath();
    ctx.closePath();
    ctx.moveTo(10, 0);
    ctx.lineTo(10, 50);
    ctx.lineTo(30, 50);
    ctx.lineTo(0, 70);
    ctx.lineTo(-30, 50);
    ctx.lineTo(-10, 50);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

  };

  function singleTouchStart(event) {
    event.preventDefault();
    var m = Input.getRelativeCoordinates(event.target, event.touches[0]);
    updateTarget(event.target, m.x, m.y);
    g_startTime = (new Date()).getTime();
  }

  function singleTouchMove(event) {
    event.preventDefault();
    var m = Input.getRelativeCoordinates(event.target, event.touches[0]);
    updateTarget(event.target, m.x, m.y);
  }

  function singleTouchEnd(event) {
    event.preventDefault();
    var now = (new Date()).getTime();

    if (now - g_startTime < 200) {
      g_client.sendCmd('fire', {
          fire: 1
      });
      g_client.sendCmd('fire', {
          fire: 0
      });
    }
  }

  function singleTouchCancel(event) {
    singleTouchEnd(event);
  }

  function handleKeyDown(keyCode, state) {
    switch(keyCode) {
    case 37: // left
      if (!g_left) {
        g_left = true;
        g_client.sendCmd('turn', {
            turn: -1
        });
      }
      break;
    case 39: // right
      if (!g_right) {
        g_right = true;
        g_client.sendCmd('turn', {
            turn: 1
        });
      }
      break;
    case 90: // z
      if (!g_fire) {
        g_fire = true;
        g_client.sendCmd('fire', {
            fire: 1
        });
      }
      break;
    }
  }

  function handleKeyUp(keyCode, state) {
    switch(keyCode) {
    case 37: // left
      g_left = false;
      g_client.sendCmd('turn', {
          turn: (g_right) ? 1 : 0
      });
      break;
    case 39: // right
      g_right = false;
      g_client.sendCmd('turn', {
          turn: (g_left) ? -1 : 0
      });
      break;
    case 90: // z
      g_fire = false;
      g_client.sendCmd('fire', {
          fire: 0
      });
      break;
    }
  }

  function updateKey(keyCode, state) {
    g_keyState[keyCode] = state;
    if (g_oldKeyState != g_keyState) {
      g_oldKeyState = state;
      if (state) {
        handleKeyDown(keyCode);
      } else {
        handleKeyUp(keyCode);
      }
    }
  }

  function keyUp(event) {
    //logTo("status", "keyUp: " + event.keyCode);
    var s = $("status");
    s.scrollTop = s.scrollHeight;
    updateKey(event.keyCode, false);
  }

  function keyDown(event) {
    //logTo("status", "keyDown: " + event.keyCode);
    var s = $("status");
    s.scrollTop = s.scrollHeight;
    updateKey(event.keyCode, true);
  }

  function enterName(event) {
    $('msg').style.display = "none";
    $('msg').style.color = "#FFF";
    $('input').style.display = "block";
    $('input').focus();
    g_client.sendCmd('busy', {
        busy: true
    });
  }

  function sendName() {
    g_client.sendCmd('setName', {
        name: g_name
    });
    $('msg').innerHTML = g_name;
  }

  function finishSendName(event) {
    g_name = $('input').value.replace(/[<>]/g, '');
    Cookies.createCookie("name", g_name, 90);
    sendName(event);
    $('msg').style.display = "block";
    $('input').style.display = "none";
    g_client.sendCmd('busy', {
        busy: false
    });
  }

  function reloadPage() {
    window.location.reload();
  }

  var gameName = "powpow";
  g_client = new GameClient(gameName);

  g_client.addEventListener('setColor', handleSetColorMsg);
  g_client.addEventListener('setName', handleSetNameMsg);
  g_client.addEventListener('kill', handleKillMsg);
  g_client.addEventListener('die', handleDieMsg);
  g_client.addEventListener('launch', handleLaunchMsg);
  g_client.addEventListener('queue', handleQueueMsg);

  g_client.addEventListener('connect', showConnected);
  g_client.addEventListener('disconnect', showDisconnected);

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

  Ships.setShipSize(70);

  // Get the name user set before.
  g_name = Cookies.readCookie("name");
  if (!g_name) {
    g_name = "";
  }
  // Note: If the name is "" server will send a name
  sendName();

  var haveTouch = 'ontouchstart' in document

  var surface = $("top");
  if (haveTouch) {
    if (navigator.userAgent.indexOf("Android") >= 0 && !window.opera) {
      var singleTouchControls = $("singleTouchControls");
      var touchControls = $("touchControls");
      singleTouchControls.style.display = "block";
      touchControls.style.display = "none";
      var stcontrol = $("stcontrol");
      stcontrol.addEventListener("touchstart", singleTouchStart, false);
      stcontrol.addEventListener("touchmove", singleTouchMove, false);
      stcontrol.addEventListener("touchend", singleTouchEnd, false);
      stcontrol.addEventListener("touchcancel", singleTouchCancel, false);
      g_canvas = document.getElementsByTagName("canvas")[0];
      g_ctx = g_canvas.getContext("2d");
    } else {
      var tcmove = $("tcmove");
      var tcfire = $("tcfire");
      tcmove.addEventListener("touchstart", touchMoveStart, false);
      tcmove.addEventListener("touchmove", touchMoveMove, false);
      tcmove.addEventListener("touchend", touchMoveEnd, false);
      tcmove.addEventListener("touchcancel", touchMoveCancel, false);
      tcfire.addEventListener("touchstart", touchFireStart, false);
      tcfire.addEventListener("touchmove", touchFireMove, false);
      tcfire.addEventListener("touchend", touchFireEnd, false);
      tcfire.addEventListener("touchcancel", touchFireCancel, false);
    }
  } else {
    var keyControls = $("keyControls");
    var touchControls = $("touchControls");
    keyControls.style.display = "block";
    touchControls.style.display = "none";
    window.addEventListener("keyup", keyUp, false);
    window.addEventListener("keydown", keyDown, false);
  }
  $('msg').addEventListener("click", enterName, false);
  $('input').addEventListener("change", finishSendName, false);
  $('input').addEventListener("blur", finishSendName, false);
  $('reload').addEventListener("click", reloadPage, false);
};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameclient',
    '../../scripts/audio',
    '../../scripts/cookies',
    '../../scripts/input',
    'ships',
  ],
  main
);

