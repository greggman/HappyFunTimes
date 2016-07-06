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

define([
  ], function() {
  /**
   * Converts an RGB color value to HSV. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
   * Assumes r, g, and b are contained in the set [0, 1] and
   * returns h, s, and v in the set [0, 1].
   *
   * @param {number} r The red color value
   * @param {number} g The green color value
   * @param {number} b The blue color value
   * @return {number[]} The HSV representation
   */
  var rgb01ToHsv = function(r, g, b) {
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h;
    var s;
    var v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if (max == min) {
      h = 0; // achromatic
    } else {
      switch(max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h, s, v];
  };

  /**
   * Converts an RGB color value to HSV. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
   * Assumes r, g, and b are contained in the set [0, 255] and
   * returns h, s, and v in the set [0, 1].
   *
   * @param {number} r The red color value
   * @param {number} g The green color value
   * @param {number} b The blue color value
   * @return {number[]} The HSV representation
   */
  var rgb255ToHsv = function(r, g, b) {
    return rgb01ToHsv(r / 255, g / 255, b / 255);
  };

  /**
   * Converts an HSV color value to RGB. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
   * Assumes h, s, and v are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 1].
   *
   * @param {number} h The hue
   * @param {number} s The saturation
   * @param {number} v The value
   * @return {number[]} The RGB representation
   */
  var hsvToRgb01 = function(h, s, v) {
    var r;
    var g;
    var b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
    }

    return [r, g, b];
  };

  /**
   * Converts an HSV color value to RGB. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
   * Assumes h, s, and v are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 255].
   *
   * @param {number} h The hue
   * @param {number} s The saturation
   * @param {number} v The value
   * @return {number[]} The RGB representation
   */
  var hsvToRgb255 = function(h, s, v) {
    var c = hsvToRgb01(h, s, v);
    return [c[0] * 255 | 0, c[1] * 255 | 0, c[2] * 255 | 0];
  };

  /**
   * Computes the perceived brightness of an RGB color
   * @param {number} r The red color value
   * @param {number} g The green color value
   * @param {number} b The blue color value
   * @return {number} The perceived brightness 0-1
   */
  var rgb01Brightness = function(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  /**
   * Computes the perceived brightness of an RGB color
   * @param {number} r The red color value
   * @param {number} g The green color value
   * @param {number} b The blue color value
   * @return {number} The perceived brightness 0-1
   */
  var rgb255Brightness = function(r, g, b) {
    return rgb01Brightness(r / 255, g / 255, b / 255);
  };

  /**
   * Converts RGBA 0-1 array to css string
   * @param {number[]} c color to convert RGB or RGBA
   * @returns {string} css string for color
   */
  var makeCSSColorFromRgba01Array = function(c) {
    return makeCSSColorFromRgba01(c[0], c[1], c[2], c[3]);
  };

  /**
   * Converts RGBA 0-255 array to css string
   * @param {number[]} c color to convert RGB or RGBA
   * @returns {string} css string for color
   */
  var makeCSSColorFromRgba255Array = function(c) {
    return makeCSSColorFromRgba255(c[0], c[1], c[2], c[3]);
  };

  /**
   * Converts RGBA 0-1 color to css string
   *
   * @param {number} r The red color value
   * @param {number} g The green color value
   * @param {number} b The blue color value
   * @param {number?} a The alpha color value
   * @returns {string} css string for color
   */
  var makeCSSColorFromRgba01 = function(r, g, b, a) {
    if (a === undefined) {
      a = 1;
    }
    return makeCSSColorFromRgba255(r * 255 | 0, g * 255 | 0, b * 255 | 0, a * 255 | 0);
  };

  /**
   * Converts RGBA 0-255 color to css string
   *
   * @param {number} r The red color value
   * @param {number} g The green color value
   * @param {number} b The blue color value
   * @param {number?} a The alpha color value
   * @returns {string} css string for color
   */
  var makeCSSColorFromRgba255 = function(r, g, b, a) {
    if (a === undefined) {
      a = 255;
    }
    return "rgba(" + r + "," + g + "," + b + "," + (a / 255) + ")";
  };

  return {
    hsvToRgb01: hsvToRgb01,
    hsvToRgb255: hsvToRgb255,
    makeCSSColorFromRgba01: makeCSSColorFromRgba01,
    makeCSSColorFromRgba255: makeCSSColorFromRgba255,
    makeCSSColorFromRgba01Array: makeCSSColorFromRgba01Array,
    makeCSSColorFromRgba255Array: makeCSSColorFromRgba255Array,
    rgb01Brightness: rgb01Brightness,
    rgb01ToHsv: rgb01ToHsv,
    rgb255Brightness: rgb255Brightness,
    rgb255ToHsv: rgb255ToHsv,
  };
});


