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
  var NullLogger = function() {
  };

  NullLogger.prototype.log = function() {
  };

  NullLogger.prototype.error = function() {
  };

  var ConsoleLogger = function() {
  };

  ConsoleLogger.prototype.log = function() {
    console.log.apply(console, arguments);
  };

  ConsoleLogger.prototype.error = function() {
    console.error.apply(console, arguments);
  };

  var HTMLLogger = function(element, opt_maxLines) {
    this.container = element;
    this.maxLines = opt_maxLines || 10;
    this.lines = [];
  };

  HTMLLogger.prototype.addLine_ = function(msg, color) {
    var line;
    var text;
    if (this.lines.length < this.maxLines) {
      line = document.createElement("div");
      text = document.createTextNode("");
      line.appendChild(text);
    } else {
      line = this.lines.shift();
      line.parentNode.removeChild(line);
      text = line.firstChild;
    }

    this.lines.push(line);
    text.nodeValue = msg;
    line.style.color = color;
    this.container.appendChild(line);
  };

  // FIX! or move to strings.js
  var argsToString = function(args) {
    var lastArgWasNumber = false;
    var numArgs = args.length;
    var strs = [];
    for (var ii = 0; ii < numArgs; ++ii) {
      var arg = args[ii];
      if (arg === undefined) {
        strs.push('undefined');
      } else if (typeof arg == 'number') {
        if (lastArgWasNumber) {
          strs.push(", ");
        }
        if (arg == Math.floor(arg)) {
          strs.push(arg.toFixed(0));
        } else {
        strs.push(arg.toFixed(3));
        }
        lastArgWasNumber = true;
      } else if (window.Float32Array && arg instanceof Float32Array) {
        // TODO(gman): Make this handle other types of arrays.
        strs.push(tdl.string.argsToString(arg));
      } else {
        strs.push(arg.toString());
        lastArgWasNumber = false;
      }
    }
    return strs.join("");
  };

  HTMLLogger.prototype.log = function() {
    this.addLine_(argsToString(arguments), undefined);
  };

  HTMLLogger.prototype.error = function() {
    this.addLine_(argsToString(arguments), "red");
  };

  return {
    NullLogger: NullLogger,
    ConsoleLogger: ConsoleLogger,
    HTMLLogger: HTMLLogger,
  };
});


