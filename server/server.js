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

var g = {
  port: 18679,
  screenshotCount: 0,
  baseDir: "public",
  cwd: process.cwd(),
  hftDomain: "happyfuntimes.net",
};

var config     = require('./config');
var log        = require('../lib/log');
var optionator = require('optionator')({
  options: [
    { option: 'help', alias: 'h', type: 'Boolean',    description: 'displays help'},
    { option: 'port', alias: 'p', type: 'Int',        description: 'port. Default 18679'},
    { option: 'dns',              type: 'Boolean',    description: 'enable dns server'},
    { option: 'address',          type: 'String',     description: 'ip address for dns and controller url conversion'},
    { option: 'config-path',      type: 'String',     description: 'config path'},
    { option: 'settings-path',    type: 'String',     description: 'settings path'},
    { option: 'hft-domain',       type: 'String',     description: 'domain for happyfuntimes site'},
    { option: 'private-server',   type: 'Boolean',    description: 'do not inform happyfuntimes.net about this server. Users will not be able to use happyfuntimes.net to connect to your games'},
    { option: 'app-mode',         type: 'Boolean',    description: 'run as an app'},
    { option: 'debug',            type: 'Boolean',    description: 'check more things'},
    { option: 'verbose',          type: 'Boolean',    description: 'print more stuff'},
  ],
  helpStyle: {
    typeSeparator: '=',
    descriptionSeparator: ' : ',
    initialIndent: 4,
  },
});

try {
  var args = optionator.parse(process.argv);
} catch (e) {
  console.error(e);
  process.exit(1);
}

if (args.help) {
  console.log(optionator.generateHelp());
  process.exit(0);
}

for (var prop in args) {
  g[prop] = args[prop];
}

log.config(args);
config.setup(args);

if (args.appMode) {
  require('../management/games').init();
}

var AppleCaptivePortalHandler = require('./apple-captive-portal-handler');
var browser                   = require('./browser');
var Cache                     = require('inmemfilecache');
var computerName              = require('./computername');
var debug                     = require('debug')('server');
var DNSServer                 = require('./dnsserver');
var express                   = require('express');
var fs                        = require('fs');
var gameDB                    = require('./gamedb');
var HFTGame                   = require('./hftgame');
var hftSite                   = require('./hftsite');
var highResClock              = require('./highresclock');
var http                      = require('http');
var iputils                   = require('./iputils');
var mime                      = require('mime');
var path                      = require('path');
var Promise                   = require('promise');
var querystring               = require('querystring');
var strings                   = require('./strings');
var sys                       = require('sys');
var url                       = require('url');
var util                      = require('util');

var app = express();
var fileCache = new Cache();
var relayServer;

if (!g.address) {
  var addresses = iputils.getIpAddress();

  if (addresses.length < 1) {
    console.error("No IP address found for DNS");
  }
  g.address = addresses[0];
  if (addresses.length > 1) {
    console.log("more than 1 IP address found: " + addresses);
  }
}
console.log("using ip address: " + g.address);
hftSite.setup(g);

g.cwd = path.normalize(path.join(__dirname, ".."));

function postHandler(request, callback) {
  var query_ = { };
  var content_ = '';

  request.addListener('data', function(chunk) {
    content_ += chunk;
  });

  request.addListener('end', function() {
    try {
      query_ = JSON.parse(content_);
    } catch (e) {
      query_ = {};
    }
    callback(query_);
  });
}

function sendJSONResponse(res, object, opt_headers) {
  var headers = opt_headers || { };
  headers['Content-Type'] = 'application/json';
  res.writeHead(200, headers);
  res.write(JSON.stringify(object), 'utf8');
  res.end();
};

function saveScreenshotFromDataURL(dataURL) {
  var EXPECTED_HEADER = "data:image/png;base64,";
  if (strings.startsWith(dataURL, EXPECTED_HEADER)) {
    var filename = "screenshot-" + (g.screenshotCount++) + ".png";
    fs.writeFile(
        filename,
        dataURL.substr(
            EXPECTED_HEADER.length,
            dataURL.length - EXPECTED_HEADER.length),
        'base64');
    sys.print("Saved Screenshot: " + filename + "\n");
  }
}

var handleTimeRequest = function(query, res) {
  sendJSONResponse(res, { time: highResClock.getTime() });
};

var handleScreenshotRequest = function(query, res) {
  saveScreenshotFromDataURL(query.dataURL);
  sendJSONResponse(res, { ok: true });
};

