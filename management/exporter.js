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
var debug        = require('debug')('exporter');
var fs           = require('fs');
var path         = require('path');
var platformInfo = require('../lib/platform-info');
var Promise      = require('promise');
var utils        = require('../lib/utils');

/**
 * @typedef {Object} Exporter~Options
 * @property {string?} destPath where to export
 * @property {string?} exporterPath path to exporter
 */

/**
 * Exports a game
 *
 * @param {RuntimeInfo} runtimeInfo as returned from
 *        GameInfo.readGameInfo
 * @param {Exporter~Options?} options
 * @return Promise
 */
var exporter = function(runtimeInfo, options) {

  var executeP = Promise.denodeify(utils.execute);

  var makeExecPromise = function(id, binPath, logPath, cmd, args) {
    return function() {
      console.log("exporting for: " + id + " -> " + binPath);
      return executeP(cmd, args).catch(function() {
        console.error("failed to export for " + id);
        console.error("see log file for details: " + logPath);
        return Promise.reject();
      });
      // TODO: add then to check log for success
    }
  };

  var exportHtml = function() {
    console.log("no exporter needed for html games");
    return Promise.resolve();
  };

  var exportUnity3d = function(runtimeInfo, options) {
    var basePath = runtimeInfo.basePath;
    var gamePath = basePath;

    // Check for Assets. Should we check for ProjectSettings?
    var assetsPath = path.join(gamePath, "Assets");
    if (!fs.existsSync(assetsPath)) {
      if (!(/WebPlayerTemplates/i).test(assetsPath)) {
        return Promise.reject(new Error("Could not find WebPlayerTemplates folder"))
      }
      assetsPath = path.join(gamePath, "..", "..", "..", "Assets");
      if (!fs.existsSync(assetsPath)) {
        return Promise.reject(new Error("Could not find Assets : " + assetsPath))
      }
      gamePath = path.dirname(assetsPath);
    }

    var binFolder = options.dstPath || path.join(basePath, "bin");
    if (!fs.existsSync(binFolder)) {
      fs.mkdir(binFolder);
    }

    var gameId = runtimeInfo.originalGameId;

    return new Promise(function(resolve, reject) {
      var exporterPath = options.exporterPath || platformInfo.exporterPath;
      if (!fs.existsSync(exporterPath)) {
        reject(new Error("could not find exporter at: " + exporterPath));
      }

      // /Applications/Unity/Unity.app/Contents/MacOS/Unity
      //   -batchmode
      //   -buildWindowsPlayer /Users/gregg/src/hft-unitycharacterexample/bin/unitycharacterexample-win.exe
      //   -logFile $T/unity.log -projectPath /Users/gregg/src/hft-unitycharacterexample
      //   -quit -nographics

      var promises = [];
      var platforms = buildInfo.get().platforms;
      platforms.forEach(function(platInfo) {

        var binPath = path.join(binFolder, gameId + (platInfo.binSuffix ? platInfo.binSuffix : ""));
        var logPath = binPath + ".log";

        promises.push(makeExecPromise(platInfo.platform, binPath, logPath, exporterPath, [
          '-batchmode',
          platInfo.unityTarget, binPath,
          '-logFile', logPath,
          '-projectPath', gamePath,
          '-quit',
          '-nographics',
        ]));
      });

      promises.reduce(function(cur, next) {
        return cur.then(next);
      }, Promise.resolve()).then(resolve, reject);
    });
  };

  options = options || {};
  var gameTypes = {
    html: exportHtml,
    unity3d: exportUnity3d,
  };

  var gameType = runtimeInfo.info.happyFunTimes.gameType;
  var x = gameTypes[gameType.toLowerCase()];
  if (!x) {
    return Promise.reject("unknown gameType: " + gameType);
  } else {
    return x(runtimeInfo, options);
  }
};

exports.exporter = exporter;

