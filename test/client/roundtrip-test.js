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

var assert          = require('assert');
var path            = require('path');
var should          = require('should');
var testUtils       = require('../../lib/test/test-utils');
var TestGame        = require('../../lib/test/test-game');
var TestController  = require('../../lib/test/test-controller');
var WebSocketClient = require('../../lib/websocketclient');

var g_configPath             = path.join(__dirname, "..", "testgames", "config.json");
var g_installedGamesListPath = path.join(__dirname, "..", "testgames", "installed-games.json");

describe('roundtrip', function() {

//  var server;
//  var game;
//  var gameSocket;
//  var controller;
//  var controllerSocket;
//
//  before(function(done) {
//    var config = require('../../lib/config');
//    config.reset();
//    config.setup({
//      configPath: g_configPath,
//    });
//    var gamedb = require('../../lib/gamedb');
//    gamedb.reset();
//
//    testUtils.createServer().then(function(result) {
//      server = result;
//      gameSocket = new WebSocketClient({url: "ws://localhost:8087"});
//      game = new TestGame({
//        socket: gameSocket,
//      });
//      controllerSocket = new WebSocketClient({url: "ws://localhost:8087"});
//      controller = new TestController({
//        socket: controllerSocket,
//      });
//      done();
//    }).catch(function(err) {
//      console.error(err);
//      done();
//    });
//  });
//
//  it('test connecting', function(done) {
//    var id = setInterval(function() {
//      if (game.getNumPlayers() == 1) {
//        clearInterval(id);
//        done();
//      }
//    }, 100);
//  });
//
//  after(function(done) {
//    if (controllerSocket) {
//      controllerSocket.close();
//    }
//    if (gameSocket) {
//      gameSocket.close();
//    }
//    if (server) {
//      server.close();
//    }
//    setTimeout(done, 1000);
//  });
//
});
