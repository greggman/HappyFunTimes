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

// Require will call this with GameServer once gameserver.js has loaded
var main = function(GameServer) {
  var statusElem = document.getElementById("status");
  var canvas = document.getElementById("playfield");
  var ctx = canvas.getContext("2d");
  var itemSize = 15;
  var players = [];

  var resizeCanvas = function() {
    var width = canvas.clientWidth;
    var height = canvas.clientHeight
    if (canvas.width != width ||
        canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  var randInt = function(range) {
    return Math.floor(Math.random() * range);
  };

  var pickRandomPosition = function() {
    return {
      x: 30 + randInt(canvas.width  - 60),
      y: 30 + randInt(canvas.height - 60),
    };
  };

  var Goal = function() {
      this.pickGoal();
      this.radiusesSquared = itemSize * 2 * itemSize;
  };

  Goal.prototype.pickGoal = function() {
    this.position = pickRandomPosition();
  };

  Goal.prototype.hit = function(otherPosition) {
    var dx = otherPosition.x - this.position.x;
    var dy = otherPosition.y - this.position.y;
    return dx * dx + dy * dy < this.radiusesSquared;
  };

  var Player = function(netPlayer, name) {
    this.netPlayer = netPlayer;
    this.name = name;
    this.position = pickRandomPosition();
    this.color = "green";

    netPlayer.addEventListener('disconnect', Player.prototype.disconnect.bind(this));
    netPlayer.addEventListener('move', Player.prototype.movePlayer.bind(this));
    netPlayer.addEventListener('color', Player.prototype.setColor.bind(this));
  };

  // The player disconnected.
  Player.prototype.disconnect = function() {
    for (var ii = 0; ii < players.length; ++ii) {
      var player = players[ii];
      if (player === this) {
        players.splice(ii, 1);
        return;
      }
    }
  };

  Player.prototype.movePlayer = function(cmd) {
    this.position.x = Math.floor(cmd.x * canvas.clientWidth);
    this.position.y = Math.floor(cmd.y * canvas.clientHeight);
    if (goal.hit(this.position)) {
      // This will generate a 'scored' event on the client (player's smartphone)
      // that corresponds to this player.
      this.netPlayer.sendCmd('scored', {
        points: 5 + randInt(6), // 5 to 10 points
      });
      goal.pickGoal();
    }
  };

  Player.prototype.setColor = function(cmd) {
    this.color = cmd.color;
  };

  var server = new GameServer({
    gameId: "simple",
  });
  var goal = new Goal();

  server.addEventListener('connect', function() {
    statusElem.innerHTML ="you've connected to the relayserver";
  });

  server.addEventListener('disconnect', function() {
    statusElem.innerHTML = "you were disconnected from the relayserver";
  });

  // A new player has arrived.
  server.addEventListener('playerconnect', function(netPlayer, name) {
    players.push(new Player(netPlayer, name));
  });

  var drawItem = function(position, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(position.x, position.y, itemSize, 0, Math.PI * 2);
    ctx.fill();
  };

  var frameCount = 0;
  var render = function() {
    ++frameCount;

    resizeCanvas();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    players.forEach(function(player) {
      drawItem(player.position, player.color);
    });
    drawItem(goal.position, (frameCount & 4) ? "red" : "pink");

    requestAnimationFrame(render);
  };
  render();


};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameserver',
  ],
  main
);


