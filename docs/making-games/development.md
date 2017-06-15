Title: Making games
Description: Making games with HappyFunTimes

### Table of Contents

*   [Setting up for Development](#setting-up-for-development)
    * [Quick Setup](#quick-setup)
    * [Detailed Guide](#detailed-guide)

---

## Setting up for Development

### Quick Setup

These instructions are for HTML5/[Electron](https://electron.github.io) games.
If you're using Unity3D [use this guide](../unity).

*   Install [Node.js](http://nodejs.org/)
*   Clone/Download a sample game. I'd suggest [hft-clean](https://github.com/greggman/hft-clean)
    or [hft-simple](https://githib.com/greggman/hft-simple)
*   cd to the the folder you clone/unzipped the download and type `npm install`
*   type `npm start` to see it run

### Detailed Guide

#### Install HappyFunTimes

HappyFuntTimes can be used as an HTML5 web server OR as a library for [Electron](https://electron.github.io).
Electron let's you package an HTML5 web page into a standalone native app.

Both require you to have node.js installed so install it from [here](http://nodejs.org/).

Once installed up a terminal or Node Command Prompt (should appear on your Start screen)

#### Download or clone an example Game

Clone/Download a sample game. I'd suggest [hft-clean](https://github.com/greggman/hft-clean)
or [hft-simple](https://githib.com/greggman/hft-simple)

For example, assuming you have git installed

    git clone https://github.com/greggman/hft-simple.git

Or you can download a zip. For example if you go to
http://github.com/greggman/hft-simple you should see a "Download ZIP"
button on the right side.

#### cd to the the folder you clone/unzipped the download and type

    npm install

This will install various JavaScript libraries the samples depend on including
the `happyfuntimes` library.

#### Run It

    npm start

Should launch the game

#### Connect Controllers

Open a browser window, make it small enough to see both the game and the browser window
at the same time. Go to `http://happyfuntimes.net`. It should connect to the game.
Make sure your smartphone is on the same WiFi as your computer. Use its browser and
go to `http://happyfuntimes.net` and it should also connect to the game

NOTE: Only works on home networks. It's unlikely to work on corp networks, coffee shops,
airport wifi, etc...

---

Next step: [Game Structure](game-structure.md)
