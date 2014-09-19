API Versions
============

In the `package.json` you set an `apiVersion`. The versions follow
the [semver](http://semver.org) standard meaning version 1.2.x is
supposed to be backward compatible with 1.1.x but 2.0.x is NOT
compatible.

As much as possible I'm trying to make it so you must set the
correct API version. Features not available for the version
you request will not be available to your game. This is so
the user will know to upgrade vs things just working by
accident.

To use a feature below be sure to set your apiVersion to
the correct version


*   v1.1.0

    *   Unity no longer needs a gameId in the code.

*   v1.2.0

    *   Supports es6 features. This feature is not extensively
        tested but, if you name a file ending in `.es6` happyFunTimes
        will automatically transpile it into es5 at runtime

        So for example to use you might do

            requirejs([
              './some-es5-file.js`,
              './some-es6.file.js6`,
            ], function(
              SomeES6File,
              SomeES6File) {
              ..
            });

        Warning: es6 has not shipped yet which means the spec can
        change. HappyFunTimes is using [google-traceur](https://github.com/google/traceur-compiler)
        to supply this feature.

*   v1.3.0

    *   Supports using `<script>` tags instead of [require.js](http://requirejs.org).

        I really like [require.js](http://requirejs.org) style of modules. It encourages
        dependency injection, it also suppots module independence. But, for many it's non
        standard.

        So, if you want to just use standard script tags make sure your `package.json` has its
        `happyFunTimes.apiVersion` set to `1.3.0` or higher and add the flag `happyFunTimes.useScriptTag` set
        to `true`. Example:

            {
              ...
              "happyFunTimes": {
                ...
                "apiVersion": "1.3.0",
                "useScriptTag": true,
                ...
              }
            }

        The `<script>` tags for HappyFunTimes are automatically
        added for you and so is the script tag that includes `scripts/game.js` for your game and
        `scripts/controller.js` for your controller. If you need any other scripts add script tags to
        either `game.html` or `controller.html`.  The HappyFunTimes libraries will be inserted before
        those tags. The `game.js` or `controller.js` will be inserted after.

        For a working example see [http://github.com/greggman/hft-simple-script](http://github.com/greggman/hft-simple-script)

    *   Fix for Unity Games on Windows

        You need to upgrade old Unity Games to the latest .dlls.
        [Download the .dll here](https://github.com/greggman/hft-unity3d/releases)
        You'll also need the latest version of happyFunTimes. At least verison 0.0.9.
        [Download here](http://superhappyfuntimes.net/install)



