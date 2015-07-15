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

'use strict';

var AppleCaptivePortalHandler = require('./apple-captive-portal-handler');
var AvailableGames            = require('./available-games');
var Cache                     = require('inmemfilecache');
var computerName              = require('../lib/computername');
var config                    = require('../lib/config');
var debug                     = require('debug')('hft-server');
var ES6Support                = require('./es6-support');
var events                    = require('events');
var express                   = require('express');
var fs                        = require('fs');
var GameFiles                 = require('./gamefiles');
var HFTGame                   = require('./hftgame');
var hftSite                   = require('./hftsite');
var highResClock              = require('../lib/highresclock');
var http                      = require('http');
var iputils                   = require('../lib/iputils');
var mime                      = require('mime');
var NonRequire                = require('./non-require');
var RCompile                  = require('./r-compile');
var path                      = require('path');
var strings                   = require('../lib/strings');
var url                       = require('url');

mime.define({'application/javascript': ['js6']});

/**
 * @typedef {Object} HFTServer~Options
 * @property {number} [port] port to listen on. Default 18679
 * @property {number[]} [extraPorts] other ports to listen on.
 *           Default [80, 8080]
 * @property {string} [hftDomain] Domain to inform our internal
 *           ip address. Default: "happyfuntimes.net"
 * @property {string} [baseDir] path to server files from
 * @property {string} address ip address to bind to.
 * @property {boolean} [privateServer] true = don't inform
 *           rendezvous server
 * @property {RelayServer} [relayServer] relay server to use. (for testing)
 * @property {HttpServer} [httpServer] http server to use. (for testing)
 * @property {GameDB} [gameDB] GameDB to use (for testing)
 * @property {string} [systemName] name to use if mulitiple
 *           happyFunTimes servers are running on the same
 *           network.
 * @property {boolean} [menu] whether or not to show the system menu (the gear icon).
 * @property {boolean} [kiosk] Go directly to game. The normal flow is
 *    to go to enter-name.html -> index.html (players wait here for a game
 *    to start). Then they go to the game. Setting `kiosk` to true makes
 *    them go directly to the game, skipping index.html. See `askName`.
 * @property {boolean} [askName] Ask for name. The default is true. Set this
 *    to false to go directly to directly to index.html or the game (see `kiosk`).
 * @property {boolean} [allowMinify] whether or not -minify scripts minify.
 * @property {number} [inactivityTimeout] time to disconnect users if no activity.
 * @property {boolean} [checkForApp] default = true. Whether or not to try to launch
 *    the native mobile app. This currently takes 3 seconds.
 */

/**
 * HappyFunTimes Server
 *
 * @param {HFTServer~Options} options
 * @param {function(err): void} startedCallback called with err
 *        of error, undefined if successful.
 */
