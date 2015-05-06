Title: 2d Platformer
Description: Using HappyFunTimes with a 2d platformer

This is just one example. There is no "correct" way. There's whatever
works for your game. Maybe you'd like to make it so players
tilt their phone left or right to move their character and
shake it to jump. It's really up to you.

At the moment there is [one sample you can find here](http://docs.happyfuntimes.net/docs/unity/samples.html?owner=greggman&repo=hft-unity2dplatformer).

## A short explaination:

This sample is based on [one of the Unity tutorials](https://unity3d.com/learn/tutorials/modules/beginner/2d).
If you haven't already I suggest you go through those tutorials as they will help you
get familar with Unity and the code. Then the stuff below will just cover some
of the things that needed to change.

The first thing we need to do is design a controller to run on the phone.

### HTML

First the HTML in `Assets/WebPlayerTemplates/HappyFunTimes/controller.html`

    <div id="buttons" class="hft-fullsize">
      <div class="button" id="left"><img src="images/hft-left-arrow-button.svg" /></div>
      <div class="button" id="right"><img src="images/hft-right-arrow-button.svg" /></div>
      <canvas id="avatar"></canvas>
      <div class="button" id="up"><img src="images/hft-up-arrow-button.svg" /></div>
    </div>

Above we can see there's a `buttons` area. It will be made fullsize. Inside it are 4
parts. A left, right, and up butotn. and a canvas where we can draw our avatar.

There's also this part which will show if the phone is in portrait mode.

    <!-- hft-portrait only shown if he phone is in portrait mode -->
    <div id="hft-portrait" class="hft-fullsize hft-fullcenter">
      <div class="hft-portrait-rot90">
        <div class="hft-instruction">
          Turn the Screen
        </div>
        <div class="hft-xlarge">
          &#x21ba;
        </div>
      </div>
    </div>

It basically tells users to turn their phone on the side. Hopefully as HTML5
progresses we'll be able to get rid of this need.

### CSS

The corresponding CSS from `Assets/WebPlayerTemplates/HappyFunTimes/css/controller.css`

    #buttons {
        position: absolute;

        /* make sure the user dragging their fingers or the mouse point
           doesn't select anything */
        -moz-user-select: none;
        -webkit-user-select: none;
        -o-user-select: none;
        user-select: none;
    }

Next we define buttons, their size, that they are absolutely positioned
and then set their positions

    .button {
        width: 110px;
        height: 110px;
        text-align: center;
        font-size: 70px;
        font-family: Helvetica, Arial, sans-serif;
        font-weight: bold;
        bottom: 60px;
        position: absolute;
    }
    #left {
      left: 20px;
    }
    #right {
      left: 140px;
    }
    #up {
      right: 20px;
    }

and we do the same for the avatar canvas

    #avatar {
      position: absolute;
      left: 50%;
      bottom: 130px;
      width: 128px;
      height: 128px;
    }

This code moves the buttons and the avatar canvas if the screen is really small

    @media only screen and (max-height : 208px) {
        .button {
            bottom: 22px;
        }
        #avatar {
          left: 56%;
          width: 64px;
          height: 64px;
          bottom: 52px;
        }
    }

### JavaScript

And the JavaScript from `Assets/WebPlayerTemplates/HappyFunTimes/scripts/controller.js`

This part says which libraries to include. The first part is the path to each
library. The second part is a list of variables to assign the libraries to.
The ones that start with `hft/` are part of HappyFunTimes and are
[documented here](/docs/hft/). The rest are part of this sample.

    // Start the main app logic.
    requirejs(
      [ 'hft/commonui',
        'hft/gameclient',
        'hft/misc/input',
        'hft/misc/misc',
        'hft/misc/mobilehacks',
        'hft/misc/touch',
        '../bower_components/hft-utils/dist/audio',
        '../bower_components/hft-utils/dist/imageloader',
        '../bower_components/hft-utils/dist/imageutils',
      ], function(
        CommonUI,
        GameClient,
        Input,
        Misc,
        MobileHacks,
        Touch,
        AudioManager,
        ImageLoader,
        ImageUtils) {

We have some code to send a message to Unity for when the place presses left or right.

    var g_leftRight = 0;
    var g_oldLeftRight = 0;

    function handleLeftRight(pressed, bit) {
      // Clear the bit for this direction and then set it if pressed is true.
      g_leftRight = (g_leftRight & ~bit) | (pressed ? bit : 0);
      // Only send if anything has changed.
      if (g_leftRight != g_oldLeftRight) {
        g_oldLeftRight = g_leftRight;

        // send a direction (-1, 0, or 1)
        g_client.sendCmd('move', {
            dir: (g_leftRight & 1) ? -1 : ((g_leftRight & 2) ? 1 : 0),
        });
      }
    };

Similarly we have a function for jumpping

    var g_jump = false;

    function handleJump(pressed) {
      // Only send it if it has changed
      if (g_jump != pressed) {
        g_jump = pressed;
        g_client.sendCmd('jump', {
            jump: pressed,
        });
      }
    };

We then connect those functions to keys for when testing in a desktop browser

    var keys = { };
    keys[Input.cursorKeys.kLeft]  = function(e) { handleLeftRight(e.pressed, 0x1); }
    keys[Input.cursorKeys.kRight] = function(e) { handleLeftRight(e.pressed, 0x2); }
    keys["Z".charCodeAt(0)]       = function(e) { handleJump(e.pressed);           }
    Input.setupKeys(keys);

And we connect them to the various HTML elements for our buttons

    Touch.setupButtons({
      inputElement: $("buttons"),   // element receiving the input
      buttons: [
        { element: $("left"),  callback: function(e) { handleLeftRight(e.pressed, 0x1); }, },
        { element: $("right"), callback: function(e) { handleLeftRight(e.pressed, 0x2); }, },
        { element: $("up"),    callback: function(e) { handleJump(e.pressed);           }, },
      ],
    });

Note that we use one element to receive all the input. `Touch.setupButtons` will look at
where each button element is and call the corresponding function.

We also have some code for drawing the avatar.

First off we load the avatar image and we don't actually start running the
controller until that image has loaded

    var images = {
      idle:  { url: "images/bird.png", },
    };

    ImageLoader.loadImages(images, startClient);

We setup a GameClient

    g_client = new GameClient();

And assign a function to call when we're told what color the player is

    g_client.addEventListener('setColor', handleSetColor);

That function looks like this

    function handleSetColor(msg) {
      // Look up the canvas for the avatar
      var canvas = $("avatar");

      // Get the size it's displayed by CSS and make
      // it's internal dimensions match.
      var width = canvas.clientWidth;
      var height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;

      // Now get a context so we can draw on it.
      var ctx = canvas.getContext("2d");

      // Adjust the avatar's hue, saturuation, value to match whatever color
      // we chose.
      var coloredImage = ImageUtils.adjustHSV(images.idle.img, msg.h, msg.s, msg.v, msg.range);

      // Scale the image larger. We do this manually because the canvas API
      // will blur the image but we want a pixelated image so it looks "old skool"
      var frame = ImageUtils.scaleImage(coloredImage, 128, 128);

      // Draw it in the canvas and stretch it to fill the canvas.
      ctx.drawImage(frame, 0, 0, ctx.canvas.width, ctx.canvas.height);
    };

### Now on the game side, in Unity.

We're using the Character Controller example which was written in UnityScript.
It's in `Assets/HappyFunTimes/Scripts/Example3rdPersonController.js`