var handleListRunningGamesRequest = function(query, res) {
  if (!relayServer) {
    send404(res);
    return;
  }
  var games = relayServer.getGames();
  sendJSONResponse(res, games);
};

var handleListAvailableGamesRequest = function(query, res) {
  sendJSONResponse(res, gameDB.getGames());
};

var handleHappyFunTimesPingRequest = function(query, res) {
  sendJSONResponse(res, {
    version: "0.0.0",
    id: "HappyFunTimes",
    machine: computerName.get(),
  }, {
    'Access-Control-Allow-Origin': '*',
  });
};

var handlePOST = (function() {
  var postCmdHandlers = {
    time: handleTimeRequest,
    //screenshot: handleScreenshotRequest,
    listRunningGames: handleListRunningGamesRequest,
    listAvailableGames: handleListAvailableGamesRequest,
    happyFunTimesPing: handleHappyFunTimesPingRequest,
  };

  return function(req, res) {
    postHandler(req, function(query) {
      var cmd = query.cmd;
      debug("query: " + cmd);
      var handler = postCmdHandlers[cmd];
      if (!handler) {
        send404(res);
        return;
      }
      handler(query, res);
    });
  };
}());

var handleOPTIONS = function(req, res) {
  res.removeHeader('Content-Type');
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept',
  });
  res.end();
};

