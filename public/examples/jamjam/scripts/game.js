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

var InstrumentManager = (function() {

  var soundFiles = [
    "assets/drum-samples/4OP-FM/hihat.wav",
    "assets/drum-samples/4OP-FM/kick.wav",
    "assets/drum-samples/4OP-FM/snare.wav",
    "assets/drum-samples/4OP-FM/tom1.wav",
    "assets/drum-samples/4OP-FM/tom2.wav",
    "assets/drum-samples/4OP-FM/tom3.wav",
    "assets/drum-samples/acoustic-kit/hihat.wav",
    "assets/drum-samples/acoustic-kit/kick.wav",
    "assets/drum-samples/acoustic-kit/snare.wav",
    "assets/drum-samples/acoustic-kit/tom1.wav",
    "assets/drum-samples/acoustic-kit/tom2.wav",
    "assets/drum-samples/acoustic-kit/tom3.wav",
    "assets/drum-samples/Bongos/hihat.wav",
    "assets/drum-samples/Bongos/kick.wav",
    "assets/drum-samples/Bongos/snare.wav",
    "assets/drum-samples/Bongos/tom1.wav",
    "assets/drum-samples/Bongos/tom2.wav",
    "assets/drum-samples/Bongos/tom3.wav",
    "assets/drum-samples/breakbeat13/hihat.wav",
    "assets/drum-samples/breakbeat13/kick.wav",
    "assets/drum-samples/breakbeat13/snare.wav",
    "assets/drum-samples/breakbeat13/tom1.wav",
    "assets/drum-samples/breakbeat13/tom2.wav",
    "assets/drum-samples/breakbeat13/tom3.wav",
    "assets/drum-samples/breakbeat8/hihat.wav",
    "assets/drum-samples/breakbeat8/kick.wav",
    "assets/drum-samples/breakbeat8/snare.wav",
    "assets/drum-samples/breakbeat8/tom1.wav",
    "assets/drum-samples/breakbeat8/tom2.wav",
    "assets/drum-samples/breakbeat8/tom3.wav",
    "assets/drum-samples/breakbeat9/hihat.wav",
    "assets/drum-samples/breakbeat9/kick.wav",
    "assets/drum-samples/breakbeat9/snare.wav",
    "assets/drum-samples/breakbeat9/tom1.wav",
    "assets/drum-samples/breakbeat9/tom2.wav",
    "assets/drum-samples/breakbeat9/tom3.wav",
    "assets/drum-samples/CR78/hihat.wav",
    "assets/drum-samples/CR78/kick.wav",
    "assets/drum-samples/CR78/snare.wav",
    "assets/drum-samples/CR78/tom1.wav",
    "assets/drum-samples/CR78/tom2.wav",
    "assets/drum-samples/CR78/tom3.wav",
    "assets/drum-samples/Kit3/hihat.wav",
    "assets/drum-samples/Kit3/kick.wav",
    "assets/drum-samples/Kit3/snare.wav",
    "assets/drum-samples/Kit3/tom1.wav",
    "assets/drum-samples/Kit3/tom2.wav",
    "assets/drum-samples/Kit3/tom3.wav",
    "assets/drum-samples/Kit8/hihat.wav",
    "assets/drum-samples/Kit8/kick.wav",
    "assets/drum-samples/Kit8/snare.wav",
    "assets/drum-samples/Kit8/tom1.wav",
    "assets/drum-samples/Kit8/tom2.wav",
    "assets/drum-samples/Kit8/tom3.wav",
    "assets/drum-samples/KPR77/hihat.wav",
    "assets/drum-samples/KPR77/kick.wav",
    "assets/drum-samples/KPR77/snare.wav",
    "assets/drum-samples/KPR77/tom1.wav",
    "assets/drum-samples/KPR77/tom2.wav",
    "assets/drum-samples/KPR77/tom3.wav",
    "assets/drum-samples/LINN/hihat.wav",
    "assets/drum-samples/LINN/kick.wav",
    "assets/drum-samples/LINN/snare.wav",
    "assets/drum-samples/LINN/tom1.wav",
    "assets/drum-samples/LINN/tom2.wav",
    "assets/drum-samples/LINN/tom3.wav",
    "assets/drum-samples/R8/hihat.wav",
    "assets/drum-samples/R8/kick.wav",
    "assets/drum-samples/R8/snare.wav",
    "assets/drum-samples/R8/tom1.wav",
    "assets/drum-samples/R8/tom2.wav",
    "assets/drum-samples/R8/tom3.wav",
    "assets/drum-samples/Stark/hihat.wav",
    "assets/drum-samples/Stark/kick.wav",
    "assets/drum-samples/Stark/snare.wav",
    "assets/drum-samples/Stark/tom1.wav",
    "assets/drum-samples/Stark/tom2.wav",
    "assets/drum-samples/Stark/tom3.wav",
    "assets/drum-samples/Techno/hihat.wav",
    "assets/drum-samples/Techno/kick.wav",
    "assets/drum-samples/Techno/snare.wav",
    "assets/drum-samples/Techno/tom1.wav",
    "assets/drum-samples/Techno/tom2.wav",
    "assets/drum-samples/Techno/tom3.wav",
    "assets/drum-samples/TheCheebacabra1/hihat.wav",
    "assets/drum-samples/TheCheebacabra1/kick.wav",
    "assets/drum-samples/TheCheebacabra1/snare.wav",
    "assets/drum-samples/TheCheebacabra1/tom1.wav",
    "assets/drum-samples/TheCheebacabra1/tom2.wav",
    "assets/drum-samples/TheCheebacabra1/tom3.wav",
    "assets/drum-samples/TheCheebacabra2/hihat.wav",
    "assets/drum-samples/TheCheebacabra2/kick.wav",
    "assets/drum-samples/TheCheebacabra2/snare.wav",
    "assets/drum-samples/TheCheebacabra2/tom1.wav",
    "assets/drum-samples/TheCheebacabra2/tom2.wav",
    "assets/drum-samples/TheCheebacabra2/tom3.wav",
  ];

  return function(Misc) {
    this.instruments = [];

    this.getNextInstrument = function() {
      if (this.instruments.length == 0) {
        this.instruments = soundFiles.slice();
      }
      var index = Misc.randInt(this.instruments.length);
      var instrument = this.instruments.splice(index, 1)[0];
      return instrument
    }.bind(this);
  };
}());

