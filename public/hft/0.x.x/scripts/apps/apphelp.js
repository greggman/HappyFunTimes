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

define(['../gameclient'], function(GameClient) {

  var client = new GameClient({
    gameId: "__hft__",
    url: "ws://localhost:18679",
  });

  // I"m not sure if this object should provide a higher level API
  // or just return the raw GameClient.

//  var onConnect = function() {
//    console.log("connected to __hft__");
//  };
//
//  var onDisconnect = function() {
//    console.log("disconnected from __hft__");
//  };
//
//  client.addEventListener('connect', onConnect);
//  client.addEventListener('disconnect', onDisconnect);
//
//  // This seems kind of dumb given it's just an array.
//  // Maybe the point is it limits the API and hides
//  // the impl so you can't cheat with things like slice,
//  // splice, direct indexing, length, etc...?
//  var Queue = function() {
//    var queue = [];
//    this.add = function(value) {
//      queue.push(value);
//    };
//    this.remove = function() {
//      return queue.shift();
//    };
//  };
//
//  var EventCallbackQueue = function(client, id) {
//    var queue = new Queue();
//    this.add = queue.add;
//    client.addEventListener(id, function(data) {
//      var cb = queue.remove();
//      if (cb) {
//        cb(null, data);
//      }
//    });
//  };
//
//  var addEventToCallbackQueue = (function() {
//    var callbackQueues = {
//    };
//
//    return function(client, id, callback) {
//      var eventCallbackQueue = callbackQueues[id];
//      if (!eventCallbackQueue) {
//        eventCallbackQueue = new EventCallbackQueue(client, id);
//        callbackQueues = eventCallbackQueue;
//      }
//      return eventCallbackQueue.add(callback);
//    };
//  }());
//
//  var getInstalledGameInfo = function(gameId, callback) {
//    addEventToCallbackQueue(client, "getGameInstalledInfo", callback);
//    client.sendCmd('getGameInstalledInfo', {gameId: gameId});
//  };
//
//  return {
//    getInstalledGameInfo: getInstalledGameInfo,
//  };
//
  return client;
});

