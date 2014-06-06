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

// Require will call this with GameServer, GameSupport, and Misc once
// gameserver.js, gamesupport.js, and misc.js have loaded.
var main = function(GameServer, GameSupport, Misc) {
  var statusElem = document.getElementById("status");
  var canvas = document.getElementById("playfield");
  var ctx = canvas.getContext("2d");
  var players = [];
  var globals = {
    itemSize: 15,
  };
  Misc.applyUrlSettings(globals);

  var pickRandomPosition = function() {
    return {
      x: 30 + Misc.randInt(canvas.width  - 60),
      y: 30 + Misc.randInt(canvas.height - 60),
    };
  };

  var Goal = function() {
      this.pickGoal();
      this.radiusesSquared = globals.itemSize * 2 * globals.itemSize;
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
        points: 5 + Misc.randInt(6), // 5 to 10 points
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
  GameSupport.init(server, globals);

  var goal = new Goal();

  // A new player has arrived.
  server.addEventListener('playerconnect', function(netPlayer, name) {
    players.push(new Player(netPlayer, name));
  });

  var drawItem = function(position, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(position.x, position.y, globals.itemSize, 0, Math.PI * 2);
    ctx.fill();
  };

  var render = function() {
    Misc.resize(canvas);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    players.forEach(function(player) {
      drawItem(player.position, player.color);
    });
    drawItem(goal.position, (globals.frameCount & 4) ? "red" : "pink");
  };
  GameSupport.run(globals, render);
};

// Start the main app logic.
requirejs([
    '../../../scripts/gameserver',
    '../../../scripts/gamesupport',
    '../../../scripts/misc/misc',
  ],
  main
);


