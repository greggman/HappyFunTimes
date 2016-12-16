Title: Writing Games
Description: Making Games with HappyFunTimes

If you're doing it in JavaScript use any game framework you want, copy one of the examples,
or write from scratch but a few *rules*. If you're doing it in Unity3D or any other language
you should still follow the info below.

The easist way to get started is to clone one of the existing games.

### Contents

* [Available example games](#available-example-games)
* [Using an example Game](#using-an-example-game)
* [The Game](#the-game)
* [The Controller](#the-controller)
    * [Dealing with different device sizes](#dealing-with-different-device-sizes)
* [Player Handling](#player-handling)
    * [Handling Player Names](#handling-player-names)
* [Communication between Game and Controllers](#communication-between-game-and-controllers)
    * [From Game to Controllers](#send-commands-from-the-game-to-controllers)
    * [From Controllers to the Game](#send-commands-from-the-controller-to-the-game)

---

## Available example Games

*   [Clean](http://github.com/greggman/hft-clean)
    The simplest example with no other libraries. Just moves dots around.

*   [Simple](http://github.com/greggman/hft-simple)
    The simplest example using hft-sample-ui. Just moves dots around.

*   [JumpJump](http://github.com/greggman/hft-jumpjump)
    A simple platform game written in JavaScript using WebGL / TDL

*   [BoomBoom](http://github.com/greggman/hft-boomboom)
    A bomb placing game written in JavaScript using WebGL / TDL

*   [PowPow](http://github.com/greggman/hft-powpow)
    A space wars game written in JavaScript using WebGL / TDL

*   [FlutterBy](http://github.com/greggman/hft-garden)
    Fly butterflies using device orientation and acceleration

*   [FaceClap](http://github.com/greggman/hft-faceclap)
    A multiplayer rythym game

## Using an example Game

For example to clone JumpJump you'd type

    git clone https://github.com/greggman/hft-jumpjump.git

This should clone game into the folder `hft-jumpjump`.

Or alternatively click one of the links above and click "Download ZIP" on the right side of the page and
then unzip it.

Make sure you have [node.js installed](http://nodejs.org). Then...

    cd hft-jumpjump
    npm install
    npm start

---

## The Controller

Controllers are the component that runs on the mobile devices. This part must be
written in HTML/JavaScript as that's kind of the point. It needs to run on the
device without requiring the user to install anything.

`contoller.html` is served to the phone. You supply it and any libraries you
want to use with it. Most of the samples use the [`hft-sample-ui`](https://github.com/greggman/hft-sample-ui)
library which provides common UI features like the settings icon in the top right corner, name input, cross
platform orientation support and a few other things.

The only "required" part of a controller is that you include happyfuntimes in some
method or another. You could use

    <script src="../node_modules/happyfuntimes/dist/hft.js">

In which case the happyfuntimes API will appear as a global `hft`.

Or other methods like [webpack](https://webpack.github.io) or [require.js](http://requirejs.org/)
etc. Most of the samples use require.js.

    requirejs([
        '../node_modules/happyfuntimes/dist/hft',
      ], function(hft) {

      ...

    });

However you get a reference to happyfuntimes you need to create an instance
of `GameClient`

    const GameClient = hft.GameClient;
    const g_client = new GameClient();

### Send Commands from the Controller to the Game

Each time the player interacts with the controller, the controller may send the input to
the game. This can be touch operations, the use of a gamepad, button clicks or text
input.

In your script you can send a command by using the following code:

    g_client.sendCmd('foo', { someNumber: 123, someString, "abc", someBool: true});

Then in in the game you would create an event listener that listens for the command:

    g_server.on('foo', handleFoo);

    function handleFoo(data) {
       console.log(JSON.stringify(data));
    };

This example would print the following to the browser console of the game:

    {"someNumber":123,"someString":"abc","someBool":true}

It's up to you to decide what commands to send to the game from your controller. The most
common would be to send commands related to player input like touching or releasing a button,
entering a name, orienting their phone, whatever messages you want to send.

---

## The Game

The game component is what is displayed on the big screen that is visible to all players
at the same time. By default all the HTML5 games have the game in `game.html`. `game.html`
is just a regular HTML5 file and it's up to you to supply it with scripts and libraries
and whatever else you need to create your game. At a minimum you need to include
happyfuntimes. You can do this with a script tag if that's what you're used to

    <script src="../node_modules/happyfuntimes/dist/hft.js">

Of course because we're running in Electron you can also use require as in

    const hft = require('happyfuntimes');

Or many of the samples use [`require.js`](http://requirejs.org/) as it can make it
easier to share code with the controllers.

    const requirejs = require('requirejs');
    requirejs.config({
      nodeRequire: require,
      baseUrl: __dirname,
    });

    requirejs([
        'happyfuntimes',
      ], function(hft) {

      ...

    });


However you get a reference to happyfuntimes you need to create an instance
of `GameServer` and then listen for players to connect.

    const server = new hft.GameServer();

    server.on('playerconnect', someFunctionThatCreatesAPlayer);

---

### Handling Players

From the code above the line `server.addEventListener('playerconnect', someFunctionThatCreatesAPlayer);`
specifies taht `someFunctionTheCreatesAPlayer` will be called any time a new player connects to the game.
It get's passed a `NetPlayer` object which represents the connection between your game and a player's phone.

Simple handling of players might look like this:

    var players = [];  // Array of all players

    // Make a "class" Player.
    class Player {
      constructor(netPlayer) {
        this.netPlayer = netPlayer;

        // at a minimum handle disconnecting
        netPlayer.on('disconnect', this.handleDisconnect.bind(this));
      }
      handleDisconnect() {
        var index = players.indexOf(this);
        if (index >= 0) {
          players.splice(index, 1);  // removes this player from the list of players
        }
      };
    }

    function someFunctionThatCreatesAPlayeer(netPlayer, name) {
       // create a new player and add it to our array of players.
       players.push(new Player(netPlayer, name));
    }

As you can see we create a `Player` class that is used to store all data and functions
for a connected player.

### Send Commands from the Game to Controllers

In your game code use the `NetPlayer` for a particular player. Using the Player class from above
we might do something like

    class Player {

      ...

      someFunction() {
         this.netPlayer.sendCmd('bar', { someColor: "red"});
      }

      ...

Then in the controller you'd create an event listener that listens to the command:

    g_client.on('bar', handleBar);

    function handleBar(data) {
      document.body.style.backgroundColor = data.someColor;
    }

`data` will contain whatever is sent from `sendCmd`, in this example an object with the
property `someColor`.

It's up to you to decide what messages to send from the game to the controller. Examples include
telling the controller to display a message like "You Win" or "You Died". Telling the phone to
switch modes like "Enter next move" or "Select location on map". Telling the phone to change
color or which avatar to display. Telling the phone to play a sound, etc...

---

Next step: [Tips for writing Games](tips.md)
