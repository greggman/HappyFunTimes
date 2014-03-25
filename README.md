HappyFunTimes
=============

HappyFunTimes is a library for making party games that are meant to be
played with a bunch of people in the same room and 1 ideally large display.

People participate in the game using their smartphone by going to a webpage
provided by the game. The webpage lets them use their phone as a controller.
This lets you make games that support more than the typical 4 players.

*   The smartphones end up just being smart controllers.

    As there is just one machine running the *real* game this means
    they are relatively easy to create. No crazy networking, state syncing,
    or dead reckoning required.

*   JavaScript libraries for the browser and Unity3D libraries are provided

    This makes it easy to bang out a game

*   For controllers the sky is the limit.

    Ideas

    *   Have a one button game. The user touches there screen.

    *   Make virtual DPads

    *   Make virutal paddle controllers (think Pong)

    *   Have users choose answers to question like Jeopardy

    *   Access the camera, send selfies to the game.

    *   Use the device orientation API and rotate something in game to match

    *   Make a rhythm band where each device becomes an instrument.

*   The API is simple to use.

    Basically there are 2 libraries and a websocket webserver.

    `gameserver.js` provides a library that runs in the game that tracks players joining or
    leaving the game and lets the game receive input from those players and
    send messages to them. (There's a Unity version of this library)

    `gameclient.js` provides a library that lets smartphones connect to the game and
    send and receive messages. (There is NO Unity version of this library as the whole
    point is anyone with a smartphone should be able to play immediately, no need to
    install anything).

    `server.js` is a node.js based webserver. At a basic level all it does is relay
    messages to and from the smartphones and the game.

    Once connected, anytime a player (smartphone) connects to the game the game
    will get a 'playerconnect' event and passed a NetPlayer object. After that
    any message the player's smartphone sends generates a corresponding event
    in the game on that NetPlayer. Conversely, any message the game sends to a
    NetPlayer object generates a corresponding event on the smartphone that corresponds to
    that NetPlayer.

    You can think of it this way. In the game (the code displaying the game on a large screen)

    When a player connects `gameserver` will generate an event. `playerconnected`. So

        gameServer.addEventListener('playerconnect', someFunctionToMakeANewPlayer);

        var someFunctionToMakeAPlayer = function(netplayer) {
          // Generate a new player and remember netplayer.
          ...
        };

    The users's webpage (smartphone) can send any command it wants by calling `gameClient.sendCmd`. Example

        gameClient.sendMsg('move', { x: 10, y: 20 });

    Back in the game, the corresponding `netplayer` will get an event.

        netPlayer.addEventListener('move, someFunctionToHandleMove);

        var someFunctionToHandleMove = function(data) {
           console.log("You got a move event: " + data.x + "," + data.y);
        }

    Conversely you can send messages back to the user's display by sending commands on the `netplayer`

        netPlayer.sendCmd('scored', { points: 200; });

    That player's `gameclient` will get that event

        gameclient.addEventHandler('scored', someFunctionToHandleScoring);

        var someFunctionToHandleScoring = function(data) {
           console.log("You scored " + data.points + " points!");
        }

    A simple client looks like this

        <script src="gameclient.js"></script>
        <script>
        var gameName = "simple";
        var client = new GameClient(gameName);

        client.addEventListener('connected', function() {
          console.log("you've connected to the relayserver");
        };

        client.addEventListener('disconnected', function() {
          console.log("you were disconnected from the relayserver");
        };

        // Send a message to the game when the screen is touched
        window.addEventListener('touchmove', function(event) {
          client.sendCmd({
            cmd: 'move',
            x: event.touches[0].pageX,
            y: event.touches[0].pageY,
          });
        });

        client.addEventListener('scored', function(cmd) {
          console.log("You scored: " + cmd.points);
        });

        </script>

    A simple game looks like this

        <style>
        #playfield {
          position: relative;
          width: 300px;
          height: 300px;
          border: 1px solid black;
        }
        .player {
          position: absolute;
          width: 15px;
          height: 15px;
          color: red;
        }
        </style>
        <div id="playfield">
        </div>
        <script src="gameserver.js"></script>
        <script>
        var players = [];

        var Goal = function() {
            this.pickGoal();
            this.radiusSquared = 15 * 15;
        };

        Goal.prototype.pickGoal = function() {
          this.x = Math.random() * 300;
          this.y = Math.random() * 300;
        };

        Goal.prototype.hit = function(x, y) {
          var dx = x - this.x;
          var dy = y - this.y;
          return dx * dx + dy * dy < this.radiusSquared;
        };

        var Player = function(netPlayer, name, container) {
          this.netPlayer = netPlayer;
          this.name = name;
          this.container = container;
          this.x = 0;
          this.y = 0;

          this.element = document.createElement('div');
          this.element.class = "player";
          container.appendChild(this.element);
          this.updatePosition();

          netPlayer.addEventListener('disconnect', Player.prototype.disconnect.bind(this));
          netPlayer.addEventListener('move', Player.prototype.movePlayer.bind(this));
        };

        Player.prototype.disconnect = function() {
          this.container.removeChild(this.element);
          for (var ii = 0; ii < players.length; ++ii) {
            var player = players[ii];
            if (player === this) {
              players.splice(ii, 1);
              return;
            }
          }
        };

        Player.prototype.updatePosition = function() {
          this.style.left = this.x + "px";
          this.style.top  = this.y + "px";
          if (hitGoal()) {
            pickGoal();
            this.netPlayer.sendCmd('die', {
              points: 10,
            });
          }
        };

        Player.prototype.movePlayer = function(cmd) {
          this.x = cmd.x;
          this.y = cmd.y;
        };

        var gameName = "simple";
        var server = new GameServer(gameName);
        var goal = new Goal();

        server.addEventListener('connected', function() {
          console.log("you've connected to the relayserver");
        };

        server.addEventListener('disconnected', function() {
          console.log("you were disconnected from the relayserver");
        };

        server.addEventListener('playerconnected', function(netPlayer, name) {
          players.push(new Player(netPlayer, name));
        };

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

See [Unity Docs](unitydocs.md)

Running the Examples
--------------------

*   Clone to repo
*   Install [node.js](http://nodejs.org). I was using 0.10.26
*   cd into the root of the repo you cloned (eg. `cd HappyFunTimes`)
*   type `npm install` which will install needed node modules locally
*   type `node server/server.js` which will start the server.

Open a browser window and go to `http://localhost:8080/` and choose a game
In other window (preferable a window, not a tab), go to `http://localhost:8080` and
choose the corresponding controller.

If you have other computers or smartphones on the same network look up the ip address of
the machine running the game (see `ifconfig` on OSX/Linux or `ipconfig` on Windows) then
go to `http://ipaddress:8080` from those machines. For example on my home network it was
`http://192.168.1.12:8080`

You can simulate other machines joining the game but opening more windows (preferred)
or tabs in your browser.

Note: There is no reason the machine running the relayserver needs to be the same as the
machine running the game. Also, if the machine is accessable from the internet
you don't need to be on the same network. Of course there will be far more lag over
the internet or especially over cellular networks but depending on the game that
might be ok.

Windows docs
------------

[Some Windows docs here](windows.md)

Making It Simple For Players To Get Started
-------------------------------------------

Asking players to connect to a local network and then type in some obscure URL like
`http://169.234.174.30:8080` is arguably too many steps.

One solution is to make the computer running the relayserver a WiFi hotspot. On OSX this is
as simple as picking **Create Network...** from the WiFi menu. After that you run a DHCP
server and a DNS server. The DHCP server tells machines connecting to your network that
you're who they should ask for DNS. The DNS server redirects all traffic to your machine.

Once setup you can tell players to connect their phone to your network and then go to
any webpage and it will come up.

Here's a terse version of the steps needed

    # OSX 10.9.2
    # create network
    # ifconfig until ipaddress
    # edit extras/osx/bootpd.plist so it mataches address ipaddres
    # backup /etc/bootpd.plist
    cp extras/osx/bootpd.plist /etc/bootpd.plist
    sudo /usr/libexec/bootpd -d -i en0
    sudo node dns-server.js
    sudo node server/server.js --port 80

Note: iOS and OSX have this "feature" where when when they connect to a new network
they'll check if they can [access some page at apple.com](http://www.apple.com/library/test/success.html)).
If they can nothing special happens. If they can NOT access the page but instead get a
different page they assume there is some kind of login screen, called a [Captive Portal](http://en.wikipedia.org/wiki/Captive_portal).
In that case they launch a custom WebView and show the page.

Unfortunately the steps above do not seem to trigger this behavior. It would be nice
if we could figure out how to trigger it so users on machines that support this feature
could get taken directly to the games right when they connect to the network. That way
no instructions would be needed except "Connect your phone to Wifi [HappyFunTimes]"

Folder structure
----------------

    +-server   // code for node based relayserver
    |
    +-public   // the folder served by the relayserver
    | |
    | +-scripts  // The HappyFunTime JavaScript Library
    | |
    | +-examples  // the examples
    |   |
    |   +-scripts  // libraries shared by the examples, not part of HappyFunTimes
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

    The clients of course run in any modern browser. The game also run in
    whatever environment you've created them for. Most of the samples here
    are HTML and so should run in any modern browser on any platform.

    As for the relayserver I've only run it on OSX so far. I suspect it works
    fine in both Windows and Linux

*   Why not WebRTC?

    WebRTC would possibly allow the phones to talk directly the game rather than through
    the relayserver. The relayserver would need to setup a rendevous between the 2 machines
    but after that the conncetion should be peer to peer.... Or so I'm lead to believe.

    Feel free to submit a pull request ;-)

To Do
-----

[There's lots of ideas](todo.md).
