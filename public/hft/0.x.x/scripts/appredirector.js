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

define([
  'hft/misc/cookies',
  'hft/misc/dialog',
  'hft/misc/misc',
  'hft/misc/mobilehacks',
  'hft/runtime/live-settings',
], function(
   Cookie,
   dialog,
   misc,
   mobilehacks,
   liveSettings) {
  var args = misc.parseUrlQuery();

  /**
   * @typedef {Object} CheckAppOptions
   * @property {string} [href] Where the app should go once launched. If not specified it will go to the current page.
   * @property {function} [inApp] Function to call if we're in the app
   * @property {function} [notInApp] function to call if we're not in the app
   * @property {boolean} [setCookies] false = don't set up. Defaults to true
   */
  function checkForApp(options) {
    var cordovaCookie = new Cookie("cordova");
    var restartCookie = new Cookie("restart");
    var switchedOutOfPage = false;

    function restart() {
      console.log("restart");
      dialog.modal({
        title: "HappyFunTimes",
        msg: "Touch to Restart",
      }, function() {
        window.location.href = window.location.origin + window.location.pathname;
      });
    }

    function onBlurFocus() {
      //console.log("event: ", e.type);
      switchedOutOfPage = true;
    }

    function checkWasApp() {
      console.log("switched:", switchedOutOfPage);
      if (switchedOutOfPage) {
        restart();
      } else {
        console.log("not in app");
        options.notInApp();
      }
    }

    if (options.setCookies !== false) {
      cordovaCookie.erase();
    }
    if (args.cordovaurl) {
      // We're in the app
      if (options.setCookies !== false) {
        cordovaCookie.set(args.cordovaurl);
        restartCookie.set(args.restarturl);
      }
      console.log("in app");
      options.inApp();
    } else {
      // We're NOT in the app

      // Track if we lost the focus. That's kind of proof we went
      // to the app.
      window.addEventListener('blur', onBlurFocus);
      window.addEventListener('focus', onBlurFocus);

      if (mobilehacks.isMobile()) {
        if (args.checkedForApp) {
          console.log("already checked for app");
          options.notInApp();
          return;
        }

        if (!liveSettings.system.checkForApp) {
          console.log("don't check for app");
          options.notInApp();
          return;
        }

        // give ourselves a moment to switch to the app
        setTimeout(checkWasApp, 3000);

        // Try to go to the app
        misc.gotoIFrame("happyfuntimes://start" + misc.objectToSearchString({
          goto: options.href || window.location.href,
        }));
      } else {
        console.log("not mobile so not in app");
        options.notInApp();
      }
    }
  }

  function getUrlArgs() {
   return misc.objectToSearchString({
     cordovaurl: args.cordovaurl,
     restarturl: args.restarturl,
     checkedForApp: true,
   });
  }

  return {
    checkForApp: checkForApp,
    getUrlArgs: getUrlArgs,
  };

});
