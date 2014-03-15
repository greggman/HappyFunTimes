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


