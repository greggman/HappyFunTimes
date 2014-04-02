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

define(function() {

  var s_colorData = {
    aliceblue: 0xfff0f8ff,
    antiquewhite: 0xfffaebd7,
    aqua: 0xff00ffff,
    aquamarine: 0xff7fffd4,
    azure: 0xfff0ffff,
    beige: 0xfff5f5dc,
    bisque: 0xffffe4c4,
    black: 0xff000000,
    blanchedalmond: 0xffffebcd,
    blue: 0xff0000ff,
    blueviolet: 0xff8a2be2,
    brown: 0xffa52a2a,
    burlywood: 0xffdeb887,
    cadetblue: 0xff5f9ea0,
    chartreuse: 0xff7fff00,
    chocolate: 0xffd2691e,
    coral: 0xffff7f50,
    cornflowerblue: 0xff6495ed,
    cornsilk: 0xfffff8dc,
    crimson: 0xffdc143c,
    cyan: 0xff00ffff,
    darkblue: 0xff00008b,
    darkcyan: 0xff008b8b,
    darkgoldenrod: 0xffb8860b,
    darkgray: 0xffa9a9a9,
    darkgrey: 0xffa9a9a9,
    darkgreen: 0xff006400,
    darkkhaki: 0xffbdb76b,
    darkmagenta: 0xff8b008b,
    darkolivegreen: 0xff556b2f,
    darkorange: 0xffff8c00,
    darkorchid: 0xff9932cc,
    darkred: 0xff8b0000,
    darksalmon: 0xffe9967a,
    darkseagreen: 0xff8fbc8f,
    darkslateblue: 0xff483d8b,
    darkslategray: 0xff2f4f4f,
    darkslategrey: 0xff2f4f4f,
    darkturquoise: 0xff00ced1,
    darkviolet: 0xff9400d3,
    deeppink: 0xffff1493,
    deepskyblue: 0xff00bfff,
    dimgray: 0xff696969,
    dimgrey: 0xff696969,
    dodgerblue: 0xff1e90ff,
    firebrick: 0xffb22222,
    floralwhite: 0xfffffaf0,
    forestgreen: 0xff228b22,
    fuchsia: 0xffff00ff,
    gainsboro: 0xffdcdcdc,
    ghostwhite: 0xfff8f8ff,
    gold: 0xffffd700,
    goldenrod: 0xffdaa520,
    gray: 0xff808080,
    grey: 0xff808080,
    green: 0xff008000,
    greenyellow: 0xffadff2f,
    honeydew: 0xfff0fff0,
    hotpink: 0xffff69b4,
    indianred: 0xffcd5c5c,
    indigo: 0xff4b0082,
    ivory: 0xfffffff0,
    khaki: 0xfff0e68c,
    lavender: 0xffe6e6fa,
    lavenderblush: 0xfffff0f5,
    lawngreen: 0xff7cfc00,
    lemonchiffon: 0xfffffacd,
    lightblue: 0xffadd8e6,
    lightcoral: 0xfff08080,
    lightcyan: 0xffe0ffff,
    lightgoldenrodyellow: 0xfffafad2,
    lightgray: 0xffd3d3d3,
    lightgrey: 0xffd3d3d3,
    lightgreen: 0xff90ee90,
    lightpink: 0xffffb6c1,
    lightsalmon: 0xffffa07a,
    lightseagreen: 0xff20b2aa,
    lightskyblue: 0xff87cefa,
    lightslateblue: 0xff8470ff,
    lightslategray: 0xff778899,
    lightslategrey: 0xff778899,
    lightsteelblue: 0xffb0c4de,
    lightyellow: 0xffffffe0,
    lime: 0xff00ff00,
    limegreen: 0xff32cd32,
    linen: 0xfffaf0e6,
    magenta: 0xffff00ff,
    maroon: 0xff800000,
    mediumaquamarine: 0xff66cdaa,
    mediumblue: 0xff0000cd,
    mediumorchid: 0xffba55d3,
    mediumpurple: 0xff9370db,
    mediumseagreen: 0xff3cb371,
    mediumslateblue: 0xff7b68ee,
    mediumspringgreen: 0xff00fa9a,
    mediumturquoise: 0xff48d1cc,
    mediumvioletred: 0xffc71585,
    midnightblue: 0xff191970,
    mintcream: 0xfff5fffa,
    mistyrose: 0xffffe4e1,
    moccasin: 0xffffe4b5,
    navajowhite: 0xffffdead,
    navy: 0xff000080,
    oldlace: 0xfffdf5e6,
    olive: 0xff808000,
    olivedrab: 0xff6b8e23,
    orange: 0xffffa500,
    orangered: 0xffff4500,
    orchid: 0xffda70d6,
    palegoldenrod: 0xffeee8aa,
    palegreen: 0xff98fb98,
    paleturquoise: 0xffafeeee,
    palevioletred: 0xffdb7093,
    papayawhip: 0xffffefd5,
    peachpuff: 0xffffdab9,
    peru: 0xffcd853f,
    pink: 0xffffc0cb,
    plum: 0xffdda0dd,
    powderblue: 0xffb0e0e6,
    purple: 0xff800080,
    red: 0xffff0000,
    rosybrown: 0xffbc8f8f,
    royalblue: 0xff4169e1,
    saddlebrown: 0xff8b4513,
    salmon: 0xfffa8072,
    sandybrown: 0xfff4a460,
    seagreen: 0xff2e8b57,
    seashell: 0xfffff5ee,
    sienna: 0xffa0522d,
    silver: 0xffc0c0c0,
    skyblue: 0xff87ceeb,
    slateblue: 0xff6a5acd,
    slategray: 0xff708090,
    slategrey: 0xff708090,
    snow: 0xfffffafa,
    springgreen: 0xff00ff7f,
    steelblue: 0xff4682b4,
    tan: 0xffd2b48c,
    teal: 0xff008080,
    thistle: 0xffd8bfd8,
    tomato: 0xffff6347,
    transparent: 0x00000000,
    turquoise: 0xff40e0d0,
    violet: 0xffee82ee,
    violetred: 0xffd02090,
    wheat: 0xfff5deb3,
    white: 0xffffffff,
    whitesmoke: 0xfff5f5f5,
    yellow: 0xffffff00,
    yellowgreen: 0xff9acd32,
  };

  var s_hexrrggbbRE = /\s*#([0-9a-fA-F][0-9a-fA-F])([0-9a-fA-F][0-9a-fA-F])([0-9a-fA-F][0-9a-fA-F])\s*/;
  var s_hexrgbRE = /\s*#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])\s*/;
  var s_rgbRE = /\s*rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*/;
  var s_rgbaRE = /\s*rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(.+)\)\s*/;
  var s_nameRE = /\s*(\w+)\s*/;

  // given a CSS color string, returns an array of 4 integers [r, g, b, a] in the range 0 to 255.
  // if opt_0to1 is passed in the values will be 0 to 1.
  var parseCSSColor = function(s, opt_0to1) {
    // I have no idea what all the color formats are. The ones here are
    // name:         red,              green,            purple
    // #RGB:         #F00,             #0F0,             #F0F
    // #RRGGBB       #FF0000,          #00FF00,          #FF00FF
    // rgb(r,g,b)    rgb(255,0,0)      rgb(0,255,0),     rgb(255,0,255)
    // rgba(r,g,b,a) rgba(255,0,0,1.0) rgba(0,255,0,1.0) rgba(255,0,255,1.0)

    var m;
    var c;
    m = s_hexrrggbbRE.exec(s);
    if (m) {
      c = [
        parseInt(m[1], 16),
        parseInt(m[2], 16),
        parseInt(m[3], 16),
        255,
      ];
    } else if (m = s_hexrgbRE.exec(s)) {
      var r = parseInt(m[1], 16);
      var g = parseInt(m[2], 16);
      var b = parseInt(m[3], 16);
      c = [
        r * 16 + r,
        g * 16 + g,
        b * 16 + b,
        255,
      ];
    } else if (m = s_rgbRE.exec(s)) {
      c = [
        parseInt(m[1]),
        parseInt(m[2]),
        parseInt(m[3]),
        255,
      ];
    } else if (m = s_rgbaRE.exec(s)) {
      c = [
        parseInt(m[1]),
        parseInt(m[2]),
        parseInt(m[3]),
        Math.floor(parseFloat(m[4]) * 255),
      ];
    } else if(m = s_nameRE.exec(s)) {
      var name = m[1].toLowerCase();
      var color = s_colorData[name];
      if (color !== undefined) {
        c = [
          (color >> 16) & 0xFF,
          (color >>  8) & 0xFF,
          (color >>  0) & 0xFF,
          (color >> 24) & 0xFF,
        ];
      }
    }

    if (!c) {
      console.error("unsupported color format: " + s);
    }

    if (opt_0to1) {
      c[0] = c[0] / 255;
      c[1] = c[1] / 255;
      c[2] = c[2] / 255;
      c[3] = c[3] / 255;
    }

    return c;
  };

  /*
  var res = [
      "#1af",
      " #1af ",
      "#12abef",
      " #12abef ",
      "rgb(30,100,255)",
      " rgb( 30 , 100 , 255 ) ",
      "rgba(30,100,255,0.5)",
      " rgba( 30 , 100 , 255 , 0.5 ) ",
      "green",
      " purple ",
  ];
  console.log("here!");
  for (var ii = 0; ii < res.length; ++ii) {
    var a = parseCSSColor(res[ii]);
    console.log("" + ii + ": " + a);
  }
  */

  return {
    parseCSSColor: parseCSSColor,
  };

});
