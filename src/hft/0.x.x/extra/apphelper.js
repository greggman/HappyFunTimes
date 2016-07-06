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
 * THEORY OF2 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

(function() {
  var Cookie = function(name) {
    this.get = function() {
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
  };

  // window.addEventListener('error', function(e) {
  //   console.error(e);
  //   console.error(e.stack);
  // });

  var cordovaCookie = new Cookie("cordova");
  var restartCookie = new Cookie("restart");
  var cordovaUrl = cordovaCookie.get();
  var timeAtPause;
  var timeAllowedOutOfApp = 5;

  function getTimeInSeconds() {
    return Date.now() * 0.001;
  }

  function onPause() {
    timeAtPause = getTimeInSeconds();
    console.log("paused at: " + timeAtPause);
  }

  function onResume() {
    var timeSincePause = getTimeInSeconds() - timeAtPause;
    console.log("time since pause: " + timeSincePause);
    if (timeSincePause > timeAllowedOutOfApp) {
      // It's been more the 5 seconds since we exited the app
      // ask to reconnect? Or just go back to hft.net?
      console.log("goto: " + restartCookie.get());
      window.location.href = restartCookie.get() || "http://happyfuntimes.net";
    }
  }

  function copyScript(src) {
    var dst = document.createElement("script");
    var srcAttribs = src.attributes;
    for (var ii = 0; ii < srcAttribs.length; ++ii) {
      var attrib = srcAttribs[ii];
      if (attrib.specified) {
        dst.setAttribute(attrib.name, attrib.value);
      }
    }
    dst.text = src.text;
    return dst;
  }

  function loadAfter() {
    window.removeEventListener('load', loadAfter);
    window.addEventListener('pause', onPause);
    window.addEventListener('resume', onResume);
    var scripts = document.getElementsByTagName("script");
    var scriptsToLoad = [];
    Array.prototype.forEach.call(scripts, function(script) {
      if (script.type === "hft-late") {
        scriptsToLoad.push(script);
      }
    });

    function loadNextScript() {
      if (scriptsToLoad.length) {
        var script = scriptsToLoad.shift();
        var s = copyScript(script);
        s.type = "text/javascript";
        s.charset = "utf-8";
        s.async = true;
        s.addEventListener('load', loadNextScript);
        document.body.appendChild(s);
      }
    }
    loadNextScript();
  }

  function cordovaLoaded() {
    // wait for cordova to finish loading
    window.hftSettings = {};
    window.hftSettings.isApp = true;
    document.addEventListener('deviceready', loadAfter);
  }

  if (cordovaUrl) {
    var s = document.createElement("script");
    var baseUrl = cordovaUrl;
    if (baseUrl.substr(-5) === ".html") {
      var lastSlash = baseUrl.lastIndexOf("/");
      baseUrl = baseUrl.substring(0, lastSlash);
    }
    if (baseUrl.substr(-1) === "/") {
      baseUrl = baseUrl.substr(0, baseUrl.length - 1);
    }
    var url = baseUrl + "/cordova.js";
    s.addEventListener('load', cordovaLoaded);
    s.addEventListener('error', function() {
      console.error("failed to load cordova from:" + url);
      loadAfter();
    });
    s.src = url;

    // Insert above us?
    var scripts = document.getElementsByTagName("script");
    for (var ii = 0; ii < scripts.length; ++ii) {
      var script = scripts[ii];
      if (script.src.indexOf("apphelper.js") >= 0) {
        console.log("loading script: " + url);
        script.parentNode.insertBefore(s, script);
        break;
      }
    }
  } else {
    window.addEventListener('load', loadAfter);
  }
}());
