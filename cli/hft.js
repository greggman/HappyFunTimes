#!/usr/bin/env node
;(function () { // wrapper in case we're in module_context mode

"use strict";

process.title = "hft";

var path = require('path');
var fs = require('fs');
var args = require('minimist')(process.argv.slice(2));
var clc = require('cli-color');
var utils = require('./utils');
var config = require('../server/config');

if (process.stderr.isTTY) {
  console.error = function(originalError) {
    return function() {
      var args = Array.prototype.slice.apply(arguments);
      args[0] = clc.red(args[0]);
      originalError.apply(console, args);
    };
  }(console.error);
}

config.setup({
  configPath: args.config,
  hftDir: args["hft-dir"],
});

var cmd = args._[0];
if (!cmd) {
  printUsage();
  process.exit(1);
} else {
  var cmdPath = path.join(__dirname, "cmds", cmd + ".js");
  if (!fs.existsSync(cmdPath)) {
    console.error("unknown cmd: " + cmd);
    printUsage();
    process.exit(1);
  }

  var cmdModule = require('./cmds/' + cmd);
  cmdModule.name = cmd;

  if (args.help) {
    utils.printUsage(cmdModule.usage, cmdModule.name);
    process.exit(1);
  }

  if (cmdModule.cmd(args) === false) {
    console.error("error running " + cmd);
    process.exit(1);
  }
}

function printUsage() {
  var usage = [];
  var cmds = fs.readdirSync(path.join(__dirname, "cmds"));
  cmds.forEach(function(cmd) {
    if (cmd.substr(-3) != ".js") {
      return;
    }

    var cmdUsage = require('./cmds/' + cmd).usage;
    usage.push("    hft " + cmd.substring(0, cmd.length - 3) + " " + cmdUsage.split("\n")[0]);
  });
  console.log([
    "usage: hft cmd [options]",
    "",
    "    global options:",
    "",
    "    --config=path   path to config file",
    "    --hft-dir=path  path to hft installation",
    "    --help          help for specific command",
    "",
    "",
  ].join("\n") + usage.join("\n") + "\n");
};


}());

