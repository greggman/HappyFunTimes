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

      // Scale of the view.
      scale: 1,

      // Used to move the view around
      xOff: 0,
      yOff: 0,

      // Set to true to use window position for x,y above. See window-position-launcher.html
      useWindowPosition: false,

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
      gameId: "sync2d",
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
    addRange("x offset", "xOff", -1000, 1000);
    addRange("y offset", "yOff", -1000, 1000);
    addRange("scale", "scale", 0.5, 3);
    addRange("number of balls", "numBalls", 1, 200);

    // Send all the shared settings in case we've restarted the server.
    server.broadcastCmd('set', globals.shared);
  }

  var client = new GameClient({
    gameId: "sync2d",
  });
  client.addEventListener('connected', noop);
  client.addEventListener('disconnected', noop);
  client.addEventListener('set', handleSetMsg);

  var clock = SyncedClock.createClock(true);

  var canvas = $("c");
  var ctx = canvas.getContext("2d");

  // Assumes the context is already setup to draw in the correct place.
  // everything drawn must be synced to the clock
  var drawSomething = function() {
    var time = clock.getTime();

    ctx.save();

    // draw N balls. As this is using repeatable pseudo random function
    // the random like values will be the same every frame on every machine.
    Random.resetPseudoRandom();

    var maxDimension = Math.max(globals.shared.fullWidth, globals.shared.fullHeight);
    var minDimension = Math.min(globals.shared.fullWidth, globals.shared.fullHeight);

    for (var ii = 0; ii < globals.shared.numBalls; ++ii) {
      var speed       = Random.pseudoRandomRange(0.2, 0.4);
      var orbitRadius = Random.pseudoRandom();
      var angle       = Random.pseudoRandomRange(0, Math.PI * 2) * speed * time;
      var ballRadius  = Random.pseudoRandomRange(10, 80);
      var color       = Misc.randCSSColor(Random.pseudoRandomInt);

      // using eliptical orbits in case you line up your screens vertically or horizontally
      var x = Math.cos(angle) * orbitRadius * globals.shared.fullWidth / 2;
      var y = Math.sin(angle) * orbitRadius * globals.shared.fullHeight / 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.arc(0, 0, ballRadius, 0, Math.PI * 2, true);
      ctx.fillStyle = color;
      ctx.fill()
      ctx.restore();
    }

    ctx.restore();
  };

  var render = function() {
    Misc.resize(canvas);

    if (globals.shared.useWindowPosition) {
      globals.x = window.screenX;
      globals.y = window.screenY;
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.save();

    // set the transformation matrix to our position inside the larger full rect
    ctx.translate(-globals.x, -globals.y);

    // make the center of the full area our center
    ctx.translate(globals.shared.fullWidth / 2, globals.shared.fullHeight / 2);

    // Apply our global scale and offset.
    ctx.translate(globals.shared.xOff, globals.shared.yOff);
    ctx.scale(globals.shared.scale, globals.shared.scale);

    drawSomething(ctx);

    ctx.restore();

    requestAnimationFrame(render);
  };
  render();
};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameserver',
    '../../../scripts/gameclient',
    '../../../scripts/syncedclock',
    '../../../scripts/misc/misc',
    '../../../scripts/misc/random',
    '../../../scripts/misc/ui',
  ],
  main
);


