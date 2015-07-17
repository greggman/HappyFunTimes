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
(function(window) {

define([], function() {

  if (window === undefined) {
    window = {};
  }
  window.hftSettings = window.hftSettings || {};
  var error = console.error.bind(console);

  function setErrorFunc(fn) {
    error = fn;
  }

  var numRE = /\d+/;
  function toNumber(str) {
    try {
      return parseInt(numRE.exec(str));
    } catch (e) {
      return 0;
    }
  }
  function addVersion(prev, curr) {
    return prev * 10000 + toNumber(curr);
  }
  function semverToNumber(version) {
    return version.split(".").reduce(addVersion, 0);
  }

  var apiVersion = semverToNumber(window.hftSettings.apiVersion || "0.0.0");

  function reportError(version) {
    error("trying to use feature of API version " + version + " but package.json apiVersion is set to " + window.hftSettings.apiVersion + "\nPlease update your package.json.");
  }

  /**
   * check if we have a version
   * @param {string} version A semver version to test for
   * @return {boolean} true if current API version is >= version.
   */
  function haveVersion(version) {
    if (semverToNumber(version) > apiVersion) {
      return false;
    }
    return true;
  }

  /**
   * check if we have a version and fail if we don't
   * @param {string} version A semver version to test for
   * @return {boolean} true if current API version is >= version.
   */
  function requireVersion(version) {
    if (!haveVersion(version)) {
      reportError(version);
      return false;
    }
    return true;
  }

  /**
   * Version a function.
   * @param {string} version semver version required for func
   * @param {function} func function to version
   * @return {function} returns func if current API version >= version otherwise returns a no-op func that reports an error.
   */
  function versionedFunc(version, func) {
    if (semverToNumber(version) > apiVersion) {
      return function() {
        reportError(version);
      };
    }
    return func;
  }

  /**
   * Given an object of functions, if any have { version: "some.ver.sion", func: someFunc }
   * calls versionedFunc on them.
   *
   * Example:
   *
   *    someAPI = versionedFuncs({
   *       openFile: openFile,
   *       readFile: readFile,
   *       parseFile: { version: "0.1.2", func: parseFile, },
   *       closeFile: closeFile,
   *    });
   *
   * If the current API version is not 0.1.2 or greater `parseFile` will point to a no-op func
   * that prints an error.
   */
  function versionFuncs(src) {
    var dst = {};
    Object.keys(src).forEach(function(key) {
      var value = src[key];
      if (typeof value !== "function") {
        value = versionedFunc(value.version, value.func);
      }
      dst[key] = value;
    });
    return dst;
  }

  window.hftSettings.haveVersion = haveVersion;
  window.hftSettings.reportError = reportError;
  window.hftSettings.requireVersion = requireVersion;
  window.hftSettings.setErrorFunc = setErrorFunc;
  window.hftSettings.versionedFunc = versionedFunc;
  window.hftSettings.versionFuncs = versionFuncs;

  return window.hftSettings;
});
}(this));

