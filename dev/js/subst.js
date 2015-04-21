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

var hanson  = require('hanson');

var Subst = function() {
  var replaceParamsRE = /%\(([^\)]+)\)s/g;
  var replaceHandlers = {};

  var handleString = function(data, params) {
    return data.data;
  }.bind(this);

  var handleSubst = function(data, params) {
    var key = data.data;
    // If there's a colon it's a handler.
    var colonNdx = key.indexOf(":");
    if (colonNdx >= 0) {
      try {
        var args = hanson.parse("{" + key + "}");
        var handlerName = Object.keys(args)[0];  // there should only be one key here
        var handler = replaceHandlers[handlerName];
        if (handler) {
          return replaceParams(handler(args[handlerName], this, params), params);
        }
        console.error("unknown substition handler: " + handlerName);
      } catch (e) {
        console.error(e);
        console.error("bad substitution: %(" + key + ")s");
      }
    } else {
      // handle normal substitutions.
      var keys = key.split('.');
      for (var ii = 0; ii < params.length; ++ii) {
        var obj = params[ii];
        for (var jj = 0; jj < keys.length; ++jj) {
          var k = keys[jj];
          obj = obj[k];
          if (obj === undefined) {
            break;
          }
        }
        if (obj !== undefined) {
          return replaceParams(obj, params);
        }
      }
    }
    console.error("unknown key: " + key);
    return "%(" + key + ")s";
  }.bind(this);

  function registerReplaceHandler(keyword, handler) {
    replaceHandlers[keyword] = handler;
  };

  function Template(template) {
    this.apply = function(params) {
      params = Array.isArray(params) ? params : [params];

      var result = template.map(function(part) {
        return part.fn(part, params);
      });

      return result.join("");
    }
  }

  function createTemplate(str) {
    var template = [];
    var length = str.length;
    var depth = 0;
    var lastChar = '';
    var justEnded = false;
    var start = 0;
    var startLine = -1;
    var lineNum = 1;


    function addString(start, end) {
      template.push({ fn: handleString, data: str.substring(start, end) });
    }

    function addSubst(start, end) {
      template.push({ fn: handleSubst,  data: str.substring(start, end) });
    }

    for (var ii = 0; ii < length; ++ii) {
      var c = str[ii];
      if (c === '%') {
        if (lastChar === '%') {
          addString(start, ii);
          start = ii + 1;
          c = '';  // so lastChar will not be '%'
        }
      } else if (c === '(') {
        if (lastChar === '%') {
          if (depth === 0) {
            addString(start, ii - 1);
            start = ii + 1;
          }
          ++depth;
        }
      } else if (c === ')') {
        if (depth > 0) {
          --depth;
          if (depth < 0) {
            throw new Error("bad template at line: " + lineNum);
          }
          if (depth === 0) {
            addSubst(start, ii);
            startLine = lineNum;
            start = ii + 1;
            justEnded = true;
          }
        }
      } else if (lastChar === ')') {
        if (justEnded) {
          justEnded = false;
          template[template.length - 1].subtype = c;
          start += 1;
        }
      } else if (c === '\n') {
        ++lineNum;
      }
      lastChar = c;
    }

    if (depth) {
      throw new Error("no closing param for substitution at line: " + startLine);
    }

    addString(start, ii);
    return new Template(template);
  };

  /**
   * Replace %(id)s in strings with values in objects(s)
   *
   * Given a string like `"Hello %(name)s from %(user.country)s"`
   * and an object like `{name:"Joe",user:{country:"USA"}}` would
   * return `"Hello Joe from USA"`.
   *
   * @param {string} str string to do replacements in
   * @param {Object|Object[]} params one or more objects.
   * @returns {string} string with replaced parts
   */
  function replaceParams(str, params) {
    return createTemplate(str).apply(params);
  };

  this.replaceParams = replaceParams;
  this.createTemplate = createTemplate;
  this.registerReplaceHandler = registerReplaceHandler;
};

module.exports = Subst;



