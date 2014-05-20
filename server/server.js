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
  port: 8080,
  screenshotCount: 0,
  baseDir: "public",
  cwd: process.cwd(),
};

var http = require('http');
var debug = require('debug')('server');
var url = require('url');
var fs = require('fs');
var sys = require('sys');
var path = require('path');
var util = require('util');
var mime = require('mime');
var querystring = require('querystring');
var args = require('minimist')(process.argv.slice(2));
var strings = require('./strings');
var highResClock = require('./highresclock');
var DNSServer = require('./dnsserver');
var iputils = require('./iputils');
var GameDB = require('./gamedb');

var relayServer;

if (args.h || args.help) {
  sys.print([
      "--help:    this message",
      "--port:    port. Default 8080",
      "--dns:     enable dns",
      "--address: ip address for dns and controller url conversion",
    ].join("\n"));
  process.exit(0);
}

for (var prop in args) {
  g[prop] = args[prop];
}

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

var gameDB = new GameDB({
  baseDir: g.baseDir,
  gamesDirs: [
      path.join(g.baseDir, "/examples"),
      path.join(g.baseDir, "/games"),
  ],
});

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
  }, {
    'Access-Control-Allow-Origin': '*',
  });
};

var handleRequests = (function() {

  var postCmdHandlers = {
    time: handleTimeRequest,
    screenshot: handleScreenshotRequest,
    listRunningGames: handleListRunningGamesRequest,
    listAvailableGames: handleListAvailableGamesRequest,
    happyFunTimesPing: handleHappyFunTimesPingRequest,
  };

  return function(req, res) {
    debug("req: " + req.method + " : " + req.url);
    // your normal server code
    if (req.method == "POST") {
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
    } else if (req.method == "OPTIONS") {
      res.removeHeader('Content-Type');
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept',
      });
      res.end();
    } else {
      sendRequestedFile(req, res);
    }
  };
}());

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
}

