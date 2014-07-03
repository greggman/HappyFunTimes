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

var path = require('path');
var utils = require('../utils');
var release = require('../../management/release');

var bumpTypes = ['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease'];

var publish = function(args) {
  if (args._.length != 1) {
    utils.badArgs(module, "too many arguments");
  }

  if (!args.user) {
    utils.badArgs(module, "must supply --user=githubusername:pass");
  }

  var bump = 'patch';
  if (args.bump) {
    if (bumpTypes.indexOf(args.bump) < 0) {
      utils.badArgs(module, "unknown bump type: '" + args.bump + "'.\nvalid types: " + bumpTypes.join(", "));
    }
    bump = args.bump;
  }

  if (args.version && !semver.valid(args.version)) {
    utils.badArgs(module, "version not valid semver: '" + version + "'");
  }

  var srcPath = args.src ? path.resolve(args.src) : process.cwd();

  var options = {
    dryRun: args['dry-run'],
    verbose: args['verbose'],
    repo: args['repo'] || path.basename(process.cwd()),
    username: args['user'].split(":")[0],
    password: args['user'].split(":")[1],
    bump: bump,
    version: args['version'],
  };

  release.publish(srcPath, options, function(err) {
    if (err) {
      console.error("ERROR: " + err);
      process.exit(1);
    }
  });
};

exports.usage = [
  "",
  "",
  "makes releases, post them on github, and adds them to superhappyfuntimes.net. ",
  "",
  "Example:",
  "",
  "   hft publish --user=githubusername:password",
  "",
  "options:",
  "",
  "    --bump=type   : how to bump version (major, premajor, minor, preminor, ",
  "                    patch, prepatch, prerelease), default: patch",
  "    --repo=name   : name of github repo. If not supplied assumes it matches",
  "                    current working directory",
  "    --src=srcpath : path to source. If not supplied assumes current working",
  "                    directory.",
  "    --version=ver : set a specific version in semver format.",
  "    --verbose     : print more stuff",
  "    --dry-run     : don't write any files",
].join("\n");
exports.cmd = publish;


