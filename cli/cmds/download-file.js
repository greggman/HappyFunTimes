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

var Promise = require('promise');
var utils   = require('../utils');

var downloadFile = function(args) {
  return new Promise(function(resolve, reject) {
    if (args._.length < 1) {
      utils.badArgs(module, "missing url and destPath");
      reject();
      return;
    }

    if (args._.length < 2) {
      utils.badArgs(module, "missing destPath");
      reject();
      return;
    }

    var options = {
      verbose: args['verbose'],
    };

    var url = args._[0];
    var destPath = args._[1];
    var log = options.verbose ? console.log.bind(console) : function() { };
    var print = options.verbose ? console.log.bind(console) : function() { };

    var emitter = require('../../management/download').downloadFile(url, destPath);
    emitter.on('start', function(e) {
      log("getting: " + url + ", size: " + e.size);
    });
    emitter.on('progress', function(e) {
      print("downloaded: " + (e.bytesDownloaded / e.size * 100).toFixed() + "% (" + e.bytesDownloaded + "/" + e.size + ")\r");
    });
    emitter.on('end', function(e) {
      print("\n");
      console.log("downloaded " + e.size + " bytes to " + destPath);
      resolve();
    });
    emitter.on('error', function(e) {
      console.error("ERROR downloading " + url + " to " + destPath);
      console.error(e);
      reject();
    });
  });
};

exports.usage = {
  usage: "url destPath",
  prepend: [
    "downloads a file. Example:",
    "",
    "   hft download-file http://foo/bar.zip /tmp/bar.zip",
  ].join("\n"),
  options: [
  ],
};
exports.cmd = downloadFile;