var Player = function(services, netPlayer, name) {
  this.services = services;
  this.netPlayer = netPlayer;
  this.name = name;
  this.tracks = [];
  this.position = [services.misc.randInt(200), services.misc.randInt(200)];
  //this.elem = document.createElement("div");
  //this.elemState = -1;

  //var elem = this.elem;
  //var s = elem.style;
  //s.width = "32px";
  //s.height = "32px";
  //s.border = "1px solid black";
  //s.position = "absolute";
  //s.left = services.misc.randInt(window.innerWidth - 32) + "px";
  //s.top = services.misc.randInt(window.innerHeight - 32) + "px";
  //s.zIndex = 5;
  //document.body.appendChild(elem);

  netPlayer.addEventListener('disconnect', Player.prototype.disconnect.bind(this));
  netPlayer.addEventListener('newInstrument', Player.prototype.chooseInstrument.bind(this));
  netPlayer.addEventListener('setColor', Player.prototype.setColor.bind(this));
  netPlayer.addEventListener('busy', Player.prototype.handleBusyMsg.bind(this));
  netPlayer.addEventListener('setName', Player.prototype.handleNameMsg.bind(this));
  netPlayer.addEventListener('tracks', Player.prototype.setTracks.bind(this));
  netPlayer.addEventListener('note', Player.prototype.setNote.bind(this));

  this.chooseInstrument();
};

Player.prototype.setColor = function(data) {
  this.color = data.color;
  this.glColor = this.services.cssParse.parseCSSColor(data.color, true);
  if (this.elem) {
    this.elem.style.backgroundColor = this.color;
  }
};

Player.prototype.setTracks = function(data) {
  this.tracks = data.tracks;
};

Player.prototype.setNote = function(data) {
  if (this.tracks) {
    var track = this.tracks[data.t];
    if (track) {
      track.rhythm[data.r] = data.n;
    }
  }
};

Player.prototype.handleNameMsg = function(msg) {
  if (!msg.name) {
    this.sendCmd('setName', {
      name: this.name
    });
  } else {
    this.name = msg.name.replace(/[<>]/g, '');
  }
};

Player.prototype.handleBusyMsg = function(msg) {
  // ignore this for now
};

Player.prototype.chooseInstrument = function() {
  var instrument = this.services.instrumentManager.getNextInstrument();
  this.sendCmd('setInstrument', {
    filename: instrument,
  });
};

Player.prototype.sendCmd = function(cmd, data) {
  this.netPlayer.sendCmd(cmd, data);
};

Player.prototype.disconnect = function() {
  this.netPlayer.removeAllListeners();
  this.services.playerManager.removePlayer(this);
  if (this.elem) {
    this.elem.parentNode.removeChild(this.elem);
  }
};

