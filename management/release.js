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

var asks        = require('asks');
var config      = require('../lib/config');
var debug       = require('debug')('release');
var events      = require('events');
var fs          = require('fs');
var gameDB      = require('../lib/gamedb');
var gameInfo    = require('../lib/gameinfo');
var games       = require('../management/games');
var GitHubApi   = require('github');
var http        = require('http');
var https       = require('https');
var io          = require('../lib/io');
var JSZip       = require('jszip');
var mkdirp      = require('mkdirp');
var path        = require('path');
var Promise     = require('promise');
var restUrl     = require('rest-url');
var readdirtree = require('../lib/readdirtree');
var semver      = require('semver');
var strings     = require('../lib/strings');
var url         = require('url');
var utils       = require('../lib/utils');
var ZipWriter   = require("moxie-zip").ZipWriter;

var safeishName = function(gameId) {
  return gameId.replace(/[^a-zA-Z0-9-_]/g, '_');
};

var asyncError = function(callback, err) {
  setTimeout(function() {
    callback(err);
  }, 0);
};

var logObject = function(label, obj) {
  if (obj) {
    console.log("---[ " + label + " ]---");
  } else {
    obj = label;
  }
  console.log(JSON.stringify(obj, undefined, "  "));
};

var askPrompt = function(questions) {
  return new Promise(function(fulfill, reject) {
    asks.prompt(questions, function(answers) {
      fulfill(answers);
    });
  });
};

