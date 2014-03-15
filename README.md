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

*   The architechture is simple.

    Basically there are 2 libraries and a websocket webserver.

    `gameserver.js` provides a library that runs in the game that tracks players joining or
    leaving the game and lets the game receive input from those players and
    send messages to them.

    `gameclient.js` provides a library that lets smartphones connect to the game and
    send and receive messages.

    `server.js` is a node.js based webserver. At a basic level all it does is relay
    messages to and from the smartphones and the game.

    Once connected, anytime a player (smartphone) connects to the game the game
    will get a 'playerconnect' event and passed a NetPlayer object. After that
    any message the player's smartphone sends generates a corresponding event
    on the game. Conversely, any message the game sends to a NetPlayer object
    generates a corresponding event on the smartphone that corresponds to
    that NetPlayer.

    A simple client looks like this

        <script src="gameclient.js"></script>
        <script>
        var client = new GameClient();

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

          netPlayer.addEventListener('move', Player.prototype.movePlayer.bind(this));
        };

        Player.prototype.remove = function() {
          this.container.removeChild(this.element);
        };

        Player.prototype.updatePosition = function() {
          this.style.left = this.x + "px";
          this.style.top  = this.y + "px";
          if (hitGoal()) {
            pickGoal();
            this.netPlayer.send({
              cmd: 'die',
              points: 10,
            });
          }
        };

        Player.prototype.movePlayer = function(cmd) {
          this.x = cmd.x;
          this.y = cmd.y;
        };

        var server = new GameServer();
        var players = [];
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

        server.addEventLisnter('playerdisconnected', function(netPlayer) {
          for (var ii = 0; ii < g_players.length; ++ii) {
            var player = g_players[ii];
            if (player.netPlayer === netPlayer) {
              player.remove();
              g_players.splice(ii, 1);
              return;
            }
          }
        });

        </script>


Running the Examples
--------------------

*   Clone to repo
*   Install node. I was using 0.10.26
*   type `npd install` which will install needed node modules
*   type `node server/server.js` which will start the server.

Open a browser window and go to `http://localhost:8080/` and choose a game server
In other window (preferable a window, not a tab), go to `http://localhost:8080` and
choose the corresponding client. If you want open more clients.

If you other computers or smartphones on the same network look up the ip address of
the machine running the game (see `ifconfig` on OSX/Linux or `ipconfig` on Windows) then
go to `http://ipaddress:8080` from those machines. For example on my home network it was
`http://192.168.1.12:8080`

Note: There is no reason the machine running the server needs to be the same as the
machine running the game. Also, if the machine is accessable from the internet
you don't need to be on the same network. Of course there will be far more lag over
the internet or especially over cellular networks but depending on the game that
might be ok.

Making It Simple For Players To Get Started
-------------------------------------------

Asking players to connect to a local network and then type in some obscure URL like
`http://169.234.174.30` is arguably too many steps.

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

Notes
-----

*   How secure is this?

    Not at all. This is not a library for the internet. It's a library for
    running a game at a party, meeting, bar, etc...

    That said if there's anything easy and performant you'd like to suggest
    submit a pull request.

*   Does it work on Windows and Linux?

    I've only run this on OSX so far. I suspect it works on both.

*   Why not WebRTC?

    Feel free to submit a pull request ;-)


