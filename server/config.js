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

var g_configPath = path.join(process.env.HOME || process.env.APPDATA, ".happyfuntimes", "config.json");
var g_configRead = false;
var g_settingsPath = path.join(__dirname, "..", "hft.hanson");
var g_settingsRead = false;

var setup = function(options) {
  if (g_configRead || g_settingsRead) {
    throw "calling setup has no meaning after configuration has been read";
  }
  if (options.configPath) {
    g_configPath = path.resolve(options.configPath);
  }
  if (options.settingsPath) {
    g_settingsPath = path.resolve(options.settingsPath);
  }
};

var init = function() {
  if (!fs.existsSync(g_configPath)) {
    var configDir = path.dirname(g_configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }
    fs.writeFileSync(g_configPath, JSON.stringify({
      installDir: path.resolve(path.normalize(path.join(__dirname, ".."))),
      gamesDir: path.resolve(path.normalize(path.join(__dirname, "..", "public", "games"))),
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
    if (!settings) {
      /** @type {GameInfo~Settings} */
      settings = hanson.parse(fs.readFileSync(g_settingsPath, {encoding: "utf-8"}));
      g_settingsRead = true;
    }
    return settings;
  };
}());

/**
 * Get the happyFunTimes directory
 */
var getConfig = (function() {
  var config;

  return function() {
    if (!config) {
      try {
        var content = fs.readFileSync(g_configPath, {encoding: "utf-8"});
        g_configRead = true;
      } catch (e) {
        return;
      }

      try {
        config = JSON.parse(content);
      } catch (e) {
        console.error("nunable to read config: " + configPath);
        console.error(e);
        throw e;
      }

      Object.keys(config).forEach(function(key) {
        // Make keys that end in "Dir" relative to config path.
        if (key.substr(-3) == "Dir") {
          config[key] = path.resolve(path.dirname(g_configPath), config[key]);
        }
      });

      config.configDir = path.dirname(g_configPath);
      config.installedGamesListPath = path.join(config.configDir, "installed-games.json");
    }
    return config;
  };
}());


exports.getConfig = getConfig;
exports.getSettings = getSettings;
exports.setup = setup;
exports.init = init;
