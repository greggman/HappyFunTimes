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
          'public/hft/0.x.x/scripts/*.js',
          'public/hft/0.x.x/scripts/misc/*.js',
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
    eslint: {
        target: [
          'cli',
          'lib',
          'management',
          'server',
          'test',
        ],
        options: {
            config: 'dev/conf/eslint.json',
            rulesdir: ['dev/rules'],
            plugin: [
                'eslint-plugin-one-variable-per-var',
                'eslint-plugin-require-trailing-comma',
            ],
        },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-eslint');

  grunt.registerTask('default', ['eslint', 'clean', 'jsdoc']);
};

