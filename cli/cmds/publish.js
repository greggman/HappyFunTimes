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

var asks     = require('asks');
var gitUtils = require('../../lib/git-utils.js');
var path     = require('path');
var Promise  = require('promise');
var utils    = require('../utils');

var bumpTypes = ['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease'];

var askPrompt = function(questions) {
  return new Promise(function(fulfill /* , reject */) {
    asks.prompt(questions, function(answers) {
      fulfill(answers);
    });
  });
};


var publish = function(args) {
  return new Promise(function(resolve, reject) {
    if (args._.length !== 0) {
      utils.badArgs(module, "too many arguments");
      reject();
      return;
    }

    var bump = 'patch';
    if (args.bump) {
      if (bumpTypes.indexOf(args.bump) < 0) {
        utils.badArgs(module, "unknown bump type: '" + args.bump + "'.\nvalid types: " + bumpTypes.join(", "));
        reject();
        return;
      }
      bump = args.bump;
    }

    if (args.version && !semver.valid(args.version)) {
      utils.badArgs(module, "version not valid semver: '" + version + "'");
      reject();
      return;
    }

    var srcPath = args.src ? path.resolve(args.src) : process.cwd();

    try {
      args.repoUrl = gitUtils.getGitRepoUrlFromFolder(srcPath);
    } catch (e) {
      console.error("Could not figure out git repo. Are you sure this is a git repo and does it have a remote called 'origin'?");
      reject();
    }

    console.log("found repo: " + args.repoUrl);

    var username;
    var password;
    if (args.user) {
      username = args.user.split(":")[0];
      password = args.user.split(":")[1];
    }

    var promise;
    if (!password) {
      var questions = [
        {
          name: 'password',
          type: 'password',
          message: 'github password:',
        },
      ];
      if (!username) {
        questions.unshift({
          name: 'username',
          type: 'input',
          message: 'github username:',
        });
      }
      promise = askPrompt(questions).then(function(answers) {
        return Promise.resolve({
          username: answers.username || username,
          password: answers.password,
        });
      });
    } else {
      promise = Promise.resolve({
        username: username,
        password: password,
      });
    }

    promise.then(function(answers) {
      var options = {
        dryRun: args['dryRun'],
        verbose: args['verbose'],
        username: answers.username,
        password: answers.password,
        bump: bump,
        force: args['force'],
        version: args['version'],
        repoUrl: args['repoUrl'],
        endpoint: args['endpoint'],
        exporterPath: args['exporterPath'],
        email: args['email'],
        sendEmail: args['sendEmail'],
      };

      return require('../../management/publish').publish(srcPath, options);
    }).then(function() {
      resolve();
    }).catch(function(err) {
      console.error(err);
      reject();
    });
  });
};

exports.usage = {
  usage: "",
  prepend: [
    "makes releases, post them on github, and adds them to superhappyfuntimes.net. ",
    "",
    "Example:",
    "",
    "   hft publish",
  ],
  options: [
    { option: 'user',           type: 'String',  description: "github username or username:password", },
    { option: 'bump',           type: 'String',  description: "how to bump version (major, premajor, minor, preminor, patch, prepatch, prerelease), default: patch", },
    { option: 'src',            type: 'String',  description: "path to source. If not supplied assumes current working directory.", },
    { option: 'force',          type: 'Boolean', description: "don't ask for conformation", },
    { option: 'version',        type: 'String',  description: "set a specific version in semver format. (eg: --version=1.2.3)", },
    { option: 'dry-run',        type: 'Boolean', description: "don't write any files", },
    { option: 'endpoint',       type: 'String',  description: "base url to use to register server (eg. http://local.test.com)"},
    { option: 'exporter-path',  type: 'String',  description: "path to exporter. For example path to unity3d."},
    { option: 'export-package', type: 'Boolean', description: "export a unity package as well."},
    { option: 'email',          type: 'String',  description: "email address to mail notification to. Must match address from last new commits on github. If no address given the email from the latest commit is used."},
    { option: 'send-email',     type: 'Boolean', description: "send email", default: "true"},
  ],
};
exports.cmd = publish;


