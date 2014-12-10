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

var config       = require('../lib/config');
var debug        = require('debug')('install');
var fs           = require('fs');
var gameDB       = require('../lib/gamedb');
var gameInfo     = require('../lib/gameinfo');
var games        = require('../lib/games');
var JSZip        = require('jszip');
var mkdirp       = require('mkdirp');
var path         = require('path');
var platformInfo = require('../lib/platform-info');
var Promise      = require('promise');
var releaseUtils = require('./release-utils');
var strings      = require('../lib/strings');

/**
 * @typedef {Object} Install~Options
 * @property {boolean?} overwrite default false. Install even if
 *           already installed.
 * @property {boolean?} verbose print extra info
 * @property {boolean?} dryRun true = don't write any files or
 *           make any folders.
 */

/**
 * Installs a release.
 *
 * @param {string} releasePath path to zip file
 * @param {string?} opt_destPath path to where to install. If
 *        not provided default games path is used.
 * @param {Install~Options?} opt_options
 */
var install = function(releasePath, opt_destPath, opt_options) {
  var options = opt_options || {};
  var log = options.verbose ? console.log.bind(console) : function() {};

  if (!strings.endsWith(releasePath, ".zip")) {
    // ToDo: Should we handle URLs? What about ids?
    console.error("Can't handle non zip files yet");
    return false;
  }

  var zip = new JSZip();
  zip.load(fs.readFileSync(releasePath));
  var entries = Object.keys(zip.files).sort().map(function(key) { return zip.files[key]; });
  var runtimeInfo;
  var packageBasePath;

  var packageLocations = gameInfo.getPackageLocations();
  var checkPackageLocations = function(entry) {
    var safeDirName = entry.name.replace(/\\/g, "/");
    var shortPath = safeDirName.substring(safeDirName.indexOf("/") + 1);
    for (var jj = 0; jj < packageLocations.length; ++jj) {
      var packageLocation = packageLocations[jj];
      if (shortPath == packageLocation) {
        return entry;
      }
    }
  };

  var findPackage = function(entries) {
    for (var ii = 0; ii < entries.length; ++ii) {
      var entry = checkPackageLocations(entries[ii]);
      if (entry) {
        return entry;
      }
    };
  };

  try {
    // Find the packageInfo
    var packageEntry = findPackage(entries);
    if (!packageEntry) {
      throw new Error("no package.json found in " + releasePath);
    }
    runtimeInfo = gameInfo.parseGameInfo(packageEntry.asText(), path.join(releasePath, packageEntry.name), ".");
    var packageBasePath = packageEntry.name.replace(/\\/g, "/");
    packageBasePath = packageBasePath.substring(0, packageBasePath.indexOf("/"));

  } catch (e) {
    console.error("could not parse package.json. Maybe this is not a HappyFunTimes game?");
    console.error(e);
    return false;
  }

  var info = runtimeInfo.info;
  var hftInfo = info.happyFunTimes;
  var gameId = runtimeInfo.originalGameId;
  var destBasePath;

  // is it already installed?
  var installedGame = gameDB.getGameById(gameId);
  if (installedGame) {
    if (!options.overwrite) {
      console.error("game " + gameId + " already installed at: " + installedGame.rootPath);
      return false;
    }
    // Was it "installed" or just added?
    if (installedGame.files) {
      destBasePath = installedGame.rootPath;
    }
  }

  var safeGameId = releaseUtils.safeishName(gameId);

  if (!destBasePath) {
      // make the dir after we're sure we're ready to install
      destBasePath = path.join(config.getConfig().gamesDir, safeGameId);
  }

  destBasePath = opt_destPath ? opt_destPath : destBasePath;

  console.log("installing to: " + destBasePath);
  if (!options.dryRun) {
    mkdirp.sync(destBasePath);
  }

  var files = [];
  var bad = false;
  entries.forEach(function(entry) {
    if (bad) {
      return;
    }
    var filePath = entry.name.substring(packageBasePath.length + 1);
    files.push(filePath);
    var destPath = path.resolve(path.join(destBasePath, filePath));
    if (destPath.substring(0, destBasePath.length) != destBasePath) {
      console.error("ERROR: bad zip file. Path would write outside game folder");
      bad = true;
    } else {
      var isDir = entry.dir;
      if (destPath.substr(-1) == "/" || destPath.substr(-1) == "\\") {
        destPath = destPath.substr(0, destPath.length - 1);
        isDir = true;
      }
      //??
      if (isDir) {
        log("mkdir  : " + destPath);
        if (!options.dryRun) {
          mkdirp.sync(destPath);
        }
      } else {
        log("install: " + entry.name + " -> " + destPath);
        if (!options.dryRun) {
          var dirPath = path.dirname(destPath);
          if (!fs.existsSync(dirPath)) {
            log("mkdir  : " + dirPath);
            mkdirp.sync(dirPath);
          }
          fs.writeFileSync(destPath, entry.asNodeBuffer());
        }
      };
    }
  });

  if (bad) {
    // Should delete all work here?
    return false;
  }

  // Should this be in the zip?
  if (hftInfo.gameType.toLowerCase() == "unity3d") {
    var exePath = platformInfo.exePath;
    if (exePath) {
      exePath = path.join(destBasePath, strings.replaceParams(exePath, { gameId: safeGameId }));
      if (!fs.existsSync(exePath)) {
        console.error("path not found: " + exePath);
        return false;
      }
      fs.chmodSync(exePath, (7 << 6) | (4 << 3) | 4);
    }
  }


  log("add: " + destBasePath);
  if (!options.dryRun) {
    games.add(destBasePath, files);
  }

  if (!options.dryRun) {
    console.log("installed:" + releasePath);
  }
};

/**
 * @typedef {Object} Uninstall~Options
 * @property {boolean?} verbose print extra info
 * @property {boolean?} dryRun true = don't write any files or
 *           make any folders.
 */

exports.install = install;

