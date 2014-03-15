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


