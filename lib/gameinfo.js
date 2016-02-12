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

var fs          = require('fs');
var path        = require('path');
var misc        = require('./misc');
var config      = require('./config');
var readdirtree = require('./readdirtree');
var semver      = require('semver');
var strings     = require('./strings');

var applyDefaultProperties = function(obj, defaults) {
  if (!defaults) {
    return;
  }
  misc.copyProperties(defaults, obj, 1);
};

var screenshotRE = /^screenshot(?:-\d\d){0,1}\.(jpg|png|gif|svg)$/i;
var screenshotSort = function(a, b) {
  a = a.substring(0, a.lastIndexOf("."));
  b = b.substring(0, b.lastIndexOf("."));
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
};

var iconRE = /^icon\.(jpg|png|gif)$/i;
var faviconRE = /^favicon\.(jpg|png|gif)$/i;

/**
 * @typedef {Object} HappyFunTimes~Info
 * @property {string} gameId
 * @property {string} category
 * @property {string} apiVersion
 * @property {string} gameType the type of game (eg. 'html',
 *           'Unity', ...)
 * @property {number} minPlayers
 */

/**
 * @typedef {Object} NPM~Info
 * @property {string} name
 * @property {string} description
 * @property {string} version
 * @property {boolean} private
 * @property {HappyFunTimes~Info} happyFunTimes
 */

/**
 * @typedef {Object} HFT~TemplateInfo
 * @property {string} name name of template
 */

/**
 * @typedef {Object} HFT~RuntimeInfo
 * @property {NPM~Info} info
 * @property {boolean?} needNewHFT
 * @property {HFT~VersionSettings} versionSettings
 * @property {string} gameUrl the baseDir relative path to the
 *           game's html page if it's an html based game.
 * @property {string} screenshotUrl the baseDir relative path to
 *           the game's screenshot.
 * @property {string} gameExecutable the baseDir relative path
 *           to the game's executable if it's a native
 *           executable. Like a Unity game for example.
 * @property {string} [screenshotUrl]
 * @property {string} [gameExecutable] (not used?)
 * @property {string} htmlPath Path to html files (see rootPath)
 * @property {string} rootPath path to all files.
 *    Originally htmlPath and rootPath where the same but
 *    for some unity projects htmlPath will be
 *    <rootPath>/Assets/WebPlayerTemplates/HappyFunTimes
 * @property {string} packagePath. Path to package.json
 *    Originally was <rootPath>/package.json but now can also be
 *    <rootPath>/Assets/WebPlayerTemplates/HappyFunTimes/package.json
 * @property {Object.<string, boolean} templateUrls which urls need substitutions.
 *    This is poorly named. It means treat this URL like template by calling string.replaceParams
 *    on it.
 * @property {Object.<string>
 *
 * @property {string[]} files added in addGamesByList. It's used
 *           by uninstall
 */

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

GameInfo.prototype.getPackageLocations = function() {
  return [
    { minVersion:  "0.0.0", packagePath: "package.json",                                         },
    { minVersion:  "1.7.0", packagePath: "HappyFunTimes/package.json",                           },
    { minVersion:  "1.7.0", packagePath: "Assets/WebPlayerTemplates/HappyFunTimes/package.json", },
    { minVersion: "1.11.0", packagePath: "--unnamed-pkg--", },  // for games that bundle controller info.
  ];
};

/**
 * @param {string} rootPath root path of game.
 * @return {HFT~RuntimeInfo}
 */
GameInfo.prototype.readGameInfo = function(rootPath) {
  try {
    var packageLocations = this.getPackageLocations();
    for (var ii = 0; ii < packageLocations.length; ++ii) {
      var filePath = path.join(rootPath, packageLocations[ii].packagePath);
      if (fs.existsSync(filePath)) {
        var contents = fs.readFileSync(filePath, {encoding: "utf-8"});
        return this.parseGameInfo(contents, filePath, rootPath);
      }
    }
    throw new Error("no package.json found in " + rootPath);
  } catch (e) {
    console.error("ERROR: Reading " + filePath);
    throw e;
  }
};

/**
 * @param {HFT~RuntimeInfo} runtimeInfo info to write.
 * @param {string?} filePath optional path to write.
 */
GameInfo.prototype.writeGameInfo = function(runtimeInfo, filePath) {
  filePath = filePath || runtimeInfo.packagePath;
  if (path.basename(filePath) !== "package.json") {
    filePath = path.join(filePath, "package.json");
  }

  // This is so hacky but we muck with the gameId for non-installed games
  // so put it back before writing
  var info = JSON.parse(JSON.stringify(runtimeInfo.info));
  info.happyFunTimes.gameId = runtimeInfo.originalGameId;

  fs.writeFileSync(filePath, JSON.stringify(info, undefined, "  "));
};

