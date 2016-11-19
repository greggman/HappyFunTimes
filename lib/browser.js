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

var debug = require('debug')('happyfuntimes:browser');
var launch = require('launchpadlite');
var Promise = require('promise');

var g = {
  browser: undefined, // array of browser names
  launcher: undefined, // launcher object from launchpadlite
};

var init = function() {
  if (g.browsers === undefined) {
    var settingsPassedToChildProcessSpawn = {
      detached:true,
    };

    //var localP = Promise.nodeify(launch.local);
    var localP = function(options) {
      return new Promise(function(fulfill, reject) {
        launch.local(options, function(err, launcher) {
          if (err) {
            reject(err);
          } else {
            fulfill(launcher);
          }
        });
      });
    };

    return localP(settingsPassedToChildProcessSpawn).then(function(launcher) {
      g.launcher = launcher;

      return new Promise(function(fulfill, reject) {
        launcher.browsers(function(err, browsers) {
          if (err) {
            reject(err);
          } else {
            fulfill(browsers);
          }
        });
      });
    }).then(function(browserInfos) {
      g.browsers = browserInfos.map(function(browser) {
        return browser.name;
      });
    });
  } else {
    return Promise.resolve();
  }
};

/**
 * Launches a browser with the "url"
 *
 * @param {string} url Url to launch
 * @param {string?} opt_browserName name of browser you'd prefer
 *        it to use. Not it will use any browser it can find if
 *        this one is not available.
 * @return {Promise} generic promise.
 */
var launchBrowser = function(url, opt_browserName) {
  var browserName = opt_browserName || "default";

  var browsersToTry = ["chrome", "firefox", "safari", "ie", "default"];

  var index = browsersToTry.indexOf(browserName);
  if (index > 0) {
    browsersToTry.splice(index, 1);
    browsersToTry.unshift(browserName);
  }

  return init().then(function() {
    browsersToTry = browsersToTry.filter(function(browser) {
      return g.browsers.indexOf(browser) >= 0;
    });

    debug("try: " + browsersToTry);
    var success = false;

    var tries = browsersToTry.map(function(browser) {
      return function() {
        debug("trying: " + browser);
        return new Promise(function(fulfill, reject) {
          debug("launcher: " + browser + " -> " + url);
          g.launcher[browser](url, function(err/*, processInstance */) {
            if (err) {
              reject(err);
            } else {
              success = true;
              fulfill(browser);
            }
          });
        });
      };
    });

    var skip = function(cur) {
        return cur;
    };

    tries.push(function() {
      if (success) {
        return Promise.resolve();
      } else {
        return Promise.reject("could not launch browser. Tried: " + browsersToTry);
      }
    });

    return tries.reduce(function(cur, next) {
      return cur.then(skip, next);
    }, Promise.reject());
  });
};

/**
 * @callback {Browser~List}
 * @param {string[]} list of names available browsers. Pass one
 *      to launch if you want. empty list means none (can't
 *      imagine that happening)
 */

/**
 * @typedef {Promise} Browser~ListPromise
 * @fulfill {Browser~List} callback for list of browsers.
 */

/**
 * gets the available browsers.
 * @returns {Browser~ListPromise} a promise that provides the
 *        browser list.
 */
var getBrowsers = function() {
  return init().then(function() {
    return Promise.resolve(g.browsers);
  });
};

exports.launch = launchBrowser;
exports.getBrowsers = getBrowsers;


