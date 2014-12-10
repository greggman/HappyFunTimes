HFT Commands
============

`hft` is a command to help manage happyfuntimes for developers. For the basics typing `hft`
will list all the commands. Typing `hft cmd --help` will list the help for a specific command.

Note: To use the hft commands you must install node.js and hft-cli.
See [Setting up for devlopment](#setting-up-for-development) for details.

*   **[hft add](#hft-add)**
*   **[hft check](#hft-check)**
*   **[hft download](#hft-download-gameId)**
*   **[hft install](#hft-install-srcpath)**
*   **[hft list](#hft-list)**
*   **[hft make-release](#hft-make-release-dstpath)**
*   **[hft publish](#hft-publish)**
*   **[hft register](#hft-register)**
*   **[hft remove](#hft-remove)**
*   **[hft start](#hft-start)**
*   **[hft uninstall](#hft-uninstall-gameid)**

### `hft add`

adds the game in the current folder to happyfuntimes

### `hft check`

checks if the `package.json` in the current folder is correct
and if other things like `controller.html` are missing.

### `hft download gameId`

downloads and installs a game from superhappyfuntimes.

### `hft install srcpath`

installs a zip file created with `hft make-release`. Can be used for testing otherwise
there's no reason to run this.

### `hft list`

lists all the games currently added or installed in happyfuntimes

### `hft make-release dstpath`

makes a releases, a zip file, of the game in the current folder and saves it to
a path `dstpath`. Note `dstpath` must be a folder. Also note if the game is
a unity game you must exit unity as unity will be called to export the game.
This is mostly for testing. See [hft publish](#hft-publish)

### `hft publish`

Publishes the game in the current folder to superhappyfuntimes. This will
call `hft make-release` so if you're publishing a unity game be sure to exit
unity since this will launch unity to export your game.

Your game must have a repo on github and the current folder must
be where you checked it out. Be aware, once you register a game it is
**permanently** associated with the github repo from your current folder.
You can publish new versions of the game but they must come from the same
repo you first published from.

By default the first email found in the newest commits in the repo will
be emailed a cryptic message about the results of publishing the game.
You can use `--email=some@address` to set a different email address
but it must an email address that appears in the most recent 10 commits.
If you don't want to be emailed use `--no-send-email`

### `hft register`

Tells superhappyfuntimes to add your game. There's no reason to call this.
It is called by `hft publish`.

### `hft remove`

This is the opposite of `hft add`. It removes the game in the current folder from
happyFunTimes. No files are deleted.

### `hft start`

starts happyFunTimes`

### `hft uninstall gameId`

Un-installs a game from happyfuntimes. **WARNING!!! this DELETES FILES!!!**



