Making games with HappyFunTimes
===============================

If you're doing it in JavaScript use any game framework you want, copy one of the examples,
or write from scratch but a few *rules*. If you're doing it in Unity3D you should still
follow the info below.

Getting your game to show up at `/games.html`
---------------------------------------------

Make a folder either in `public/examples` or `public/games`. Example `public/mynewgame`.
I'd recommend keeping filenames all lower case because the internet and webservers are
generally case sensitive.

Inside that folder make a file called `package.json`. This file is the same format
as node.js's npm `package.json`. It might be easiest to copy one of the examples.
This file is read by the server at startup and provides a list of games at `/games.html`.

Edit the file to match your project. For the most part all you need to do is edit the
`name`, `description`, and `screenshotUrl` fields.

A description of the fields is as follows

*    name

     Obvious

*    Description

     Also Obvious?

*    gameUrl (optional)

     The URL relative to `package.json` where the game is. If your game is HTML based
     provide this field.

*    screenshotURL

     The URL relative to `package.json` where your screenshot it.

*    gameType

     The type of game. This should either be `"html"` or `"Unity3d"` at the moment

*    useContollerTemplate

     Should be 'true'. If `true` then `build.py` will generate `index.html` for
     you by inserting `controller.html` into `/templates/controller.index.html`. You
     want this because it's what inserts the standard UI (the gear menu) and
     handling of disconnected and switching controllers to other games automatically.

