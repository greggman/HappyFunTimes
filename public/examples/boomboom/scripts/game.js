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
    GameSupport,
    Input,
    Misc,
    Timeout,
    Textures,
    WebGL,
    AudioManager,
    EntitySystem,
    ImageLoader,
    ImageProcess,
    SpriteManager,
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
  g_services.bombManager = new EntitySystem();
  g_services.misc = Misc;
  var stop = false;

  // You can set these from the URL with
  // http://path/gameview.html?settings={name:value,name:value}
  var globals = {
    port: 8080,
    haveServer: true,
    numLocalPlayers: 0,  // num players when local (ie, debugger)
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
    waitForPlayersDuration: 10,   // seconds to wait for player
    waitForStartDuration: 3,      // seconds to wait with "Ready?"
    waitForGo: 1,                 // seconds to wait with "Go!"
    waitForEnd: 3,                // seconds to pause after a winner is known
    waitForWinnerDuration: 6,     // seconds to show "Winner!"
    roundDuration: 120,           // seconds per round
    hurryTime: 30,                // seconds left when "hurry" (music goes faster)
    tileAnimSpeed: 16,            // how fast the tile animations runs
    //
    idleAnimSpeed: 4,
    // walk stuff
    walkAnimSpeed: 0.2,
    walkSpeed: 64,
    // bomb stuff
    numStartingBombs: 1,          // how many bombs a player gets to start
    numSpoilBombs: 1,             // how many bombs a player gets when spoiling
    bombStartSize: 1,             // starting size of bombs
    bombSpoilSize: 2,             // size of bombs when spoiling
    bombDuration: 2,              // time bomb ticks
    explosionDuration: 0.5,       // time bomb as at full size
    unexplodeTickDuration: 0.025, // time per tile as bomb contracts.
    lobSpeed: 48,
    lobBounceHeight: 2,           //
    // die stuff
    dieColorSpeed: 2,             // speed to rotate color on death
    dieDuration: 2,               // seconds to flash death colors
    dieScaleSpeed: 20,
    dieRotationSpeed: 16,
    evaporateDuration: 0.5,       // seconds to evaporate character after deth
    // spoil stuff
    reappearDuration: 2,          // seconds to reappear
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
      var player = g_playerManager.startPlayer(netPlayer, "Player" + (ii + 1));
      player.hideName = ii >= 2;
      players.push(player);
      abutton.push(false);
    }

    if (globals.ai) {
      for (var ii = 2; ii < netPlayers.length; ++ii) {
        Timeout.setInterval(function(netPlayer) {
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
    keys["B".charCodeAt(0)] = function(e) { handleAbutton(1, e.pressed); }
    keys["N".charCodeAt(0)] = function(e) { handleShow(1, e.pressed); }
    keys["C".charCodeAt(0)] = function(e) { handleTestSound(e.pressed); }
    Input.setupKeys(keys);
    Input.setupKeyboardDPadKeys(handleDPad);
  }

  Misc.applyUrlSettings(globals);

  g_services.globals = globals;

  var server;
  if (globals.haveServer) {
    var server = new GameServer({
      gameId: "boomboom",
    });
    g_services.server = server;
    server.addEventListener('playerconnect', g_playerManager.startPlayer.bind(g_playerManager));
  }

  GameSupport.init(server, globals);
  var gameManager = new GameManager(g_services);
  g_services.gameManager = gameManager;

  var canvas = $("playfield");
  var gl = WebGL.setupWebGL(canvas, {alpha:false});
  if (!gl) {
    gameManager.showOverlay(false);
    gameManager.showTime(false);
    $("overlay").style.display = "none";
    return;
  }
  var renderer = new WebGLRenderer(g_services, canvas, gl);
  g_services.spriteManager = new SpriteManager();
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

    var sprites = {
      goldCrate:  0x0005,
      kickCrate:  0x0006,
      bombCrate:  0x0007,
      flameCrate: 0x0008,
      crate:      0x0009,
      bush:       0x0003,
    };

    var cutTile = function(xy, ii) {
      var tx = (((xy >> 0) & 0xFF)     );
      var ty = (((xy >> 8) & 0xFF) + ii);
      var img = ImageProcess.cropImage(images.tiles0.img, tx * 16, ty * 16, 16, 16);
      return createTexture(img);
    };

    var cutGroup = function(sprites, opt_offset) {
      var group = { };
      opt_offset = opt_offset || 0;
      for (var spriteName in sprites) {
        var img = cutTile(sprites[spriteName], opt_offset);
        group[spriteName] = img;
      }
      return group;
    };

    images.avatar = [];
    for (var ii = 0; ii < 4; ++ii) {
      images.avatar.push(cutGroup(avatarSprites, ii));
    }
    images.bomb = {
      frames: [],
    };
    for (var ii = 0; ii < bombSprites.length; ++ii) {
      images.bomb.frames.push(cutTile(bombSprites[ii], 0));
    }
    images.sprites = cutGroup(sprites);

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

    globals.numLocalPlayers = Math.min(globals.numLocalPlayers, gameManager.computeMaxPlayersForScale(1, 1));

    // Add a 2 players if there is no communication
    startLocalPlayers();

    // make the level after making the players. This calls
    // player reset.
    gameManager.reset();

    var tileAnimClock = 0;

    var mainloop = function() {
      if (renderer.resize()) {
        gameManager.reset();
      }

      Timeout.process(globals.elapsedTime);
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
      g_services.spriteManager.draw();
      renderer.end();
    };

    GameSupport.run(globals, mainloop);
  };

  ImageLoader.loadImages(images, processImages);

  var startBGM = function() {
    if (globals.playBGM) {
      g_services.bgm = g_services.audioManager.playSound('bgm', 0, true);
    }
  };

  var sounds = {
    placeBomb:         { jsfx: ["sine",0.0000,0.4000,0.0000,0.1260,0.0840,0.0720,110.0000,548.0000,2400.0000,-0.7300,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.2700,0.2000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.1730,0.0000]      , },
    explode:           { jsfx: ["noise",0.0000,0.2360,0.0000,0.4180,1.8690,0.5380,20.0000,300.0000,2400.0000,-0.0940,0.0000,0.0000,0.3939,0.0679,0.1400,-0.7120,0.8100,0.0000,0.0000,0.4600,-0.1000,-0.0300,0.9900,-0.0660,0.9990,0.0000,0.0000]  , },
    die:               { jsfx: ["square",0.0000,0.4020,0.0000,1.0660,0.0000,0.2680,20.0000,262.0000,2400.0000,-0.3060,0.0000,0.6590,12.2475,0.4319,-0.1960,0.3320,0.0000,0.0000,-0.0140,0.0000,0.0000,0.0000,1.0000,-0.0100,0.0000,0.0000,-1.0000], },
    dieOld:            { jsfx: ["saw",0.0000,0.4020,0.0000,1.0660,0.0000,0.2680,20.0000,262.0000,2400.0000,-0.3060,0.0000,0.6590,12.2475,0.4319,-0.1960,0.3320,0.0000,0.0000,-0.0140,0.0000,0.0000,0.0000,1.0000,-0.0100,0.0000,0.0000,-1.0000]   , },
    pickup:            { jsfx: ["sine",0.0000,0.4000,0.0000,0.2860,0.0000,0.2760,20.0000,1006.0000,2400.0000,-0.6120,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.2190,0.1860,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]      , },
    reappear:          { jsfx: ["square",0.0000,0.4000,0.1740,1.1080,1.3530,0.5660,20.0000,422.0000,2400.0000,-0.4340,0.2980,0.4530,17.2864,0.0003,0.0000,0.5740,0.1740,0.0000,-0.1260,0.1280,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]   , },
    bounce:            { jsfx: ["sine",0.0000,0.4000,0.0000,0.0000,0.1980,0.1320,20.0000,249.0000,2400.0000,-0.5620,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.1840,0.0000]       , },
    bgm:               { music: true, filename: "assets/MSTR_-_MSTR_-_Choro_bavario_Loop.ogg", },
    swingup:           { jsfx: ["square",0.0000,0.4000,0.0000,0.0120,0.4560,0.4600,20.0000,1176.0000,2400.0000,0.0000,1.0000,0.0000,0.0100,0.0003,0.0000,0.4740,0.2480,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000], },
    coinishAxe:        { jsfx: ["square",0.0000,0.4000,0.0000,0.0200,0.4080,0.3400,20.0000,692.0000,2400.0000,0.0000,0.0000,0.0000,0.0100,0.0003,0.0000,0.4740,0.1110,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000] , },
    takeHitShotsound3: { jsfx: ["saw",0.0000,0.4000,0.0000,0.1200,0.0000,0.3580,20.0000,988.0000,2400.0000,-0.6800,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.3755,0.0180,0.0000,0.0760,0.1760,1.0000,0.0000,0.0000,0.0000,0.0000]   , },
    tinnySwingUp:      { jsfx: ["saw",0.0000,0.4000,0.0000,0.0620,0.0000,0.2400,20.0000,596.0000,2400.0000,0.6180,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.4080,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]    , },
    beamMeUp:          { jsfx: ["square",0.0000,0.4000,0.0000,0.3480,0.0000,0.4040,20.0000,550.0000,2400.0000,0.2420,0.0000,0.6560,37.2982,0.0003,0.0000,0.0000,0.0000,0.3500,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000], },
    stunned:           { jsfx: ["saw",0.0000,0.4000,0.0000,0.2520,0.0000,0.4220,20.0000,638.0000,2400.0000,0.0720,0.0000,0.2100,10.5198,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]   , },
    mellowStunned:     { jsfx: ["saw",0.0000,0.4000,0.0000,0.0660,0.0000,0.3380,20.0000,455.0000,2400.0000,0.0760,0.0000,0.3150,11.0477,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]   , },

    s01: { jsfx: ["sine",0.0000,0.4000,0.5980,1.7220,2.3190,1.8360,1254.0000,1938.0000,788.0000,-0.9560,-0.4620,0.9680,11.3836,0.3513,0.4760,0.6620,0.1460,0.3025,0.7360,0.5592,0.8640,-0.6040,0.5090,0.2000,0.2840,0.0790,0.4660]      , },
    s02: { jsfx: ["square",0.0000,0.4000,0.1940,1.6020,0.5730,0.6580,2322.0000,2045.0000,2119.0000,-0.9500,-0.8140,0.0820,7.0645,0.0133,0.0500,0.8700,0.5680,0.4215,-0.2820,0.6608,-0.7340,0.6680,0.4040,-0.3500,0.7630,0.7930,0.7620]  , },
    s03: { jsfx: ["saw",0.0000,0.4000,0.2920,0.8200,1.0710,1.3200,1693.0000,1445.0000,1264.0000,-0.5400,0.9080,0.4770,9.7520,-0.0010,-0.3100,-0.2260,0.2810,0.2095,-0.2400,0.7184,-0.3740,0.3360,0.5160,-0.2700,0.6290,0.2880,0.2980]   , },
    s04: { jsfx: ["synth",0.0000,0.4000,0.4480,1.3320,0.3540,0.5220,176.0000,445.0000,1067.0000,0.8340,0.3920,0.4790,24.1970,0.8284,0.2440,0.7220,0.8090,0.0045,0.7900,0.5704,0.5100,0.9600,0.5870,0.3120,0.5890,0.9660,0.8900]         , },
    s05: { jsfx: ["noise",0.0000,0.4000,0.1910,0.6920,1.6080,1.8580,2155.0000,1589.0000,2396.0000,-0.7620,0.3240,0.3640,32.2593,0.7426,-0.5060,-0.2740,0.9420,0.4915,-0.9640,0.3448,0.5580,-0.0940,0.4490,-0.6180,0.9520,0.9030,0.9880] , },
    s06: { jsfx: ["saw",0.0000,0.4000,0.4450,1.6420,2.3100,0.5360,835.0000,1226.0000,133.0000,0.4520,-0.4600,0.5290,3.8972,0.7140,-0.1380,0.7140,0.7710,0.4980,-0.8280,0.0688,-0.7800,0.5140,0.5790,-0.8080,0.8670,0.5680,0.0740]       , },
    s07: { jsfx: ["square",0.0000,0.4000,0.7110,0.9080,1.7190,1.0980,1189.0000,1079.0000,721.0000,0.8680,0.9740,0.7320,45.4085,-0.0192,-0.5460,-0.2940,0.5570,0.2145,0.9220,0.2112,-0.4460,0.1260,0.3310,0.2100,0.6890,0.9990,0.0800]   , },
    s08: { jsfx: ["saw",0.0000,0.4000,0.0000,0.3760,0.0000,0.4360,20.0000,491.0000,2400.0000,0.2300,0.0000,0.6140,36.2904,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]            , },
    s09: { jsfx: ["square",0.0000,0.4000,0.0000,0.3120,0.0000,0.4940,20.0000,533.0000,2400.0000,0.0640,0.0000,0.6000,31.9233,0.0003,0.0000,0.0000,0.0000,0.5000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]         , },
    s10: { jsfx: ["square",0.0000,0.4000,0.0000,0.2960,0.0000,0.3600,20.0000,497.0000,2400.0000,0.1880,0.0000,0.6060,32.0193,0.0003,0.0000,0.0000,0.0000,0.0125,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]         , },
    s11: { jsfx: ["square",0.0000,0.4000,0.0000,0.2160,0.0000,0.4120,20.0000,608.0000,2400.0000,0.2240,0.0000,0.5820,15.5108,0.0003,0.0000,0.0000,0.0000,0.3315,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]         , },
    s12: { jsfx: ["saw",0.0000,0.4000,0.0000,0.0420,0.0000,0.2000,20.0000,608.0000,2400.0000,0.2060,0.0000,0.4090,23.6211,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]            , },
    s13: { jsfx: ["square",0.0000,0.4000,0.0000,0.0600,0.0000,0.3120,20.0000,533.0000,2400.0000,0.0520,0.0000,0.1700,12.7753,0.0003,0.0000,0.0000,0.0000,0.2345,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]         , },
    s14: { jsfx: ["saw",0.0000,0.4000,0.0000,0.0320,0.0000,0.4200,20.0000,643.0000,2400.0000,0.0900,0.0000,0.6060,10.2319,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]            , },
    s15: { jsfx: ["square",0.0000,0.4000,0.0000,0.2520,0.0000,0.1660,20.0000,534.0000,2400.0000,0.2420,0.0000,0.3690,27.2683,0.0003,0.0000,0.0000,0.0000,0.1030,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]         , },
    s16: { jsfx: ["synth",0.0000,0.4000,0.6550,1.4680,2.5350,0.5840,2379.0000,2327.0000,463.0000,0.7460,-0.8520,0.4240,30.3397,0.4904,-0.0600,0.9260,0.2620,0.1735,0.6120,0.5656,0.5760,-0.0060,0.8100,0.3700,0.0900,0.6270,0.1400]     , },
    s17: { jsfx: ["synth",0.0000,0.4000,0.9830,0.7140,1.5570,1.0200,444.0000,1502.0000,2275.0000,-0.9600,0.2020,0.4350,8.9361,0.4917,-0.8860,0.5400,0.2850,0.0435,-0.4200,0.5656,-0.8280,0.3340,0.2030,-0.1440,0.9500,0.5480,0.6220]    , },
  };
  var audioManager = new AudioManager(sounds, { callback: startBGM });
  g_services.audioManager = audioManager;
};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameserver',
    '../../../scripts/localnetplayer',
    '../../../scripts/gamesupport',
    '../../../scripts/misc/input',
    '../../../scripts/misc/misc',
    '../../../scripts/misc/timeout',
    '../../../3rdparty/tdl/textures',
    '../../../3rdparty/tdl/webgl',
    '../../scripts/audio',
    '../../scripts/entitysystem',
    '../../scripts/imageloader',
    '../../scripts/imageprocess',
    '../../scripts/spritemanager',
    './gamemanager',
    './levelmanager',
    './playermanager',
    './webglrenderer',
  ],
  main
);


