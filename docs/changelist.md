Changelist
==========

*   0.0.36

    *   added `--instructions` which puts a scrolling banner on top of each
        game that says something like "connect to HappyFunTimes wifi, on iOS
        just wait, on Android use Chrome and go to "h.com""

    *   added `--langs` to specify which languages games should use.

        For controllers, if you support multiple languages you should probaby
        use `navigator.language` but for the games since they are running on
        my computer I needed a way to choose.

    *   added `--wifi-name`, `--wifi-pass`

        This is to specify the name and password in the connect messages. See `--instructions`

    *   Hacked in more name support

        gameclient now gets name and sends it automatically when controller starts.
        On the one hand it feels "impure" to do it this way. On the other pragmatism wins.

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

    *   added `orientationOptional` to `CommonUI.setupStandardControllerUI`

        Setting it to true makes the commonUI not tell the user to orient their
        phone if their phone doesn't support orientation. Example usage is
        are the device orientation examples. They want the phone to be in
        portrait but as of iOS 8.3 Safari doesn't support orientation. So
        the message that used to come up would be confusing as the user
        orients their phone.

    *   added `--optimize-controller` option

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
        stuff for making scripts load at runtime :(

*   0.0.32

    *   fixed fullscreen for Android Chrome

        I have no idea how this ever worked when I tested it before. Hopefully it works
        now

*   0.0.31

    *   Made `Touch.setupVirtualDPads` use the middle of the referenceElement if
        `offsetX` or `offsetY` is not set for that dpad.

        This is better because it means if things change size based on CSS or other
        stuff there's nothing to do. The code will just work.

*   0.0.30

    *   added `--no-check-for-app`

    *   added `hft/0.x.x/scripts/runtime/live-settings.js` so HFT can deliver live setttings easily.

        a little worried there's too many ways to deliver options. As in code is not organized.
        To games data comes in index.html through a template. Maybe that should change to
        `/game/<gameid>/scripts/runtime/live-game-settings.js`? One difference is we allow
        minifying on game but minifying is at runtime so that doesn't seem like it would matter.

    *   added changelist.md


*   0.0.29

    *   fixed touch pad code.

        Issue was it was possible for button to get stuck down because we don't always
        get pointerup events. Also didn't handle pointerout then sliding back on to button.

    *   added `GameClient.log` and `GameClient.error`

        allows the controller to send debug messages that make it to game.

    *   added way for game to supply files for controller.

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

    *   added code to disablecontext menus.

        Wondering if I should just always do this.

*   0.0.27

    *   make hft-publish optionally use HFT_PUBLISH_USER for user:pass

    *   send headers so hopefully browser never caches.

    *   switch to node 0.12

    *   made "Install" message pop to front

*   0.0.26

    *   Add session ids. See `Netplayer.sessionId`

    *   switch docs to use handlebars

    *   add docs.happyfuntimes.net


