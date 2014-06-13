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

var applyDefaultProperties = function(obj, defaults) {
  if (!defaults) {
    return;
  }
  misc.copyProperties(defaults, obj, 1);
};

/**
 * @typedef {Object} GameDB~Settings
 * @property {string[]} required the happyFunTimes properties in
 *           package.json
 * @property {Object} hftDefaults the default happyFunTimes
 *           properties
 * @property {Object} hftGameTypeDefaults the default
 *           happyFunTimes properties by gameType
 * @property {Object} apiVersionSettings settings by apiVersion.
 */

/**
 * @typedef {Object} GameDB~Options
 * @property {string} baseDir directory server serves from, ie,
 *           "public"
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
 * @param {GameDB~Settings} settings
 * @param {GameDB~Options} options
 */
var GameDB = function(settings, options) {

  this.settings = settings;
  this.options = options;
  this.templateUrls = [];
  this.games = [];
  this.gamesById = {};

  if (options.gamesDirs) {
    options.gamesDirs.forEach(function(basePath) {
      if (!fs.existsSync(basePath)) {
        console.warn("WARNING: " + basePath + " does not exist");
        return;
      }
      this.addGamesByFolder(basePath);
    }.bind(this));
  }

  if (options.gamesLists) {
    options.gamesLists.forEach(function(list) {
      this.addGamesByList(list);
    }.bind(this));
  }
};

GameDB.prototype.makeAbsUrl = (function() {
  var backslashRE = new RegExp("\\\\", 'g');

  return function(url, gameBasePath) {
    return "/" + path.relative(this.options.baseDir, path.join(gameBasePath, url)).replace(backslashRE, "/");
  };
}());

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
  try {
    var fileList = JSON.parse(fs.readFileSync(filePath, {encoding:'utf-8'}));
    fileList.forEach(function(info) {
      this.addGameInfo(path.join(info.path, "package.json"));
    }.bind(this));
  } catch (e) {
    console.error("could not read: " + filePath);
    throw e;
  }
};

GameDB.prototype.addGameInfo = function(filePath) {
  try {
    var contents = fs.readFileSync(filePath);
    var packageInfo = JSON.parse(contents);
    var hftInfo = packageInfo.happyFunTimes;
    if (!hftInfo) {
      return;
    }

    var gameBasePath = path.dirname(filePath);
    var settings = this.settings;
    applyDefaultProperties(hftInfo, settings.hftDefaults);
    applyDefaultProperties(hftInfo, settings.hftGameTypeDefaults[hftInfo.gameType]);
    var missing = misc.getMissingProperties(hftInfo, settings.required);
    if (missing) {
      console.error("error: " + filePath + " is missing happyFunTimes properties: " + missing.join(", "));
      return;
    }

    if (settings.hftGameTypeDefaults[hftInfo.gameType] === undefined) {
      console.error("error: " + filePath + " unknown gameType " + hftInfo.gameType);
      console.error("valid gameTypes: \n\t" + Object.keys(settings.hftGameTypeDefaults).join("\n\t"));
      return;
    }

    hftInfo.versionSettings = settings.apiVersionSettings[hftInfo.apiVersion];
    if (hftInfo.versionSettings === undefined) {
      console.error("error: " + filePath + " unknown apiVersion " + hftInfo.apiVersion);
      console.error("valid apiVersions: \n\t" + Object.keys(settings.apiVersionSettings).join("\n\t"));
      return;
    }

    if (hftInfo.templateUrls) {
      hftInfo.templateUrls.forEach(function(url) {
        this.templateUrls.push("/games/" + hftInfo.gameId + "/" + url);
      }.bind(this));
    }

    var gameType = hftInfo.gameType;
    if (!gameType) {
      return;
    }

    // Fix some urls.
    ['gameUrl', 'screenshotUrl'].forEach(function(name) {
      if (hftInfo[name]) {
        hftInfo[name] = "/games/" + hftInfo.gameId + "/" + hftInfo[name];
      };
    }.bind(this));

    if (hftInfo.gameExecutable) {
      hftInfo.gameExecutable = path.relative(options.baseDir, path.join(gameBasePath, hftInfo.gameExecutable));
      var fullPath = path.normalize(path.join(process.cwd(), hftInfo.gameExecutable));
      if (cwd != fullPath.substring(0, cwd.length)) {
        throw "bad path for game executable: " + fullPath;
      }
    }

    hftInfo.basePath = gameBasePath;

    this.games.push(packageInfo);
    this.gamesById[hftInfo.gameId] = packageInfo;
  } catch (e) {
    console.error("ERROR: Reading " + filePath);
    throw e;
  }
  return true;
};

/**
 * This is basically the contents of each game's package.json.
 * At a minimum the properties listed below are needed to
 * generate a list of games on /games.html
 *
 * @typedef {Object} GameDB~GameInfo
 * @property {string} gameType the type of game (eg. 'html',
 *           'Unity', ...)
 * @property {string} gameUrl the baseDir relative path to the
 *           game's html page if it's an html based game.
 * @property {string} screenshotUrl the baseDir relative path to
 *           the game's screenshot.
 * @property {string} gamExecutable the baseDir relative path to
 *           the game's executable if it's a native executable.
 *           Like a Unity game for example.
 */

/**
 * Gets a list of games.
 * @returns {GameDB~GameInfo[]} the list of games.
 */
GameDB.prototype.getGames = function() {
  return this.games;
};

/**
 * Gets a game by gameId
 * @param {string} gameId id of game
 * @returns {GameDB~GameInfo} game info for game (it's
 *        package.json)
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

module.exports = GameDB;

