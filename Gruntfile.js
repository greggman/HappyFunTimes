"use strict";

module.exports = function(grunt) {

  grunt.initConfig({
    jsdoc: {
      relayserver: {
        src: ['server/*.js'],
        options: {
          destination: 'docs/relayserver',
          configure: 'dev/conf/jsdoc.conf.json',
          template: 'dev/jsdoc-template/template',
        },
      },
      game: {
        src: [
          'public/hft/0.x.x/scripts/*.js',
          'public/hft/0.x.x/scripts/misc/*.js',
        ],
        options: {
          destination: 'docs/hft',
          configure: 'dev/conf/jsdoc.conf.json',
          template: 'dev/jsdoc-template/template',
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
          'public',
          'server',
          'test',
          'dev/js',
        ],
        options: {
            config: 'dev/conf/eslint.json',
            rulesdir: ['dev/rules'],
        },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-eslint');

  grunt.registerTask('builddocs', function() {
    var buildStuff = require('./dev/js/build');
    buildStuff({
      domain: 'docs.happyfuntimes.net',
      baseurl: 'http://docs.happyfuntimes.net',
      defaultOGImageURL: 'http://docs.happyfuntimes.net/docs/images/happyfuntimes.jpg',
      defaultTwitter: '@greggman',
      googleAnalyticsId: 'UA-51764205-4',
      stackoverflowTag: 'happyfuntimes',
      bugIssueURL: 'http://github.com/greggman/happyfuntimes/issues',
      disqusShortName: 'happyfuntimes',
      disqusCheckStr: 'happyfuntimes',  // this is not in the hostname don't show disqus comments. Prevents disqus from showing on localhost
    });
  });

  grunt.registerTask('default', ['eslint', 'clean', 'jsdoc']);
};

