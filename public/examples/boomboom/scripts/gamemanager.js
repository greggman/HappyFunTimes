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

define([
    '../../../scripts/misc/grid',
    '../../../scripts/misc/misc',
    '../../../scripts/misc/mobilehacks',
    '../../../scripts/misc/strings',
  ], function(
    Grid,
    Misc,
    MobileHacks,
    Strings) {

  var s_validScales = [
    8, 7, 6, 5, 4, 3, 2, 1, //0.5,
  ];

  var $ = function(id) {
    return document.getElementById(id);
  };

  var GameManager = function(services) {
    this.services = services;
    this.services.entitySystem.addEntity(this);
    this.timeContainer = $("timeContainer");
    this.timeStyle = $("time").style;
    this.timeNode = Misc.createTextNode($("time"));
    this.overlay = $("overlay-inner");
    this.overlayLine1 = Misc.createTextNode($("overlay-line1"));
    this.overlayLine2 = Misc.createTextNode($("overlay-line2"));
    this.setState('waitForPlayers');
  };

  GameManager.prototype.showOverlay = function(show) {
    this.overlay.style.display = show ? "block" : "none";
  };

  GameManager.prototype.showTime = function(show) {
    this.timeContainer.style.display = show ? "block" : "none";
  };

  GameManager.prototype.updateTime = function() {
    var time = this.roundTimer | 0;
    if (time != this.oldRoundTimer) {
      this.oldRoundTimer = time;
      var mins = time / 60 | 0;
      var seconds = time % 60;
      this.timeNode.nodeValue = Strings.padLeft(mins, 2, '0') + ":" + Strings.padLeft(seconds, 2, '0');
    }
    var globals = this.services.globals;
    var color = time > 15 ? 'white' : ((globals.frameCount & 8) ? 'white' : 'red');
    if (this.oldTimeColor != color) {
      this.oldTimeColor = color;
      this.timeStyle.color = color;
    }
  };

  GameManager.prototype.computeMaxPlayersForScale = function(scale, step) {
    var levelManager = this.services.levelManager;
    var canvas = this.services.canvas;
    return levelManager.computeMaxPlayersForScale(canvas.width, canvas.height, scale, step);
  };

  GameManager.prototype.reset = function() {
    MobileHacks.fixHeightHack();
    var services = this.services;
    var levelManager = services.levelManager;
    var playerManager = services.playerManager;
    var globals = services.globals;
    var canvas = services.canvas;

    var tileWidth  = 16;
    var tileHeight = 16;

    var numPlayers = playerManager.getNumPlayersConnected();

    if (!globals.forceScale) {

      // Compute a good scale for the number of players.
      globals.scale = 1;
      for (var ii = 0; ii < s_validScales.length; ++ii) {
        var scale = s_validScales[ii];
        var numPlayersThatFitOnMapBy2 = this.computeMaxPlayersForScale(scale, 2);
        if (numPlayersThatFitOnMapBy2 >= numPlayers) {
          globals.scale = scale;
          break;
        }
      }
    }

    this.minPlayersBeforeNeedingHigherScale = this.computeMaxPlayersForScale(globals.scale + 1, 2);
    this.maxPlayersBeforeNeedingLowerScale = this.computeMaxPlayersForScale(globals.scale, 2);

    levelManager.makeLevel(canvas.width, canvas.height);
    var off = {};
    levelManager.getDrawOffset(off);
    if (globals.grid) {
      if (!services.grid) {
        services.grid = new Grid({
          container: $("grid"),
          columns: 1,
          rows: 1,
        });
      }
      services.grid.setDimensions(levelManager.tilesAcross, levelManager.tilesDown);
      var s = $("grid").style;
      s.display = "block";
      s.left = off.x + "px";
      s.top = off.y + "px";
      services.gridTable = [];
      services.grid.forEach(function(element, x, y) {
        if (services.gridTable.length < y + 1) {
          services.gridTable.push([]);
        }
        var pre = element.firstChild;
        var txt;
        if (pre) {
          txt = pre.firstChild;
        } else {
          pre = document.createElement("pre");
          txt = document.createTextNode("");
          pre.appendChild(txt);
          element.appendChild(pre);
        }
        txt.nodeValue = "" + x + "," + y;
        services.gridTable[y].push(txt);
      });
      var rule = Misc.findCSSStyleRule("#grid td");
      if (rule) {
        rule.style.width  = tileWidth * globals.scale + "px";
        rule.style.height = tileHeight * globals.scale + "px";
      }
    }

    // Adjust clock size.
    var topMax = 80;
    var topMin = 16;
    var topMaxOffset = 10;
    var topSpace = Math.min(topMax, Math.max(topMin, off.y + tileHeight * globals.scale));

    var topOffset = Math.floor((topSpace - topMin) * topMaxOffset / (topMax - topMin));
    var topSize = Math.max(topSpace - topOffset - 8, tileHeight - 8);
    this.timeContainer.style.top  = topOffset + "px";
    this.timeStyle.fontSize = topSize + "px";

    this.services.bombManager.forEachEntity(function(bomb) {
      bomb.reset();
    });

    this.setBGMSpeed(1);
    this.setAllPlayersToState('waiting');
    this.setState('waitForPlayers');
  };

  GameManager.prototype.setAllPlayersToState = function(state) {
    this.services.playerManager.forEachPlayerPlaying(function(player) {
      player.setState(state);
    });
  };

  GameManager.prototype.setBGMSpeed = function(speed) {
    var bgm = this.services.bgm;
    if (bgm && bgm.playbackRate) {
      bgm.playbackRate.value = speed;
    }
  };

  GameManager.prototype.setState = function(state) {
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
  };

  GameManager.prototype.waitForStartUpdate = function() {
    var globals = this.services.globals;
    var numPlayers = this.services.playerManager.getNumPlayersConnected();

    var timeStr = Strings.padLeft((this.timer | 0), 2, '0');

    this.overlayLine1.nodeValue = "Start In: " + ((numPlayers < 2 || (globals.frameCount & 16)) ? timeStr : '');
    this.overlayLine2.nodeValue = "Players: " + numPlayers + ((globals.frameCount & 16) && numPlayers < 2 ? ' Need 2+' : '');
  };

  GameManager.prototype.broadcastCmd = function(cmd, data) {
    if (this.services.server) {
      this.services.server.broadcastCmd(cmd, data);
    }
  };

  // Wait for at least 2 players
  GameManager.prototype.init_waitForPlayers = function() {
    var globals = this.services.globals;
    this.showOverlay(true);
    this.showTime(false);
    this.overlay.style.textAlign = "";
    this.timer = globals.waitForPlayersDuration;

    this.waitForStartUpdate();
    var numPlayersConnected = this.services.playerManager.getNumPlayersConnected();
    if (numPlayersConnected < 2) {
      this.broadcastCmd('waitForMorePlayers');
    }
  };

  GameManager.prototype.state_waitForPlayers = function() {
    var globals = this.services.globals;
    this.waitForStartUpdate();
    if (this.services.playerManager.getNumPlayersConnected() > 1) {
      this.setState('waitForStart');
    }
  };

  // Wait for a few moments to let other players join
  GameManager.prototype.init_waitForStart = function() {
  };

  GameManager.prototype.state_waitForStart = function() {
    this.waitForStartUpdate();
    var globals = this.services.globals;
    var oldTimer = this.timer | 0;
    this.timer -= globals.elapsedTime;

    if (this.timer <= 0) {
      this.setState('start');
      return;
    }

    // Wait for at least 2 players.
    var numPlayersConnected = this.services.playerManager.getNumPlayersConnected();
    if (numPlayersConnected < 2) {
      this.setState('waitForPlayers');
      return;
    }

    var needBiggerLevel = numPlayersConnected > this.maxPlayersBeforeNeedingLowerScale && globals.scale > 1;
    var needSmallerLevel = numPlayersConnected < this.minPlayersBeforeNeedingHigherScale && globals.scale < 8;
    if (needBiggerLevel || needSmallerLevel) {
      this.reset();
      return;
    }

    var secondsLeft = this.timer | 0;
    if (oldTimer != secondsLeft) {
      this.broadcastCmd('waitForStart', {
        waitTime: secondsLeft,
      });
    }

  };

  GameManager.prototype.init_start = function() {
    var globals = this.services.globals;
    this.roundTimer = globals.roundDuration;
    this.showTime(true);
    this.updateTime();
    this.services.playerManager.reset();
    this.overlay.style.textAlign = "center";
    this.overlayLine1.nodeValue = "Ready?";
    this.overlayLine2.nodeValue = "";
    this.timer = globals.waitForStartDuration;
  };

  GameManager.prototype.state_start = function() {
    var globals = this.services.globals;
    var old = this.timer | 0;
    this.timer -= globals.elapsedTime;
    if (old != (this.timer | 0) && old == globals.waitForGo) {
      this.overlayLine1.nodeValue = "GO!";
    }
    if (this.timer <= 0) {
      this.setState('play');
    }
  };

  GameManager.prototype.init_play = function() {
    this.showOverlay(false);
    this.setAllPlayersToState('idle');
  };

  GameManager.prototype.state_play = function() {
    var globals = this.services.globals;
    var oldRoundTimer = this.roundTimer;
    this.roundTimer -= globals.elapsedTime;

    if (this.roundTimer <= globals.hurryTime && oldRoundTimer > globals.hurryTime) {
      this.setBGMSpeed(1.5);
    }

    var numPlayersAlive = this.services.playerManager.getNumPlayersAlive();
    if (this.roundTimer <= 0 || numPlayersAlive < 2) {
      this.setState('end');
      return;
    }
    this.updateTime();
  };

  GameManager.prototype.init_end = function() {
    var globals = this.services.globals;
    this.setBGMSpeed(1);
    this.services.playerManager.forEachPlayerPlaying(function(player) {
      ++player.roundsPlayed;
      if (player.alive) {
        player.setState('end');
        this.winner = player;
      }
    }.bind(this));
    this.timer = globals.waitForEnd;
  };

  GameManager.prototype.state_end = function() {
    var globals = this.services.globals;
    this.timer -= globals.elapsedTime;
    if (this.timer <= 0) {
      this.setState('showWinners');
    }
  };

  GameManager.prototype.init_showWinners = function() {
    var globals = this.services.globals;
    this.showOverlay(true);
    this.overlay.style.textAlign = "center";
    var numPlayersAlive = this.services.playerManager.getNumPlayersAlive();
    this.overlayLine2.nodeValue = "";
    if (numPlayersAlive <= 0) {
      this.overlayLine1.nodeValue = "No Winners";
    } else if (numPlayersAlive > 1) {
      this.overlayLine1.nodeValue = "Draw";
      this.services.playerManager.forEachPlayerPlaying(function(player) {
        if (player.alive) {
          player.sendTied();
        }
      });
    } else {
      ++this.winner.wins;
      this.overlayLine1.nodeValue = "Winner";
      this.overlayLine2.nodeValue = this.winner.playerName + " " + this.winner.wins + "/" + this.winner.roundsPlayed;
      this.winner.sendWinner();
    }
    this.timer = globals.waitForWinnerDuration;
  };

  GameManager.prototype.state_showWinners = function() {
    var globals = this.services.globals;
    this.timer -= globals.elapsedTime;
    if (this.timer <= 0) {
      this.reset();
    }
  };

  return GameManager;
});

