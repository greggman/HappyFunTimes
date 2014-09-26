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
        the second one will disconnect the first one and become the **one** GameServer
        running the game.

        The thinking there was if there is already a game running and HappyFunTimes
        see another try to start it probably means you left a window open somewhere
        or some how the old game didn't get disconnected from HappyFunTimes so
        you probably want the new one to take charge.

        Now though, in your options to `GameServer` you can pass in `allowMutlipleGames: true`
        as in

            var server = new GameServer({
              allowMultipleGames: true,
              id: "ABC",  // <= OPTIONAL make this different for each GameServer
            });

        This will let 2 or more GameServers connect for a particular game.
        This is useful for example for running a game across multiple machines.

        Each game still runs on its own but it can pass players to other
        games by calling `NetPlayer.switchPlayer(id, data)` where
        `id` is the id of the game.

        The `NetPlayer` in this game will disconnect and a `playerconnect` message
        will get emitted in the game corresponding to `id`.

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
        among games.

        See [hft-jumpabout](http://github.com/greggman/hft-jumpabout/) for
        a working example

        ### Setting the id for the game.

        As for setting the `id` I'd suggest passing one on the URL. If you don't
        pass in an id one will be assigned. The assigned id is passed
        through the `gameid` message. You'll only get this message if you
        don't assign your own id.

            var server = new GameServer({
              allowMultipleGames: true,
            });

            server.addEventListener({'gameid', function(data) {
              console.log("this game's id is: ' + data.id);
            });

        Conversely, there can only be 1 game per id. So if you assign
        your own ids anytime the same id is used the previous game using
        that id will be disconnected.

        ### Talking between games

        Unlike players where there's a 'playerconnect' msg sent each time a
        player connects and a `NetPlayer` object to represent that player, Games have
        no corresponding events nor do they have an object.

        If you'd like other games to know when a new game has connected have
        that new game call `GameServer.broadcastCmdToGames` and a message
        will be send to all games. Any message sent from a game to another
        game will have the id of the sender as the second parameter to the
        handler.

        On Game AAA

            var server = new GameServer({
              allowMultipleGames: true,
              id: "ABC",
            });

            server.broadcastCmdToGames('alive');

        On Game BBB

            server.addEventListener('alive', function(data, id) {
              console.log("other game's id is: " + id);
            });

        Note you'll receive this message yourself
        so you'll need to filter out matching ids.

            var server = new GameServer({id: "foo"});
            server.broadcastCmdToGame('alive');

            var otherGameIds = {};
            server.addEventListner('alive', function(data, id) {
              if (id != "foo") {
                otherGameIds[id] = true;
              }
            });

        To find out when a game disconnects check for the `gamedisconnect`
        message

            server.addEventListener('gamedisconnect', function(data, id) {
                delete otherGameIds[id];
            });

        Once you know an `id` of another game
        you can send a message directly to that game by
        calling `GameServer.sendCmdToGame(cmd, idOfGame, data)`

        That command will arrive on the `GameServer` for that game.

        Of course you're free to make your own tracking objects
        if you want something similar to NetPlayer.
        [I don't recommend it](http://blog.happyfuntimes.net/blog/why-no-netgame-object/).

    *   Support for more templated files

        Sometimes it's important that HappyFunTimes can insert information into
        your files at runtime. This way it can always serve the correct code
        for the version of HappyFunTimes you're running.

        For `game.html` and `controller.html` this is done automatically. If
        you'd like other files to have info inserted you can add a
        `happyFunTimes.templateUrls` field to your `package.json`



