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

var config       = require('../lib/config');
var debug        = require('debug')('register');
var fs           = require('fs');
var io           = require('../lib/io');
var Promise      = require('promise');
var restUrl      = require('rest-url');
var releaseUtils = require('./release-utils');
var url          = require('url');

/**
 * @typedef {Object} Register~Options
 * @property {string} repoUrl url of repo of game to register
 * @property {string?} endpoint base url to register game. eg
 *           http://foo.com
 */

/**
 * Registers the url of the repo of a game with
 * superhappyfuntimes.net
 *
 * @param {Register~Options} options
 */
var register = function(options) {
  var log = options.verbose ? console.log.bind(console) : function() {};
  var sendJSON = Promise.denodeify(io.sendJSON);
  var endpoint = config.getSettings().manageEndpoint;
  if (options.endpoint) {
    endpoint = options.endpoint + url.parse(endpoint).path;
  }

  // this will be checked on the server but check it here in order
  // tell the dev quickly.

  if (!releaseUtils.validRepoURL(options.repoUrl)) {
    return Promise.reject(new Error("not a supported url: " + options.repoUrl));
  }

  var registerUrl = restUrl.make(endpoint, { url: options.repoUrl });
  log("using: " + registerUrl);
  return sendJSON(registerUrl, {}, {});
};

exports.register = register;



