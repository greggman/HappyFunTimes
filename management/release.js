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

var debug = require('debug')('release');
var Promise = require('promise');
var ZipWriter = require("moxie-zip").ZipWriter;
var JSZip = require('jszip');
var events = require('events');
var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var url = require('url');
var mkdirp = require('mkdirp');
var gameInfo = require('../server/gameinfo');
var gameDB = require('../server/gamedb');
var games = require('../management/games');
var config = require('../server/config');
var strings = require('../server/strings');
var utils = require('./utils');
var GitHubApi = require('github');
var semver = require('semver');
var asks = require('asks');

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

  var readDirTreeSync = function(filePath, options) {
    options = options || {};

    var filter = options.filter;
    if (filter === undefined) {
      filter = function() { return true; };
    } else if (filter instanceof RegExp) {
      filter = function(filter) {
        return function(filename) {
          return filter.test(filename);
        }
      }(filter);
    }

    var fileNames = fs.readdirSync(filePath).filter(filter).map(function(fileName) {
      return path.join(filePath, fileName);
    });

    var subdirFilenames = [];
    fileNames.forEach(function(fileName) {
      var stat = fs.statSync(fileName);
      if (stat.isDirectory()) {
        subdirFilenames.push(readDirTreeSync(fileName));
      }
    });

    subdirFilenames.forEach(function(subNames) {
      fileNames = fileNames.concat(subNames);
    });

    return fileNames;
  };




  // Remove this if Zip adds the filter.
