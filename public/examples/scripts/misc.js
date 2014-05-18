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

define(function() {
  /**
   * Copies properties from obj to dst recursively.
   * @param {!Object} obj Object with new settings.
   * @param {!Object} dst Object to receive new settings.
   */
  var copyProperties = function(obj, dst) {
    for (var name in obj) {
      var value = obj[name];
      if (value instanceof Array) {
        var newDst = dst[name];
        if (!newDst) {
          newDst = [];
          dst[name] = newDst;
        }
        copyProperties(value, newDst);
      } else if (typeof value == 'object') {
        var newDst = dst[name];
        if (!newDst) {
          newDst = {};
          dst[name] = newDst;
        }
        copyProperties(value, newDst);
      } else {
        dst[name] = value;
      }
    }
  };


  // Reads the query values from a URL like string.
  // @param {string} url URL like string eg. http://foo?key=value
  // @param {object} opt_obj Object to attach key values to
  // @return {object} Object with key values from URL
  var parseUrlQueryString = function(str, opt_obj) {
    var dst = opt_obj || {};
    try {
      var q = str.indexOf("?");
      var e = str.indexOf("#");
      if (e < 0) {
        e = str.length;
      }
      var query = str.substring(q + 1, e);
      var pairs = query.split("&");
      for (var ii = 0; ii < pairs.length; ++ii) {
        var keyValue = pairs[ii].split("=");
        var key = keyValue[0];
        var value = decodeURIComponent(keyValue[1]);
        dst[key] = value;
      }
    } catch (e) {
      console.error(e);
    }
    return dst;
  };

  // Reads the query values from the current URL.
  // @param {object} opt_obj Object to attach key values to
  // @return {object} Object with key values from URL
  var parseUrlQuery = function(opt_obj) {
    return parseUrlQueryString(window.location.href);
  };

  // Read `settings` from URL. Assume settings it a
  // JSON like URL as in http://foo?settings={key:value},
  // Note that unlike real JSON we don't require quoting
  // keys if they are alpha_numeric.
  //
  // @param {object} opt_obj object to apply settings to.
  // @param {string} opt_argumentName name of key for settings, default = 'settings'.
  // @return {object} object with settings
  var fixKeysRE = new RegExp("([a-zA-Z0-9_]+)\:", "g");

  var applyUrlSettings = function(opt_obj, opt_argumentName) {
    var argumentName = opt_argumentName || 'settings';
    var src = parseUrlQuery();
    var dst = opt_obj || {};
    if (src.settings) {
      var json = src.settings.replace(fixKeysRE, '"$1":');
      var settings = JSON.parse(json);
      copyProperties(settings, dst);
    }
    return dst;
  };

  var randInt = function(value) {
    return Math.floor(Math.random() * value);
  };

  var randCSSColor = function() {
    var strong = randInt(3);
    var colors = [];
    for (var ii = 0; ii < 3; ++ii) {
      colors.push(randInt(128) + (ii == strong ? 128 : 64));
    }
    return "rgb(" + colors.join(",") + ")";
  };

  var findCSSStyleRule = function(selector) {
    for (var ii = 0; ii < document.styleSheets.length; ++ii) {
      var styleSheet = document.styleSheets[ii];
      var rules = styleSheet.cssRules || styleSheet.rules;
      if (rules) {
        for (var rr = 0; rr < rules.length; ++rr) {
          var rule = rules[rr];
          if (rule.selectorText == selector) {
            return rule;
          }
        }
      }
    }
  };

  var createTextNode = function(element) {
    var txt = document.createTextNode("");
    element.appendChild(txt);
    return txt;
  };

  var copyProperties = function(src, dst) {
    for (var name in src) {
      if (!src.hasOwnProperty(name)) {
        continue;
      }
      var value = src[name];
      if (value instanceof Array) {
        var newDst = dst[name];
        if (!newDst) {
          newDst = [];
          dst[name] = newDst;
        }
        copyProperties(value, newDst);
      } else if (value instanceof Object &&
                 !(value instanceof Function) &&
                 !(value instanceof HTMLElement)) {
        var newDst = dst[name];
        if (!newDst) {
          newDst = {};
          dst[name] = newDst;
        }
        copyProperties(value, newDst);
      } else {
        dst[name] = value;
      }
    }
    return dst;
  };

  /**
   * Returns the absolute position of an element for certain browsers.
   * @param {HTML Element} element The element to get a position for.
   * @return {Object} An object containing x and y as the absolute position
   *   of the given element.
   */
  var getAbsolutePosition = function(element) {
    var r = { x: element.offsetLeft, y: element.offsetTop };
    if (element.offsetParent) {
      var tmp = getAbsolutePosition(element.offsetParent);
      r.x += tmp.x;
      r.y += tmp.y;
    }
    return r;
  };

  var clamp = function(v, min, max) {
    return Math.max(min, Math.min(max, v));
  };

  var clampPlusMinus = function(v, max) {
    return clamp(v, -max, max);
  };

  var sign = function(v) {
    return v < 0 ? -1 : (v > 0 ? 1 : 0);
  };

  // Takes which ever is closer to zero
  // In other words minToZero(-2, -1) = -1 and minToZero(2, 1) = 1
  var minToZero = function(v, min) {
    return Math.abs(v) < Math.abs(min) ? v : min;
  };

  // flips 0->max to max<-0 and 0->min to min->
  // In otherwords
  //   max: 3, v: 2.7  =  0.3
  //   max: 3, v:-2.7  = -0.3
  //   max: 3, v: 0.2  =  2.8
  //   max: 3, v:-0.2  = -2.8
  var invertPlusMinusRange = function(v, max) {
    return sign(v) * (max - Math.min(max, Math.abs(v)));
  };

  var degToRad = function(d) {
    return d * Math.PI / 180;
  };

  var radToDeg = function(r) {
    return r * 180 / Math.PI;
  };

  // Resizes a cavnas to match its CSS displayed size.
  var resize = function(canvas, use_devicePixelRatio) {
    var mult = use_devicePixelRatio ? window.devicePixelRatio : 1;
    mult = mult || 1;
    var width  = Math.floor(canvas.clientWidth  * mult);
    var height = Math.floor(canvas.clientHeight * mult);
    if (canvas.width != width ||
        canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }
  };

  return {
    applyUrlSettings: applyUrlSettings,
    clamp: clamp,
    clampPlusMinus: clampPlusMinus,
    copyProperties: copyProperties,
    createTextNode: createTextNode,
    degToRad: degToRad,
    findCSSStyleRule: findCSSStyleRule,
    getAbsolutePosition: getAbsolutePosition,
    invertPlusMinusRange: invertPlusMinusRange,
    minToZero: minToZero,
    parseUrlQuery: parseUrlQuery,
    parseUrlQueryString: parseUrlQueryString,
    radToDeg: radToDeg,
    randInt: randInt,
    randCSSColor: randCSSColor,
    resize: resize,
    sign: sign,
  };
});


