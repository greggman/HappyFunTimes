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

var buildInfo    = require('./build-info');
var exporter     = require('./exporter');
var fs           = require('fs');
var gameInfo     = require('../lib/gameinfo');
var path         = require('path');
var Promise      = require('promise');
var readdirtree  = require('../lib/readdirtree');
var releaseUtils = require('./release-utils');
var strings      = require('../lib/strings');
var ZipWriter    = require("moxie-zip").ZipWriter;

var goodNameRE = /^[a-zA-Z0-9_ \.\\\/-]+$/;

var makeZip = function(gameId, baseSrcPath, destPath, filter) {
  if (filter === undefined) {
    filter = function() {
      return true;
    };
  } else if (filter instanceof RegExp) {
    filter = function(filter) {
      return function(filename) {
        return filter.test(filename);
      };
    }(filter);
  }

  var fileNames = readdirtree.sync(baseSrcPath, {filter: /^(?!\.)/});
  fileNames = fileNames.filter(filter);

  // check there are no non-casesenative duplicates
  var lowerCaseFileNames = fileNames.map(function(f) {
    return f.toLowerCase();
  }).sort();
  for (var ii = 0; ii < lowerCaseFileNames.length - 1; ++ii) {
    if (lowerCaseFileNames[ii] === lowerCaseFileNames[ii + 1]) {
      return Promise.reject(new Error("two filenames are different only by case which won't work on some platforms: " + lowerCaseFileNames[ii]));
    }
  }

  // check there are no non-ascii names
  var badNames = fileNames.filter(function(fileName) {
    return !goodNameRE.test(fileName);
  });

  if (badNames.length > 0) {
    return Promise.reject(new Error("only alphanumeric names are allowed a-z 0-9 _ - and space:\n\t" + badNames.join("\n\t")));
  }

  // check no names are too long. Let's limit to 192 characters so /Users/someusername/happyFunTimes/whatever/ +  192 is less than 256?
  var longNames = fileNames.filter(function(fileName) {
    return fileName.length > 192;
  });

  if (longNames.length > 0) {
    return Promise.reject(new Error("max path length 192 characters. These are too long\n\t" + longNames.join("\n\t")));
  }

  var zip = new ZipWriter();
  fileNames.forEach(function(fileName) {
    var zipName = path.join(gameId, fileName).replace(/\\/g, '/');
    var srcPath = path.join(baseSrcPath, fileName);
    var stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      zip.addDir(zipName);
    } else {
      var buffer = fs.readFileSync(srcPath);
      zip.addData(zipName, buffer);
    }
  });

  return new Promise(function(fulfill, reject) {
    zip.saveAs(destPath, function(err) {
      if (err) {
        reject(err);
      } else {
        fulfill([{filename:destPath}]);
      }
    });
  });
};

var makeHTML = function(runtimeInfo, gamePath, destFolder/*, options*/) {
  var destPath = path.join(destFolder, releaseUtils.safeishName(runtimeInfo.originalGameId) + "-html.zip");
  return makeZip(runtimeInfo.originalGameId, gamePath, destPath);
};