//  var addLocalFolder = (function() {
//    var Utils = require('../node_modules/adm-zip/util/utils.js');
//    return function(zip, /*String*/localPath, /*String*/zipPath, /*RegExp|Function*/filter) {
//      if (filter === undefined) {
//        filter = function() { return true; };
//      } else if (filter instanceof RegExp) {
//        filter = function(filter) {
//          return function(filename) {
//            return filter.test(filename);
//          }
//        }(filter);
//      }
//
//      if(zipPath){
//          zipPath=zipPath.split("\\").join("/");
//          if(zipPath.charAt(zipPath.length - 1) != "/"){
//              zipPath += "/";
//          }
//      }else{
//          zipPath="";
//      }
//      localPath = localPath.split("\\").join("/"); //windows fix
//      if (localPath.charAt(localPath.length - 1) != "/")
//          localPath += "/";
//
//      if (fs.existsSync(localPath)) {
//
//          var items = Utils.findFiles(localPath);
//          if (items.length) {
//              items.forEach(function(path) {
//                  var p = path.split("\\").join("/").replace(localPath, ""); //windows fix
//                  if (filter(p)) {
//                      if (p.charAt(p.length - 1) !== "/") {
//                          zip.addFile(zipPath+p, fs.readFileSync(path), "", 0)
//                      } else {
//                          zip.addFile(zipPath+p, new Buffer(0), "", 0)
//                      }
//                  }
//              });
//          }
//      } else {
//          throw Utils.Errors.FILE_NOT_FOUND.replace("%s", localPath);
//      }
//    };
//  }());

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
    return new Promise(function(fulfill, reject) {
      // Make sure it's a game!
      var info = gameInfo.readGameInfo(gamePath);
      if (!info) {
        reject(Error("not a game: " + gamePath));
        return;
      }

      var hftInfo = info.happyFunTimes;
      switch (hftInfo.gameType) {
        case 'html':
          break;
        default:
          reject(new Error("unsupported game type:" + hftInfo.gameType));
          return;
      }

      var fileNames = readDirTreeSync(gamePath, {filter: /^(?!\.)/});
      var zip = new ZipWriter();
      fileNames.forEach(function(fileName) {
        var zipName = path.join(hftInfo.gameId, fileName.substring(gamePath.length)).replace(/\\/g, '/');
        var stat = fs.statSync(fileName);
        if (stat.isDirectory()) {
          zip.addDir(zipName);
        } else {
          var buffer = fs.readFileSync(fileName);
          zip.addData(zipName, buffer);
        }
      });
      var destPath = path.join(destFolder, safeishName(hftInfo.gameId) + "-html.zip");
      zip.saveAs(destPath, function(err) {
        if (err) {
          reject(err);
        } else {
          fulfill([{filename:destPath}]);
        }
      });
    });
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
    var info;
    var packageBasePath;

    try {
      // Find the packageInfo
      for (var ii = 0; ii < entries.length; ++ii) {
        var entry = entries[ii];
        var baseName = path.basename(entry.name);
        var dirName = path.dirname(entry.name);
        if (dirName.indexOf("/") < 0 && baseName == "package.json") {
          info = gameInfo.parseGameInfo(entry.asText(), path.join(releasePath, entry.name));
          packageBasePath = dirName;
          break;
        }
      }
    } catch (e) {
      console.error("error " + e + ": could not parse package.json. Maybe this is not a HappyFunTimes game?");
      return false;
    }

    var hftInfo = info.happyFunTimes;
    var gameId = hftInfo.gameId;
    var destBasePath;

    // is it already installed?
    var installedGame = gameDB.getGameById(gameId);
    if (installedGame) {
      if (!options.overwrite) {
        console.error("game " + gameId + " already installed at: " + installedGame.happyFunTimes.basePath);
        return false;
      }
      destBasePath = installedGame.happyFunTimes.basePath
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
        if (game.happyFunTimes.basePath == gamePath) {
          installedGame = game;
          break;
        }
      }
    }

    if (!installedGame) {
      console.error("ERROR: " + gameIdOrPath + " does not reference an installed game by id or path");
      return false;
    }

    var hftInfo = installedGame.happyFunTimes;
    var gameId = hftInfo.gameId;
    var gamePath = hftInfo.basePath;
    var files = hftInfo.files;

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
   * @returns {Promise}
   */
  var download = function(gameId, opt_destPath, options) {
    return new Promise(function(fulfill, reject) {
      // get game
      var url = options.gamesUrl || config.getSettings().gamesUrl;
    });
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

    var doDownload = function(srcUrl, destPath, eventEmitter) {
      debug("DL: " + srcUrl);
      eventEmitter = eventEmitter || new events.EventEmitter();

      ++depth;
      if (depth > 5) {
        eventEmitter.emit('error', "too many redirects");
        return eventEmitter;
      }

      var parsedUrl = url.parse(srcUrl);

      var requestType;
      switch (parsedUrl.protocol) {
        case 'http:':
          requestType = http.request.bind(http);
          break;
        case 'https:':
          requestType = https.request.bind(http);
          break;
        default:
          asyncError(eventEmitter.emit.bind(emit), 'error', "unhandled protocol: " + parsedUrl.protocol);
          return eventEmitter;
      }

      var request = requestType({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
      });

      var stream;

      request.on('response', function (response) {
        switch (response.statusCode) {
          case 200:
            break;
          case 301:
          case 302:
          case 307:
          case 308:
            doDownload(response.headers["location"].toString(), destPath, eventEmitter);
            return;
          case 404:
            eventEmitter.emit('error', "url not found:" + srcUrl);
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
      return eventEmitter;
    }

    return doDownload.apply(this, arguments);
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
      var info = gameInfo.readGameInfo(gamePath);
      if (!info) {
        reject(new Error(gamePath + " doesn't appear to be a game"));
        return;
      }

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
      var listReleases = Promise.denodeify(github.releases.listReleases);
      var createRelease = Promise.denodeify(github.releases.createRelease);
      var uploadAsset = Promise.denodeify(github.releases.uploadAsset);
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
        return askPrompt([
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

  this.download = download.bind(this);
  this.downloadFile = downloadFile.bind(this);
  this.install = install.bind(this);
  this.uninstall = uninstall.bind(this);
  this.make = make.bind(this);
  this.publish = publish.bind(this);
};



module.exports = new ReleaseManager();

