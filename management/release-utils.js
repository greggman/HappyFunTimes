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

var asks    = require('asks');
var Promise = require('promise');

var safeishName = function(gameId) {
  return gameId.replace(/[^a-zA-Z0-9-_]/g, '_');
};

var asyncError = function(callback, err) {
  setTimeout(function() {
    callback(err);
  }, 0);
};

var logObject = function(label, obj) {
  if (obj) {
    console.log("---[ " + label + " ]---");
  } else {
    obj = label;
  }
  console.log(JSON.stringify(obj, undefined, "  "));
};

var askPrompt = function(questions) {
  return new Promise(function(fulfill, reject) {
    asks.prompt(questions, function(answers) {
      fulfill(answers);
    });
  });
};

var validRepoURL = (function() {
  // We only support github at the moment.
  var prefixes = [
    "git://github.com/",
    "https://github.com/",
  ];
  return function(v) {
    for (var ii = 0; ii < prefixes.length; ++ii) {
      var prefix = prefixes[ii];
      if (v.substring(0, prefix.length) == prefix) {
        return true;
      }
    }
    return false;
  };
}());

exports.safeishName = safeishName;
exports.asyncError = asyncError;
exports.askPrompt = askPrompt;
exports.logObject = logObject;
exports.validRepoURL = validRepoURL;


