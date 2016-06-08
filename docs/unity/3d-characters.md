Title: 3d Characters
Description: How to control 3D characters with HappyFunTimes

How do you control 3D characters with HappyFunTimes? The short answer is
"it depends".

What controls do you want? Maybe you want just left and right and forward.
Maybe you want an 8 directional control pad emulator. Maybe you want an analog
control pad emualtor.

At the moment there is [one sample you can find here](http://docs.happyfuntimes.net/docs/unity/samples.html?owner=greggman&repo=hft-unitycharacterexample).

## A short explaination:

### HTML

First the HTML in `Assets/WebPlayerTemplates/HappyFunTimes/controller.html`

These lines create an area to hold the visual representation of the dpads

    <div id="dpads" class="fixheight">
      <div id="dpadleft"></div>
      <div id="dpadright"></div>
    </div>

And these lines create a `<div>` that will placed above everything else
that's the fullsize of the browser window to receive all input. This let's
us get input even outside of the dpad images.

    <div id="dpadinput">
    </div>

### CSS

The corresponding CSS from `Assets/WebPlayerTemplates/HappyFunTimes/css/controller.css`

First the dpad area

    /* the area that contains the visual representation of our dpads */
    #dpads {
        /* make the dpads area fill the browser */
        width: 100%;
        height: 100%;

        /* make positioned children of #dpads use this as their origin */
        position: relative;
    }

And the individual dpads

    #dpadleft, #dpadright {
      /* these are relative to #dpads */
      position: absolute;
      width: 160px;
    }
    #dpads canvas {
        /* the dpads are each drawn with a canvas */
        width: 160px;
        height: 160px;
    }
    #dpadleft {
      /* position the left pad */
      left: 2em;
      bottom: 3em;
    }
    #dpadright {
      /* position the right pad */
      right: 2em;
      bottom: 3em;
    }

and finally the div that will receive all input

    /* an invisible area that covers everything and receives all input */
    #dpadinput {
        /* fill the browser */
        width: 100%;
        height: 100%;
        /* position at the top */
        position: absolute;
        left: 0px;
        top: 0px;

        /* make us appear over other stuff */
        z-index: 2;

        /* make it so dragging your finger or the mouse on
           this area does not start selecting stuff */
        -moz-user-select: none;
        -webkit-user-select: none;
        -o-user-select: none;
        user-select: none;
    }

### JavaScript

And the JavaScript from `Assets/WebPlayerTemplates/HappyFunTimes/scripts/controller.js`

This part says which libraries to include. The important ones are `input`, `dpad`
and `touch`. The first part is the path to each library. The second part is a
list of variables to assign the libraries to.

    // Start the main app logic.
    requirejs([
        'hft/commonui',
        'hft/gameclient',
        'hft/misc/dpad',
        'hft/misc/input',
        'hft/misc/misc',
        'hft/misc/mobilehacks',
        'hft/misc/touch',
      ], function(
        CommonUI,
        GameClient,
        DPad,
        Input,
        Misc,
        MobileHacks,
        Touch) {

We then create 2 dpads

    var dpadSize = 160;
    var dpads = [
      new DPad({size: dpadSize, element: $("dpadleft")}),
      new DPad({size: dpadSize, element: $("dpadright")}),
    ];

We setup so keyboard keys work. This makes it easy to test in a desktop browser

    Input.setupKeyboardDPadKeys(sendPad);

Then we setup the touch based dpads

    var container = $("dpadinput");
    Touch.setupVirtualDPads({

      // the container that receives all input
      inputElement: container,

      // the function to call when we get inupt
      callback: sendPad,

      // whether or not the center stays fixed. If false
      // the system will assume the place the player touchs
      // is the center, they then have to move their finger
      // from that spot to move. That doesn't seem to work
      // well or maybe it just needs some iteration
      fixedCenter: true,

      // an array of pads and were their center is.
      pads: [
        {
          referenceElement: $("dpadleft"),
          offsetX: dpadSize / 2,
          offsetY: dpadSize / 2,
        },
        {
          referenceElement: $("dpadright"),
          offsetX: dpadSize / 2,
          offsetY: dpadSize / 2,
        },
      ],
    });

Finally we need to supply the `sendPad` function to actually send
data to the game

    function sendPad(e) {
      // Draw the dpad
      dpads[e.pad].draw(e.info);

      // Send it to the game.
      g_client.sendCmd('pad', {pad: e.pad, dir: e.info.direction});
    };

The `Touch` library provides various kinds of data for each dpad. Above
we are chosing to send `e.pad` which is the index of the pad and `e.info.direction`
which is a direction number that goes from -1 to 7

            2     -1 = no touch
          3 | 1
           \|/
         4--+--0
           /|\
          5 | 7
            6

From [the docs](http://docs.happyfuntimes.net/docs/hft/module-Touch.html#setupVirtualDPads)

> Note: this matches trig functions so you can do this
>
>     if (dir >= 0) {
>       var angle = dir * Math.PI / 4;
>       var dx    = Math.cos(angle);
>       var dy    = Math.sin(angle);
>     }
>
> for +y up (ie, normal for 3d)
>
> In 2d you'd probably want to flip dy
>
>     if (dir >= 0) {
>       var angle =  dir * Math.PI / 4;
>       var dx    =  Math.cos(angle);
>       var dy    = -Math.sin(angle);
>     }

Some other info we could have sent instead

     e.info.dx   = -1, 0, 1
     e.info.dy   = -1, 0, 1
     e.info.bits = 1 for right, 2 for left, 4 for up, 8 for down

### Now on the game side, in Unity.

We're using the Character Controller example which was written in UnityScript.
It's in `Assets/HappyFunTimes/Scripts/Example3rdPersonController.js`

The first thing we need to do is define a matching class to receive
the input from the phone.

    class MessagePad {
        var pad : int;
        var dir : int;
    };

We're using a helper library to help emulate a dpad. It's defined
in `Assets/HappyFunTimes/Scripts/DPadEmuJS.js`. You can look inside
if you'd like to see how it works. The important part is we need
to send it the data we receive from the phone. First set one
and at init time we need to tell HappyFunTimes to call a function
when that message comes in.

    private var _netPlayer : HappyFunTimes.NetPlayer;
    private var _padEmu : DPadEmuJS = new DPadEmuJS();

    function InitializeNetPlayer(spawnInfo : HappyFunTimes.SpawnInfo) {

        _netPlayer = spawnInfo.netPlayer;

        // Call the `OnPad` function
        _netPlayer.RegisterCmdHandler("pad", OnPad);

    }

OnPad looks like this

    function OnPad(data : MessagePad) {
        _padEmu.Update(data.pad, data.dir);
    }

It just passed the data on to the DPadEmu library.

Otherwise we've just gone through the code and repalced `Input.` with
`_padEmu.` so for example the code that lets the player move looks like this

    var v = _padEmu.GetAxisRaw("Vertical");
    var h = _padEmu.GetAxisRaw("Horizontal");

The emulation is just a basic shell. It's up to you if you'd like it to
handle other cases.

