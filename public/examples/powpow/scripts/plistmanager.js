"use strict";

/**
 * Manages a visible list of players for like the highscore or queue display.
 *
 */
function PListManager(element) {
  this.element_ = element;
  this.elements_ = [];
  this.shipImages_ = [];
  this.shipImageCursors_ = [];
  this.shipURLs_ = [];
  this.elementHeight_;

  var canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "#008";
  ctx.globalCompositeOperation = "copy";
  ctx.fillRect(0, 0, 32, 32);
  ships.drawShip(ctx, 16, 16, Math.PI, "rgba(0,0,0,0)");
  this.shipURLs_.push(canvas.toDataURL());
  ctx.fillRect(0, 0, 32, 32);
  ships.drawOutlineShip(ctx, 16, 16, Math.PI, "rgba(0,0,0,0)");
  this.shipURLs_.push(canvas.toDataURL());
  ctx.fillRect(0, 0, 32, 32);
  ships.drawTwoToneShip(
      ctx, 16, 16, Math.PI, "rgba(0,0,0,0)", "rgba(0,0,0,0.5)");
  this.shipURLs_.push(canvas.toDataURL());
}

/**
 * Call before updating the list
 */
PListManager.prototype.begin = function() {
  this.cursor_ = 0;
  this.shipImageCursors_ = [0, 0, 0];
  this.maxHeight_ = this.element_.clientHeight;
  this.height_ = 0;
};

/**
 * Call after updating the list
 */
PListManager.prototype.end = function() {
  for (var ii = this.cursor_; ii < this.elements_.length; ++ii) {
    var element = this.elements_[ii];
    element.line.style.display = "none";
  }
};

PListManager.prototype.getElement_ = function(index) {
  var element = this.elements_[index];
  if (!element) {
    var line = document.createElement("div");
    line.style.position = "relative";
    line.style.height = "40px";
    line.style.display = "block";
    //line.style.verticalAlign = "middle";
    var span = document.createElement("div");
    span.style.width = "32px";
    span.style.height = "32px";
    span.style.position = "absolute";
    span.style.top = "0px";
    span.style.left = "0px";
    var img = document.createElement("span");
    img.style.zIndex = 5;
    img.style.position = "absolute";
    img.style.top = "0px";
    img.style.left = "0px";
    var info = document.createElement("div");
    info.style.position = "absolute";
    info.style.top = "4px";
    info.style.left = "40px";
    info.style.color = "white";
    info.style.fontFamily = "sans-serif";
    info.style.fontSize = "20px";
    var name = document.createElement("span");
    var msg = document.createElement("span");
    info.appendChild(msg);
    info.appendChild(name);
    line.appendChild(span);
    line.appendChild(img);
    line.appendChild(info);
    this.element_.appendChild(line);
    var element = {
      line: line,
      span: span,
      img: img,
      msg: msg,
      name: name
    };
    if (!this.elementHeight_) {
      this.elementHeight_ = line.clientHeight;
    }
    this.elements_.push(element);
  }
  return element;
};

PListManager.prototype.getShipImg_ = function(style) {
  var images = this.shipImages_[style];
  if (!images) {
    images = [];
    this.shipImages_[style] = images;
  }
  var img = images[this.shipImageCursors_[style]++];
  if (!img) {
    img = document.createElement("img");
    img.src = this.shipURLs_[style];
    images.push(img);
  }
  return img;
};

PListManager.prototype.setElement = function(player, launching, msg) {
  this.height_ += (this.elementHeight_ || 0);
  if (this.height_ <= this.maxHeight_) {
    var img = this.getShipImg_(player.color.style);
    var element = this.getElement_(this.cursor_++);
    var child = element.img.firstChild;
    if (child) {
      element.img.removeChild(child);
    }
    element.img.appendChild(img);
    element.line.style.display = "block";
    element.msg.innerHTML = msg;
    element.name.innerHTML = player.playerName;
    element.span.style.backgroundColor = player.color.canvasColor;
    if (launching) {
      element.name.color = "#f00";
    } else {
      element.name.color = "#ff0";
    }
  }
};


