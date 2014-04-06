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

tdl.require('tdl.webgl');

var g_metaQueuePlayer;
var g_updateStatus = false;
var g_loaded;
var g_run;

// This shit with 'load' and 'start' is because of some conflict or
// other between tdl and require.js >:(

// I think basically require.js runs before 'load' whereas
// tdl does not. So, tdl was not loaded yet.
window.addEventListener('load', function() {
  g_loaded = true;
  start();
});

var start = function() {
  if (g_loaded && g_run) {
    g_run();
  }
};

var main = function(
    GameServer,
    LocalNetPlayer,
    AudioManager,
    EntitySystem,
    Misc,
    CanvasRenderer,
    WebGLRenderer,
    PlayerManager,
    MetaQueuePlayer,
    QueueManager,
    ScoreManager) {

  g_run = function() {
    var g_canvas;
    var g_debug = false;
    var g_logGLCalls = false;
    var g_services = {};

    // You can set these from the URL with
    // http://path/gameview.html?settings={name:value,name:value}
    var globals = {
      maxActivePlayers: 6,
      playerVelocity: 200,
      playerTurnVelocity: Math.PI * 0.5,
      invincibilityDuration: 3,
      maxShots: 2,
      shotDuration: 3,
      shotVelocity: 300,
      port: 8080,
      haveServer: true,
      width: 100,
      height: 100,
    };

    // g_debug = true;
    // g_logGLCalls = true;

    function $(id) {
      return document.getElementById(id);
    }

    function logTo(id, str) {
      var c = $(id);
      var d = document.createElement("div");
      d.appendChild(document.createTextNode(str));
      c.appendChild(d);
    }

    function log() {
      var s = ""
      for (var ii = 0; ii < arguments.length; ++ii) {
        s += arguments[ii].toString();
      }
      logTo("console", s);
    }

    function ValidateNoneOfTheArgsAreUndefined(functionName, args) {
      for (var ii = 0; ii < args.length; ++ii) {
        if (args[ii] === undefined) {
          tdl.error("undefined passed to gl." + functionName + "(" +
                    tdl.webgl.glFunctionArgsToString(functionName, args) + ")");
        }
      }
    }

    function Log(msg) {
      if (g_logGLCalls) {
        tdl.log(msg);
      }
    }

    function LogGLCall(functionName, args) {
      if (g_logGLCalls) {
        ValidateNoneOfTheArgsAreUndefined(functionName, args)
        tdl.log("gl." + functionName + "(" +
                    tdl.webgl.glFunctionArgsToString(functionName, args) + ")");
      }
    }

    function startPlayer(netPlayer, name) {
      var x = Math.random() * g_canvas.width;
      var y = Math.random() * g_canvas.height;
      var direction = Math.random() * Math.PI * 2;
      return playerManager.createPlayer(x, y, direction, name, netPlayer);
    }

    function showConnected() {
      $('outer').style.display = "block";
      $('disconnected').style.display = "none";
    }

    function showDisconnected() {
      $('outer').style.display = "none";
      $('disconnected').style.display = "block";
    }

    function startMetaQueuePlayer() {
      if (g_metaQueuePlayer)
        return g_metaQueuePlayer;
      var x = g_canvas.width / 2;
      var y = g_canvas.height / 2;
      var direction = Math.random() * Math.PI * 2;

      g_metaQueuePlayer = new MetaQueuePlayer(g_services, x, y, direction);
      return g_metaQueuePlayer;
    }

    Misc.applyUrlSettings(globals);

    g_canvas = $("canvas");
    if (globals.msg) {
      $("url").innerHTML = globals.msg;
    } else if (globals.haveServer) {
      $("url").innerHTML = "To Play Go To " +
          window.location.href.replace(/\/[^/]*$/, '');
    } else {
      $("url").innerHTML = "!!DEBUG MODE!! -- Must run from server to play";
    }

    var gl = tdl.webgl.setupWebGL(g_canvas, undefined, function() {});
    if (g_debug) {
      gl = tdl.webgl.makeDebugContext(gl, undefined, LogGLCall);
    }
    var renderer = gl ? new WebGLRenderer(g_services, g_canvas, gl) : new CanvasRenderer(g_services, g_canvas);

    g_services.globals = globals;
    g_services.renderer = renderer;

    var server = new GameServer({
      gameId: "powpow",
    });
    g_services.server = server;
    server.addEventListener('connect', showConnected);
    server.addEventListener('disconnect', showDisconnected);
    server.addEventListener('playerconnect', startPlayer);

    var sounds = {
      fire: {
        filename: "assets/fire.ogg",
        samples: 8,
      },
      explosion: {
        filename: "assets/explosion.ogg",
        samples: 6,
      },
      hitshield: {
        filename: "assets/hitshield.ogg",
        samples: 6,
      },
      launch: {
        filename: "assets/launch.ogg",
        samples: 2,
      },
      gameover: {
        filename: "assets/gameover.ogg",
        samples: 1,
      },
      play: {
        filename: "assets/play.ogg",
        samples: 1,
      },
    };
    var audioManager = new AudioManager(globals.audio ? sounds : {});
    g_services.audioManager = audioManager;
    var entitySys = new EntitySystem();
    g_services.entitySystem = entitySys;
    var drawSystem = new EntitySystem("draw");
    g_services.drawSystem = drawSystem;
    var playerManager = new PlayerManager(g_services);
    g_services.playerManager = playerManager;
    var scoreMgr = new ScoreManager(g_services, $("highscore"));
    g_services.scoreManager = scoreMgr;
    var queueMgr = new QueueManager(g_services, $("queue"));
    g_services.queueManager = queueMgr;

    startMetaQueuePlayer();

    // Add a 2 players if there is no communication
    if (!globals.haveServer) {
      startLocalPlayers();
    }

    var then = (new Date()).getTime() * 0.001;
    render();

    function render() {
      var now = (new Date()).getTime() * 0.001;
      globals.elapsedTime = Math.min(now - then, 1 / 10);    // don't advance more then a 1/10 of a second;
      then = now;

      renderer.resize();
      globals.width = g_canvas.width;
      globals.height = g_canvas.height;

      queueMgr.process();
      entitySys.processEntities();
      scoreMgr.update();

      renderer.begin();

      g_metaQueuePlayer.draw(renderer);
      playerManager.draw(renderer);
      drawSystem.processEntities(renderer);
      drawSystem.forEachEntity(function(e) {
        e.draw(renderer);
      });

      //g_queueMgr.draw();
      scoreMgr.draw(renderer);
      renderer.end();

      if (g_updateStatus) {
        g_updateStatus = false;
        queueMgr.draw();
        scoreMgr.drawScores();
      }

      // turn off logging after 1 frame.
      g_logGLCalls = false;

      requestAnimationFrame(render, g_canvas);
    }

    function startLocalPlayers() {
      globals.maxActivePlayers = 2;
      var player1 = startPlayer(new LocalNetPlayer(), "Player1");
      var player2 = startPlayer(new LocalNetPlayer(), "Player2");
      var player3 = startPlayer(new LocalNetPlayer(), "Player3"); // in queue
      var player4 = startPlayer(new LocalNetPlayer(), "Player4"); // in queue
      var g_left = false;
      var g_right = false;
      var g_fire = false;
      var g_keyState = { };
      var g_oldKeyState = { };

      function handleKeyDown(keyCode, state) {
        switch(keyCode) {
        case 37: // left
          if (!g_left) {
            g_left = true;
            player1.handleTurnMsg({turn: -1});
          }
          break;
        case 39: // right
          if (!g_right) {
            g_right = true;
            player1.handleTurnMsg({turn: 1});
          }
          break;
        case 90: // z
          if (!g_fire) {
            g_fire = true;
            player1.handleFireMsg({fire:1});
          }
          break;
        }
      }

      function handleKeyUp(keyCode, state) {
        switch(keyCode) {
        case 37: // left
          g_left = false;
          player1.handleTurnMsg({turn: (g_right) ? 1 : 0});
          break;
        case 39: // right
          g_right = false;
          player1.handleTurnMsg({turn: (g_left) ? -1 : 0});
          break;
        case 90: // z
          g_fire = false;
          player1.handleFireMsg({fire: 0});
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
        updateKey(event.keyCode, false);
      }

      function keyDown(event) {
        updateKey(event.keyCode, true);
      }

      window.addEventListener("keyup", keyUp, false);
      window.addEventListener("keydown", keyDown, false);
    }
  };
  start();
};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameserver',
    '../../../scripts/localnetplayer',
    '../../scripts/audio',
    '../../scripts/entitysystem',
    '../../scripts/misc',
    'canvasrenderer',
    'webglrenderer',
    'playermanager',
    'metaplayer',
    'queuemanager',
    'scoremanager',
  ],
  main
);


