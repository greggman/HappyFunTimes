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
   * @param {Object} obj Object with new settings.
   * @param {Object} dst Object to receive new settings.
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
  // @param {String} url URL like string eg. http://foo?key=value
  // @param {Object=} opt_obj Object to attach key values to
  // @return {Object} Object with key values from URL
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
  // @param {Object=} opt_obj Object to attach key values to
  // @return {Object} Object with key values from URL
  var parseUrlQuery = function(opt_obj) {
    return parseUrlQueryString(window.location.href);
  };

  // Read `settings` from URL. Assume settings it a
  // JSON like URL as in http://foo?settings={key:value},
  // Note that unlike real JSON we don't require quoting
  // keys if they are alpha_numeric.
  //
  // @param {Object=} opt_obj object to apply settings to.
  // @param {String=} opt_argumentName name of key for settings, default = 'settings'.
  // @return {Object} object with settings
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

  var randCSSColor = function(opt_randFunc) {
    var randFunc = opt_randFunc || randInt;
    var strong = randFunc(3);
    var colors = [];
    for (var ii = 0; ii < 3; ++ii) {
      colors.push(randFunc(128) + (ii == strong ? 128 : 64));
    }
    return "rgb(" + colors.join(",") + ")";
  };

  var rand32BitColor = function(opt_randFunc) {
    var randFunc = opt_randFunc || randInt;
    var strong = randFunc(3);
    var color = 0xFF;
    for (var ii = 0; ii < 3; ++ii) {
      color = (color << 8) | (randFunc(128) + (ii == strong ? 128 : 64));
    }
    return color;
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
   * @param {HTMLElement} element The element to get a position
   *        for.
   * @returns {Object} An object containing x and y as the
   *   absolute position of the given element.
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

  /**
   * Clamp value
   * @param {Number} v value to clamp
   * @param {Number} min min value to clamp to
   * @param {Number} max max value to clamp to
   * @returns {Number} v clamped to min and max.
   */
  var clamp = function(v, min, max) {
    return Math.max(min, Math.min(max, v));
  };

  /**
   * Clamp in both positive and negative directions.
   * Same as clamp(v, -max, +max)
   *
   * @param {Number} v value to clamp
   * @param {Number} max max value to clamp to
   * @returns {Number} v clamped to -max and max.
   */
  var clampPlusMinus = function(v, max) {
    return clamp(v, -max, max);
  };

  /**
   * Return sign of value
   *
   * @param {Number} v value
   * @returns {Number} -1 if v < 0, 1 if v > 0, 0 if v == 0
   */
  var sign = function(v) {
    return v < 0 ? -1 : (v > 0 ? 1 : 0);
  };

  /**
   * Takes which ever is closer to zero
   * In other words minToZero(-2, -1) = -1 and minToZero(2, 1) = 1
   *
   * @param {Number} v value to min
   * @param {Number} min min value to use if v is less then -min
   *        or greater than +min
   * @returns {Number} min or v, which ever is closer to zero
   */
  var minToZero = function(v, min) {
    return Math.abs(v) < Math.abs(min) ? v : min;
  };

  /**
   * flips 0->max to max<-0 and 0->min to min->0
   * In otherwords
   *     max: 3, v: 2.7  =  0.3
   *     max: 3, v:-2.7  = -0.3
   *     max: 3, v: 0.2  =  2.8
   *     max: 3, v:-0.2  = -2.8
   *
   * @param {Number} v value to flip.
   * @param {Number} max range to flip inside.
   * @returns {Number} flipped value.
   */
  var invertPlusMinusRange = function(v, max) {
    return sign(v) * (max - Math.min(max, Math.abs(v)));
  };

  /**
   * Convert degrees to radians
   *
   * @param {Number} d value in degrees
   * @returns {Number} d in radians
   */
  var degToRad = function(d) {
    return d * Math.PI / 180;
  };

  /**
   * Converts radians to degrees
   * @param {Number} r value in radians
   * @returns {Number} r in degrees
   */
  var radToDeg = function(r) {
    return r * 180 / Math.PI;
  };

  /**
   * Resizes a cavnas to match its CSS displayed size.
   * @param {Canvas} canvas canvas to resize.
   * @param {Boolean=} use_devicePixelRatio if true canvas will be
   *        created to match devicePixelRatio.
   */
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
    rand32BitColor: rand32BitColor,
    resize: resize,
    sign: sign,
  };
});


