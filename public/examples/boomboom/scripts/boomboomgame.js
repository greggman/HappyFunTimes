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
    Textures,
    WebGL,
    AudioManager,
    EntitySystem,
    GameSupport,
    ImageLoader,
    ImageProcess,
    Input,
    Misc,
    LevelManager,
    PlayerManager,
    WebGLRenderer) {

  var g_debug = false;
  var g_services = {};
window.s = g_services;

  var g_entitySystem = new EntitySystem();
  g_services.entitySystem = g_entitySystem;
  var g_drawSystem = new EntitySystem('draw');
  g_services.drawSystem = g_drawSystem;
  var g_playerManager = new PlayerManager(g_services);
  g_services.playerManager = g_playerManager;
  g_services.misc = Misc;
  var stop = false;

  // You can set these from the URL with
  // http://path/gameview.html?settings={name:value,name:value}
  var globals = {
    port: 8080,
    haveServer: true,
    numLocalPlayers: 1,  // num players when local (ie, debugger)
    debug: false,
    tileInspector: false,
    showState: false,
    scale: 2,
    moveAcceleration: 5000,
    maxVelocity: [200, 1000],
    jumpDuration: 0.4,
    jumpVelocity: -220,
    gravity: 40000,
    frameCount: 0,
    idleAnimSpeed: 4,
    moveAnimSpeed: 0.2,
    coinAnimSpeed: 10,
    jumpFirstFrameTime: 0.1,
    fallTopAnimVelocity: 100,
  };
window.g = globals;

  function startLocalPlayers() {
    var players = [];
    var netPlayers = [];
    for (var ii = 0; ii < globals.numLocalPlayers; ++ii) {
      var netPlayer = new LocalNetPlayer();
      netPlayers.push(netPlayer);
      players.push(g_playerManager.startPlayer(netPlayer, "Player" + (ii + 1)));
    }
    var localNetPlayer1 = netPlayers[0];
    var g_abutton = false;

    var handleDPad = function(e) {
      localNetPlayer.sendEvent('pad', {pad: e.pad, dir: e.info.direction});
    };

    var handleAbutton = function(pressed) {
      if (g_abutton != pressed) {
        g_abutton = pressed;
        localNetPlayer1.sendEvent('abutton', {
            abutton: pressed,
        });
      }
    };

    var keys = { };
    keys["Z".charCodeAt(0)] = function(e) { handleAbutton(e.pressed); }
    Input.setupKeys(keys);
    Input.setupKeyboardDPadKeys(handleDPad, Input.kASWDPadOnly);
  }

  Misc.applyUrlSettings(globals);

  g_services.globals = globals;

  var server = new GameServer({
    gameId: "boomboom",
  });
  g_services.server = server;
  server.addEventListener('playerconnect', g_playerManager.startPlayer.bind(g_playerManager));

  GameSupport.init(server, globals);
window.gs = GameSupport;

  var canvas = $("playfield");
  var gl = WebGL.setupWebGL(canvas, {alpha:false}, function() {});
  var renderer = new WebGLRenderer(g_services, canvas, gl);
  g_services.canvas = canvas;
  g_services.renderer = renderer;

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
    $("canvas").addEventListener('mousemove', function(e) {
      var pos = Input.getRelativeCoordinates(e.target, e);
      var level = g_levelManager.getLevel();
      var offset = level.getTransformOffset(levelCtx);
      var x = pos.x - offset.x;
      var y = pos.y - offset.y;
      var tileId = level.getTileByPixel(x, y);
      var tileInfo = g_levelManager.getTileInfo(tileId);
      var px = (canvas.clientLeft + pos.x) + "px";
      var py = (canvas.clientTop  + pos.y) + "px";
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
    tiles:  { url: "assets/bomb_party.png", },
  };
  g_services.images = images;

  var createTexture = function(img) {
    var tex = Textures.loadTexture(img);
    tex.setParameter(gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    tex.setParameter(gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return tex;
  };

  var processImages = function() {
    // cut out sprites
    var avatarSprites = {
      avatarStandU: 0x0100,
      avatarStandD: 0x0101,
      avatarWalkD0: 0x0102,
      avatarWalkD1: 0x0103,
      avatarStandR: 0x0104,
      avatarWalkR0: 0x0105,
      avatarWalkR1: 0x0106,
      avatarWalkR2: 0x0107,
      avatarWalkU0: 0x0108,
      avatarWalkU1: 0x0109,
    };

    var bombSprites = [
      0x0504,
      0x0505,
      0x0506,
      0x0507,
      0x0508,
      0x0509,
    ];
    images.avatar = [];
    var cutTile = function(xy) {
      var tx = (((xy >> 0) & 0xFF)     );
      var ty = (((xy >> 8) & 0xFF) + ii);
      var img = ImageProcess.cropImage(images.tiles.img, tx * 16, ty * 16, 16, 16);
      return createTexture(img);
    };
    for (var ii = 0; ii < 4; ++ii) {
      var avatar = {};
      for (var spriteName in avatarSprites) {
        var img = cutTile(avatarSprites[spriteName]);
        avatar[spriteName] = img;
      }
      images.avatar.push(avatar);
    }
    images.bomb = {
      frames: [],
    };
    for (var ii = 0; ii < bombSprites.length; ++ii) {
      images.bomb.frames.push(cutTile(bombSprites[ii]));
    }

    var tilesetTexture = createTexture(images.tiles.img);

    var tileset = {
      tileWidth: 16,
      tileHeight: 16,
      tilesAcross: 15,  // tiles across set
      tilesDown: 6,     // tiles across set
      texture: tilesetTexture,
    };
    var g_levelManager = new LevelManager(g_services, tileset);
    g_services.levelManager = g_levelManager;

    var resetLevel = function() {
      g_levelManager.makeLevel(canvas.width, canvas.height);
      g_playerManager.forEachPlayer(function(player) {
        player.reset();
      });
    };

    resetLevel();

    // Add a 2 players if there is no communication
    if (!globals.haveServer) {
      startLocalPlayers();
    }

    var mainloop = function() {
      if (renderer.resize()) {
        resetLevel();
      }

      g_services.entitySystem.processEntities();

      renderer.begin();
      g_services.levelManager.draw(renderer);
      g_services.drawSystem.processEntities(renderer);
      renderer.end();
    };

    GameSupport.run(globals, mainloop);
  };

  ImageLoader.loadImages(images, processImages);

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
    '../../scripts/tdl/textures',
    '../../scripts/tdl/webgl',
    '../../scripts/audio',
    '../../scripts/entitysystem',
    '../../scripts/gamesupport',
    '../../scripts/imageloader',
    '../../scripts/imageprocess',
    '../../scripts/input',
    '../../scripts/misc',
    './levelmanager',
    './playermanager',
    './webglrenderer',
  ],
  main
);


