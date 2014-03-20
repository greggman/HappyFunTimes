O remove cross dependencies
O remove android single touch
O prefix HappyFunTime stuff
O separate css
O give each game an id so one relayserver can run multiple games
  O hard coded id means one instance of each game
  O generated id means can handle multiple instances BUT, need way to pick instance.
O separate sample game code from lib
O remove window everywhere
O write docs
O make sample games
  O platformer
  O rythym
  O quiz
     send question Q + 4 answers, display on phone and on game. On game show counts
     In 10 seconds show correct answer and winner on game and on phone?
     Make sure answers after game has moved on do not affect results
     Add score for players

O relayserver should tell game when game connects/disconnects?
O abscract name stuff
O centralize getRelative
O make sounds work iOS
O make hitshield in mp3
O make tick for clocksync ogg/mp3
O figure out why iOS is not syncing clock. Try other computers
O make index.html that lists examples
O fix server to re-direct foo to foo/
O fix server to load index.html from foo/
O change message about relayserver to just game? (add code to know when game is connected)
O make game retry, once a second, to connect server
  O JS
  O Unity
O abstract out Unity3D parts of C#
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

