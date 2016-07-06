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

var optionSpec = {
  options: [
   { option: 'port', alias: 'p', type: 'Int',     description: 'port. Default 18679', default: `18679`},
   { option: 'dns',              type: 'Boolean', description: 'enable dns server'},
   { option: 'address',          type: 'String',  description: 'ip address for dns and controller url conversion'},
   { option: 'help', alias: 'h', type: 'Boolean', description: 'displays help'},
   { option: 'private-server',   type: 'Boolean', description: 'do not inform happyfuntimes.net about this server. Users will not be able to use happyfuntimes.net to connect to your games'},
   { option: 'debug',            type: 'Boolean', description: 'check more things'},
   { option: 'verbose',          type: 'Boolean', description: 'print more stuff'},
   { option: 'system-name',      type: 'String',  description: 'name used if multiple happyFunTimes servers are running on the same network. Default = computer name'},
  ],
  helpStyle: {
    typeSeparator: '=',
    descriptionSeparator: ' : ',
    initialIndent: 4,
  },
};

var debug      = require('debug')('server');
var log        = require('../lib/log');
var Promise    = require('promise');
var optionator = require('optionator')(optionSpec);
var settings;

try {
  var args = optionator.parse(process.argv);
} catch (e) {
  console.error(e);
  process.exit(1);  // eslint-disable-line
}

var printHelp = function() {
  console.log(optionator.generateHelp());
  process.exit(0);  // eslint-disable-line
};

if (args.help) {
  printHelp();
}

log.config(args);

function exitBecauseAlreadyRunning() {
  console.error("HappyFunTimes is already running");
}

function startGame() {
  console.log("TODO: start game");
}

function startServer() {
  var DNSServer = require('./dnsserver');
  var iputils   = require('../lib/iputils');
  var HFTServer = require('./hft-server');

  var server = new HFTServer(args, startGame);

  if (args.dns) {
    console.log("TODO: OSX, launch in separate process");
    // This doesn't need to dynamicallly check for a change in ip address
    // because it should only be used in a static ip address sitaution
    // since DNS has to be static for our use-case.
    (function() {
      return new DNSServer({address: args.address || iputils.getIpAddresses()[0]});
    }());
    server.on('ports', function(ports) {
      if (ports.indexOf('80') < 0 && ports.indexOf(80) < 0) {
        console.error('You specified --dns but happyFunTimes could not use port 80.');
        console.error('Do you need to run this as admin or use sudo?');
        process.exit(1);  // eslint-disable-line
      }
    });
  }
}

function launchIfNotRunning() {
  var io = require('../lib/io');
  var sendJSON = Promise.denodeify(io.sendJSON);

console.log("TODO: fix");
  var url = "http://localhost:" + args.port;
  sendJSON(url, { cmd: "happyFunTimesPing" }, {}).then(exitBecauseAlreadyRunning, startServer).done();
}

launchIfNotRunning();





