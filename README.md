HappyFunTimes
=============

[![Build Status](https://travis-ci.org/greggman/HappyFunTimes.svg?branch=master)](https://travis-ci.org/greggman/HappyFunTimes)

# Want to play?

*   [Install HappyFunTimes](http://docs.happyfuntimes.net/install.html)

# Make games with Unity?

*   [Getting Started with Unity](http://docs.happyfuntimes.net/docs/unity/getting-started.html)

# Make games with HTML5?

*   [Get started with a single line script](http://greggman.github.io/hft-gamepad-api)
*   [Make custom controllers](makking-games.md)

# Docs

*   [Docs](http://docs.happyfuntimes.net/docs)

# Other

*   [Home Page](http://docs.happyfuntimes.net/)
*   [Changelist](docs/changelist.md)
*   [License](LICENSE.md)

# Support

*   [Developer Mailing List](https://groups.google.com/d/forum/hft-dev)
*   [Blog](http://blog.happyfuntimes.net)
*   [Facebook Group](https://www.facebook.com/groups/timesfunhappy/)

<img id="test" src="http://docs.happyfuntimes.net/images/scene-00-jumpjump.jpg" width="782" height="441" />

[HappyFunTimes](http://greggman.github.io/HappyFunTimes/) is a system for playing party games that are meant to be
played with a bunch of people in the same room and 1 ideally large display.

<img id="test" src="http://docs.happyfuntimes.net/images/scene-04-boomboom.jpg" width="782" height="441" />

People participate in the game using their smartphone by going to a webpage
provided by the game. The webpage lets them use their phone as a controller.
This lets you make games that support more than the typical 4 players.

<img id="test" src="http://docs.happyfuntimes.net/images/scene-01-powpow.jpg" width="782" height="441" />

I suppose theoretically there's no limit to the number of players.

<img id="test" src="http://docs.happyfuntimes.net/images/400-player-bombbomb.jpg" width="782" height="441" />

It also lets you make games with unique controllers.

<img id="test" src="http://docs.happyfuntimes.net/images/scene-02-jamjam.jpg" width="782" height="441" />

There's a Unity3D library if you'd like to make the game in Unity3D.

<img id="test" src="http://docs.happyfuntimes.net/images/scene-03-unity.jpg" width="782" height="441" />

*   The smartphones end up just being smart controllers.

    As there is just one machine running the *real* game this means
    they are relatively easy to create. No crazy networking, state syncing,
    or dead reckoning required.

*   JavaScript libraries for the browser and Unity3D libraries are provided

    This makes it easy to bang out a game. Use any JavaScript framework or Unity3D.

*   For controllers the sky is the limit.

    *   Have a one button game. The user touches their screen.

    *   Make virtual DPads

    *   Make virutal paddle controllers (think Pong)

    *   Have users choose answers to question like Jeopardy

    *   Access the camera, send selfies to the game.

    *   Emit sound effects from the phone

    *   Use the device orientation API and rotate something in game to match

    *   Make a rhythm band where each device becomes an instrument.

    *   Make a rhythm game like Parappa but each person is a different color
        so that they each have to play their part at the right time

    *   Let the user draw something on their phone. Insert that drawing into the game.

    *   Show diagrams. Let the user plan out football plays.

    *   Controllers can change dynamically.

        Have 2 dpads for the dual stick part of your game. Have a single
        button for the speed contest. Change to a 3 letter box to let a player
        enter their high score initials.

*   The API is simple to use (for some defintion of *simple* :D).

    Games create a `GameServer` object

       var server = new GameServer();

    From that point on anytime a player connects the GameServer will emit an event
    `playerconnect`

       server.addEventListener('playerconnect', createNewPlayer);

    It's up to you what to do when a new player connects. For example if you had a `Player`
    object you might do something like this

       var players = [];

       Player = function(netPlayer) {
         this.netPlayer = netPlayer;  // remember this Player's NetPlayer
       };

       // make a new Player anytime the 'playerconnect' event is emitted
       function createNewPlayer(netPlayer) {
         players.push(new Player(netPlayer));
       }

    If the player disconnects or quits the `NetPlayer` will emit a `disconnect` event.
    If we want to handle that we might do something like

        Player = function(netPlayer) {
          this.netPlayer = netPlayer;  // remember this Player's NetPlayer

          netPlayer.addEventListener('disconnect', Player.prototype.remove.bind(this));
        };

        Player.prototype.remove = function() {
          players.splice(players.indexOf(this), 1);  // remove ourselves from our array of players.
        };

    We can send events to the player's phone by calling `netPlayer.sendCmd` For example

        Player.prototype.score = function(points) {
          this.netPlayer.sendCmd('score', {points: points});
        };

    That will cause an event `score` to be emitted on the player's phone. The player's phone
    has a correspondiing `sendCmd` function. When called an event will be emitted on that
    player's `NetPlayer` object.  Add listeners for any events you make up

        Player = function(netPlayer) {
          this.netPlayer = netPlayer;  // remember this Player's NetPlayer

          netPlayer.addEventListener('disconnect', Player.prototype.remove.bind(this));
          netPlayer.addEventListener('moveleft', Player.prototype.moveleft.bind(this));
          netPlayer.addEventListener('moveright', Player.prototype.moveright.bind(this));
          netPlayer.addEventListener('jump', Player.prototype.jump.bind(this));
        };

    Whatever data you pass to `sendCmd` will arrive with the event.

        ...
        this.netPlayer.sendCmd('die', {
          reason: "So and so killed you",
          pointsToLose: 100,
        });

    On the phone we create a `GameClient`

        var client = new GameClient();

    Just like `NetPlayer` above we can listen for events.

        client.addEventListener('score', handleScore);

        function handleScore(data) {
          console.log("you got " + data.points + " points");
        }

    Similarly you can send events to the game

        window.addEventListener('pointerdown', function(e) {
           client.sendCmd('jump', { power: e.mouseY });
        });

    It's up to you to decide which events to send and receive for your particular
    game's needs.

*   There is also a synchronized clock across machines.

    Use it as follows.

        var online = true;
        var clock = SyncedClock.createClock(online);

        ...

        var timeInSeconds = clock.getTime();

    If online is false when the clock is created it will create a clock
    that returns the local time.

## Limitations

The number of players that can connect to a game is limited by your networking
equipment. With enough access points there's no limit to the number of player
that could connect that I know of but of course 1000s of players would require
lots of access points and lots of bandwidth and a game design that lets 1000s of people
actually participate.

Another limit in the default mode is players must be on the same network behind
a NAT. This is standard for most if not all home routers. It's probably less standard in
office setups. In this mode you start HappyFunTimes, tell your users to connect to
your WiFi and then have them go to `happyfuntimes.net`.

HappyFunTimes has the option to run it's own DNS which is another option but
requires configuring your router. This option is probably more suited to
events, installations, and things like that. In this mode, players connect
to the WiFi specificaly setup to run HappyFunTimes. iOS devices will automatically
find HappyFunTimes once connected to the WiFi, no other interaction required by the user.
Android devices require the user to first connect to the WiFi and then go to any random
url like `hft.com` or `h.com`.

Notes
-----

*   How secure is this?

    Not at all. This is not a library for the internet. It's a library for
    running a game at a party, meeting, bar, etc...

    That said if there's anything easy and performant you'd like to suggest
    submit a pull request.

*   What about cheating?

    Again, this is meant for games where everyone is in the same room watching
    the same display. If someone is off in the corner trying to hack the game
    through the net maybe you shouldn't have invited them to your party.

    That said if there's anything easy and performant you'd like to suggest
    submit a pull request.

*   Does it work on Windows, OSX, and Linux?

    The controllers of course run in any modern browser. Games run in
    whatever environment you've created them for. Most of the samples here
    are HTML and so should run in any modern browser on any platform.

    As for happyFunTimes I've run it on OSX, Linux and Windows with
    no problems.

*   Why not WebRTC?

    WebRTC would possibly allow the phones to talk directly the game rather than through
    the happyfuntimes. happyfuntimes would need to setup a rendevous between the 2 machines
    but after that the conncetion should be peer to peer.... Or so I'm lead to believe.
    WebRTC still doesn't currently exist in iOS Safari as of iOS8. It does exist in Chrome.

    Feel free to submit a pull request ;-)

To Do
-----

[There's lots of ideas](todo.md).
