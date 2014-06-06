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
    GameSupport,
    GameServer,
    LocalNetPlayer,
    Input,
    Misc,
    Speedup,
    AudioManager,
    EntitySystem,
    PlayerManager) {

  var g_debug = false;
  var g_services = {};

  var g_entitySystem = new EntitySystem();
  g_services.entitySystem = g_entitySystem;
  var g_drawSystem = new EntitySystem("draw");
  g_services.drawSystem = g_drawSystem;
  var g_playerManager = new PlayerManager(g_services);
  g_services.playerManager = g_playerManager;
  g_services.misc = Misc;
  g_services.speedup = Speedup;

  var sounds = {
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
  };
  var audioManager = new AudioManager(sounds);
  g_services.audioManager = audioManager;
  var stop = false;

  // You can set these from the URL with
  // http://path/gameview.html?settings={name:value,name:value}
  var globals = {
    port: 8080,
    haveServer: true,
    numLocalPlayers: 2,  // num players when local (ie, debugging)
    force2d: false,
    debug: false,
    playerMoveSpeed: 192,
    playerShotRate: 0.25,
    maxShotsPerPlayer: 3,
    shotVelocity: 400,
    shotDuration: 3,
  };

  function startLocalPlayers() {
    var localNetPlayers = [];
    for (var ii = 0; ii < globals.numLocalPlayers; ++ii) {
      var localNetPlayer = new LocalNetPlayer();
      var player = g_playerManager.startPlayer(localNetPlayer, "Player" + (ii + 1));
      localNetPlayers.push(localNetPlayer);
    }
    var localNetPlayer1 = localNetPlayers[0];

    Input.setupKeyboardDPadKeys(function(e) {
      localNetPlayer1.sendEvent('pad', {pad: e.pad, dir: e.info.direction});
    });
  }

  var resize = function(canvas) {
    Misc.resize(canvas);
    globals.width = canvas.clientWidth;
    globals.height = canvas.clientHeight;
  };

  Misc.applyUrlSettings(globals);

  g_services.globals = globals;

  var server;
  if (globals.haveServer) {
    server = new GameServer({
      gameId: "shootshoot",
    });
    g_services.server = server;
    server.addEventListener('playerconnect', g_playerManager.startPlayer.bind(g_playerManager));
  }
  GameSupport.init(server, globals);

  var canvas = $("canvas");
  var ctx = canvas.getContext("2d");

  resize(canvas);

  // Add a 2 players if there is no communication
  if (!globals.haveServer) {
    startLocalPlayers();
  }

  function render() {
    g_entitySystem.processEntities();

    resize(canvas);

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    g_drawSystem.processEntities(ctx);
  }
  GameSupport.run(globals, render);

};

// Start the main app logic.
requirejs([
    '../../../scripts/gamesupport',
    '../../../scripts/gameserver',
    '../../../scripts/localnetplayer',
    '../../../scripts/misc/input',
    '../../../scripts/misc/misc',
    '../../../scripts/misc/speedup',
    '../../scripts/audio',
    '../../scripts/entitysystem',
    './playermanager',
  ],
  main
);


