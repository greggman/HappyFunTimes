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

var debug     = require('debug')('es6-support');
var path      = require('path');
var traceur   = require('traceur');
var strings   = require('../lib/strings');
var fsWrapper = require('../lib/fs-wrapper');

/**
 * @param {ES6Support~Options} options
 */
var ES6Support = function(options) {
  options = options || {};
  var fs = options.fileSystem || require('fs');
  var srcMaps = {};
  var enabled = true;

  this.enable = function(enable) {
    enabled = enable;
  };

  /**
   * @typedef {Object} Compile~Result
   * @property {string} src the es5 version of the file
   * @property {string} map the source map
   */

  /**
   * @param {string} content
   * @param {string} filename (used to generate source map}
   * @return {string}
   */
  var compile = function(content, filename) {
    debug("compile: " + filename);
    var compiler = new traceur.NodeCompiler({
      filename: filename + ".src",
      sourceMaps: true,
      // etc other Traceur options
      modules: 'commonjs',
    });
    var src = compiler.compile(content);
    var mapName = filename + ".map";
    debug("adding srcmap: " + mapName);
    var srcMap = compiler.getSourceMap();
    srcMaps[mapName] = srcMap;
    return src;
  };

  var isES6 = function(filename) {
    return path.extname(filename) === ".js6";
  };

  var isES6Map = function(filename) {
    return strings.endsWith(filename, ".js6.map");
  };

  var getSrcMap = function(filename) {
    if (isES6Map(filename)) {
      var srcMap = srcMaps[filename];
      if (srcMap) {
        debug("got srcmap: " + filename);
        return srcMap;
      }
    }
  };

  var translate = function(filename, content) {
    return compile(content.toString(), filename);
  };

  var fileSystem = fsWrapper.createReadOnlyWrapper({
    fileSystem: fs,
    isEnabledFn: function(filename) {
      return enabled && (isES6(filename) || isES6Map(filename));
    },
    beforeReadFn: function(filename) {
      return getSrcMap(filename);
    },
    readFileSyncImpl: function(filename, content) {
      return isES6(filename) ? translate(filename, content) : content;
    },
  });

  this.isES6 = isES6;
  this.fileSystem = fileSystem;
};

module.exports = ES6Support;


