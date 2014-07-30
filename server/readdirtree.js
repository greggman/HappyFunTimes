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
    filter = function() { return true; };
  } else if (filter instanceof RegExp) {
    filter = function(filter) {
      return function(filename) {
        return filter.test(filename);
      }
    }(filter);
  }

  var fileNames = fs.readdirSync(filePath).filter(filter);

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

exports.sync = readDirTreeSync;

