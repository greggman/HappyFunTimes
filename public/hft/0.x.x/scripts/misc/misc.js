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

/**
 * @module Misc
 */
define(function() {
  /**
   * Copies properties from obj to dst recursively.
   * @param {Object} obj Object with new settings.
   * @param {Object} dst Object to receive new settings.
   * @param {number?} opt_overwriteBehavior
   *     *   0/falsy = overwrite
   *
   *         src    = {foo:'bar'}
   *         dst    = {foo:'abc'}
   *         result = {foo:'bar'}
   *
   *     *   1 = don't overwrite but descend if deeper
   *
   *         src    = {foo:{bar:'moo','abc':def}}
   *         dst    = {foo:{bar:'ghi'}}
   *         result = {foo:{bar:'ghi','abc':def}}
   *
   *         'foo' exists but we still go deeper and apply 'abc'
   *
   *     *   2 = don't overwrite don't descend
   *
   *             src    = {foo:{bar:'moo','abc':def}}
   *             dst    = {foo:{bar:'ghi'}}
   *             result = {foo:{bar:'ghi'}}
   *
   *         'foo' exists so we don't go any deeper
   *
   */
  var copyProperties = function(src, dst, opt_overwriteBehavior) {
    Object.keys(src).forEach(function(key) {
      if (opt_overwriteBehavior === 2 && dst[key] !== undefined) {
        return;
      }
      var value = src[key];
      if (value instanceof Array) {
        var newDst = dst[key];
        if (!newDst) {
          newDst = [];
          dst[name] = newDst;
        }
        copyProperties(value, newDst, opt_overwriteBehavior);
      } else if (value instanceof Object &&
                 !(value instanceof Function) &&
                 !(value instanceof HTMLElement)) {
        var newDst2 = dst[key];
        if (!newDst2) {
          newDst2 = {};
          dst[key] = newDst2;
        }
        copyProperties(value, newDst2, opt_overwriteBehavior);
      } else {
        if (opt_overwriteBehavior === 1 && dst[key] !== undefined) {
          return;
        }
        dst[key] = value;
      }
    });
    return dst;
  };

  function searchStringToObject(str, opt_obj) {
    if (str[0] === '?') {
      str = str.substring(1);
    }
    var results = opt_obj || {};
    str.split("&").forEach(function(part) {
      var pair = part.split("=").map(decodeURIComponent);
      results[pair[0]] = pair[1] !== undefined ? pair[1] : true;
    });
    return results;
  }

  function objectToSearchString(obj) {
    return "?" + Object.keys(obj).filter(function(key) {
      return obj[key] !== undefined;
    }).map(function(key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]);
    }).join("&");
  }

  /**
   * Reads the query values from a URL like string.
   * @param {String} url URL like string eg. http://foo?key=value
   * @param {Object} [opt_obj] Object to attach key values to
   * @return {Object} Object with key values from URL
   * @memberOf module:Misc
   */
  var parseUrlQueryString = function(str, opt_obj) {
    var dst = opt_obj || {};
    try {
      var q = str.indexOf("?");
      var e = str.indexOf("#");
      if (e < 0) {
        e = str.length;
      }
      var query = str.substring(q + 1, e);
      searchStringToObject(query, dst);
    } catch (e) {
      console.error(e);
    }
    return dst;
  };

  /**
   * Reads the query values from the current URL.
   * @param {Object=} opt_obj Object to attach key values to
   * @return {Object} Object with key values from URL
   * @memberOf module:Misc
   */
  var parseUrlQuery = function(opt_obj) {
    return searchStringToObject(window.location.search, opt_obj);
  };

  /**
   * Read `settings` from URL. Assume settings it a
   * JSON like URL as in http://foo?settings={key:value},
   * Note that unlike real JSON we don't require quoting
   * keys if they are alpha_numeric.
   *
   * @param {Object=} opt_obj object to apply settings to.
   * @param {String=} opt_argumentName name of key for settings, default = 'settings'.
   * @return {Object} object with settings
   * @func applyUrlSettings
   * @memberOf module:Misc
   */
  var fixKeysRE = new RegExp("([a-zA-Z0-9_]+)\:", "g");

  var applyUrlSettings = function(opt_obj, opt_argumentName) {
    var argumentName = opt_argumentName || 'settings';
    var src = parseUrlQuery();
    var dst = opt_obj || {};
    var settingsStr = src[argumentName];
    if (settingsStr) {
      var json = settingsStr.replace(fixKeysRE, '"$1":');
      var settings = JSON.parse(json);
      copyProperties(settings, dst);
    }
    return dst;
  };

  /**
   * Gets a function checking for prefixed versions
   *
   * example:
   *
   *     var lockOrientation = misc.getFunctionByPrefix(window.screen, "lockOrientation");
   *
   * @param {object} obj object that has function
   * @param {string} funcName name of function
   * @return {function?} or undefined if it doesn't exist
   */
  var prefixes = ["", "moz", "webkit", "ms"];
  function getFunctionByPrefix(obj, funcName) {
    var capitalName = funcName.substr(0, 1).toUpperCase() + funcName.substr(1);
    for (var ii = 0; ii < prefixes.length; ++ii) {
      var prefix = prefixes[ii];
      var name = prefix + prefix ? capitalName : funcName;
      var func = obj[name];
      if (func) {
        return func.bind(obj);
      }
    }
  }

  /**
   * Creates an invisible iframe and sets the src
   * @param {string} src the source for the iframe
   * @return {HTMLIFrameElement} The iframe
   */
  function gotoIFrame(src) {
    var iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = src;
    document.body.appendChild(iframe);
    return iframe;
  }

  /**
   * get a random int
   * @param {number} value max value exclusive. 5 = random 0 to 4
   * @return {number} random int
   * @memberOf module:Misc
   */
  var randInt = function(value) {
    return Math.floor(Math.random() * value);
  };

  /**
   * get a random CSS color
   * @param {function(number): number?) opt_randFunc function to generate random numbers
   * @return {string} random css color
   * @memberOf module:Misc
   */
  var randCSSColor = function(opt_randFunc) {
    var randFunc = opt_randFunc || randInt;
    var strong = randFunc(3);
    var colors = [];
    for (var ii = 0; ii < 3; ++ii) {
      colors.push(randFunc(128) + (ii === strong ? 128 : 64));
    }
    return "rgb(" + colors.join(",") + ")";
  };

  /**
   * get a random 32bit color
   * @param {function(number): number?) opt_randFunc function to generate random numbers
   * @return {string} random 32bit color
   * @memberOf module:Misc
   */
  var rand32BitColor = function(opt_randFunc) {
    var randFunc = opt_randFunc || randInt;
    var strong = randFunc(3);
    var color = 0xFF;
    for (var ii = 0; ii < 3; ++ii) {
      color = (color << 8) | (randFunc(128) + (ii === strong ? 128 : 64));
    }
    return color;
  };

  /**
   * finds a CSS rule.
   * @param {string} selector
   * @return {Rule?} matching css rule
   * @memberOf module:Misc
   */
  var findCSSStyleRule = function(selector) {
    for (var ii = 0; ii < document.styleSheets.length; ++ii) {
      var styleSheet = document.styleSheets[ii];
      var rules = styleSheet.cssRules || styleSheet.rules;
      if (rules) {
        for (var rr = 0; rr < rules.length; ++rr) {
          var rule = rules[rr];
          if (rule.selectorText === selector) {
            return rule;
          }
        }
      }
    }
  };

  /**
   * Inserts a text node into an element
   * @param {HTMLElement} element element to have text node insert
   * @return {HTMLTextNode} the created text node
   * @memberOf module:Misc
   */
  var createTextNode = function(element) {
    var txt = document.createTextNode("");
    element.appendChild(txt);
    return txt;
  };

  /**
   * Returns the absolute position of an element for certain browsers.
   * @param {HTMLElement} element The element to get a position
   *        for.
   * @returns {Object} An object containing x and y as the
   *        absolute position of the given element.
   * @memberOf module:Misc
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
   * @memberOf module:Misc
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
   * @memberOf module:Misc
   */
  var clampPlusMinus = function(v, max) {
    return clamp(v, -max, max);
  };

  /**
   * Return sign of value
   *
   * @param {Number} v value
   * @returns {Number} -1 if v < 0, 1 if v > 0, 0 if v == 0
   * @memberOf module:Misc
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
   * @memberOf module:Misc
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
   * @memberOf module:Misc
   */
  var invertPlusMinusRange = function(v, max) {
    return sign(v) * (max - Math.min(max, Math.abs(v)));
  };

  /**
   * Convert degrees to radians
   *
   * @param {Number} d value in degrees
   * @returns {Number} d in radians
   * @memberOf module:Misc
   */
  var degToRad = function(d) {
    return d * Math.PI / 180;
  };

  /**
   * Converts radians to degrees
   * @param {Number} r value in radians
   * @returns {Number} r in degrees
   * @memberOf module:Misc
   */
  var radToDeg = function(r) {
    return r * 180 / Math.PI;
  };

  /**
   * Resizes a cavnas to match its CSS displayed size.
   * @param {Canvas} canvas canvas to resize.
   * @param {boolean?} useDevicePixelRatio if true canvas will be
   *        created to match devicePixelRatio.
   * @memberOf module:Misc
   */
  var resize = function(canvas, useDevicePixelRatio) {
    var mult = useDevicePixelRatio ? window.devicePixelRatio : 1;
    mult = mult || 1;
    var width  = Math.floor(canvas.clientWidth  * mult);
    var height = Math.floor(canvas.clientHeight * mult);
    if (canvas.width !== width ||
        canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }
  };

  /**
   * Copies all the src properties to the dst
   * @param {Object} src an object with some properties
   * @param {Object} dst an object to receive copes of the properties
   * @return returns the dst object.
   */
  function applyObject(src, dst) {
    Object.keys(src).forEach(function(key) {
      dst[key] = src[key];
    });
    return dst;
  }

  /**
   * Merges the proprties of all objects into a new object
   *
   * Example:
   *
   *     var a = { abc: "def" };
   *     var b = { xyz: "123" };
   *     var c = Misc.mergeObjects(a, b);
   *
   *     // c = { abc: "def", xyz: "123" };
   *
   * Later object properties take precedence
   *
   *     var a = { abc: "def" };
   *     var b = { abc: "123" };
   *     var c = Misc.mergeObjects(a, b);
   *
   *     // c = { abc: "123" };
   *
   * @param {...Object} object objects to merge.
   * @return an object containing the merged properties
   */
  function mergeObjects(object) {  // eslint-disable-line
    var merged = {};
    Array.prototype.slice.call(arguments).forEach(function(src) {
      if (src) {
        applyObject(src, merged);
      }
    });
    return merged;
  }

  /**
   * Creates a random id
   * @param {number} [digits] number of digits. default 16
   */
  function makeRandomId(digits) {
    digits = digits || 16;
    var id = "";
    for (var ii = 0; ii < digits; ++ii) {
      id = id + ((Math.random() * 16 | 0)).toString(16);
    }
    return id;
  }

  /**
   * Applies an object of listeners to an emitter.
   *
   * Example:
   *
   *     applyListeners(someDivElement, {
   *       mousedown: someFunc1,
   *       mousemove: someFunc2,
   *       mouseup: someFunc3,
   *     });
   *
   * Which is the same as
   *
   *     someDivElement.addEventListener("mousedown", someFunc1);
   *     someDivElement.addEventListener("mousemove", someFunc2);
   *     someDivElement.addEventListener("mouseup", someFunc3);
   *
   * @param {Emitter} emitter some object that emits events and has a function `addEventListener`
   * @param {Object.<string, function>} listeners eventname function pairs.
   */
  function applyListeners(emitter, listeners) {
    Object.keys(listeners).forEach(function(name) {
      emitter.addEventListener(name, listeners[name]);
    });
  }

  return {
    applyObject: applyObject,
    applyUrlSettings: applyUrlSettings,
    applyListeners: applyListeners,
    clamp: clamp,
    clampPlusMinus: clampPlusMinus,
    copyProperties: copyProperties,
    createTextNode: createTextNode,
    degToRad: degToRad,
    findCSSStyleRule: findCSSStyleRule,
    getAbsolutePosition: getAbsolutePosition,
    getFunctionByPrefix: getFunctionByPrefix,
    gotoIFrame: gotoIFrame,
    invertPlusMinusRange: invertPlusMinusRange,
    makeRandomId: makeRandomId,
    mergeObjects: mergeObjects,
    minToZero: minToZero,
    objectToSearchString: objectToSearchString,
    parseUrlQuery: parseUrlQuery,
    parseUrlQueryString: parseUrlQueryString,
    radToDeg: radToDeg,
    randInt: randInt,
    randCSSColor: randCSSColor,
    rand32BitColor: rand32BitColor,
    resize: resize,
    sign: sign,
    searchStringToObject: searchStringToObject,
  };
});


