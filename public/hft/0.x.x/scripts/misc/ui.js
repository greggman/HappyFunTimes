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
  var addTextNode = function(element, txt) {
    var node = document.createTextNode(txt);
    element.appendChild(node);
    return node;
  };

  var elemNum = 1;

  var addRange = function(parent, label, obj, id, min, max, opt_fn) {
    if (!(id instanceof Array)) {
      id = [id];
    }
    var elemId = "range" + (++elemNum);
    var labelElem = document.createElement("label");
    labelElem.for = elemId;
    var node = addTextNode(labelElem, label);
    parent.appendChild(labelElem);
    labelElem.style.display = "block";

    var input = document.createElement("input");
    input.type = "range";
    input.id = elemId;
    input.value = Math.floor((obj[id[0]] - min) * 100 / (max - min));

    parent.appendChild(input);

    var updateNode = function(value) {
      node.nodeValue = label + ": " + value.toFixed(3);
    };

    input.addEventListener('input', function(e) {
      var v = parseFloat(input.value);
      var value = v * (max - min) / 100 + min;
      for (var ii = 0; ii < id.length; ++ii) {
        obj[id[ii]] = value;
      }
      updateNode(value);
      if (opt_fn) {
        opt_fn(value);
      }
    }, false);

    updateNode(obj[id[0]]);
  };

  //addRange(div, "x", this.tileDrawOptions, "x", 0, 300);
  //addRange(div, "y", this.tileDrawOptions, "y", 0, 300);
  //addRange(div, "width", this.tileDrawOptions, "width", 0, this.canvas.width);
  //addRange(div, "height", this.tileDrawOptions, "height", 0, this.canvas.height);
  //addRange(div, "scale", this.tileDrawOptions, ["scaleX", "scaleY"], 0.1, 40);
  //addRange(div, "rotation", this.tileDrawOptions, "rotation", -Math.PI, Math.PI);
  //addRange(div, "originX", this.tileDrawOptions, "originX", 0, this.canvas.width);
  //addRange(div, "originY", this.tileDrawOptions, "originY", 0, this.canvas.height);
  //parent.appendChild(div);

  return {
    addRange: addRange,
  };
});
