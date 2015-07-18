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
var path = require('path');

var readDirTreeSync = function(filePath, options) {
  options = options || {};

  var filter = options.filter;
  if (filter === undefined) {
    filter = function() {
      return true;
    };
  } else if (filter instanceof RegExp) {
    filter = function(filter) {
      return function(filename) {
        return filter.test(filename);
      };
    }(filter);
  }

  var callFilter = function(filename) {
    return filter(filename, filePath, fs.statSync(path.join(filePath, filename)).isDirectory());
  };

  var fileNames = fs.readdirSync(filePath).filter(callFilter);

  var subdirFilenames = [];
  fileNames.forEach(function(fileName) {
    var subdirFileName = path.join(filePath, fileName);
    var stat = fs.statSync(subdirFileName);
    if (stat.isDirectory()) {
      subdirFilenames.push(readDirTreeSync(subdirFileName, options).map(function(subFileName) {
        return path.join(fileName, subFileName);
      }));
    }
  });

  subdirFilenames.forEach(function(subNames) {
    fileNames = fileNames.concat(subNames);
  });

  return fileNames;
};

var globToRegex = function(glob) {
  return glob
    .replace(/\//g, "\/")
    .replace(/\./g, "\\.")
    .replace(/\?/g, ".")
    .replace(/\*/g, ".*?");
};

var makeIgnoreFunc = function(ignore) {
  var negate = false;
  var mustBeDir = false;
  if (ignore.substr(0, 1) === "!") {
    negate = true;
    ignore = ignore.substr(1);
  }
  if (ignore.substr(0, 1) === "/") {
    ignore = "^\/" + ignore.substr(1);
  } else {
    ignore = "\/" + ignore;
  }
  if (ignore.substr(-1) === "/") {
    mustBeDir = true;
  }
  ignore = globToRegex(ignore);
  if (!mustBeDir && ignore.substr(0, 1) !== "^") {
    ignore += "$";
  }
  var re = new RegExp(ignore);

  return function(filename, filePath, isDir) {
    filename = "/" + filename + (isDir ? "/" : "");
    var ignore = !re.test(filename);
    if (negate) {
      ignore = !ignore;
    }
    return ignore;
  };
};

var makeIgnoreFilter = function(ignores) {
  if (!ignores) {
    return function() {
      return true;
    };
  }

  var ignoreFuncs = ignores.map(makeIgnoreFunc);

  return function(nativeFilename, filePath, isDir) {
    var filename = nativeFilename.replace(/\\/g, '/');
    for (var ii = 0; ii < ignoreFuncs.length; ++ii) {
      var ignoreFunc = ignoreFuncs[ii];
      var result = ignoreFunc(filename, filePath, isDir);
      if (!result) {
        return false;
      }
    }
    return true;
  };
};

exports.makeIgnoreFilter = makeIgnoreFilter;
exports.sync = readDirTreeSync;

