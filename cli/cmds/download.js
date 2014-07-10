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

var download = function(args) {
  if (args._.length < 2) {
    utils.badArgs(module, "missing gameId");
  }

  if (args._.length > 2) {
    utils.badArgs(module, "too many arguments");
  }

  var options = {
    dryRun: args['dry-run'],
    verbose: args['verbose'],
    gamesUrl: args['games-url'],
  };

  var gameId = args._[1];

  var emitter = release.download(gameId, args.dst, options);
  emitter.on('status', function(e) {
    console.log("STATUS: " + e.status);
  });
  emitter.on('progress', function(e) {
    console.log("downloaded: " + (e.bytesDownloaded / e.size * 100).toFixed() + "% (" + e.bytesDownloaded + "/" + e.size + ")");
  });
  emitter.on('error', function(e) {
    console.error("ERROR downloading gameId: " + gameId);
    console.error(e);
    if (e instanceof Error) {
      if (e.stack) {
        console.log(e.stack);
      }
    }
    process.exit(1);
  });
  emitter.on('end', function(e) {
    console.log("downloaded and installed:" + gameId);
  });
};

exports.usage = [
  "gameId",
  "",
  "download and installs a game by gameId. Example:",
  "",
  "   hft download jumpjump",
  "",
  "options:",
  "",
  "    --dst=dstpath: path to install to. If not supplied will be installed to default games folder.",
  "    --verbose    : print more stuff",
  "    --dry-run    : don't write any files",
  "    --games-url  : get game info from url",
].join("\n");
exports.cmd = download;


