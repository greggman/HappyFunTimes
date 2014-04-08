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
    GameServer,
    AudioManager,
    EntitySystem,
    ThreeFoo,
    Misc,
    PlayerManager) {

  var g_canvas;
  var g_debug = false;
  var g_logGLCalls = false;
  var g_services = {};

  // You can set these from the URL with
  // http://path/gameview.html?settings={name:value,name:value}
  var globals = {
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

  function startPlayer(netPlayer, name) {
    return playerManager.createPlayer(name, netPlayer);
  }

  function showConnected() {
    $('outer').style.display = "block";
    $('disconnected').style.display = "none";
  }

  function showDisconnected() {
    $('outer').style.display = "none";
    $('disconnected').style.display = "block";
  }

  Misc.applyUrlSettings(globals);

  g_canvas = $("canvas");
  var renderer = new THREE.WebGLRenderer({canvas: g_canvas});
  g_services.renderer = renderer;
  var camera = new THREE.PerspectiveCamera(70, g_canvas.clientWidth / g_canvas.clientHeight, 1, 1000);
  g_services.camera = camera;
  camera.position.z = 400;

  var scene = new THREE.Scene();
  g_services.scene = scene;
  var geometry = {};
  g_services.geometry = geometry;
  geometry.cube = new THREE.BoxGeometry(200, 200, 200);

  g_services.globals = globals;
  g_services.renderer = renderer;

  var server = new GameServer({
    gameId: "orient",
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
  };
  var audioManager = new AudioManager(globals.audio ? sounds : {});
  g_services.audioManager = audioManager;
  var entitySys = new EntitySystem();
  g_services.entitySystem = entitySys;
  var playerManager = new PlayerManager(g_services);
  g_services.playerManager = playerManager;

  var then = (new Date()).getTime() * 0.001;
  render();
  function render() {
    var now = (new Date()).getTime() * 0.001;
    globals.elapsedTime = Math.min(now - then, 1 / 10);    // don't advance more then a 1/10 of a second;
    then = now;

    if (g_canvas.width != g_canvas.clientWidth &&
        g_canvas.height != g_canvas.clientHeight) {
      camera.aspect = g_canvas.clientWidth / g_canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(g_canvas.clientWidth, g_canvas.clientHeight);
    }

    entitySys.processEntities();
    renderer.render(scene, camera);

    requestAnimationFrame(render, g_canvas);
  }
};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameserver',
    '../../scripts/audio',
    '../../scripts/entitysystem',
    '../../scripts/three.min',
    '../../scripts/misc',
    'playermanager',
  ],
  main
);