var HFTServer = function(options, startedCallback) {
  var g = {
    port: config.getSettings().settings.port,
    extraPorts: [80, 8080],
    screenshotCount: 0,
    baseDir: 'public',
    cwd: process.cwd(),
  };
  var relayServer;
  var appleCaptivePortalHandler;

  Object.keys(options).forEach(function(prop) {
    g[prop] = options[prop];
  });

  var getBaseUrl;
  var updateIpAddresses = function(addresses) {
    if (relayServer) {
      relayServer.setOptions({baseUrl: getBaseUrl()});
    }
    hftSite.setup({addresses: addresses});
    hftSite.inform();
    if (appleCaptivePortalHandler) {
      appleCaptivePortalHandler.setOptions({address: addresses[0]});
    }
  };

  var getAddress = (function() {
    var oldAddressesAsStr;

    return function() {
      var addresses = g.address ? [g.address] : iputils.getIpAddresses();
      if (addresses.length === 0) {
        addresses = ['127.0.0.1'];
      }
      var addressesAsStr = addresses.join(',');
      if (addressesAsStr !== oldAddressesAsStr) {
        oldAddressesAsStr = addressesAsStr;
        console.log('using ip address: ' + addresses[0] + (addresses.length > 1 ? '. use --address=<ip> to pick one' : ''));
        updateIpAddresses(addresses);
      }
      return addresses[0];
    };
  }());

  var ipIntervalId = setInterval(getAddress, 15 * 1000);

  getBaseUrl = function() {
    return 'http://' + getAddress() + ':' + g.port;
  };

  g.gameDB = g.gameDB || new AvailableGames();

  var eventEmitter = new events.EventEmitter();
  var gameFiles = new GameFiles();
  var nonRequire = new NonRequire({fileSystem: gameFiles.fileSystem});
  var es6Support = new ES6Support({fileSystem: nonRequire.fileSystem});
  var fileCache = new Cache({fileSystem: es6Support.fileSystem});
//  var fileCache = new Cache({fileSystem: nonRequire.fileSystem});
//  var fileCache = new Cache();

  var rCompile = new RCompile({fileSystem: fileCache, optimize: "uglify2"});
  //var rCompile = new RCompile({fileSystem: fileCache, optimize: "none"});

  var app = express();

  hftSite.setup({
    address: getAddress(),
    port: g.port,
    privateServer: g.privateServer,
  });

  g.cwd = path.normalize(path.join(__dirname, '..'));

  var send404 = function(res, msg) {
    msg = msg || '';
    res.writeHead(404);
    res.write('404<br/>' + res.url + "<br/>" + msg);
    res.end();
  };

  var bodyParser = function(req, res, next) {
    var query = { };
    var content = [];

    req.addListener('data', function(chunk) {
      content.push(chunk);
    });

    req.addListener('end', function() {
      try {
        query = JSON.parse(content.join(""));
      } catch (e) {
        query = {};
      }
      req.body = query;
      next();
    });
  };

  //function saveScreenshotFromDataURL(dataURL) {
  //  var EXPECTED_HEADER = 'data:image/png;base64,';
  //  if (strings.startsWith(dataURL, EXPECTED_HEADER)) {
  //    var filename = 'screenshot-' + (g.screenshotCount++) + '.png';
  //    fs.writeFile(
  //        filename,
  //        dataURL.substr(
  //            EXPECTED_HEADER.length,
  //            dataURL.length - EXPECTED_HEADER.length),
  //        'base64');
  //    console.log('Saved Screenshot: ' + filename + '\n');
  //  }
  //}

  var handleTimeRequest = function(query, res) {
    res.json({ time: highResClock.getTime() });
  };

  // var handleScreenshotRequest = function(query, res) {
  //   saveScreenshotFromDataURL(query.dataURL);
  //   sendJSONResponse(res, { ok: true });
  // };

  var handleListRunningGamesRequest = function(query, res) {
    if (!relayServer) {
      send404(res);
      return;
    }
    var games = relayServer.getGames();
    res.json(games);
  };

  var handleListAvailableGamesRequest = function(query, res) {
    res.json(g.gameDB.getGames());
  };

  var handleHappyFunTimesPingRequest = function(query, res) {
    var games = relayServer.getGames();
    var game = (games.length > 0) ? (': ' + games[0].runtimeInfo.originalGameId) : '';
    res.set({'Access-Control-Allow-Origin': '*'}).json({
      version: '0.0.0',
      id: 'HappyFunTimes',
      serverName: (options.systemName || computerName.get()) + game,
    });
  };

  var handleOPTIONS = function(req, res) {
    res.removeHeader('Content-Type');
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept',
      'Access-Control-Allow-Credentials': false,
      'Access-Control-Max-Age': 86400,
    });
    res.end('{}');
  };

  var isFolder = (function() {
    // Keep a cache of all paths because fs.statSync is sync
    // this should never be that big because we're only serving
    // a few files and are not online.... hopefully.
    var fileDB = { };
    return function(filepath) {
      var dir = fileDB[filepath];
      if (dir === undefined) {
        var stats;
        try {
          stats = fs.statSync(filepath);
          dir = stats.isDirectory();
        } catch (e) {
          dir = false;
        }
        fileDB[path] = dir;
      }
      return dir;
    };
  }());

  var sendStringResponse = function(res, data, opt_mimeType) {
    res.writeHead(200, {
      'Content-Type': opt_mimeType || 'text/html',
      'Content-Length': data.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate', // HTTP 1.1.
      'Pragma':        'no-cache',                            // HTTP 1.0.
      'Expires':       '0',                                   // Proxies.
    });
    res.write(data);
    res.end();
  };

  var getRequestIpAddress = function(req) {
    var ip = req.headers['x-forwarded-for'];
    if (!ip && req.connection) {
      ip = req.connection.remoteAddress;
    }
    if (!ip && req.socket) {
      ip = req.socket.remoteAddress;
    }
    if (!ip && req.connection && req.connection.socket) {
      ip = req.connection.socket.remoteAddress;
    }
    if (ip && ip.indexOf(',')) {
      ip = ip.split(',')[0];
    }
    return ip;
  };

  var sendFileResponse = function(req, res, fullPath, opt_prepFn, runtimeInfo) {
    debug('path: ' + fullPath);
    var mimeType = mime.lookup(fullPath);
    if (mimeType) {
      // This is scary. If there's any async between here and
      // the actual read we could get the wrong enable.
      es6Support.enable(runtimeInfo ? runtimeInfo.features.es6 : true);
      fileCache.readFile(fullPath, function(err, data){
        if (err) {
          console.error('' + err + ': ' + fullPath);
          console.error('ip: ' + getRequestIpAddress(req));
          console.error(JSON.stringify(req.headers, undefined, '  '));
          return send404(res);
        }
        if (opt_prepFn) {
          data = opt_prepFn(data.toString());
        }
        if (strings.startsWith(mimeType, 'text')) {
          res.writeHead(200, {
            'Content-Type':  mimeType + '; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate', // HTTP 1.1.
            'Pragma':        'no-cache',                            // HTTP 1.0.
            'Expires':       '0',                                   // Proxies.
          });
          res.write(data, 'utf8');
          res.end();
        } else {
          sendStringResponse(res, data, mimeType);
        }
      });
    } else {
      send404(res);
    }
  };

  appleCaptivePortalHandler = new AppleCaptivePortalHandler({
    baseDir: path.join(g.cwd, g.baseDir),
    address: getAddress(),
    port: g.port,
    sendFileFn: sendFileResponse,
  });

  if (!options.askName) {
    appleCaptivePortalHandler.setFirstPath('/index.html');
  }

  // Blargs! What a mess. This needs to be cleaned up
  var sendRequestedFileFullPath = function(req, res, fullPath, runtimeInfo, reqOptions) {
    reqOptions = reqOptions || {};
    var parsedUrl = url.parse(req.url);
    var filePath = parsedUrl.pathname;
    debug("sendRequestedFileFullPath:", filePath);
    var isTemplate = (runtimeInfo && runtimeInfo.templateUrls[filePath]) || reqOptions.params;
    var isQuery = parsedUrl.query !== null;
    var isAnchor = parsedUrl.hash !== null;
    if (runtimeInfo && runtimeInfo.features.es6 && es6Support.isES6(fullPath)) {
      var mapFile = parsedUrl.pathname + '.map';
      res.setHeader('X-SourceMap', mapFile);
    }
    if (!isQuery && !isAnchor) {
      // Add '/' if it's a folder.
      if (!strings.endsWith(filePath, '/') && isFolder(fullPath)) {
        filePath += '/';
        res.writeHead(302, {
          'Location': filePath,
        });
        res.end();
        return;
      }
      // Add index.html if ends with '/'
      if (strings.endsWith(fullPath, '/') || strings.endsWith(fullPath, '\\')) {
        fullPath += 'index.html';
      }
    }
    var prepFn = isTemplate ? (function() {
      var params = [
        { localhost: getAddress(), },
      ];
      if (runtimeInfo) {
        params.push(runtimeInfo);
      }
      if (reqOptions.params) {
        if (reqOptions.params.length) {
          params = params.concat(reqOptions.params);
        } else {
          params.push(reqOptions.params);
        }
      }
      return function(str) {
        return strings.replaceParams(str, params);
      };
    }()) : undefined;
    sendFileResponse(req, res, fullPath, prepFn, runtimeInfo);
  };

  var gamePrefix = "/games/";
  var gamePrefixLength = gamePrefix.length + 1;  //  + the slash after the id
  var pathToGamePath = function(gameId, runtimeInfo, filePath) {
    return path.normalize(path.join(runtimeInfo.htmlPath, filePath.substr(gamePrefixLength + gameId.length)));
  };

  // Send a file from a game.
  var sendGameRequestedFile = function(req, res) {
    var gameId = req.params[0];
    var runtimeInfo = g.gameDB.getGameById(gameId);
    if (!runtimeInfo || !runtimeInfo.htmlPath) {
      return send404(res, 'unknown gameId: ' + gameId);
    }
    var parsedUrl = url.parse(req.url);
    var filePath = parsedUrl.pathname;
    var fullPath = pathToGamePath(gameId, runtimeInfo, filePath);
    sendRequestedFileFullPath(req, res, fullPath, runtimeInfo);
  };

  var sendRequestedFile = function(req, res, reqOptions) {
    var parsedUrl = url.parse(req.url);
    var filePath = parsedUrl.pathname;
    var fullPath = path.normalize(path.join(g.cwd, g.baseDir, filePath));
    sendRequestedFileFullPath(req, res, fullPath, undefined, reqOptions);
  };

  // Send a file from the HFT system
  var sendSystemRequestedFile = function(req, res) {
    if (appleCaptivePortalHandler.check(req, res)) {
      return;
    }
    sendRequestedFile(req, res);
  };

  // Send Templated File
  var sendTemplatedFile = function(req, res) {
    sendRequestedFile(req, res, {
      params: {
        'enterNameScript': (options.askName ? 'scripts/enter-name.js' : 'scripts/go-to-index.js'),
      },
    });
  };

  var addTemplateInsertedPath = function(theApp, pathRegex, templateName, contentPath) {
    theApp.get(pathRegex, function(req, res) {
      var gameId = req.params[0];
      var runtimeInfo = g.gameDB.getGameById(gameId);
      if (!runtimeInfo) {
        var msg = [
          'url:' + req.url,
          'unknown gameId: ' + gameId,
          'have you run `hft add` for the game in ' + path.dirname(contentPath),
        ].join('\n');
        console.error(msg);
        return send404(res, msg);
      }

      if (!runtimeInfo.useTemplate[templateName]) {
        return sendGameRequestedFile(req, res);
      }

      var templatePath = runtimeInfo.versionSettings.templates[templateName];
      templatePath = path.normalize(path.join(g.cwd, templatePath));

      var contentFullPath = path.normalize(path.join(runtimeInfo.htmlPath, contentPath));

      fileCache.readFile(templatePath, function(err, templateData) {
        if (err) {
          console.error('' + err + ': ' + templatePath);
          return send404(res);
        }
        sendFileResponse(req, res, contentFullPath, function(str) {
          debug("doing substitutions for:", contentPath);
          var result = strings.replaceParams(templateData.toString(), [
            runtimeInfo,
            {
              content: str,
              hftSettings: 'window.hftSettings = ' + JSON.stringify({
                menu: g.menu,
                apiVersion: runtimeInfo.info.happyFunTimes.apiVersion,
                instructions: g.instructions,
                langs: g.langs,
                wifiName: g.wifiName,
                wifiPass: g.wifiPass,
              }),
            },
          ]);
          return result;
        });
      });
    });
  };

  var minifyControllerJS = function() {
    var gameIndexRE = /\/games\/(.*?)\/index.html$/;
    return function(req, res, next) {
      var referer = req.get("Referer");
      var match = gameIndexRE.exec(referer);
      if (!match) {
        return next();
      }
      var gameId = match[1];
      var runtimeInfo = g.gameDB.getGameById(gameId);
      if (!runtimeInfo) {
        return next();
      }
      var controllerPath = runtimeInfo.htmlPath + "/scripts/controller.js";
      rCompile.compile(controllerPath, function(err, content) {
        if (err) {
          console.warn(err);
          return next();
        }
        sendStringResponse(res, content, "application/json");
      });
    };
  }();

  app.get(/^\/hft\/0.x.x\/scripts\/runtime\/live-settings\.js$/, function(req, res) {
    var data = {
      system: {
        checkForApp: options.checkForApp,
      },
    };
    var src = "define([], function() { return " + JSON.stringify(data) + "; })\n";
    sendStringResponse(res, src, "application/javascript");
  });
  addTemplateInsertedPath(app, /^\/games\/(.*?)\/index.html$/, 'controller', 'controller.html');
  addTemplateInsertedPath(app, /^\/games\/(.*?)\/gameview.html$/, 'game', 'game.html');
  app.get(/^\/games\/(.*?)\/runtime-scripts\/traceur-runtime.js$/, function(req, res) {
    //var gameId = req.params[0];
    var fullPath = path.join(__dirname, '..', 'node_modules', 'traceur', 'bin', 'traceur-runtime.js');
    sendRequestedFileFullPath(req, res, fullPath);
  });
  var nonPath = path.join(__dirname, '..', 'templates', '0.x.x', 'non-require-v1.3.0.js');
  nonRequire.addPath(nonPath);
  app.get(/^\/games\/(.*?)\/runtime-scripts\/hft-min.js$/, function(req, res) {
    //var gameId = req.params[0];
    sendRequestedFileFullPath(req, res, nonPath);
  });

  if (options.optimizeController) {
    app.get(/^\/3rdparty\/require\.js$/, minifyControllerJS);
  }

  if (options.allowMinify) {
    app.get(/^\/games\/(.*?)\/scripts\/(.*?)-minify\.js$/, function(req, res) {
      var gamePrefixLength = 8;  // '/games/' + the slash after the id
      var gameId = req.params[0];
      var runtimeInfo = g.gameDB.getGameById(gameId);
      if (!runtimeInfo || !runtimeInfo.htmlPath) {
        return send404(res, 'unknown gameId: ' + gameId);
      }
      var parsedUrl = url.parse(req.url);
      var filePath = parsedUrl.pathname;
      var fullPath = path.normalize(path.join(runtimeInfo.htmlPath, filePath.substr(gamePrefixLength + gameId.length)));
      nonRequire.addPath(fullPath);
      sendGameRequestedFile(req, res);
    });
  }

  app.get(/^\/games\/(.*?)\//, sendGameRequestedFile);
  app.get(/^\/enter-name.html/, sendTemplatedFile);
  app.get(/.*/, sendSystemRequestedFile);
  app.post(/.*/, bodyParser);

  var postCmdHandlers = {
    time: handleTimeRequest,
    //screenshot: handleScreenshotRequest,
    listRunningGames: handleListRunningGamesRequest,
    listAvailableGames: handleListAvailableGamesRequest,
    happyFunTimesPing: handleHappyFunTimesPingRequest,
  };
  app.post(/.*/, function(req, res){
    if (!req.body.cmd){
      return send404(res);
    }
    var handler = postCmdHandlers[req.body.cmd];
    if (!handler){
      return send404(res);
    }
    handler(req.body, res);
  });

  app.options(/.*/, handleOPTIONS);

  var ports = [g.port];
  g.extraPorts.forEach(function(p) {
    if (g.port.toString() !== p) {
      ports.push(p);
    }
  });

  var numResponsesNeeded = ports.length;
  var servers = [];
  var goodPorts = [];

  var tryStartRelayServer = function() {
    --numResponsesNeeded;
    if (numResponsesNeeded < 0) {
      throw 'numReponsese is negative';
    }
    if (numResponsesNeeded === 0) {
      if (goodPorts.length === 0) {
        startedCallback(new Error('NO PORTS available. Tried port(s) ' + ports.join(', ')));
        return;
      }
      var RelayServer = require('./relayserver.js');
      relayServer = options.relayServer || new RelayServer(servers, {
        baseUrl: getBaseUrl(),
        noMessageTimout: options.inactivityTimeout,
        gameDB: g.gameDB,
        hftServer: this,
      });
      console.log('Listening on port(s): ' + goodPorts.join(', ') + '\n');
      eventEmitter.emit('ports', goodPorts);

      // Add management game
      var hftGame = new HFTGame({
        gameDB: g.gameDB,
        relayServer: relayServer,
      });
      relayServer.assignAsClientForGame({gameId: '__hft__', showInList: false}, hftGame.getClientForGame());
      relayServer.on('gameStarted', function(e) {
        if (options.kiosk && !options.askName) {
          var runtimeInfo = g.gameDB.getGameById(e.gameId);
          if (runtimeInfo) {
            appleCaptivePortalHandler.setFirstPath('/games/' + e.gameId + '/index.html');
          }
        }
      });
      startedCallback();
    }
  }.bind(this);

  var makeServerErrorHandler = function(portnum) {
    return function(err) {
      console.warn('WARNING!!!: ' + err.code + ': could NOT connect to port: ' + portnum);
      tryStartRelayServer();
    };
  };

  var makeServerListeningHandler = function(theServer, portnum) {
    return function() {
      servers.push(theServer);
      goodPorts.push(portnum);
      tryStartRelayServer();
    };
  };

  ports.forEach(function(port) {
    var server = options.httpServer || http.createServer(app);

    server.once('error', makeServerErrorHandler(port));
    server.once('listening', makeServerListeningHandler(server, port));

    server.listen(port);
  });

  /**
   * Close the HFTServer
   * @todo make it no-op after it's closed?
   */
  this.close = function() {
    if (relayServer) {
      relayServer.close();
    }
    servers.forEach(function(server) {
      server.close();
    });
    if (ipIntervalId) {
      clearInterval(ipIntervalId);
      ipIntervalId = undefined;
    }
  };

  this.getSettings = function() {
    return g;
  };

  this.on = function() {
    eventEmitter.on.apply(eventEmitter, arguments);
  };

  this.addListener = function() {
    eventEmitter.addListener.apply(eventEmitter, arguments);
  };

  this.removeListener = function() {
    eventEmitter.removeListener.apply(eventEmitter, arguments);
  };

  this.handleRequest = function(req, res) {
    app(req, res);
  };

  this.addFilesForGame = function(gameId, files) {
    var runtimeInfo = g.gameDB.getGameById(gameId);
    if (!runtimeInfo) {
      console.error("can not get runtimeInfo for gameId: " + gameId);
      return;
    }
    if (!runtimeInfo.features.filesFromGame) {
      console.error("files from game requires API version 1.11.0 or greater. Update your package.json");
      return;
    }
    var mappedFiles = {};
    Object.keys(files).forEach(function(filePath) {
      var content = files[filePath];
      filePath = filePath.replace(/\\/g, '/');
      filePath = gamePrefix + gameId + '/' + filePath;
      filePath = pathToGamePath(gameId, runtimeInfo, filePath);
      mappedFiles[filePath] = content;
    });
    gameFiles.addFiles(mappedFiles);
  };
};

module.exports = HFTServer;
