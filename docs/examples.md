Title: Examples
Description: Various HappyFunTimes Examples

**Disclaimer:** These samples are only meant to show you how to use HappyFunTimes. Specifically
for controllers the class `GameClient`. For games the classes `GameServer` and `NetPlayer`.
Everything else is just game jam quality example code. If you're going to make a real game
please consider using an existing game framework or writing your own. If these examples fit
your needs then by all means feel free to use, clone, or modify them. My only point is they
are not neccessily showing best practices for games in JavaScript.

## Common terms

**controller** = The code running on the player's smartphone browser (or desktop/tablet browser).

**game** = The code running the game on the on PC connected to some large display everyone can see.

**relayserver** = A node based server that passes messages to and from contollers to games.

**GameClient** = An object running in the **controller** that lets the controller send and
receive messages with the **game**.

**GameServer** = An object running in the **game** that lets the game receive new players.

**NetPlayer** = An object created by the **GameServer** anytime a new **controller** joins the game.
It is passed to the game in a `playerconnected` event. It is used to send and receive messages from
an individual **controller**.

Here are a few random notes on the examples.

## Player Names

Many of the samples support a user name. This feature is not technically part of the
**HappyFunTimes** library but is rather just part of the samples using the library.
The name is stored in a local cookie .
When a **controller** starts it looks for the cookie and then sends the name to the game.
If the game receives "" as the name it sends name back to the player. The message
sent is `setName` in both directions, controller to game, game to controller.

The **controller** also sends a `busy` message with `true` when the user starts editing the name
and `false` when they finish.

On the **controller** side this is mostly handled by shared code `PlayerNameManager` (playername.js).
On the **game** this is handled by each game directly.

## Globals

Most of the **game**s and **controllers**s have a `globals` object. This object's settings can be set
in the URL with something like

    http://addressofgame/examples/game/gameview.html?settings={name:value,name:value}

Some useful examples are

    ...?settings={debug:true,haveServer:false}

On some games and some controllers `debug:true` will turn on onscreen status. On some games
`haveServer:false` will make the game run in a local mode where keyboard keys will control one or
more players.
This can be very useful for quick iteration.

---

### [Simple](http://github.com/greggman/hft-simple)

Basically the same as SuperSimple except uses normalized cooridinates and uses a canvas element to draw
the game rather than HTML5 elements.


### [PowPow](http://github.com/greggman/hft-powpow)

![PowPow](../images/scene-01-powpow.jpg)

A space wars style game. The first 6 players battle it out. If there are more than 6 players they wait
in the *launch* queue. They collectively control a ghost ship they can use to try to kill other players
so they can get back into the game.


### [ShootShoot](http://github.com/greggman/hft-shootshoot)

A Robotron like game.

This demonstrates dual 8pad emulation on **controller**. In `haveServer:false` mode and if using
a desktop PC as a **controller** ASWD are the move dpad and cursor keys the fire dpad.


### [JumpJump]((http://github.com/greggman/hft-jumpjump))

![JumpJump](../images/scene-00-jumpjump.jpg)

A simple platformer. Players try to get the one coin.


### [Boomboom](http://github.com/greggman/hft-boomboom)

![Boomboom](../image/scene-04-boomboom.jpg))

A bomberman like game. One thing it shows over other games is round based control. Players
joining the game have to wait for the current round to finish before they are added.


### [Deviceorientation](http://github.com/greggman/hft-deviceorientation)

Orient a 3d ship to shoot a ball.

Demonstrates using device orientation. The game is nearly impossible to play but it least
demonstrates using device orientation as well as three.js.


### [JamJam](http://github.com/greggman/hft-jamjam)

![JamJam](../images/scene-02-jamjam.jpg)

A collective drum sequencer. Each player has one drum they can set the sequence for.
All the machines are synced using a `SyncedClock`. Each player must turn on the volume
on their phone so everyone can hear their drum.

Shows using the synced clock. Shows how to sync using the Web Audio API.


### [UnityCharacterExample](http://github.com/greggman/hft-unitycharacterexample)

![UnityCharacterExample](../images/scene-03-unity.jpg)

For each **controller** that connects to the **game** the game spawns a 3d unity character.
The character is controlled by a *3rd person character contoller** which is a modified
version of the standard 3rd person character contoller included with unity. The only changes
are passing in a `NetPlayer` and then using input from the NetPlayer to control the movement
of the character instead of Unity's `Input` object.

This shows how to spawn unity prefabs when a **controller** connects to the **game**.
How to pass a `NetPlayer` object into the spawned prefab. Also how to use the HappyFunTimes
unity parts from UnityScript (or as Unity wrongly used to call it, JavaScript).

First, See **Installation** in the [Unity Docs](unitydocs.md)

Now run the game. If you see an error in the console maybe you didn't start the
relaysever. (See above)

Now connect a browser `http://localhost:18679`.


### [UnitySimpleExample](http://github.com/greggman/hft-unitysimpleexample)

This is the same as the *Simple* example above and users the same **controller**. Follow the
instructions above for the **UnityCharacterExample** but open the scene
Unity3D/Examples/Scenes/HappyFunTimesSimpleExample

This one shows using HappyFunTimes in C# with Unity.
