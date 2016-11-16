Title: Making games
Description: Making games with HappyFunTimes

### Table of Contents

*   [Setting up for Development](#setting-up-for-development)
    * [Quick Setup](#quick-setup)
    * [Detailed Guide](#detailed-guide)
*   [Running Games during Development](#running-games-during-development)

---

## Setting up for Development

### Quick Setup

These instructions are for HTML5 games. If you're using Unity3D [use this guide](../unity).

*   [Install HappyFunTimes](http://docs.happyfuntimes.net/install.html)
*   Install [Node.js](http://nodejs.org/download/)
*   If on Windows, install [msysgit](http://msysgit.github.io/)
*   Install bower.
    * On Windows:  `npm install -g bower`
    * macOS / Linux: `sudo npm install -g bower` 
*   Clone an example game to your machine
*   Edit `package.json` inside the game you cloned and change `gameId` and `name`
*   Type `hft add` to add the game to your HFT server

### Detailed Guide

#### Install HappyFunTimes

A guide on how to install a HFT server can be found [here](http://docs.happyfuntimes.net/install.html).

On Windows you might run into security issues: [See here](windows.md).

**IMPORTANT** You can **NOT** have 2 installations of HappyFunTimes.

If you install above do NOT clone the HappyFunTimes repo.
If you clone the repo do NOT install HappyFunTimes with the installer.

Note: There is no reason to clone the repo unless you want to
contribute to HappyFunTimes itself. For making games installing
with the installer is fine.

If you accidentally install twice you'll need to delete the configuration
files because they'll be pointing to one installation.

```bash
OSX: ~/Library/Application Support/happyfuntimes
Windows: /Users/<name>/AppData/Local/happyfuntimes
Linux: ~/.happyfuntimes
```

After that either run HappyFunTimes you installed using the installer to make that
the configured version, or, type `node start.js --app-mode` from the
cloned folder if you're using a cloned repo.

#### Windows: Install msysgit

If you are on a Windows machine, install [msysgit](http://msysgit.github.io/).

When asked, choose to ["Use Git from the Windows Commmand Prompt"](../images/msysgit-option-01.png).

On Windows open a [node.js command prompt](../images/node-js-command-prompt.png).

#### Install Bower

Bower is a program that downloads JavaScript libraries. For example
if a controller or game needs jquery or three.js bower handles that.

    npm install -g bower

Don't forget that `-g`. Also you might need `sudo` on OSX or Linux.

#### Download or clone an example Game

[Pick one from the list](examples.md)

For example, assuming you have git installed

    git clone https://github.com/greggman/hft-simple.git

Or you can download a zip. For example if you go to
http://github.com/greggman/hft-simple you should see a "Download ZIP"
button on the right side.

*   If this is **not a unity** sample then change into the root directory of the repo you
    cloned or you unzipped (e.g. `cd hft-simple`).

*   Type `bower install` which will install needed javascript modules locally

    This step is only needed for some games. If there is no `bower.json`
    in the folder you can skip this step.

#### Edit the package.json file

Open the `package.json` file and change the `gameId` and `name` entries to something unique.

Note: If you are collaborating on a game don't change this stuff. Only change it
if you're making a new game based off of an existing game.

#### Add the game to HappyFunTimes

Add the game to your HFT server by running

    hft add

#### Run HappyFunTimes

You can run it by clicking its icon from when you installed it in step 1
or you can run it by typing `hft start --app-mode`

## Running Games during Development

For HTML based games you can always just run them from HappyFunTimes. Launch it,
pick your game. For Unity3D see the [unity docs](unitydocs.md).

Alternatively run HappyFunTimes with one of the methods above and in your
browser window and go to `http://localhost:18679/games.html` and choose a game.
In other window go to `http://localhost:18679`.  Note: use a window, not a tab
so you can see both at the same time.

You can simulate other machines joining the game by opening more windows
or tabs in your browser.

![windows for controllers](../images/windows-for-controllers.jpg)

Inside HappyFunTimes, games with `(*)` by their name are games in development. In other words
they are games you used `hft add` to add to HappyFunTimes. Games without the `(*)` are games
that were installed from inside HappyFunTimes by going to [superhappyfuntimes.net](http://superhappyfuntimes.net)
and installing them.

If you have other computers or smartphones **on the same network** go to `http://happyfuntimes.net`
and they *should* connect to your game. Alternatively you can lookup the IP address of
the machine running the game (see `ifconfig` on OSX/Linux, the Network Preferneces on OSX,
or `ipconfig` on Windows) then go to `http://ipaddress:18679` from the other devices.
For example on my home network it was `http://192.168.2.9:18679`. For installations, museums,
and places with no internet consider [setting up for instant connect](network.md).

---

Next step: [Game Structure](game-structure.md)
