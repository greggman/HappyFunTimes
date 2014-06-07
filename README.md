HappyFunTimes
=============

[Home Page](http://greggman.github.io/HappyFunTimes/).

<img id="test" src="images/scene-00-jumpjump.jpg" width="782" height="441" />

[HappyFunTimes](http://greggman.github.io/HappyFunTimes/) is a library for making party games that are meant to be
played with a bunch of people in the same room and 1 ideally large display.

<img id="test" src="images/scene-04-boomboom.jpg" width="782" height="441" />

People participate in the game using their smartphone by going to a webpage
provided by the game. The webpage lets them use their phone as a controller.
This lets you make games that support more than the typical 4 players.

<img id="test" src="images/scene-01-powpow.jpg" width="782" height="441" />

I suppose theoretically there's no limit to the number of players.

<img id="test" src="images/400-player-bombbomb.jpg" width="782" height="441" />

It also lets you make games with unique controllers.

<img id="test" src="images/scene-02-jamjam.jpg" width="782" height="441" />

There's a Unity3D library if you'd like to make the game in Unity3D.

<img id="test" src="images/scene-03-unity.jpg" width="782" height="441" />

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

*   The API is simple to use.

    Basically there are 2 libraries and a webserver.

    `gameserver.js` provides a library that runs in the game that tracks players joining or
    leaving the game. It lets the game receive input from those players and
    send messages to them. (There's a Unity version of this library)

    `gameclient.js` provides a library that lets smartphones (browsers) connect to the game and
    send and receive messages. (There is NO Unity version of this library as the whole
    point is anyone with a smartphone should be able to play immediately, no need to
    install anything).

    `server.js` is a node.js based webserver. At a basic level all it does is relay
    messages to and from the smartphones and the game.

    Once connected, anytime a player (smartphone) connects to the game the game
    will get a `playerconnect` event and passed a NetPlayer object. After that
    any message the player's smartphone sends generates a corresponding event
    in the game on that NetPlayer. Conversely, any message the game sends to a
    NetPlayer object generates a corresponding event on the smartphone that corresponds to
    that NetPlayer.

    You can think of it this way. In the game (the code displaying the game on a large screen)

    When a player connects `gameserver` will generate an event. `playerconnect`. So

        gameServer.addEventListener('playerconnect', someFunctionToMakeANewPlayer);

        var someFunctionToMakeAPlayer = function(netplayer) {
          // Generate a new player and remember netplayer.
          ...
        };

    The users's webpage (smartphone) can send any command it wants by calling `GameClient.sendCmd`. Example

        gameClient.sendMsg('move', { x: 10, y: 20 });

    Back in the game, the corresponding `netplayer` will get an event.

        var someFunctionToHandleMove = function(data) {
           console.log("You got a move event: " + data.x + "," + data.y);
        };

        netPlayer.addEventListener('move', someFunctionToHandleMove);

    Conversely you can send messages back to the user's display by sending commands on the corresponding `netplayer`

        netPlayer.sendCmd('scored', { points: 200 });

    That player's `gameclient` will get that event

        var someFunctionToHandleScoring = function(data) {
           console.log("You scored " + data.points + " points!");
        };

        gameclient.addEventListener('scored', someFunctionToHandleScoring);

    A simple client might look like this

        <h1 id="status">status</h1>
        <div id="input" style="width: 300px; height: 300px; border: 1px solid black;"></div>
        <script src="utils/input.js"></script>
        <script src="gameclient.js"></script>
        <script>
        var score = 0;
        var statusElem = document.getElementById("status");
        var inputElem = document.getElementById("input");
        var client = new GameClient({ gameId: "simple" });

        var randInt = function(range) {
          return Math.floor(Math.random() * range);
        };

        client.addEventListener('connect', function() {
          statusElem.innerHTML = "you've connected to the relayserver";
        });

        client.addEventListener('disconnect', function() {
          statusElem.innerHTML = "you were disconnected from the relayserver";
        });

        // Sends a move command to the game.
        //
        // This will generate a 'move' event in the corresponding
        // NetPlayer object in the game.
        var sendMoveCmd = function(position) {
          client.sendCmd('move', {
            x: position.x,
            y: position.y,
          });
        };

        // Pick a random color
        var color =  'rgb(' + randInt(256) + "," + randInt(256) + "," + randInt(256) + ")";

        // Send the color to the game.
        //
        // This will generate a 'color' event in the corresponding
        // NetPlayer object in the game.
        client.sendCmd('color', {
          color: color,
        });
        inputElem.style.backgroundColor = color;

        // Send a message to the game when the screen is touched
        inputElem.addEventListener('touchmove', function(event) {
          sendMoveCmd(input.getRelativeCoordinates(event.target, event.touches[0]));
          event.preventDefault();
        });

        inputElem.addEventListener('mousemove', function(event) {
          sendMoveCmd(input.getRelativeCoordinates(event.target, event));
        });

        // Update our score when the game tells us.
        client.addEventListener('scored', function(cmd) {
          score += cmd.points;
          statusElem.innerHTML = "You scored: " + cmd.points + " total: " + score;
        });
        </script>

    A simple game would be something like this

        <style>
        #playfield {
          position: relative;
          width: 332px;
          height: 332px;
          border: 1px solid black;
        }
        .visual {
          position: absolute;
          width: 32px;
          height: 32px;
          border: 1px solid black;
          border-radius: 16px;
        }
        }
        </style>
        <h1 id="status"></h1>
        <div id="playfield"></div>
        <script src="gameserver.js"></script>
        <script>
        var statusElem = document.getElementById("status");
        var container = document.getElementById("playfield");
        var itemSize = 16;
        var playfieldWidth = 300;
        var playfieldHeight = 300;

        var randInt = function(range) {
          return Math.floor(Math.random() * range);
        };

        var pickRandomPosition = function() {
          return {
            x: randInt(playfieldWidth),
            y: randInt(playfieldHeight),
          };
        };

        var Visual = function(container) {
          this.element = document.createElement('div');
          this.element.className = "visual";
          container.appendChild(this.element);
        };

        Visual.prototype.setColor = function(color) {
          this.element.style.backgroundColor = color;
        };

        Visual.prototype.updatePosition = function(position) {
          this.element.style.left = position.x + "px";
          this.element.style.top  = position.y + "px";
        };

        Visual.prototype.remove = function() {
          this.element.parentNode.removeChild(this.element);
        };

        var Goal = function(container) {
          this.visual = new Visual(container);
          this.visual.setColor("red");
          this.pickGoal();
          this.radiusesSquared = itemSize * 2 * itemSize;
        };

        Goal.prototype.pickGoal = function() {
          this.position = pickRandomPosition();
          this.visual.updatePosition(this.position);
        };

        Goal.prototype.hit = function(otherPosition) {
          var dx = otherPosition.x - this.position.x;
          var dy = otherPosition.y - this.position.y;
          return dx * dx + dy * dy < this.radiusesSquared;
        };

        var Player = function(netPlayer, name, container) {
          this.netPlayer = netPlayer;
          this.name = name;
          this.visual = new Visual(container);
          this.position = pickRandomPosition();
          this.visual.updatePosition(this.position);

          netPlayer.addEventListener('disconnect', Player.prototype.disconnect.bind(this));
          netPlayer.addEventListener('move', Player.prototype.movePlayer.bind(this));
          netPlayer.addEventListener('color', Player.prototype.setColor.bind(this));
        };

        // The player disconnected.
        Player.prototype.disconnect = function() {
          this.netPlayer.removeAllListeners();
          this.visual.remove();
        };

        Player.prototype.movePlayer = function(cmd) {
          this.position.x = cmd.x;
          this.position.y = cmd.y;
          this.visual.updatePosition(this.position);
          if (goal.hit(this.position)) {
            // This will generate a 'scored' event on the client (player's smartphone)
            // that corresponds to this player.
            this.netPlayer.sendCmd('scored', {
              points: 5 + randInt(6), // 5 to 10 points
            });
            goal.pickGoal();
          }
        };

        Player.prototype.setColor = function(cmd) {
          this.visual.setColor(cmd.color);
        };

        var server = new GameServer({ gameId: "simple" });
        var goal = new Goal(container);

        server.addEventListener('connect', function() {
          statusElem.innerHTML ="you've connected to the relayserver";
        });

        server.addEventListener('disconnect', function() {
          statusElem.innerHTML = "you were disconnected from the relayserver";
        });

        // A new player has arrived.
        server.addEventListener('playerconnect', function(netPlayer, name) {
          new Player(netPlayer, name, container);
        });
        </script>

*   There is also a synchronized clock across machines.

    Use it as follows.

        var online = true;
        var clock = SyncedClock.createClock(online);

        ...

        var timeInSeconds = clock.getTime();

    If online is false when the clock is created it will create a clock
    that returns the local time.

Unity Version
-------------

See [Unity Docs](docs/unitydocs.md)

Running the Examples
--------------------

*   Clone the repo
*   Install [node.js](http://nodejs.org). I was using 0.10.26
*   Open a shell/terminal/command prompt
*   cd into the root of the repo you cloned (eg. `cd HappyFunTimes`)
*   type `npm install` which will install needed node modules locally
*   type `node server/server.js` which will start the server.

Open a browser window and go to `http://localhost:8080/games.html` and choose a game.
In other window (preferably a window, not a tab), go to `http://localhost:8080` and
choose the game.

If you have other computers or smartphones on the same network look up the ip address of
the machine running the game (see `ifconfig` on OSX/Linux, the Network Preferneces on OSX,
or `ipconfig` on Windows) then go to `http://ipaddress:8080` from those machines.
For example on my home network it was `http://192.168.2.9:8080`

You can simulate other machines joining the game by opening more windows
or tabs in your browser.

Note: There is no reason the machine running the relayserver needs to be the same as the
machine running the game. Also, if the machine is accessable from the internet
you don't need to be on the same network. Of course there will be far more lag over
the internet or especially over cellular networks but depending on the type of game that
might be ok.

Windows docs
------------

[Some Windows docs here](docs/windows.md)

Making your own original game
-----------------------------

[See Making Games](docs/makinggames.md)

Example Notes and tips
----------------------

Here's [a few notes on the provided examples](docs/examples.md) as well as [a few tips](docs/tips.md)
that have come up while making the examples.

Setting up for a Party
-------------------------------------------

See [Making It Simple For Players To Get Started](docs/network.md)

Folder structure
----------------

    +-server   // code for node based relayserver
    |
    +-public   // the folder served by the relayserver
    | |
    | +-scripts  // The HappyFunTime JavaScript Library
    | |
    | +-3rdparty  // Various 3rdparty JavaScript libs
    | |
    | +-examples  // the examples
    |   |
    |   +-scripts  // libraries shared by some of the examples, not part of HappyFunTimes
    |   |
    |   +-<example> // each example
    |     |
    |     +-scripts  // scripts specific to this example
    |     |
    |     +-assets   // assets for the specific example
    |
    +-Unity3D  // Unity3D lib
      |
      +-Examples  // Unity3D examples
      |
      +-Extras    // Other files the examples need but that aren't part of HappyFunTimes
      |
      +-src       // The HappyFunTimes library for Unity3D

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

*   Does it work on Windows and Linux?

    The clients of course run in any modern browser. The game also runs in
    whatever environment you've created them for. Most of the samples here
    are HTML and so should run in any modern browser on any platform.

    As for the relayserver I've run it on OSX, Linux and Windows with
    no problems.

*   Why not WebRTC?

    WebRTC would possibly allow the phones to talk directly the game rather than through
    the relayserver. The relayserver would need to setup a rendevous between the 2 machines
    but after that the conncetion should be peer to peer.... Or so I'm lead to believe.

    Feel free to submit a pull request ;-)

Attribution
-----------

See [attribution](docs/attribution.md)

To Do
-----

[There's lots of ideas](todo.md).
