Making games with HappyFunTimes
===============================

If you're doing it in JavaScript use any game framework you want, copy one of the examples,
or write from scratch but a few *rules*. If you're doing it in Unity3D or any other language
you should still follow the info below.

Steps to Game!
--------------

Install [hft-cli](..). Now open a commmand prompt or terminal and type.

    hft

It should print list of commands. This is just to check that it's working. If it not make sure
you add it to your path.

The easist way to get started is to clone one of the existing games. Pick from

[JumpJump](http://github.com/greggman/hft-jumpjump) A simple platform game written in JavaScript using WebGL / TDL

[BoomBoom](http://github.com/greggman/hft-boomboom) A bomb placing game written in JavaScript using WebGL / TDL

[PowPow](http://githib.com/greggman/hft-powpow) A space wars game written in JavaScript using WebGL / TDL

[Deviceorientation](http://github.com/greggman/hft-deviceorientation) A device orientation sample written in JavaScript using WebGL / Three.js

[Unitychararacterexample](http://github.com/greggman/hft-unitycharacterexample) A Unity3D example that spawns characters written in UnityScript.

[Unitysimple](http://github.com/greggman/hft-simple) A Unity3D example that just positions a sphere for each player written in C#.

For example to clone JumpJump you'd type

    git clone https://github.com/greggman/hft-jumpjump.git

This should clone game into the folder `hft-jumpjump`.

After cloning you must edit `package.json`. At a minimum change the `gameId` to something original like

    "gameId": "MyAwesomePartyGame",

Choose something original unlikely to clash with other games since ids must be unique.
The id may only use A-Z 0-9 _ and -. No spaces. No other punctuation or non alpha numerica characters.

You'll probably also want to edit the `name` and `description`.

If your game is in Unity3D find the PlayerSpawner script and set the `gameId` to match.

Finally cd to the folder you cloned to and add the game. In our example

    cd hft-jumpjump
    hft add

It should say game added. Now run HappyFunTimes. You should see your game added.

Making the Controller
---------------------

Controllers are the part that runs on the phone. This part MUST be written
in HTML/JavaScript as that's kind of the point. It needs to run on the phone
with out requiring the user to install anything.

There are 3 main files for a controller

    controller.html           // The HTML for your controller
    css/controller.css        // The CSS for your controller
    scripts/controller.js     // The main script for your controller

All of these files inserted into a template at runtime. The template provides
common UI features like the settings icon in the top right corner, name input,
and support for switching games.

The CommonUI currently consists of the gear menu top right of the display as well
has handling of name editing, disconnecting, and auto switching to the new games.

All JavaScript in HappyFunTimes uses [requirejs](http://requirejs.org) to load and
reference files.


    The minimum contents of a `controller.js` is

        "use strict";

        // Start the main app logic.
        requirejs(
          [ 'hft/gameclient',
            'hft/commonui',
            'hft/misc/misc',
            'hft/misc/mobilehacks',
          ], function(
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
        });

Currently the rest is up to you. Add HTML elements as you see fit. Read HTML events and
call `g_client.sendCmd` to pass whatever events you want back to the game. Add listeners
with `g_client.addEventListener` for any events you want to send from the game back to the
controller.

The hardest part (working on a solution) is handling CSS and placement across browser versions
and devices. For example iOS6.1, iOS7.0 and iOS7.1 all provide a different size usable area
in Safari. On top fo that 3.5inch iPhones vs 4inch iPhones provide a different usable area.
And finally add Android on top of that and possibly iPad and other tablets and you can see
this is the hardest part. If you happen to be on a Mac the iOS Simulator is your friend.


Writing the Game
----------------

Games can be written in any language although currently only library for JavaScript and
Unity3D exist (working on more)

Games in JavaScript
-------------------

For a game in JavaScript there are 3 main files

    game.html           // The HTML for your game
    css/game.css        // The CSS for your game
    scripts/game.js     // The main script for your game

These files are loaded into a template at runtime. The template provides the following features

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

    When I want to test with real controllers I remove the `haveServer:false`. That
    way the game continues to run even when a controller window has the focus.

    The minimum contents of a `game.js` is

        "use strict";

        requirejs(
          [ '../../../scripts/gameserver',
            '../../../scripts/gamesupport',
            '../../../scripts/misc/misc',
          ], function(
            GameServer,
            GameSupport,
            Misc) {

          // You can set these from the URL with
          // http://localhost:8080/games/<gameid>/gameview.html?settings={name:value,name:value}
          var globals = {
            haveServer: true,
            debug: false,
          };
          Misc.applyUrlSettings(globals);

          var server;
          if (globals.haveServer) {
            server = new GameServer();

            server.addEventListener('playerconnect', someFunctionThatCreatesAPlayer);
          }

          GameSupport.init(server, globals);

          // Your init code goes here.

          ...

          var mainloop = function() {

             // your game's main loop code goes here.
          };

          GameSupport.run(globals, mainloop);
        });

*  GameSupport will set `globals.elapsedTime` to the time in seconds that have elapsed since the last
   call to your mainloop. `globals.gameTime` is the time since the game started.
   `global.frameCount` is the number of times your main loop has been called.



