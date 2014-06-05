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
  var container = document.getElementById("playfield");
  var itemSize = 16;
  var playfieldWidth = 300;
  var playfieldHeight = 300;

  var randInt = function(range) {
    return Math.floor(Math.random() * range);
  };

  var pickRandomPosition = function() {
    return {
      x: randInt(playfieldWidth),
      y: randInt(playfieldHeight),
    };
  };

  var Visual = function(container) {
    this.element = document.createElement('div');
    this.element.className = "visual";
    container.appendChild(this.element);
  };

  Visual.prototype.setColor = function(color) {
    this.element.style.backgroundColor = color;
  };

  Visual.prototype.updatePosition = function(position) {
    this.element.style.left = position.x + "px";
    this.element.style.top  = position.y + "px";
  };

  Visual.prototype.remove = function() {
    this.element.parentNode.removeChild(this.element);
  };

  var Goal = function(container) {
    this.visual = new Visual(container);
    this.visual.setColor("red");
    this.pickGoal();
    this.radiusesSquared = itemSize * 2 * itemSize;
  };

  Goal.prototype.pickGoal = function() {
    this.position = pickRandomPosition();
    this.visual.updatePosition(this.position);
  };

  Goal.prototype.hit = function(otherPosition) {
    var dx = otherPosition.x - this.position.x;
    var dy = otherPosition.y - this.position.y;
    return dx * dx + dy * dy < this.radiusesSquared;
  };

  var Player = function(netPlayer, name, container) {
    this.netPlayer = netPlayer;
    this.name = name;
    this.visual = new Visual(container);
    this.position = pickRandomPosition();
    this.visual.updatePosition(this.position);

    netPlayer.addEventListener('disconnect', Player.prototype.disconnect.bind(this));
    netPlayer.addEventListener('move', Player.prototype.movePlayer.bind(this));
    netPlayer.addEventListener('color', Player.prototype.setColor.bind(this));
  };

  // The player disconnected.
  Player.prototype.disconnect = function() {
    this.netPlayer.removeAllListeners();
    this.visual.remove();
  };

  Player.prototype.movePlayer = function(cmd) {
    this.position.x = cmd.x;
    this.position.y = cmd.y;
    this.visual.updatePosition(this.position);
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
    this.visual.setColor(cmd.color);
  };

  var server = new GameServer({ gameId: "supersimple" });
  var goal = new Goal(container);

  server.addEventListener('connect', function() {
    statusElem.innerHTML ="you've connected to the relayserver";
  });

  server.addEventListener('disconnect', function() {
    statusElem.innerHTML = "you were disconnected from the relayserver";
  });

  // A new player has arrived.
  server.addEventListener('playerconnect', function(netPlayer, name) {
    new Player(netPlayer, name, container);
  });
};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameserver',
  ],
  main
);


