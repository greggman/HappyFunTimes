Title: HappyFunTimes Introduction
Description: An introduction about HappyFunTimes

## What is HappyFunTimes?

HappyFunTimes is a system for playing party games that are meant to be
played with a bunch of people in the same room and 1 ideally large display.

_HappyFunTimes is abbreviated with HFT in this documentation._

## How does it work?

HFT is a library you add to your game that runs a small webserver.
There are currenty 3 forms of this library. [A Unity version](unity/index.md),
An Electron version and a stand alone server version.

Users connect to this server with their smartphone and it serves
them a webpage you create that presents a controller for your game.
The game and the controllers then talk over WebSockets through
the server. Note that the smartphones must be on the same network
on the computer.

HFT also includes a rendezvous server that helps users easily
connect to your game. Users go to `happyfuntimes.net` on their
phones and it will redirect them back to your game's server
(for example `http://192.168.1.123:18769`)

HFT also supports running without the internet. To do this it
supplies it's own DNS server so that when the use connects
their phone to your WiFi all websites will lead to your game.
It even includes support for iOS devices captive portal
detector so that when an iOS use connects to your WiFi they'll
automatically join the game without typing anything.

HFT also supports coordinating players between mutliple machines.
As an example [see this game that runs across 7 machines](https://greggman.github.io/hft-tonde-iko).

