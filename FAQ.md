HappyFunTimes FAQ
=================

This FAQ is mostly questions developers might ask.


Rational
--------

*   **Q:** What does the message "trying to use feature of API version x.x.x" mean?

    I think it's pretty self explanatory what it means. Rather you problably want
    to know why even have the message? Why not just use that version.

    The reason is when a user goes to install your game she needs to know why
    it's not working. If you have a lower API version in your package.json
    then if there was no error then the game would not run and she'd have
    no idea why.

    This way hopefully you'll update your package.json. That way if she
    doesn't have a version of happyFunTimes that supports that api version
    she'll be prompted to install a newer version.

*   **Q:** Why not use native installers?

    Why don't games use native installers like .pkg for OSX or .msi for Windows etc.

    **A:** Games need to be installable cross platform and devs should not be required to own
    all platforms. In other words, it was a requirement that a developer making a HappyFunTimes
    game on OSX be able to make an installer for Linux and Windows without having to own or have
    access to a Linux or Windows machine/vm/etc...

    I looked into solutions. For example making a .pkg for OSX can happen across platforms
    using open source tools to make *xar* files and to make *bom* files. I didn't find any
    open source solutions for making Windows cross platform installers. In the end I realized
    it was just easier to require HappyFunTimes to be running and use it to do the installs.
    Much less work. I just needed to have .zip files (or similar) which are easy to make and
    didn't require week(s) of figuring out all the cross platform installer formats etc...

*   **Q:** Why not just have the games be served online?

    Many of the games are HTML5 based and could be served from online servers so why
    not just serve them from a website

    **A:** There are many reasons

    1.  That would require devs to run public servers. That's not free generally.
        Or it would require me to run servers to host the games. Yes there are free sites
        but...

    2.  Games often have large assets. For example JamJam has 23meg of audio assets. Waiting
        for those assets to download everytime you want to play the game would suck. Sure
        the games might get cached but caches often get cleared or emptied, especially on
        phones.

    3.  Servers go offline. Once you download a game it's yours. You can play it regardless
        of if some server is offline

    4.  Not all games are HTML5. HFT supports native app based games like games made with Unity
        (and hopefully soon Unreal, GameMaker, etc..). Those games must be installed locally.

        Unity currently has a browser plugin. Unforunately that plugin itself can't access plugins
        and plugins are currently needed for WebSocket support.


