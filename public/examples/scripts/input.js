"use strict";

define({
  getRelativeCoordinates: (function(window, undefined) {
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

    return function(reference, event) {
      // Use absolute coordinates
      var pos = getAbsolutePosition(reference);
      var x = event.pageX - pos.x;
      var y = event.pageY - pos.y;
      return { x: x, y: y };
    };
  }()),
});

