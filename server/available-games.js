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

// This is effectively a wrapper for lib/gamedb except we can add games
// on the fly that are not added to the db. This lets us handle games
// that have not been installed/added.
//
// This happens if we run a game directly, especially from unity. Because
// the game is not installed/added it won't show up at http://localhost:18679/games.html
// but unity can still start a game and send a message to happyFunTimes

"use strict";

var debug  = require('debug')("AvailableGames");
var events = require('events');

var AvailableGames = function() {
  var emitter = new events.EventEmitter();
  var gameDB = require('../lib/gamedb');

  var unAddedAndUnInstalledGames = {
  };

  this.on = emitter.on.bind(emitter);
  this.addListener = this.on;
  this.removeListener = emitter.removeListener.bind(emitter);
  this.reset = gameDB.reset.bind(gameDB);

  // When getting games only get what's installed
  this.getGames = gameDB.getGames.bind(gameDB);

  this.add = function(runtimeInfo) {
    var gameId = runtimeInfo.info.happyFunTimes.gameId;
    var info = gameDB.getGameById(gameId);
    if (!info) {
      debug("Added: " + gameId);
      unAddedAndUnInstalledGames[gameId] = runtimeInfo;
    }
  };

  this.getGameById = function(id) {
    var info = gameDB.getGameById(id);
    if (!info) {
      info = unAddedAndUnInstalledGames[id];
      debug("getting: " + id + (info ? "found" : "NOT found"));
    }
    return info;
  };
};

module.exports = AvailableGames;


