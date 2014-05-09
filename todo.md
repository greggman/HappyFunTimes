*   use particles for coin
*   fix coin collisions
*   use particles for boomboom death
*   Fix collisions for jumpjujmp
*   refactor sprite code to have offset (current assumes center of image is center)
*   refactor sprite code so drawPrep is only called once.
*   Make game maker plugin
*   Make C++ version of lib
*   touch code already debounces pressed so remove similar code from controllers?
*   figure out why no sound from powpow controller?
*   add settimeout/setinterval to game support
*   now that we have game URLs make main menu generated at runtime
*   boomboom
    *   fix explosion at crate/bush with nothing on other side. should be tip.
    *   implement kick (comment in kickCrate in boomboomgame globals to make powerup appear, then implement in player.js)
    *   Music
        * main
        * fast?
    *   "Hurry!!!"
    *   close off edges at 30 second point?
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
    * it works for 1 player
    * it doesn't swing around so much
*   make server serve "chose another WiFi network to browse internet"
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

    Of course sadly griefers can easily break games. Maybe I should fix this? They can break games
    by sending bogus messages. Example. `sendCmd('move', {dir: "foo"})` will end up in the code as

        position += msg.foo;  // exception? ... or actually position becomes NaN :(

    I could put a try/catch when I call events. Unfortunately you'd like to be able to catch
    the exceptions in the debugger when debugger. Maybe again this should be an option in
    starting a game as in `...?settings={trycatchevents:true}`

    That wouldn't prevent griefing. See NaN above.

    I'm just wondering out loud if by some luck HFT was used
    at a museum some griefer that knew the library could easily crash the game :(  I suppose,
    at least at the beginning, the odds that some griefer is going to come to some event with
    his laptop or tablet and hack some custom code just to be an ahole is not so likely?

*   Have better splash if no games running
*   make gameviews template based so we can make disconnect behavior common
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
    *   platformer
    *   8way shooter
    *   drawing game.

        Player's draw on their phone, add drawing to level?

    *   unity character controller
    *   johann sabastian joust?

        johann sabastian joust is a game played with move controllers
        where you try not to move the controller too much or you're out.
        Other players try to make you move to fast knocking you out while
        at the same time trying not to get taken out themselves.

        HTML5 allows access to the accelerometers of the phone so it
        should be possible ot make this game with HFT.

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

*   abstract out Unity3D parts of C#

    Currently the C# version of the library is Unity3d specific. Should be easy to abstract that out
    so it can be used in C# in general

Done
----

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
    *   fix explosion on crates
    *   show names (limit to size?). Maybe only show it larger if player clicks avatar
    *   make flames handle erasing correctly. Sometimes the wrong tip is displayed.
    *   fix turning. Trying to go down lines is too hard.
    *   fix so more than R*C players
    *   blow up bushes.
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

    * consider making reload to go /index.html for game selection?

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
    * hard coded id means one instance of each game
    * generated id means can handle multiple instances BUT, need way to pick instance?
    * relayserver needs to create a new player when switching games. Probably handled
      automatically as leaving the other game's controller panel will kill the connection.
    * controller could have a menu button to go back to game selection screen?
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

*   add some CSS animation foo for menu appearing, disappearing

    menu is rarely used

*   handle ssl as well for captive portal? I don't think I can :(

*   use express (the node server?)

    Is that overkill



