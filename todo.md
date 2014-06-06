*   file bug with apple about canvas/photos
*   make games.html msgs show up even when scrolled down
*   fix docs
*   fix localhost replacement so it includes port
*   add timeout for input. No input from player for n seconds = disconnect?

    Right now we ping and expect a response. No repsonse = player is offline. But,
    often there's a separate tab running for whatever reason and that tab is kept
    alive and inserted into the game so for example only 3 people are playing but
    there are 4 players because one player happens to have an extra tab.

    Ideally that tab would disconnect. Not sure how to fix that. Could try to allow
    one connection per IP address? Or could timeout if no input for n seconds. Problems
    with timeout is that some games are round based (like boomboom). If you die early
    you might be waiting 2 minutes so the timeout would need to be like 3 minutes. But
    what if some other game has a 3 minute timeout?

    The problem with both ideas is that during testing I often have multiple tabs
    open. I'd need an option to allow multiple users if I filter by ip.

*   make controllers check for other games if the game has not yet connected?

    There's an issue where sometimes a controller will be waiting for a game since
    controllers can join first. Maybe controllers should check for other games until
    they are sure they are connected to a running game. If the see a different game
    they can switch to it.

*   make it easier to use

    I've been thinking like an experienced engineer. Just passing the messages is enough,
    people will see how to connect them up. But, I can make this much easier for the simple cases.

    On the controller side, some library that takes and/or setup the client and then lets you just
    define buttons, dpads, orientations, and it deals with the messages

    On the game side some library that give a similar definition gives you similar messages
    and/or tracks state you can just read

    Can I just do it based on HTML and tags to classes

        <div class="hft-dpad" />
        <div class="hft-button" />
        <div class="hft-area" />
        <div class="hft-deviceorientation" />

    Then on the client side just figure it out? Problem for C# / Static languages? Could write script
    to generate class for static languagues. Could make api string based HTF.getState("dpad")

    So the problems I ran into when first trying to do this

    1.  I first tried to do jumpjump. The L - R buttons though act as a pair because I wanted it if
        you happened to be using 2 fingers and you press L, while olding L you press R, then left off R
        the direction should go back to L. All that is sent to the game is the current direction -1, 0, 1.
        The controller is doing filtering of the 2 buttons.

        The question is what to do.

        *   Move the filtering to the game.

            The controller just sends L up, L down, R up, R down messages. The game decides on a direction.
            Maybe that's the best thing?

        *   Figure out how to specify two buttons are connected

        *   Consider the L - R buttons just a version of a DPad controller with no up or down.

    2.  There's 3 parts in CSS/HTML which make this more complicated

        *   The visual representation of the button

        *   The element, often invisible, that defines the hit area of the button

        *   The full document size element that actually receives the input from touching

        I'm not sure if there's a way to make that easier. Maybe I should insert the full document size
        element so the developer doesn't have to do that? On top of that often you'd like the visual
        representation to change based on user input. How would I do that or maybe I shouldn't care for
        now or make that some optional setting?!??

*   Change jumpjump and powpow L - R buttons to something that looks like you can slide your finger across it.

    Watching players play I've noticed many try to press those as two separate buttons where as it's
    actually designed so you just slide your finger. Maybe drawing a rocker button or one long button
    would help?

*   Consider providing a game side library for name images/textures

    The issue is a name can currently be 16 characters. That's pretty long, especially in Japanese.
    The library would make an image of the name, optionally with background color? And format it
    either breaking at space or scaling if too long or something.

*   Make buttons on Jumpjump, PowPow full height.
    *   add option to show buttons?
*   Make random color pickers based on color perseption.

    Currently random color are based on HSL. They often look too similar.

*   Change powpow to use more ship colors
*   Need to figure out auto-docs
*   Need to figure out how to test. Maybe Jest would help?
*   If UI is not part of examples but a part of HFT then need to figure out which .js file should be shared (ie, moved to public/shared/scripts) or something.
*   change games.html title to be ip address or instructions
*   make server serve "chose another WiFi network to browse internet"
*   use particles for coin
*   use particles for boomboom death
*   Fix collisions for jumpjujmp

    for both coin and player collisions I'm just checking where they tried to go
    I'm not checking the places in between so if the frame rate gets too slow
    bad things happen.

    Ideally I should separate the collision checking into some lib/utility