*    useGameTemplate

     If `true' then `build.py` will generate `gameview.html` for you
     by inserting `game.html` into `/templates/game.gameview.html`. If you're
     making an html based game you should
     most likely set this to true as well as a few other things are handled
     for you.


Getting your controller to use the CommonUI
--------------------------------------------

The CommonUI currently consists of the gear menu top right of the display as well
has handling of name editing, disconnecting, and auto switching to the new games.

The CommonUI provides several features including.

*   Handling the player editing their name.

*   Reloading the controller if the game reloads.

*   Switching to a new game if the current game disconnects and a new game is started.

*   Switching to a menu of games if the current game disconnects there are 2 or more
    games to choose from.

*   Showing the disconnected message if the game disconnects.

To use the ExampleUI in your controller

*   Set or add `"useControllerTemple": true` to your package.json

*   inside your game's folder make a `controller.html` and put just the html for your
    controller's unique needs.  Now run build.py

        ./build.py

    or on Windows

        python build.py

*   make a `<gamefolder>/css/controller.css` file with any css unique to your controller.

*   make a `<gamefolder>/scripts/controller.js` file

    The minimum contents of a `controller.js` is

        "use strict";

        var main = function(
            GameClient,
            CommonUI,
            Misc,
            MobileHacks) {
          var g_client;

          var globals = {
            debug: false,
          };
          Misc.applyUrlSettings(globals);
          MobileHacks.fixHeightHack();

          g_client = new GameClient({
            gameId: "gamename",   // <==-- be sure to set this to your game's id.
          });

          CommonUI.setupStandardControllerUI(g_client, globals);

          // Insert your controller specific code here.
        };

        // Start the main app logic.
        requirejs(
          [ '../../../scripts/gameclient',
            '../../../scripts/commonui',
            '../../../scripts/misc/misc',
            '../../../scripts/misc/mobilehacks',
          ],
          main
        );

Getting your JavaScript game to use the standard game support
-------------------------------------------------------------

I'm not really sure what should be standard for games. Ideally
games should be able to be written in any language and any
environment (Unreal, GameMaker, etc). That makes it hard to
rely on any particular features being available.

If your game is written in HTML/JavaScript though there is
some common support which provides the following features

*   Handles displaying a disconnected message if the game gets disconnected from the relayserver

*   Will display an FPS meter if `showFPS` is set to `true`.

*   Provides a requestAnimationFrame based mainloop callback.

*   Provides an `elapsedTime` and `frameCount`.

    The elapsed time is in seconds since the last frame and is limited to being
    no longer than 1/20th of a second (otherwise if you pause the game for a few
    seconds you'd get a giant elapsedTime and your game would probably break)

*   Will add a few HTML overlays for debugging if `debug` is set to `true`

    * You can display per frame info with

         GameSupport.setStatus(msg);

      For example:

          var globals = {
            debug: true,
          }

          GameSupport.init(server, globals);

          var mainloop = function() {
            var msgs = [];
            msgs.push("elapsedTime: " + globals.elapsedtIme);
            msgs.push("frames: + globals.frameCount);
            GameSupport.setStatus(msgs.join("\n"));
          };

    * You can display to an onscreen console with

       GameSupport.log("hello");
       GameSupport.error("oops");

       These are not that useful given debugging tools in the browser but they can be
       useful on devices for which there is no easily accessable console.

*   Will optionally pause when the game does not have the focus.

    I work on a laptop, often without power. Games, running at 60fps eat up battery
    like crazy. Normally on modern OSes with fancy compositied desktops, bringing
    your editor to the front is not enough to tell an app to stop rendering.

    So, I made it so if the page does not have the focus stop rendering. This means
    when I switch back to my editor the game pause and my battery stops getting eaten.

    Things to note though. If you have the Chome developer tools open and they have the
    focus the game will stop. That can be confusing. Simiarly, if you are debugging
    controllers by opening other browser windows/tabs the game will stop when you try
    to use the controller.

    My workflow is I try to make the game playable without controllers. Usually that's
    by passing in `haveServer: false`. If I see that my init code will spawn 2 players
    with `LocalNetPlayer` for their `NetPlayer`. I'll then setup some keyboard or mouse
    input to generate events on the `LocalNetPlayer` which the player code will
    see as inputs from a controller.

    This means I can play the game just by going to the game's URL like
    `http://localhost:8080/examples/jumpjump/gameview.html?settings={haveServer:false}`.

    For [a live example click here](http://greggman.github.io/HappyFunTimes/public/examples/jumpjump/gameview.html?settings={haveServer:false}).
    use left/right to move, 'Z' to jump.

    When I want to test with real controllers I remove the `haveServer:false`. That
    way the game continues to run even when a controller window has the focus.

To use it.

*   Set or add `"useGameTemple": true` to your package.json

*   inside your game's folder make a `game.html` and put just the html for your
    controller's unique needs. Now run build.py

        ./build.py

    or on Windows

        python build.py

*   make a `<gamefolder>/css/game.css` file with any css unique to your controller.

    NOTE: `<gamefolder>` and `<gamename>` must match.

*   make a `<gamefolder>/scripts/game.js` file

    The minimum contents of a `game.js` is

        "use strict";

        var main = function(
            GameServer,
            GameSupport,
            Misc) {

          // You can set these from the URL with
          // http://path/gameview.html?settings={name:value,name:value}
          var globals = {
            haveServer: true,
            debug: false,
          };
          Misc.applyUrlSettings(globals);

          var server;
          if (globals.haveServer) {
            server = new GameServer({
              gameId: "gamename",  // <==-- be sure this matches your controller
            });

            server.addEventListener('playerconnect', someFunctionThatCreatesAPlayer);
          }

          GameSupport.init(server, globals);

          // Your init code goes here.

          ...

          var mainloop = function() {

             // your game's main loop code goes here.
          };

          GameSupport.run(globals, mainloop);
        };

        // Start the main app logic.
        requirejs(
          [ '../../../scripts/gameserver',
            '../../../scripts/gamesupport',
            '../../../scripts/misc/misc',
          ],
          main
        );

*  GameSupport will set `globals.elapsedTime` to the time in seconds that have elapsed since the last
   call to your mainloop. `globals.gameTime` is the time since the game started.
   `global.frameCount` is the number of times your main loop has been called.



