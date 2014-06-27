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

var fs = require('fs');
var path = require('path');
var gameInfo = require('../server/gameinfo');
var HFTConfig = require('../server/config');

var InstalledGamesList = function() {
  var p_installedGamesPath = HFTConfig.installedGamesListPath;
  var p_installedGamesList = [];

  var indexByPath = function(gamePath) {
    for (var ii = 0; ii < p_installedGamesList.length; ++ii) {
      if (p_installedGamesList[ii].path == gamePath) {
        return ii;
      }
    }
    return -1;
  };

  var getInstalledGames = function() {
    var content = fs.readFileSync(p_installedGamesPath, {encoding: "utf-8"});
    p_installedGamesList = JSON.parse(content);
    return p_installedGamesList;
  };

  var putInstalledGames = function() {
    fs.writeFileSync(p_installedGamesPath, JSON.stringify(p_installedGamesList, undefined, "  "));
  };

  /**
   * Makes the list of games if it does not exist.
   */
  var init = function() {
    if (!fs.existsSync(p_installedGamesPath)) {
      putInstalledGames();
    }
  };

  /**
   * Adds a locally installed game to the list of games locally
   * installed :p
   *
   * @param {string} gamePath path to game
   */
  var add = function(gamePath) {
    var fullGamePath = path.resolve(gamePath);
    var packageJSONPath = path.join(fullGamePath, "package.json");

    try {
      var info = gameInfo.readGameInfo(packageJSONPath);
      if (!info) {
        throw "";
      }
      getInstalledGames();
      var index = indexByPath(gamePath);
      if (index < 0) {
        p_installedGamesList.push({path: gamePath});
        putInstalledGames();
        // Need to notify GameDB to add game
      } else {
        console.warn(gamePath + " already installed");
      }
      return true;
    } catch (e) {
      console.error(gamePath + " does not appear to be a happyFunTimes game\n  " + e.toString());
      return false;
    }
  };

  /**
   * Remove a game from the list of locally installed games.
   * @param {string} gamePath path to game
   */
  var remove = function(gamePath) {
    try {
      getInstalledGames();
      var index = indexByPath(gamePath);
      if (index >= 0) {
        p_installedGamesList.splice(index, 1);
        putInstalledGames();
        // Need to notify GameDB to remove game
      } else {
        console.warn(gamePath + " not installed");
      }
    } catch (e) {
      console.error("error: removing game: " + gamePath + "\n  " + e.toString());
      return false;
    }
  };

  this.add = add.bind(this);
  this.remove = remove.bind(this);
  this.init = init.bind(this);
};

module.exports = new InstalledGamesList();

