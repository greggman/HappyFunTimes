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

const AppleCaptivePortalHandler = require('./apple-captive-portal-handler');
const computerName              = require('../lib/computername');
const debug                     = require('debug')('happyfuntimes:hft-server');
const events                    = require('events');
const express                   = require('express');
const fs                        = require('fs');
const hftSite                   = require('./hftsite');
const highResClock              = require('../lib/highresclock');
const http                      = require('http');
const iputils                   = require('../lib/iputils');
const mime                      = require('mime');
const path                      = require('path');
const querystring               = require('querystring');
const strings                   = require('../lib/strings');

/**
 * @typedef {Object} HFTServer~Options
 * @property {number} [port] port to listen on. Default 18679
 * @property {string} [hftDomain] Domain to inform our internal
 *           ip address. Default: "happyfuntimes.net"
 * @property {string} [baseDir] path to server files from
 * @property {string} address ip address to bind to.
 * @property {boolean} [privateServer] true = don't inform
 *           rendezvous server
 * @property {RelayServer} [relayServer] relay server to use. (for testing)
 * @property {HttpServer} [httpServer] http server to use. (for testing)
 * @property {string} [systemName] name to use if mulitiple
 *           happyFunTimes servers are running on the same
 *           network.
 * @property {number} [inactivityTimeout] time to disconnect users if no activity.
 * @property {boolean} [checkForApp] default = true. Whether or not to try to launch
 *    the native mobile app. This currently takes 3 seconds.
 */

/**
 * HappyFunTimes Server
 *
 * @param {HFTServer~Options} options
 */
