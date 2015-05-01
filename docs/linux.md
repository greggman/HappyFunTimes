Title: Linux
Description: Installing HappyFunTimes in Linux

I haven't had time to make a Linux installer. In fact I'm a Linux noob
when it comes to installers.

But, you can install it manually by following these steps

*   clone the repo `git clone git://github.com/greggman/HappyFunTimes.git`
*   Install [node.js](http://nodejs.org). I was using 0.10.29
*   Open a shell
*   cd into the root of the repo you cloned (eg. `cd HappyFunTimes`)
*   type `npm install` which will install needed node modules locally
*   type `sudo npm install -g hft-cli` which will install the `hft` command line tool.
*   make sure `zenity` and `wmctrl` are installed.

    Just type `zenity`. If it's installed it should print something. If not you'll
    be given instructions on how to install it.

    Similarly type `wmctrl`. If it's installed it should print something. If not you'll
    be given instructions on how to install it.

*   type `hft start --app-mode` which will start the server.


