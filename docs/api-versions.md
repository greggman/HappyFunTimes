Title: API Versions
Description: What each version of HappyFunTimes adds or changes

In the `package.json` you set an `apiVersion`. The versions follows
the [semver](http://semver.org) standard meaning version 1.2.x is
supposed to be backward compatible with 1.1.x but 2.0.x is NOT
backward compatible.

As much as possible I'm trying to make it so you must set the
correct API version. Features not available for the version
you request will not be available to your game. This is so
the user will know to upgrade happyfuntimes to run your
game. Otherwise they'll try to run your game and it will just
fail because you're counting on newer features.

To use a feature below be sure to set your apiVersion to
the correct version


*   v1.1.0

    *   Unity no longer needs a gameId in the code.

*   v1.2.0

    *   Supports es6 features. This feature is not extensively
        tested but, if you name a file ending in `.js6` happyFunTimes
        will automatically transpile it into es5 at runtime

        So for example to use you might do

            requirejs([
              './some-es5-file.js`,
              './some-es6.file.js6`,
            ], function(
              SomeES5File,
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
        [Download here](http://docs.happyfuntimes.net/install.html)

* v1.4.0

    *   Support for multiple `GameServer`s on one game

        Normally if 2 `GameServer`s from the same game try to connect to HappyFunTimes
        the second one will disconnect the first one and become the **one** GameServer
        running the game.

        The thinking there was if there is already a game running and HappyFunTimes
        sees another try to start it probably means you left a window open somewhere
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

    *   --no-ask-name

        For installations where you don't need to display the user's name
        you can add --no-ask-name when you start the system and players
        will not be asked enter their name.

* v1.5.0

    *   MobileHacks.adjustCSSBasedOnPhone

        iOS8 broke things because unlike iOS7, with the phone in landscape, if the user
        touches the bottom 1/2 inch of the screen or the top 1/2 inch of the screen the
        address bar and shortcut bar appear AND NEVER DISAPPEAR from that point on.

        That means the usable area of the browser is much smaller than iOS7 and controllers
        that were visible in iOS7 are now covered by the bottom bar. There is no way to
        handle this in CSS so we needed a way to check for a specific phone and change
        the CSS programatically.

* v1.6.0

    *   CommonUI.setStatus, CommonUI.log, CommonUI.error

        These work the same as the corresponding GameSupport functions
        except for the controller.

* v1.7.0

    *   Can put controller files in Assets/WebPlayerTemplates/HappyFunTimes

* v1.8.0

    *   Added `hft-landscape` and `hft-landscape-rot90` CSS

* v1.9.0

    *   Added id tracking

* v1.10.0

    *   Added app support
    *   Added fullscreen support for Android
    *   Added orientation handling for Android and the app

* v1.11.0

    *   Games can provide files for controller.

        When calling `new GameServer' the options you
        pass in now has a `files` field. You can use it to
        provide files for the controller. As a simple example

            options.files["controller.html"] = controllerHTMLContent;
            options.files["scripts/controller.js"] = controllerJSContent;
            options.files["css/controller.css"] = controllerCSSContent;

        This allows the game to provide all the files HappyFunTimes
        to server to the controller so that no external files are
        needed.

    *   GameClient now has both a `log` and an `error`

        These functions work just like `console.log` and `console.error`
        except they also send the message back to the game. The game
        will print out the message. This is useful for testing or debugging
        but *BEWARE*

        1.  Messages use bandwidth.

            So for example if you're checking for checking for an error that
            rarely happens then no problem but if you're printing some
            info often for testing you should remove or comment out the
            line before using your controller with real users.

        2.  They can't help with JavaScript errors.

            If your JavaScript has an error then JavaScript stops running and
            of course the JavaScript needed to send messages will not be
            running either.

            The point is even though this is convenient remember that just
            because you don't see any errors in the game doesn't mean
            there aren't errors in your controller. Remember to use
            remote debugging in Safari and Chrome to debug.

* v1.12.0

    *   Made `Touch.setupVirtualDPads` use the middle of the referenceElement if
        `offsetX` or `offsetY` is not set for that dpad.

        This is better because it means if things change size based on CSS or other
        stuff there's nothing to do. The code will just work.

* v1.13.0

    *   Added `orientationOptional` to `CommonUI.setupStandardControllerUI`

        Setting it to true makes the commonUI not tell the user to orient their
        phone if their phone doesn't support orientation. Example usage is
        are the device orientation examples. They want the phone to be in
        portrait but as of iOS 8.3 Safari doesn't support orientation. So
        the message that used to come up would be confusing as the user
        orients their phone.

* v1.14.0

    *   Fixed `gamedisconnect` message so in includes id of game that disconnected

        When doing a multi-machine game, when a game disconnects a `gamedisconnect`
        message is sent to all the remaining games. It was missing the id
        of the game that disconnected. That's been added.

* v1.15.0

    *   Choose a position for connect info

        As of HappyFunTimes 0.0.36 you can use `--instructions` to disable
        a banner showing how to connect. Now you can use `--instructions-position=bottom`
        or `top` to set the position of the instructions. You can also add
        `"instuctionsPosition": "bottom"` to the `happyFunTimes` section of your
        `package.json` file to set it per game. The default is top.