var ReleaseManager = function() {

  var goodNameRE = /^[a-zA-Z0-9_ \.\\\/-]+$/;

  var makeZip = function(gameId, baseSrcPath, destPath, filter) {
    if (filter === undefined) {
      filter = function() { return true; }
    } else if (filter instanceof RegExp) {
      filter = function(filter) {
        return function(filename) {
          return filter.test(filename);
        }
      }(filter);
    }

    var fileNames = readdirtree.sync(baseSrcPath, {filter: /^(?!\.)/});
    fileNames = fileNames.filter(filter);

    // check there are no non-casesenative duplicates
    var lowerCaseFileNames = fileNames.map(function(f) { return f.toLowerCase(); }).sort();
    for (var ii = 0; ii < lowerCaseFileNames.length - 1; ++ii) {
      if (lowerCaseFileNames[ii] == lowerCaseFileNames[ii + 1]) {
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

  var makeHTML = function(runtimeInfo, gamePath, destFolder) {
    var hftInfo = runtimeInfo.info.happyFunTimes;
    var destPath = path.join(destFolder, safeishName(hftInfo.gameId) + "-html.zip");
    return makeZip(hftInfo.gameId, gamePath, destPath);
  };

  var makeUnity3d = function(runtimeInfo, gamePath, destFolder) {
    var hftInfo = runtimeInfo.info.happyFunTimes;
    var gameId = hftInfo.gameId;

    var platforms = [
      { platform: "Windows",
        zipSuffix: "-win.zip",
        binSuffix: "-win.exe",
        dirSuffix: "-win_Data",
        dateCheck: "-win.exe",
      },
      { platform: "Mac",
        zipSuffix: "-osx.zip",
        binSuffix: undefined,
        dirSuffix: "-osx.app",
        dateCheck: "-osx.app/Contents/MacOS/%(gameId)s-osx",
      },
      { platform: "Linux",
        zipSuffix: "-linux.zip",
        binSuffix: "-linux.x86",
        dirSuffix: "-linux_Data",
        dateCheck: "-linux.x86",
      },
    ];

    var platInfos = [];
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
        var datePath = path.join(gamePath, "bin", gameId + strings.replaceParams(platform.dateCheck, {gameId:gameId}));
        var stat = fs.statSync(datePath);
        platInfos.push({platform: platform, binPath: binPath, dirPath: dirPath, stat: stat});
      }
    });

    var tooOld = false;
    if (platInfos.length > 1) {
      platInfos.sort(function(a, b) {
        return a.stat.mtime == b.stat.mtime ? 0 : (a.stat.mtime < b.stat.mtime ? -1 : 1);
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
    if (!tooOld && platInfos.length == platforms.length) {
      promise = Promise.resolve({confirmation: 'y'});
    } else {
      promise = askPrompt([
        {
          name: 'confirmation',
          type: 'input',
          message: 'continue y/N?',
          default: 'n',
        }
      ]);
    }

    return promise.then(function(answers) {
      if (answers.confirmation.toLowerCase() != 'y') {
        return Promise.reject(new Error("aborted"));
      }

      var promises = [];
      platInfos.forEach(function(platInfo) {
        var destPath = path.join(destFolder, safeishName(gameId) + platInfo.platform.zipSuffix);
        var binStart = "bin/";
        var srcPath = "src/";
        var filter = function(filename) {
          filename = filename.replace(/\\/g, '/');
          if (strings.startsWith(filename, srcPath)) {
            return false;
          }
          if (strings.startsWith(filename, binStart)) {
            if (platInfo.binPath && filename == platInfo.binPath) {
              return true;
            }
            if (platInfo.dirPath && strings.startsWith(filename, platInfo.dirPath)) {
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
  };

  var makers = {
    html: makeHTML,
    unity3d: makeUnity3d,
  };

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
   * @returns {Make~Promise}
   */
  var make = function(gamePath, destFolder) {
    // Make sure it's a game!
    var runtimeInfo = gameInfo.readGameInfo(gamePath);
    if (!runtimeInfo) {
      return Promise.reject(Error("not a game: " + gamePath));
    }

    var hftInfo = runtimeInfo.info.happyFunTimes;
    var maker = makers[hftInfo.gameType.toLowerCase()];
    if (!maker) {
      return Promise.reject(new Error("unsupported game type:" + hftInfo.gameType));
    }

    try {
      gameInfo.checkRequiredFiles(runtimeInfo, gamePath);
    } catch (e) {
      return Promise.reject(new Error(e.toString()));
    }

    return maker(runtimeInfo, gamePath, destFolder);
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
    var runtimeInfo;
    var packageBasePath;

    try {
      // Find the packageInfo
      for (var ii = 0; ii < entries.length; ++ii) {
        var entry = entries[ii];
        var baseName = path.basename(entry.name);
        var dirName = path.dirname(entry.name);
        if (dirName.indexOf("/") < 0 && baseName == "package.json") {
          runtimeInfo = gameInfo.parseGameInfo(entry.asText(), path.join(releasePath, entry.name));
          packageBasePath = dirName;
          break;
        }
      }
    } catch (e) {
      console.error("could not parse package.json. Maybe this is not a HappyFunTimes game?");
      console.error(e);
      return false;
    }

    var info = runtimeInfo.info;
    var hftInfo = info.happyFunTimes;
    var gameId = hftInfo.gameId;
    var destBasePath;

    // is it already installed?
    var installedGame = gameDB.getGameById(gameId);
    if (installedGame) {
      if (!options.overwrite) {
        console.error("game " + gameId + " already installed at: " + installedGame.basePath);
        return false;
      }
      destBasePath = installedGame.basePath
    } else {
      // make the dir after we're sure we're ready to install
      destBasePath = path.join(config.getConfig().gamesDir, info.happyFunTimes.gameId);
    }

    destBasePath = opt_destPath ? opt_destPath : destBasePath;

    console.log("installing to: " + destBasePath);
    if (!options.dryRun) {
      mkdirp.sync(destBasePath);
    }

    var files = [];
    var bad = false;
    entries.forEach(function(entry) {
      if (bad) {
        return;
      }
      var filePath = entry.name.substring(packageBasePath.length + 1);
      files.push(filePath);
      var destPath = path.resolve(path.join(destBasePath, filePath));
      if (destPath.substring(0, destBasePath.length) != destBasePath) {
        console.error("ERROR: bad zip file. Path would write outside game folder");
        bad = true;
      } else {
        var isDir = entry.dir;
        if (destPath.substr(-1) == "/" || destPath.substr(-1) == "//") {
          destPath = destPath.substr(0, destPath.length - 1);
          isDir = true;
        }
        //??
        if (isDir) {
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
      }
    });

    if (bad) {
      // Should delete all work here?
      return false;
    }


    log("add: " + destBasePath);
    if (!options.dryRun) {
      games.add(destBasePath, files);
    }

    if (!options.dryRun) {
      console.log("installed:" + releasePath);
    }
  };

  /**
   * @typedef {Object} Uninstall~Options
   * @property {boolean?} verbose print extra info
   * @property {boolean?} dryRun true = don't write any files or
   *           make any folders.
   */

  /**
   * Unistalls a game.
   *
   * @param {string} gameIdOrPath path to game or id.
   * @param {Uninstall~Options?} opt_options
   */
  var uninstall = function(gameIdOrPath, opt_options) {
    var options = opt_options || {};
    var log = options.verbose ? console.log.bind(console) : function() {};

    var installedGame = gameDB.getGameById(gameIdOrPath);
    if (!installedGame) {
      // See if we can find it by path
      var gameList = gameDB.getGames();
      var gamePath = path.resolve(gameIdOrPath);
      for (var ii = 0; ii < gameList.length; ++ii) {
        var game = gameList[ii];
        if (game.basePath == gamePath) {
          installedGame = game;
          break;
        }
      }
    }

    if (!installedGame) {
      console.error("ERROR: " + gameIdOrPath + " does not reference an installed game by id or path");
      return false;
    }

    var hftInfo = installedGame.info.happyFunTimes;
    var gameId = hftInfo.gameId;
    var gamePath = installedGame.basePath;
    var files = installedGame.files || [];

    var failCount = 0;
    var folders = [gamePath];
    files.forEach(function(file) {
      var fullPath = path.join(gamePath, file);
      try {
        var stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          folders.push(fullPath);
        } else {
          log("delete: " + fullPath)
          if (!options.dryRun) {
            fs.unlinkSync(fullPath)
          }
        }
      } catch (e) {
        ++failCount;
        console.error("Couldn't delete: " + fullPath)
      }
    });

    var deleteNoFail = function(file) {
      try {
        if (fs.existsSync(file)) {
          log("delete: " + file);
          fs.unlinkSync(file);
        }
      } catch (e) {
        // Don't care!
      }
    };

    folders.sort();
    folders.reverse();
    folders.forEach(function(folder) {
      try {
        // Should I try to delete system files? I think so
        deleteNoFail(path.join(folder, ".DS_store"));
        deleteNoFail(path.join(folder, "Thumbs.db"));
        log("rmdir: " + folder);
        if (!options.dryRun) {
          fs.rmdirSync(folder);
        }
      } catch (e) {
        ++failCount;
        console.error("Couldn't delete: " + folder);
        console.error(e);
      }
    });

    log("remove: " + gamePath);
    if (!options.dryRun) {
      games.remove(gamePath);
    }

    if (!options.dryRun) {
      console.log("uninstalled:" + gameIdOrPath);
    }

    return true;
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
   * @returns {EventEmitter}
   */
  var download = function(gameId, opt_destPath, options) {
    options = options || {};
    var log = options.verbose ? console.log.bind(console) : function() {};
    var eventEmitter = new events.EventEmitter();
    var sendJSON = Promise.denodeify(io.sendJSON);
    var apiurl = options.gamesUrl || config.getSettings().gamesUrl;
    var url = apiurl + "/" + gameId;
    var releaseUrl;
    setTimeout(function() {
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
          default:
            return Promise.reject("Unsupported gameType: " + info.gameType);
        }

        // Yea, I know I probably shouldn't rely on the extension.
        return utils.getTempFilename({postfix: path.extname(releaseUrl)});
      }).then(function(destName) {
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
        eventEmitter.emit('status', {status: "Finished"});
        eventEmitter.emit('end', {status: "Done"});
      }, function(err) {
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
          asyncError(eventEmitter.emit.bind(emit), 'error', "unhandled protocol: " + parsedUrl.protocol);
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


  /**
   * @typedef {Object} Publish~Options
   * @property {boolean?} verbose print extra info
   * @property {boolean?} dryRun true = don't write any files or
   *           make any folders.
   * @property {string?} repo github repo
   * @property {string?} username github username
   * @property {string?} password github password
   */

  /**
   * Publish a game.
   *
   * Packages up a game, uploads the packages to github, informs
   * the store of the new version.
   *
   * Steps:
   * 1.  Verify it's a game
   * 2.  Check the version. See if the tags match.
   * 3.  Make pacakges. (if it's native there will be more than
   *     one. for example OSX, Windows, etc..
   * 3.  Upload packages
   * 4.  If required notify store.
   *
   * @param {string} gamePath path to game
   * @param {Publish~Options?} options options.
   * @return {Promise}
   */
  var publish = function(gamePath, options) {
    return new Promise(function(fulfill, reject) {
      options = options || {};
      var log = options.verbose ? console.log.bind(console) : function() {};

      // Make sure it's a game!
      var runtimeInfo = gameInfo.readGameInfo(gamePath);
      if (!runtimeInfo) {
        reject(new Error(gamePath + " doesn't appear to be a game"));
        return;
      }

      var info = runtimeInfo;
      var github = new GitHubApi({
          // required
          version: "3.0.0",
          // optional
          debug: options.verbose || false,
      });

      var auth = function() {
          if (options.password) {
            github.authenticate({
              type: "basic",
              username: options.username,
              password: options.password,
            });
          }
      };

      auth();
      var listReleases   = Promise.denodeify(github.releases.listReleases);
      var createRelease  = Promise.denodeify(github.releases.createRelease);
      var uploadAsset    = Promise.denodeify(github.releases.uploadAsset);
      var highestVersion = '0.0.0';
      var version = options.version || '0.0.0';
      var filesToUpload;

      // Check existing releases. There should be no release with this version
      // AND, all releases should be less than this one
      listReleases({
        owner: options.username,
        repo: options.repo,
      }).then(function(res) {
        for (var ii = 0; ii < res.length; ++ii) {
          var release = res[ii];
          if (semver.valid(release.name)) {
            console.log("found existing release: " + release.name);
            if (semver.gt(release.name, highestVersion)) {
              highestVersion = release.name;
            }
          }
        }
        if (options.version) {
          if (semver.lte(version, highestVersion)) {
            return Promise.reject(new Error("version '" + version + "' is less than highest version: " + highestVersion));
          }
        } else {
          version = semver.inc(highestVersion, options.bump);
          if (!version) {
            return Promise.reject(new Error("bad bump type: '" + options.bump + "'"));
          }
        }

        if (version.charAt(0) != 'v') {
          version = "v" + version;
        }

        return utils.getTempFolder({unsafeCleanup: true});  // deletes the folder on exit.
      }).then(function(filePath) {
        return make(gamePath, filePath);
      }).then(function(files) {
        filesToUpload = files;
        console.log("Upload:\n" + files.map(function(file) {
          return "    " + file.filename;
        }).join("\n"));
        console.log("as version: " + version);
        return options.force ? Promise.resolve({confirmation: 'y'}) : askPrompt([
          {
             name: 'confirmation',
             type: 'input',
             message: 'release y/N?',
             default: 'n',
          }
        ]);
      }).then(function(answers) {
        if (answers.confirmation.toLowerCase() != 'y') {
          return Promise.reject(new Error("aborted"));
        }
        console.log("creating release...");
        auth();
        return createRelease({
          owner: options.username,
          repo: options.repo,
          tag_name: version,
          target_commitish: "master",
          name: version,
        });
      }).then(function(releaseInfo) {
        log("releaseInfo", releaseInfo);
        var promises = [];
        filesToUpload.forEach(function(file) {
          auth();
          promises.push(uploadAsset({
            owner: options.username,
            repo: options.repo,
            id: releaseInfo.id,
            name: path.basename(file.filename),
            filePath: file.filename,
          }));
        });
        return Promise.all(promises);
      }).then(function(uploadResults) {
        for (var ii = 0; ii < uploadResults; ++ii) {
          var uploadResult = uploadResults[ii];
          if (uploadResult.state != 'uploaded') {
            return Promise.reject(new Error("upload state for '" + uploadResult.name + "' is '" + uploadResult.state + "'"));
          }
          var localSize = fs.statSync(filesToUpload[ii].filename).size;
          if (uploadResult.size != localSize) {
            return Promise.reject(new Error("upload size for '" + uploadResult.name + "' is " + uploadResult.size + " but should be " + localSize));
          }
        }
        console.log("release uploaded");
        fulfill();
      },function(err) {
        reject(err)
      });
    });
  };

  /**
   * @typedef {Object} Register~Options
   * @property {string} repoUrl url of repo of game to register
   * @property {string?} endpoint url of server to contact
   */

  /**
   * Registers the url of the repo of a game with
   * superhappyfuntimes.net
   *
   * @param {Register~Options} options
   */
  var register = function(options) {
    var log = options.verbose ? console.log.bind(console) : function() {};
    var sendJSON = Promise.denodeify(io.sendJSON);
    var endpoint = config.getSettings().manageEndpoint;
    if (options.endpoint) {
      endpoint = options.endpoint + url.parse(endpoint).path;
    }

    // this will be checked on the server but check it here in order
    // tell the dev quickly.

    var validRepoURL = (function() {
      // We only support github at the moment.
      var prefixes = [
        "git://github.com/",
        "https://github.com/",
      ];
      return function(v) {
        for (var ii = 0; ii < prefixes.length; ++ii) {
          var prefix = prefixes[ii];
          if (v.substring(0, prefix.length) == prefix) {
            return true;
          }
        }
        return false;
      };
    }());

    if (!validRepoURL(options.repoUrl)) {
      return Promise.reject(new Error("not a supported url: " + options.repoUrl));
    }

    var registerUrl = restUrl.make(endpoint, { url: options.repoUrl });
    log("using: " + registerUrl);
    return sendJSON(registerUrl, {}, {});
  };

  this.download = download.bind(this);
  this.downloadFile = downloadFile.bind(this);
  this.install = install.bind(this);
  this.uninstall = uninstall.bind(this);
  this.make = make.bind(this);
  this.publish = publish.bind(this);
  this.register = register.bind(this);
};



module.exports = new ReleaseManager();

