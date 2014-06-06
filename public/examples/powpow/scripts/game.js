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

var g_metaQueuePlayer;
var g_updateStatus = false;

var main = function(
    GameServer,
    GameSupport,
    LocalNetPlayer,
    Input,
    Misc,
    WebGL,
    AudioManager,
    EntitySystem,
    CanvasRenderer,
    WebGLRenderer,
    PlayerManager,
    MetaQueuePlayer,
    QueueManager,
    ScoreManager) {

  var g_canvas;
  var g_debug = false;
  var g_logGLCalls = false;
  var g_services = {};

  // You can set these from the URL with
  // http://path/gameview.html?settings={name:value,name:value}
  var globals = {
    audio: true,
    maxActivePlayers: 6,
    numLocalPlayers: 4,  // num players when local (ie, debugging)
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
        console.error("undefined passed to gl." + functionName + "(" +
                      WebGL.glFunctionArgsToString(functionName, args) + ")");
      }
    }
  }

  function Log(msg) {
    if (g_logGLCalls) {
      console.log(msg);
    }
  }

  function LogGLCall(functionName, args) {
    if (g_logGLCalls) {
      ValidateNoneOfTheArgsAreUndefined(functionName, args)
      console.log("gl." + functionName + "(" +
                  WebGL.glFunctionArgsToString(functionName, args) + ")");
    }
  }

  function startPlayer(netPlayer, name) {
    var x = Math.random() * g_canvas.width;
    var y = Math.random() * g_canvas.height;
    var direction = Math.random() * Math.PI * 2;
    return playerManager.createPlayer(x, y, direction, name, netPlayer);
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

  var gl = WebGL.setupWebGL(g_canvas, undefined, function() {});
  if (g_debug) {
    gl = WebGL.makeDebugContext(gl, undefined, LogGLCall);
  }
  var renderer = gl ? new WebGLRenderer(g_services, g_canvas, gl) : new CanvasRenderer(g_services, g_canvas);

  g_services.globals = globals;
  g_services.renderer = renderer;
window.s = g_services;

  var server;
  if (globals.haveServer) {
    server = new GameServer({
      gameId: "powpow",
    });
    g_services.server = server;
    server.addEventListener('playerconnect', startPlayer);
  }
  GameSupport.init(server, globals);

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

  var render = function() {
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
  }
  GameSupport.run(globals, render);

  function startLocalPlayers() {
    var localNetPlayers = [];
    for (var ii = 0; ii < globals.numLocalPlayers; ++ii) {
      var localNetPlayer = new LocalNetPlayer();
      var player = startPlayer(localNetPlayer, "Player" + (ii + 1));
      localNetPlayers.push(localNetPlayer);
    }
    var localNetPlayer1 = localNetPlayers[0];

    var g_leftRight = 0;
    var g_oldLeftRight = 0;
    var g_fire = false;

    var handleLeftRight = function(pressed, bit) {
      g_leftRight = (g_leftRight & ~bit) | (pressed ? bit : 0);
      if (g_leftRight != g_oldLeftRight) {
        g_oldLeftRight = g_leftRight;
        localNetPlayer1.sendEvent('turn', {
            turn: (g_leftRight & 1) ? -1 : ((g_leftRight & 2) ? 1 : 0),
        });
      }
    };

    var handleFire = function(pressed) {
      if (g_fire != pressed) {
        g_fire = pressed;
        localNetPlayer1.sendEvent('fire', {
            fire: pressed,
        });
      }
    };

    var keys = { };
    keys[Input.cursorKeys.kLeft]  = function(e) { handleLeftRight(e.pressed, 0x1); }
    keys[Input.cursorKeys.kRight] = function(e) { handleLeftRight(e.pressed, 0x2); }
    keys["Z".charCodeAt(0)]       = function(e) { handleFire(e.pressed);           }
    Input.setupKeys(keys);

  }
};

// Start the main app logic.
requirejs([
    '../../../scripts/gameserver',
    '../../../scripts/gamesupport',
    '../../../scripts/localnetplayer',
    '../../../scripts/misc/input',
    '../../../scripts/misc/misc',
    '../../../3rdparty/tdl/webgl',
    '../../scripts/audio',
    '../../scripts/entitysystem',
    'canvasrenderer',
    'webglrenderer',
    'playermanager',
    'metaplayer',
    'queuemanager',
    'scoremanager',
  ],
  main
);


