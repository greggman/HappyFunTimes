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

var fs           = require('fs');
var gameInfo     = require('../lib/gameinfo');
var GitHubApi    = require('github');
var make         = require('./make');
var path         = require('path');
var Promise      = require('promise');
var register     = require('./register');
var releaseUtils = require('./release-utils');
var semver       = require('semver');
var strings      = require('../lib/strings');
var utils        = require('../lib/utils');

/**
 * @typedef {Object} Publish~Options
 * @property {boolean?} verbose print extra info
 * @property {boolean?} dryRun true = don't write any files or
 *           make any folders.
 * @property {string?} username github username
 * @property {string?} password github password
 * @property {string?} bump how to bump version. See semver.inc
 * @property {boolean?} force set to true to skip all
 *           confirmations
 * @property {string?} version set to a specific version
 * @property {string} repoUrl url of repo of game to register
 * @property {string?} endpoint base url to register game. eg
 *           http://foo.com
 * @property {string?} email email address to send notification.
 *           If none given newest email in commits is used
 * @property {boolean?} sendEmail email notification
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
      return reject(new Error(gamePath + " doesn't appear to be a game. Couldn't read or parse package.json"));
    }

    var gameId = runtimeInfo.originalGameId;

    if (!releaseUtils.validRepoURL(options.repoUrl)) {
      return Promise.reject(new Error("not a supported url: " + options.repoUrl));
    }

    var repoName = path.basename(options.repoUrl);
    if (strings.endsWith(repoName, ".git")) {
      repoName = repoName.substring(0, repoName.length - 4);
    }

    var stuffToDelete = [];
    var cleanup = function() {
      stuffToDelete.forEach(function(filePath) {
        utils.deleteNoFail(filePath);
      });
    };

    var info = runtimeInfo.info;
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

    var listReleases   = Promise.denodeify(github.releases.listReleases);
    var createRelease  = Promise.denodeify(github.releases.createRelease);
    var uploadAsset    = Promise.denodeify(github.releases.uploadAsset);

    var askOrForce = function(question) {
      return options.force ? Promise.resolve() : releaseUtils.askPrompt([
        {
           name: 'confirmation',
           type: 'input',
           message: question,
           default: 'n',
        },
      ]).then(function(answers) {
        if (answers.confirmation.toLowerCase() !== 'y') {
          return Promise.reject(new Error("aborted"));
        }
        return Promise.resolve();
      });
    };

    var highestVersion;
    var version = options.version || '0.0.0';
    var filesToUpload;

    // Check existing releases. There should be no release with this version
    // AND, all releases should be less than this one
    listReleases({
      owner: options.username,
      repo: repoName,
    }).then(function(res) {
      for (var ii = 0; ii < res.length; ++ii) {
        var release = res[ii];
        if (semver.valid(release.name)) {
          console.log("found existing release: " + release.name);
          if (!highestVersion || semver.gt(release.name, highestVersion)) {
            highestVersion = release.name;
          }
        }
      }

      // If we specified a version, make sure it's higher than the highest published version
      if (options.version) {
        if (highestVersion && semver.lte(version, highestVersion)) {
          return Promise.reject(new Error("version '" + version + "' is less than highest released version: " + highestVersion));
        }

        // Make sure this verison is >= package.json
        if (semver.lt(version, info.version)) {
          return Promise.reject(new Error("version '" + version + "' is less than package.json version: " + info.version));
        }
      } else {
        // If there is no published version just use version in package.json
        if (!highestVersion) {
          version = info.version;
          return Promise.resolve();
        }

        version = semver.inc(highestVersion, options.bump);
        if (!version) {
          return Promise.reject(new Error("bad bump type: '" + options.bump + "'"));
        }

        if (semver.lt(version, info.version)) {
          version = info.version;
        }
      }

      // check if version in package.json matches. If not ask
      if (!semver.eq(version, info.version)) {
        return askOrForce('update package.json to version:' + version).then(function() {
          runtimeInfo.info.version = version;
          gameInfo.writeGameInfo(runtimeInfo);
          console.warn("don't forgot to commit the new updated package.json");
          return Promise.resolve();
        });
      }

      return Promise.resolve();
    }).then(function() {
      if (version.charAt(0) !== 'v') {
        version = "v" + version;
      }
      return utils.getTempFolder({unsafeCleanup: true});  // deletes the folder on exit.
    }).then(function(filePath) {
      return make.make(gamePath, filePath, {
        exporterPath: options.exporterPath,
        exportPackage: options.exportPackage,
        export: true,
      });
    }).then(function(files) {
      files.forEach(function(file) {
        stuffToDelete.push(file.filename);
      });
      filesToUpload = files;
      console.log("Upload:\n" + files.map(function(file) {
        return "    " + file.filename;
      }).join("\n"));
      console.log("publish as version: " + version);
      return askOrForce('release y/N?');
    }).then(function() {
      console.log("creating release...");
      auth();
      return createRelease({
        owner: options.username,
        repo: repoName,
        tag_name: version,
        target_commitish: "master",  // eslint-disable-line
        name: version,
      });
    }).then(function(releaseInfo) {
      log("releaseInfo", releaseInfo);
      var promises = [];
      filesToUpload.push({filename: runtimeInfo.packagePath});
      filesToUpload.forEach(function(file) {
        auth();
        promises.push(uploadAsset({
          owner: options.username,
          repo: repoName,
          id: releaseInfo.id,
          name: path.basename(file.filename),
          filePath: file.filename,
        }).then(function(result) {
          if (result.state !== 'uploaded') {
            return Promise.reject(new Error("upload state for '" + result.name + "' is '" + result.state + "'"));
          }
          var localSize = fs.statSync(file.filename).size;
          if (result.size !== localSize) {
            return Promise.reject(new Error("upload size for '" + result.name + "' is " + result.size + " but should be " + localSize));
          }
        }));
      });
      return Promise.all(promises);
    }).then(function() {
      console.log(gameId + ": release uploaded");

      return register.register({
        repoUrl: options.repoUrl,
        endpoint: options.endpoint,
        email: options.email,
        sendEmail: options.sendEmail,
      });
    }).then(function() {
      console.log(gameId + ": registered");
      cleanup();
      fulfill();
    }).catch(function(err) {
      reject(err);
      cleanup();
    });
  });
};

exports.publish = publish;


