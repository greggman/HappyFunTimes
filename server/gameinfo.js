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

var debug = require('debug')('gameinfo');
var fs = require('fs');
var path = require('path');
var misc = require('./misc');
var config = require('./config');
var semver = require('semver');

var applyDefaultProperties = function(obj, defaults) {
  if (!defaults) {
    return;
  }
  misc.copyProperties(defaults, obj, 1);
};


/**
 * @typedef {Object} GameInfo~Settings
 * @property {string[]} required the happyFunTimes properties in
 *           package.json
 * @property {Object} hftDefaults the default happyFunTimes
 *           properties
 * @property {Object} hftGameTypeDefaults the default
 *           happyFunTimes properties by gameType
 * @property {Object} apiVersionSettings settings by apiVersion.
 */


var GameInfo = function() {
};

/**
 * Test if gameId is valid.
 * @param {string} gameId id to test
 * @throws {Error} if not valid
 */
var validGameId = (function() {
  var idRE = /^[a-zA-Z0-9-_]+$/;
  return function(id) {
    if (!id) {
      throw ("gameId not defined");
    }
    if (!idRE.test(id)) {
      throw ("invalid characters in gameId only A-Z a-z 0-9 _ - allowed");
    }
    if (id.length > 60) {
      throw ("gameId must be less than 60 characters");
    }
    return true;
  };
}());

GameInfo.prototype.readGameInfo = function(filePath) {
  try {
    var stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, "package.json");
    }
    var contents = fs.readFileSync(filePath);
    return this.parseGameInfo(contents, filePath);
  } catch (e) {
    console.error("ERROR: Reading " + filePath);
    throw e;
  }
};

var validSemver = function(v) {
  if (!semver.valid(v)) {
    throw ("not a valid semver");
  }
};

var validString = function(v) {
  if (typeof(v) !== "string") {
    throw ("not a string");
  }
};

var validNumber = function(v) {
  if (typeof(v) !== "number") {
    throw ("not a number");
  }
};

var validGameType = function(v) {
  validString(v);
};

var requiredFields = {
  gameId:     { type: validGameId, },
  apiVersion: { type: validSemver, },
  gameType:   { type: validString, },
  category:   { type: validString, },
  minPlayers: { type: validNumber, },
};

var validateObject = function(obj, validators) {
  Object.keys(validators).forEach(function(fieldName) {
    var info = validators[fieldName];
    try {
      info.type(obj[fieldName]);
    } catch (e) {
      throw (fieldName + ": " + e);
    }
  });
};

GameInfo.prototype.parseGameInfo = function(contents, filePath) {
  try {
    var packageInfo = JSON.parse(contents);
    var hftInfo = packageInfo.happyFunTimes;
    if (!hftInfo) {
      console.error("error: " + filePath + " is missing happyFunTimes section");
      return;
    }

    var gameBasePath = path.dirname(filePath);
    var settings = config.getSettings();
    applyDefaultProperties(hftInfo, settings.hftDefaults);
    applyDefaultProperties(hftInfo, settings.hftGameTypeDefaults[hftInfo.gameType]);

    try {
      validateObject(hftInfo, requiredFields);
    } catch (e) {
      console.error("error: " + filePath + " happyFunTimes." + e);
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
      hftInfo.gameExecutable = path.relative(path.join(gameBasePath, hftInfo.gameExecutable));
      var fullPath = path.normalize(hftInfo.gameExecutable);
      if (gameBasePath != fullPath.substring(0, gameBasePath.length)) {
        throw "bad path for game executable: " + fullPath;
      }
    }

    hftInfo.basePath = gameBasePath;

  } catch (e) {
    console.error("ERROR: Parsing " + filePath);
    throw e;
  }
  return packageInfo;
};

module.exports = new GameInfo();


