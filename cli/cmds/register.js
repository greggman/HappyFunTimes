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
var release = require('../../management/release');
var gameInfo = require('../../server/gameinfo');
var iniparser = require('iniparser');
var strings = require('../../server/strings');

var register = function(args) {
  if (!args.repoUrl) {
    try {
      // Just read this because it might find errors.
      gameInfo.readGameInfo(process.cwd());

      // Now read the git/.config
      var config = iniparser.parseSync(".git/config");
      args.repoUrl = config['remote "origin"'].url;
      var gitPrefix = "git@github.com:";
      if (strings.startsWith(args.repoUrl, gitPrefix)) {
        args.repoUrl = "https://github.com/" + args.repoUrl.substring(gitPrefix.length);
      }
    } catch (e) {
      console.error("Could not figure out git repo. Are you sure this is a git repo and does it remote called 'origin'?");
      console.error(e);
      return false;
    }
  }
  release.register(args).then(function() {
    console.log("registered: " + args.repoUrl);
  }, function(err) {
    console.error(err);
    process.exit(1);
  });
};

exports.usage = {
  usage: "",
  prepend: [
    "register asks superhappyfuntimes to add/update your game its database",
  ],
  options: [
    { option: 'repo-url', type: 'String', description: "url to repo. Uses 'origin' from current folder by default"},
    { option: 'endpoint', type: 'String', description: "base url to use to contact server (eg. http://local.test.com)"},
  ],
}
exports.cmd = register;



