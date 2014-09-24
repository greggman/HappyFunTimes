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

* v1.4.0

    *   Support for multiple `GameServer`s on one game

        Normally if 2 `GameServer`s from the same game try to connect to HappyFunTimes
        the second one will disconnect the first one and become the **1** GameServer
        running the game.

        The thinking there was if there is already a game running and HappyFunTimes
        see anotehr try to start it probably means you left a window open somewhere
        or some how the old game didn't get disconnected from HappyFunTimes so
        you probably want the new one to take charge.

        Now though, in your options to `GameServer` you can pass in `allowMutlipleGames: true`
        as in

            var server = new GameServer({
              allowMultipleGames: true,
              subId: "ABC",  // <= make this different for each GameServer
            });

        This will let 2 or more GameServers connect for a particular game.
        This is useful for example for running a game across multiple machines.

        Each game still runs on its own but it can pass players to other
        games by calling `NetPlayer.switchPlayer(subId, data)` where
        `subId` is the id of the game

        The `NetPlayer` in this game will disconnect and a `playerconnect` message
        will get emitted in the game corresponding to `subId`.

        Example: Imagine you have 3 machines AAA, BBB, and CCC. Imagine they
        are arranged next to each other like this

             +-------------+  +-------------+  +-------------+
             |             |  |             |  |             |
             |             |  |             |  |             |
             |     AAA     |  |     BBB     |  |     CCC     |
             |             |  |             |  |             |
             |             |  |             |  |             |
             +-------------+  +-------------+  +-------------+

        Let's say you have a platforming game, when the player hits
        the right edge of the screen on machine AAA you'd call

            netPlayer.switchGame("BBB");

        and machine BBB's GameServer will get a 'playerconnect' event
        with that player. You can send data that will get delivered
        to machine BBB with the `playerconnect` event by adding any
        JSONable object as the 2nd argument to `switchGame`

        On machine AAA

            if (playerTouchedRightEdge()) {
              netPlayer.switchGame("BBB", {startPosition: "onLeft"});
            }

        On machine BBB

            gameServer.addEventListener('playerconnect', addPlayer);

            function addPlayer(netPlayer, name, data) {

               if (!data) {
                  // There's no data so this player probably just connected
               } else {
                  // This player is switching from another game
                  // where should we start them?
                  var startX = (data.startPosition == "onLeft") 0 : width;
               }
            };

        New players are always added to the first GameServer that connected to
        HappyFunTimes. After that it's up to you to decide how to pass the players
        amoung games.

        As for setting the `subId` I'd suggest passing one on the URL.

        Note that
        `subId` **should not be a number**. This is because HappyFunTimes
        assigns a number to each GameServer. You can use that number as a `subId`
        when calling `NetPlayer.switchGame` but you can't guarantee which
        GameServer is using which number. At some point I'll probably add
        a way to query what other `GameServer`s are available and you can
        try to auto-configure your game but for now pass in your own unique
        `subId` when creating each `GameServer` and use those `subId`s when
        calling `NetPlayer.switchPlayer`.

        See [hft-jumpabout](http://github.com/greggman/hft-jumpabout/) for
        a working example

    *   Support for more templated files

        Sometimes it's important that HappyFunTimes can insert information into
        your files at runtime. This way it can always serve the correct code
        for the version of HappyFunTimes you're running.

        For `game.html` and `controller.html` this is done automatically. If
        you'd like other files to have info inserted you can add a
        `happyFunTimes.templateUrls` field to your `package.json`



