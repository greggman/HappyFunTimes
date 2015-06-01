Changelist
==========

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


