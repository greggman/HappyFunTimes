Title: Multiple Computers
Description: How to make a game that runs across mutliple computers.

First off you might be interested in this video to see what running across multiple computers means

<iframe width="853" height="480" src="https://www.youtube.com/embed/aFMNmKYE8KM?rel=0" frameborder="0" allowfullscreen></iframe>

The game above spans 6 monitors. Each monitor has its own computer. Players can jump from monitor
to monitor and walk up and down a large level.

[You can download that sample here](http://github.com/greggman/hft-tonde-iko).

If you `hft add` it to your happyfuntimes, then run happyfuntimes and click
on the game you'll get a launcher screen that looks like this.

<img src="assets/images/multi-machine-launcher.png" />

This is only for testing. It is the standard `game.html` and `scripts/game.js` combination that is
usually run when picking an HTML5 game. I did this because
setting up and testing multiple machines is a pain in the ass so I wanted
an easy way to test stuff.

The real game is defined in `realgame.html` and `scripts/realgame.js`

## Multi Machine Basics

In a normal HappyFunTimes HTML5 game the game creates a `GameServer` object.
For multi machine game you should do this

    var server = new GameServer({
      allowMultipleGames: true,
      id: someIdUniqueToThisMachine
      master: someVariableTrueForOneMachineOnly
    });

Those options explained

### allowMultipleGames

The default for HappyFunTimes is if a game with the same gameId connects
HappyFunTimes will disconnect the old game. This is an assuption that you're
probably doing development, left a version of your game running in a tab somewhere,
You open a new tab, start the game. If HappyFunTimes didn't disconnect the old
game you'd probably spend 10 minutes trying to figure out why things are working.

When making a game that supports multiple machines though you need HappyFunTimes
to keep all of them connect so you set `allowMultipleMachines` to true.

### id

This id
