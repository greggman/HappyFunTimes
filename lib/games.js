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

var debug     = require('debug')('games');
var events    = require('events');
var fs        = require('fs');
var path      = require('path');
var gameInfo  = require('../lib/gameinfo');
var hftConfig = require('../lib/config');
var _         = require('underscore');

var InstalledGamesList = function() {
  var p_installedGamesPath;
  var p_installedGamesList;
  var eventEmitter = new events.EventEmitter();
  var watcher;

  var close = function() {
    if (watcher) {
      watcher.close();
      watcher = undefined;
    }
  };

  var onFolderChanged = function(event, filename) {
    debug("something changed: " + filename);
    if (!filename || filename == path.basename(p_installedGamesPath)) {
      setTimeout(function() { eventEmitter.emit('changed'); }, 500);
    }
  };

  var reset = function() {
    close();
    var config = hftConfig.getConfig();
    p_installedGamesPath = config ? config.installedGamesListPath : undefined;
    p_installedGamesList = [];
    var dirPath = path.dirname(p_installedGamesPath);
    watcher = fs.watch(dirPath, onFolderChanged);
  };
  reset();

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
   * Makes the config and games db if they do not exit
   */
  var init = function() {
    hftConfig.init();
    reset();
    if (!fs.existsSync(p_installedGamesPath)) {
      putInstalledGames();
      console.log("Wrote game db");
    }
  };

  /**
   * Adds a locally installed game to the list of games locally
   * installed :p
   *
   * @param {string} gamePath path to game
   * @param {string[]?} opt_fileList list file files relative to
   *        gamePath that were installed.
   */
  var add = function(gamePath, opt_fileList) {
    var fullGamePath = path.resolve(gamePath);
    var packageJSONPath = path.join(fullGamePath, "package.json");

    try {
      var info = gameInfo.readGameInfo(packageJSONPath);
      if (!info) {
        throw "";
      }
      gameInfo.checkRequiredFiles(info, info.basePath);

      getInstalledGames();
      var index = indexByPath(gamePath);
      var added = false;
      if (index < 0) {
        index = 0;
        p_installedGamesList.unshift({path: gamePath});
        console.log("added: " + gamePath);
        added = true;
      } else {
        console.warn(gamePath + " already installed");
      }
      if (opt_fileList) {
        var game = p_installedGamesList[index];
        game.files = _.union(opt_fileList, game.files || [])
      }
      // Need to notify GameDB to add game
      putInstalledGames();
      if (added) {
        eventEmitter.emit('changed');
      }
      return true;
    } catch (e) {
      console.error(gamePath + " does not appear to be a happyFunTimes game");
      console.error(e);
      return false;
    }
  };

  /**
   * Remove a game from the list of locally installed games.
   * @param {string} gamePathOrId path to game or gameId
   */
  var remove = function(gamePathOrId) {
    try {
      getInstalledGames();
      var gamePath;
      var runtimeInfo = require('../lib/gamedb').getGameById(gamePathOrId);
      if (runtimeInfo) {
        gamePath = runtimeInfo.basePath;
      } else {
        gamePath = path.resolve(gamePathOrId);
      }

      var index = indexByPath(gamePath);
      if (index < 0) {
        console.warn(gamePathOrId + " not installed");
        return false;
      }
      p_installedGamesList.splice(index, 1);
      putInstalledGames();
      eventEmitter.emit('changed');
      console.log("removed: " + gamePath);
    } catch (e) {
      console.error("error: removing game: " + gamePath);
      console.error(e);
      return false;
    }
  };

  /**
   * Gets all the installed games
   * with absolute paths
   */
  var get = function() {
    getInstalledGames();
    return p_installedGamesList.map(function(game) {
      var newGame = JSON.parse(JSON.stringify(game));
      newGame.path = path.resolve(path.dirname(p_installedGamesPath), newGame.path);
      return newGame;
    });
  };

  this.add    = add.bind(this);
  this.get    = get.bind(this);
  this.init   = init.bind(this);
  this.remove = remove.bind(this);
  this.reset  = reset.bind(this);
  this.close  = close.bind(this);

  // expose the event emitter.
  this.on = eventEmitter.on.bind(eventEmitter);
  this.removeListener = eventEmitter.removeListener.bind(eventEmitter);
  this.addListener = this.on;
};

module.exports = new InstalledGamesList();

