To Do
=====

*   make pixi example?
*   make cocos2d example?
*   figure out why retry didn't work at National Videogame Arcade
*   fix bombbomb hard to press button
*   fix buttons in jumpjump/powpow (bigger!)
*   add analog sticks to gamepad
*   update html gamepad to match unity gamepad
*   add frame rate for motion data

*   check kiosk mode and app


*   checklist
    *   ios safari works
    *   ios safari to app works
    *   ios app works
    *   android chrome
    *   android chrome to app works
    *   android app works

*   if controller does not have focus for > 30 seconds disconnect.


*   change sync clock to hft msg

    have clock take gameclient/gameserver. Use _hft_time_

*   add glow processing to powpow?
*   fix samsung
*   fix android non-chrome?
*   fix windows phone
*   send audio example

*   fix names in powpow?
*   refractor hft-server

    like I'll ever have time to do this but it's kind of spaghetti. It might be possible
    to refactor it to be more like express middleware where each handler has a (req, res, next)
    where next is the next handler and you can chain them?

    Maybe the cache should also move to the top of that chain? You'd basically want the
    first handler to see if it's cached. If not next() all the other handlers and somehow
    wrap `res` so you can capture the response.

    Should probably look at other caches

*   Figure out if it's possible to make HFT.net work on more networks

    HFT.net currently requires NAT based networks like home routers.
    Could it work on a corp network?

    Maybe HFT should just report on the game, no scanning. If no game
    exists or it's older than N (I think I trim already) then it should
    report "no games".

    That way users will know immediately.

*   add a hft.release.ignore array to package.json. if it doesn't exist
    have it be "src". Use it in release.make


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

*   Need to figure out how to test. Maybe Jest would help?
*   refactor sprite code to have offset (currently assumes center of image is origin)

    jumpjump could use this.

*   Make game maker plugin
*   Make C++ version of lib
*   touch code already debounces pressed so remove similar code from controllers?

*   boomboom
    *   implement kick (comment in kickCrate in boomboomgame globals to make powerup appear, then implement in player.js)
    *   close off edges at 30 second point?
    *   try to make real AI.

        I don't think this would have a point for HFT but I guess it would just be fine to try.
        Especially to see if it can be fast enough in JS for 400+ AI players. They'd have to
        probably get one AI tick for every N players. They'd probably only be able to look
        within some small range of tiles to decide what to do?

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


*   fix flex css (remove need for fixHeightHack)
*   figure out why deviceorientation message is low
*   test older ios
    *   consider making it warn if version not good enough
*   test older android
    *   consider making it warn if version not good enough

*   abstract out Unity3D parts of C#

    Currently the C# version of the library is Unity3d specific. Should be easy to abstract that out
    so it can be used in C# in general

Done
====

*   decide on what happyfuntimes is

    Decided it's just a library. below is just for history

    It started off as just a simple library to relay messages between game and controllers.
    But, as I added more games I started wanted to share code on the controllers. Then
    I got tired of typing long urls like http://localhost:18679/examples/boomboom/index.html
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

    So, I think I might make the ExampleUI part of the *base* happyfuntimes.

    That brings up another question though. Right now there's a name bar at the
    top of the shared part of the controllers. I wonder if I should get rid of that.
    I could instead make it so when you connect to the router it takes you do a page
    that says

        +-------------+
        |happyfuntimes|
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

            *   step 3, add a gallery

            Could have games.html show recently played, recently installed, link for gallery,
            promoted games, ... (promoted games only works if using real net.)

        *   How about making hardware. For example an android stick with HFT pre-installed

            I could boot directly into HFT. I could either be the WiFi or it could connect
            to your home WiFi. Unfortunately with your home WiFi there's no way I can
            think of for the phones to find the HFT machine through the browser?

            One idea, use the WebRTC api (not available in iOS yet :()) to get your local ip.
            From that you use XHR to try to contact all class C ip addresses searching for the
            HTF server

            You could serve the page that does that from htf.com or something like that.

*   Consider deciding the ExampleUI etc is part of happyfuntimes

    This is mostly here for history.

    Originally I thought happyfuntimes was just the relayserver and the libraries to
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

*   make unity provide files for controller

    in editor send each file. On Export generate .zip.bytes. Maybe make new option
    for "Export standalone"?

    The problem is happyfuntimes needs at least a package.json to be able to add
    the game to the happyfuntimes menu. But a standalone exe wouldn't have such
    a file anywhere that I know of. I guess it does generate a _Data folder that
    I could look in. not sure how Windows and Linux apps are distrubuted.

    The question is basically how do I install it. Ideally there'd be just one way

*   fix games so if they disconnect, when they re-connect they reload.

    I'm not 100% sure this matters but, the issue is if I kill the relayserver
    to restart it, the games detect that and put up a message. When I restart
    the relayserver the games remove the message but seem to often be in some
    indeterminent state. Ideally they'd just restart, the controllers as well.


