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

var debug        = require('debug')('make');
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

  var filterFunc = function(filename) {
    return filter(filename, baseSrcPath, fs.statSync(path.join(baseSrcPath, filename)).isDirectory());
  };

  var fileNames = readdirtree.sync(baseSrcPath, {filter: /^(?!\.)/});
  fileNames = fileNames.filter(filterFunc);

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
      debug("adding dir: " + zipName);
      zip.addDir(zipName);
    } else {
      debug("adding file: " + srcPath);
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
  var ignoreFilter = readdirtree.makeIgnoreFilter(runtimeInfo.info.happyFunTimes.ignore);
  var filter = function(filename, filePath, isDir) {
    var pass = ignoreFilter(filename, filePath, isDir);
    if (!pass) {
      debug("ignore: " + filename);
    }
    return pass;
  };

  return makeZip(runtimeInfo.originalGameId, gamePath, destPath, filter);
};

var makeUnity3d = function(runtimeInfo, gamePath, destFolder/*, options*/) {
  var gameId = runtimeInfo.originalGameId;

  var ignoreFilter = readdirtree.makeIgnoreFilter(runtimeInfo.info.happyFunTimes.ignore);
  var destPath = path.join(destFolder, releaseUtils.safeishName(gameId) + ".controller.zip");
  var binStart = "bin/";
  var excludeRE = /^(src|Assets(?!\/WebPlayerTemplates)|Library|ProjectSettings|Temp)\//i;
  var extRE = /\.(meta|sln|userprefs|csproj)$/i;
  var filter = function(nativeFilename, filePath, isDir) {
    var filename = nativeFilename.replace(/\\/g, '/');
    if (excludeRE.test(filename) || extRE.test(filename)) {
      return false;
    }
    if (strings.startsWith(filename, binStart)) {
      return false;
    }
    var pass = ignoreFilter(nativeFilename, filePath, isDir);
    if (!pass) {
      debug("ignore: " + nativeFilename);
    }
    return pass;
  };
  return makeZip(gameId, gamePath, destPath, filter);
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

