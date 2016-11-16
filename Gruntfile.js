"use strict";

module.exports = function (grunt) {

    grunt.initConfig({
        jsdoc: {
            relayserver: {
                src: ['server/*.js'],
                options: {
                    destination: 'docs/relayserver',
                    configure: 'dev/conf/jsdoc.conf.json',
                    template: 'dev/jsdoc-template/template'
                }
            },
            game: {
                src: [
                    'public/hft/0.x.x/scripts/*.js',
                    'public/hft/0.x.x/scripts/misc/*.js'
                ],
                options: {
                    destination: 'docs/hft',
                    configure: 'dev/conf/jsdoc.conf.json',
                    template: 'dev/jsdoc-template/template'
                }
            }
        },
        clean: {
            docs: [
                'docs/relayserver',
                'docs/hft'
            ],
            dotnetdocs: [
                'docs/dotnet'
            ]
        },
        sass: {
            docs: {
                options: {
                    sourceMap: true,
                    outputStyle: 'compact'
                },
                files: [{
                    expand: true,
                    cwd: 'docs/assets/scss',
                    dest: 'docs/assets/css',
                    src: ['**/*.scss'],
                    ext: '.css'
                }]
            }
        },
        uglify: {
            docs_js: {
                files: {
                    'docs/assets/3rdparty/jquery.js': ['node_modules/jquery/dist/jquery.min.js'],
                    'docs/assets/3rdparty/require.js': ['node_modules/requirejs/require.js'],
                }
            }
        },
        watch: {
            docs_sass: {
                files: ['docs/assets/scss/**/*.scss'],
                tasks: ['sass:docs'],
                options: {
                    spawn: false
                }
            },
            docs_md: {
                files: ['docs/**/*.md'],
                tasks: ['build_docs'],
                options: {
                    spawn: false
                }
            }
        },
        eslint: {
            target: [
                'cli',
                'lib',
                'management',
                'public',
                'server',
                'test',
                'dev/js'
            ],
            options: {
                config: 'dev/conf/eslint.json',
                rulesdir: ['dev/rules']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-sass');

    // Unity Docs
    grunt.registerTask('unitydocsgen', function () {
        var done = this.async();
        var foo = require('./dev/js/dotnetdocs');
        foo.generateDotNetDocs().then(done).catch(function (err) {
            done(new Error(err));
        });
    });

    grunt.registerTask('unity_docs', ['clean:dotnetdocs', 'unitydocsgen']);

    // Docs
    grunt.registerTask('build_docs', function () {
        var buildStuff = require('./dev/js/build');
        buildStuff({
            files: [
                {
                    filespec: "docs/*.md"
                },
                {
                    filespec: "docs/making-games/*.md",
                    mainURL: "/docs/making-games",
                    toc: "docs/making-games/toc.html"
                },
                {
                    filespec: "docs/setup/*.md",
                    mainURL: "/docs/setup",
                    toc: "docs/setup/toc.html"
                },
                {
                    filespec: "docs/unity/*.md",
                    mainURL: "/docs/unity",
                    toc: "docs/unity/toc.html"
                }
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

    grunt.registerTask('docs_assets', [
        'sass:docs',
        'uglify:docs_js'
    ]);

    grunt.registerTask('docs_dev', [
        'clean:docs',
        'build_docs',
        'docs_assets',
        'watch'
    ]);
    grunt.registerTask('docs_build', [
        'clean:docs',
        'build_docs',
        'docs_assets'
    ]);

    // Default task
    grunt.registerTask('default', ['eslint', 'clean:docs', 'jsdoc']);
};

