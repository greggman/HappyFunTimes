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

var fs = require('fs');
var path = require('path');
var hanson = require('hanson');
var home = require('./home');
var misc = require('./misc');

var baseName = "HappyFunTimes";
if (process.platform.substring(0, 3).toLowerCase() === "win") {
  /*eslint no-empty:0*/
} else if (process.platform.toLowerCase() === "darwin") {
  /*eslint no-empty:0*/
} else {
  baseName = ".happyfuntimes";
}

// This sucks. I used to put things in appDataDir not knowing that
// defaults to Roaming on Windows.. So, check if that exists. If
// it does use it. If not use the new path.
var getConfigPath = function() {
  var p = path.join(home.appDataDir, baseName, "config.json");
  if (fs.existsSync(p)) {
    return p;
  }
  return path.join(home.localAppDataDir, baseName, "config.json");
};

var g = {
  configPath: getConfigPath(),
  configRead: false,
  settingsPath: path.join(__dirname, "..", "hft.hanson"),
  settingsRead: false,
  packageInfoRead: false,
};

var setup = function(options) {
  if (g.configRead || g.settingsRead) {
    throw "calling setup has no meaning after configuration has been read";
  }
  if (options.configPath) {
    g.configPath = path.resolve(options.configPath);
  }
  if (options.settingsPath) {
    g.settingsPath = path.resolve(options.settingsPath);
  }
};

/**
 * Used for testing.
 */
var reset = function() {
  g.configRead = false;
  g.settingsRead = false;
  g.packageInfoRead = false;
};

var init = function() {
  if (!fs.existsSync(g.configPath)) {
    var configDir = path.dirname(g.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }
    fs.writeFileSync(g.configPath, JSON.stringify({
      installDir: path.resolve(path.normalize(path.join(__dirname, ".."))),
      gamesDir: path.resolve(path.normalize(path.join(configDir, "games"))),
      options: [
        { name: "dns",          value: false, },
        { name: "private",      value: false, },
        { name: "phonecontrol", value: true,  },
      ],
    }, undefined, "  "));
    console.log("Wrote config");
  }
};

/**
 * Get the happyFunTimes directory
 */
var getSettings = (function() {
  var settings;

  return function() {
    if (!g.settingsRead) {
      /** @type {GameInfo~Settings} */
      settings = hanson.parse(fs.readFileSync(g.settingsPath, {encoding: "utf-8"}));
      g.settingsRead = true;
      var overrides = process.env.HFT_SETTINGS;
      if (overrides) {
        misc.copyProperties(hanson.parse(overrides), settings);
      }
    }
    return settings;
  };
}());

/**
 * Get the happyFunTimes directory
 */
var getConfig = (function() {
  /*eslint consistent-return:0*/
  var config;

  return function() {
    if (!g.configRead) {
      try {
        var content = fs.readFileSync(g.configPath, {encoding: "utf-8"});
        g.configRead = true;
      } catch (e) {
        return;
      }

      try {
        config = JSON.parse(content);
      } catch (e) {
        console.error("unable to read config: " + configPath);
        console.error(e);
        throw e;
      }

      Object.keys(config).forEach(function(key) {
        // Make keys that end in "Dir" relative to config path.
        if (key.substr(-3) === "Dir") {
          config[key] = path.resolve(path.dirname(g.configPath), config[key]);
        }
      });

      config.configDir = path.dirname(g.configPath);
      config.installedGamesListPath = path.join(config.configDir, "installed-games.json");
    }
    return config;
  };
}());

/**
 * Get the Package.json for happyfuntimes
 */
var getPackageInfo = (function() {
  var packageInfo;

  return function() {
    if (!g.packageInfoRead) {
      packageInfo = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), {encoding: "utf-8"}));
      g.packageInfoRead = true;
    }
    return packageInfo;
  };
}());

exports.getConfig = getConfig;
exports.getSettings = getSettings;
exports.getPackageInfo = getPackageInfo;
exports.setup = setup;
exports.init = init;
exports.reset = reset;

