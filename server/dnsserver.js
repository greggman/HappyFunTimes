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

const EventEmitter = require('events');
const debug        = require('debug')('happyfuntimes:dns-server');
const fs           = require('fs');

// This DNS server just servers the same ip address for all domains.
// options:
//   address: ip address to report
class DNSServer extends EventEmitter {
  constructor (options) {
    super();
    this._options = options || { };

    this._start = this._start.bind(this);
    this._checkForEtcResolvConf = this._checkForEtcResolvConf.bind(this);

    if (process.platform === 'darwin') {
      // Wait for /etc/resolv.conf to exist
      // Apparently this file is written by the OS but, at least with my own router,
      // it can take a 10-30 seconds until it's written. It's probably some kind of timeout.
      this._checkForEtcResolvConf();
    } else {
      this._start();
    }
  }
  _checkForEtcResolvConf() {
    if (fs.existsSync("/etc/resolv.conf")) {
      this._start();
      return;
    }
    console.log("waiting for /etc/resolv.conf");
    setTimeout(checkForEtcResolvConf, 2000);
  };
  _start() {
    var dns = require('native-dns');
    var server = dns.createServer();

    var port = 53;

    var address = this._options.address;

    server.on('request', (request, response) => {
      debug("response: " + address + " : " + request.question[0].name);
      response.answer.push(dns.A({    // eslint-disable-line
        name: request.question[0].name,
        address: address,
        ttl: 1,
      }));
      response.send();
    });

    server.on('error', (err /*, buff, req, res */) => {
      console.error(err);
      this.emit('error', err);
    });

    server.on('listening', () => {
      this.emit('listening');
    });

    try {
      console.log("serving dns to: " + address);
      server.serve(port);
    } catch (e) {
      console.error(e);
    }
  }
}

module.exports = DNSServer;
