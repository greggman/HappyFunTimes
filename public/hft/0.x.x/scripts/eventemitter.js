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

define([], function() {

  /**
   * This is similar to node's EventEmitter.
   * The major difference is calling `addEventListner`
   * or `removeEventListener` with `null` or `undefined`
   * will remove all listeners for that event.
   */
  var EventEmitter = function() {
    var events = {};
    var maxListeners = 10;

    var setMaxListeners = function(max) {
      maxListeners = max;
    };

    var addEventListener = function(name, handler) {
      if (!handler) {
        delete events[name];
        return;
      }

      var handlers = events[name];
      if (!handlers) {
        handlers = [];
        events[name] = handlers;
      }
      handlers.push(handler);
      if (handlers.length > maxListeners) {
        console.warn("More than " + maxListeners + " added to event " + name);
      }
    };

    var removeEventListener = function(name, handler) {
      if (!handler) {
        delete events[name];
        return;
      }

      var handlers = events[name];
      if (handlers) {
        var ndx = handlers.indexOf(handler);
        if (ndx >= 0) {
          handlers.splice(ndx, 1);
        }
      }
    };

    var removeAllEventListeners = function() {
      events = {};
    };

    var emit = function(name) {
      var handlers = events[name];
      if (handlers) {
        var args = Array.prototype.slice.call(arguments, 1);
        handlers.forEach(function(handler) {
          handler.apply(this, args);
        });
      }
    };

    var listeners = function(name) {
      return events[name];
    };

    this.on = addEventListener;
    this.addEventListener = addEventListener
    this.removeEventListener = removeEventListener
    this.removeAllEventListeners = removeAllEventListeners;
    this.addListener = addEventListener
    this.removeListener = removeEventListener
    this.removeAllListeners = removeAllEventListeners;
    this.emit = emit;
    this.listeners = listeners;
    this.setMaxListeners = setMaxListeners;
  };

  return EventEmitter;
});

