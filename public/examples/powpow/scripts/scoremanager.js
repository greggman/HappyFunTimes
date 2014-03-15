"use strict";

/**
 * Manages the high score list.
 */

function ScoreManager(services, element) {
  this.services = services;
  this.plist_ = new PListManager(element);
  this.maxScores_ = 10;
  this.orderedPlayers_ = [];
  this.zeros_ = "";
}

ScoreManager.prototype.calculateScores = function() {
  this.orderedPlayers_ = [];
  var maxScore = 0;
  for (var ii = 0; ii < g_players.length; ++ii) {
    var player = g_players[ii];
    this.orderedPlayers_.push(player);
    maxScore = Math.max(maxScore, player.score);
  }

  this.orderedPlayers_.sort(function(a, b) {
    if (a.score > b.score)
      return -1;
    else if (a.score < b.score)
      return 1;
    else if (a.id < b.id)
      return -1;
    else
      return 1;
  });

  if (this.orderedPlayers_.length > this.maxScores_)
    this.orderedPlayers_.length = this.maxScores_;

  var numDigits = maxScore.toString().length;
  if (numDigits < this.zeros_.length) {
    this.zeros_ = this.zeros_.substr(0, numDigits);
  } else {
    while (this.zeros_.length < numDigits) {
      this.zeros_ += "0";
    }
  }
};

ScoreManager.prototype.drawScores = function() {
  this.plist_.begin();

  for (var ii = 0; ii < this.orderedPlayers_.length; ++ii) {
    var player = this.orderedPlayers_[ii];
    var score = player.score.toString();
    if (score.length < this.zeros_.length) {
      score = score + this.zeros_.substr(score.length);
    }
    this.plist_.setElement(player, false, score + ": ");
  }
  this.plist_.end();
};

ScoreManager.prototype.update = function() {
  this.calculateScores();
  this.drawScores();
};

ScoreManager.prototype.draw = function(renderer) {
  if (this.orderedPlayers_.length > 1 &&
      this.orderedPlayers_[0].score > this.orderedPlayers_[1].score) {
    var lead = this.orderedPlayers_[0];
    if (lead.state == 'fly') {
      renderer.drawLeadMark(
          lead.position, lead.direction,
          {glColor: new Float32Array([1,0,0,1]), canvasColor:"rgb(255,0,0)"});
    }
  }
};


