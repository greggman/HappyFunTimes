Making games with HappyFunTimes
===============================

### Table of Contents

*   **[Setting up for devlopment](#setting-up-for-development)**
*   **[Running Games During Development](#running-games-during-development)**
*   **[Writing Games](#writing-games)**
    *   **[Making the controller (phone part)](#making-the-controller)**
    *   **[requirejs](#requirejs)**
    *   **[controller.js](#controller-js)**
    *   **[Dealing with different phone sizes](#dealing-with-different-phone-sizes)**
*   **[Games in JavaScript](#making-a-game)**
    *   **[game.js](#game-js)**
    *   **[Handling Players](#handling-players)**
*   **[package.json](#packagejson)**
    *   **[Required Fields](#required-fields)**
*   **[Files](#files)**
*   **[HFT Commands](commands.md)**
*   **[Other Languages](#other-languages)**
*   **[Ideas](ideas.md)**
*   **[Misc](#misc)**
*   **[Future Features](future.md)**


## Setting up for development

I'm sorry there's so many steps. It's not as hard as it looks. Trust me.

### TL;DR version

*   install happyfuntimes (http://superhappyfuntimes.net/install)
*   run happyfuntimes (it must be run once)
*   install node.js (http://nodejs.org/download/)
*   if on windows install msysgit (http://msysgit.github.io/)
*   install bower `sudo npm install -g bower` (no sudo on windows)
*   install hft-cli `sudo npm install -g hft-cli` (no sudo on windows)
*   clone a game
*   edit `package.json`, change `gameId` and `name`
*   type `hft-add`

### Verbose vesrion

*   Install HappyFunTimes (http://superhappyfuntimes.net/install)

    On Windows you might run into security issues: [See here](windows.md).

    **IMPORTANT** You can **NOT** have 2 installations of happyFunTimes.

    So, if you install above do NOT clone the happyfuntimes repo.

    If you clone the repo do NOT install happyfuntimes with the installer.

    Note: There is no reason to clone the repo AFAIK unless you want to
    contribute to happyfuntimes itself. For making games installing
    with the installer is fine.

    If you accidentally install twice you'll need to delete the configuration
    files because they'll be pointing to one installation.

        OSX: ~/Library/Application Support/HappyFunTimes
        Windows: /Users/<name>/AppData/Local/Greggman/HappyFunTimes or
             or  /Users/<name>/AppData/Roaming/Greggman/HappyFunTimes
        Linux: ~/.happyfuntimes

    After that either run happyfuntimes from the installer to make that
    the installation or type `node start.js --app-mode` from the
    cloned folder if you're using a cloned repo.

*   Install [node.js](http://nodejs.org/download/).

*   If on Windows install msysgit (http://msysgit.github.io/)

    when asked choose to ["Use Git from the Windows Commmand Prompt"](../images/msysgit-option-01.png).

*   Open a shell/terminal/command prompt

    on Windows open a [node.js command prompt](../images/node-js-command-prompt.png).

*   Install Bower.

    Type `npm install -g bower`.

    Don't forget that `-g`. Also you might need `sudo` on OSX or Linux

*   Install hft-cli.

    Type `npm install -g hft-cli`

    Don't forget that `-g`. Also you might need `sudo` on OSX or Linux

*   Clone a game. [Pick one from the list](examples.md)

    for example, assuming you have git installed

        git clone https://github.com/greggman/hft-simple.git

    Or you can download a zip. For example if you go to
    http://github.com/greggman/hft-simple you should see a "Download ZIP"
    button on the right side.

*   cd into the root of the repo you cloned or you unzipped.

    (eg. `cd hft-simple`)

*   type `bower install` which will install needed javascript modules locally

    This step is only needed for some games. If there is no `bower.json`
    in the folder you can skip this step.

*   edit the `package.json` file and change the `gameId` and `name` to something unique.

    Note: If you are collaborating on a game don't change this stuff. Only change it
    if you're making a new game based off of an existing game.

*   add the game to happyfuntimes

    type `hft add`

*   Run happyfuntimes

    You can run it by clicking its icon from when you installed it in step 1
    or you can run it by typing `hft start --app-mode`

## Running Games during development

For HTML based games you can always just run them from happyfuntimes. Launch it,
pick your game. For Unity3D see [the unity docs](unitydocs.md).

Alternatively run happyfuntimes with one of the methods above and in your
browser window and go to `http://localhost:18679/games.html` and choose a game.
In other window go to `http://localhost:18679`.  Note use a window, not a tab
so you can see both at the same time.

You can simulate other machines joining the game by opening more windows
or tabs in your browser.

<img src="../images/windows-for-controllers.jpg" width="840" height="525" />

Inside happyfuntimes, games with `(*)` by their name are games in development. In other words
they are games you used `hft add` to add to happyfuntimes. Games without the `(*)` are games
that were installed from inside happyfuntimes by going to [superhappyfuntimes.net](http://superhappyfuntimes.net)
and installing them.

If you have other computers or smartphones **on the same network** go to `http://happyfuntimes.net`
and they *should* connect to your game. Alternatively you can lookup the ip address of
the machine running the game (see `ifconfig` on OSX/Linux, the Network Preferneces on OSX,
or `ipconfig` on Windows) then go to `http://ipaddress:18679` from those machines.
For example on my home network it was `http://192.168.2.9:18679`. For installations, museums,
and places with no internet consider [setting up for instant connect](network.md).

## Writing Games

If you're doing it in JavaScript use any game framework you want, copy one of the examples,
or write from scratch but a few *rules*. If you're doing it in Unity3D or any other language
you should still follow the info below.

The easist way to get started is to clone one of the existing games. Pick from

*   [JumpJump](http://github.com/greggman/hft-jumpjump) A simple platform game written in JavaScript using WebGL / TDL

*   [BoomBoom](http://github.com/greggman/hft-boomboom) A bomb placing game written in JavaScript using WebGL / TDL

*   [PowPow](http://githib.com/greggman/hft-powpow) A space wars game written in JavaScript using WebGL / TDL

*   [Simple](http://githib.com/greggman/hft-simple) The simplest example. Just moves dots around.

*   [Deviceorientation](http://github.com/greggman/hft-deviceorientation) A device orientation sample written in JavaScript using WebGL / Three.js

*   [Unitychararacterexample](http://github.com/greggman/hft-unitycharacterexample) A Unity3D example that spawns characters written in UnityScript.

*   [Unitysimple](http://github.com/greggman/hft-simple) A Unity3D example that just positions a sphere for each player written in C#.

For example to clone JumpJump you'd type

    git clone https://github.com/greggman/hft-jumpjump.git

This should clone game into the folder `hft-jumpjump`.

Or alternatively click one of the links above and click "Download ZIP" on the right side of the page and
then unzip it.

After cloning you must edit `package.json`. At a minimum change the `gameId` to something original like

    "gameId": "MyAwesomePartyGame",

Choose something original unlikely to clash with other games since ids must be unique.
The id may only use A-Z 0-9 _ and -. No spaces. No other punctuation or non alpha numerica characters.

You'll probably also want to edit the `name` and `description`.

Finally cd to the folder you cloned to and add the game. In our example

    cd hft-jumpjump
    hft add

It should say game added. Now run HappyFunTimes. You should see your game added.

### Making the Controller

Controllers are the part that runs on the phone. This part MUST be written
in HTML/JavaScript as that's kind of the point. It needs to run on the phone
with out requiring the user to install anything.

These files are **REQUIRED** for all happyfuntimes games

    controller.html           // The HTML for your controller
    css/controller.css        // The CSS for your controller
    scripts/controller.js     // The main script for your controller
    package.json              // The data about your game.
    screenshot.png            // At least one screenshot 640x480 is good
    icon.png                  // An icon, 128x128

`contoller.html` is inserted into a template at runtime. The template provides
common UI features like the settings icon in the top right corner, name input,
and support for switching games.

The CommonUI currently consists of the gear menu top right of the display as well
has handling of name editing, disconnecting, and auto switching to the new games.

### requirejs

Currently most JavaScript in HappyFunTimes use [requirejs](http://requirejs.org) to load and
reference files. Requirejs is awesome because it provides both dependency injection
and a module system.

If you'd prefer to use a more traditional `<script>` tags [see example](http://github.com/greggman/hft-simple-script/).

### controller.js

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

      g_client = new GameClient();

      CommonUI.setupStandardControllerUI(g_client, globals);

      // Insert your controller specific code here.
    });

Currently the rest is up to you. Add HTML elements as you see fit. Read HTML events and
call `g_client.sendCmd` to pass whatever events you want back to the game. Add listeners
with `g_client.addEventListener` for any events you want to send from the game back to the
controller.

    g_client.sendCmd('foo', { someNumber: 123, someString, "abc", someBool: true});

Will emit a message on the corresponding `NetPlayer` in the game.

    g_server.addEventListener('foo', handleFoo);

    function handleFoo(data) {
       console.log(JSON.stringify(data));
    };

Prints the following in the JavaScript console.

    {"someNumber":123,"someString":"abc","someBool":true}

Similary any message sent by the game

    someNetPlayer.sendCmd('bar', { someColor: "red"});

Will emit an event back in the controller.

    g_client.addEventListener('bar', handleBar);

    function handleBar(data) {
      document.body.style.backgroundColor = data.someColor;
    }

### Dealing with different phone sizes

The hardest part of creating a controller (I have ideas for a solution) is handling
CSS and placement across browser versions
and devices. For example iOS6.1, iOS7.0 and iOS7.1 all provide a different size usable area
in Safari. On top fo that 3.5inch iPhones vs 4inch iPhones and newer provide a different usable area.
And finally add Android on top of that and possibly iPad and other tablets and you can see
this is the hardest part.

Be sure to test before you demo! If you happen to be on a Mac the iOS Simulator that
comes with XCode is your friend.

## Games in JavaScript

For a game in JavaScript, on top of the controller files there are 3 main files **REQUIRED**

    game.html           // The HTML for your game
    css/game.css        // The CSS for your game
    scripts/game.js     // The main script for your game

game.html is loaded into a template at runtime. The template provides the following features

*   Handles displaying a disconnected message if the game gets disconnected from happyfuntimes

*   Will display an FPS meter if `showFPS` is set to `true`.

*   Provides a requestAnimationFrame based mainloop callback.

*   Provides an `elapsedTime` and `frameCount`.

    The elapsed time is in seconds since the last frame and is limited to being
    no longer than 1/20th of a second (otherwise if you pause the game for a few
    seconds you'd get a giant elapsedTime and your game would probably break)

*   Will add a few HTML overlays for debugging if `debug` is set to `true`

    *   You can display per frame info with

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

    *   You can display to an onscreen console with

            GameSupport.log("hello");
            GameSupport.error("oops");

        These are not that useful given debugging tools in the browser but they can be
        useful on devices for which there is no easily accessable console. Note that
        you can get a remote debug from both [iOS devices and the iOS simulator](https://developer.apple.com/library/safari/documentation/AppleApplications/Conceptual/Safari_Developer_Guide/Safari_Developer_Guide.pdf)
        and similarly in [Chrome on Android](https://developer.chrome.com/devtools/docs/remote-debugging).

        In both cases you connect the phone by USB cable. Run the webpage, launch your browser, pick
        the correct options and have access to the full suite of developer tools remotely. See links
        above for details.

*   Will optionally pause when the game does not have the focus.

    I work on a laptop, often without power. Games, running at 60fps eat up battery
    like crazy. Normally on modern OSes with fancy compositied desktops, bringing
    your editor to the front is not enough to tell an app to stop rendering.

    So, I made it so if the page does not have the focus then stop rendering. This means
    when I switch back to my editor the game pauses and my battery stops getting eaten.

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
    `http://localhost:18679/games/jumpjump/game.html?settings={haveServer:false}`.

    When I want to test with real controllers I remove the `haveServer:false`. That
    way the game continues to run even when a controller window has the focus.

### game.js

    The minimum contents of a `game.js` is

        "use strict";

        requirejs(
          [ 'hft/scripts/gameserver',
            'hft/scripts/gamesupport',
            'hft/scripts/misc/misc',
          ], function(
            GameServer,
            GameSupport,
            Misc) {

          // You can set these from the URL with
          // http://localhost:18679/games/<gameid>/gameview.html?settings={name:value,name:value}
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

*   GameSupport will set `globals.elapsedTime` to the time in seconds that have elapsed since the last
    call to your mainloop. `globals.gameTime` is the time since the game started.
    `global.frameCount` is the number of times your main loop has been called.

### Handling Players

Note in the code above we register a function `someFunctionThatCreatesAPlayer` to be called
anytime a player connects. That function get's passed a `NetPlayer` object which represents
the connction between your game and a player's phone.

Simple handling of players might be something like

    var players = [];  // Array of all players

    // Make a "class" Player.
    function Player(netPlayer, name) {
      this.netPlayer = netPlayer;
      this.name = name;

      // at a minimum handle disconnecting
      netPlayer.addEventListener('disconnect', Player.prototype.handleDisconnect.bind(this));
    }

    Player.prototype.handleDisconnect = function() {
      var index = players.indexOf(this);
      if (index >= 0) {
        players.splice(index, 1);  // removes this player from the list of players
      }
    };


    function someFunctionThatCreatesAPlayeer(netPlayer, name) {
       // create a new player and add it to our array of players.
       players.push(new Player(netPlayer, name));
    }

After that it's up to you. Add other event handlers for messages from the phone

    ...
        netPlayer.addEventListener('move', Player.prototype.handleMove.bind(this));
    ...

    Player.prototype.handleMove = function(data) {
      this.position.x += data.x;
      this.position.y += data.y;
    };

That code assumes there's corresponding code in `controller.js` something like

    g_client.sendCmd('move', {x: someDeltaX, y: someDeltaY});

Similarly send messages to the phone with

       this.netPlayer.sendCmd('boom', {powerLevel: somePowerLevel});

And back in `controller.js`

    g_client.addEventListener('boom', handleBoom);

    funciton handleBoom(data) {
       // do something with data.powerLevel
    }

### handling names

The CommonUI allows the player to choose name. That name is sent when the player connects
but the player can set their name anytime by choosing the wrench menu and picking "Set Name".

Two messages are sent, `busy` and `setName`.

`busy` indicates the player is on system menu which means they are not playing at the moment.
It will be passed an object with `busy:true` or `busy:false` when they enter and exit the system
menus.

Its up to you to decide if you care. For example maybe you'd like to remove them from the game when you
receive the message something like

        netPlayer.addEventListener('busy', Player.prototype.handleBusyMsg.bind(this));

    Player.prototype.handleBusyMsg = function(data) {
       if (data.busy) {
          // the player is on the system menu
          player.hidden = true;
          player.collisionsOff = true;
       } else {
          player.hidden = false;
          player.collisionsOn = true;
       }
    };

`setName` indicates the player has chosen a new name. If the name is blank you can send a name
back to the controller.

        netPlayer.addEventListenter('setName', Player.prototype.handleSetNameMsg.bind(this));

    Player.prototype.handleSetNameMsg = function(data) {
      player.name = data.name || "The Unknown Solider";

      // If we picked name send it back to the phone
      if (!data.name) {
        this.netPlayer.sendCmd('setName', {name: player.name});
      }
    };


## package.json

This file defines some data about your game. It is a JSON file and JSON has a very strict format.

*   No trailing commmas.

    Good

       {
         "a": 123,
         "b": 456
       }

    Bad

       {
         "a": 123,
         "b": 456,
       }

*   No comments! JSON is NOT JavaScript.

*   All Strings and identifiers must be quoted. The only things not quoted are numbers and `true`, `false`,
    and `null`.

*   It's case sensitive. `"HappyFunTimes"` is NOT the same as `"happyFunTimes"`

### Required fields

A standard package.json looks like this

    {
      "name": "JumpJump",
      "description": "A game with Jumping",
      "version": "0.0.2",
      "private": false,
      "dependencies": {
      },
      "happyFunTimes": {
        "gameId": "jumpjump",
        "category": "game",
        "apiVersion": "1.3.0",
        "gameType": "html",
        "minPlayers": 1
      }
    }

*   `name`

    A name for your game. Used on the main screen of HappyFunTimes and SuperHappyFunTimes

*   `description`

    A description. Used on superhappyfuntimes. No HTML allowed currently.

*   `version`

    Used on superhappyfuntimes so users can know if there is a newer version for them to download.

*   `happyFunTimes.gameId`

    This is the id for your game. Every game on superhappyfuntimes must have a unique id.
    only A-Z, 0-9, _, - are allowed and no more than 60 charactera.

*   `happyFunTimes.apiVersion`

    This is the happyFunTimes API version needed by this game. If this number is higher
    than the version of happyFunTimes the user has installed they will be asked to upgrade.
    It is also used by happyFunTimes to provide the correct API for the game.

*   `happyFunTimes.gameType`

    This is used by happyFunTimes to figure out how to deal with the game. For example
    how to launch the game and how to publish it.  Currently only
    2 values are valid

    *   `html`
    *   `Unity3D`

*   `happyFunTimes.minPlayers`

    How many players are required to play this game. For example, jumpjump you can play with
    one player. It's probably not any fun but you can player. boomboom on the otherhand
    requires 2 players. It will not start until there are 2 players.

    This is only used on the superhappyfuntimes to set expectations. If you have a game that requires
    10 players please consider marking it here.

*   `happyFunTimes.category`

    This is also only used on superhappyfuntimes to set expections and hopefully to, um, categories
    things. Current values

    *   `game` A game
    *   `example` Not a game, not really meant to be played, just an example
    *   `demo` Not a game, something else like an exhibit, possibly not playable without more stuff

*   `happyFunTimes.useScriptTag`

    True indicates you don't want to use requirejs instead you want to use `<script>` tags. Your `apiVerison`
    must be `1.3.0` or higher

    I really like [require.js](http://requirejs.org) style of modules. It encourages
    dependency injection, it also suppots module independence. But, for many it's non
    standard and they're not used to it.

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
    `scripts/controller.js` for your controller. If you need any other scripts
    (like three.js or pixi.js or jquery) add script tags to
    either `game.html` or `controller.html`.  The HappyFunTimes libraries will be inserted before
    those tags. The `game.js` or `controller.js` will be inserted after.

    See example: http://github.com/hft-simple-script/

##Files

### Favicon

If you have a `favicon.png/jpg/gif` in your game's root folder it will be used for your favicon.
If it does not exist your `icon.png/jpg/gif` will be used.

##Other Languages

Coming Soon. Techinally games can be written in any language although currently only library for JavaScript and
Unity3D exist (working on more)





