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

var fs           = require('fs');
var gameDB       = require('../lib/gamedb');
var games        = require('../lib/games');
var path         = require('path');

/**
 * @typedef {Object} Uninstall~Options
 * @property {boolean?} verbose print extra info
 * @property {boolean?} dryRun true = don't write any files or
 *           make any folders.
 */

/**
 * Unistalls a game.
 *
 * @param {string} gameIdOrPath path to game or id.
 * @param {Uninstall~Options?} opt_options
 */
var uninstall = function(gameIdOrPath, opt_options) {
  var options = opt_options || {};
  var log = options.verbose ? console.log.bind(console) : function() {};

  var installedGame = gameDB.getGameById(gameIdOrPath);
  if (!installedGame) {
    // See if we can find it by path
    var gameList = gameDB.getGames();
    var gPath = path.resolve(gameIdOrPath);
    for (var ii = 0; ii < gameList.length; ++ii) {
      var game = gameList[ii];
      if (game.rootPath === gPath) {
        installedGame = game;
        break;
      }
    }
  }

  if (!installedGame) {
    console.error("ERROR: " + gameIdOrPath + " does not reference an installed game by id or path");
    return false;
  }

  var gamePath = installedGame.rootPath;
  var files = installedGame.files || [];

  var failCount = 0;
  var folders = [gamePath];
  files.forEach(function(file) {
    var fullPath = path.join(gamePath, file);
    try {
      if (fs.existsSync(fullPath)) {
        var stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          folders.push(fullPath);
        } else {
          log("delete: " + fullPath);
          if (!options.dryRun) {
            fs.unlinkSync(fullPath);
          }
        }
      }
    } catch (e) {
      ++failCount;
      console.error("Couldn't delete: " + fullPath);
    }
  });

  var deleteNoFail = function(file) {
    try {
      if (fs.existsSync(file)) {
        log("delete: " + file);
        fs.unlinkSync(file);
      }
    } catch (e) {
      // Don't care!
    }
  };

  folders.sort();
  folders.reverse();
  folders.forEach(function(folder) {
    try {
      if (fs.existsSync(folder)) {
        // Should I try to delete system files? I think so
        log("rmdir: " + folder);
        if (!options.dryRun) {
          deleteNoFail(path.join(folder, ".DS_store"));
          deleteNoFail(path.join(folder, "Thumbs.db"));
          fs.rmdirSync(folder);
        }
      }
    } catch (e) {
      ++failCount;
      console.error("Couldn't delete: " + folder);
      console.error(e);
    }
  });

  log("remove: " + gamePath);
  if (!options.dryRun) {
    games.remove(gamePath);
  }

  if (!options.dryRun) {
    console.log("uninstalled:" + gameIdOrPath);
  }

  return true;
};

exports.uninstall = uninstall;

