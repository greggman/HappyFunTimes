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

  // extract inline docs
  // mcs ~/src/hft-unity3d/HappyFunTimes/*.cs /doc:doc.xml -t:library -r:/Users/gregg/src/hft-unity3d/HappyFunTimes/bin/Release/DeJson.dll,/Users/gregg/src/hft-unity3d/HappyFunTimes/bin/Release/UnityEngine.dll,/Users/gregg/src/hft-unity3d/HappyFunTimes/bin/Release/websocket-sharp.dll
  // generate xml
  // MONO_PATH=/Applications/Unity/MonoDevelop.app/Contents/MacOS/lib/monodevelop/bin:/Applications/Unity/Unity.app/Contents/Frameworks/Mono/lib/mono/2.0 /Applications/Unity/Unity.app/Contents/Frameworks/Mono/bin/mdoc update -o en ~/src/hft-unity3d/HappyFunTimes/bin/Release/HappyFunTimes.dll
  // merge inline docs with generated xml
  // MONO_PATH=/Applications/Unity/MonoDevelop.app/Contents/MacOS/lib/monodevelop/bin:/Applications/Unity/Unity.app/Contents/Frameworks/Mono/lib/mono/2.0 /Applications/Unity/Unity.app/Contents/Frameworks/Mono/bin/mdoc export-html -o htmldocs en
  // generate html
  // MONO_PATH=/Applications/Unity/MonoDevelop.app/Contents/MacOS/lib/monodevelop/bin:/Applications/Unity/Unity.app/Contents/Frameworks/Mono/lib/mono/2.0 /Applications/Unity/Unity.app/Contents/Frameworks/Mono/bin/mdoc export-html -o htmldocs en

  grunt.registerTask('builddocs', function() {
    var buildStuff = require('./dev/js/build');
    buildStuff({
      files: [
        //{
        //  filespec: "docs/*.md",
        //},
        {
          filespec: "docs/unity/*.md",
          mainURL: "http://docs.happyfuntimes.net/docs",
          toc: "docs/unity/toc.html",
        },
      ],
      template: "dev/templates/lesson.template",
      toc: "docs/unity/toc.html",
      domain: 'docs.happyfuntimes.net',
      baseurl: 'http://docs.happyfuntimes.net',  // used to prepend paths
      mainURL: 'http://docs.happyfuntimes.net',  // use to "go to home" like clicking the title
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

