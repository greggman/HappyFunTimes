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

var ships = (function(){

  var g_colors = [
    [1.0, 0.0, 0.0],
    [1.0, 1.0, 0.0],
    [0.0, 1.0, 0.0],
    [0.0, 1.0, 1.0],
    [0.0, 0.0, 1.0],
    [1.0, 0.0, 1.0],
    [1.0, 0.5, 0.5],
    [1.0, 1.0, 0.5],
    [0.5, 1.0, 0.5],
    [0.5, 1.0, 1.0],
    [0.5, 0.5, 1.0],
    [1.0, 0.5, 1.0]
  ];
  var g_styles = [
    "drawShip",
    "drawOutlineShip",
    "drawTwoToneShip"
  ];
  var g_darkColors = {
  };
  var g_shipSize = 15;

  return {
    styles: g_styles,

    // TODO(gman): if we are going to limit the number
    // of colors and styles then we need to keep track
    // of which ones are used so if a player stops
    // playing his color is free to be used by new
    // players.
    makeColor: function(count) {
      var numStyles = g_styles.length;
      var numColors = g_colors.length;
      var style = count % numStyles;
      var colorNdx = count % numColors;

      //var color = [
      //  (count * 0.31) % 1,
      //  (count * 5.73) % 1,
      //  (count * 7.89) % 1,
      //  1,
      //];
      //var canvasColor = [];
      //var ci = count % 3;
      //for (var ii = 0; ii < 3; ++ii) {
      //  var ndx = (ii + ci) % 3;
      //  var mix = (ii == 0) ? 0.2 : 0.6;
      //  var max = (ii == 0) ? 1 : 0.6;
      //  color[ndx] = color[ndx] * mix + (1 - mix) * max;
      //  canvasColor[ndx] = Math.floor(color[ndx] * 255);
      //}

      var c = g_colors[colorNdx];
      var color = new Float32Array([0,0,0,1]);
      var canvasColor = [];
      for (var ii = 0; ii < 3; ++ii) {
        color[ii] = c[ii];
        canvasColor[ii] = Math.floor(c[ii] * 255);
      }

      return {
          style: style,
          glColor: color,
          canvasColor: "rgb(" + canvasColor.join(",") + ")"
      };
    },

    setShipSize: function(size) {
      g_shipSize = size;
    },

    drawShip: function(ctx, x, y, direction, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(direction);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, g_shipSize);
      ctx.lineTo(g_shipSize, -g_shipSize);
      ctx.lineTo(0, -g_shipSize * 2 / 3);
      ctx.lineTo(-g_shipSize, -g_shipSize);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },

    drawOutlineShip: function(ctx, x, y, direction, color) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(direction);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, g_shipSize);
      ctx.lineTo(g_shipSize, -g_shipSize);
      ctx.lineTo(0, -g_shipSize * 2 / 3);
      ctx.lineTo(-g_shipSize, -g_shipSize);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    },

    drawTwoToneShip: function(ctx, x, y, direction, color, opt_darkColor) {
      if (!opt_darkColor) {
        opt_darkColor = g_darkColors[color];
        if (!opt_darkColor) {
          var m = color.match(/rgb\((\d+),(\d+),(\d+)\)/)
          opt_darkColor = "rgb(" +
              Math.floor(parseInt(m[1]) / 2) + "," +
              Math.floor(parseInt(m[2]) / 2) + "," +
              Math.floor(parseInt(m[3]) / 2) + ")";
          g_darkColors[color] = opt_darkColor;
        }
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(direction);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, g_shipSize);
      ctx.lineTo(g_shipSize, -g_shipSize);
      ctx.lineTo(0, -g_shipSize * 2 / 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = opt_darkColor;
      ctx.beginPath();
      ctx.moveTo(0, g_shipSize);
      ctx.lineTo(0, -g_shipSize * 2 / 3);
      ctx.lineTo(-g_shipSize, -g_shipSize);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

}());


