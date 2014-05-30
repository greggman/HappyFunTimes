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
var strings = require('./strings');

/**
 * @typedef {Object} GameDB~Options
 * @property {string} baseDir directory server serves from, ie,
 *           "public"
 * @property {string} gamesDirs {String[]} directories to scan
 *           for games.
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

  this.templateUrls = [];
  this.games = [];

  var backslashRE = new RegExp("\\\\", 'g');
  var cwd = process.cwd();

  var makeAbsUrl = function(url, gameBasePath) {
    return "/" + path.relative(options.baseDir, path.join(gameBasePath, url)).replace(backslashRE, "/");
  };

  options.gamesDirs.forEach(function(basePath) {
    if (!fs.existsSync(basePath)) {
      console.warn("WARNING: " + basePath + " does not exist");
      return;
    }
    var filenames = fs.readdirSync(basePath);
    filenames.forEach(function(filename) {
      if (strings.startsWith(filename, '.')) {
        return;
      }

      var gameBasePath = path.join(basePath, filename);
      var filePath = path.join(gameBasePath, "package.json");
      if (fs.existsSync(filePath)) {
        try {
          var contents = fs.readFileSync(filePath);
          var packageInfo = JSON.parse(contents);
          var hftInfo = packageInfo.happyFunTimes;
          if (!hftInfo) {
            return;
          }

          if (hftInfo.templateUrls) {
            hftInfo.templateUrls.forEach(function(url) {
              this.templateUrls.push(makeAbsUrl(url, gameBasePath));
            }.bind(this));
          }

          var gameType = hftInfo.gameType;
          if (!gameType) {
            return;
          }

          // Fix some urls.
          ['gameUrl', 'screenshotUrl'].forEach(function(name) {
            if (hftInfo[name]) {
              hftInfo[name] = makeAbsUrl(hftInfo[name], gameBasePath);
            };
          });

          if (hftInfo.gameExecutable) {
            hftInfo.gameExecutable = path.relative(options.baseDir, path.join(gameBasePath, hftInfo.gameExecutable));
            var fullPath = path.normalize(path.join(cwd, hftInfo.gameExecutable));
            if (cwd != fullPath.substring(0, cwd.length)) {
              throw "bad path for game executable: " + fullPath;
            }
          }

          this.games.push(packageInfo);
        } catch (e) {
          console.error("ERROR: Reading " + filePath);
          throw e;
        }
      }

    }.bind(this));
  }.bind(this));
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
 * List of URLs that need template subsitution
 */
GameDB.prototype.getTemplateUrls = function() {
  return this.templateUrls;
};

module.exports = GameDB;

