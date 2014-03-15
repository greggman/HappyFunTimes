"use strict";

/**
 * A shot.
 * @constructor
 */
function Shot(services, x, y, direction, owner) {
  this.services = services;
  this.owner = owner;
  this.position = [x, y];
  this.vel = this.services.globals.shotVelocity;
  this.duration = owner.shotDuration;
  this.direction = direction;
  this.drawCount = 0;

  this.matrix = new Float32Array([1,0,0,0,1,0,0,0,1]);
  this.uniforms = {
    matrix: this.matrix
  };

  this.services.entitySystem.addEntity(this);
}

Shot.prototype.remove = function() {
  this.owner.removeShot(this);
};

Shot.prototype.process = function(elapsedTime) {
  this.duration -= elapsedTime;
  if (this.duration <= 0) {
    this.remove();
  } else {
    var dx = -Math.sin(this.direction) * this.vel * elapsedTime;
    var dy =  Math.cos(this.direction) * this.vel * elapsedTime;
	updatePosWithWrap(this.position, dx, dy, this.services.globals.width, this.services.globals.height);

    var hit = false;
    for (var ii = 0; ii < g_activePlayers.length; ++ii) {
      var player = g_activePlayers[ii];
      if (player.id != this.owner.id) {
        if (player.collide(this.position[0], this.position[1], 3)) {
          hit = true;
          if (player.die(this.owner, this, false)) {
            ++this.owner.score;
          }
        }
      }
    }
    if (hit) {
      this.remove();
    }
  }
};

Shot.prototype.draw = function(renderer) {
  renderer.drawShot(this.position, ++this.drawCount);
};


