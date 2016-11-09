Title: Tips
Description: Tips for making the best HappyFunTimes experiences

*   Too many players can make some games un-playable.

    For example Powpow only allows 6 ships at once. Imagine
    it had no limit. Let's say you have 20 ships each with 3
    bullets. That's 80 things on the screen. Basically the
    game would be unplayable. Powpow's solution is after
    6 players there's a queue of players waiting to get
    launched. They collectively control a ghost ship

*   Always give players something to do

    Bombbomb has 2 minute rounds. It used to be if you died you
    were out until the round was over. Many players would end up
    just leaving and never coming back.

    A fix was to put them on the edge of the playfield and let
    them throw bombs in to kill off the remaing players. It took
    2 iterations to get that right because just putting them
    back in was not enough. We also had to show them getting
    moved to the side AND we had to tell them on their controller
    to keep playing.

*   Always make the player press something

    So far a browser can't prevent the phone from sleeping.
    A solution is to make sure the player has a reason to
    interact with the phone often.

    So for example the hft-garden game requires you press
    a button for the butterflies to fly. Without that
    players would hold their phone on the edges, play the
    game and eventually their phone would go to sleep.

*   Preventing text selection in the browser

    Use this CSS

         -moz-user-select: none;
         -webkit-user-select: none;
         -o-user-select: none;
         user-select: none;

*   Preventing images from popping up a context menu

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

*   Use the iOS Simulator

    You probably need to test both landscape and portrait
    and 3.5 inch (iPhone4-) and 4.0 inch (iPhone5+) sizes
    iOS6, 7, and 8, as well as iPad.

    I'd recommend the Android simulator but it's damn slow.
    I know it can be configured to run faster but even then
    it takes forever to start where as the iOS simulator
    runs nearly immediately and lets you switch devices
    nearly immediately.

*   Use remote debugging.

    Both iOS Safari and Chrome Android support remote debugging. Google for it.
    It's awesome!

*   Make options that don't need contollers to test your game.

    Powpow, Shootshoot, Jumpjump will all use the local
    keyboard to run a player if you put `?settings={haveServer:false}`
    at the end of the URL. For Boomboom you have to set
    `?settings={haveServer:false,numLocalPlayers:2}`

*   Use URL settings for testing.

    Most of the samples, both controllers and games, support
    various flags and settings passed in on the URL. This is great
    for testing. Example: `?settings={debug:true,showState:true,gravity:500}` etc.

*   Show the player's colors/avatar on the controller.

    Since the controller for each game is HTML there's
    no reason not to show the player's colors and/or
    avatar on their screen.

    Some games let the controller pick the color. (jamjam, ...)
    Other games the game pics the color/style and sends it to the controller
    (powpow, jumpjump, boomboom, ...)

*   Use media queries to adjust the controller by device and/or orientation

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

*   If the controllers doesn't work in portrait or landscape consider using using the CSS above to inform the user.

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

    Note: powpow and jumpjump already do this with standard HappyFunTimes support.
    Feel free to copy the code.

*   Use HandJS

    Touch events suck balls. Microsoft proposed a much better system
    called Pointer events and they provided a polyfill for all browsers
    called HandJS that provides pointer events across browser.

    Note: HandJS is a standard part of HappyFunTimes already and will be
    included if you use the [`Touch` module](http://docs.happyfuntimes.net/docs/hft/module-Touch.html).
    I recommend you use the touch module where possible as we can then fix bugs as they come up
    across games.

*   Add invisible divs for input if needed.

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
           left: 0px;
           top: 0px;
           z-index: 5;
        }

    This will make the inputarea be above the the first 2 nested divs and will receive
    all of the events un-interrupted.

*   Use CSS class `fixheight` and mobilehacks.js?

    I'm embarrassed to say this but I can't for the life of me figure out CSS. I set something
    to 100% height expecting it to become the same size as its container but for reasons I haven't
    been able to internalize this often doesn't work. My current solution is to mark the element
    in question with `class="fixheight"` and then in JavaScript, search for all elements with
    class `fixheight` and set their height to their parent's clientHeight. So far that's fixed
    all the issues.

*   Consider using Canvas to draw your controllers

    I literally spend 1-3 hours doing something I expect to take me 5 minutes like
    trying to get some unicode bullet centered in a button.

    So, I realized I could just make a canvas and hand draw the controls I want in it.
    I did this for the DPad examples although I use a separate canvas for each. I could
    instead use one large canvas and just draw all the buttons I want on it.
    Touch/Click detection would also be easier and faster because looking up the
    the position of an event relative to some element is slow in JavaScript since
    you have to compute the position of the element by decending through all of its
    parents.

*   What's with the weird `define()` stuff.

    It's part of [require.js](http://requirejs.org/). See [Why AMD](http://requirejs.org/docs/whyamd.html)?

    The simple explaination is. There's a script tag (in HFTs case it's in the template) that looks like this

        <script data-main="scripts/game.js" src="/3rdparty/require.js"></script>

    This loads `require.js` which then asynchronously loads `scripts/games.js`. It calls `requirejs` from
    that file. `requirejs` returns an array of dependencies and a function. The system starts loading the
    dependinces. Each of those has a `define` function which itself has an optional list of dependencies
    and a function. The system continues to load dependencies until all of them are loaded. It will load
    each file only once. When all of them are loaded it will call the functions that each of them returned
    in the correct order and pass whatever those functions returned into the functions the depend on them.

    In other words.

         // game.js
         requirejs(['./somelib', './otherlib'], function(SomeLib, OtherLib) {
            console.log(SomeLib.bar);
            console.log(SomeLib.foo);
         });

         // somelib.js
         define(['./yetanotherlib'], function(YetAnotherLib) {
            return {
               bar: YetAnotherLib.astrofy("abc");
            }
         });

         // otherlib.js
         define(['./yetanotherlib'], function(YetAnotherLib) {
            return {
               foo: YetAnotherLib.astrofy("123");
            }
         });

         // yetanotherlib.js
         define(function(YetAnotherLib) {
            return {
               astrofy: function(v) { return "**" + v + "**"; };
            }
         });

    Would first load game.js and call `requirejs()` see it dependes on `./somelib` and `./otherlib` so it
    would load `somelib.js` and `otherlib.js` and call `define()` in each. Each of those depend on
    `./yetanotherlib` so it would load `yetanotherlib.js`. `yetanotherlib.js` has no dependencies.
    Now it would call the function that was passed to `yetanotherlib.js:define()`. That funtion returns an
    object with single property `astrofy`. The system then calls the functions that were passed to
    `somelib.js:define` and `otherlib.js:define` passing in the object from `yetanotherlib`.
    It finally calls the function that was passed to `game.js:requirejs`.

*   Disable caching in your browser

    Right now the relayserver tells the browser not to cache anything. Whether the browser
    pays attention to this is up to the browser.

    You can also often turn off caching in the browser. In Chrome for example, open the
    Developer Tools. Click the gear icon near the top right of the tools. Check
    "Disable Cache (when Devtools is open)"