var sendFileResponse = function(res, fullPath, opt_prepFn) {
  debug("path: " + fullPath);
  if (g.cwd != fullPath.substring(0, g.cwd.length)) {
    sys.print("forbidden: " + fullPath + "\n");
    return send403(res);
  }
  var mimeType = mime.lookup(fullPath);
  if (mimeType) {
    fs.readFile(fullPath, function(err, data){
      if (err) {
        sys.print("unknown file: " + fullPath + "\n");
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

var replaceParams = (function() {

  var captureRE = /%\(([A-Za-z0-9_]+)\)s/g;

  return function(str, params) {
    return str.replace(captureRE, function(match) {
      return params[match.substring(2, match.length - 2)];
    });
  };
}());

/**
 * Object to try to encapulate dealing with Apple's captive
 * portal detector.
 *
 * Note: I'm sure there's a better way to do this but ... my
 * guess is most captive portal handling is done at a lower
 * level where the system tracking who can access the network
 * and who can't does so by tracking MAC addresses. A router can
 * do that but at the TCP/IP level of an app like this the MAC
 * address of a particular connection is not available AFAIK.
 *
 * So, we do random things like session ids. For the purpose of
 * HappyFunTimes our only goal is to connect the player to the
 * games through Apple's captive portal detector.
 *
 * By snooping the network it appears Apple's portal detector
 * will always set the `user-agent` and use some semi-random
 * looking UUID as the path. If we see that user agent then we
 * make up a sessionid from the path. The flow is something like
 * this
 *
 *   1. Recognize Apple's Captive Portal Detector (user-agent)
 *   2. Use UUID like path as sessionId
 *   3. Send /captive-portal.html with sessionid embeded in url
 *      to game-login.html and JS redirect to that url.
 *   4. when we serve game-login.html we recognize the session
 *      id and mark that session id as "loggedIn"
 *   5. Apple's captive portal detector will try again with the
 *      same session id, this time we'll return the response it
 *      expects. Apple's captive protal detector will think
 *      the system can access the net. It will change it's UI
 *      from "Cancel" to "Done" and any links displayed when
 *      clicked will launch Safari (or the user's default
 *      browser on OSX).
 */
var AppleCaptivePortalHandler = function() {
  // This is a total guess. I'm assuming iOS sends a unique URL. I can use that to hopefully
  // return my redirection page the first time and apple's success page the second time
  this.sessions = {};
};

/**
 * Check if this request has something to do with captive portal
 * handling and if so handle it.
 *
 * @param {!Request} req node request object
 * @param {!Response} res node response object
 * @return {boolean} true if handled, false if not.
 */
AppleCaptivePortalHandler.prototype.check = function(req, res) {
  var parsedUrl = url.parse(req.url, true);
  var filePath = querystring.unescape(parsedUrl.pathname);
  var sessionId = filePath;
  var isCheckingForApple = req.headers["user-agent"] && strings.startsWith(req.headers["user-agent"], "CaptiveNetworkSupport");
  var isLoginURL = (filePath == "/game-login.html");
  var isIndexURL = (filePath == "/index.html" || filePath == "/" || filePath == "/enter-name.html");

  if (isIndexURL) {
    sessionId = parsedUrl.query.sessionId;
    if (sessionId) {
      delete this.sessions[sessionId];
    }
    return false;
  }

  if (isLoginURL && req.headers["referer"]) {
    sessionId = querystring.unescape(url.parse(req.headers["referer"]).pathname);
  }

  var session = sessionId ? this.sessions[sessionId] : undefined;
  if (session) {

    if (isLoginURL) {
      session.loggedIn = true;
      this.sendCaptivePortalHTML(res, sessionId, "game-login.html");
      return true;
    }

    // We've seen this device before. Either it's checking that it can connect or it's asking for a normal webpage.
    if (isCheckingForApple) {
      if (session.loggedIn) {
        var data = "<HTML><HEAD><TITLE>Success</TITLE></HEAD><BODY>Success</BODY></HTML>";
        sendStringResponse(res, data);
        return true;
      }
    }
    this.sendCaptivePortalHTML(res, sessionId);
    return true;
  }

  if (!isCheckingForApple) {
    return false;
  }

  // We are checking for apple for the first time so remember the path
  this.sessions[sessionId] = {};
  this.sendCaptivePortalHTML(res, sessionId);
  return true;
};

/**
 * Sends captive-portal.html (or optionally a different html
 * file) but does substitutions
 *
 * @param {Response} res node's response object.
 * @param {string} sessionId some sessionid
 * @param {string} opt_path base path relative path of html file
 */
AppleCaptivePortalHandler.prototype.sendCaptivePortalHTML = function(res, sessionId, opt_path) {
  opt_path = opt_path || "captive-portal.html";
  var fullPath = path.normalize(path.join(g.cwd, g.baseDir, opt_path));
  sendFileResponse(res, fullPath, function(str) {
    var params = {
      sessionId: sessionId,
      localhost: g.address + ":" + g.port,
    };
    str = replaceParams(str, params);
    return str;
  });
};


var appleCaptivePortalHandler = new AppleCaptivePortalHandler();

var sendRequestedFile = function(req, res) {
  if (appleCaptivePortalHandler.check(req, res)) {
    return;
  }

  var parsedUrl = url.parse(req.url);
  var filePath = querystring.unescape(parsedUrl.pathname);
  var fullPath = path.normalize(path.join(g.cwd, g.baseDir, filePath));
  // I'm sure these checks are techincally wrong but it doesn't matter for our purposes AFAICT.
  var isQuery = filePath.indexOf('?') >= 0;
  var isAnchor = filePath.indexOf('#') >= 0;
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
  sendFileResponse(res, fullPath);
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

var ports = [g.port];
// If we're not trying port 80 then add it.
if (g.port.toString() != "80") {
  ports.push("80");
}

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
      process.exit(1);
    }
    var RelayServer = require('./relayserver.js');
    relayServer = new RelayServer(servers, {address: g.address});
    sys.print("Listening on port(s): " + goodPorts.join(", ") + "\n");
  }
};

for (var ii = 0; ii < ports.length; ++ii) {
  var port = ports[ii];
  var server = http.createServer(handleRequests);
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

