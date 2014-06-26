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

var Zip = require('adm-zip');
var fs = require('fs');
var gameInfo = require('../server/gameinfo');

var ReleaseManager = function() {

  // Remove this if Zip adds the filter.
  var addLocalFolder = (function() {
    var Utils = require('../node_modules/adm-zip/util/utils.js');
    return function(zip, /*String*/localPath, /*String*/zipPath, /*RegExp|Function*/filter) {
      if (filter === undefined) {
        filter = function() { return true; };
      } else if (filter instanceof RegExp) {
        filter = function(filter) {
          return function(filename) {
            return filter.test(filename);
          }
        }(filter);
      }

      if(zipPath){
          zipPath=zipPath.split("\\").join("/");
          if(zipPath.charAt(zipPath.length - 1) != "/"){
              zipPath += "/";
          }
      }else{
          zipPath="";
      }
      localPath = localPath.split("\\").join("/"); //windows fix
      if (localPath.charAt(localPath.length - 1) != "/")
          localPath += "/";

      if (fs.existsSync(localPath)) {

          var items = Utils.findFiles(localPath);
          if (items.length) {
              items.forEach(function(path) {
                  var p = path.split("\\").join("/").replace(localPath, ""); //windows fix
                  if (filter(p)) {
                      if (p.charAt(p.length - 1) !== "/") {
                          zip.addFile(zipPath+p, fs.readFileSync(path), "", 0)
                      } else {
                          zip.addFile(zipPath+p, new Buffer(0), "", 0)
                      }
                  }
              });
          }
      } else {
          throw Utils.Errors.FILE_NOT_FOUND.replace("%s", localPath);
      }
    };
  }());


  /**
   * Make a release.
   *
   * I'm not sure this belongs here but since installing a release
   * belongs here then it seems prudent to keep the 2 together
   * since they need to match.
   */
  var makeRelease = function(gamePath, destPath) {
    // Make sure it's a game!
    var info = gameInfo.readGameInfo(gamePath);
    if (!info) {
      return false;
    }

    switch (info.happyFunTimes.gameType) {
      case 'html':
        break;
      default:
        console.error("unsupported gametype: " + info.happyFunTimes.gameType)
        break;
    }

    try {
      var zip = new Zip();
      addLocalFolder(zip, gamePath, "", /^(?!\.)/);
      zip.writeZip(destPath);
    } catch (e) {
      console.error("ERROR: " + e + " making " + gamePath + " in " + destPath);
      return false;
    }
  };

  var installRelease = function(releasePath, destPath) {
  };

  this.installRelease = installRelease.bind(this);
  this.makeRelease = makeRelease.bind(this);
};

module.exports = new ReleaseManager();

