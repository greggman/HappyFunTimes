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
 * THEORY OF2 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

var debug     = require('debug')('gamefiles');
var path      = require('path');
var requirejs = require('requirejs');
var fsWrapper = require('../lib/fs-wrapper');
var utils     = require('../lib/utils');

var GameFiles = function(options) {
  options = options || {};
  var fs = options.fileSystem || require('fs');
  var enabled = true;
  var tempPath;
  var gameFiles = {};

  this.enable = function(enable) {
    enabled = enable;
  };

  this.addFiles = function(files) {
    Object.keys(files).forEach(function(filePath) {
      var content = files[filePath];
      filePath = filePath.replace(/\\/g, "/");
      debug("add file:" + filePath);
      gameFiles[filePath] = content;
    })
  };

  var fileSystem = fsWrapper.createReadOnlyWrapper({
    fileSystem: fs,
    readContent: false,
    isEnabledFn: function(filename) {
      filename = filename.replace(/\\/g, "/");
      return enabled && gameFiles[filename];
    },
    beforeReadFn: function(filename) {
      filename = filename.replace(/\\/g, "/");
      debug("getting: " + filename);
      return gameFiles[filename];
    },
  });

  this.fileSystem = fileSystem;
};

module.exports = GameFiles;




