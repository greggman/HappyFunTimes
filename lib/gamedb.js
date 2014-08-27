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
 * THEORY OF2 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

var debug = require('debug')('gamedb');
var fs = require('fs');
var path = require('path');
var misc = require('./misc');
var strings = require('./strings');
var gameInfo = require('./gameinfo');
var hftConfig = require('./config');

/**
 * @typedef {Object} GameDB~Options
 * @property {string[]?} gamesDirs directories to scan for
 *           games.
 * @property {string[]?} gamesLists files to read for games.
 */

/**
 * GameDB scans a folder for games (subfolders with package.json)
 *
 * It reads them all synchronously and creates a list of
 * games.
 *
 * @constructor
 * @param {GameDB~Options} options
 */
var GameDB = function(options) {
  this.reset(options);
};

/**
 * reset the DB.
 * Used for testing
 */
GameDB.prototype.reset = function(options) {
  options = options || {};
  this.options = options;
  this.templateUrls = [];
  this.games = [];
  this.gamesById = {};

  // Why even have this option?
  if (options.gamesDirs) {
    options.gamesDirs.forEach(function(basePath) {
      if (!fs.existsSync(basePath)) {
        return;
      }
      this.addGamesByFolder(basePath);
    }.bind(this));
  }

  var config = hftConfig.getConfig();
  var gamesLists = options.gamesLists || (config ? [
    config.installedGamesListPath,
  ] : []);

  if (gamesLists) {
    gamesLists.forEach(function(list) {
      this.addGamesByList(list);
    }.bind(this));
  }
};

GameDB.prototype.addGamesByFolder = function(folder) {
  var filenames = fs.readdirSync(folder);
  filenames.forEach(function(filename) {
    if (strings.startsWith(filename, '.')) {
      return;
    }

    var gameBasePath = path.join(folder, filename);
    var filePath = path.join(gameBasePath, "package.json");
    if (fs.existsSync(filePath)) {
      this.addGameInfo(filePath);
    }

  }.bind(this));
};

GameDB.prototype.addGamesByList = function(filePath) {
  var dirPath = path.dirname(filePath);
  try {
    var fileList = JSON.parse(fs.readFileSync(filePath, {encoding:'utf-8'}));
    fileList.forEach(function(info) {
      var gameInfo = this.addGameInfo(path.resolve(dirPath, path.join(info.path, "package.json")));
      if (gameInfo) {
        gameInfo.files = info.files;
      }
    }.bind(this));
  } catch (e) {
    console.error("could not read: " + filePath);
    console.error(e);
  }
};

GameDB.prototype.addGameInfo = function(filePath) {
  try {
    var runtimeInfo = gameInfo.readGameInfo(filePath);
    this.games.push(runtimeInfo);
    this.gamesById[runtimeInfo.info.happyFunTimes.gameId] = runtimeInfo;
  } catch (e) {
    console.warn("Could not read gameInfo for: " + filePath);
    console.error(e);
  }
  return runtimeInfo;
};

/**
 * Gets a list of games.
 * @returns {HFT~RuntimeInfo[]} the list of games.
 */
GameDB.prototype.getGames = function() {
  return this.games;
};

/**
 * Gets a game by gameId
 * @param {string} gameId id of game
 * @returns {HFT~RuntimeInfo} game info for game (it's
 *        package.json etc..)
 */
GameDB.prototype.getGameById = function(gameId) {
  return this.gamesById[gameId];
};

/**
 * List of URLs that need template subsitution
 */
GameDB.prototype.getTemplateUrls = function() {
  return this.templateUrls;
};

module.exports = new GameDB();

