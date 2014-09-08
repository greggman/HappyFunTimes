Contributing
============

*  Versioning the API

   If you add new functionality to the public API (the api games and controllers call) increment
   the API in `hft.hanson`

   If it's not backward compatible make a new major version second in the `hft.hanson` file
   and make sure you've made new versions of files in `templates` and `scripts`.

   The flow for HFT is

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


*  JavaScript style

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



