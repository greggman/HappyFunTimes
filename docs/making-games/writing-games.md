Title: Writing Games
Description: Making Games with HappyFunTimes

If you're doing it in JavaScript use any game framework you want, copy one of the examples,
or write from scratch but a few *rules*. If you're doing it in Unity3D or any other language
you should still follow the info below.

The easist way to get started is to clone one of the existing games.

### Contents

* [Available example games](#available-example-games)
* [Using an example Game](#using-an-example-game)
* [The Controller](#the-controller)
    * [controller.js](#controller-js)
    * [Dealing with different device sizes](#dealing-with-different-device-sizes)
* [The Game](#the-game)
    * [game.js](#game-js)
    * [game.html](#game-html)
* [Player Handling](#player-handling)
    * [Handling Player Names](#handling-player-names)
* [Communication between Game and Controllers](#communication-between-game-and-controllers)
    * [From Game to Controllers](#send-commands-from-the-game-to-controllers)
    * [From Controllers to the Game](#send-commands-from-the-controller-to-the-game)

---

## Available example Games

*   [JumpJump](http://github.com/greggman/hft-jumpjump)  
    A simple platform game written in JavaScript using WebGL / TDL

*   [BoomBoom](http://github.com/greggman/hft-boomboom)  
    A bomb placing game written in JavaScript using WebGL / TDL

*   [PowPow](http://github.com/greggman/hft-powpow)  
    A space wars game written in JavaScript using WebGL / TDL

*   [Simple](http://github.com/greggman/hft-simple)  
    The simplest example. Just moves dots around.

*   [Deviceorientation](http://github.com/greggman/hft-deviceorientation)  
    A device orientation sample written in JavaScript using WebGL / Three.js

*   [Unitychararacterexample](http://github.com/greggman/hft-unitycharacterexample)  
    A Unity3D example that spawns characters written in UnityScript.

*   [Unitysimple](http://github.com/greggman/hft-simple)  
    A Unity3D example that just positions a sphere for each player written in C#.

## Using an example Game

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

---

## The Controller

Controllers are the component that runs on the mobile devices. This part must be
written in HTML/JavaScript as that's kind of the point. It needs to run on the
device without requiring the user to install anything.

`contoller.html` is inserted into a template at runtime. The template provides
common UI features like the settings icon in the top right corner, a name input
and support for switching games.

The CommonUI currently consists of the gear menu top right of the display as well
has handling of name editing, disconnecting, and auto switching to the new games.

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

### Dealing with different device sizes

The hardest part of creating a controller is handling CSS and placement across browser
versions and devices. There are thousands of different mobile devices from mobile
phones to tablets that all have different screens sizes and software running, resulting
in thousand of different viewport sizes. The viewport is the actual space of a browser
that is available for the controller: screen size minus notification bar minus the browsers
URL bar and other elements.

#### Possible solution for newer devices

If you want to support newer devices with browsers that are actually up to date, you may
use CSS viewport units. Viewport units use the actual size of the devices' viewport to calculate
the width or height or an element. 
This means that if you use viewport units like `10vh` instead of fixed values like `60px`, the
elements height will be equally larger on all devices instead of very large on 4" phones and pretty
small on 10" tablets.

**Example**  
A controller element gets the following CSS styling:

    .box {
        width: 50vh;
        height: 50vh;
    }

The elements height and with will equal 50% of the available viewport size.

`50vh` equals `50%` of the browser size. `10vh` would equal `10%`.

If you want to know which browsers support viewport units, see [this overview](http://caniuse.com/#feat=viewport-units).
Make sure to set the units for each portrait and landscape mode.

---

## The Game

The game component is what is displayed on the big screen and that is visible to all players
at the same time. The `game.js` file must contain some code to initialize the game and run
the corresponding HFT server for controllers to connect.

### game.js

The minimum content of the `game.js` file is

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

GameSupport will set `globals.elapsedTime` to the time in seconds that have elapsed
since the last call to your mainloop. `globals.gameTime` is the time since the game
started.  
`global.frameCount` is the number of times your main loop has been called.

### game.html

game.html is loaded into a template at runtime. The template provides the following features

*   Handles displaying a disconnected message if the game gets disconnected from the
    HFT server.
*   Will display an FPS meter if `showFPS` is set to `true`.
*   Provides a requestAnimationFrame based mainloop callback.
*   Provides an `elapsedTime` and `frameCount`.  
    The elapsed time is in seconds since the last frame and is limited to being no longer
    than 1/20th of a second. Otherwise if you pause the game for a few seconds you'd get
    a giant elapsedTime and your game would probably break.
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

*   Will optionally pause when the game does not have the focus.

    Games running at 60fps eat up battery like crazy. Normally on modern OSes with fancy
    compositied desktops, bringing your editor to the front is not enough to tell an app
    to stop rendering.
    Therefore HFT games will stop rendering if they are not in the focus of the user.

    If you have the Chome developer tools open and they have the focus, the game will stop.
    That can be confusing. Simiarly, if you are debugging controllers by opening other
    browser windows / tabs the game will stop when you try to use the controller.

    You can make the game playable without controllers by passing `haveServer: false`. If
    you see that the init code will spawn 2 players with `LocalNetPlayer` for their
    `NetPlayer`. You may then setup some keyboard or mouse input to generate events on
    the `LocalNetPlayer` which the player code will see as inputs from a controller.

    This means you can play the game by going to the game's URL like
    
        http://localhost:18679/games/jumpjump/game.html?settings={haveServer:false}

    When you want to test with real controllers you remove the `haveServer:false`. That
    way the game continues to run even when a controller window has the focus.

---

### Handling Players

Remember the line `server.addEventListener('playerconnect', someFunctionThatCreatesAPlayer);`
from the `game.js` file? That function is used to register players. It get's passed a
`NetPlayer` object which represents the connction between your game and a player's device.

Simple handling of players might look like this:

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

As you can see we created a Player class that is used to store all data and functions
for a connected player. You may also move this class to a separate file and add it
to the `requirejs` function. This is a good practise to keep your game files small and 
clear.

### Handling Player Names

The CommonUI allows the player to choose a name. That name is sent when the player connects
but the player can set their name anytime by choosing the wrench menu and selecting "Set Name".

Two messages are sent from the controller to the game: `busy` and `setName`.

`busy` indicates the player is on system menu which means they are not playing at the moment.
It will be passed an object with `busy:true` or `busy:false` when they enter and exit the system
menus.

It's up to you to decide if you care. For example maybe you'd like to remove them from the game when you
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

---

## Communication between Game and Controllers

To exchange data or send events from the game to the controllers or input from the
controller back to the game, use simple JavaScript events. Both the game and controllers
use event listeners to react to emitted events.

### Send Commands from the Game to Controllers

The game can send commands to individual players only. To send a command like a broadcast 
to all players, you have to loop trough all players and send the command to each player
individually.

In `game.js` you can send a command by using the following code:

    someNetPlayer.sendCmd('bar', { someColor: "red"});

Then in `controller.js` you have to create an event listener that listens to the command:

    g_client.addEventListener('bar', handleBar);
    
    function handleBar(data) {
      document.body.style.backgroundColor = data.someColor;
    }

`data` will contain whatever is sent from `sendCmd`, in this example an object with the
property `someColor`.
A command may also be empty to toggle global events like the start of a new round.
 
### Send Commands from the Controller to the Game 

Each time the player interacts with his controller, the controller may send the input to
the game. This can be touch operations, the use of a gamepad, button clicks or text
input.

In `controller.js` you can send a command by using the following code:

    g_client.sendCmd('foo', { someNumber: 123, someString, "abc", someBool: true});

Then in `controller.js` you have to create an event listener that listens to the command:

    g_server.addEventListener('foo', handleFoo);
    
    function handleFoo(data) {
       console.log(JSON.stringify(data));
    };

This example would print the following to the browser console of the game:

    {"someNumber":123,"someString":"abc","someBool":true}

---

Next step: [Tips for writing Games](tips.md)
