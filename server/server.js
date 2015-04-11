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

/*eslint no-process-exit:0*/

'use strict';

var settingsOptionSpec = {
      option: 'settings',         type: 'String',     description: 'settings: key=value, ',
};

var optionSpec = {
  options: [
    { option: 'help', alias: 'h', type: 'Boolean',    description: 'displays help'},
    { option: 'config-path',      type: 'String',     description: 'config path'},
    { option: 'settings-path',    type: 'String',     description: 'settings path'},
    { option: 'private-server',   type: 'Boolean',    description: 'do not inform happyfuntimes.net about this server. Users will not be able to use happyfuntimes.net to connect to your games'},
    { option: 'debug',            type: 'Boolean',    description: 'check more things'},
    { option: 'verbose',          type: 'Boolean',    description: 'print more stuff'},
    settingsOptionSpec,
  ].concat(require('./common-cli-options').options),
  helpStyle: {
    typeSeparator: '=',
    descriptionSeparator: ' : ',
    initialIndent: 4,
  },
};

var config     = require('../lib/config');
var log        = require('../lib/log');
var Promise    = require('promise');
var optionator = require('optionator')(optionSpec);

try {
  var args = optionator.parse(process.argv);
} catch (e) {
  console.error(e);
  process.exit(1);
}

var printHelp = function() {
  var settings = [];
  Object.keys(require('../lib/config').getSettings().settings).forEach(function(key) {
    settings.push(key);
  });
  settingsOptionSpec.description += settings.join(', ');

  console.log(optionator.generateHelp());
  process.exit(0);
};

if (args.help) {
  printHelp();
}

log.config(args);
config.setup(args);
if (args.settings) {
  var settings = config.getSettings().settings;
  args.settings.split(',').forEach(function(setting) {
    var keyValue = setting.split('=');
    var key = keyValue[0];
    var value = keyValue[1];
    if (!settings[key]) {
      console.error('no setting: "' + key + '"');
      printHelp();
    }
    settings[key] = value;
  });
}



function exitBecauseAlreadyRunning() {
  console.error("HappyFunTimes is already running");
}

function startServer() {
  if (args.appMode) {
    require('../lib/games').init();
  }

  var browser   = require('../lib/browser');
  var DNSServer = require('./dnsserver');
  var iputils   = require('../lib/iputils');
  var HFTServer = require('./hft-server');

  var server;
  var launchBrowser = function(err) {
    var next = function() {
      if (err) {
        console.error(err);
        process.exit(1);
      } else {
        if (args.appMode) {
          console.log([
            '',
            '---==> HappyFunTimes Running <==---',
            '',
          ].join('\n'));
        }
      }
    };

    var p;
    if (args.appMode || args.show) {
      var name = args.show || 'games';
      p = browser.launch('http://localhost:' + server.getSettings().port + '/' + name + '.html', config.getConfig().preferredBrowser);
    } else {
      p = Promise.resolve();
    }
    p.then(function() {
       next();
    }).catch(function(err) {
      console.error(err);
      next();
    });
  };

  server = new HFTServer(args, launchBrowser);

  if (args.dns) {
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
        process.exit(1);
      }
    });
  }
}

function launchIfNotRunning() {
  var io = require('../lib/io');
  var settings = config.getSettings().settings;
  var sendJSON = Promise.denodeify(io.sendJSON);

  var url = "http://localhost:" + settings.port;
  sendJSON(url, { cmd: "happyFunTimesPing" }, {}).then(exitBecauseAlreadyRunning, startServer);
}

launchIfNotRunning();





