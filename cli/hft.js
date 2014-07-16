#!/usr/bin/env node
;(function () { // wrapper in case we're in module_context mode

"use strict";

process.title = "hft";

var path = require('path');
var fs = require('fs');
var clc = require('cli-color');
var utils = require('./utils');
var config = require('../server/config');
var optionator = require('optionator');
var showStackTrace;

var globalOptions = [
  { option: 'help',    alias: 'h', type: 'Boolean', description: 'displays help'              },
  { option: 'verbose', alias: 'v', type: 'Boolean', description: 'print more stuff'           },
  { option: 'debug',   alias: 'd', type: 'Boolean', description: 'print stack trace on error' },
  { option: 'config-path',         type: 'String',  description: 'config path'                },
  { option: 'settings-path',       type: 'String',  description: 'settings path'              },
  { option: 'hft-dir',             type: 'String',  description: 'hft installation path'      },
];


if (process.stderr.isTTY) {
  console.error = function(originalError) {
    return function() {
      var args = Array.prototype.slice.apply(arguments);
      args[0] = clc.red(args[0]);
      originalError.apply(console, args);
      if (showStackTrace) {
        if (arguments[0].stack) {
          console.error(arguments[0].stack);
        }
      }
    };
  }(console.error);
}

// simple command line parsing
var args = { _: [] };
process.argv.slice(2).forEach(function(arg) {
  if (arg.substr(0, 2) == "--") {
    var key = arg.substring(2);
    var value = true;
    var equalsIndex = arg.indexOf("=");
    if (equalsIndex >= 0) {
      key   = arg.substring(2, equalsIndex);
      value = arg.substring(equalsIndex + 1);
    }
    args[key] = value;
  } else if (arg.substr(0, 1) == "-") {
    args[arg.substring(1)] = true;
  } else {
    args._.push(arg);
  }
});

var helpStyle = {
  typeSeparator: '=',
  descriptionSeparator: ' : ',
  initialIndent: 4,
};

var cmd = args._[0];
if (!cmd) {
  printUsage();
  process.exit(1);
}

config.setup({
  configPath: args["config-path"],
  settingsPath: args["setting-path"],
  hftDir: args["hft-dir"],
});


var cmdPath = path.join(__dirname, "cmds", cmd + ".js");
if (!fs.existsSync(cmdPath)) {
  console.error("unknown cmd: " + cmd);
  printUsage();
  process.exit(1);
}

var cmdModule = require('./cmds/' + cmd);
cmdModule.name = cmd;
cmdModule.globalOptions = globalOptions;
cmdModule.usage.helpStyle = helpStyle;

if (args.help) {
  utils.printUsage(globalOptions, cmdModule.usage, cmdModule.name);
  process.exit(1);
}

try {
  args = optionator({options:cmdModule.usage.options.concat(globalOptions)}).parse(process.argv);
  if (args.debug) {
    showStackTrace = true;
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}
if (cmdModule.cmd(args) === false) {
  console.error("error running " + cmd);
  process.exit(1);
}

function printUsage() {
  var usage = [];
  var cmds = fs.readdirSync(path.join(__dirname, "cmds"));
  cmds.forEach(function(cmd) {
    if (cmd.substr(-3) != ".js") {
      return;
    }

    var cmdUsage = require('./cmds/' + cmd).usage;
    usage.push("    hft " + cmd.substring(0, cmd.length - 3) + " " + (cmdUsage.usage || ''));
  });
  usage.push('');
  var o = optionator({
    prepend: [,
      "usage: hft cmd [options]",
      "",
      usage.join("\n"),
      "global options:",
    ].join("\n"),
    options: globalOptions,
    helpStyle: helpStyle,
  });
  console.log(o.generateHelp());
};


}());

