"use strict";

/**
 * Processes and Draws all the entities.
 * An entity is currently losely defined as any object that has
 * a process and a draw function.
 */
function EntitySystem() {
  this.entities_ = {};
  this.numEntities_ = 0;
  this.nextId_ = 1;
  this.removeEntities_ = [];
}

EntitySystem.prototype.addEntity = function(entity) {
  var id = this.nextId_++;
  entity.id = id;
  this.entities_[id] = entity;
  ++this.numEntities_;
};

EntitySystem.prototype.deleteEntity = function(entity) {
  this.deleteEntityById(entity.id);
};

EntitySystem.prototype.deleteEntityById = function(id) {
  this.removeEntities_.push(id);
};

EntitySystem.prototype.processEntities = function(elapsedTime) {
  for (var id in this.entities_) {
    this.entities_[id].process(elapsedTime);
  }
  while (this.removeEntities_.length) {
    delete this.entities_[this.removeEntities_.pop()];
    --this.numEntities_;
  }
};


