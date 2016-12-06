Changelist
==========

*   0.2.1

    *   Fix SyncedClock so it gets correct URL for server

*   0.2.0

    *   change happyfuntimes to a library only. No more virtual console

*   0.0.47

    *   Handle ipv6

    *   Handle case where computer name is not set on OSX

*   0.0.44

    *   Switched from HANDJS to PEP for pointerevents support
        Should fix sticky buttons

    *   Added fake hft ping to prevent error message in installation mode

*   0.0.43

    *   Removed launchpad dependency

    *   Added node version to htf version

*   0.0.41

    *   Fixed broken how.html

*   0.0.40

    *   Don't allow games for a different platform to be installed.

    *   Remove css `cursor: pointer` from controllers as it
        was messing up Android.

*   0.0.39

    *   Games have context menu with "GetInfo", "Uninstall" and/or "Remove"

    *   Add drag and drop install support.
        You can drag a zip file onto HappyFunTimes and it will install it.

    *   Change instructions to use game sys messages.
        That way both HTML and Unity (etc..) can use the same system
        for instructions

    *   Move langauges.js to server
        That way both HTML and Unity can use the same language strings

    *   Allow Unity to use `HFT_INSTUCTIONS` and `HFT_INSTRUCTIONSPOSITION`
        environment variables to specify instructions.

    *   Make main page reconnect to happyfuntimes if happyfuntimes exits and is then restarted

*   0.0.38

    *   Fix bug where it wasn't always able to start controllers in unity based projects.

*   0.0.37

    *   Added `happyFunTimes.ignore` to package.json

        It's an array of strings in the format of `.gitignore` ([see git docs](http://git-scm.com/docs/gitignore))
        not including the double asterix syntax.

    *   Fixed `gamedisconnect` message so it includes the id of the game that disconnected.

    *   Fixed touch buttons so no timeout is needed.

        I think I maybe (or maybe not) finally understand pointer events
        enough to not need a timeout to make sure they don't stick. Crossing
        my fingers.

    *   Added `consoleTarget` option to commonui. Valid values are "game" and "html".

        If "html" console.log and console.error are retargeted to HTML. `options.debug` needs to be true
        to see that html. If "game" console.log and console.error are sent back to the game. This
        can be used to try to debug something when there's no way to connect a debugger.

    *   Make `hft start --port` option work.

    *   Fixed `hft remove --bad`.

        It was removing everything.

    *   Fixed notifications for added/removed games.

        It broke when support for running uninstalled games like hft-gamepad-api was added.

    *   Made it save 5 backups of `installed-games.json`.

*   0.0.36

    *   Added `--instructions` which puts a scrolling banner on top of each
        game that says something like "connect to HappyFunTimes wifi, on iOS
        just wait, on Android use Chrome and go to "h.com".

    *   Added `--langs` to specify which languages games should use.

        For controllers, if you support multiple languages you should probaby
        use `navigator.language` but for the games since they are running on
        my computer I needed a way to choose.

    *   Added `--wifi-name`, `--wifi-pass`

        This is to specify the name and password in the connect messages. See `--instructions`.

    *   Hacked in more name support

        gameclient now gets name and sends it automatically when controller starts.
        On the one hand it feels "impure" to do it this way. On the other pragmatism wins.

    *   Fixed bug in hftSettings. haveVersion should only check for version not fail if
        if version is old.

*   0.0.35

    *   Fixed a bug where if the page did not have the focus the controller
        would not get redirected to the game.

        I think that was in there for the app. The idea being if the app
        is in the background it shouldn't join the game. Unfortunately it
        also made it so  typing in a URL often didn't work because when the
        URL bar has the focus the page itself does not.

*   0.0.34

    *   Made Unity version pay attention to `needNewHFT` flag.

    *   Made controlellers report to game if they need new apiVersion.

    *   Added `orientationOptional` to `CommonUI.setupStandardControllerUI`.

        Setting it to true makes the commonUI not tell the user to orient their
        phone if their phone doesn't support orientation. Example usage is
        are the device orientation examples. They want the phone to be in
        portrait but as of iOS 8.3 Safari doesn't support orientation. So
        the message that used to come up would be confusing as the user
        orients their phone.

    *   Added `--optimize-controller` option.

        This is probably only useful for [installation mode](network.md). If you're
        using require.js (the standard way HappyFunTimes controllers work) then
        happyfuntimes can try to concatinate and compress most of the JavaScript
        used for your controller. This means the phones have to download less
        files which make it faster to get started and less likely there will be an error.

        Note: I have no actual testing to know that this makes much difference
        but when we showed off [Tonde-Iko at Steam Carnival](http://greggman.github.io/hft-tonde-iko)
        I noticed some people having trouble connecting or it taking a long time,
        probably missed a packet or something with unreliable WiFi.

        So I decided do some optimizations. I added the --minify flag and I also put
        all 12 or 14 avatar images into 1 file. `--optimize-controller` does
        the --minify part automatically.

    *   Made happyfuntimes reload package.json when they are edited.

        I hope there's no issues with half saved files

*   0.0.33

    *   Fix for firefox. I totally broke it around 0.0.27. Firefox needed different
        stuff for making scripts load at runtime.

*   0.0.32

    *   Fixed fullscreen for Android Chrome.

        I have no idea how this ever worked when I tested it before. Hopefully it works
        now.

*   0.0.31

    *   Made `Touch.setupVirtualDPads` use the middle of the referenceElement if
        `offsetX` or `offsetY` is not set for that dpad.

        This is better because it means if things change size based on CSS or other
        stuff there's nothing to do. The code will just work.

*   0.0.30

    *   Added `--no-check-for-app`.

    *   Added `hft/0.x.x/scripts/runtime/live-settings.js` so HFT can deliver live setttings easily.

        a little worried there's too many ways to deliver options. As in code is not organized.
        To games data comes in index.html through a template. Maybe that should change to
        `/game/<gameid>/scripts/runtime/live-game-settings.js`? One difference is we allow
        minifying on game but minifying is at runtime so that doesn't seem like it would matter.

    *   Added changelist.md.


*   0.0.29

    *   Fixed touch pad code.

        Issue was it was possible for button to get stuck down because we don't always
        get pointerup events. Also didn't handle pointerout then sliding back on to button.

    *   Added `GameClient.log` and `GameClient.error`.

        Allows the controller to send debug messages that make it to game.

    *   Added way for game to supply files for controller.

        This allows games to participate in HappyFunTimes without being registered.
        So for example http://greggman.github.io/hft-gamepad-api/

*   0.0.28

    *   CommonUI now handles orientation.

        Pass orientation to `CommonUI.setupStandardControllerUI` and if it can
        force the orientation it will. If it can't it will add the appropriate
        HTML/CSS so a message appears to turn the phone in the wrong orientation.

    *   Added app suppport.

        HFT tries to redirect to native mobile app.

    *   `NetPlayer.name`, `NetPlayer.busy` and `NetPlayer.hft_namechange` and `NetPlayer.hft_busy` events.

    *   Added code to disablecontext menus.

        Wondering if I should just always do this.

*   0.0.27

    *   Make hft-publish optionally use HFT_PUBLISH_USER for user:pass.

    *   Send headers so hopefully browser never caches.

    *   Switch to node 0.12.

    *   Made "Install" message pop to front.

*   0.0.26

    *   Add session ids. See `Netplayer.sessionId`.

    *   Switch docs to use handlebars.

    *   Add docs.happyfuntimes.net.


