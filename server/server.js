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

class ServerHelper {
  constructor(hftServer, dnsServer, ports) {
    this._hftServer = hftServer;
    this._dnsServer = dnsServer;
    this._ports = ports;
  }
  get ports() {
    return this._ports;
  }
  close() {
    if (this._dnsServer) {
      this._dnsServer.close();
      this._dnsServer = null;
    }
    if (this._hftServer) {
      this._hftServer.close();
      this._hftServer = null;
    }
  }
}

function startServer(options) {
  return new Promise(function(resolve, reject) {
    const DNSServer = require('./dnsserver');
    const iputils   = require('../lib/iputils');
    const HFTServer = require('./hft-server');
    const server = new HFTServer(options);
    let responsesNeeded = 1;
    let usedPorts;
    let dns;

    function reportReady() {
      --responsesNeeded;
      if (responsesNeeded === 0) {
        resolve(new ServerHelper(server, dns, usedPorts));
      }
    }

    server.on('ports', (ports) => {
      usedPorts = ports;
      reportReady();
    });
    server.on('error', reject);

    if (options.dns) {
      ++responsesNeeded;

      // This doesn't need to dynamicallly check for a change in ip address
      // because it should only be used in a static ip address sitaution
      // since DNS has to be static for our use-case.
      dns = new DNSServer({address: options.address || iputils.getIpAddresses()[0]});
      dns.on('listening', reportReady);
      dns.on('error', (err) => {
        console.error('You specified --dns but happyFunTimes could not use port 53.');
        console.error('Do you need to run this as admin or use sudo?');
        reject(err);
      });
    }
  });
}

module.exports = {
  start: startServer,
};






