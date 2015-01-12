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

var wrapAPI = require('../lib/wrap-api');

/**
 * @typedef {Object} ReadOnlyWrapper~Options
 * @property {FileSystem?} fileSystem file system to wrap.
 *           defaults to 'fs'
 * @property {IsEnabledFn?} isEnabledFn if supplied is called
 *           to with the filename and returns true or false if
 *           other parts should called for this file. This
 *           is needed because of the async nature we need to
 *           cache the state of "enabled".
 * @property {BeforeReadFn?) beforeReadFn if supplied is called
 *           before read with filename. Returns content or
 *           undefined.
 * @property {ReadFileImpl?) readFileImpl async implemenetaion
 *           of readFile. It gets passed filename and content
 *           and a callback. It should call callback with error
 *           on error or null, result on success. If not
 *           supplied syncImpl is used
 * @property {ReadFileSyncImpl?) readFileSyncImpl synchronous
 *           implementation of readFileSync. It gets passed
 *           filename and content and should return content
 */

var createReadOnlyWrapper = function(options) {
  var settings = {
  };

  var fs = options.fileSystem || require('fs');

  var returnTrue = function() {
    return true;
  };

  var noop = function() {
  };

  if (options) {
    settings.isEnabledFn      = options.isEnabledFn      || returnTrue;
    settings.beforeReadFn     = options.beforeReadFn     || noop;
    settings.readFileSyncImpl = options.readFileSyncImpl || fs.readFileSync;
    settings.readFileImpl     = options.readFileImpl;
    settings.readContent      = options.readContent;
    options = undefined;  // so we don't use it by mistake below.
  }

  var fileSystem = wrapAPI.wrap(fs);

  fileSystem.readFile = function() {
    /*eslint consistent-return:0*/
    var args = Array.prototype.slice.call(arguments);
    var filename = args[0];

    if (settings.isEnabledFn(filename)) {
      var callback = args.pop();
      var content = settings.beforeReadFn(filename);
      if (content) {
        setTimeout(function() {
          callback(null, content);
        });
        return;
      }

      var innerCallback = function(err, data) {
        if (err) {
          callback(err);
        } else {
          if (settings.readFileImpl) {
            settings.readFileImpl(filename, data, callback);
            return;
          }

          try {
            var content = settings.readFileSyncImpl(filename, data);
          } catch (e) {
            callback(e);
            return;
          }
          callback(null, content);
        }
      };
      if (settings.readContent) {
        args.push(innerCallback);
      } else {
        setTimeout(innerCallback, 0);
        return;
      }
    }
    return fs.readFile.apply(fs, args);
  };

  fileSystem.readFileSync = function() {
    var args = Array.prototype.slice.call(arguments);
    var filename = args[0];

    if (!settings.isEnabledFn(filename)) {
      return fs.readFileSync.apply(fs, args);
    }

    var content = settings.beforeReadFn(filename);
    if (content) {
      return content;
    }

    var data = settings.readContent ? fs.readFileSync.apply(fs, args) : undefined;
    return settings.readFileSyncImpl(filename, data);
  };

  return fileSystem;
};

exports.createReadOnlyWrapper = createReadOnlyWrapper;
