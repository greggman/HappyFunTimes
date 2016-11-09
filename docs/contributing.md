Title: Contributing
Description: How to contribute to HappyFunTimes

*   Versioning the API

    If you add new functionality to the public API (the api games and controllers call) increment
    the API in `hft.hanson`.

    If it's not backward compatible make a new major version second in the `hft.hanson` file
    and make sure you've made new versions of files in `templates` and `scripts`.

    The flow for HFT is:

    *   When a game is installed, checks if HFT supports at least the required version of the API

    *   When a game is run, find the highest compaitible verison of the API. There should only be
        one major version of each API since [by defintion](http://semver.org) they are supposed to
        backward compatible within a major version.

    For example: If the game requires 0.3.5 but HFT only supports up to 0.3.4 then fail to install/run.
    If the game requires 0.1.2 and we have 0.9.12, 0.9.12 should be compatible so use it.

    Places that need API version path updates generally
    ---------------------------------------------------

        hft.hanson
        public/index.html
        public/enter-name.html
        public/games.html
        public/options.html

        templates/<version>/*
        scripts/<version>

*   Make sure it passes the linter

         grunt eslint

    Will run eslint.

*   JavaScript style

    In general.

    *   variable declaration

        One per line

            var a;  // good
            var b;

            var a, b;  // bad


    *   braces

        k&r style

            if (cond) {   // good
               ...code..
            }

            if (cond) { ..code.. } // bad
            if (cond)
            {
                 // bad
            }

    *   use `===`

            if (a === b) {  // good
            if (a !== b) {  // good
            if (a == b)  {  // bad
            if (a != b)  {  // bad

    *   use `v = option || default` when appropriate

            function(width) {
               width = width || 300; // good

            function(width) {
               width = (width !== undefined) ? width : 300;  // bad

        Of course use good judgement. Sometimes the second form is more appropriate

    *   use positive options

            options.autoResize    // good
            options.dontResize    // bad

        If the default is for the options to be `true` then make check that check for
        undefined

            var autoResize = options.autoResize === undefined ? true : options.autoResize;

    *   naming

            someVariable;
            SomeClass;
            someFunction;

    *   loops

        prefer forEach

            someArray.forEach(... // good
            Object(someObject).keys().forEach(... // good

            for (var ndx = 0; ndx < someArray.length; ++ndx)  // ok if neded

            for (var key in someObject)  // bad

        Yes I know that other methods might be faster today. First off we're not processing
        a million things so the perf doens't matter. Second JS gets faster and this is
        the form most work will be spent on optimizing since it's the language's preferred
        way of iterating.

    *   trailing commas

            var someObj = {
               prop1: value1,
               prop2: value2,
               prop3: value3,   // good
            };

           var someObj = {
              prop1: value1,
              prop2: value2,
              prop3: value3     // bad
           };

