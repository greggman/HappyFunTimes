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
var debug        = require('debug')('download');
var events       = require('events');
var fs           = require('fs');
var http         = require('http');
var https        = require('https');
var io           = require('../lib/io');
var install      = require('./install').install;
var path         = require('path');
var platformInfo = require('../lib/platform-info');
var Promise      = require('promise');
var releaseUtils = require('./release-utils');
var semver       = require('semver');
var url          = require('url');
var utils        = require('../lib/utils');

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
 * @returns {EventEmitter}
 */
var download = function(gameId, opt_destPath, options) {
  options = options || {};
  var log = options.verbose ? console.log.bind(console) : function() {};
  var eventEmitter = new events.EventEmitter();
  var sendJSON = Promise.denodeify(io.sendJSON);
  var apiurl = options.gamesUrl || config.getSettings().settings.gamesUrl;
  var url = apiurl + "/" + gameId;
  var releaseUrl;
  var zipFilePath;

  var cleanup = function() {
    if (zipFilePath) {
      utils.deleteNoFail(zipFilePath);
    }
  };

  setTimeout(function() {
    log("getting url:" + url);
    eventEmitter.emit('status', {status: "Getting Game Info"});
    sendJSON(url, {}, {method:"GET"}).then(function(info) {
      log("gameInfo response:\n" + JSON.stringify(info, undefined, "  "));
      info = info[0];
      // based on the gameType and current platform download the correct file
      info.versions.sort(function(a, b) {
        if (semver.eq(a.version, b.version)) {
          return 0;
        }
        return semver.gt(a.version, b.version) ? 1 : -1;
      });
      var version = info.versions[info.versions.length - 1];
      switch (info.gameType.toLowerCase()) {
        case "html":
          releaseUrl = version.releaseUrl;
          break;
        case "unity3d":
          releaseUrl = version.releaseUrls[platformInfo.id];
          break;
        default:
          return Promise.reject("Unsupported gameType: " + info.gameType);
      }

      // Yea, I know I probably shouldn't rely on the extension.
      return utils.getTempFilename({postfix: path.extname(releaseUrl)});
    }).then(function(destName) {
      zipFilePath = destName;
      return new Promise(function(fulfill, reject) {
        eventEmitter.emit('status', {status: "Downloading Game..."});
        var downloadEmitter = downloadFile(releaseUrl, destName);

        downloadEmitter.on('start', function(e) {
          eventEmitter.emit('progress', e);
        });

        downloadEmitter.on('progress', function(e) {
          eventEmitter.emit('progress', e);
        });

        downloadEmitter.on('error', function(e) {
          reject(e);
        });

        downloadEmitter.on('end', function(e) {
          eventEmitter.emit('progress', e);
          fulfill(destName);
        });
      });
    }).then(function(srcPath) {
      eventEmitter.emit('status', {status: "Installing..."});
      if (install(srcPath, opt_destPath, options) == false) {
        return Promise.reject("Trouble installing " + gameId);
      }
      return Promise.resolve();
    }).then(function() {
      cleanup();
      eventEmitter.emit('status', {status: "Finished"});
      eventEmitter.emit('end', {status: "Done"});
    }).catch(function(err) {
      console.error(err);
      cleanup();
      eventEmitter.emit('error', err);
    });
  }, 0);
  return eventEmitter;
};

/**
 * Downloads a url to the specified path
 * @param {string} srcUrl url to download
 * @param {string} destPath path to store file
 * @returns {EventEmitter} emitter for events.
 *
 * Events are:
 *   'start': {size: number, bytesDownloaded: number},
 *   'progress': {size: number, bytesDownloaded: number},
 *   'end': {size: number, bytesDownloaded: number},
 *   'error': ??,
 */
var downloadFile = function(srcUrl, destPath) {
  var depth = 0;

  var depthDebug = function(msg) {
    debug("" + depth + ": " + msg);
  };

  var eventEmitter = new events.EventEmitter();
  eventEmitter.emit = (function(oldFn) {
    return function() {
      depthDebug("emit: " + arguments[0] + arguments[1].toString());
      oldFn.apply(eventEmitter, arguments);
    };
  }(eventEmitter.emit));

  var doDownload = function(srcUrl, destPath) {
    ++depth;

    depthDebug("DL: " + srcUrl);

    if (depth > 5) {
      eventEmitter.emit('error', "too many redirects");
      return;
    }

    var parsedUrl = url.parse(srcUrl);

    var requestType;
    switch (parsedUrl.protocol) {
      case 'http:':
        requestType = http.request.bind(http);
        break;
      case 'https:':
        requestType = https.request.bind(https);
        break;
      default:
        releaseUtils.asyncError(eventEmitter.emit.bind(emit), 'error', "unhandled protocol: " + parsedUrl.protocol);
        return;
    }

    var request = requestType({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
    });

    var stream;

    request.on('response', function (response) {
      depthDebug("response.statusCode: " + response.statusCode);
      switch (response.statusCode) {
        case 200:
          break;
        case 301:
        case 302:
        case 307:
        case 308:
          depthDebug("redirect: " + response.headers["location"].toString());
          doDownload(response.headers["location"].toString(), destPath, eventEmitter);
          return;
        case 404:
          var msg = "url not found:" + srcUrl;
          depthDebug(msg)
          eventEmitter.emit('error', msg);
          return;
        default:
          eventEmitter.emit('error', "unhandled status code:" + response.statusCode);
          debug(JSON.stringify(response.headers, undefined, "  "));
          return;
      }
      var bytesDownloaded = 0;
      var totalBytes = response.headers['content-length'];
      stream = fs.createWriteStream(destPath);
      stream.on('error', function(e) {
        eventEmitter.emit('error', "error writing to file: " + destPath + "\n" + e);
        request.abort();
      });

      eventEmitter.emit('start', {size: totalBytes, bytesDownloaded: bytesDownloaded});
      response.on('data', function (chunk) {
        bytesDownloaded += chunk.length;
        eventEmitter.emit('progress', {size: totalBytes, bytesDownloaded: bytesDownloaded});
        stream.write(chunk);
      });

      response.on('end', function() {
        eventEmitter.emit('progress', {size: totalBytes, bytesDownloaded: bytesDownloaded});
        stream.end(undefined, undefined, function() {
          eventEmitter.emit('end', {size: totalBytes, bytesDownloaded: bytesDownloaded});
        });
      });

    });

    request.on('error', function(err) {
      if (stream) {
        stream.end();
        fs.unlinkSync(destPath);
      }
      eventEmitter.emit('error', err);
    });

    request.end();
    return;
  }

  doDownload.apply(this, arguments);
  return eventEmitter;
};


exports.download = download;
exports.downloadFile = downloadFile;


