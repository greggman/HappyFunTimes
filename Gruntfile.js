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

  grunt.registerTask('unitydocsgen', function() {
    var fs = require('fs');
    var utils = require('./lib/utils');
    var Promise = require('promise');
    var done = this.async();
    var execP = Promise.denodeify(utils.execute);
    var dstPath = "docs/dotnet";
    var mdocPath = "/Applications/Unity/Unity.app/Contents/Frameworks/Mono/bin/mdoc";
    var mdocEnv = JSON.parse(JSON.stringify(process.env));
    mdocEnv.MONO_PATH = "/Applications/Unity/MonoDevelop.app/Contents/MacOS/lib/monodevelop/bin:/Applications/Unity/Unity.app/Contents/Frameworks/Mono/lib/mono/2.0";
    if (!fs.existsSync(dstPath)) {
      fs.mkdirSync(dstPath);
    }
    // extract inline docs
    // mcs ~/src/hft-unity3d/HappyFunTimes/*.cs /doc:doc.xml -t:library -r:/Users/gregg/src/hft-unity3d/HappyFunTimes/bin/Release/DeJson.dll,/Users/gregg/src/hft-unity3d/HappyFunTimes/bin/Release/UnityEngine.dll,/Users/gregg/src/hft-unity3d/HappyFunTimes/bin/Release/websocket-sharp.dll
    execP("mcs", [
        "../../../hft-unity3d/HappyFunTimes/*.cs",
        "/doc:doc.xml",
        "-t:library",
        "-r:../../../hft-unity3d/HappyFunTimes/bin/Release/DeJson.dll,../../../hft-unity3d/HappyFunTimes/bin/Release/UnityEngine.dll,../../../hft-unity3d/HappyFunTimes/bin/Release/websocket-sharp.dll",
      ], {
        cwd: dstPath,
        env: process.env,
      }).then(function() {
        // generate xml
        // MONO_PATH=/Applications/Unity/MonoDevelop.app/Contents/MacOS/lib/monodevelop/bin:/Applications/Unity/Unity.app/Contents/Frameworks/Mono/lib/mono/2.0 /Applications/Unity/Unity.app/Contents/Frameworks/Mono/bin/mdoc update -o en ~/src/hft-unity3d/HappyFunTimes/bin/Release/HappyFunTimes.dll
        return execP(mdocPath, [
          "update",
          "-o", "en",
          "../../../hft-unity3d/HappyFunTimes/bin/Release/HappyFunTimes.dll",
        ], {
          cwd: dstPath,
          env: mdocEnv,
        });
      }).then(function() {
        // merge inline docs with generated xml
        // MONO_PATH=/Applications/Unity/MonoDevelop.app/Contents/MacOS/lib/monodevelop/bin:/Applications/Unity/Unity.app/Contents/Frameworks/Mono/lib/mono/2.0 /Applications/Unity/Unity.app/Contents/Frameworks/Mono/bin/mdoc export-html -o htmldocs en
        return execP(mdocPath, [
           "export-html",
           "-o", "htmldocs", "en",
        ], {
          cwd: dstPath,
          env: mdocEnv,
        });
      }).then(function() {
        // generate xml
        // MONO_PATH=/Applications/Unity/MonoDevelop.app/Contents/MacOS/lib/monodevelop/bin:/Applications/Unity/Unity.app/Contents/Frameworks/Mono/lib/mono/2.0 /Applications/Unity/Unity.app/Contents/Frameworks/Mono/bin/mdoc update -o en ~/src/hft-unity3d/HappyFunTimes/bin/Release/HappyFunTimes.dll
        return execP(mdocPath, [
          "update",
          "-o", "en",
          "../../../hft-unity3d/HappyFunTimes/bin/Release/HappyFunTimes.dll",
        ], {
          cwd: dstPath,
          env: mdocEnv,
        });
      }).then(function() {
        done();
      }).done();
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

