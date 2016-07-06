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
  /**
   * Processes all the entities. An entity is currently losely
   * defined as any object that has a process function. You can
   * change the function called by passing in the name of the
   * function.
   */
  function EntitySystem(opt_functionName) {
    this.functionName = opt_functionName || 'process';
    this.entities_ = [];
    this.removeEntities_ = [];
  }

  EntitySystem.prototype.addEntity = function(entity) {
    this.entities_.push(entity);
  };

  EntitySystem.prototype.removeEntity = function(entity) {
    this.removeEntities_.push(entity);
  };

  EntitySystem.prototype.forEachEntity = function(fn) {
    for (var ii = 0; ii < this.entities_.length; ++ii) {
      if (fn(this.entities_[ii], ii)) {
        break;
      }
    }
    this.removeEntitiesMarkedForRemoval();
  };

  EntitySystem.prototype.removeEntitiesMarkedForRemoval = function() {
    while (this.removeEntities_.length) {
      var index = this.entities_.indexOf(this.removeEntities_.pop());
      this.entities_.splice(index, 1);
    }
  };

  // This seems kind of silly as you can just call forEachEntity
  // though I'm not sure what's better.
  EntitySystem.prototype.processEntities = function() {
    for (var ii = 0; ii < this.entities_.length; ++ii) {
      var entity = this.entities_[ii];
      entity[this.functionName].apply(entity, arguments);
    }
    this.removeEntitiesMarkedForRemoval();
  };

  return EntitySystem;
});



