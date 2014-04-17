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

function $(id) {
  return document.getElementById(id);
}

var main = function(
    GameServer,
    LocalNetPlayer,
    AudioManager,
    EntitySystem,
    GameClock,
    ImageLoader,
    ImageProcess,
    Input,
    Misc,
    Speedup,
    LevelManager,
    PlayerManager) {

  var g_debug = false;
  var g_services = {};

  var g_entitySystem = new EntitySystem();
  g_services.entitySystem = g_entitySystem;
  var g_playerManager = new PlayerManager(g_services);
  g_services.playerManager = g_playerManager;
  var g_levelManager = new LevelManager(g_services);
  g_services.levelManager = g_levelManager;
  g_services.misc = Misc;
  var stop = false;

  // You can set these from the URL with
  // http://path/gameview.html?settings={name:value,name:value}
  var globals = {
    port: 8080,
    haveServer: true,
    force2d: false,
    debug: false,
    tileInspector: false,
    showState: false,
    moveAcceleration: 5000,
    maxVelocity: [200, 1000],
    jumpDuration: 0.4,
    jumpVelocity: -220,
    gravity: 40000,
    frameCount: 0,
    idleAnimSpeed: 4,
    moveAnimSpeed: 0.2,
    jumpFirstFrameTime: 0.1,
    fallTopAnimVelocity: 100,
  };
window.g = globals;

  function showConnected() {
    $('disconnected').style.display = "none";
  }

  function showDisconnected() {
    $('disconnected').style.display = "block";
  }

  function startLocalPlayers() {
    var player1 = g_playerManager.startPlayer(new LocalNetPlayer(), "Player1");
    //var player2 = g_playerManager.startPlayer(new LocalNetPlayer(), "Player2");
    var g_left = false;
    var g_right = false;
    var g_jump = false;

    function handleKeyDown(keyCode, state) {
      switch(keyCode) {
      case 37: // left
        if (!g_left) {
          g_left = true;
          player1.handleMoveMsg({dir: -1});
        }
        break;
      case 39: // right
        if (!g_right) {
          g_right = true;
          player1.handleMoveMsg({dir: 1});
        }
        break;
      case 90: // z
        if (!g_jump) {
          g_jump = true;
          player1.handleJumpMsg({jump:1});
        }
        break;
      }
    }

    function handleKeyUp(keyCode, state) {
      switch(keyCode) {
      case 37: // left
        g_left = false;
        player1.handleMoveMsg({dir: (g_right) ? 1 : 0});
        break;
      case 39: // right
        g_right = false;
        player1.handleMoveMsg({dir: (g_left) ? -1 : 0});
        break;
      case 90: // z
        g_jump = false;
        player1.handleJumpMsg({jump: 0});
        break;
      }
    }

    Input.setupControllerKeys(handleKeyDown, handleKeyUp);
  }

  Misc.applyUrlSettings(globals);

  g_services.globals = globals;

  var server = new GameServer({
    gameId: "jumpjump",
  });
  g_services.server = server;
  server.addEventListener('connect', showConnected);
  server.addEventListener('disconnect', showDisconnected);
  server.addEventListener('playerconnect', g_playerManager.startPlayer.bind(g_playerManager));

  var levelCanvas = $("level");
  var levelCtx = levelCanvas.getContext("2d");
  var actorCanvas = $("actors");
  var actorCtx = actorCanvas.getContext("2d");

  if (globals.debug) {
    var status = $("status").firstChild;
    var debugCSS = Misc.findCSSStyleRule("#debug");
    debugCSS.style.display = "block";
  }

  var resize = function(canvas) {
    if (canvas.width != canvas.clientWidth ||
        canvas.height != canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
  };

  if (globals.tileInspector) {
    var element = document.createElement("div");
    var s = element.style;
    s.zIndex = 20000;
    s.position = "absolute";
    s.backgroundColor = "rgba(0,0,0,0.6)";
    s.padding = "1em";
    s.color = "white";
    s.pointerEvents = "none";
    document.body.appendChild(element);
    $("outer").addEventListener('mousemove', function(e) {
      var pos = Input.getRelativeCoordinates(e.target, e);
      var level = g_levelManager.getLevel();
      var offset = level.getTransformOffset(levelCtx);
      var x = pos.x - offset.x;
      var y = pos.y - offset.y;
      var tileId = level.getTileByPixel(x, y);
      var tileInfo = g_levelManager.getTileInfo(tileId);
      var px = (levelCanvas.clientLeft + pos.x) + "px";
      var py = (levelCanvas.clientTop  + pos.y) + "px";
      s.left = px;
      s.top  = py;
      element.innerHTML = "<pre>" +
        "x: " + x + "\n" +
        "y: " + y + "\n" +
        "tileId:" + tileId + " (" + String.fromCharCode(tileId) + ")";
    }, false);
  };

  // colorize: number of colors to make
  // slizes: number = width of all slices, array = width of each consecutive slice
  var images = {
    idle:  { url: "assets/spr_idle.png", colorize: 32, slices: 16, },
    move:  { url: "assets/spr_run.png",  colorize: 32, slices: 16, },
    jump:  { url: "assets/spr_jump.png", colorize: 32, slices: [16, 17, 17, 18, 16, 16] },
    brick: { url: "assets/bricks.png",   colorize:  1, slices: 16, },
  };
  g_services.images = images;
window.s = g_services;
  var processImages = function() {
    // make 32 colors of duck. Maybe we should do this in WebGL and use a shader!?
    var duckBlueRange = [180 / 360, 275 / 360];
    for (var name in images) {
      var image = images[name];
      image.colors = [];
      for (var ii = 0; ii < image.colorize; ++ii) {
        var coloredImage = ii ? ImageProcess.adjustHSV(image.img, ii / 32, -(ii % 2) * 0.5, 0, duckBlueRange) : image.img;
        var numFrames = image.slices.length ? image.slices.length : image.img.width / image.slices;
        var frames = [];
        var x = 0;
        for (var jj = 0; jj < numFrames; ++jj) {
          var width = image.slices.length ? image.slices[jj] : image.slices;
          var frame = ImageProcess.cropImage(coloredImage, x, 0, width, 16);
          frame = ImageProcess.scaleImage(frame, 32, 32);
          frames.push(frame);
          x += width;
        }
        image.colors[ii] = frames;
      }
    }

    // Add a 2 players if there is no communication
    if (!globals.haveServer) {
      startLocalPlayers();
    }

    render();
  };

  ImageLoader.loadImages(images, processImages);

  var clock = new GameClock();
  function render() {
    globals.elapsedTime = clock.getElapsedTime();
    ++globals.frameCount;

    g_entitySystem.processEntities();

    resize(levelCanvas);
    resize(actorCanvas);

    g_levelManager.draw(levelCtx);
    g_playerManager.draw(actorCtx);

    requestAnimationFrame(render);
  }

  //var sounds = {
  //  fire: {
  //    filename: "assets/fire.ogg",
  //    samples: 8,
  //  },
  //  explosion: {
  //    filename: "assets/explosion.ogg",
  //    samples: 6,
  //  },
  //  hitshield: {
  //    filename: "assets/hitshield.ogg",
  //    samples: 6,
  //  },
  //  launch: {
  //    filename: "assets/launch.ogg",
  //    samples: 2,
  //  },
  //  gameover: {
  //    filename: "assets/gameover.ogg",
  //    samples: 1,
  //  },
  //  play: {
  //    filename: "assets/play.ogg",
  //    samples: 1,
  //  },
  //};
  //var audioManager = new AudioManager(sounds);
  //g_services.audioManager = audioManager;
};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameserver',
    '../../../scripts/localnetplayer',
    '../../scripts/audio',
    '../../scripts/entitysystem',
    '../../scripts/gameclock',
    '../../scripts/imageloader',
    '../../scripts/imageprocess',
    '../../scripts/input',
    '../../scripts/misc',
    '../../scripts/speedup',
    './levelmanager',
    './playermanager',
  ],
  main
);


