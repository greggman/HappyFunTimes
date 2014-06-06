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
    GameClient,
    SyncedClock,
    ThreeJS,
    Misc,
    Random,
    UI) {

  // You can set these from the URL with
  // http://path/gameview.html?settings={name:value,name:value}
  var globals = {
    port: 8080,
    master: false,

    // top left offset in rectangle of fullWidth x fullHeight for this instance.
    // width and height will be determined by the size of the canvas.
    x: 0,
    y: 0,

    shared: {
      // fullWidth and fullHeight define the size in css pixels of the entire display covering how ever
      // many windows/machines you have. For example, if you had 9 machines and each one
      // had a display 1024x768 and you put them all next to each other in a 3x3 grid
      // the fullWidth would be 1024*3 or 3072 and the fullHeight would be 768*3 or 2304
      fullWidth: 1000,
      fullHeight: 1000,

      // this is the field of view for fullHeight in degrees.
      fieldOfView: 50,

      zNear: 1,
      zFar: 10000,

      // Set to true to use window position for x,y above. See window-position-launcher.html
      useWindowPosition: false,

      // cameraPosition
      cameraPosition: {
        x: 0,
        y: 0,
        z: 0,
      },

      numBalls: 100,
    }
  };
  Misc.applyUrlSettings(globals);

  var noop = function() { };

  var handleSetMsg = function(data) {
    Misc.copyProperties(data, globals.shared);
  };

  var server;
  if (globals.server) {
    server = new GameServer({
      gameId: "syncThreeJS",
      disconnectPlayersIfGameDisconnects: false,
    });
    server.addEventListener('playerconnect', noop);
    server.addEventListener('connected', noop);
    server.addEventListener('disconnected', noop);

    var uiElement = $("ui");
    uiElement.style.display = "block";

    var addRange = function(label, propertyName, min, max) {
      var data = {};  // an object with just this one property

      data[propertyName] = globals.shared[propertyName];  // initial value

      UI.addRange(uiElement, label, data, propertyName, min, max, function() {
        // send the data to the server. It will come back on the client. See handleSetMsg
        server.broadcastCmd('set', data);
      });
    };

    // Only the server has ui
    addRange("field of view", "fieldOfView", 2, 170);
    addRange("number of balls", "numBalls", 1, 200);

    // Send all the shared settings in case we've restarted the server.
    server.broadcastCmd('set', globals.shared);

    var onMouseMove = function(event) {
      var x = event.clientX - window.innerWidth  / 2;
      var y = event.clientY - window.innerHeight / 2;
      server.broadcastCmd('set', { cameraPosition: {x: x, y: y}});
    };

    document.addEventListener('mousemove', onMouseMove, false);
  }

  var client = new GameClient({
    gameId: "syncThreeJS",
  });
  client.addEventListener('connected', noop);
  client.addEventListener('disconnected', noop);
  client.addEventListener('set', handleSetMsg);

  var clock = SyncedClock.createClock(true);

  var canvas = $("c");
  var renderer = new THREE.WebGLRenderer({canvas: canvas});
  renderer.setClearColor(0xffffff, 1);

  var camera = new THREE.PerspectiveCamera( 20, 1, 1, 10000 );
  var scene = new THREE.Scene();
  var sphereGeo = new THREE.SphereGeometry(40, 16, 8);

  var light = new THREE.DirectionalLight(0xE0E0FF, 1);
  light.position.set(200, 500, 200);
  scene.add(light);
  var light = new THREE.DirectionalLight(0xFFE0E0, 0.5);
  light.position.set(-200, -500, -200);
  scene.add(light);

  var balls = [];

  // Because we don't make all the balls at startup time we
  // need separate random functions for making balls vs moving them.
  var ballMakerRand = new Random.PseudoRandomGenerator();
  var ballMoveRand = new Random.PseudoRandomGenerator();

  var updateBalls = function() {
    while (balls.length < globals.shared.numBalls) {
      var color = Misc.rand32BitColor(ballMakerRand.randomInt.bind(ballMakerRand));
      var material = new THREE.MeshPhongMaterial({
        ambient: 0x808080,
        color: color,
        specular: 0xFFFFFF,
        shininess: 30,
        shading: THREE.FlatShading,
      });
      var mesh = new THREE.Mesh(sphereGeo, material);
      mesh.position.x = ballMakerRand.randomRange(-1000, 1000);
      mesh.position.y = ballMakerRand.randomRange(-1000, 1000);
      mesh.position.z = ballMakerRand.randomRange(-1000, 1000);

      // Put the balls on a node that's at tha origin. We can the just rotate this node
      // and the ball will orbit the center of the world.
      var center = new THREE.Object3D();

      // Give this node a random rotation. We'll just rotate the Z axis every frame
      // and it will have a unique orbit.
      center.rotation.x = ballMakerRand.randomRange(0, Math.PI);
      center.rotation.y = ballMakerRand.randomRange(0, Math.PI);
      center.add(mesh);
      scene.add(center);
      balls.push({center: center, mesh: mesh});
    }

    var time = clock.getTime();
    ballMoveRand.reset();
    for (var ii = 0; ii < balls.length; ++ii) {
      var ball = balls[ii];
      ball.mesh.visible = ii < globals.shared.numBalls;
      var speed = ballMoveRand.randomRange(0.2, 0.4);
      ball.center.rotation.z = speed * time;
    }
  };

  var render = function() {
    if (Misc.resize(canvas)) {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);  // don't fucking update the style. Why does three.js fight CSS? It should respect CSS :(
    }

    camera.setViewOffset(
        globals.shared.fullWidth, globals.shared.fullHeight,
        globals.x, globals.y,
        canvas.clientWidth, canvas.clientHeight);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.fov    = globals.shared.fieldOfView;
    camera.zNear  = globals.shared.zNear;
    camera.zFar   = globals.shared.zFar;
    camera.position.x = globals.shared.cameraPosition.x;
    camera.position.y = globals.shared.cameraPosition.y;
    camera.position.z = 800;
    camera.updateProjectionMatrix();

    if (globals.shared.useWindowPosition) {
      globals.x = window.screenX;
      globals.y = window.screenY;
    }

    updateBalls();

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  };
  render();
};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameserver',
    '../../../scripts/gameclient',
    '../../../scripts/syncedclock',
    '../../../3rdparty/three/three.min',
    '../../../scripts/misc/misc',
    '../../../scripts/misc/random',
    '../../../scripts/misc/ui',
  ],
  main
);


