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

var assert         = require('assert');
var HFTGameClient  = require('../../server/hftgame-client');
var LoopbackClient = require('../../server/loopbackclient');
var path           = require('path');
var should         = require('should');
var testUtils      = require('../../lib/test/test-utils');

var g_testGamesPath          = path.join(__dirname, "..", "testgames");
var g_configPath             = path.join(g_testGamesPath, "config.json");
var g_installedGamesListPath = path.join(g_testGamesPath, "installed-games.json");

describe('hftgame', function() {

  var hftServer;

  before(function(done) {
    var config = require('../../lib/config');
    config.reset();
    config.setup({
      configPath: g_configPath,
    });
    var gamedb = require('../../lib/gamedb');
    gamedb.reset();

    hftServer = testUtils.createHFTServerWithMocks(done);
  });

  it('should be able to get available games', function(done) {
    // TODO: Check that we get updates
    var socket = new LoopbackClient();
    var client = new HFTGameClient({socket: socket});
    hftServer.getSocketServer().emit('connection', socket.server);
    socket.connect();
    client.getAvailableGames().then(function(games) {
      var gamesById = {};
      games.forEach(function(game) {
        gamesById[game.info.happyFunTimes.gameId] = game;
      });

      gamesById["hft-testgame1"].should.be.ok;
      (gamesById["zzzzzzzzzzzzz"] === undefined).should.be.ok;

      socket.close();
      return Promise.resolve();
    }).then(done, done);
  });

  after(function(done) {
    hftServer.close();
    done();
  });

});

