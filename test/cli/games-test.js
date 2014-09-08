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

var fs      = require('fs');
var path    = require('path');
var JSZip   = require('jszip');
var strings = require('../../lib/strings');
var utils   = require('../../lib/utils');

var g_configPath             = path.join(__dirname, "..", "testconfig", "config.json");
var g_installedGamesListPath = path.join(__dirname, "..", "testconfig", "installed-games.json");
var g_fakeGamePath           = path.join(__dirname, '..', 'fakegame');
var g_fakeGame2Path          = path.join(__dirname, '..', 'fakegame2');
var g_fakeUnityGamePath      = path.join(__dirname, '..', 'fakeunitygame');
var g_testGameInstallDir     = path.join(__dirname, '..', 'testgameinstalldir');

var hftcli = function(cmd, args, callback) {
   var cmdArgs = [
     path.join(__dirname, "..", "..", "cli", "hft.js"),
     cmd,
     "--config-path=" + g_configPath,
   ].concat(args);
   utils.execute('node', cmdArgs, function(err, result) {
     if (err != null) {
       console.log("cmd: " + cmd + " " + args.join(" "));
       console.log("stdout:" + result.stdout);
       console.log("stderr:" + result.stderr);
     }
     callback(err, result);
   });
};

var hftcliP = function(cmd, args) {
  return new Promise(function(fullfil, reject) {
    hftcli(cmd, args, function(err, result) {
      if (err != null) {
        reject(err);
      } else {
        fullfil(result);
      }
    });
  });
};

var getInstalledGames = function() {
  var content = fs.readFileSync(g_installedGamesListPath, {encoding: "utf-8"});
  return JSON.parse(content);
};

