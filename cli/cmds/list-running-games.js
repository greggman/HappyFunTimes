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

var debug         = require('debug')('exitgame');
var HFTGameClient = require('../../server/hftgame-client');
var sprintf       = require('sprintf-js').sprintf;
var strings       = require('../../lib/strings');

var listRunningGames = function(args) {

  var client = new HFTGameClient();
  return client.getRunningGames()
  .then(function(games) {
    if (args.full) {
      console.log(JSON.stringify(games, undefined, "  "));
    } else {
      if (games.length > 0) {
        var longest = {
          id: 0,
          numPlayers: 10,
          serverName: 10,
        };
        games.forEach(function(game) {
          longest.id         = Math.max(longest.id        , game.gameId.length);
          longest.numPlayers = Math.max(longest.numPlayers, game.numPlayers.toString().length);
          longest.serverName = Math.max(longest.serverName, game.serverName.length);
        }, 0);
        var format = strings.replaceParams("%-%(id)ss  %-%(numPlayers)ss  %s", longest);
        console.log(sprintf(format,
           "id",
           "numPlayers",
           "machine"));
        console.log("------------------------------------------------------------------------------");
        console.log(games.map(function(game) {
          return sprintf(format,
              game.gameId,
              game.numPlayers,
              game.serverName);
        }).join("\n"));
      } else {
        console.log("no running games");
      }
    }
  });
};

exports.usage = {
  prepend: "lists running games",
  options: [
    { option: 'full', type: 'Boolean', description: "list entire data available as json", },
  ]
};
exports.cmd = listRunningGames;




