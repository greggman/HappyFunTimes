Title: Contributing
Description: How to contribute to HappyFunTimes

*   Make sure it passes the linter

        npm run check

    Will run eslint

    And the tests

        npm test

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

