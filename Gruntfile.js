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
    clean: {
      docs: [
        'docs/relayserver',
        'docs/hft',
      ],
      dotnetdocs: [
        'docs/dotnet',
      ],
    },
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

  // WIP!!!
  grunt.registerTask('unitydocsgen', function() {
    var done = this.async();
    var foo = require('./dev/js/dotnetdocs');
    foo.generateDotNetDocs().then(done).catch(function(err) {
      done(new Error(err));
    });
  });
  grunt.registerTask('unitydocs', ['clean:dotnetdocs', 'unitydocsgen']);

  grunt.registerTask('builddocs', function() {
    var buildStuff = require('./dev/js/build');
    buildStuff({
      files: [
        {
          filespec: "docs/*.md",
        },
        {
          filespec: "docs/unity/*.md",
          mainURL: "/docs/unity",
          toc: "docs/unity/toc.html",
        },
      ],
      template: "dev/templates/lesson.template",
      toc: "docs/toc.html",
      domain: 'docs.happyfuntimes.net',
      baseurl: 'http://docs.happyfuntimes.net',  // used to prepend paths for things like og:url, twitter:url, ...
      mainURL: '/docs',  // use to "go to home" like clicking the title
      defaultOGImageURL: 'http://docs.happyfuntimes.net/docs/images/happyfuntimes.jpg',
      defaultTwitter: '@greggman',
      googleAnalyticsId: 'UA-51764205-4',
      stackoverflowTag: 'happyfuntimes',
      bugIssueURL: 'http://github.com/greggman/happyfuntimes/issues',
      disqusShortName: 'happyfuntimes',
      disqusCheckStr: 'happyfuntimes',  // this is not in the hostname don't show disqus comments. Prevents disqus from showing on localhost
    });
  });

  grunt.registerTask('default', ['eslint', 'clean:docs', 'jsdoc']);
};

