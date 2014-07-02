var fs = require('fs');
var path = require('path');
var Promise = require('promise');
var tmp = require('tmp');
var JSZip = require('jszip');

tmp.setGracefulCleanup();

var g_configPath = path.join(__dirname, "..", "config", "config.json");
var g_installedGamesListPath = path.join(__dirname, "..", "config", "installed-games.json");
var g_fakeGamePath = path.join(__dirname, '..', 'fakegame');
var g_testGameInstallDir = path.join(__dirname, '..', 'testgameinstalldir');

var execute = function(cmd, args, callback) {
  var spawn = require('child_process').spawn;

  var proc = spawn(cmd, args);
  var stdout = [];
  var stderr = [];

  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', function (data) {
      var str = data.toString()
      var lines = str.split(/(\r?\n)/g);
      stdout = stdout.concat(lines);
  });

  proc.stderr.setEncoding('utf8');
  proc.stderr.on('data', function (data) {
      var str = data.toString()
      var lines = str.split(/(\r?\n)/g);
      stderr = stderr.concat(lines);
  });

  proc.on('close', function (code) {
    var result = {stdout: stdout.join("\n"), stderr: stderr.join("\n")};
    if (parseInt(code) != 0) {
      callback("exit code " + code, result)
    } else {
      callback(null, result)
    }
  });
}

var hftcli = function(cmd, args, callback) {
   execute('node', [path.join(__dirname, "..", "..", "cli", "hft.js"), cmd, "--config=" + g_configPath].concat(args), function(err, result) {
     if (err != null) {
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

var getTempFilename = function(options) {
  return new Promise(function(fulfill, reject) {
    tmp.tmpName(options, function(err, filePath) {
      if (err) {
        reject(err);
      } else {
        fulfill(filePath);
      }
    });
  });
};

var getInstalledGames = function() {
  var content = fs.readFileSync(g_installedGamesListPath, {encoding: "utf-8"});
  return JSON.parse(content);
};

var assert = require("assert");
describe('games', function() {

  describe('list of installed games', function() {
    it('should not exist', function() {
      assert.ok(!fs.existsSync(g_installedGamesListPath));
    });

    it('should create empty list', function(done) {
      hftcli("init-game-list", [], function(err, result) {
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
        assert.equal(list[0].happyFunTimes.gameId, "fakegame");
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
      if(fs.existsSync(g_installedGamesListPath)) {
        fs.unlinkSync(g_installedGamesListPath);
      }
    });
  });
});

describe('release', function() {
  describe('making releases', function() {

    var destPath;
    var tempDir

    before(function(done) {
      getTempFilename({postfix: ".zip"}).then(function(filePath) {
        destPath = filePath;
        hftcli("init-game-list", [], function(err, result) {
          assert.equal(err, null);
          assert.ok(fs.existsSync(g_installedGamesListPath));
          assert.equal(getInstalledGames().length, 0);
          done();
        });
      });

    });

    it('should make a release', function(done) {
      hftcli('make-release', ["--src=" + g_fakeGamePath, destPath], function(err, result) {
        assert.equal(err, null);
        assert.ok(fs.existsSync(destPath));

        var zip = new JSZip();
        zip.load(fs.readFileSync(destPath));

        assert.ok(zip.files["fakegame/package.json"]);
        assert.ok(zip.files["fakegame/file1.html"]);
        assert.ok(zip.files["fakegame/somedir/file2.html"]);

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
        assert.ok(fs.existsSync(path.join(g_testGameInstallDir, "fakegame", "package.json")), "package.json exists");
        assert.ok(fs.existsSync(path.join(g_testGameInstallDir, "fakegame", "file1.html")), "file1.html exists");
        assert.ok(fs.existsSync(path.join(g_testGameInstallDir, "fakegame", "somedir", "file2.html")), "file2.html exists");

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
      if(fs.existsSync(g_installedGamesListPath)) {
        fs.unlinkSync(g_installedGamesListPath);
      }
    });
  });
});

