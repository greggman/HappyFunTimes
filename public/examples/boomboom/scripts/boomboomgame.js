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
    SpriteRenderer,
    GameManager,
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
    ai: false,
    debug: false,
    tileInspector: false,
    showState: false,
    grid: false,
    step: false,
    scale: 2,
    forceScale: false,
    playBGM: true,
    frameCount: 0,
    crateProb: [
      { tileName: 'goldCrate',  prob:  1, },
     // { tileName: 'kickCrate',  prob:  3, },
      { tileName: 'bombCrate',  prob:  6, },
      { tileName: 'flameCrate', prob:  9, },
      { tileName: 'empty',      prob: 20, },
    ],
    // game stuff
    waitForPlayersDuration: 10,
    waitForStartDuration: 3,
    waitForGo: 1,
    waitForEnd: 3,
    waitForWinnerDuration: 6,
    roundDuration: 120,
    //
    tileAnimSpeed: 16,
    idleAnimSpeed: 4,
    // walk size
    walkAnimSpeed: 0.2,
    walkSpeed: 64,
    // bomb stuff
    numStartingBombs: 1,          // how many bombs a player gets to start
    bombStartSize: 1,             // starting size of bombs
    bombDuration: 2,              // time bomb ticks
    explosionDuration: 0.5,       // time bomb as at full size
    unexplodeTickDuration: 0.025, // time per tile as bomb contracts.
    // die stuff
    dieColorSpeed: 2,
    dieDuration: 2,
    dieScaleSpeed: 20,
    dieRotationSpeed: 16,
    evaporateDuration: 0.5,
    columnRowSpace: 3,
  };
