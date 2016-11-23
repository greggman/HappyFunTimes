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

var debug       = require('debug')('happyfuntimes:captivep');
var ipUtils     = require('../lib/iputils');
var path        = require('path');
var querystring = require('querystring');
var strings     = require('../lib/strings');
var url         = require('url');

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
 *
 * @constructor
 * @private
 * @param {AppleCaptivePortalHandler~Options} options options
 */
var AppleCaptivePortalHandler = function(options) {
  // This is a total guess. I'm assuming iOS sends a unique URL. I can use that to hopefully
  // return my redirection page the first time and apple's success page the second time
  this.sessions = {};
  this.options = {};
  this.firstPath = "/index.html";
  this.setOptions(options);
};

/**
 * Sets options
 *
 * @param {AppleCaptivePortalHandler~Options} options options
 */
AppleCaptivePortalHandler.prototype.setOptions = function(options) {
  ["sendFileFn", "address", "port", "baseDir"].forEach(function(key) {
    var value = options[key];
    if (value !== undefined) {
      this.options[key] = value;
    }
  }.bind(this));
};

/**
 * @typedef {Object} AppleCaptivePortalHandler~Optons
 * @property {SendFile~Callback} sendFileFn
 * @property {string} address address to make urls from. eg,
 *           192.1.2.3
 * @property {string} port port for urls eg. 8080
 * @property {string} baseDir path to portal files
 */

/**
 * Sets the path we go to after the user picks `[Start]`
 * @param {string} path path to go to . Default is
 *        "/enter-name.html"
 */
AppleCaptivePortalHandler.prototype.setFirstPath = function(path) {
  this.firstPath = path;
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
//  var sessionId = filePath;
  var sessionId = encodeURIComponent(ipUtils.getRequestIpAddresses(req).join("_") + '_' + path.extname(filePath));
  var isCheckingForApple = req.headers["user-agent"] && strings.startsWith(req.headers["user-agent"], "CaptiveNetworkSupport");
//isCheckingForApple = filePath.substr(filePath.length - 5) === ".html";//true;
  var isLoginURL = (filePath === "/game-login.html");
  var isIndexURL = (filePath === "/index.html" || filePath === "/" || filePath === this.firstPath);

  debug("url:", req.url);
  debug("path:", filePath);
  debug("ips:", ipUtils.getRequestIpAddresses(req));
  debug("headers:" + JSON.stringify(req.headers, null, 2));
  if (isIndexURL) {
//    sessionId = parsedUrl.query.sessionId;
//    if (sessionId) {
      debug("remove session:", sessionId);
      delete this.sessions[sessionId];
//    }
    return false;
  }

  //  if (isLoginURL && req.headers["referer"]) {
  //    sessionId = querystring.unescape(url.parse(req.headers["referer"]).pathname);
  //debug("sessionId from referer:" + sessionId);
  //  }

  var session = sessionId ? this.sessions[sessionId] : undefined;
  if (session) {

    debug("found prev sessionId:" + sessionId);
    if (isLoginURL) {
      debug("send game-login");
      session.loggedIn = true;
      this.sendCaptivePortalHTML(req, res, sessionId, "game-login.html");
      return true;
    }

    // We've seen this device before. Either it's checking that it can connect or it's asking for a normal webpage.
    if (isCheckingForApple) {
      if (session.loggedIn) {
        debug("send apple response");
        res.status(200).send("<HTML><HEAD><TITLE>Success</TITLE></HEAD><BODY>Success</BODY></HTML>");
        return true;
      }
    }
    debug("send captive-portal.html");
    this.sendCaptivePortalHTML(req, res, sessionId);
    return true;
  }

  if (!isCheckingForApple) {
    debug("not checking for apple");
    return false;
  }

  // We are checking for apple for the first time so remember the path
  debug("send captive-portal.html with new session:", sessionId);
  this.sessions[sessionId] = {};
  this.sendCaptivePortalHTML(req, res, sessionId);
  return true;
};

/**
 * Sends captive-portal.html (or optionally a different html
 * file) but does substitutions
 *
 * @param {Request} req node's request object.
 * @param {Response} res node's response object.
 * @param {string} sessionId some sessionid
 * @param {string} opt_path base path relative path of html file
 */
AppleCaptivePortalHandler.prototype.sendCaptivePortalHTML = function(req, res, sessionId, opt_path) {
  opt_path = opt_path || "captive-portal.html";
  var fullPath = path.normalize(path.join(this.options.baseDir, opt_path));
  this.options.sendFileFn(req, res, fullPath, function(str) {
    var address = req.socket.address();
    var isIPv6 = address.family === 'IPv6';
    var isHTTPS = req.socket.encrypted;
    var ip = address.address;
    var port = address.port;
    var localhost = (isHTTPS ? 'https://' : 'http://') + (isIPv6 ? ('[' + ip + ']') : ip) + ':' + port;
    var params = {
      startUrl: localhost + this.firstPath + '?sessionId=' + sessionId,
      sessionId: sessionId,
    };
    str = strings.replaceParams(str, params);
    return str;
  }.bind(this));
};

module.exports = AppleCaptivePortalHandler;

