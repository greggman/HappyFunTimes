Title: Tips
Description: Tips for making the best HappyFunTimes experiences


### Too many players can make some games un-playable.

For example Powpow only allows 6 ships at once. Imagine
it had no limit. Let's say you have 20 ships each with 3
bullets. That's 80 things on the screen. Basically the
game would be unplayable. Powpow's solution is after
6 players there's a queue of players waiting to get
launched. They collectively control a ghost ship

### Always give players something to do

Bombbomb has 2 minute rounds. It used to be if you died you
were out until the round was over. Many players would end up
just leaving and never coming back.

A fix was to put them on the edge of the playfield and let
them throw bombs in to kill off the remaing players. It took
2 iterations to get that right because just putting them
back in was not enough. We also had to show them getting
moved to the side AND we had to tell them on their controller
to keep playing.

### Always make the player press something

So far a browser can't prevent the phone from sleeping.
A solution is to make sure the player has a reason to
interact with the phone often.

So for example the hft-garden game requires you press
a button for the butterflies to fly. Without that
players would hold their phone on the edges, play the
game and eventually their phone would go to sleep.

### Preventing text selection in the browser

Use this CSS

     -moz-user-select: none;
     -webkit-user-select: none;
     -o-user-select: none;
     user-select: none;

### Preventing images from popping up a context menu

Both Safari on iOS and Chrome on Android will pop
up a context menu "Save Image" if the user long
presses an image. So prevent that you need both this CSS:

    img {
        -moz-user-select: none;
        -webkit-user-select: none;
        -o-user-select: none;
        user-select: none;
        pointer-events: none;
    }

And this JavaScript in your `controller.js`

    mobileHacks.disableContextMenu();

### Use the iOS Simulator

You probably need to test both landscape and portrait
and 3.5 inch (iPhone4-) and 4.0 inch (iPhone5+) sizes
iOS6, 7, and 8, as well as iPad.

I'd recommend the Android simulator but it's damn slow.
I know it can be configured to run faster but even then
it takes forever to start where as the iOS simulator
runs nearly immediately and lets you switch devices
nearly immediately.

### Use remote debugging

Both iOS Safari and Chrome Android support remote debugging. Google for it.
It's awesome!

### Make options that don't need contollers to test your game.

Pass in some option or look at an environment variable to
decide to add a player that can be controlled with the keybarod.
That you can test your game on your PC without having to launch
other browsers or get out your smartphone.

### Show the player's colors/avatar on the controller.

Since the controller for each game is HTML there's
no reason not to show the player's colors and/or
avatar on their screen.

Some games let the controller pick the color. (jamjam, ...)
Other games the game pics the color/style and sends it to the controller
(powpow, jumpjump, boomboom, ...)

### Use media queries to adjust the controller by device and/or orientation

You may search [this overview](https://css-tricks.com/snippets/css/media-queries-for-standard-devices/)
for media queries for specifix devices. However it's not recommended to try
to add media queries for _every device_ as this will unnecessarily bloat your CSS files.
Just make sure that your UI is optimized for different screen sizes and the device orientation.

    @media only screen
      and (min-device-width: 320px) {
      /* Styles for devices larger than 320px */
    }

    @media only screen
      and (min-device-width: 768px) {
      /* Styles for devices larger than 768px */
    }

If you want to change the style based on the orientation, you may add a media query for the
orientation:

    @media all and (orientation:portrait) {
      /* Styles for Portrait screen */
    }

    @media all and (orientation:landscape) {
      /* Styles for Landscape screen */
    }

### Inform the user about a required device orientation

If the controllers doesn't work in portrait or landscape consider using using the CSS above to inform the user.

Example
If you don't want the user to use his device in portrait mode, place this HTML at the top of your page

    <div id="turnthescreen"><div>Turn the Screen &#x21ba;</div></div>

Then add the following in your HTML

    #turnthescreen {
        display: none;
    }

    @media only screen and (orientation:portrait) {
    /* Styles */
        #turnthescreen {
            position: absolute;
            left: 0px;
            top: 0px;
            width: 100%;
            height: 100%;
            display: block;
            z-index: 9999;
            background-color: red;
            color: white;
        }
    }

Note: powpow and jumpjump already do this with HappyFunTimes sample-ui library.
Feel free to copy the code.

### Use HandJS

Touch events suck balls. Microsoft proposed a much better system
called Pointer events and they provided a polyfill for all browsers
called HandJS that provides pointer events across browser.

### Add invisible divs for input if needed.

For games that have large input areas, like the Simple example, you may
need a large invisible div that covers the entire input area. For example
if you have

    <div id="inputarea" class="fullsize fullcenter">
       <div>Touch here</div>
    </div>

And then you do something like

    $("inputarea").addEventListener('pointermove', ...);

Whenever the mouse pointer or finger is over that inner `<div>Touch here</div>` you'll
stop getting pointermove events.

To fix it do something like

    <div class="fullsize fullcenter">
       <div>Touch here</div>
    </div>
    <div id="inputarea" class="fullsize fullcenter">
       <div>Touch here</div>
    </div>

And in CSS

    #inputarea {
       position: absolute;
       left: 0;
       top: 0;
       z-index: 5;
    }

This will make the inputarea be above the the first 2 nested divs and will receive
all of the events un-interrupted.

### Use CSS class `fixheight` and mobilehacks.js?

I'm embarrassed to say this but I can't for the life of me figure out CSS. I set something
to 100% height expecting it to become the same size as its container but for reasons I haven't
been able to internalize this often doesn't work. My current solution is to mark the element
in question with `class="fixheight"` and then in JavaScript, search for all elements with
class `fixheight` and set their height to their parent's clientHeight. So far that's fixed
all the issues.

### Consider using Canvas to draw your controllers

I literally spend 1-3 hours doing something I expect to take me 5 minutes like
trying to get some unicode bullet centered in a button.

So, I realized I could just make a canvas and hand draw the controls I want in it.
I did this for the DPad examples although I use a separate canvas for each. I could
instead use one large canvas and just draw all the buttons I want on it.
Touch/Click detection would also be easier and faster because looking up the
the position of an event relative to some element is slow in JavaScript since
you have to compute the position of the element by decending through all of its
parents.

### Disable caching in your browser

Right now the server tells the browser not to cache anything. Whether the browser
pays attention to this is up to the browser.

You can also often turn off caching in the browser. In Chrome for example, open the
Developer Tools. Click the gear icon near the top right of the tools. Check
"Disable Cache (when Devtools is open)"
