Title: HappyFunTimes Introduction
Description: An introduction about HappyFunTimes

## What is HappyFunTimes?

HappyFunTimes is a system for playing party games that are meant to be
played with a bunch of people in the same room and 1 ideally large display.

_HappyFunTimes is abbreviated with HFT in this documentation._

## How does it work?

HFT is a library you add to your game that runs a small webserver.
There are currenty 3 forms of this library. [A Unity version](unity/index.md),
[An Electron version](https://www.npmjs.com/package/happyfuntimes) and a
[stand alone server version](https://github.com/greggman/happyfuntimes).

Users connect to this server with their smartphone and it serves
them a webpage you create that presents a controller for your game.
The game and the controllers then talk over WebSockets through
the server. Note that the smartphones must be on the same WiFi
as the computer.

There is a [rendezvous server](https://github.com/greggman/happyfuntimes.net)
that helps users easily connect to your game. Users go to `happyfuntimes.net`
on their phones and it will redirect them back to your game's server
(for example `http://192.168.1.123:18769`)

HFT also supports [running without the internet for use in installations](network.md).
To do this it supplies its own DNS server so that when the user connects
their phone to your WiFi all websites will lead to your game.
It even includes support for iOS devices captive portal
detector so that when an iOS user connects to your WiFi they'll
automatically join the game without typing anything.

HFT supports a synchronized clock across all devices.
This can be used to coordinate multiple machines.

HFT also supports passing players between mutliple machines running games.
As an example [see this game that runs across 7 machines](https://greggman.github.io/hft-tonde-iko).

