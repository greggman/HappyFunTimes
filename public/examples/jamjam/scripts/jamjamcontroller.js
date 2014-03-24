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

var main = function(GameClient, SyncedClock, AudioManager, Cookies, Input) {
  var g_client;
  var g_audioManager;
  var g_clock;
  var g_bpm = 100;
  var g_instrument;

  function $(id) {
    return document.getElementById(id);
  }

  function showConnected() {
    $("disconnected").style.display = "none";
  }

  function showDisconnected() {
    $("disconnected").style.display = "block";
  }

  function handleSetInstrument(data) {
console.log("setins: " + data.filename);
    g_audioManager.loadSound(data.filename, data.filename, 1, function() {
      g_instrument = data.filename;
console.log("loaded:" + data.filename);
      g_audioManager.playSound(g_instrument);
    });
  }

  function reloadPage() {
    window.location.reload();
  }

  var gameName = "jamjam";
  g_client = new GameClient(gameName);

  g_client.addEventListener('setInstrument', handleSetInstrument);

  g_client.addEventListener('connect', showConnected);
  g_client.addEventListener('disconnect', showDisconnected);

  g_audioManager = new AudioManager();
  g_clock = SyncedClock.createClock(true);

  var then = g_clock.getTime();
  function process() {
    var now = g_clock.getTime();

    // insert notes

    then = now;

  }

  setInterval(process, 500);
};

// Start the main app logic.
requirejs(
  [ '../../../scripts/gameclient',
    '../../../scripts/syncedclock',
    '../../scripts/audio',
    '../../scripts/cookies',
    '../../scripts/input',
  ],
  main
);

