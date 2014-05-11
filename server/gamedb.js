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

// GameDB scans a folder for games (subfolders with package.json)
//
// It reads them all synchronously and creates a list of
// games.
//
// options:
//    baseDir: directory server serves from, ie, "public"
//    gamesDirs: {!Array.<string>} directories to scan for games.
var GameDB = function(options) {

  this.games = [];
  this.foo = "hello";

  var backslashRE = new RegExp("\\\\", 'g');
  var cwd = process.cwd();

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
          var info = JSON.parse(contents);

          // Fix some urls.
          ['gameUrl', 'screenshotUrl'].forEach(function(name) {
            if (info[name]) {
              info[name] = "/" + path.relative(options.baseDir, path.join(gameBasePath, info[name])).replace(backslashRE, "/");
            };
          });

          if (info.gameExecutable) {
            info.gameExecutable = path.relative(options.baseDir, path.join(gameBasePath, info.gameExecutable));
            var fullPath = path.normalize(path.join(cwd, info.gameExecutable));
            if (cwd != fullPath.substring(0, cwd.length)) {
              throw "bad path for game executable: " + fullPath;
            }
          }

          this.games.push(info);
        } catch (e) {
          console.error("ERROR: Reading " + filePath);
          throw e;
        }
      }

    }.bind(this));
  }.bind(this));
};

GameDB.prototype.getGames = function() {
  return this.games;
};

module.exports = GameDB;

