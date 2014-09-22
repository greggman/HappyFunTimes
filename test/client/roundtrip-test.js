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

var assert               = require('assert');
var HFTServer            = require('../../server/hft-server.js');
var LoopbackClient       = require('../../server/loopbackclient');
var path                 = require('path');
var RelayServer          = require('../../server/relayserver.js');
var should               = require('should');
var testUtils            = require('../../lib/test/test-utils');
var TestGame             = require('../../lib/test/test-game');
var TestController       = require('../../lib/test/test-controller');
var LocalWebSocketServer = require('../../server/localwebsocketserver')

var g_configPath             = path.join(__dirname, "..", "testgames", "config.json");
var g_installedGamesListPath = path.join(__dirname, "..", "testgames", "installed-games.json");

describe('roundtrip', function() {

  var hftServer;
  var httpServer;
  var relayServer;

  before(function(done) {
    httpServer = testUtils.createMockHTTPServer();

    relayServer = new RelayServer([httpServer], {
      WebSocketServer: LocalWebSocketServer,
    });

    hftServer = new HFTServer({
      port: 0, // should not be used.
      extraPorts: [],
      privateServer: true,
      httpServer: httpServer,
      relayServer: relayServer,
    }, done);
  });

  it('should be able to add and remove game and controller', function(done) {
    var socketServer = relayServer.getSocketServers()[0];
    var gameLoopbackClient = new LoopbackClient();
    var testGame = new TestGame({socket: gameLoopbackClient});
    socketServer.emit('connection', gameLoopbackClient.server);
    gameLoopbackClient.connect();

    var ctrlLoopbackClient = new LoopbackClient();
    var testCtrl = new TestController({socket: ctrlLoopbackClient});
    socketServer.emit('connection', ctrlLoopbackClient.server);
    ctrlLoopbackClient.connect();

    testGame.getNumPlayers().should.be.eql(1);
    ctrlLoopbackClient.close();
    testGame.getNumPlayers().should.be.eql(0);
    done();
  });

  after(function(done) {
    hftServer.close();
    done();
  });

});
