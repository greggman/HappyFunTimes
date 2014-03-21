*   remove android single touch from powpow

    When this was first written single touch android phones were common.

*   prefix HappyFunTime stuff
*   Get nice designs for games. Particlar controllers
*   separate css
*   Figure out

*   make public/index.html that lists games/examples
*   give each game an id so one relayserver can run multiple games

    * hard coded id means one instance of each game
    * generated id means can handle multiple instances BUT, need way to pick instance?

    * relayserver needs to create a new player when switching games. Probably handled
      automatically as leaving the other game's controller panel will kill the connection.

    * controller could have a menu button to go back to game selection screen?

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

*   relayserver should tell clients when game connects/disconnects?

    Currently the clients know if the relay server disconnected but it clients don't
    know if the game is connected to the relayserver.

*   abstract name stuff

    Powpow lets you name your player. Should this be in every game? Turned into a library?

*   make sounds work iOS.

    Sounds on iOS need a user gesture to start. They are working on my iPad but not my iPhone.
    Should make the audiosystem handle this?

*   figure out why iOS is not syncing clock. Try other computers

    I know the sync clock stuff works as I used it for the WebGL Aquarium but it's not
    working in my iOS machines.

*   make game retry, once a second, to connect server

    *   JS
    *   Unity

*   abstract out Unity3D parts of C#

    Currently the C# version of the library is Unity3d specific. Should be easy to abstract that out
    so it can be used in C# in general

*   centralize getRelative
*   make hitshield in mp3
*   make tick for clocksync ogg/mp3
*   fix server to re-direct foo to foo/
*   fix server to load index.html from foo/
*   change message about relayserver to just game? (add code to know when game is connected)

Done
----

x remove cross dependencies
x separate sample game code from lib
x change JS so NetPlayer has disconnect event
x see if I can use closure instead of class
x make it sendCmd on both client and server
x seperate cmd from data.
x add clock
x change audio to g_audioSys
x Pass in audio system?
x Pass in entity system?
x make a dependency injector
x make client side net code.
x use strict everywhere
x make haveserver settable from url

