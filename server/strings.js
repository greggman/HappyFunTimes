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

/**
 * @module
 */

/**
 * True if string starts with prefix
 * @static
 * @param {String} str string to check for start
 * @param {String} prefix start value
 * @returns {Boolean} true if str starts with prefix
 */
var startsWith = function(str, prefix) {
  return (str.length >= prefix.length &&
          str.substr(0, prefix.length) == prefix);
};

/**
 * True if string ends with suffix
 * @static
 * @param {String} str string to check for start
 * @param {String} suffix start value
 * @returns {Boolean} true if str starts with suffix
 */
var endsWith = function(str, suffix) {
  return (str.length >= suffix.length &&
          str.substring(str.length - suffix.length) == suffix);
};

/**
 * Replace %(id)s in strings with values in objects(s)
 *
 * Given a string like `"Hello %(name)s from $(user.country)s"`
 * and an object like `{name:"Joe",user:{country:"USA"}}` would
 * return `"Hello Joe from USA"`.
 *
 * @param {string} str string to do replacements in
 * @param {Object|Object[]} params one or more objects.
 * @returns {string} string with replaced parts
 */
var replaceParams = (function() {

  var captureRE = /%\(([A-Za-z0-9_\.]+)\)s/g;

  return function(str, params) {
    return str.replace(captureRE, function(match) {
      var id = match.substring(2, match.length - 2);
      var keys = id.split('.');
      for (var ii = 0; ii < keys.length; ++ii) {
        params = params[keys[ii]];
        if (!params) {
          return;
        }
      }
      return params;
    });
  };
}());


exports.startsWith = startsWith;
exports.endsWith = endsWith;
exports.replaceParams = replaceParams;



