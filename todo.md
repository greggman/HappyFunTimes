*   remove android single touch from powpow

    When this was first written single touch android phones were common.

*   redesign powpow controls

    Rowen suggested that because ship is on center of screen people
    expect to touch there to control it. Should I move the ship?
    Change it so it controls from the center? Show <- -> buttons
    and a [Fire] button with the ship somewhere else?

*   fix simple controls and game so they use full area?

*   Get nice designs for games. Particularly controllers

*   separate css

*   make public/index.html that lists games/examples

*   remove window everywhere?

    might be a good idea to wrap js with (function(window, undefined) { to make sure
    all references to globals are missing

*   make sample games

    *   platformer
    *   rythym
    *   quiz

        send question Q + 4 answers, display on phone and on game. On game show counts
        In 10 seconds show correct answer and winner on game and on phone?
        Make sure answers after game has moved on do not affect results
        Add score for players

     *  Device orientation game, each player is assigned a piece of a shape, they have
        to rotate their device to get the shape to line up (ie, jigsaw puzzle). Anytime
        a new player is added the current shape is subdivided.

        Not sure this is a fun idea.

*   abstract name stuff

    Powpow lets you name your player. Should this be in every game? Turned into a library?

*   make game retry, once a second, to connect server

    *   JS
    *   Unity

*   abstract out Unity3D parts of C#

    Currently the C# version of the library is Unity3d specific. Should be easy to abstract that out
    so it can be used in C# in general

*   use express (the node server?)

    Is that overkill

*   Remove local log stuff

*   put $ in misc

*   make tick for clocksync ogg/mp3

*   Make controllers have button to go back to games


Done
----

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


