function updatePosWithWrap(pos, dx, dy, width, height) {
  var x = pos[0] + dx;
  if (x < 0) {
    x = width - 1;
  } else if (x >= width) {
    x = 0;
  }

  var y = pos[1] + dy;
  if (y < 0) {
    y = height - 1;
  } else if (y >= height) {
    y = 0;
  }

  pos[0] = x;
  pos[1] = y;
}
function add2D(pos, dx, dy) {
  return [pos[0] + dx, pos[1] + dy];
}


