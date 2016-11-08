Title: Linux
Description: Installing HappyFunTimes in Linux

I haven't had time to make a Linux installer so you have to install HFT
on your own.

## Installation on Linux systems

*   Clone the repo `git clone git://github.com/greggman/HappyFunTimes.git`
*   Install [node.js](http://nodejs.org). I was using 0.10.29
*   Open a shell
*   cd into the root of the repo you cloned (eg. `cd HappyFunTimes`)
*   Type `npm install` which will install needed node modules locally
*   Type `sudo npm install -g hft-cli` which will install the `hft` command line tool.
*   Make sure `zenity` and `wmctrl` are installed.

    Just type `zenity`. If it's installed it should print something. If not you'll
    be given instructions on how to install it.

    Similarly type `wmctrl`. If it's installed it should print something. If not you'll
    be given instructions on how to install it.

*   Type `./cli/hft.js init` which will write a config file to `~/.happfuntimes/config.json`
*   Type `hft start --app-mode` which will start the server.
