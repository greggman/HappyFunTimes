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
 * Checks if the required properties exist on an object.
 *
 * Example:
 *
 *     var requiredProperties = [
 *       "PATH",
 *       "MYAPP_SETTING1",
 *       "MYAPP_SETTING2",
 *     ];
 *     var missing = getMissingProperties(process.env, requiredProperties);
 *     if (missing) {
 *        console.error(missing.join(", ") + " environment variables are not set!");
 *        process.exit(1);
 *     }
 *
 * @param {object} obj object to check for required properties
 * @param {string[]} requiredProperties properties that are required
 */
var getMissingProperties = function(obj, requiredProperties) {
  var missingProperties = [];
  for (var ii = 0; ii < requiredProperties.length; ++ii) {
    var key = requiredProperties[ii];
    if (obj[key] === undefined) {
      missingProperties.push(key);
    }
  }
  return missingProperties.length > 0 ? missingProperties : undefined;
};

/**
 * Copy properties from one object to another
 * @param {object} src object to copy properties from
 * @param {object} dst object to copy properties to
 * @param {number?} opt_overwriteBehavior
 *     0 = copy everything, making new properties if needed.
 *     1 = don't copy to dest if dest property doesn't already exist but do recurse
 *     2 = don't copy to dest if dest property doesn't already exist and don't recurse if dest doesn't exist
 */

var copyProperties = function(src, dst, opt_overwriteBehavior) {
  Object.keys(src).forEach(function(key) {
    if (opt_overwriteBehavior === 2 && dst[key] !== undefined) {
      return;
    }
    var value = src[key];
    var newDst;
    if (value instanceof Array) {
      newDst = dst[key];
      if (!newDst) {
        newDst = [];
        dst[name] = newDst;
      }
      copyProperties(value, newDst, opt_overwriteBehavior);
    } else if (value instanceof Object) {
      newDst = dst[key];
      if (!newDst) {
        newDst = {};
        dst[key] = newDst;
      }
      copyProperties(value, newDst, opt_overwriteBehavior);
    } else {
      if (opt_overwriteBehavior === 1 && dst[key] !== undefined) {
        return;
      }
      dst[key] = value;
    }
  });
  return dst;
};

exports.copyProperties = copyProperties;
exports.getMissingProperties = getMissingProperties;