var safeishName = function(gameId) {
  return gameId.replace(/[^a-zA-Z0-9-_]/g, '_');
};

GameInfo.prototype.makeRuntimeGameId = function(gameId, htmlPath) {
  return (!strings.startsWith(htmlPath, config.getConfig().gamesDir)) ?
      ("(" + safeishName(htmlPath) + ")" + gameId) : gameId;
};

var validSemver = function(v) {
  if (!semver.valid(v)) {
    throw ("not a valid semver");
  }
};

var validString = function(v) {
  if (typeof v  !== "string") {
    throw ("not a string");
  }
};

var validNumber = function(v) {
  if (typeof v !== "number") {
    throw ("not a number");
  }
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

GameInfo.prototype.checkRequiredFiles = (function() {
  var baseChecks = [
    { re: /^icon\.(jpg|png|gif|svg)$/i,
      msg: "no icon found. Must have 64x64 or 128x128 pixel icon.png/jpg/gif in folder ",
      warn: true,
    },
    { re: /^screenshot(?:-\d\d){0,1}\.(jpg|png|gif|svg)$/i,
      msg: "no screenshots found. Must have 640x480 pixel screenshot.png/jpg/gif or screenshot-00 to screenshot-05 in folder",
      warn: true,
    },
  ];

  var controllerChecks = [
    { re: /^controller.html$/,
      msg: "no controller.html",
    },
    { re: /^css\/controller.css$/,
      msg: "no css\/controller.css",
    },
    { re: /^scripts\/controller.js$/,
      msg: "no scripts\/controller.js",
    },
  ];

  var gameTypeChecks = {
    html: [
      { re: /^game.html$/,
        msg: "no game.html",
      },
      { re: /^game.html$/,
        msg: "no game.html",
      },
      { re: /^css\/game.css$/,
        msg: "no css\/game.css",
      },
      { re: /^scripts\/game.js$/,
        msg: "no scripts\/game.js",
      },
    ].concat(controllerChecks),
    unity3d: [
    ].concat(controllerChecks),
  };

  return function(runtimeInfo, fileNames) {
    var info = runtimeInfo.info;
    var found = [];
    var foundCount = 0;

    var checks = baseChecks.slice();
    var gameChecks = gameTypeChecks[info.happyFunTimes.gameType.toLowerCase()];
    if (gameChecks) {
      checks = checks.concat(gameChecks);
    }

    fileNames = fileNames || readdirtree.sync(runtimeInfo.htmlPath);
    for (var ii = 0; ii < fileNames.length && foundCount < checks.length; ++ii) {
      var fileName = fileNames[ii].replace(/\\/g, '/');
      checks.forEach(function(check, ndx) {  // eslint-disable-line
        if (!found[ndx]) {
          if (check.re.test(fileName)) {
            found[ndx] = true;
            ++foundCount;
          }
        }
      });
    }

    var errors = [];
    checks.forEach(function(check, ndx) {
      if (!found[ndx]) {
        if (check.warn) {
          console.warn(check.msg);
        } else {
          errors.push(check.msg);
        }
      }
    });

    if (errors.length) {
      throw errors.join("\n");
    }
  };

}());

/**
 * Parse a package.json. Check for errors.
 *
 * @param {string} contents JSON string of package.json
 * @param {string} packagePath path of package.json
 * @param {string} rootPath root of game
 * @return {HFT~RuntimeInfo}
 */
GameInfo.prototype.parseGameInfo = function(contents, packagePath, rootPath) {
  try {
    var packageInfo = JSON.parse(contents);
    var runtimeInfo = {
      info: packageInfo,
      urls: {
        favicon: "/hft-icon.png",
      },
    };
    var hftInfo = packageInfo.happyFunTimes;
    if (!hftInfo) {
      console.error("error: " + rootPath + " is missing happyFunTimes section");
      return;
    }

    var settings = config.getSettings();
    var htmlPath = path.dirname(packagePath);

    runtimeInfo.name = hftInfo.name || packageInfo.name || "*un-named*";
    // Figure out base path?

    applyDefaultProperties(runtimeInfo, settings.hftDefaults);
    applyDefaultProperties(runtimeInfo, settings.hftGameTypeDefaults[hftInfo.gameType]);

    try {
      validateObject(hftInfo, requiredFields);
    } catch (e) {
      console.error("error: " + packagePath + " happyFunTimes.");
      console.error(e);
      return;
    }

    // Prefix if not in gamesDir
    runtimeInfo.originalGameId = hftInfo.gameId;
    hftInfo.gameId = this.makeRuntimeGameId(hftInfo.gameId, htmlPath);

    if (settings.hftGameTypeDefaults[hftInfo.gameType] === undefined) {
      console.error("warning: " + packagePath + " unknown gameType " + hftInfo.gameType);
      console.error("valid gameTypes: \n\t" + Object.keys(settings.hftGameTypeDefaults).join("\n\t"));
      return;
    }

    var canUse = function(have, need) {
      var nextMajorVersion = semver.inc(need, 'major');
      var result = semver.satisfies(have, '>=' + need + ' ' + '<' + nextMajorVersion);
      return result;
    };

    var getBestVersion = function(haves, need) {
      var best;
      haves.forEach(function(have) {
        if (canUse(have, need)) {
          if (!best || semver.gt(have, best)) {
            best = have;
          }
        }
      });

      return best;
    };

    var availableVersions = Object.keys(settings.apiVersionSettings);
    //var need = '^' + hftInfo.apiVersion;
    //var bestVersion = semver.maxSatisfying(availableVersions, need);
    var need = hftInfo.apiVersion;
    var bestVersion = getBestVersion(availableVersions, need);
    if (!bestVersion) {
      console.warn("warning: " + packagePath + " requires unsupported api version: " + hftInfo.apiVersion + ". You probably need to upgrade happyFunTimes");
      bestVersion = "0.0.0-unsupportedApiVersion";
      runtimeInfo.needNewHFT = true;
    }

    // Check it's not using an unsupported path
    var validPackagePath = false;
    var relativePackagePath = path.relative(rootPath, packagePath).replace(/\\/g, "/");
    var packageLocations = this.getPackageLocations();
    for (var ii = 0; ii < packageLocations.length; ++ii) {
      var packageLocation = packageLocations[ii];
      if (packageLocation.packagePath === relativePackagePath) {
        if (semver.lt(hftInfo.apiVersion, packageLocation.minVersion)) {
          console.warn("error: package.json apiVersion must be " + packageLocation.minVersion + " or greater to use path " + relativePackagePath + " in " + rootPath);
          runtimeInfo.needNewHFT = true;
        }
        validPackagePath = true;
        break;
      }
    }

    if (!validPackagePath) {
      console.error("invalid package path: " + packagePath);
      return;
    }

    runtimeInfo.versionSettings = settings.apiVersionSettings[bestVersion];
    if (runtimeInfo.versionSettings === undefined) {
      console.error("error: " + packagePath + " unknown apiVersion " + hftInfo.apiVersion);
      console.error("valid apiVersions: \n\t" + Object.keys(settings.apiVersionSettings).join("\n\t"));
      return;
    }

    var gameType = hftInfo.gameType;
    if (!gameType) {
      return;
    }

    // This is because we call this when reading a zip file
    // at which point there's no directory to read. Hmm
    if (fs.existsSync(htmlPath)) {
      var filenames = readdirtree.sync(htmlPath);
      var screenshots = [];
      var urls = runtimeInfo.urls;
      filenames.forEach(function(name) {
        var url = "/games/" + hftInfo.gameId + "/" + name;
        if (screenshotRE.test(name)) {
          screenshots.push(name);
        }
        if (iconRE.test(name)) {
          urls.icon = url;
        }
        if (faviconRE.test(name)) {
          urls.favicon = url;
        }
      });
      urls.icon = urls.icon || "/hft/assets/default-icon.png";
      urls.favicon = urls.favicon || urls.icon || "/hft-icon.png";
      screenshots.sort(screenshotSort);
      runtimeInfo.screenshots = screenshots;
      runtimeInfo.screenshotUrl = screenshots[0];
    }

// REMOVE THIS!!
    // Fix some urls.
    ['gameUrl', 'screenshotUrl'].forEach(function(name) {
      if (runtimeInfo[name]) {
        runtimeInfo[name] = "/games/" + hftInfo.gameId + "/" + runtimeInfo[name];
      }
    });

    if (!runtimeInfo["screenshotUrl"]) {
      runtimeInfo["screenshotUrl"] = "/hft/assets/default-screenshot.png";
    }

    var createTag = function(tagName, attribs, content) {
      content = content || "";
      return "<" + tagName + Object.keys(attribs).map(function(attrib) {
        var value = attribs[attrib];
        return value === undefined ? "" : (" " + attrib + '="' + attribs[attrib] + '"');
      }).join("") + ">" + content + "</" + tagName + ">";
    };

    var createScriptTag = function(attribs, content) {
      return createTag("script", attribs, content);
    };

    runtimeInfo.rootPath = rootPath;
    runtimeInfo.htmlPath = htmlPath;
    runtimeInfo.packagePath = packagePath;

    // add script tags to feature scripts
    // if needed for a specific feature
    var game  = {
      beforeScripts: [],
      afterScripts: [],
    };
    var controller = {
      beforeScripts: [],
      afterScripts: [],
    };
    var other = {
      beforeScripts: [],
      afterScripts: [],
    };
    var features = { };

    if (semver.gte(hftInfo.apiVersion, "1.2.0")) {
      features.es6 = true;
      var script = createScriptTag({src: "runtime-scripts/traceur-runtime.js"});
      game.beforeScripts.push(script);
      controller.beforeScripts.push(script);
      other.beforeScripts.push(script);
    }

    if (semver.gte(hftInfo.apiVersion, "1.4.0")) {
      features.allowMultipleGames = true;
    }

    if (semver.gte(hftInfo.apiVersion, "1.11.0")) {
      features.filesFromGame = true;
    }

    var appScript = createScriptTag({src: "/hft/0.x.x/extra/apphelper.js"});
    controller.beforeScripts.push(appScript);

    if (hftInfo.useScriptTag) {
      if (semver.gte(hftInfo.apiVersion, "1.3.0")) {
        features.useScriptTag = true;
        var hftScript = createScriptTag({src: "runtime-scripts/hft-min.js"});
        game.beforeScripts.push(hftScript);
        controller.beforeScripts.push(hftScript);
        other.beforeScripts.push(hftScript);
      } else {
        console.error("api version must be 1.3.0 or greater for 'useScriptTag'");
        return;
      }
    }

    var jsType = "hft-late";
    if (features.useScriptTag) {
      game.afterScripts.push(createScriptTag({src: "scripts/%(filename)s.js"}));
      controller.afterScripts.push(createScriptTag({src: "scripts/%(filename)s.js", type: jsType}));
    } else {
      game.afterScripts.push(createScriptTag({src: "/3rdparty/require.js", "data-main": "scripts/%(filename)s.js"}));
      game.afterScripts.push(createScriptTag({}, [
        "requirejs.config({",
        "  paths: {",
        "    hft: '../../../../hft/0.x.x/scripts',",
        "  },",
        "  shim: {",
        "  },",
        "});",
      ].join("\n")));
      controller.afterScripts.push(createScriptTag({src: "/3rdparty/require.js", "data-main": "scripts/%(filename)s.js", type: jsType}));
      controller.afterScripts.push(createScriptTag({type: jsType}, [
        "requirejs.config({",
        "  paths: {",
        "    hft: '../../../../hft/0.x.x/scripts',",
        "  },",
        "  shim: {",
        "        '3rdparty/pep.min': {",
        "            //These script dependencies should be loaded before loading",
        "            //pep.js",
        "            deps: [],",
        "            //Once loaded, use the global 'PEPNOREALLY' as the",
        "            //module value.",
        "            exports: 'PEPNOTREALLY',",
        "        },",
        "    },",
        "});",
      ].join("\n")));
      other.afterScripts.push(createScriptTag({}, [
        "requirejs.config({",
        "  paths: {",
        "    hft: '../../../../hft/0.x.x/scripts',",
        "  },",
        "  shim: {",
        "        '3rdparty/pep.min': {",
        "            //These script dependencies should be loaded before loading",
        "            //hand.js",
        "            deps: [],",
        "            //Once loaded, use the global 'PEPNOTREALL' as the",
        "            //module value.",
        "            exports: 'PEPNOTREALLY',",
        "        },",
        "    },",
        "});",
      ].join("\n")));
    }

    game.beforeScripts       = game.beforeScripts.join("\n");
    game.afterScripts        = game.afterScripts.join("\n");
    controller.beforeScripts = controller.beforeScripts.join("\n");
    controller.afterScripts  = controller.afterScripts.join("\n");
    other.beforeScripts      = other.beforeScripts.join("\n");
    other.afterScripts       = other.afterScripts.join("\n");

    runtimeInfo.features = features;
    runtimeInfo.pages = {
      game: game,
      controller: controller,
      other: other,
    };

    runtimeInfo.templateUrls = {};
    (hftInfo.templateUrls || []).forEach(function(url) {
      var fullUrl = "/games/" + hftInfo.gameId + "/" + url;
      runtimeInfo.templateUrls[fullUrl] = true;
    });

    runtimeInfo.templateFileOptions = {};
    if (hftInfo.templateFileOptions && !semver.gte(hftInfo.apiVersion, "1.15.0")) {
      console.error("error: package.json apiVersion must be 1.15.0 or greater to use templateFileOptions");
      return;
    }
    (hftInfo.templateFileOptions || []).forEach(function(options) {
      var info = {
        urlInfo: options,
      };
      runtimeInfo.templateFileOptions[options.filename] = info;
    });

  } catch (e) {
    console.error("ERROR: Parsing " + packagePath);
    throw e;
  }

  return runtimeInfo;  // eslint-disable-line
};

module.exports = new GameInfo();


