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

var ZipWriter = require("moxie-zip").ZipWriter;
var JSZip = require('jszip');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var gameInfo = require('../server/gameinfo');
var gameDB = require('../server/gamedb');
var games = require('../management/games');
var config = require('../server/config');
var strings = require('../server/strings');

var ReleaseManager = function() {

  var readDirTreeSync = function(filePath, options) {
    options = options || {};

    var filter = options.filter;
    if (filter === undefined) {
      filter = function() { return true; };
    } else if (filter instanceof RegExp) {
      filter = function(filter) {
        return function(filename) {
          return filter.test(filename);
        }
      }(filter);
    }

    var fileNames = fs.readdirSync(filePath).filter(filter).map(function(fileName) {
      return path.join(filePath, fileName);
    });

    var subdirFilenames = [];
    fileNames.forEach(function(fileName) {
      var stat = fs.statSync(fileName);
      if (stat.isDirectory()) {
        subdirFilenames.push(readDirTreeSync(fileName));
      }
    });

    subdirFilenames.forEach(function(subNames) {
      fileNames = fileNames.concat(subNames);
    });

    return fileNames;
  };




  // Remove this if Zip adds the filter.
//  var addLocalFolder = (function() {
//    var Utils = require('../node_modules/adm-zip/util/utils.js');
//    return function(zip, /*String*/localPath, /*String*/zipPath, /*RegExp|Function*/filter) {
//      if (filter === undefined) {
//        filter = function() { return true; };
//      } else if (filter instanceof RegExp) {
//        filter = function(filter) {
//          return function(filename) {
//            return filter.test(filename);
//          }
//        }(filter);
//      }
//
//      if(zipPath){
//          zipPath=zipPath.split("\\").join("/");
//          if(zipPath.charAt(zipPath.length - 1) != "/"){
//              zipPath += "/";
//          }
//      }else{
//          zipPath="";
//      }
//      localPath = localPath.split("\\").join("/"); //windows fix
//      if (localPath.charAt(localPath.length - 1) != "/")
//          localPath += "/";
//
//      if (fs.existsSync(localPath)) {
//
//          var items = Utils.findFiles(localPath);
//          if (items.length) {
//              items.forEach(function(path) {
//                  var p = path.split("\\").join("/").replace(localPath, ""); //windows fix
//                  if (filter(p)) {
//                      if (p.charAt(p.length - 1) !== "/") {
//                          zip.addFile(zipPath+p, fs.readFileSync(path), "", 0)
//                      } else {
//                          zip.addFile(zipPath+p, new Buffer(0), "", 0)
//                      }
//                  }
//              });
//          }
//      } else {
//          throw Utils.Errors.FILE_NOT_FOUND.replace("%s", localPath);
//      }
//    };
//  }());


  /**
   * Makes a release.
   *
   * I'm not sure this belongs here but since installing a release
   * belongs here then it seems prudent to keep the 2 together
   * since they need to match.
   *
   * @param {string} gamePath path to folder of game
   * @param {stirng} destPath path to save zip file.
   */
  var make = function(gamePath, destPath, callback) {
    // Make sure it's a game!
    var info = gameInfo.readGameInfo(gamePath);
    if (!info) {
      return false;
    }

    switch (info.happyFunTimes.gameType) {
      case 'html':
        break;
      default:
        console.error("unsupported gametype: " + info.happyFunTimes.gameType)
        break;
    }

    var fileNames = readDirTreeSync(gamePath, {filter: /^(?!\.)/});
    var zip = new ZipWriter();
    fileNames.forEach(function(fileName) {
      var zipName = path.join(info.happyFunTimes.gameId, fileName.substring(gamePath.length)).replace(/\\/g, '/');
      var stat = fs.statSync(fileName);
      if (stat.isDirectory()) {
        zip.addDir(zipName);
      } else {
        var buffer = fs.readFileSync(fileName);
        zip.addData(zipName, buffer);
      }
    });
    zip.saveAs(destPath, callback);
  };

  /**
   * @typedef {Object} Install~Options
   * @property {boolean?} overwrite default false. Install even if
   *           already installed. (not implemented)
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
    var info;
    var packageBasePath;

    try {
      // Find the packageInfo
      for (var ii = 0; ii < entries.length; ++ii) {
        var entry = entries[ii];
        var baseName = path.basename(entry.name);
        var dirName = path.dirname(entry.name);
        if (dirName.indexOf("/") < 0 && baseName == "package.json") {
          info = gameInfo.parseGameInfo(entry.asText(), path.join(releasePath, entry.name));
          packageBasePath = dirName;
          break;
        }
      }
    } catch (e) {
      console.error("error " + e + ": could not parse package.json. Maybe this is not a HappyFunTimes game?");
      return false;
    }

    var hftInfo = info.happyFunTimes;
    var gameId = hftInfo.gameId;
    var destBasePath;

    // is it already installed?
    var installedGame = gameDB.getGameById(gameId);
    if (installedGame) {
      if (!options.overwrite) {
        console.error("game " + gameId + " already installed at: " + installedGame.happyFunTimes.basePath);
        return false;
      }
      destBasePath = installedGame.happyFunTimes.basePath
    } else {
      // make the dir after we're sure we're ready to install
      destBasePath = path.join(config.getConfig().gamesDir, info.happyFunTimes.gameId);
    }

    destBasePath = opt_destPath ? opt_destPath : destBasePath;

    console.log("installing to: " + destBasePath);
    if (!options.dryRun) {
      mkdirp.sync(destBasePath);
    }

    entries.forEach(function(entry) {
      var filePath = entry.name.substring(packageBasePath.length + 1);
      var destPath = path.join(destBasePath, filePath);
      if (entry.dir) {
        log("mkdir  : " + destPath);
        if (!options.dryRun) {
          mkdirp.sync(destPath);
        }
      } else {
        log("install: " + entry.name + " -> " + destPath);
        if (!options.dryRun) {
          fs.writeFileSync(destPath, entry.asNodeBuffer());
        }
      };
    });

    log("add: " + destBasePath);
    if (!options.dryRun) {
      games.add(destBasePath);
    }
  };

  /**
   * @typedef {Object} Download~Options
   * @property {boolean?} overwrite default false. Install even if
   *           already installed.
   * @property {boolean?} verbose print extra info
   * @property {boolean?} dryRun true = don't write any files or
   *           make any folders.
   * @property {string?} gamesUrl URL to get game info from.
   * @property {string?} version version of game to download?
   *           (not implemented)
   */

  /**
   * Downloads and installs a game by gameId
   * @param {string} gameId the gameId for the game
   * @param {string?} opt_destPath path to install game.
   * @param {Download~Options?) options
   */
  var download = function(gameId, opt_destPath, options) {
    // get game
    url = options.gamesUrl || config.getSettings().gamesUrl;
  };

  this.download = download.bind(this);
  this.install = install.bind(this);
  this.make = make.bind(this);
};

module.exports = new ReleaseManager();

