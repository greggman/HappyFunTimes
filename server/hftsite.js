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

var debug   = require('debug')('happyfuntimes:hftsite');
var io      = require('../lib/io');
var url     = require('url');

var g = {
  throttleTime: 1000,
  rendezvousRetryTimes: 100,
  rendezvousRetryTimeout: 5,
};

var settings = {
  // NOTE: You can override this with the environment variable
  //       HFT_RENDEZVOUS_URL
  rendezvousUrl: "http://happyfuntimes.net/api/inform2",
};

var getTime = function() {
  return Date.now();
};

var sendForAWhile = (function() {
  var hftUrl;
  var data;
  var options;
  var tries;
  var parsedUrl;
  var success;

  var tryInform = function(tryOptions) {
    var tryUntilSuccess = function() {
      var localOptions = JSON.parse(JSON.stringify(options));
      localOptions.family = tryOptions.family;
      debug("inform: " + hftUrl + " family: " + localOptions.family);
      io.sendJSON(hftUrl, data, localOptions, function(err) {
        // do I care?
        if (err) {
          ++tries[localOptions.family];
          if (tries[localOptions.family] > 1 && !success) {
            console.error("Try " + tries[localOptions.family] + " of " + g.rendezvousRetryTimes + ": Could not contact: " + parsedUrl.host + " family: " + localOptions.family);
            console.error(err);
          }
          if (tries[localOptions.family] <= g.rendezvousRetryTimes) {
            // If one family succeeds then the other only needs 1 try.
            if (!success) {
              setTimeout(tryUntilSuccess, g.rendezvousRetryTimeout * 1000);
            }
          }
        } else {
          success = true;
          console.log("registered:", data.addresses.join(", "), "with", parsedUrl.hostname, "family:", localOptions.family);
        }
      });
    };
    tryUntilSuccess();
  };

  return function(_url, _data, _options) {
    hftUrl = _url;
    parsedUrl = url.parse(_url);
    data = _data;
    options = JSON.parse(JSON.stringify(_options));
    tries = { 4: 0, 6: 0};
    success = false;
    tryInform({family:4});
    tryInform({family:6});
  };
}());

// Sends the local ip address and port
var inform = (function() {
  var lastAddressesAsStr;
  var lastPort;
  var lastTime = 0;

  return function() {
    if (!g.privateServer && g.port && g.addresses) {
      var now = getTime();
      var elapsedTime = now - lastTime;
      if (lastAddressesAsStr !== g.addressesAsStr ||
          lastPort !== g.port ||
          elapsedTime > g.throttleTime) {
        lastTime = now;
        lastAddressesAsStr = g.addressesAsStr;
        lastPort = g.port;
        var hftUrl = process.env.HFT_RENDEZVOUS_URL || settings.rendezvousUrl;
        debug("ping: " + hftUrl);
        var options = { headers: {},  };
        var rendezvousIp = process.env.HFT_RENDEZVOUS_IP;
        if (rendezvousIp) {
          options.headers["x-forwarded-for"] = rendezvousIp;
        }

        sendForAWhile(hftUrl, { addresses: g.addresses, port: g.port }, options);
      }
    }
  };
}());

/**
 * @typedef {Object} HFTSite~Options
 * @property {string?} addresses ip address eg. "1.2.3.4"
 * @property {string?} port port eg "18679"
 * @property {boolean?} privateServer true = don't send info to hftsite
 */

/**
 * Set options for hftSite
 *
 * @param {HFTSite~Options} options
 */
var setup = function(options) {
  ["addresses", "port", "privateServer"].forEach(function(key) {
    var value = options[key];
    if (value !== undefined) {
      g[key] = value;
    }
  });

  if (g.addresses) {
    g.addressesAsStr = g.addresses.sort().join(",");
  }
};

exports.inform = inform;
exports.setup = setup;