var isFolder = (function() {
  // Keep a cache of all paths because fs.statSync is sync
  // this should never be that big because we're only serving
  // a few files and are not online.... hopefully.
  var fileDB = { };
  return function(path) {
    var dir = fileDB[path];
    if (dir === undefined) {
      var stats;
      try {
        stats = fs.statSync(path);
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
    'Content-Type': opt_mimeType || "text/html",
    'Content-Length': data.length,
  });
  res.write(data);
  res.end();
};

var sendFileResponse = function(res, fullPath, opt_prepFn) {
  debug("path: " + fullPath);
  var mimeType = mime.lookup(fullPath);
  if (mimeType) {
    fileCache.readFile(fullPath, function(err, data){
      if (err) {
        console.error("error: " + err + ": " + fullPath );
        return send404(res);
      }
      if (opt_prepFn) {
        data = opt_prepFn(data.toString());
      }
      if (strings.startsWith(mimeType, "text")) {
        res.writeHead(200, {
          'Content-Type':  mimeType + '; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate', // HTTP 1.1.
          'Pragma':        'no-cache',                            // HTTP 1.0.
          'Expires':       '0',                                   // Proxies.
        });
        res.write(data, "utf8");
        res.end();
      } else {
        sendStringResponse(res, data, mimeType);
      }
    });
  } else {
    send404(res);
  }
};

var appleCaptivePortalHandler = new AppleCaptivePortalHandler({
  baseDir: path.join(g.cwd, g.baseDir),
  address: g.address,
  port: g.port,
  sendFileFn: sendFileResponse,
});

var templatify = function(str) {
  return strings.replaceParams(str, {
    localhost: g.address,
  });
};

// Send a file from a game.
var sendGameRequestedFile = function(req, res) {
  var gamePrefixLength = 8;  // "/games/" + the slash after the id
  var gameId = req.params[0];
  var gameInfo = gameDB.getGameById(gameId);
  var parsedUrl = url.parse(req.url);
  var filePath = parsedUrl.pathname;
  var fullPath = path.normalize(path.join(gameInfo.happyFunTimes.basePath, filePath.substr(gamePrefixLength + gameId.length)));
  sendRequestedFileFullPath(req, res, fullPath);
};

// Send a file from the HFT system
var sendSystemRequestedFile = function(req, res) {
  if (appleCaptivePortalHandler.check(req, res)) {
    return;
  }
  sendRequestedFile(req, res);
};

var sendRequestedFileFullPath = function(req, res, fullPath) {
  var parsedUrl = url.parse(req.url);
  var filePath = parsedUrl.pathname;
  var isTemplate = gameDB.getTemplateUrls().indexOf(filePath) >= 0;
  var isQuery = parsedUrl.query !== null;
  var isAnchor = parsedUrl.hash !== null;
  if (!isQuery && !isAnchor) {
    // Add "/" if it's a folder.
    if (!strings.endsWith(filePath, "/") && isFolder(fullPath)) {
      filePath += "/";
      res.writeHead(302, {
        'Location': filePath
      });
      res.end();
      return;
    }
    // Add index.html if ends with "/"
    if (strings.endsWith(fullPath, "/") || strings.endsWith(fullPath, "\\")) {
      fullPath += "index.html";
    }
  }
  sendFileResponse(res, fullPath, isTemplate ? templatify : undefined);
};

var sendRequestedFile = function(req, res) {
  var parsedUrl = url.parse(req.url);
  var filePath = parsedUrl.pathname;
  var fullPath = path.normalize(path.join(g.cwd, g.baseDir, filePath));
  sendRequestedFileFullPath(req, res, fullPath);
};

var send404 = function(res) {
  res.writeHead(404);
  res.write('404');
  res.end();
};

var send403 = function(res) {
  res.writeHead(403);
  res.write('403');
  res.end();
};

var addTemplateInsertedPath = function(app, pathRegex, templateName, contentPath) {
  app.get(pathRegex, function(req, res) {
    var gameId = req.params[0];
    var gameInfo = gameDB.getGameById(gameId);

    if (!gameInfo.happyFunTimes.useTemplate[templateName]) {
      sendRequestedGameFile(req, res);
      return;
    }

    var templatePath = gameInfo.happyFunTimes.versionSettings.templates[templateName];
    templatePath = path.normalize(path.join(g.cwd, templatePath));

    var contentFullPath = path.normalize(path.join(gameInfo.happyFunTimes.basePath, contentPath));

    fileCache.readFile(templatePath, function(err, templateData) {
      if (err) {
        console.error("error: " + err + ": " + templatePath);
        return send404(res);
      }
      sendFileResponse(res, contentFullPath, function(str) {
        var result = strings.replaceParams(templateData.toString(), [
          gameInfo,
          {
            content: str,
          }
        ]);
        return result;
      });
    });
  });
};

addTemplateInsertedPath(app, /^\/games\/(.*?)\/index.html$/, "controller", "controller.html");
addTemplateInsertedPath(app, /^\/games\/(.*?)\/gameview.html$/, "game", "game.html");
app.get(/^\/games\/(.*?)\//, sendGameRequestedFile);
app.get(/.*/, sendSystemRequestedFile);
app.post(/.*/, handlePOST);
app.options(/.*/, handleOPTIONS);

var ports = [g.port];
// If we're not trying port 80 then add it.
["80", "8080"].forEach(function(p) {
  if (g.port.toString() != p) {
    ports.push(p);
  }
});

var numResponsesNeeded = ports.length;
var servers = [];
var goodPorts = [];

var tryStartRelayServer = function() {
  --numResponsesNeeded;
  if (numResponsesNeeded < 0) {
    throw "numReponsese is negative";
  }
  if (numResponsesNeeded == 0) {
    if (goodPorts.length == 0) {
      console.error("NO PORTS available. Tried port(s) " + ports.join(", "));
      launchBrowser(true);
      return;
    }
    var RelayServer = require('./relayserver.js');
    relayServer = new RelayServer(servers, {
      address: g.address,
      baseUrl: "http://" + g.address + ":" + g.port,
    });
    sys.print("Listening on port(s): " + goodPorts.join(", ") + "\n");

    // Add management game
    var hftGame = new HFTGame({
      gameDB: gameDB,
    });
    relayServer.assignAsClientForGame({gameId: "__hft__", showInList: false}, hftGame.getClientForGame());
    launchBrowser(false);
  }
};

for (var ii = 0; ii < ports.length; ++ii) {
  var port = ports[ii];
  var server = http.createServer(app);

  server.once('error', function(port) {
    return function(err) {
      console.warn("WARNING!!!: " + err.code + ": could NOT connect to port: " + port);
      tryStartRelayServer();
    };
  }(port));

  server.once('listening', function(server, port) {
    return function() {
      servers.push(server);
      goodPorts.push(port);
      tryStartRelayServer();
    };
  }(server, port));

  server.listen(port);
}

if (g.dns) {
  var dnsServer = new DNSServer({address: g.address});
}

//browser.getBrowsers().then(function(browsers) {
//  console.log("browsers: " + browsers);
//}, function(err) {
//  console.error(err);
//  if (err.stack) {
//    console.error(err.stack);
//  }
//});

var launchBrowser = function(exit) {

  var next = function() {
    if (exit) {
      process.exit(1);
    } else {
      if (args.appMode) {
        console.log([
          "",
          "---==> HappyFunTimes Running <==---",
          "",
        ].join("\n"))
      }
    }
  };

  var p;
  if (args.appMode) {
    p = browser.launch("http://localhost:" + g.port + "/games.html", config.getConfig().preferredBrowser);
  } else {
    p = Promise.resolve();
  }
  p.then(function() {
     next();
  }, function(err) {
    console.error(err);
    next();
  });
}


