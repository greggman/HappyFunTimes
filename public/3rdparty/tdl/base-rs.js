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

// emulate tdl/base.js for require.js

define(function() {

// Was base.js already included?
var haveBaseJS = (this.tdl !== undefined);
if (haveBaseJS) {
  tdl.provide('tdl.base-rs');
  return;
}

this.tdl = {base:{}};
this.goog = {};

var noop = function() {};

// Let's assume if the user is using require JS they don't need tdl.require
// If that's not the case we'd need provide a version of tdl.require that
// ignores the tdl files but not the user's files. Probably hooked into requirejs
tdl.require = noop;
tdl.provide = noop;


/**
 * Determine whether a value is an array. Do not use instanceof because that
 * will not work for V8 arrays (the browser thinks they are Objects).
 * @param {*} value A value.
 * @return {boolean} Whether the value is an array.
 */
tdl.base.isArray = function(value) {
  var valueAsObject = /** @type {!Object} */ (value);
  return typeof(value) === 'object' && value !== null &&
      'length' in valueAsObject && 'splice' in valueAsObject;
};

/**
 * A stub for later optionally converting obfuscated names
 * @private
 * @param {string} name Name to un-obfuscate.
 * @return {string} un-obfuscated name.
 */
tdl.base.maybeDeobfuscateFunctionName_ = function(name) {
  return name;
};

/**
 * Makes one class inherit from another.
 * @param {!Object} subClass Class that wants to inherit.
 * @param {!Object} superClass Class to inherit from.
 */
tdl.base.inherit = function(subClass, superClass) {
  /**
   * TmpClass.
   * @ignore
   * @constructor
   */
  var TmpClass = function() { };
  TmpClass.prototype = superClass.prototype;
  subClass.prototype = new TmpClass();
};

/**
 * Parses an error stack from an exception
 * @param {!Exception} excp The exception to get a stack trace from.
 * @return {!Array.<string>} An array of strings of the stack trace.
 */
tdl.base.parseErrorStack = function(excp) {
  var stack = [];
  var name;
  var line;

  if (!excp || !excp.stack) {
    return stack;
  }

  var stacklist = excp.stack.split('\n');

  for (var i = 0; i < stacklist.length - 1; i++) {
    var framedata = stacklist[i];

    name = framedata.match(/^([a-zA-Z0-9_$]*)/)[1];
    if (name) {
      name = tdl.base.maybeDeobfuscateFunctionName_(name);
    } else {
      name = 'anonymous';
    }

    var result = framedata.match(/(.*:[0-9]+)$/);
    line = result && result[1];

    if (!line) {
      line = '(unknown)';
    }

    stack[stack.length] = name + ' : ' + line
  }

  // remove top level anonymous functions to match IE
  var omitRegexp = /^anonymous :/;
  while (stack.length && omitRegexp.exec(stack[stack.length - 1])) {
    stack.length = stack.length - 1;
  }

  return stack;
};

/**
 * Gets a function name from a function object.
 * @param {!function(...): *} aFunction The function object to try to get a
 *      name from.
 * @return {string} function name or 'anonymous' if not found.
 */
tdl.base.getFunctionName = function(aFunction) {
  var regexpResult = aFunction.toString().match(/function(\s*)(\w*)/);
  if (regexpResult && regexpResult.length >= 2 && regexpResult[2]) {
    return tdl.base.maybeDeobfuscateFunctionName_(regexpResult[2]);
  }
  return 'anonymous';
};

/**
 * Pretty prints an exception's stack, if it has one.
 * @param {Array.<string>} stack An array of errors.
 * @return {string} The pretty stack.
 */
tdl.base.formatErrorStack = function(stack) {
  var result = '';
  for (var i = 0; i < stack.length; i++) {
    result += '> ' + stack[i] + '\n';
  }
  return result;
};

/**
 * Gets a stack trace as a string.
 * @param {number} stripCount The number of entries to strip from the top of the
 *     stack. Example: Pass in 1 to remove yourself from the stack trace.
 * @return {string} The stack trace.
 */
tdl.base.getStackTrace = function(stripCount) {
  var result = '';

  if (typeof(arguments.caller) != 'undefined') { // IE, not ECMA
    for (var a = arguments.caller; a != null; a = a.caller) {
      result += '> ' + tdl.base.getFunctionName(a.callee) + '\n';
      if (a.caller == a) {
        result += '*';
        break;
      }
    }
  } else { // Mozilla, not ECMA
    // fake an exception so we can get Mozilla's error stack
    var testExcp;
    try {
      eval('var var;');
    } catch (testExcp) {
      var stack = tdl.base.parseErrorStack(testExcp);
      result += tdl.base.formatErrorStack(stack.slice(3 + stripCount,
                                                        stack.length));
    }
  }

  return result;
};

/**
 * Returns true if the user's browser is Microsoft IE.
 * @return {boolean} true if the user's browser is Microsoft IE.
 */
tdl.base.IsMSIE = function() {
  var ua = navigator.userAgent.toLowerCase();
  var msie = /msie/.test(ua) && !/opera/.test(ua);
  return msie;
};

return {};
});