var assert = require("assert");
describe('hft-cli', function() {
  this.timeout(6000);
describe('init', function() {

  before(function() {
    g_configPath             = path.join(__dirname, "..", "testareaconfig", "config.json");
    g_installedGamesListPath = path.join(__dirname, "..", "testareaconfig", "installed-games.json");
  });

  it('config files should should not exist', function() {
    assert.ok(!fs.existsSync(g_installedGamesListPath));
    assert.ok(!fs.existsSync(g_configPath));
    assert.ok(!fs.existsSync(path.dirname(g_configPath)));
  });

  it('should create empty list', function(done) {
    hftcli("init", [], function(err, result) {
      assert.equal(err, null);
      assert.ok(fs.existsSync(g_installedGamesListPath));
      assert.ok(fs.existsSync(g_configPath));
      assert.equal(getInstalledGames().length, 0);
      done();
    });
  });

  after(function() {
    utils.deleteNoFail(g_installedGamesListPath);
    utils.deleteNoFail(g_configPath);
    utils.deleteNoFail(path.dirname(g_configPath));
  })
});

describe('games', function() {

  before(function() {
    g_configPath = path.join(__dirname, "..", "testconfig", "config.json");
    g_installedGamesListPath = path.join(__dirname, "..", "testconfig", "installed-games.json");
  });

  describe('list of installed games', function() {
    it('should not exist', function() {
      assert.ok(!fs.existsSync(g_installedGamesListPath));
    });

    it('should create empty list', function(done) {
      hftcli("init", [], function(err, result) {
        assert.equal(err, null);
        assert.ok(fs.existsSync(g_installedGamesListPath));
        assert.equal(getInstalledGames().length, 0);
        done();
      });
    });

    it('should list 0 game with empty list', function(done) {
      hftcli("list", ["--full"], function(err, result) {
        var list = JSON.parse(result.stdout);
        assert.equal(list.length, 0);
        done();
      });
    });

    it('should add game', function(done) {
      hftcli("add", [g_fakeGamePath], function(err, result) {
        assert.equal(err, null);
        assert.equal(getInstalledGames().length, 1);
        done();
      });
    });

    it('should list 1 game', function(done) {
      hftcli("list", ["--full"], function(err, result) {
        var list = JSON.parse(result.stdout);
        assert.equal(list.length, 1);
        assert.equal(list[0].originalGameId, "fakegame");
        done();
      });
    });

    it('should remove game', function(done) {
      hftcli("remove", [g_fakeGamePath], function(err, result) {
        assert.equal(err, null);
        assert.equal(getInstalledGames().length, 0);
        done();
      });
    });

    it('should list 0 game after removal', function(done) {
      hftcli("list", ["--full"], function(err, result) {
        assert.equal(err, null);
        var list = JSON.parse(result.stdout);
        assert.equal(list.length, 0);
        done();
      });
    });

    after(function() {
      utils.deleteNoFail(g_installedGamesListPath);
    });
  });
});

describe('release html', function() {

  before(function() {
    g_configPath = path.join(__dirname, "..", "testconfig", "config.json");
    g_installedGamesListPath = path.join(__dirname, "..", "testconfig", "installed-games.json");
  });

  describe('making releases', function() {

    var destPath;
    var destPath2;
    var tempDir;
    var tempDir2;
    var expectedFileNames = [
      "fakegame/package.json",
      "fakegame/file1.html",
      "fakegame/somedir/file2.html",
      "fakegame/game.html",
      "fakegame/css/game.css",
      "fakegame/scripts/game.js",
      "fakegame/controller.html",
      "fakegame/css/controller.css",
      "fakegame/scripts/controller.js",
      "fakegame/icon.png",
      "fakegame/screenshot.png",
    ];

    before(function(done) {
      utils.getTempFolder().then(function(filePath) {
        tempDir = filePath;
        return utils.getTempFolder();
      }).then(function(filePath) {
        tempDir2 = filePath;
        hftcli("init", [], function(err, result) {
          assert.equal(err, null);
          assert.ok(fs.existsSync(g_installedGamesListPath));
          assert.equal(getInstalledGames().length, 0);
          done();
        });
      });
    });

    it('should make a release', function(done) {
      hftcli('make-release', ["--src=" + g_fakeGamePath, tempDir, "--json"], function(err, result) {
        assert.equal(err, null);

        var files = JSON.parse(result.stdout);
        assert.equal(files.length, 1);
        destPath = files[0].filename;
        assert.ok(fs.existsSync(destPath));

        var zip = new JSZip();
        zip.load(fs.readFileSync(destPath));

        expectedFileNames.forEach(function(fileName) {
          assert.ok(zip.files[fileName], fileName + " should be in zip");
        });

        assert.ok(zip.files["fakegame/.adotfile"] === undefined, ".adotfile is not in .zip file");

        done();
      });
    });

    it('should install release', function(done) {

      try {
        fs.mkdirSync(g_testGameInstallDir);
      } catch (e) {
      }

      hftcli('install', [destPath, "--verbose"], function(err, result) {
        assert.equal(err, null);

        assert.ok(fs.existsSync(path.join(g_testGameInstallDir, "fakegame")), "fakegame folder exists");
        expectedFileNames.forEach(function(fileName) {
          assert.ok(fs.existsSync(path.join(g_testGameInstallDir, fileName)), fileName + " should exist");
        });

        var gameList = getInstalledGames();
        assert.equal(gameList.length, 1);

        done();
      });
    });

    it('should make a release 2', function(done) {
      hftcli('make-release', ["--src=" + g_fakeGame2Path, tempDir2, "--json"], function(err, result) {
        assert.equal(err, null);

        var files = JSON.parse(result.stdout);
        assert.equal(files.length, 1);
        destPath2 = files[0].filename;
        assert.ok(fs.existsSync(destPath2));

        var zip = new JSZip();
        zip.load(fs.readFileSync(destPath2));

        expectedFileNames.forEach(function(fileName) {
          assert.ok(zip.files[fileName], fileName + " should be in zip");
        });

        assert.ok(zip.files["fakegame/.adotfile"] === undefined, ".adotfile is not in .zip file");

        done();
      });
    });

    it('should upgrade release', function(done) {

      hftcli('install', [destPath2, "--upgrade", "--verbose"], function(err, result) {
        assert.equal(err, null);

        assert.ok(fs.existsSync(path.join(g_testGameInstallDir, "fakegame")), "fakegame folder exists");
        expectedFileNames.concat(["fakegame/notinfakegame.txt"]).forEach(function(fileName) {
          assert.ok(fs.existsSync(path.join(g_testGameInstallDir, fileName)), fileName + " should exist");
        });

        var gameList = getInstalledGames();
        assert.equal(gameList.length, 1);

        done();
      });
    });

    it('should uninstall game', function(done) {
      hftcli('uninstall', ["fakegame"], function(err, result) {
        assert.equal(err, null);
        assert.ok(!fs.existsSync(path.join(g_testGameInstallDir, "fakegame")));

        var gameList = getInstalledGames();
        assert.equal(gameList.length, 0);

        done();
      });
    });

    after(function() {
      utils.deleteNoFail(g_installedGamesListPath);
      utils.deleteNoFail(destPath);
    });
  });
});

describe('release unity3d', function() {

  before(function() {
    g_configPath = path.join(__dirname, "..", "testconfig", "config.json");
    g_installedGamesListPath = path.join(__dirname, "..", "testconfig", "installed-games.json");
  });

  describe('making releases', function() {

    var destPaths = [];
    var tempDir;
    var expectedFileNames = [
      "fakeunitygame/package.json",
      "fakeunitygame/file1.html",
      "fakeunitygame/somedir/file2.html",
      "fakeunitygame/game.html",
      "fakeunitygame/css/game.css",
      "fakeunitygame/scripts/game.js",
      "fakeunitygame/controller.html",
      "fakeunitygame/css/controller.css",
      "fakeunitygame/scripts/controller.js",
      "fakeunitygame/icon.png",
      "fakeunitygame/screenshot.png",
    ];

    var unexpectedFileNames = [
      "fakeunitygame/.adotfile",
      "fakeunitygame/src/test.txt",
    ];

    var platformFiles = {
      "-osx.zip": {
        expected: [
          "fakeunitygame/bin/fakeunitygame-osx.app/test.txt",
        ],
      },
      "-win.zip": {
        expected: [
          "fakeunitygame/bin/fakeunitygame-win.exe",
          "fakeunitygame/bin/fakeunitygame-win_Data/test.txt",
        ],
      },
      "-linux.zip": {
        expected: [
          "fakeunitygame/bin/fakeunitygame-linux.x86",
          "fakeunitygame/bin/fakeunitygame-linux_Data/test.txt",
        ],
      }
    };


    before(function(done) {
      utils.getTempFolder().then(function(filePath) {
        tempDir = filePath;
        hftcli("init", [], function(err, result) {
          assert.equal(err, null);
          assert.ok(fs.existsSync(g_installedGamesListPath));
          assert.equal(getInstalledGames().length, 0);
          done();
        });
      });
    });

    it('should make a release', function(done) {
      hftcli('make-release', ["--src=" + g_fakeUnityGamePath, tempDir, "--json"], function(err, result) {
        assert.equal(err, null);

        var files = JSON.parse(result.stdout);
        assert.equal(files.length, 3);
        files.forEach(function(files) {
          var destPath = files.filename;
          destPaths.push(destPath);
          assert.ok(fs.existsSync(destPath));

          var zip = new JSZip();
          zip.load(fs.readFileSync(destPath));

          var expected;
          var unexpected = [];
          Object.keys(platformFiles).forEach(function(suffix) {
            var platInfo = platformFiles[suffix];
            if (strings.endsWith(destPath, suffix)) {
              expected = platInfo.expected;
            } else {
              unexpected = unexpected.concat.apply(unexpected, platInfo.expected);
            }
          });

          var expected = expectedFileNames.concat.apply(expectedFileNames, expected);
          expected.forEach(function(fileName) {
            assert.ok(zip.files[fileName], fileName + " should be in zip " + destPath);
          });

          var unexpected = unexpectedFileNames.concat.apply(unexpectedFileNames, unexpected);
          unexpected.forEach(function(fileName) {
            assert.ok(zip.files[fileName] === undefined, fileName + " should not be in zip " + destPath);
          });
        });

        done();
      });
    });

//    it('should install release', function(done) {
//
//      try {
//        fs.mkdirSync(g_testGameInstallDir);
//      } catch (e) {
//      }
//
//      hftcli('install', [destPath, "--verbose"], function(err, result) {
//        assert.equal(err, null);
//
//        assert.ok(fs.existsSync(path.join(g_testGameInstallDir, "fakeunitygame")), "fakeunitygame folder exists");
//        expectedFileNames.forEach(function(fileName) {
//          assert.ok(fs.existsSync(path.join(g_testGameInstallDir, fileName)), fileName + " should exist");
//        });
//
//        var gameList = getInstalledGames();
//        assert.equal(gameList.length, 1);
//
//        done();
//      });
//    });

//    it('should uninstall game', function(done) {
//      hftcli('uninstall', ["fakeunitygame"], function(err, result) {
//        assert.equal(err, null);
//        assert.ok(!fs.existsSync(path.join(g_testGameInstallDir, "fakeunitygame")));
//
//        var gameList = getInstalledGames();
//        assert.equal(gameList.length, 0);
//
//        done();
//      });
//    });

    after(function() {
      utils.deleteNoFail(g_installedGamesListPath);
      destPaths.forEach(function(destPath) {
        utils.deleteNoFail(destPath);
      });
    });
  });
});
});

