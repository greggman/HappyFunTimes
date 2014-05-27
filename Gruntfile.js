/*
node ../delme/node_modules/jsdoc/jsdoc.js  --destination delmedocs server/*
*/
"use strict";

module.exports = function(grunt) {

  grunt.initConfig({
    jsdoc: {
      relayserver: {
        srcDirs: ['server'],
        destDir: 'docs/relayserver',
      },
      game: {
        srcDirs: ['public/scripts'],
        destDir: 'docs/game',
      },
      controller: {
        srcDirs: ['public/examples/scripts'],
        destDir: 'docs/controller',
      },
    },
    clean: [
        'docs/relayserver',
        'docs/game',
        'docs/controller',
    ],
  });

  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', ['clean', 'jsdoc']);

  grunt.registerMultiTask('jsdoc', 'Generate Docs with JSDoc', function() {
    //console.log("rmt:");
    //console.log("name: " + this.name);
    //console.log("nameArgs: " + JSON.stringify(this.nameArgs, undefined, "  "));
    //console.log("args: " + JSON.stringify(this.args, undefined, "  "));
    //console.log("flags: " + JSON.stringify(this.flags, undefined, "  "));
    //console.log("target: " + this.target);
    //console.log("files: " + JSON.stringify(this.files, undefined, "  "));
    //console.log("data: " + JSON.stringify(this.data, undefined, "  "));
    //console.log("fl:" + this.filesSrc);
    //console.log("options: " + JSON.stringify(options, undefined, "  "));

    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
    });

    var config = this.data;
    var done = this.async();
    var spawn = require('child_process').spawn;
    var args = [
      'node_modules/jsdoc/jsdoc.js',
      '--destination', config.destDir,
    ].concat(config.srcDirs);

    var proc = spawn('node', args);

    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', function (data) {
        var str = data.toString()
        var lines = str.split(/(\r?\n)/g);
        console.log(lines.join(""));
    });

    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', function (data) {
        var str = data.toString()
        var lines = str.split(/(\r?\n)/g);
        grunt.log.error(lines.join(""));
    });


    proc.on('close', function (code) {
      if (parseInt(code) != 0) {
        grunt.log.error('process exit code ' + code);
      }
      done();
    });
  });


  //// Yea, I get that I should use the grunt stuff but it's not ready so
  //// doing it manually for now
  //grunt.registerTask('default', 'Generate Docs', function() {
  //
  //  console.log("--here--")
  //  var done = this.async();
  //  var spawn = require('child_process').spawn;
  //  var proc = spawn('node', [
  //      'node_modules/jsdoc/jsdoc.js',
  //      '--destination', 'docs/relayserver',
  //      'server',
  //    ]);
  //
  //  proc.stdout.setEncoding('utf8');
  //  proc.stdout.on('data', function (data) {
  //      var str = data.toString()
  //      var lines = str.split(/(\r?\n)/g);
  //      console.log(lines.join(""));
  //  });
  //
  //  proc.stderr.setEncoding('utf8');
  //  proc.stderr.on('data', function (data) {
  //      var str = data.toString()
  //      var lines = str.split(/(\r?\n)/g);
  //      console.error(lines.join(""));
  //  });
  //
  //
  //  proc.on('close', function (code) {
  //      console.log('process exit code ' + code);
  //      done();
  //  });
  //
  //  console.log("--tjere--")
  //});


};

