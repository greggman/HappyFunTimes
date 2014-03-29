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

var updateNumPlayers = (function() {
  var g_numPlayers = 0;
  var numElem = document.getElementById("numPeople").firstChild

  return function(delta) {
    g_numPlayers += delta;
    numElem.nodeValue = g_numPlayers;
  }
}());

var Player = function(services, netPlayer) {
  this.services = services;
  this.netPlayer = netPlayer;
  updateNumPlayers(1);

  netPlayer.addEventListener('disconnect', Player.prototype.disconnect.bind(this));
  netPlayer.addEventListener('newInstrument', Player.prototype.chooseInstrument.bind(this));

  this.chooseInstrument();
};

Player.prototype.chooseInstrument = function() {
  var instrument = this.services.instrumentManager.getNextInstrument();
  this.netPlayer.sendCmd('setInstrument', {
    filename: instrument,
  });
}

Player.prototype.disconnect = function() {
  updateNumPlayers(-1);
  this.netPlayer.removeAllListeners();
};

var main = function(
    GameServer,
    SyncedClock,
    AudioManager,
    Misc) {

  var g_debug = false;
  var g_services = {};

  // You can set these from the URL with
  // http://path/gameview.html?settings={name:value,name:value}
  var globals = {
    port: 8080,
    haveServer: true,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function startPlayer(netPlayer, name) {
    return new Player(g_services, netPlayer);
  }

  function showConnected() {
    $('disconnected').style.display = "none";
  }

  function showDisconnected() {
    $('disconnected').style.display = "block";
  }

  Misc.applyUrlSettings(globals);

  g_services.globals = globals;

  var server = new GameServer({
    gameId: "jamjam",
  });
  g_services.server = server;
  server.addEventListener('connect', showConnected);
  server.addEventListener('disconnect', showDisconnected);
  server.addEventListener('playerconnect', startPlayer);

  var clock = SyncedClock.createClock(true);
  g_services.clock = clock;

  var instrumentManager = new InstrumentManager(Misc);
  g_services.instrumentManager = instrumentManager;


  //var sounds = {
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
  //};
  //var audioManager = new AudioManager(sounds);
  //g_services.audioManager = audioManager;
};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameserver',
    '../../../scripts/syncedclock',
    '../../scripts/audio',
    '../../scripts/misc',
  ],
  main
);


