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
var fs             = require('fs');
var path           = require('path');
var Promise        = require('promise');
var request        = require('request');
var should         = require('should');
var TestController = require('../../lib/test/test-controller');
var TestGame       = require('../../lib/test/test-game');
var testUtils      = require('../../lib/test/test-utils');

var g_testGamesPath          = path.join(__dirname, "..", "testgames");
var g_configPath             = path.join(g_testGamesPath, "config.json");
var g_installedGamesListPath = path.join(g_testGamesPath, "installed-games.json");

describe('server versions', function() {

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

  it('has expected games', function() {
    var gamedb = require('../../lib/gamedb');
    (gamedb.getGameById("hft-testgame1")).should.be.ok;
    (gamedb.getGameById("hft-testgame-v1_1_0")).should.be.ok;
    (gamedb.getGameById("hft-testgame-v1_2_0")).should.be.ok;
    (gamedb.getGameById("hft-testgame-v1_3_0")).should.be.ok;
    (gamedb.getGameById("hft-testgame-v1_4_0")).should.be.ok;
    (gamedb.getGameById("hft-testgame-v1_4_0-multiple-games")).should.be.ok;

    // This doesn't really seem like a good test. The package.json could
    // fail to load for many reasons. Let's at least check the file is there.
    fs.existsSync(path.join(g_testGamesPath, "hft-testgame-v1.2.0-using-v1.3.0", "package.json")).should.be.true;
    (gamedb.getGameById("hft-testgame-v1_2_0-using-v1_3_0") === undefined).should.be.true;
    fs.existsSync(path.join(g_testGamesPath, "hft-testgame-v1.3.0-using-v1.4.0", "package.json")).should.be.true;
    (gamedb.getGameById("hft-testgame-v1_3_0-using-v1_4_0") === undefined).should.be.true;
  });

  describe('game needs new hft', function() {
    it('serves message: game needs new hft template', function(done) {
      hftServer.getP("http://localhost:8087/games/hft-testgame1/gameview.html").then(function(res) {
        res.body.should.containEql("new version of HappyFunTimes");
      }).then(done, done);
    });

    it('serves message: controller needs new hft template', function(done) {
      hftServer.getP("http://localhost:8087/games/hft-testgame1/index.html").then(function(res) {
        res.body.should.containEql("Please upgrade HappyFunTimes");
      }).then(done, done);
    });
  });

  describe('game v1.1.0', function() {
    it('game can not use v1.2.0 functions', function(done) {
      hftServer.getP("http://localhost:8087/games/hft-testgame-v1_1_0/gameview.html").then(function(res) {
        res.body.should.not.containEql("traceur");
      }).then(done, done);
    });
    it('controller can not use v1.2.0 functions', function(done) {
      hftServer.getP("http://localhost:8087/games/hft-testgame-v1_1_0/index.html").then(function(res) {
        res.body.should.not.containEql("traceur");
      }).then(done, done);
    });
  });

  describe('game v1.2.0', function() {
    it('game can use v1.2.0 functions', function(done) {
      hftServer.getP("http://localhost:8087/games/hft-testgame-v1_2_0/gameview.html").then(function(res) {
        res.body.should.containEql("traceur-runtime.js");
      }).then(done, done);
    });
    it('controller can use v1.2.0 functions', function(done) {
      hftServer.getP("http://localhost:8087/games/hft-testgame-v1_2_0/index.html").then(function(res) {
        res.body.should.containEql("traceur-runtime.js");
      }).then(done, done);
    });
  });

  describe('game v1.3.0', function() {
    it('game can use v1.3.0 functions', function(done) {
      hftServer.getP("http://localhost:8087/games/hft-testgame-v1_3_0/gameview.html").then(function(res) {
        res.body.should.containEql("traceur-runtime.js");
        res.body.should.containEql("hft-min.js");
      }).then(done, done);
    });
    it('controller can use v1.3.0 functions', function(done) {
      hftServer.getP("http://localhost:8087/games/hft-testgame-v1_3_0/index.html").then(function(res) {
        res.body.should.containEql("traceur-runtime.js");
        res.body.should.containEql("hft-min.js");
      }).then(done, done);
    });
  });

  describe('game v1.4.0', function() {
    it('game with out allowMultipleGames can not have multiple games', function(done) {
      var gameId = 'hft-testgame-v1_4_0';
      var testGame1 = new TestGame({gameId: gameId, hftServer: hftServer});

      testGame1.isConnected().should.be.ok;
      var testGame2 = new TestGame({gameId: gameId, hftServer: hftServer});
      testGame1.isConnected().should.not.be.ok;
      testGame2.isConnected().should.be.ok;
      testGame1.close();
      testGame2.close();
      done();
    });

    it('game with allowMultipleGames can have multiple games', function(done) {
      var gameId = 'hft-testgame-v1_4_0-multiple-games';
      var testGame1 = new TestGame({gameId: gameId, hftServer: hftServer, subId: "aaa"});

      testGame1.isConnected().should.be.ok;
      var testGame2 = new TestGame({gameId: gameId, hftServer: hftServer, subId: "bbb"});
      testGame1.isConnected().should.be.ok;
      testGame2.isConnected().should.be.ok;

      var testCtrl = new TestController({gameId: gameId, hftServer: hftServer});
      testGame1.getNumPlayers().should.be.eql(1);
      testGame2.getNumPlayers().should.be.eql(0);
      var player = testGame1.getPlayers()[0];
      player.switchGame("bbb");
      testGame1.getNumPlayers().should.be.eql(0);
      testGame2.getNumPlayers().should.be.eql(1);

      testGame1.close();
      testGame2.close();
      done();
    });
  });

  after(function(done) {
    hftServer.close();
    done();
  });

});

