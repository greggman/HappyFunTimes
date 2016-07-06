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

/*eslint strict:0*/

define(function() {

  /**
   * Represents a cookie.
   *
   * This is an object, that way you set the name just once so
   * calling set or get you don't have to worry about getting the
   * name wrong.
   *
   * @example
   *     var fooCookie = new Cookie("foo");
   *     var value = fooCookie.get();
   *     fooCookie.set(newValue);
   *     fooCookie.erase();
   *
   * @constructor
   * @alias Cookie
   * @param {string} name of cookie
   * @param {string?} opt_path path for cookie. Default "/"
   */
  var Cookie = function(name, opt_path) {
    var path = opt_path || "/";

    /**
     * Sets the cookie
     * @param {string} value value for cookie
     * @param {number?} opt_days number of days until cookie
     *        expires. Default = none
     */
    this.set = function(value, opt_days) {
      if (value === undefined) {
        this.erase();
        return;
      }
      // Cordova/Phonegap doesn't support cookies so use localStorage?
      if (window.hftSettings && window.hftSettings.inApp) {
        window.localStorage.setItem(name, value);
        return;
      }
      var expires = "";
      opt_days = opt_days || 9999;
      var date = new Date();
      date.setTime(Date.now() + Math.floor(opt_days * 24 * 60 * 60 * 1000));  // > 32bits. Don't use | 0
      expires = "; expires=" + date.toGMTString();
      var cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=" + path;
      document.cookie = cookie;
    };

    /**
     * Gets the value of the cookie
     * @return {string?} value of cookie
     */
    this.get = function() {
      // Cordova/Phonegap doesn't support cookies so use localStorage?
      if (window.hftSettings && window.hftSettings.inApp) {
        return window.localStorage.getItem(name);
      }

      var nameEQ = encodeURIComponent(name) + "=";
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; ++i) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
          return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
      }
    };

    /**
     * Erases the cookie.
     */
    this.erase = function() {
      if (window.hftSettings && window.hftSettings.inApp) {
        return window.localStorage.removeItem(name);
      }
      document.cookie = this.set(" ", -1);
    };
  };

  return Cookie;
});


