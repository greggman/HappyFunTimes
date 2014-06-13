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

define(
  [ ], function() {

  var RIGHT = 0x1;
  var LEFT = 0x2;
  var UP = 0x4;
  var DOWN = 0x8;

  var dirToBits = [
    0,
    RIGHT,
    UP | RIGHT,
    UP,
    UP | LEFT,
    LEFT,
    DOWN |LEFT,
    DOWN,
    DOWN |RIGHT,
  ];

  var drawCircle = function(ctx, x, y, radius, flags) {
    flags = flags || 1;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (flags & 1) {
      ctx.fill();
    }
    if (flags & 2) {
      ctx.stroke();
    }
  };

  // Renders a Dpad
  var DPad = function(options) {
    this.element = options.element;
    this.size = options.size;
    this.canvas = document.createElement("canvas");
    // We have to put this in the DOM before asking it's size.
    this.element.appendChild(this.canvas);
    this.resize();
    this.ctx = this.canvas.getContext("2d");
    this.drawBits(0);
  };

  DPad.prototype.getSize = function() {
    var size = this.size;
    if (!size) {
      size = Math.min(this.canvas.width, this.canvas.height);
    }
    return size;
  };

  DPad.prototype.drawBits = function(bits) {
    var size = this.getSize();
    var w6 = Math.floor(size / 6.5);
    var cx = Math.floor(size / 2);
    var cy = Math.floor(size / 2);
    var w = Math.floor(size / 2 * 0.8);
    var h = Math.floor(size / 2 * 0.8);
    var ctx = this.ctx;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "#AAA";
    ctx.stokeStyle = "#444";
    drawCircle(ctx, 0, 0, cx * 0.95, 3);

    ctx.fillStyle = "#888";
    ctx.fillRect(-w6, -h, w6 * 2, h * 2);
    ctx.fillRect(-w, -w6, w * 2, w6 * 2);

    ctx.fillStyle = "#CCC";

    var width =  w6 * 2;
    var height = w6 * 2;
    if (bits & 0x1) { drawCircle(ctx,  w - w6, 0, w6 * 0.8); } //ctx.fillRect(  w - w6 * 2, -w6         , w6 * 2, w6 * 2 ); }
    if (bits & 0x2) { drawCircle(ctx, -w + w6, 0, w6 * 0.8); } //ctx.fillRect( -w         , -w6         , w6 * 2, w6 * 2 ); }
    if (bits & 0x4) { drawCircle(ctx, 0, -w + w6, w6 * 0.8); } //ctx.fillRect( -w6        , -h          , w6 * 2, w6 * 2); }
    if (bits & 0x8) { drawCircle(ctx, 0,  w - w6, w6 * 0.8); } //ctx.fillRect( -w6        ,  h - w6 * 2 , w6 * 2, w6 * 2); }

    ctx.restore();
  };

  DPad.prototype.draw = function(dirInfo) {
    this.drawBits(dirInfo.bits);
  };

  DPad.prototype.resize = function() {
    var size = this.size;
    if (!size) {
      size = Math.min(this.canvas.clientWidth, this.canvas.clientHeight);
    }
    if (this.canvas.width != size ||
        this.canvas.height != size) {
      this.canvas.width = size;
      this.canvas.height = size;
    }
  };

  return DPad;
});