*   refactor sprite code to have offset (currently assumes center of image is origin)

    jumpjump could use this.

*   Make game maker plugin
*   Make C++ version of lib
*   touch code already debounces pressed so remove similar code from controllers?

*   Game service / package installer?

    It might be nice to make this like many of the package installers. You could download
    HappyFunTimes then type something like

        hft install someplatformgame

    Which would go and install platform game from some repo just like `npm` and other
    package managers do. Just an idea.

    I could also change the relayserver to search for games.

    I'm mixed on this idea. I really like the idea but there's no point unless there's
    100s of games to install. At the same time, conversely, having it might make
    it more likely people would write games. It might also make it super easy
    to download gamejam games etc.

*   decide on what HappyFunTimes is

    It started off as just a simple library to relay messages between game and controllers.
    But, as I added more games I started wanted to share code on the controllers. Then
    I got tired of typing long urls like http://localhost:8080/examples/boomboom/index.html
    so I added a menu for the controllers. Then I realized I didn't want people to choose
    games that weren't running so I made that menu hide game that weren't running.
    Then, I realized when I quit a game, the shared code would put up a "disconnected" message
    but I could change that to see if another game was running and go directly to it.
    This has all been pretty awesome in that when showing off the system I go to
    http://localhost/games.html and pick a game. Players connect to the Wifi and get
    immediately taken to the game. Later I press back which brings me back to
    http://localhost/games.html, I pick a new game and bingo, all the controllers
    automatically switch to the new game.

    This seems like the best way for it to work. The odds of being at some party
    large enough to run multiple simultainous games are much smaller than running
    just a single setup. On a single setup that seems like the best way to do it.

    So, I think I might make the ExampleUI part of the *base* HappyFunTimes.

    That brings up another question though. Right now there's a name bar at the
    top of the shared part of the controllers. I wonder if I should get rid of that.
    I could instead make it so when you connect to the router it takes you do a page
    that says

        +-------------+
        |HappyFunTimes|
        +-------------+
        |-enter-name--|
        +-------------+
        |    Start    |
        +-------------+

    Most people didn't realize they could enter their names. Doing this will likely
    make them enter something. After which they really don't need to be able to edit
    their names. That means I could remove the name area from the controllers giving
    more space to the controllers.

    I could still make it possible to change your name while playing as I could leave
    the gear menu. But, it might seem out of place up in the corner. I guess I can
    style it like a tab or something.

    I also currently have it so controllers can connect to a game in the relayserver
    before a game has started. But that kind of seems pointless. It's there mostly
    for debugging so I can start a controller then start a game.

    If I change it so a controller can not connect before the game then I can also make it
    if a controller tries to connect and there is no game the controller goes
    back to the main menu. This would solve an issue I've seen. Sometimes for
    whatever reason a controller dies (probably a bug). I reset a game and
    the a few users controllers don't reset. I tell them Gear->Main Menu but
    if I made this change they could also just refresh. On refreshing the
    controller would see the game is not running and go to the main menu
    or to whichever other game is running.

    *   other ideas

        *   what about making it into a virtual console

        *   using packages (think npm/package.json) could make it easy to find and install games

            *   step 1, make it so you can type `htf install somegame`

            *   step 2, provide a web interface to do the same

            *   step 3, add a store

            Could have games.html show recently played, recently installed, link for store,
            promoted games, ... (promoted games only works if using real net.)

        *   How about making hardware. For example an android stick with HFT pre-installed

            I could boot directly into HFT. I could either be the WiFi or it could connect
            to your home WiFi. Unfortunately with your home WiFi there's no way I can
            think of for the phones to find the HFT machine through the browser?

            One idea, use the WebRTC api (not available in iOS yet :()) to get your local ip.
            From that you use XHR to try to contact all class C ip addresses searching for the
            HTF server

            You could serve the page that does that from htf.com or something like that.




