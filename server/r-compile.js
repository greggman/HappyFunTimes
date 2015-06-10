/*
 * Copyright 2015, Gregg Tavares.
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
 * THEORY OF2 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

var debug     = require('debug')('r-compile');
var path      = require('path');
var requirejs = require('requirejs');
var utils     = require('../lib/utils');

var RCompile = function(options) {
  options = options || {};
  var fs = options.fileSystem || require('fs');
  var tempPath;
  var cachedPaths = {};
  var tempFiles = {};

  utils.getTempFolder().then(function(filePath) {
    tempPath = filePath;
    tempFiles[filePath] = true;
  });

  process.on('exit', function() {
    Object.keys(tempFiles).forEach(function(filePath) {
      utils.deleteNoFail(filePath);
    });
  });

  this.compile = function(filename, callback) {
    var contents = cachedPaths[filename];
    if (contents) {
      debug("got from cache: %s", filename);
      setTimeout(function() {
        callback(null, contents);
      }, 0);
      return;
    }
    var include = path.basename(filename, path.extname(filename));
    var out = path.join(tempPath, path.basename(filename));
    debug("compiling filename: %s", filename);
    tempFiles[out] = true;
    var config = {
      baseUrl: path.dirname(filename),
      name: "__hft_almond__/almond",
      include: include,
      insertRequire: [include],
      optimize: options.optimize || "none",
      out:     out,
      wrap:    true,
      paths: {
        hft: path.join(__dirname, "..", "public", "hft", "0.x.x", "scripts"),
        __hft_almond__: path.join(__dirname, "..", "node_modules", "almond"),  // eslint-disable-line
      },
    };

    requirejs.optimize(config, function(/*buildResponse*/) {
      //buildResponse is just a text output of the modules
      //included. Load the built file for the contents.
      //Use config.out to get the optimized file contents.
      var contents = fs.readFileSync(config.out, {encoding: 'utf8'});
      cachedPaths[filename] = contents;
      callback(null, contents);
    }, function(err) {
      callback(err);
    });
  };
};

module.exports = RCompile;




