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

var gameInfo = require('../../lib/gameinfo');
var path     = require('path');
var Promise  = require('promise');

var check = function(args) {
  return new Promise(function(resolve, reject) {
    try {
      var runtimeInfo = gameInfo.readGameInfo(process.cwd());
    } catch (e) {
      console.error(e);
      reject();
      return;
    }
    console.log("name       : " + runtimeInfo.info.name);
    console.log("gameId     : " + runtimeInfo.originalGameId);
    console.log("runtimeId  : " + runtimeInfo.info.happyFunTimes.gameId);
    console.log("type       : " + runtimeInfo.info.happyFunTimes.gameType);
    console.log("version    : " + runtimeInfo.info.version);
    console.log("api version: " + runtimeInfo.info.happyFunTimes.apiVersion);
    console.log("");
    console.log("looks ok");
    resolve();
  });
};

exports.usage = {
  prepend: "check's the game in the current folder some requirements",
  options: [
  ]
};
exports.cmd = check;