Player.prototype.drawNotes = function(trackIndex, rhythmIndex) {
  if (this.tracks) {
    var track = this.tracks[trackIndex];
    if (track) {
      var on = track.rhythm[rhythmIndex];
      if (this.elem && this.elemState != on) {
        this.elem.style.border = on ? "5px solid white" : "1px solid black";
        this.elemState = on;
      }
      if (on) {
        var gridSize = this.services.globals.gridSize;
        var renderer = this.services.renderer;
        var width = renderer.canvas.width;
        var height = renderer.canvas.height;
        var gridWidth = Math.floor(width / gridSize);
        var gridHeight = Math.floor(height / gridSize);
        var offX = (width  - (gridWidth  * gridSize)) / 2;
        var offY = (height - (gridHeight * gridSize)) / 2;
        switch (rhythmIndex % 4) {
        case 0:
          ++this.position[0];
          break;
        case 1:
          ++this.position[1];
          break;
        case 2:
          --this.position[0];
          break;
        case 3:
          --this.position[1];
          break;
        }

        this.position[0] = (this.position[0] + gridWidth ) % gridWidth;
        this.position[1] = (this.position[1] + gridHeight) % gridHeight;

        this.services.renderer.drawCircle(
          [offX + this.position[0] * gridSize, offY + this.position[1] * gridSize],
          gridSize,
          this.glColor);
      }
    }
  }
};

var PlayerManager = function(services) {
  this.services = services;
  this.players = [];
  this.numElem = $("numPeople").firstChild;
};

PlayerManager.prototype.updatePlayers = function() {
  this.numElem.nodeValue = this.players.length;
};

PlayerManager.prototype.startPlayer = function(netPlayer, name) {
  var player = new Player(this.services, netPlayer, name);
  this.players.push(player);
  this.updatePlayers();
};

PlayerManager.prototype.removePlayer = function(player) {
  this.players.splice(this.players.indexOf(player), 1);
  this.updatePlayers();
};

PlayerManager.prototype.drawNotes = function(trackIndex, rhythmIndex) {
  for (var ii = 0; ii < this.players.length; ++ii) {
    var player = this.players[ii];
    player.drawNotes(trackIndex, rhythmIndex);
  }
};

var main = function(
    GameServer,
    GameSupport,
    SyncedClock,
    CSSParse,
    Misc,
    AudioManager,
    CanvasRenderer,
    WebGLRenderer) {

  var g_debug = false;
  var g_services = {};
  var g_playerManager = new PlayerManager(g_services);
  g_services.playerManager = g_playerManager;
  g_services.cssParse = CSSParse;
  g_services.misc = Misc;
  var stop = false;

  // You can set these from the URL with
  // http://path/gameview.html?settings={name:value,name:value}
  var globals = {
    port: 8080,
    haveServer: true,
    bpm: 120,
    loopLength: 16,
    force2d: false,
    debug: false,
    gridSize: 32,
  };

  function startPlayer(netPlayer, name) {
    return new Player(g_services, netPlayer);
  }

  Misc.applyUrlSettings(globals);

  g_services.globals = globals;

  var server;
  if (globals.haveServer) {
    server = new GameServer({
      gameId: "jamjam",
    });
    g_services.server = server;
    server.addEventListener('playerconnect', g_playerManager.startPlayer.bind(g_playerManager));
  }
  GameSupport.init(server, globals);

  var clock = SyncedClock.createClock(true);
  g_services.clock = clock;

  var instrumentManager = new InstrumentManager(Misc);
  g_services.instrumentManager = instrumentManager;

  var canvas = $("canvas");
  var renderer;
  if (!globals.force2d || globals.force2D) {
    renderer = new WebGLRenderer(g_services, canvas);
  }
  if (!renderer || !renderer.canRender()) {
    renderer = new CanvasRenderer(g_services, canvas);
  }
  g_services.renderer = renderer;

  var secondsPerBeat = 60 / globals.bpm;
  var secondsPerQuarterBeat = secondsPerBeat / 4;
  var lastDisplayedQuarterBeat = 0;

  function process() {
    var currentTime = clock.getTime();
    var currentQuarterBeat = Math.floor(currentTime / secondsPerQuarterBeat);

    if (globals.debug) {
      var beat = Math.floor(currentQuarterBeat / 4) % 4;
      GameSupport.setStatus(
          "\n ct: " + currentTime.toFixed(2).substr(-5) +
          "\ncqb: " + currentQuarterBeat.toString().substr(-4) +
          "\n rt: " + currentQuarterBeat % globals.loopLength +
          "\n bt: " + beat + ((beat % 2) == 0 ? " ****" : ""));
    }

    if (lastDisplayedQuarterBeat != currentQuarterBeat) {
      lastDisplayedQuarterBeat = currentQuarterBeat;
      g_playerManager.drawNotes(0, currentQuarterBeat % globals.loopLength);
    }

    if (!stop) {
     setTimeout(process, 100);
    }
  }
  process();

  GameSupport.run(globals, function() {
    //var x = Misc.randInt(150) + 500;
    //var y = Misc.randInt(150) + 300;
    //renderer.drawCircle([x, y], 40, [1,1,1,1]);
    renderer.begin();
    renderer.end();
  });

};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameserver',
    '../../../scripts/gamesupport',
    '../../../scripts/syncedclock',
    '../../../scripts/misc/cssparse',
    '../../../scripts/misc/misc',
    '../../scripts/audio',
    './canvasrenderer',
    './webglrenderer',
  ],
  main
);