*   boomboom
    *   implement kick (comment in kickCrate in boomboomgame globals to make powerup appear, then implement in player.js)
    *   "Hurry!!!"
    *   close off edges at 30 second point?
    *   try to make real AI.

        I don't think this would have a point for HFT but I guess it would just be fine to try.
        Especially to see if it can be fast enough in JS for 400+ AI players. They'd have to
        probably get one AI tick for every N players. They'd probably only be able to look
        within some small range of tiles to decide what to do?

    *   figure out what players waiting can do
    *   walking speed should start at 48 and progres to 64?
    *   consider showing map "radar" on controller when game starts and point to player

            +-------------------------------+
            |                               |
            |                               |
            |               You R Here      |
            |                       |       |
            |                       V       |
            |                       .       |
            |                               |
            +-------------------------------+

*   need to handle orientation better.

    problem: user has orientation locked to portrait. Game requires landscape. They have
    to dig into their settings to play. Could try to CSS rotate the layout so the game
    shows up landscape. Not sure all the implelications. Do touch events get rotated? I doubt it.

    Note: I tried it. First problem, just rotating the entire page 90deg didn't work.

    First problem, the content was still sized as portrait. Added code to fix the size.

    Second problem, the content rotated was several pixels offscreen. On iOS 7.0 on
    on 3.5 inch iPhone4s it was 26 pixels off. In iOS7.1 on a 4.0 inch iPhone 5s it
    was 104 pixels off when the ui is minimized but changes when the ui comes back :(

    3rd problem, if I clicked on the name to edit it it slide down around 1/2 a screen
    and when done entering the name it did not slide back :(

    4th problem, touch events are not rotated. I kind of expected that but not sure
    what to do about it. One problem is getting a relative position of an event
    required going thorugh

    Note: See todo below, change them to canvas based would also make this easier.

*   refactor boomboom (and jumpjump?) to make the rendering forward driven.

    For example in boobboom the layers choose their own offset.
    where to draw. Rather that should be passed down.

*   it might be a FUCK LOAD easier to make the controllers using canvas instead of HTML.

    no fighting where where you want controls to appear, no trying to center a character
    inside a div. Just draw what you want. I swear I waste 1-3 hrs per controller
    futsuing with CSS :(

*   Consider deciding the ExampleUI etc is part of HappyFunTimes

    Originally I thought HappyFunTimes was just the relayserver and the libraries to
    talk to it.

    Having made the demos though it does seem there is some utility in the exampleUI.
    The ExampleUI currently includes

    *   Providing a consistent controller frame with name editing and a menu

    *   Showing a disconnect message when the game stops

    *   Auto-Connecting to a game if only one is running.

    *   Showing a menu of games if more than one is running.

    *   Auto-reloading on disconnect.

    I don't really know it's useful in general. I've just noticed what when
    demoing it it's really nice that players connect to the WiFi and it just
    works. I switch games, their controllers switch to the new game. There's
    often a slight delay in switching which I could fix by moving the switching
    mechanism to use websockets instead of AJAX polling. Maybe I should move
    that into happyfuntimes as another relayserver websocket message?

    Off the top of my head gameclient would had 1 new function, `requestGameList`
    or something like that and would generate one more event `gamelist`. The
    `gamelist` event would be sent anytime a new game is registered or unregistered
    as well as in response to a `requestGameList`. Not sure that's good or not,
    one problem I can see is the controller's list might be a few moments out
    of date so it might try to join a game that doesn't exist.

    Not sure the menu is useful. Maybe I'll find out at a game jam?

*   fix games so if they disconnect, when they re-connect they reload.

    I'm not 100% sure this matters but, the issue is if I kill the relayserver
    to restart it, the games detect that and put up a message. When I restart
    the relayserver the games remove the message but seem to often be in some
    indeterminent state. Ideally they'd just restart, the controllers as well.


*   update unitydocs with UnityScript
*   fix camera on unitycharacter example so
    *   it works for 1 player
    *   it doesn't swing around so much
*   unity: see if we can figure out a way so controllers don't get disconnected if script is updated.

*   **Issue:** Anyone can go to the gameview.html for a game.

    Curretly the relayserver assumes a new game for the same gameId is legit. It kills
    the old game and makes a new one. This is useful during dev as you don't have to hunt
    down any old tab that might be running the game.

    At a party that's fine since you're with friends but at a bar/museum that
    would suck because griefers can easily grief, no hacking required.

    Could make it so relayserver only lets first game per gameId in. Problems. Assumes
    games are stable. (could probably fix with timeout which might already be in there)

    It doesn't solve the issue that a griefer can start other games so if you, as the party host, go to
    start up another game you can't if the griefer has already started one. Maybe that's okay.
    It's just at starting time so can scream at griefer.

    Another idea. Maybe you can start server with optional password. Games require password in URL
    as in http://ipaddress/example/jumpjump/gameview.html?settings={password:"foobar"}. Since
    the griefer doesn't know the password they can't start games.

    Could also make games only served on localhost or similarly ip restricted.

    Of course sadly griefers can easily break games. Maybe I should fix this? They can break games
    by sending bogus messages. Example. `sendCmd('move', {dir: "foo"})` will end up in the code as

        position += msg.foo;  // exception? ... or actually position becomes NaN :(

    I could put a try/catch when I call events. Unfortunately you'd like to be able to catch
    the exceptions in the debugger when debugging. Maybe again this should be an option in
    starting a game as in `...?settings={trycatchevents:true}`

    That wouldn't prevent griefing. See NaN above.

    I'm just wondering out loud if by some luck HFT was used
    at a museum some griefer that knew the library could easily crash the game :(  I suppose,
    at least at the beginning, the odds that some griefer is going to come to some event with
    his laptop or tablet and hack some custom code just to be an ahole is not so likely?

*   Have better splash if no games running

*   stop sliding fingers from selecting stuff.
*   make bird quack if you click him (consider random speed)
*   fix flex css (remove need for fixHeightHack)
*   figure out why deviceorientation message is low
*   test older ios
    *   consider making it warn if version not good enough
*   test older android
    *   consider making it warn if version not good enough
*   should I restructure samples to wait for sounds to load?

*   Get nice designs for games. Particularly controllers

*   remove window everywhere?

    might be a good idea to wrap js with (function(window, undefined) { to make sure
    all references to globals are missing

*   consolidate assets

*   make sample games

    *   boomboom
    *   platformer (jumpjump)
    *   8way shooter (shootshoot)

    *   Fist bump game

        using accelermeters and synced clock maybe we can tell when
        two people fist bump? Heck, maybe if 3 or more people have
        the same time stamp we can assume all of them bumped?

        Players have to fist bump everyone?

    *   Games with physical movements

        Players must turn around (use compass / device orientation).
        Of course players can just turn their phones. Maybe they have
        to hold them level (put dot on the screen with a circle, keep
        circle in the dot as they are instructed to turn left, turn right,
        jump, etc...

    *   Just press button most times?

        various track and field / hyper bishi bashi games

    *   Find your name on other person's phone. Fist bump.

    *   Find your picture on other person's phone.

    *   game where players have to find matching piece of puzzle.

        Example for groups of 3 players they might see

            +---+  +---+  +---+   Picture of 3 phones side by side.
            |   |  |   |  |   |   with some image that fits just those
            | <-|  |-O-|  |-> |   3 phones.
            |   |  |   |  |   |
            |   |  |   |  |   |
            +---+  +---+  +---+

        You have to walk around the room and find your matching partners.
        Maybe make it easier by matching background colors. First find all the red players,
        then figure how to align the phones to see the image.

        Not sure what you'd do at that point. Type the message that's across N
        displays. Or maybe trace some line across all 3? Hard to do unless you
        set the phones down.

    *   game where you slide character from one phone to the other by sliding finger across both phones

        Variation of above idea. If you know 2 phones are partners then you could slide
        your finger from one to the other to drag a character across screens. The game would
        know the 2 controllers belong together and based on time (syncedclock) and where fingers
        are dragged could tell if you dragged from the the correct N phones.

    *   Racing up or down screen using device orientation for steering

    *   Use device orientation like a paddle controller. Tilting left
        right moves basket across screen. Pressing button puts your
        basket high for a moment. Try to catch more falling things than other
        players?

    *   drawing game.

        Player's draw on their phone, add drawing to level? Maybe Crayon Physics like?
        Heck, just stop erasing the canvas with the simple example.

    *   racing game

        maybe like micro machines or moto roader where the camera keeps up with the lead
        and others get put in place.

        like grand prix, tiny cars on a track the fits on the screen

    *   More co-op games or team games.
    *   rapunzel

        Rapunzel was a basic programming tutorial where you'd be told the wind
        and height above ground of Rapunzel's window and you'd have to type in
        the angle and power of the bow to shoot an arrow into her window.

        That's been updated by a zillion people into showing little cannons
        trying to hit each other and having easier input. Well, a ton-o-players
        playing it.

    *   unity character controller
    *   johann sabastian joust?

        johann sabastian joust is a game played with move controllers
        where you try not to move the controller too much or you're out.
        Other players try to make you move to fast knocking you out while
        at the same time trying not to get taken out themselves.

        HTML5 allows access to the accelerometers of the phone so it
        should be possible ot make a similar game with HFT.

    *   Make a round based game. (bombbomb fits this. Each round lasts 2 mins. Players entering later have to wait)
    *   quiz

        send question Q + 4 answers, display on phone and on game. On game show counts
        In 10 seconds show correct answer and winner on game and on phone?
        Make sure answers after game has moved on do not affect results
        Add score for players

    *   Device orientation game, each player is assigned a piece of a shape, they have
        to rotate their device to get the shape to line up (ie, jigsaw puzzle). Anytime
        a new player is added the current shape is subdivided.

        Not sure this is a fun idea.

    *   Use device motion to play tennis like Wii (shake controller to return ball)

    *   Use the Speech Synthesis API

        Players plug in headphones and put them in just one ear. The game sends commands/advice/direction
        to the controller which instructs each player secretly using the speech API. This way they
        can look at the game (the TV) and still get individual and private instruction on what to do.

*   abstract out Unity3D parts of C#

    Currently the C# version of the library is Unity3d specific. Should be easy to abstract that out
    so it can be used in C# in general

Done
----

*   make gameviews template based so we can make disconnect behavior common

    - [x] boomboom
    - [x] clocksync
    - [x] deviceorientation
    - [x] jamjam
    - [x] jumpjump
    - [x] powpow
    - [x] shootshoot
    - [x] simple

*   move common stuff lower
*   move 3rdparty stuff lower
*   move wrench lower
*   move package.json stuff to happyfuntimes sub
*   Make start on game-login use whole area.
*   Change Powpow so outline version of ship is 2x or 3x thicker
*   remove mobile stuff from games.html
*   Make max name 16 chars
*   Fix name editing on controllers. (jumping down 1/2 screen)
*   add "if you like this code, here's the repo?" like Mozilla
*   fix name flow
    *   captive portal and hft.net should go to enter-name.html
    *   enter-name.html should accept ?name=
    *   enter-name.html should try to contact hft.net with like hft.net/savename.html?name= which saves a cookie
    *   hft.net should read cookie so next time it can go to enter-name.htmk?name=
    *   enter-name.html, if no name should ask for name. If name should go to index.html

*   remove auto registering of MessageCmdData classes

    this is easier said than done. The reason they are pre-registered
    is that controllers can start before games. So, controller sends a
    message to the game, the game deserializes it but because the types
    would not be registered until the NetPlayer starts it doesn't know
    how to deserialize them yet. Auto registering means it does know.

    An alternative would be if it can't find the correct type to deserialize to Dict<Object>
    then put the message in a queue. Another idea would be to put all messages
    in queues in the net player. Right now they are deserilized in the
    websocket thread but they could just be queued there? Actually that doesn't
    help as they have to be deserizlied before we can figure out which
    player they belong to.

    The problem now is the scanner check ALL scripts in Assets (I guess that's
    because Unity includes all scripts). So, there will be conflict if 2 different
    scripts define objects with the same CmdName

*   make games.html use game type for link. This way it can tell you to run unity games manually.

*   now that we have game URLs make main menu generated at runtime

*   add settimeout/setinterval to game support

    Why? Because when debugging I have the games pause automatically but
    timeouts/intervals don't pause. Basing them off the game clock would fix that.

*   figure out why no sound from powpow controller?
*   refactor sprite code so drawPrep is only called once.
*   fix nexus name edit issue. controls appear over name

    for now I just made it hide the controls when editing your name. Hope that didn't break anything

*   fix movement against tiles in boomboom
*   fix sound in powpow on contolller
*   fix dpads!!!!

    I think this is done. Checking shootshoot it already worked as I thought it was. Boomboom
    needed separate hit areas. Keeping them in the correct place by browser might be problematic.

*   add sounds jumpjump
*   add sounds bombbomb
*   put name back in jumpjump

*   make jump time indepent

*   send no caching header? or at least optionally

*   fix tdl vs require load issues.

*   Make more world sizes for jumpjump

*   make jamjam fail without audio api

    not sure how to test this.

*   fix simple so dot is not off screen

*   fix for iOS 6

*   change turn the screen to be landscape.

    People will understand that better I think based on observation. They won't
    bother to read what the screen says but they will see the text is 90 degrees
    rotated and so rotate the display.

*   fix jamjam

*   see if orientation is easy fix

    It's not! :(

*   fix simple controller status affecting input

*   make relayserver optionally run on 2 ports, 80 and 8080. The reason being
    there's no easy way for Unity to connect on port 80? Wait: why?
    Maybe the unity one should try port 80 first, then 8080, and ping pong until it finds the server?

    Made the relayserver use both ports 80 (if it can) and 8080. So, if sudo run the relayserver
    it just works. Unity can connect to ws://localhost:8080 and games can connect to http://ipaddress/foo/bar/somecontroller.html

*   boomboom
    *   make it so you can lob bombs from the side after death
    *   make sure bombs get reset before next level
    *   show num bombs and flame size on controller
    *   add reappear sound
    *   add bounce sound
    *   let you throw bombs further? (hold button?)
    *   make lobbed bombs explode if on flame
    *   fix explosion at crate/bush with nothing on other side. should be tip.
    *   fix explosion on crates
    *   show names (limit to size?). Maybe only show it larger if player clicks avatar
    *   make flames handle erasing correctly. Sometimes the wrong tip is displayed.
    *   fix turning. Trying to go down lines is too hard.
    *   fix so more than R*C players
    *   blow up bushes.
    *   Music
        *   main
        *   fast? with faster music? I wonder if I can do that easily in WebAudio? (yes!)
    *   controller
        *   handle 'waitForPlayers' {waitTime: seconds} msg
        *   handle 'waitForNextGame'? What can players do while waiting?
        *   handle 'died'
        *   handle 'winner'
        *   handle 'tied'
    *   start at "waiting for players"
    *   have 3..2..1..Go
    *   check for winner
    *   show inner
    *   check for death
    *   show death
    *   place bombs
    *   explode bombs
    *   chain bombs
    *   random powerup
        *   +bomb
        *   +size
        *   fire
        *   kick
    *   show state on controller
        *   waiting to join
        *   waiting to start
        *   died
        *   winner
    *   size level based on # players

*   fix so games go directly to running game

*   fix so main menu goes to running game if 1

*   fix unity

*   remove 'd' from status

*   fix jamjam controller on iOS7.0

*   move DNS server into main server, then you don't need to run 2 things

*   put player name above character in unity.

*   remove android single touch from powpow

    When this was first written single touch android phones were common.

*   make tick for clocksync ogg/mp3

*   refractor keyboard stuff from games.

*   size dpads

*   make powpow/unitycharacter/shootshoot controller show a simple to rotate if in portrate mode

*   store rhythm in cookie?

*   redesign powpow controls

    Rowen suggested that because ship is on center of screen people
    expect to touch there to control it. Should I move the ship?
    Change it so it controls from the center? Show <- -> buttons
    and a [Fire] button with the ship somewhere else?

*   make disconnect have "main menu" if game is not running?

    Maybe only option should be "Main Menu"? If I'm changing games I want them
    to go to the main menu and pick a new game. If game crashes it can be picked
    from the main menu.?

    For most situations it seems like it should go back to the main menu immediately.
    What I don't like about that is it's abrupt. I suppose the player will be looking
    at the game (TV), not the controller (smartphone). So if they see the game crash
    or change they won't be startled to look down and see a list of games rather than
    the controller they were viewing.

    On the other hand, during development, it's nice to be able to click refresh on the
    game and then refresh on the controllers. If the controllers automatically go to the
    main menu that would suck. I suppose the contollers could check if the game is
    still running and only go to the main menu if not. That would mean the workflow of
    refresh the game, controllers auto-disconnect, re-fresh controllers would work. But,
    anytime the game crashed a few moments later the controllers would go back to the
    main menu. Is that okay or is that annoying for dev?

    Should I even have a "disconnected" scren or should it just reload automatically if
    the game is still running or go back to the main menu if not? That would probably
    also make dev harder because the moment you refreshed the game all controllers
    would auto connect. Often I have 2-5 controllers open and I just want one to connect?

    Hmmm, the more I think about it the more auto-connecting seems good. I often want
    all controllers to connect. I can close controllers I don't want to connect.

    So, I'm thinking controllers gets disconnect message, it asks if game is still running,
    if yes reload, if no then main menu.

*   Remove sound from clock sync or fix it.

*   Remove local log stuff

*   Make games.html to make it easier to show off games. Generate it
*   Remove connect msg from powwow
*   fix powpow que/score display
*   add touchmove preventdefault lib to all samples

*   decide best dead-space etc for dpad

*   figure out why everyone is player2
*   make powpow use handjs
*   fix simple so div doesnt' mess up
*   show the bird
*   make simple and supersimple use template
*   make clock sync show a clock
*   make public/index.html template generated?
*   Make disconnect centered/sized and clickable.
*   Make controllers have button to go back to games
*   abstract name stuff

    Powpow lets you name your player. Should this be in every game? Turned into a library?

*   make public/index.html that lists games/examples

*   separate css.

    prefix all common CSS with HFT and/or surround common stuff with a id="hft" and
    use selectors #hft #foo, etc. What I don't like about this is if the individual
    game devines #foo it fails. So, should prefix all ids with #hft

*   fix simple controls and game so they use full area?

*   Make reload work on all controllers.

    *   consider making reload to go /index.html for game selection?

*   make dpad controller renderer

*   make all games use 'name'. save in cookie. Have gameclient send it automatically?

*   make all samples handle the sound starting
    *   without overlay
    *   and without sometimes not working
*   make all samples disconnect correctly
*   make all samples have a name at the top and a drop down gear menu
*   add set name to menu
*   make all samples share a header and CSS layout
*   make orientation example
    *   use colors
    *   random starting point
    *   camera
    *   shoot

*   Add timeout to server.

    If no input from player for more than N seconds disconnect player.
    Let game choose timeout

    *   Issue is conncetion is not lost if network is disconnected.

    *   Maybe this. timeout 5 seconds. If timeout send 'ping'. 1 more second
        and kill connection

*   move elaspedTime to global

    I got tired of passing it around everywhere. Unity3D doesn't.
    There are minuses for not passing it I suppose.
    I might consider passing around a process context but for now
    just made it a global (as in globals.elaspedTime)

*   rename entitysystem.deleteEntity to removeEntity
*   make entitysystem shared.
*   make examples
    *   rythym
*   Figure out what to do when game disconnects.
*   relayserver should tell clients when game connects/disconnects?
*   give each game an id so one relayserver can run multiple games
    *   hard coded id means one instance of each game
    *   generated id means can handle multiple instances BUT, need way to pick instance?
    *   relayserver needs to create a new player when switching games. Probably handled
        automatically as leaving the other game's controller panel will kill the connection.
    *   controller could have a menu button to go back to game selection screen?
*   fix server to re-direct foo to foo/
*   fix server to load index.html from foo/
*   make hitshield in mp3
*   centralize getRelative
*   remove cross dependencies
*   separate sample game code from lib
*   change JS so NetPlayer has disconnect event
*   see if I can use closure instead of class
*   make it sendCmd on both client and server
*   seperate cmd from data.
*   add clock
*   change audio to g_audioSys
*   Pass in audio system?
*   Pass in entity system?
*   make a dependency injector
*   make client side net code.
*   use strict everywhere
*   make haveserver settable from url
*   make sounds work iOS.
*   figure out why iOS is not syncing clock. Try other computers

Rejected
--------

*   switch to vertex shader based tilemaps.

    tried it to see if I could speed it up on lower end GPUs.
    Didn't help at all on an Intel HD 4000 nor a Nexus 5.

*   add some CSS animation foo for menu appearing, disappearing

    menu is rarely used

*   handle ssl as well for captive portal? I don't think I can :(

*   use express (the node server?)

    Is that overkill



