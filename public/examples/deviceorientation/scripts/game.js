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
    GameSupport,
    Misc,
    ThreeFoo,
    AudioManager,
    EntitySystem,
    Goal,
    PlayerManager) {

  var g_canvas;
  var g_services = {};

  // You can set these from the URL with
  // http://path/gameview.html?settings={name:value,name:value}
  var globals = {
    audio: true,
    showCorners: false,
    showSphere: false,
    maxShots: 2,
    shotDuration: 5,
    shotInterval: 1,
    shotVelocity: 400,
    goalSize: 40,
    port: 8080,
    haveServer: true,
    areaSize: 300,
    time: 0,
    clearColor: 0x000000,
  };
  window.g = globals;

  function $(id) {
    return document.getElementById(id);
  }

  function startPlayer(netPlayer, name) {
    return playerManager.createPlayer(name, netPlayer);
  }

  Misc.applyUrlSettings(globals);

  g_canvas = $("canvas");
  var renderer = new THREE.WebGLRenderer({canvas: g_canvas});
  g_services.renderer = renderer;
  var camera = new THREE.PerspectiveCamera(70, g_canvas.clientWidth / g_canvas.clientHeight, 1, 2000);
  g_services.camera = camera;
  camera.position.z = 800;

  var scene = new THREE.Scene();
  g_services.scene = scene;
  var geometry = {};
  g_services.geometry = geometry;
  geometry.playerMesh = new THREE.CylinderGeometry(
    0, 20, 40, 4, 1, false);
  geometry.shotMesh = new THREE.BoxGeometry(10, 10, 10);
  geometry.goalMesh = new THREE.SphereGeometry(globals.goalSize, 16, 8);

  var light1 = new THREE.DirectionalLight(0xE0E0FF, 1);
  light1.position.set(200, 500, 200);
  scene.add(light1);
  var light1 = new THREE.DirectionalLight(0xFFE0E0, 0.5);
  light1.position.set(-200, -500, -200);
  scene.add(light1);

  if (globals.showSphere) {
    var sphere = new THREE.SphereGeometry(50, 16, 8);
    var material = new THREE.MeshPhongMaterial({
      ambient: 0x030303,
      color: 0x0000FF,
      specular: 0xFFFFFF,
      shininess: 30,
      shading: THREE.FlatShading,
    });
    var sphereMesh = new THREE.Mesh(sphere, material);
    scene.add(sphereMesh);
  }

  if (globals.showCorners) {
    var geo = new THREE.BoxGeometry(5, 5, 5);
    var material = new THREE.MeshPhongMaterial({
      ambient: 0x808080,
      color: 0xFFFFFFFF,
      specular: 0xFFFFFF,
      shininess: 30,
      shading: THREE.FlatShading,
    });
    var addMesh = function(x, y, z) {
      var mesh = new THREE.Mesh(geo, material);
      mesh.position.set(x, y, z);
      scene.add(mesh);
    };
    addMesh(-globals.areaSize, -globals.areaSize, -globals.areaSize);
    addMesh( globals.areaSize, -globals.areaSize, -globals.areaSize);
    addMesh(-globals.areaSize,  globals.areaSize, -globals.areaSize);
    addMesh( globals.areaSize,  globals.areaSize, -globals.areaSize);
    addMesh(-globals.areaSize, -globals.areaSize,  globals.areaSize);
    addMesh( globals.areaSize, -globals.areaSize,  globals.areaSize);
    addMesh(-globals.areaSize,  globals.areaSize,  globals.areaSize);
    addMesh( globals.areaSize,  globals.areaSize,  globals.areaSize);
  }


  g_services.globals = globals;
  g_services.renderer = renderer;

  var server;
  if (globals.haveServer) {
    server = new GameServer({
      gameId: "orient",
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
  };
  var audioManager = new AudioManager(globals.audio ? sounds : {});
  g_services.audioManager = audioManager;
  var entitySys = new EntitySystem();
  g_services.entitySystem = entitySys;
  var playerManager = new PlayerManager(g_services);
  g_services.playerManager = playerManager;

  g_services.goal = new Goal(g_services);

  function render() {
    if (g_canvas.width != g_canvas.clientWidth &&
        g_canvas.height != g_canvas.clientHeight) {
      camera.aspect = g_canvas.clientWidth / g_canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(g_canvas.clientWidth, g_canvas.clientHeight);
    }

    entitySys.processEntities();
    renderer.setClearColor(globals.clearColor, 1);
    renderer.render(scene, camera);

    if (globals.showSphere) {
      sphereMesh.rotation.x += globals.elapsedTime * 0.2;
      sphereMesh.rotation.z += globals.elapsedTime * 0.31;
    }
  }

  GameSupport.run(globals, render);
};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameserver',
    '../../../scripts/gamesupport',
    '../../../scripts/misc/misc',
    '../../../3rdparty/three/three.min',
    '../../scripts/audio',
    '../../scripts/entitysystem',
    'goal',
    'playermanager',
  ],
  main
);


