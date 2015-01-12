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

var home    = require('../../lib/home');
var Promise = require('promise');
var sprintf = require('sprintf-js').sprintf;
var strings = require('../../lib/strings');

var list = function(args) {
  return new Promise(function(resolve /* , reject */) {
    var gamedb = require('../../lib/gamedb');
    var gameList = gamedb.getGames();

    if (args.full) {
      console.log(JSON.stringify(gameList, undefined, "  "));
    } else {
      if (gameList.length > 0) {
        var longest = {
          id: 0,
          version: 7,
          apiVersion: 3,
          gameType: 8,
          category: 8,
        };
        gameList.forEach(function(runtimeInfo) {
          longest.id         = Math.max(longest.id        , runtimeInfo.originalGameId.length);
          longest.version    = Math.max(longest.version   , runtimeInfo.info.version.length);
          longest.category   = Math.max(longest.category  , runtimeInfo.info.happyFunTimes.category.length);
          longest.apiVersion = Math.max(longest.apiVersion, runtimeInfo.info.happyFunTimes.apiVersion.length);
          longest.gameType   = Math.max(longest.gameType  , runtimeInfo.info.happyFunTimes.gameType.length);
        }, 0);
        var format = strings.replaceParams("%-%(id)ss  %3s  %%(version)ss  %%(apiVersion)ss  %-%(gameType)ss %-%(category)ss %s", longest);
        console.log(sprintf(format,
           "id",
           "dev",
           "version",
           "api",
           "gameType",
           "category",
           "path"));
        console.log("------------------------------------------------------------------------------");
        console.log(gameList.map(function(game) {
          var rootPath = game.rootPath;
          if (process.platform.substring(0, 3).toLowerCase() !== "win") {
            if (strings.startsWith(rootPath, home.homeDir)) {
              rootPath = rootPath.replace(home.homeDir, "~");
            }
          }
          return sprintf(format,
              game.originalGameId,
              game.originalGameId !== game.info.happyFunTimes.gameId ? "*" : " ",
              game.info.version,
              game.info.happyFunTimes.apiVersion,
              game.info.happyFunTimes.gameType,
              game.info.happyFunTimes.category,
              rootPath);
        }).join("\n"));
      } else {
        console.log("no games installed");
      }
    }
    resolve();
  });
};

exports.usage = {
  prepend: "list installed games",
  options: [
    { option: 'full', type: 'Boolean', description: "list entire contents of package for each game as json", },
  ],
};
exports.cmd = list;



