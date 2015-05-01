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

var fs           = require('fs');
var Promise      = require('promise');
var strings      = require('./strings');
var utils        = require('./utils');

var execP = Promise.denodeify(utils.execute);

function checkInstalledLinux(pkg) {
  return execP("dpkg", ["-s", pkg]).then(function() {
    return Promise.resolve();
  }).catch(function() {
    var msg = "missing package: " + pkg + ". Please install it";
    return Promise.reject(msg);
  });
}

module.exports = (function() {
  var p = process.platform.toLowerCase();
  if (strings.startsWith(p, "win")) {
    return {
      id: "win",
      exeSuffix: "-win.exe",
      exporterPath: (function() {
        var exes = [
          "C:\\Program Files (x86)\\Unity\\Editor\\Unity.exe",
          "C:\\Program Files\\Unity\\Editor\\Unity.exe",
        ];
        for (var ii = 0; ii < exes.length; ++ii) {
          var exe = exes[ii];
          if (fs.existsSync(exe)) {
            return exe;
          }
        }
      }()),
      checkForPrerequisites: function() {
        return Promise.resolve();
      },
    };
  } else if (p === 'darwin') {
    return {
      id: "mac",
      exeSuffix: "-osx.app",
      exePath: "bin/%(gameId)s-osx.app/Contents/MacOS/%(gameId)s-osx",
      launcher: "open",
      exporterPath: "/Applications/Unity/Unity.app/Contents/MacOS/Unity",
      checkForPrerequisites: function() {
        return Promise.resolve();
      },
    };
  } else {
    return {
      id: "linux",
      exePath: "bin/%(gameId)s-linux.x86",
      exeSuffix: "-linux.x86",
      checkForPrerequisites: function() {
        return checkInstalledLinux("zenity")
            .then(function() {
               return checkInstalledLinux("wmctrl");
            });
      },
    };
  }
}());