*   make hft a lib for electron
    *   port bombbomb
        .   handle disconnect/reconnect
        .   handle port changing (2 apps)
        *   fix fixes
        *   handle external server
        *   pass arguments through from server (actually don't parse in server)
        *   make server return something, not auto start?
        *   test captive portal
        *   add settings dialog?
        *   add setings from command line?
        *   export to app
        *   make app use real name
        *   supply app icon
        *   fix about (send about to game)
        *   check we can set name
    *   port powpow
    *   port jumpjump
    *   port device-orientation
    *   port simple
    *   port 2d sync
    *   port 3d sync
    *   port multi-platform

*   Videos
    *   Setup video
    *   Walk through unitysimple
    *   Make new char example
*   write docs for each sample, and/or video
    *   unity character
    *   unity multi games
    *   unity playerinscene
    *   unity 2d platform
*   fix realgame so it auto includes realgame.js and doesn't need manual HFT stuff
*   check device orientation works both android and iphone
*   move hft.net to it's own server
*   powpow
    *   make controller say "control ghost ship"
*   upgrade servers
*   stop sliding fingers from selecting stuff.
*   unity: see if we can figure out a way so controllers don't get disconnected if script is updated.
*   boomboom
    *   "Hurry!!!"
    *   figure out what players waiting can do
*   make videos
    *   run unity simple
    *   run unity char
    *   run unity cardboard
    *   run unity accel
    *   run unity device
    *   run unity video? (no)
    *   make simple project

*   Add unity support for multiple games
*   add optional player timeout?

    I already have the ping but maybe I should also have an input timeout.
    No input for N seconds = disconnect. Useful for installtaions as I suspect
    people might walk away and leave their phone connected. If there's no
    input for a while we'll assume they are no longer participating?
*   try more CSS

    can we get things to position left bottom relative etc...?

        position: absolute;
        right: ??
        bottom:

    what about groups of stuff?

    One problem without scaling

        +----------------+
        |                |
        | B U T T O N 1  |
        |                |
        |  B U T T O N 2 |
        |                |
        +----------------+

    can end up as

        +----------------+
        |                |
        | BBUUTTTTOONN12 |
        |                |
        +----------------+

    maybe now that iOS8 is out we can forget about iOS6? I doubt it.
    Too many iPhone4/4Ss still out there.

*   add a session id to controller so you can continue where you left off

    this can all happen automatically. GameServer playerconnect could include
    the sessions id. At that point it's up the game to use it to save data in
    localstorage or wherever.

    Of the top of my head, gameclient would get sent and id from hft
    which it would write to a cookie? If the game is restarted that
    id can be sent back to the game at start up to reconnect a player
    with their previous state in the game.

    This would only work for a controlled restart of a game. Basically
    the game would need some way for a user to request it shutdown. It
    would then save all needed state for current players associated
    with their session ids. I could send these ids to the controllers
    at that time.

    On restarting the game the controller would send the id back so
    the game could reconnect them to their state.

    This is only needed because networking equipment sucks and has
    to be rebooted from time to time. If we can get networking equipment
    that never needs to be rebooted there is no need to implement this.

*   write unity docs
    *   UnityScript
    *   C#
    *   JavaScript
    *   File Layout
    *   N/A Git
    *   Publish
    *   Test on Windows
*   make games run without hft

    *   jumpjump
    *   boomboom
    *   powpow

    I'm not sure what to do. I think I'll try to add stuff to cdnjs? Problem, they want a minified
    version. I can concat stuff? Not sure how I do just part of it.

*   need to figure out how to handle 2+ hft's on same network.

    maybe happyfuntimes.net shows 2 and game being played?

*   switch port to something less likley to be in use. How about 8123 for now. We can register one later if we get users.
*   jumpjump: reset coin on level reset.
*   fix docs
*   fix localhost replacement so it includes port
*   Change jumpjump and powpow L - R buttons to something that looks like you can slide your finger across it.

    Watching players play I've noticed many try to press those as two separate buttons where as it's
    actually designed so you just slide your finger. Maybe drawing a rocker button or one long button
    would help?

*   Make random color pickers based on color perseption.

    Currently random color are based on HSL. They often look too similar.

*   Need to figure out auto-docs
*   make it easier to use

    This is basically covered by the gamepad code. Below is just for history

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

*   N/A make controllers check for other games if the game has not yet connected?

    There's an issue where sometimes a controller will be waiting for a game since
    controllers can join first. Maybe controllers should check for other games until
    they are sure they are connected to a running game. If the see a different game
    they can switch to it.

*   refactor client side js so no requirejs needed? (though still supported)
*   could make hft optionally register ip:port with happyfuntimes.net

    If ip address is not in one of the 'normal' class ips that are scanned by happyfuntimes
    then it could be added. Also, happyfuntimes.net could check the ip address of hft
    and the ip address of users and match them up since they'd all be behind the same
    nat?

    Maybe hft could check netmask, if class B then do extra stuff?

*   make sync examples work. Where should they show up?
*   add system session id. When checking ip addresses from scanner
    merge by session id. Maybe just use system name
*   figure out why Player23, Player24, Player25
*   make HFT so if we can't contact HFT.net we try again every 10 seconds for 2 mins or so
*   add a max players option to playerspawner?
*   change samples the use name to use new name system
*   add progress bar when scanning
*   add easy message to unity-gamepad
*   make unity export open export folder in finder/explorer?
*   add "touch to start" on android (and iOS?) both sound and fullscreen can be added

    going to try the new on touchstart stuff for now

*   make instructions CSS handling less hacky

    need to be able to edit CSS and update it

*   drag and drop install?
*   fix upgrade to stop running hft
*   why does play appear on hft-tonde-iko without passing select screen?

    because new players get passed a `data` that used to be null if the
    player was new but is no longer null because of __hft__ fields

*   figure out why buttons get stuck and remove timout
*   make instructions not scroll if can fit?
*   why is nexus not working on hft-tonde-iko

    because of anti-scroll code.

*   remove upgrade warning with install --upgrade. change to "upgrading ...."
*   Export in Unity
    *   why textarea is not big for description?
    *   If install make it say "install"
    *   If install select platform and hide platform choices
    *   Make install and platform expanded by default
    *   (remove install check. Its' confusing)
    *   make semver editor?
    *   Check when installing game appears in /games.html
    *   progress?
    *   check package.json gets saved
*   make prefab in scene not generate errors
*   fix HFT not noticing new game installed/removed
*   keep backups of installed-games
*   make unity input tester
*   add multi-touch support to unity-gamepad
*   add jsfx support to unity-gamepad
*   put menu/banner on docs.happyfuntimes.net
*   figure out why hft-garden broke
*   garden: hold button to fly
*   garden: tilt to aim, press to move, flap for speed
*   powpow: control ghost ship
*   boomboom "dead" -> "throw bombs from the side"
*   boomboom teleport to side
*   banner
*   change SetColor in hft-gamepad-api and hft-unity-gamepad and hft-garden
*   decide on now to handle max players. Should it be 2 messages? _hft_full_ or something else?
*   test you can set options
*   make hft-unity-gamepad
*   add hft stop
*   put link to plugin on start video
*   provide screenshot and icon if missing (use logo)
*   Split PlayerConnector into PlayerConnector and PlayerManager
*   add MaxPlayers to playerspawner
*   remove all offsetX and offsetY from sample controllers
*   make --minify minify the main script for controller

    made it --optimize-controller

*   make it not check for app by default
*   make hft-unitybuild insert top hft.hanson API version in default package
*   Update all samples to api 1.12.0
*   make LR
*   make LR + 1
*   make LR + 2
*   make touch
*   make orientation
*   make accel
*   fix CSS for 5s on hft-gamepad
*   make hft-gamepad only try to connect once (or for 30 seconds)?
*   make gamefiles invalidate cache

    easy? override fs.watch or whatever it's called
    since cache is using fake filesys
*   make gamecontroller compatible api? Can I add more controllers?
*   handle no package.?

    idea: If game has files and inside files is package?
    or: if flag "noPackage" or if "package: packgs".

    Why is this needed? Because HFT needs someway to (a) tell you
    you need a newer version and (b) know what path to server your
    files from (does it needs this? make up a path?)


*   add max players to HTML5 controller
*   add colors to controller-support
*   fix all samples to use orientation
*   app

    *   prevent sleeping
    *   hide status
    *   reset controller back to non - oriented

*   allow setting portrait/landscrape from package.json

    this way the framework can take care of the message
    and if there's an app can put the app in the correct mode.
    maybe it should be in SetupCommonUI?

*   add session and name support to js
*   add hft_error msg so hft can deliver errors back to
    the source.

    No. I started implementing it and then I realized that probably > 50% of the time
    the issue will be a typo. The typo will prevent the logging code from running so
    most of the time the user won't get a message helping them fix stuff which will
    just make it doubly frustrating if they get used to getting messages sometimes.
    Better they setup remote debugging because the remote debuggers will show typos
    and syntax errors etc..

*   check osx unity no hft works
*   check win unity no hft works
*   do sampeles type = doc
*   publish new hft with publish bug fixed
*   add about on name page and waiting page

    that way if so if someone goes to hft.net on a network with hft they can
    find out about hft?

    no, it's confusing. Players might pick it instead of "ok". The number of times
    someone wants/needs to see that info where they might get stuck on that page is
    close to 0.

*   Sign OSX pkg with account?
*   should we get rid of bower?(yes!)
*   make PLUGIN!
    *   generate public json that lists were there sample's packages are
        *   have plugin go to package.
    *   make all samples have html in WebPlayerTemplates
    *   make hft publish export .package and upload it
        *   hft export (add --export-package)
        *   hft publish (add --export-package)
    *   make hft-unitybuild grunt publish all projects (option)
    *   make hft-unitybuild check git has nothing outstanding
    *   make hft-editor-menu point to github/latest/file (or make it ask github?)
    *   make it set project settings
        *   Run in background
        *   Start FullScreen
    *   make package.json editor
    *   make "new project" button? (no need. Install plugin)
    *   make "start HFT?" button (or should running it be enough)
    *   make "location of HFT" button? (asks if can't run)
    *   make stages of commands
        .   cmd with cmd string RegisterCmdHandler<type>(fn)
        .   RegisterCmdHandler<type>(name, fn)
        .   RegisterCmdHandler(fn);
        .   Use RegisterCmdHandler(fn) for gamestart
        .   SendCmd(name, MessageCmdData)
        .   SendCmd(name, Dict)
    *   can we make an hft bower that runs bower pre-installed?

        no need. If sample is installed as package bower_components is included

    *   can we make an hft git (no)... but pre-installed bower no need for node?

        no need. Can install as package.

*   move assets in samples out of examples folder
*   add git pre-commit hook for lint/test
*   check version of plugin gets bumped

    do I need this? Basically I need to edit Project/AssemlbyInfo.cs but if I bump
    versions will old code link? I links, it just complains. Curious what the proper
    way to do this is.

*   figure out why HFT is not setting run in background on import

    it was because that code disappeared?!?? No idea where that code went

*   figure out why chrome didn't launch in osx

    not sure. Seems to be working now

*   check for bower shit.

    This isn't an issue for Unity because we're putting the files in assets
    and distributing by .unitypackage

*   fix controlers L R buttons are tiny
*   make install dialog pop to top
*   fix unity device and orientation test
    *   remove alert - switch to HFT alert
    *   fix message (add imge?)
*   PlayerConncetor

        * handle name
        * handle color, game should pick
        * handle busy
            * send message to phone
            * have phone show busy
        * handle spawn
            * have phone switch from busy to active
        * handle reconnect

*   have hft check if it's already running
*   why do I scan tree in readInfo? (to find icon and screenshots)
*   remove connect/disconnect from simple and unitysimple examples
*   make windows install for all users (optionally?) (no, fixed permissions to "user")
*   send all ip addresses to hft.net
*   Make make work with WebPlayerTemplates
*   compress hft.net!
*   change basePath to htmlPath, packagePath, rootPath
    *   check all calls to readGameInfo. They should pass in rootPath
    *   check all calls to parseGameInfo
    *   check all calls to writeGameInfo
*   move tiled support to hft-tiled? (put it in hft-utils)
*   add tiled support to jumpjump
*   figure out err msg for un-added games. As it is controllers just get JS errors.

    Unadded games, which really only work for Unity, now work. They won't show up
    on the games.html screen but controllers will connect.

*   add fullscreen to android
*   make --kiosk
*   make games 'reload' if the server disconnects then reconnects

    can we some how indicate to the game it's a reconnect? For example, set a local cookie.
    On load read and clear the cookie. Set a flag on gameserver?

*   figure out why unitycharacterexample is not exiting when hft asks it to.
*   Add option to skip name input. hft start --no-ask-name
*   make controllers only work if game is running, otherwise switch to other game
*   make games use websockets to switch games instead of polling ajax
*   make subId the id. If not subId use a prefixed id like _hft_123
*   test broadcast
*   support multiple games on the same gameId for shared games.

    see hft-jumpabout

    *   gameconnect?
    *   if same subid remove old

*   handle multiple happyFunTimes on same network
    *   Allow specifying name --machine?
    *   let user pick
*   allow local icon
*   if --dns
    *   require port 80, fail if we can't get it
    *   print 'need sudo' or figure out how to ask for permission
    *   show "setting up ... animated screen" because it takes time for /etc/resolve
*   check that first installed game works.

    Works for me :)   :(

*   add es6 support

    *   make it so files with ".js6" get transpiled on the fly. Use cache so they
        don't get transpiled more than once

*   genreate min/concat version of hft libs. Allow you to select that style in package.json

    so no requirejs

*   Add 'what is this' to hft.net
*   make hft.net fail if there's no matching IP

    right now it falls back to the first impl which as to scan. But scanning takes
    forever and seems mostly pointless. Maybe I can make hft.net/scan or scan.hft.net
    for those people who don't want hft to ping hft.net? Although using hft.net to
    deliver the scanning code seems like the same thing so what's the point? Just
    remove the scanning code.

    When if fails it should effectively say

    > are you sure you're on the same network? Connect your phone to the
    > same network and click "try again".  help.

*   make HFT start with a overlay that explains how to play "users must be on same net, go to hft.net"
*   Need to make installer for hft
    *   Windows
    *   Mac
    O   Linux
*   Add repo link to game screen on shft
*   when the last page disconnects from __hft__ shutdown?

    I'm worried there are times when no game is connected. Also during dev

*   document unity3d
*   document hft cmds
*   make publish upload package.info. Use that one in manage
*   Check publising works.

    I think publishing checks the online package.json but it should be checking the local one?
    Except that maybe that's not what it should do?

    Issue is I zip up the local files which is fine. Those are the local state. But,
    manage.shft looks at package.json that's not inside the zip. Maybe I should
    upload that as a release file so I can download it? Would also have to upload screenshots
    and icon. I can then point to them?

    Solution: Upload package.json to release.

*   Make shft live!
    *   make registration server work
    *   make minimal design
*   in app-mode, before launching browser, if we can't run server should we check that hft is already running?

    or, maybe we should even do that before trying to run the server at all.

*   Make shft update-exe
    *   runs hft-exe (or requires versions) (look into using vmware -- after alpha?)
    *   posts to github
    *   updates shft/install
*   install from front page goes to window. Remove it? No, fixed it.
*   add link to shft on games.html
*   add super alpha
*   launch from shft to game isn't working
*   fix test broadcast gameserver.js line 278

    note sure what I was smoking. This looks fine

*   fix unity dialog in games.html
    *   use fixed CSS
    *   make it exit unity game
    *   make it dismiss if unity game exits
*   make installing a game add in realtime
*   Make upgrade game work?
    *   merge files
*   set x chmod for unity download
*   check if more stuff can go in platformInfo
*   have list show runtimeID and originalId
*   make varnish cache the pages
    *   can I verify
    *   can I automate clearing the cache

    Read up on meteor. You can't do this with meteor :(

*   consider making HFT work with old games?
    *    no, because I need to be able to update the templates as HFT adds to features. Old games won't do that.
*   make --app-mode
    *   make small splash "happyfuntimes Running ..."
    *   check if it's installed. (config exists), if not make it.
*   Refactor gameInfo so it returns a runtimeInfo
*   automate exporting unity
*   fix game ping. move it lower level?

    This is hilarious. I had Player, the server side object that
    tracks the connection to a smartphone for a single player, have a
    heartbeat ping because often
    players would just stop playing on their phone by having their browser
    go into the background. In such a case they aren't disconnected
    from the server. So there's this idle player in the game waiting for
    a networking message. Maybe "waiting" is the wrong word, rather it's
    as though the player is making no input.

    I wanted to remove those players so I have a heart beat. If no input
    from the player comes in 5 seconds I ping the player. If no message
    comes back in 1 second I kill the player because his browser is
    likely no longer active.

    So, I'm trying to ship. I test Unity. Then the unity game quits
    the players are not disconnected. My (bad) intuition says "hmm,
    the socket must not be getting disconnected by unity. I try
    disconnected it manually using OnApplicationExit. No change. I figure
    given that the C# websocket stuff I'm using is multi-threaded it
    must be that it's not actually getting executed before the app quits.

    Fine, I'll add a heartbeat to the game as well as the player. I
    try refactoring the code to work and run into issues. Revert all
    that and decide to implement it separately. Run into issues again
    and revert all that.

    I figure that my heartbeat should go at a lower level than it was.
    I implement that. Spend 60-90 minutes debugging. It finally works.
    I go back to my Unity sample and test again. Controllers
    still don't get disconnected when the game exists even though
    I know the ping is working.

    I finally realise the issue has nothing to do with that. The issue
    is there's a flag the game can pass `disconnectPlayersIfGameDisconnects`.
    In JavaScript it has 3 values. `undefined` (the default), `true` and `false`.
    Just a couple of days ago I added it to C#/Unity. It defaults to `false` in C#!
    DOH!!!!

    All that work adding a ping at a lower level had nothing to do with
    anything. Well, let's hope that's better anyway :P



*   back to the 'id' issues

    so a dev has gameId="mygame". They want to test installing it from the store.
    The store downloads it, installs it. There's now 2 games with gameId="myGame"

    Solutions:

    *   iOS/Android solution must change id. No exceptions.

    *   I could try to change the name. ids installed by hft (in the gamesDir) get their normal id
        games outside get prefixed or suffixed by (dev).

        I could do this in readGameInfo. For running that would work except for unity. It would
        break all building. On top of that it's not a generic solution. Maybe you want
        multiple versions of the same game for testing.

        I could prefix with the entire path? Then if you had more than one you'd get
        multiple. This worked!

*   make shft recover from hft stop/start
*   add hft check which just checks the package.json in the current
    folder
*   make shft say "install" instead of "..checking.."
*   make backup script for mongodb and live/program/client/assets
*   make release script for hft-exe. Have it update shft/install using manage
*   make shft/install check if you have hft running and if you need to upgrade.
*   add "blurb" to entire thing.
    *   package.json
    *   manage
    *   site
*   refactor server.js so I we can call it from testing
*   Move server/* to lib where appropriate
    *   Need to make sure shft stuff still works
*   CHOOSE THE PORT! Picked 18679 which is 0x48f7. 0x48 = ascii 'H' so its Hf7  7 = T in leet.
*   add winston
    *   manage
    *   site
    *   hft.net
*   no websockets on shft
*   Make HFT init config on --app-mode
*   separate inmemfilecache into cache vs filecache
*   Add Quit option
*   make way to quit HFT from browser.
*   Make HFT launch browser on --app-mode
*   make hft exe launch in default browser but ask for chrome or firefox
    *   osx
    *   win
    *   linux
*   Make it if launched twice it doesn't mess up. (needs to launch browser reguardless but not run server)
*   file bug with apple about canvas/photos.

    The issue is as of iOS7 at least you can request an photo
    in HTML with `<input type="file" accept="image/*" />` but you can't then actually
    use that image beacuse iOS Safari's canvas implementation doesn't allow images that large.
    In other words, I'd like to let the user take a picture, draw that picture into a smaller
    canvas with something like `ctx.drawImage(photoImage, 0, 0, ctx.canvas.width, ctx.canvas.height)`
    but that fails because Safari iOS canvas 2d implementation doesn't allow images the size
    taken by the camera. Smaller sizes work fine. Here's hoping Apple will fix this (though given
    no response on the bug I'm not hopeful).

    https://bugs.webkit.org/show_bug.cgi?id=133570

*   consider making server serve games flatter?

    game would be served at

    http://localhost:18679/name/

    instead of

    http://localhost:18679/games/name/

    Is there a point?

    One other idea, allow the game to exist else where
    but run at http://localhost:18679/games/name

    As it is games must exist inside hft. Should they
    exist outside hft? Would allow non-hft games
    to support hft easier?

    This is basically done

*   make hft insert controller.html
*   implement simple in-memory file cache that checks if files are loaded
    *   rather than check if a file has changed with stat, use events to check if files have changed.
*   check that bower git: doesn't need to be https:/
*   make games install anywhere and use ~./happyfuntimes/games.json
*   make hft command line

    hft should call into happyfuntimes some how. I guess it should be a 'dev' function?
    Need to figure that out. I guess happyfuntimes could write to ~/.happyfuntimes/config.json
    which the localtion of Happyfuntimes, then HFT could use that.

    *   hft add - adds to ~/.happyfuntimes/installed-games.json
    *   hft remove - removes from ~/.happyfuntimes/installed-games.json
    *   hft install - installs a game from the net.
    *   hft init - make a new template for a controller (and optionally a game?)
    *   htf build - inserts the template stuff into the game/controller? or maybe we should do that automatically

*   Fix uses of IO that are result,err ot err,result
*   when creating zip check names are ascii, not too long?, and no case sensitive duplicates
*   make hft-cli have publish command. It looks at package.json, based on type
    it checks various things can complains if wrong. Examples.

    gameType: "html"

        * update version (ask, allow no ask via cmd line (--auto), and skip (--no version))
        * make release on github
        * zip up entire folder
        * update to github

    gameType: "native"

        * update version (ask, allow no ask via cmd line (--auto), and skip (--no version))
        * check for platforms
        * warn about missing platforms (ask?)
        * update package.json if it doesn't match for missing platforms
        * zip up release folders, one for each platform? Two one per platform and one for assets?
        * upload releases to git

*   Check failure on native-msg-box
    in particular check if native parts don't run that we don't return OK or YES
*   If game is installed button should say "Run"
*   make all hft commands have --config so you can point to a different config.
*   make hft-config configure config.js
*   implement hft download <gameId>

    dowloads and installs a game by id.

*   on install add files that were written to installed list. on uninstall on delete those files?
*   look up best practices for user:pass
*   if --user=name has no colon prompt for password
*   FIX GEAR ICON!!!
*   fix hft init so it works from scratch. Add npm test!
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

*   N/A fix camera on unitycharacter example so
    *   it works for 1 player
    *   it doesn't swing around so much
*   update unitydocs with UnityScript
*   it might be a FUCK LOAD easier to make the controllers using canvas instead of HTML.

    no fighting where where you want controls to appear, no trying to center a character
    inside a div. Just draw what you want. I swear I waste 1-3 hrs per controller
    futsuing with CSS :(

*   refactor boomboom (and jumpjump?) to make the rendering forward driven.

    For example in boobboom the layers choose their own offset.
    where to draw. Rather that should be passed down.

*   N/A Game service / package installer?

    It might be nice to make this like many of the package installers. You could download
    happyfuntimes then type something like

        hft install someplatformgame

    Which would go and install platform game from some repo just like `npm` and other
    package managers do. Just an idea.

    I could also change the relayserver to search for games.

    I'm mixed on this idea. I really like the idea but there's no point unless there's
    100s of games to install. At the same time, conversely, having it might make
    it more likely people would write games. It might also make it super easy
    to download gamejam games etc.

*   Change powpow to use more ship colors
*   use particles for coin
*   use particles for boomboom death
*   Fix collisions for jumpjujmp

    for both coin and player collisions I'm just checking where they tried to go
    I'm not checking the places in between so if the frame rate gets too slow
    bad things happen.

    Ideally I should separate the collision checking into some lib/utility

*   N/A make server serve "chose another WiFi network to browse internet"
*   make bird quack if you click him (consider random speed)
*   should I restructure samples to wait for sounds to load?
*   consolidate assets

*   remove window everywhere?

    might be a good idea to wrap js with (function(window, undefined) { to make sure
    all references to globals are missing

*   Get nice designs for games. Particularly controllers

*   N/A Have better splash if no games running
*   **Issue:** Anyone can go to the gameview.html for a game. (don't care)

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

*   N/A change games.html title to be ip address or instructions
*   N/A If UI is not part of examples but a part of HFT then need to figure out which .js file should be shared (ie, moved to public/shared/scripts) or something.
*   Make buttons on Jumpjump, PowPow full height.
    *   add option to show buttons?
*   Consider providing a game side library for name images/textures

    The issue is a name can currently be 16 characters. That's pretty long, especially in Japanese.
    The library would make an image of the name, optionally with background color? And format it
    either breaking at space or scaling if too long or something.

*   N/A make games.html msgs show up even when scrolled down
*   N/A need to store LRU for games somewhere. ~/.happyfuntimes
*   N/A In installed version
    *   Make page shows games, tab for gallery, tab for settings
    *   settings
        *   allow contollers to change games (so a bar can make it so people can't change games?), only
            the person at the computer can.
*   N/A Main UX (/games.html)

    *   Needs to have XBox/PS like UX. At a minimum
        *   Show recently played games
        *   Provide UI to find games
            *   By alphabet
            *   Search
        *   Should be controllable from phone. (how do we handle 25 people trying to control it?)
        *   gallery Tab/selection
        *   Should we have a recently updated section?
            *   For stress on servers maybe it should be like XBox/PS. Updates are only checked if
                you launch the game?
        *   Should have a 'new' and 'updated' feed from public db.

*   N/A package.json needs
    *   "gameId"
    *   "apiVersion"  min version needed. Use it in template
        * api version should look up defaults?
    *   "platforms"  array of platforms support
    *   remove "useControllerTemplate". Make the default but maybe override?
    *   remove "screenshot.png". Make the default
    *   use name for gameId? no. Name is unsafe, any char, id is safe? Or could gen safe id.
    *   if controller needs certain features? WebGL, getMedia, etc. Can tell if will run on phone
*   when listing mulitple HFTs running behind the same public IP address include
    username and machine name?

    hrm, that doesn't seem very secure. I wonder if it's
    ok if I only send it to people on the same subnet? How would I know? Check the netmask?
    The only phone needs this info. It's just some way to say.

        Pick Game to Join:
           jumpjump on sysg
           boomboom on tami's mac

    maybe machine name is good because it has less privacy issues?

*   N/A stop using gameIds in certain ways.

*   N/A remove adm-zip and replace with something else. Ideally something that streams
    so the entire file doesn't have to be in memory. Maybe zipstream?

*   N/A fix queuing of messages. They queue objects but should queue strings.?.
*   N/A have server start __hft__ game.
    *   have it mark that as not listable? (what's the point of the lists?)
    *   make an install command
    *   figure out what happens if disconnected

*   N/A Have superhappyfuntimes check that happyfuntimes is running and request to run it. gray out install buttons
    until it's running. Use game to run it?
*   N/A Sanatize msgs to native-msg-box
*   N/A Make sure superhappyfuntimes can be indexed.  enable meteor spiderable
*   N/A look into openframewords.cc's http://ofxaddons.com/ how it watches github tags
*   N/A remove the need for gameids?

    I started with gameIds used for connecting contollers to games. Now I'm also using
    them at install time. The problem is a I have a DB of gameId -> game but if you are
    doing dev you might have 2 games with the same id. The one installed and one sitting
    in your dev folder.

    For connecting a game to a controller, I could make the server handle it. At startup
    it knows, based on the folder it's serving the files from, which game they belong to
    so it can send some made up id to each game.

    That leaves the id only for the gallery. In which case I only care above apps installed
    in the HFT games folder (non-dev). Meaning an id is a gallery<->installed game mapping.
    But nothing else.

    Actually that doesn't work because unity is not launched by the server when in dev
    so it won't have a way for the server to give it an id.

    So instead, there's 2 ways of mapping ids

    1.  id to installed game. This is GameDB.getGameById

        This is useful for install/uninstall

    2.  id to running game. This is something the relayserver does. In that case
        I don't care about installed ids. I only care to connect a controller to the
        running game.

    Except... :(  In the case of unity I don't know which controller to run because
    it's by default http://localhost:port/games/<gameid>/controller.html when it really
    and that's not enough info to map <gameid> to one real folder or another.


*   N/A make install screen only show your OS. Link to "other versions"
*   N/A should I switch all of the gamedb to meteor?

    No, as their's no database? But I can run it through collections.

*   N/A use github oauth2 authentication.

    save the token in like .happyfuntimes/repoauth or something? Is it safe to save that token?

    Then, subsequent commands can use the old token. If error re-auth

*   N/A Can we make Unity plugin find the port? It could look in ~/.happyfuntimes/config or something.

    I worry that it might not work in some other platform

*   N/A add loggly or other logging both client and server. Make sure you can opt in/out.
*   N/A make it possible to pass description to publish which becomes the "body" field.
*   N/A Use 'unconnected' collection to handle installed games? Copy gameDB into Collection?
*   N/A Is it possible to put meteor into hft so I can use it for local game sys?
*   N/A games installing status needs to be per game like play/itunes because 2+ games
    N/A could be being installed at the same time.
*   N/A when making a package for a native game warn if EXEs are not near same date
*   N/A move username/password prompt to func
*   N/A install meteor browser policy
*   N/A turn off meteor websockets and live updating
*   N/A make "pubish-file"? that adds a specific file to a release?

    basically I want someone to be able to make an executable on
    a particular platform and then add it to the release

    maybe call it "add-to-release"?

*   N/A make hft notify

    notifes the gallery of an update.

*   N/A make 'fix' command that removes games that don't exist anymore
*   N/A Make games.html detect features and suggest a different browser
*   N/A Have browser check if it's the default for hft. If not suggest to make it the default for hft.
*   N/A add option the choose browser to launch?
*   N/A Add options to HFT
    *   dns (see above)
    *   system name (name to use if multiple machine)
    *   private
    *   phonecontrol
*   N/A add option to hide it? ([x] show help on startup)
*   N/A make hft-exe update Info.plist version from hft version?
*   N/A Optionally allow games to advertise they are running.

    superhappyfuntimes can show games in your area. Think

        15 people playing jumpjump at Joe's Bar in Maintown, MA
        17 people playing shootshoot at Big Burger in Anywhere, USA
        etc..
*   N/A Add phantomjs based tests
*   N/A make a test game for unit tests
*   N/A should make-release check API version?
*   N/A maybe shft should not install ever. It should just redirect to hft.

    So, clicking "install" on say powpow would redirect to `http://localhost:18679/install.html?id=powpow`

    or

    maybe SHFT should redirect for games so if you're running HFT then clicking a game would go
    to `http://localhost:18689/game/powpow`. If you're not running HFT it would go to
    `http://shft.net/game/powpow`

    Just thinking out loud.


*   N/A consider install using an per platform installer app

    the installer app would be a generic app. It could either take an argument like `--path=pathToZip`
    or it could just install itself and uninstall itself. The point would be a real installer
    would ask for real OS level permission to run rather than my hacked msgbox.

    In the case of taking an argument it would install the zip. In the case of just being a no-op
    installer we'd just check for success or failure. On failure we wouldn't install the zip.
    On success we'd use the current install process.

*   N/A just like games, games.html and options.html should maybe be put realtime in a template?

    If nothing else there are common things like handling disconnect, reconnect, and maybe
    handling quit as well as providing a common frame.

*   N/A update .travis.yml back to 0.10 once they release 0.10.32 (0.10.31 has a core dump bug)
*   N/A get rid of meteor

    could port to app engine or similar for scalabiliy. Or at least consider making it a big
    static site that just get's rebuilt when a new game is added?

*   N/A support 2 factor for publish
    *   publish
    *   update-exe
*   N/A On mac make terminal visible or at least provide some kind of window/icon that users
    can use to quit.

*   N/A make UX option to turn on DNS

    *   Needs to ask for sudo permission or at least some how get port 80. Maybe it could reboot?
    *   needs to show status (trying `/etc/resolv.conf`)

*   N/A make code send API version

    for HTML that might be hard because we don't know the API version until after
    most of the code as loaded. We need to know what startup code to serve
    and we know that from the package.json

    For Unity nothing happens until the game starts so we could at least check
    and adjust? Should we complain if the package.json doesn't match? We need
    it in the package.json so we can know before downloading if it's going
    to work.  But, while developing you might forget? I guess it should at
    least print a warning

*   N/A Add testing using mock request and mock websockets

    I think the mock websockets will be easy as I already basically have mock websockets
    for the __hft__ game. For request there's got to be some express/request mock already
    out there.

*   N/A make shft tell you you need to upgrade hft
*   N/A make hft-exe write over old version? Should ask? --force?
*   N/A add purge request to manage gamedb for icon and screenshots
*   N/A consider porting shft to Google App Engine or something else that scales with no work.
*   N/A fix shft update-exe so username:password works
*   N/A make --export for make-release the default
*   N/A make option for manage to email github repo user results of registering
*   N/A Unity plugin can run editor script that looks for HFT. If not found forwards you to shft.
    *   Once installed can use hft newgame to setup new projects
*   N/A Add a support field, default to github issues
*   N/A if hft is not running, have shft save a cookie if you choose a game to install.

    when hft starts it can open an iframe to shft which will read the cookie and
    trigger and install question

*   make hft newgame make a folder, ask the gametype etc.?
*   N/A add "hft remove --missing" and "--broken" to remove missing/broken ones
*   N/A consider using a fake inmem file system for testing, both reading and writing
*   N/A publish unity plugin
*   N/A fix back button on shft game page. Only center is hot.
*   N/A make hft-publish work for html-example
*   N/A check 1.7.0 projects tell you you need new version of HFT
*   N/A unity plugin
    *   make it warn you you need a new version of HFT.
    *   Have LocalNewPlayer emit game msgs
    *   remove namespaces from samples
    *   add HFT->Export the exports all 3 to the correct palce
    *   add HFT->Publish that does an export and then published? (needs git currently).
    .   When running HFT from Unity don't bring up localhost../games.html
    .   option to open controllers?
*   Have LocalNewPlayer emit game msgs(JavaScript)
*   have hft wait 2 seconds for ping from local:/games? if pinged bring to find instead of lanching tab
*   N/A add hft set or hft set-install to set which HFT is current
*   N/A shouldn't be able to make-package / export bad version.
*   N/A build should do hft check?
*   N/A build should add .meta files?
*   N/A change alert for errors to html dialog
*   N/A update all samples to newest api-version
*   N/A have plugin auto update package.json to newest API version?
*   N/A figure out option for unscrollale vs scrollable controllers
*   N/A Make hft delete for deleting old releases
*   N/A put categories in unity plugin
*   N/A scroll/no scroll setting
*   N/A zoom/no zoom setting
*   N/A app

    *   fix index to restart if no connection?
    *   app needs a resume screen (so you can exit?).

        if the app is not the front app, then next time it's the front
        app it should have a dialog "resume? quit?" or something?

    *   problem: connect to game, game exits, game restarts, controller goes
        to index.html. Index thinks not in game because it's cleared cookie?
    *   make hft redirect to app
    *   when app goes to background, next launch start over or have "resume" (maybe can ping last HFT?)
    *   make "switching games" have "search for new game"
    *   make sure you can play sounds immediately
    *   make sure you can play video immediately
    *   allow URL input on timeout?
    *   put options in settings (ios only?)
    *   make sure --no-ask-name path works .. ??   FIX THIS!!! enter-name must happen but we can skip index?
    *   handle can't connect to hft.net (test locally!)
    *   check why android lag. Does it do it in chrome? If not can we turn it off? Is it related to double click
    *   make playername send name back to controller?
*   N/A check scroll vs no-scroll option
*   N/A put startup options in all controllers
*   N/A fix launching from Safari to App
*   N/A make shft ask hft.net for port if it's not 18679
*   N/A make sure options.files work in unity
*   N/A need a way for game to send binary files (how about a .zip)
    for controller so you can have image files and sounds. That sounds
    painful. I can either expand to base64 (easy) or need to send
    binary websocket (yuck!). I guess I can set some state in relayserver
    that next msg is ___. Or I could 'post' it.

    put files on server, send URL in socket or message `loadimage` etc..

*   N/A check if HFT has page up? Go to that page.

    Problem is I can't bring tab to front so if the tab is hidden the user will never
    notice :(  Maybe I could use the Notification API to put up a notification?

*   N/A add support for gameType "unity3dlibrary"

    The problem is I want to be able to upload unity libraries to superhappyfuntimes
    but not have them show up as games and also to only have a .unitypackage, no exported apps

    *   make
    *   install
    *   download
    *   export
    *   run

*   make osx bring browser to front after quiting unity game
*   add happyFunTimes.name to package info because package.json name can't have spaces! UGH!!

    doesn't matter. Not using NPM for HFT. HFT doesn't care about spaces

    *   make unity edit happyfuntimes.name (auto-set name to valid name) (see above)
    *   update shft and manage to use hft.name (see above)

*   fix controller that incorrectly asked for orientation. No repo
*   look into nsis has the installer solution
    *   windows only.
*   Need to make installer creator for hft games

    All this needs to do is unzip some files and run a script. Unfortunately
    it also needs to work cross platform. By that speifically I mean someone
    who makes a game on Mac needs to be able to make an installer for Windows
    and someone who makes a game on Windows needs to be able to make an installer
    for mac

    Ideas:

    *   Can use xar/mkbom for cross platform mac pkg creation
    *   Windows can maybe use 7zip which is open source so maybe can compile on mac (I can dream)

    Or, I could make the games install through HFT. Basically you'd need to have HFT running, you'd
    click an "install me" link on the website, that would somehow trigger HFT to download a zip.

    What I don't like about that is it *feels* less secure. It's not really less secure. Installing
    anything on any machine is not secure. But, given you could install with a single click
    and no permission escalation I'd be worried about bad games or bad code pretending to be games
    etc.  Maybe I shouldn't worry about that? Does steam? Do indie game devs? We just all assume
    they aren't being evil.

    I could try to make sure only links from HFT can trigger an install. Could also put up a
    "Are you sure you want to install?" message.


*   switch to vertex shader based tilemaps.

    tried it to see if I could speed it up on lower end GPUs.
    Didn't help at all on an Intel HD 4000 nor a Nexus 5.

*   add some CSS animation foo for menu appearing, disappearing

    menu is rarely used

*   handle ssl as well for captive portal? I don't think I can :(

*   use express (the node server?)

    Is that overkill