var makeUnity3d = function(runtimeInfo, gamePath, destFolder, options) {
  var gameId = runtimeInfo.originalGameId;

  var promise;
  if (options.export) {
    promise = exporter.exporter(runtimeInfo, { exporterPath: options.exporterPath });
  } else {
    promise = Promise.resolve();
  }

  return promise.then(function() {
    var platInfos = [];
    var platforms = buildInfo.get().platforms;
    platforms.forEach(function(platform) {
      var missing = false;
      var binPath;
      var dirPath;
      if (platform.binSuffix) {
        binPath = path.join("bin", gameId + platform.binSuffix);
        var localBinPath = path.join(gamePath, binPath);
        if (!fs.existsSync(localBinPath)) {
          missing = true;
          console.log("no binary for " + platform.platform);
          console.log("expected: " + localBinPath);
        }
      }

      if (!missing) {
        dirPath = path.join("bin", gameId + platform.dirSuffix);
        var localDirPath = path.join(gamePath, dirPath);
        if (!fs.existsSync(localDirPath)) {
          missing = true;
          console.log("no data folder for " + platform.platform);
          console.log("expected: " + localDirPath);
        }
      }

      if (!missing) {
        var datePath = path.join(gamePath, "bin", gameId + strings.replaceParams(platform.dateCheck, {gameId: gameId}));
        var stat = fs.statSync(datePath);
        platInfos.push({platform: platform, binPath: binPath, dirPath: dirPath, stat: stat});
      }
    });

    var tooOld = false;
    if (platInfos.length > 1) {
      platInfos.sort(function(a, b) {
        return a.stat.mtime === b.stat.mtime ? 0 : (a.stat.mtime < b.stat.mtime ? -1 : 1);
      });

      var newest = platInfos[platInfos.length - 1];
      var oldest = platInfos[0];

      var timeDiff = newest.stat.mtime - oldest.stat.mtime;
      if (timeDiff > 1000 * 60 * 120) {
        console.log("oldest executable (" + oldest.platform.platform + ") is more than 2 hours older than newest (" + newest.platform.platform + ")");
        tooOld = true;
      }
    }

    var promise;
    if (!tooOld && platInfos.length === platforms.length) {
      promise = Promise.resolve({confirmation: 'y'});
    } else {
      promise = releaseUtils.askPrompt([
        {
          name: 'confirmation',
          type: 'input',
          message: 'continue y/N?',
          default: 'n',
        },
      ]);
    }

    return promise.then(function(answers) {
      if (answers.confirmation.toLowerCase() !== 'y') {
        return Promise.reject(new Error("aborted"));
      }

      var promises = [];
      platInfos.forEach(function(platInfo) {
        var destPath = path.join(destFolder, releaseUtils.safeishName(gameId) + platInfo.platform.zipSuffix);
        var binStart = "bin/";
        var excludeRE = /^(src|Assets(?!\/WebPlayerTemplates)|Library|ProjectSettings|Temp)\//i;
        var filter = function(nativeFilename) {
          var filename = nativeFilename.replace(/\\/g, '/');
          if (excludeRE.test(filename)) {
            return false;
          }
          if (strings.startsWith(filename, binStart)) {
            if (platInfo.binPath && nativeFilename === platInfo.binPath) {
              return true;
            }
            if (platInfo.dirPath && strings.startsWith(nativeFilename, platInfo.dirPath)) {
              return true;
            }
            return false;
          }
          return true;
        };
        promises.push(makeZip(gameId, gamePath, destPath, filter));
      });
      return Promise.all(promises);
    }).then(function(zipFiles) {
      var result = Array.prototype.concat.apply([], zipFiles);
      return Promise.resolve(result);
    });
  });
};

var makers = {
  html: makeHTML,
  unity3d: makeUnity3d,
};

/**
 * @typedef {object} Make~Options
 * @property {boolean} export true = run exporters for native
 *           apps.
 * @property {string} exporterPath Path to exporter. We check
 *           default paths if this is not specified.
 */

/**
 * @typedef {object} Make~FileInfo
 * @property {string} filename Path to file
 */

/**
 * @promise Make~MakePromise
 * @reject {Error} error
 * @fulfill {Make~FileInfo[]} files array of paths to files
 *        created
 */

/**
 * Makes a release.
 *
 * I'm not sure this belongs here but since installing a release
 * belongs here then it seems prudent to keep the 2 together
 * since they need to match.
 *
 * @param {string} gamePath path to folder of game
 * @param {string} destFolder path to save release files.
 * @param {Make~Options?} options
 * @returns {Make~Promise}
 */
var make = function(gamePath, destFolder, options) {
  options = options || {};

  // Make sure it's a game!
  var runtimeInfo = gameInfo.readGameInfo(gamePath);
  if (!runtimeInfo) {
    return Promise.reject(new Error("not a game: " + gamePath));
  }

  var hftInfo = runtimeInfo.info.happyFunTimes;
  var maker = makers[hftInfo.gameType.toLowerCase()];
  if (!maker) {
    return Promise.reject(new Error("unsupported game type:" + hftInfo.gameType));
  }

  try {
    gameInfo.checkRequiredFiles(runtimeInfo, gamePath);
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder);
    }
  } catch (e) {
    return Promise.reject(new Error(e.toString()));
  }


  return maker(runtimeInfo, gamePath, destFolder, options);
};

exports.make = make;

