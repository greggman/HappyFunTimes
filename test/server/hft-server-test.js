/*
 * Copyright 2015, Gregg Tavares.
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

var g_configPath             = path.join(__dirname, "..", "testconfig", "config.json");
var g_installedGamesListPath = path.join(__dirname, "..", "testconfig", "installed-games.json");

describe('server requests', function() {

  var hftServer;
  var old = { };

  before(function(done) {
//    var config = require('../../lib/config');
//    config.reset();
//    config.setup({
//      configPath: g_configPath,
//    });
//    var gamedb = require('../../lib/gamedb');
//    gamedb.reset();

    hftServer = testUtils.createHFTServerWithMocks(done);
  });

  it('responds to time requeat', function(done) {
    hftServer.postJSONP("http://localhost:8087/", {cmd: "time"}).then(function(res) {
      var data = JSON.parse(res.body);
      data.time.should.be.a.Number;
    }).then(done, done);
  });

  it('returns 404 on bad json', function(done) {
    hftServer.postP("http://localhost:8087/", "foo bar moo").then(function(res) {
      res.body.should.containEql("404");
    }).then(done, done);
  });

  after(function(done) {
    hftServer.close();
    done();
  });

});

