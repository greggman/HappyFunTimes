Tips
====

*   Too many players can make some games un-playable.

    For example Powpow only allows 6 ships at once. Imagine
    it had no limit. Let's say you have 20 ships each with 3
    bullets. That's 80 things on the screen. Basically the
    game would be unplayable. Powpow's solution is after
    6 players they're a queue of players waiting to get
    launched. They collectively controll a ghost ship

*   Preventing text selection in the browser

    Use this CSS

        -moz-user-select: none;
        -webkit-user-select: none;
        -o-user-select: none;
        user-select: none;

*   Use the iOS simulator

    You probably need to test both landscape and portrait
    and 3.5 inch (iPhone4-) and 4.0 inch (iPhone5+) sizes
    as well as iPad.

    I'd recommend the Android sim but it's so damn slow.
    I know it can be configured to run faster but even then
    it takes forever to start where as the iOS simulator
    runs nearly immediately and lets you switch devices
    nearly immediately.

*   Make options that don't need contollers.

    Powpow, Shootshoot, Jumpjump will all use the local
    keyboard to run a player if you put `?settings={haveServer:false}`
    at the end of the URL.

*   Use URL settings for testing.

    Most of the samples, both controllers and games, support
    various flags and settings passed in on the URL. This is great
    for testing. Example: `?settings={debug:true,showState:true,gravity:500}` etc..

*   Show the player's colors/avatar on the controller.

    Since the controller for each game is HTML there's
    no reason not to show the player's colors and/or
    avatar on their screen.

    Some games let the controller pick the color. (jamjam, ...)
    Other games pick the color/style and send it to the controller
    (powpow, jumpjump, ...)

*   Use media queries to adjust the controller by device and/or orientation

    In CSS you can use media queries something like this

        /* Smartphones (portrait and landscape) ----------- */
        @media only screen
        and (min-device-width : 320px)
        and (max-device-width : 480px) {
        /* Styles */
        }

        /* Smartphones (landscape) ----------- */
        @media only screen
        and (min-width : 321px) {
        /* Styles */
        }

        /* Smartphones (portrait) ----------- */
        @media only screen
        and (max-width : 320px) {
        /* Styles */
        }

        /* iPads (portrait and landscape) ----------- */
        @media only screen
        and (min-device-width : 768px)
        and (max-device-width : 1024px) {
        /* Styles */
        }

        /* iPads (landscape) ----------- */
        @media only screen
        and (min-device-width : 768px)
        and (max-device-width : 1024px)
        and (orientation : landscape) {
        /* Styles */
        }

        /* iPads (portrait) ----------- */
        @media only screen
        and (min-device-width : 768px)
        and (max-device-width : 1024px)
        and (orientation : portrait) {
        /* Styles */
        }

        /* iPhone 4 ----------- */
        @media
        only screen and (-webkit-min-device-pixel-ratio : 1.5),
        only screen and (min-device-pixel-ratio : 1.5) {
        /* Styles */
        }

    The samples pretty much only use 4 settings

        /* Smartphones (portrait and landscape) ----------- */
        @media only screen
        and (min-device-width : 320px)
        and (max-device-width : 480px) {
        /* Styles */
        }

        /* Smartphones (landscape) ----------- */
        @media only screen
        and (min-width : 321px) {
        /* Styles */
        }

        /* Smartphones (portrait) ----------- */
        @media only screen
        and (max-width : 320px) {
        /* Styles */
        }

        /* Everything not a phone ----------- */
        @media only screen
        and (min-device-width : 768px) {
        /* Styles */
        }

*   If the controllers doesn't work in portrait or landscape consider using using the CSS above to inform the user.

    Example, if it doesn't work in portrait then in your HTML

        <div id="turnthescreen"><div>Turn the Screen &#x21ba;</div></div>

    Then in your CSS something like

        #turnthescreen {
           display: none;
        }

        @media only screen
        and (max-width : 320px) {
        /* Styles */
           position: absolute;
           left: 0px;
           top: 0px;
           width: 100%;
           height: 100%;
           display: block;
           z-index: 1000;
        }

*   Use HandJS

    Touch events suck balls. Microsoft proposed a much better system
    called Pointer events and they provided a polyfill for all browsers
    called HandJS that provides pointer events across browser.

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
    been able to internalize this often doesn't work. My current solution is to mark a the element
    in question with `class="fixheight"` and then in JavaScript, search for all elements with
    class `fixheight` and set their height to their parent's clientHeight. So far that's fixed
    all the issues.
