Sync2D
======

[![Video](http://img.youtube.com/vi/ESMlZUdYXnw/0.jpg)](http://www.youtube.com/watch?v=ESMlZUdYXnw)

[Click for video](http://www.youtube.com/watch?v=ESMlZUdYXnw)

This example shows using HappyFunTimes basic features to sync multiple displays
across machines.

To see it work on a single machine [run HappyFunTimes](../../README.md#running-the-examples) then
connect to [`http://localhost:8080/examples/sync2d/launcher.html`](http://localhost:8080/examples/sync2d/launcher.html).
Click **Start Normal** which should launch 3 windows, all in sync.

This works because the positions of the circles are based on a clock.
Even if the windows are on separate machines HappyFunTimes provides a
sychronized clock across machines.

You can change the settings in the middle window using the sliders. Those
settings get broadcast to each of windows (including the window the
setting was made in).

If you want to run it across machines [run HappyFunTimes](../../README.md#running-the-examples),
not the IP address HappyFunTimes printed to the console when it started.
Go to each machine (that's on the same local network) and type a URL in the following format

    http://ipaddress:8080/examples/sync2d/sync2d.html?settings={x:0,y:0,shared:{fullWidth:2000,fullHeight:1000}}

Where `fullWidth` and `fullHeight` define the size of a large virtual
display in css pixels and `x` and `y` define the offset in that display
for this particlar machine.  So for example let's say you had 3 laptops
each with a 1280x1024 display and you were going to arrange them
horizontally next to each other.  Then you'd set `fullWidth:3740` and
`fullHeight:1024` and then `x:0` on the left most machine, `x:1280` in the
middle machine and `x:2560` on the right machine.

Finally on one of the machines specifiy `server:true`.  That's the machine
that will get the UI to control the rest of the machines.

    http://ipaddress:8080/examples/sync2d/sync2d.html?settings={x:0,y:0,shared:{fullWidth:3740,fullHeight:1024}}
    http://ipaddress:8080/examples/sync2d/sync2d.html?settings={server:true,x:1280,y:0,shared:{fullWidth:3740,fullHeight:1024}}
    http://ipaddress:8080/examples/sync2d/sync2d.html?settings={x:2560,y:0,shared:{fullWidth:3740,fullHeight:1024}}

The code is pretty straight forward.  It creates a `GameClient` and waits
for `set` commands.  The `set` commands just set some global shared state.

Based on that global state some circles are drawn.  The positions of the
circles are based off the time from a `SyncedClock` so they'll always be
at the same position for a given time.  Using the standard canvas 2d it's
pretty each to use the transform matrix features to adjust the origin of
where things are drawn.  The actual code that draws the circles has no
idea which display it is on.

The one machine designated as the server also creates a `GameServer` and
anytime a setting is changed it broadcasts a `set` command with that
setting.

[See the code to see the details](https://github.com/greggman/HappyFunTimes/blob/master/public/examples/sync2d/scripts/sync2d.js)

For fun you can also try pressing the **Start Window Position Based**.
This one uses `window.screenX` and `window.screenY` for the offsets for
each window.  While that would have no point for individual machine, with
mutltiple windows on the same machine you can drag the windows around or
resize them and they will draw the correct area relative to their position
on the screen.  For whatever reason browsers do not update
`window.screenX` and `window.screenY` in real time.  You have to pause for
a moment for them up update.

Note: for whatever reason Firefox 29 doesn't position the first window
where I tell it so you'll have to move it manually.

Setting up `x`, `y`, `fullWidth`, and `fullHeight` can be a pain I
suppose. You could design some UI like Mac/Windows Display Settings. On
each machine, when it launches, send the screen size to the server with
something like

    client.sendCmd('size', {
        width: window.screen.width,
        height: window.screen.neight,
    });

The server could pop up a UI showing rectangles representing all the
monitors which you could drag around until they match the orientation
of your monitors. To send the new offsets you'd need to track the
`NetPlayer` objects that are send in response to `playerconnect` messages.
Then you can `sendCmd` some command you make up to the appropriate
`NetPlayer` object to update its offset. Something like.

    var machines = [];

    var Machine = function(netPlayer) {
      this.netPlayer = netPlayer;
      this.x = 0;
      this.y = 0;
      this.width  = 0;
      this.height = 0;

      netPlayer.addEventListener('size', Machine.protoype.handleSizeMsg.bind(this));
      netPlayer.addEventListener('disconnect', Machine.prototype.handleDisconnectMsg.bind(this));
    };

    Machine.prototype.handleSizeMsg = function(data) {
      this.width  = data.width;
      this.height = data.height;
    };

    Machine.prototype.handleDisconnectMsg = function() {
      var index = machines.indexOf(this);
      if (index >= 0) {
        machines.splice(index, 1);
      }
    };

    Machine.prototype.setOffset = function(x, y) {
      this.x = x;
      this.y = y;
      this.netPlayer.sendCmd('setLocal', {x: x, y: y});
    };

    server.addEventListener('playerconnect', function(netPlayer) {
        machines.push(new Machine(netPlayer));
    });

    ...

    var handleSetLocalMsg = function(data) {
      Misc.copyProperties(data, globals);
    };

    client.addEventListener('setLocal', handleSetLocalMsg);

You could also add any arbitrary rotation as well. You'd just have to
put the appropriate call to `ctx.rotate` somewhere in the code.

All that is left as an excersize to the reader ;)




