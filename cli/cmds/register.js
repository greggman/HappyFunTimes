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

var fs        = require('fs');
var gameInfo  = require('../../lib/gameinfo');
var gitUtils  = require('../../lib/git-utils.js');
var Promise   = require('promise');

var register = function(args) {
  return new Promise(function(resolve, reject) {
    if (!args.repoUrl) {
      try {
        // Just read this because it might find errors.
        gameInfo.readGameInfo(process.cwd());
        args.repoUrl = gitUtils.getGitRepoUrlFromFolder();
      } catch (e) {
        console.error("Could not figure out git repo. Are you sure this is a git repo and does it remote called 'origin'?");
        console.error(e);
        reject();
        return false;
      }
    }
    require('../../management/register').register(args).then(function() {
      console.log("registered: " + args.repoUrl);
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
    "register asks superhappyfuntimes to add/update your game in its database",
  ],
  options: [
    { option: 'repo-url',   type: 'String',  description: "url to repo. Uses 'origin' from current folder by default"},
    { option: 'endpoint',   type: 'String',  description: "base url to use to contact server (eg. http://local.test.com)"},
    { option: 'email',      type: 'String',  description: "email address to mail notification to. Must match address from last new commits on github. If no address given the email from the latest commit is used."},
    { option: 'send-email', type: 'Boolean', description: "email notification.", default: "true"},
  ],
}
exports.cmd = register;



