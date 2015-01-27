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
 /*jslint node: true */
 "use strict";


var debug = require('debug')('dns-server');
var fs    = require('fs');

// This DNS server just servers the same ip address for all domains.
// options:
//   address: ip address to report
var DNSServer = function(options) {
  options = options || { };

  var start = function() {
    var dns = require('native-dns');
    var server = dns.createServer();

    var port = 53;

    var address = options.address;

    server.on('request', function (request, response) {
      debug("response: " + address + " : " + request.question[0].name);
      /*eslint new-cap:0*/
      response.answer.push(dns.A({
        name: request.question[0].name,
        address: address,
        ttl: 1,
      }));
      response.send();
    });

    server.on('error', function (err /*, buff, req, res */) {
      console.error(err);
    });

    try {
      console.log("serving dns to: " + address);
      server.serve(port);
    } catch (e) {
      console.error(e);
    }
  };

  if (process.platform === 'darwin') {
    // Wait for /etc/resolv.conf to exist
    // Apparently this file is written by the OS but, at least with my own router,
    // it can take a 10-30 seconds until it's written. It's probably some kind of timeout.
    var checkForEtcResolvConf = function() {
      if (fs.existsSync("/etc/resolv.conf")) {
        start();
        return;
      }
      console.log("waiting for /etc/resolv.conf");
      setTimeout(checkForEtcResolvConf, 2000);
    };
    checkForEtcResolvConf();
  } else {
    start();
  }
};

module.exports = DNSServer;
