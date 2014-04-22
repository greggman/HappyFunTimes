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

define(["./PListManager"], function(PListManager) {
  /**
   * Manages the Queue of players waiting.
   */
  function QueueManager(services, element) {
    this.services = services;
    this.launching_ = [];
    this.queue_ = [];
    this.timer_ = 0;

    this.plist = new PListManager(element);

  //  this.rowHeight_ = 40;
  //  this.canvas_ = $("queue-canvas");
  //  this.ctx_ = this.canvas_.getContext("2d");
  //  this.resize();
  };

  //QueueManager.prototype.resize = function() {
  //  Misc.resize(this.canvas);
  //};
  //
  //QueueManager.prototype.draw = function() {
  //  this.resize();
  //  var ctx = this.ctx_;
  //  var canvas = this.canvas_;
  //  var height = this.canvas_.height;
  //  ctx.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
  //  // draw launching players
  //  var y = 0;
  //  var count = 0;
  //  for (var ii = 0; y < height && ii < this.launching_.length; ++ii) {
  //    var player = this.launching_[ii];
  //    this.drawPlayer(player, y, count, true);
  //    y += this.rowHeight_;
  //    ++count;
  //  }
  //  // draw queued players.
  //  for (var ii = 0; y < height && ii < this.queue_.length; ++ii) {
  //    var player = this.queue_[ii];
  //    this.drawPlayer(player, y, count, false);
  //    y += this.rowHeight_;
  //    ++count;
  //  }
  //};
  //
  //QueueManager.prototype.drawPlayer = function(player, y, count, launching) {
  //  var ctx = this.ctx_;
  //  var canvas = this.canvas_;
  //  var width = this.canvas_.width;
  //  ctx.fillStyle = count % 2 ? "#006" : "#00A";
  //  var color = player.color.canvasColor;
  //  if (launching) {
  //    var cl = Math.floor(player.timer * 16);
  //    switch (cl % 4) {
  //    case 0:
  //      color = "#f00";
  //      break;
  //    case 2:
  //      color = "#ff0";
  //    }
  //  }
  //  ctx.fillRect(0, 0, width, this.rowHeight_);
  //  drawShip(
  //      ctx,
  //      this.rowHeight_ / 2,
  //      y + this.rowHeight_ / 2,
  //      player.direction,
  //      color);
  //};

  QueueManager.prototype.draw = function() {
    this.plist.begin();
    this.setElements_(0, this.launching_, true);
    this.setElements_(this.launching_.length, this.queue_, false);
    this.plist.end();
  };

  QueueManager.prototype.setElements_ = function(index, players, launching) {
    for (var ii = 0; ii < players.length; ++ii) {
      this.plist.setElement(players[ii], launching, "");
    }
  };

  QueueManager.prototype.sendPlaceInQueue = function(player) {
    if (player.showPlaceInQueue) {
      player.sendCmd('queue', {
        count: player.placeInQueue
      });
    }
  };

  QueueManager.prototype.sendPlaces = function() {
    for (var ii = 0; ii < this.queue_.length; ++ii) {
      var player = this.queue_[ii];
      player.placeInQueue = ii;
      this.sendPlaceInQueue(player);
    }
  };

  QueueManager.prototype.addToQueue = function(player) {
    player.placeInQueue = this.queue_.length;
    this.queue_.push(player);
    this.draw();
  };

  QueueManager.prototype.removeFromQueue = function(player) {
    var index = this.queue_.indexOf(player);
    if (index >= 0) {
      this.queue_.splice(index, 1);
      this.draw();
      this.sendPlaces();
      return;
    }
    var index = this.launching_.indexOf(player);
    if (index >= 0) {
      this.launching_.splice(index, 1);
      this.draw();
      return;
    }
  };

  QueueManager.prototype.process = function() {
    var globals = this.services.globals;
    if (this.timer_ > 0) {
      this.timer_ -= globals.elapsedTime;
    } else {
      if (this.queue_.length > 0 &&
          this.services.playerManager.getNumActivePlayers() + this.launching_.length < this.services.globals.maxActivePlayers) {
        var player = this.queue_.shift()
        player.countdown();
        this.launching_.push(player);
        this.timer_ = 1;  // don't start another for at least 1 second.
        this.draw();
      }
    }
  };

  return QueueManager;
});

