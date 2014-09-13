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