window.g = globals;

  // Expand the probabitilites for easier selection
  var probTable = [];
  for (var ii = 0; ii < globals.crateProb.length; ++ii) {
    var probInfo = globals.crateProb[ii];
    for (var jj = 0; jj < probInfo.prob; ++jj) {
      probTable.push(probInfo);
    }
  }
  globals.crateProbTable = probTable;

  function startLocalPlayers() {
    var players = [];
    var netPlayers = [];
    var abutton = [];
    for (var ii = 0; ii < globals.numLocalPlayers; ++ii) {
      var netPlayer = new LocalNetPlayer();
      netPlayers.push(netPlayer);
      players.push(g_playerManager.startPlayer(netPlayer, "Player" + (ii + 1)));
      abutton.push(false);
    }

    if (globals.ai) {
      for (var ii = 2; ii < netPlayers.length; ++ii) {
        setInterval(function(netPlayer) {
          return function() {
            var r = Misc.randInt(7);
            switch (r) {
            case 0:
            case 1:
            case 2:
            case 3:
              netPlayer.sendEvent('pad', {pad: 0, dir: r * 2});
              break;
            case 4:
            case 5:
              netPlayer.sendEvent('abutton', {abutton: r == 4});
              break;
            }
          };
        }(netPlayers[ii]), 1000 + Misc.randInt(1000));
      }
    }

    var handleDPad = function(e) {
      var localNetPlayer = netPlayers[e.pad];
      if (localNetPlayer) {
        localNetPlayer.sendEvent('pad', {pad: e.pad, dir: e.info.direction});
      }
    };

    var handleAbutton = function(player, pressed) {
      var localNetPlayer = netPlayers[player];
      if (localNetPlayer) {
        if (abutton[player] != pressed) {
          abutton[player] = pressed;
          localNetPlayer.sendEvent('abutton', {
              abutton: pressed,
          });
        }
      }
    };

    var handleShow = function(player, pressed) {
      var localNetPlayer = netPlayers[player];
      if (localNetPlayer) {
        localNetPlayer.sendEvent('show', {show:pressed});
      }
    };

    var handleTestSound = (function() {
      var soundNdx = 0;
      var soundIds;
      return function(pressed) {
        if (pressed) {
          if (!soundIds) {
            soundIds = Object.keys(sounds);
            console.log(sounds);
          }
          var found = false;
          while (!found) {
            var id = soundIds[soundNdx];
            soundNdx = (soundNdx + 1) % soundIds.length;
            var sound = sounds[id];
            if (!sound.music) {
              console.log("play: " + id);
              g_services.audioManager.playSound(id);
              found  = true;
            }
          }
        }
      };
    }());

    var keys = { };
    keys["Z".charCodeAt(0)] = function(e) { handleAbutton(0, e.pressed); }
    keys["X".charCodeAt(0)] = function(e) { handleShow(0, e.pressed); }
    keys[".".charCodeAt(0)] = function(e) { handleAbutton(1, e.pressed); }
    keys["C".charCodeAt(0)] = function(e) { handleTestSound(e.pressed); }
    Input.setupKeys(keys);
    Input.setupKeyboardDPadKeys(handleDPad);
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
  g_services.spriteRenderer = new SpriteRenderer();
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
    tiles0:  { url: "assets/bomb_party-00.png", },
    tiles1:  { url: "assets/bomb_party-01.png", },
    tiles2:  { url: "assets/bomb_party-02.png", },
    tiles3:  { url: "assets/bomb_party-03.png", },
  };
  g_services.images = images;

  var createTexture = function(img) {
    var tex = Textures.loadTexture(img);
    tex.setParameter(gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    tex.setParameter(gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    tex.setParameter(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    tex.setParameter(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  };
  g_services.createTexture = createTexture;

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
    var cutTile = function(xy, ii) {
      var tx = (((xy >> 0) & 0xFF)     );
      var ty = (((xy >> 8) & 0xFF) + ii);
      var img = ImageProcess.cropImage(images.tiles0.img, tx * 16, ty * 16, 16, 16);
      return createTexture(img);
    };
    for (var ii = 0; ii < 4; ++ii) {
      var avatar = {};
      for (var spriteName in avatarSprites) {
        var img = cutTile(avatarSprites[spriteName], ii);
        avatar[spriteName] = img;
      }
      images.avatar.push(avatar);
    }
    images.bomb = {
      frames: [],
    };
    for (var ii = 0; ii < bombSprites.length; ++ii) {
      images.bomb.frames.push(cutTile(bombSprites[ii]), 0);
    }

    var tilesetTextures = [
      createTexture(images.tiles0.img),
      createTexture(images.tiles1.img),
      createTexture(images.tiles2.img),
      createTexture(images.tiles3.img),
    ];

    var tileset = {
      tileWidth: 16,
      tileHeight: 16,
      tilesAcross: 15,  // tiles across set
      tilesDown: 6,     // tiles across set
      texture: tilesetTextures[0],
    };
    var g_levelManager = new LevelManager(g_services, tileset);
    g_services.levelManager = g_levelManager;

    // Add a 2 players if there is no communication
    if (!globals.haveServer) {
      startLocalPlayers();
    }

    var gameManager = new GameManager(g_services);

    // make the level after making the players. This calls
    // player reset.
    gameManager.reset();

    var tileAnimClock = 0;

    var mainloop = function() {
      if (renderer.resize()) {
        gameManager.reset();
      }

      g_services.entitySystem.processEntities();

      renderer.begin();
      gl.disable(gl.BLEND);

      tileAnimClock += globals.tileAnimSpeed * globals.elapsedTime;
      var tilesTexture = tilesetTextures[(tileAnimClock | 0) % tilesetTextures.length];
      g_services.levelManager.layer0.setTiles(tilesTexture);
      g_services.levelManager.layer1.setTiles(tilesTexture);

      g_services.levelManager.draw(renderer);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      g_services.drawSystem.processEntities(renderer);
      renderer.end();
    };

    GameSupport.run(globals, mainloop);
  };

  ImageLoader.loadImages(images, processImages);

  var startBGM = function() {
    if (globals.playBGM) {
      g_services.audioManager.playSound('bgm', 0, true);
    }
  };

  var sounds = {
    placeBomb:         { jsfx: ["sine",0.0000,0.4000,0.0000,0.1260,0.0840,0.0720,110.0000,548.0000,2400.0000,-0.7300,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.2700,0.2000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.1730,0.0000] , },
    explode:           { jsfx: ["noise",0.0000,0.2360,0.0000,0.4180,1.8690,0.5380,20.0000,300.0000,2400.0000,-0.0940,0.0000,0.0000,0.3939,0.0679,0.1400,-0.7120,0.8100,0.0000,0.0000,0.4600,-0.1000,-0.0300,0.9900,-0.0660,0.9990,0.0000,0.0000], },
    die:               { jsfx: ["square",0.0000,0.4020,0.0000,1.0660,0.0000,0.2680,20.0000,262.0000,2400.0000,-0.3060,0.0000,0.6590,12.2475,0.4319,-0.1960,0.3320,0.0000,0.0000,-0.0140,0.0000,0.0000,0.0000,1.0000,-0.0100,0.0000,0.0000,-1.0000], },
    dieOld:            { jsfx: ["saw",0.0000,0.4020,0.0000,1.0660,0.0000,0.2680,20.0000,262.0000,2400.0000,-0.3060,0.0000,0.6590,12.2475,0.4319,-0.1960,0.3320,0.0000,0.0000,-0.0140,0.0000,0.0000,0.0000,1.0000,-0.0100,0.0000,0.0000,-1.0000], },
    bgm:               { music: true, filename: "assets/MSTR_-_MSTR_-_Choro_bavario_Loop.ogg", },
    swingup:           { jsfx: ["square",0.0000,0.4000,0.0000,0.0120,0.4560,0.4600,20.0000,1176.0000,2400.0000,0.0000,1.0000,0.0000,0.0100,0.0003,0.0000,0.4740,0.2480,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000], },
    coinishAxe:        { jsfx: ["square",0.0000,0.4000,0.0000,0.0200,0.4080,0.3400,20.0000,692.0000,2400.0000,0.0000,0.0000,0.0000,0.0100,0.0003,0.0000,0.4740,0.1110,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000] , },
    takeHitShotsound3: { jsfx: ["saw",0.0000,0.4000,0.0000,0.1200,0.0000,0.3580,20.0000,988.0000,2400.0000,-0.6800,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.3755,0.0180,0.0000,0.0760,0.1760,1.0000,0.0000,0.0000,0.0000,0.0000]   , },
    mellowPew:         { jsfx: ["sine",0.0000,0.4000,0.0000,0.2860,0.0000,0.2760,20.0000,1006.0000,2400.0000,-0.6120,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.2190,0.1860,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000] , },
    tinnySwingUp:      { jsfx: ["saw",0.0000,0.4000,0.0000,0.0620,0.0000,0.2400,20.0000,596.0000,2400.0000,0.6180,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.4080,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]    , },
    beamMeUp:          { jsfx: ["square",0.0000,0.4000,0.0000,0.3480,0.0000,0.4040,20.0000,550.0000,2400.0000,0.2420,0.0000,0.6560,37.2982,0.0003,0.0000,0.0000,0.0000,0.3500,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000], },
    stunned:           { jsfx: ["saw",0.0000,0.4000,0.0000,0.2520,0.0000,0.4220,20.0000,638.0000,2400.0000,0.0720,0.0000,0.2100,10.5198,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]   , },
    mellowStunned:     { jsfx: ["saw",0.0000,0.4000,0.0000,0.0660,0.0000,0.3380,20.0000,455.0000,2400.0000,0.0760,0.0000,0.3150,11.0477,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]   , },
  };
  var audioManager = new AudioManager(sounds, { callback: startBGM });
  g_services.audioManager = audioManager;
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
    '../../scripts/sprite',
    './gamemanager',
    './levelmanager',
    './playermanager',
    './webglrenderer',
  ],
  main
);


