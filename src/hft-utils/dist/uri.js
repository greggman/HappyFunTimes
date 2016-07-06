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

define([], function() {

  // Yes I know this isn't perfect.
  var dirname = function(uri) {
    return uri.substr(0, uri.lastIndexOf("/") + 1);
  };

  var basename = function(uri) {
    return uri.substring(uri.lastIndexOf("/") + 1);
  };

  var join = function() {
    var uri = Array.prototype.map.call(arguments, function(part, ndx) {
      // Remove leading and trailing "/"
      if (part.indexOf(":") < 0) {
        part = part.replace(/^\/+/, "").replace(/\/+$/, "");
      }
      return part;
    }).join("/");
    return normalize(uri);
  };

  var normalize = function(uri) {
     var parts = uri.split("/");
     var newParts = [];
     for (var ii = 0; ii < parts.length; ++ii) {
       if (ii < parts.length - 1) {
         if (parts[ii + 1] == '..') {
           continue;
         }
       }
       if (parts[ii] == '..') {
         continue;
       }
       newParts.push(parts[ii]);
     }
     return newParts.join("/");
  };

  return {
    basename: basename,
    dirname: dirname,
    join: join,
    normalize: normalize,
  }
});

