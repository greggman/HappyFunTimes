"use strict";

module.exports = function(grunt) {

  grunt.initConfig({
    jsdoc: {
      relayserver: {
        src: ['server/*.js'],
        options: {
          destination: 'docs/relayserver',
          configure: 'jsdoc.conf.json',
          template: 'node_modules/ink-docstrap/template',
        },
      },
      game: {
        src: [
          'public/hft/0.0.0/scripts/*.js',
          'public/hft/0.0.0/scripts/misc/*.js',
        ],
        options: {
          destination: 'docs/hft',
          configure: 'jsdoc.conf.json',
          template: 'node_modules/ink-docstrap/template',
        },
      },
    },
    clean: [
        'docs/relayserver',
        'docs/hft',
    ],
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('default', ['clean', 'jsdoc']);
};