var HFTServer = function(options) {
  var g = {
    port: 18679,
    baseDir: process.cwd(),
  };
  var relayServer;
  var appleCaptivePortalHandler;

  Object.keys(options).forEach((prop) => {
    g[prop] = options[prop];
  });

  var getBaseUrl;
  var updateIpAddresses = (addresses) => {
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

  var eventEmitter = new events.EventEmitter();
  var app = express();

  function send404(res, msg) {
    msg = msg || '';
    res.writeHead(404);
    res.write('404<br/>' + res.url + "<br/>" + msg);
    res.end();
  }

  function bodyParser(req, res, next) {
    var query = { };
    var content = [];

    req.addListener('data', (chunk) => {
      content.push(chunk);
    });

    req.addListener('end', () => {
      try {
        query = JSON.parse(content.join(""));
      } catch (e) {
        query = {};
      }
      req.body = query;
      next();
    });
  }

  function handleTimeRequest(query, res) {
    res.json({ time: highResClock.getTime() });
  }

  function handleHappyFunTimesPingRequest(query, res) {
    var game = "TBD";  // get game name from app name
    res.set({'Access-Control-Allow-Origin': '*'}).json({
      version: '0.0.0',
      id: 'HappyFunTimes',
      serverName: (options.systemName || computerName.get()) + game,
    });
  }

  function handleOPTIONS(req, res) {
    res.removeHeader('Content-Type');
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept',
      'Access-Control-Allow-Credentials': false,
      'Access-Control-Max-Age': 86400,
    });
    res.end('{}');
  }

  function sendStringResponse(res, data, opt_mimeType) {
    res.writeHead(200, {
      'Content-Type': opt_mimeType || 'text/html',
      'Content-Length': data.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate', // HTTP 1.1.
      'Pragma':        'no-cache',                            // HTTP 1.0.
      'Expires':       '0',                                   // Proxies.
    });
    res.write(data);
    res.end();
  }

  function getRequestIpAddress(req) {
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
  }

  function setHeaders(res /*, path, stat */) {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate', // HTTP 1.1.
      'Pragma':        'no-cache',                            // HTTP 1.0.
      'Expires':       '0',                                   // Proxies.
    });
  }

  var sendFileResponse = function(req, res, fullPath, opt_prepFn) {
    debug('path: ' + fullPath);
    var mimeType = mime.lookup(fullPath);
    if (mimeType) {
      fs.readFile(fullPath, function(err, data){
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

  if (g.dns) {
    appleCaptivePortalHandler = new AppleCaptivePortalHandler({
      baseDir: path.join(__dirname, '..', 'hft-support'),  // FIX
      address: getAddress(),
      port: g.port,
      sendFileFn: sendFileResponse,
    });
    app.get(/^/, (req, res, next) => {
      if (!appleCaptivePortalHandler.check(req, res)) {
        next();
      }
    });
    app.get('/xtra2.bin', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'hft-support', 'xtra2.bin'));
    });
  }

  app.get(/^\/generate_204$/, (req, res) => {
      res.removeHeader("X-Powered-By");
      res.removeHeader("Connection");
      res.writeHead(204, {
        'Content-Length': 0,
      });
      res.end('');
  });

  // No app support for now
  //app.get(/^\/hft\/0.x.x\/scripts\/runtime\/live-settings\.js$/, (req, res) => {
  //  var data = {
  //    system: {
  //      checkForApp: options.checkForApp,
  //    },
  //  };
  //  var src = "define([], function() { return " + JSON.stringify(data) + "; })\n";
  //  sendStringResponse(res, src, "application/javascript");
  //});

  var staticOptions = {
    fallthrough: true,
    setHeaders: setHeaders,
  };

  // This is left over from the original implementation.
  // happyfuntimes.net sends players here. I could update happyfuntimes.net
  // so you ping it with a version and if it's a newer version it redirects
  // you to controller.html or index.html or whatever you specifiy when
  // you ping it but for now I just hacked this to work.
  // check for /
  // check for index.html
  // check for enter-name.html
  app.get(/^\/(|enter-name\.html|index\.html)$/, (req, res) => {
    res.redirect('/controller.html?' + querystring.stringify(req.query));
  });

  app.use(express.static(g.baseDir, staticOptions));
  app.post(/.*/, bodyParser);

  var postCmdHandlers = {
    time: handleTimeRequest,
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

  var server;

  var tryStartRelayServer = function(port) {
    var RelayServer = require('./relayserver.js');
    relayServer = options.relayServer || new RelayServer([server], {
      baseUrl: getBaseUrl(),
      noMessageTimout: options.inactivityTimeout,
      hftServer: this,
    });
    hftSite.setup({
      address: getAddress(),
      port: port,
      privateServer: g.privateServer,
    });
    eventEmitter.emit('ports', [port]);
  }.bind(this);

  function makeServerListeningHandler(theServer, portnum) {
    return function() {
      server = theServer;
      tryStartRelayServer(portnum);
    };
  }

  function makeServerAndListen(port, address) {
    const server = options.httpServer || http.createServer(app);

    server.once('error', makeServerErrorHandler(server, port, address));  // eslint-disable-line
    server.once('listening', makeServerListeningHandler(server, port));

    debug("try listen port", port, "address:", address);
    server.listen(port, address);
  }

  function makeServerErrorHandler(server, portnum, address) {
    return function(err) {
      console.log("could not create server on", address, ":", portnum, ":", err);
      const wasIPV6 = !!address;
      if (wasIPV6) {
        makeServerAndListen(portnum, '');
      } else {
        makeServerAndListen(portnum + 1, '::');
      }
    };
  }

  process.nextTick(() => {
    makeServerAndListen(g.port, '::');  // try IPV6
  });

  /**
   * Close the HFTServer
   * @todo make it no-op after it's closed?
   */
  this.close = () => {
    if (relayServer) {
      relayServer.close();
    }
    server.close();
    if (ipIntervalId) {
      clearInterval(ipIntervalId);
      ipIntervalId = undefined;
    }
  };

  this.getSettings = () => {
    return g;
  };

  this.on = (...args) => {
    eventEmitter.on(...args);
  };

  this.addListener = (...args) => {
    eventEmitter.addListener(...args);
  };

  this.removeListener = (...args) => {
    eventEmitter.removeListener(...args);
  };

  this.handleRequest = (req, res) => {
    app(req, res);
  };
};

module.exports = HFTServer;
