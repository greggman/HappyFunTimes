Title: Commands
Description: hft commandline commands.

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

`hft publish` will ask for your github username and password. If you
have 2 factor enabled you'll need to create a
[Personal Access Token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/).
Follow [the instructions on this page](https://help.github.com/articles/creating-an-access-token-for-command-line-use/)
to create a personal access token and use that instead of your password.
The only scope needed is the `public_repo` scope.
Remember just like your password a personal access token should be
kept secret.

### `hft register`

Tells superhappyfuntimes to add your game. There's no reason to call this.
It is called by `hft publish`.

### `hft remove`

This is the opposite of `hft add`. It removes the game in the current folder from
happyFunTimes. No files are deleted.

### `hft start`

starts happyFunTimes.

`--app-mode`

launches the browser to `http://localhost:18679/games.html`. This is the same way HappyFunTimes
is started when you launch by clicking the HappyFunTimes program icon.

`--system-name=<somename>`

If you're at a gamejam or some other place where there are multiple happyfuntimes
games running on the same network, then when users connect to happyfuntimes.net they'll
be given a list of game to join. The list will say the name of the computer followed
by the name of the game. By default happyfuntimes user the name of your computer. You
can set a specific name with this option.

`--no-ask-name`

If you're running a single game in [installation mode](network.md) and you don't need users to enter
a name this option will skip asking the user for a name

`--no-menu`

If you're running in [installation mode](network.md) and you don't need users to be able to change their
name this option turns off the gear icon on the controller

`--kiosk`

Normally controllers start at `http://localhost:18679`. There the controller waits for
a game to start. If multiple games are running users are given a list to choose from.
If you're running in an [installation](network.md) where there's only 1 game you can have controller
go directly to the game with this option.

`--check-for-app`

Controllers don't normally try to launch the native mobile app. This check takes 3 seconds.
Use this switch to add that check so if the user has the app installed it will switch to
the app.

`--dns`

Tells happyfuntimes to implement a DNS server. This is for [installation mode](network.md).

`--optimize-controller`

Tells happyfuntimes to concatinate and compress most of your controller's JavaScript files into one file.
This should make phones connect faster (less to download) and be less likely to have
a communication error while downloading (less to download).

For the technically minded it runs the [require.js optimizer](requirejs.org/docs/optimization.html)
on `controller.js` using [almond](https://github.com/jrburke/almond) as a wrapper.

**BE SURE TO TEST** as optimizers are not perfect.

This option is not the default because it's very hard to debug optimized code. You would
probably only use this option with [installation mode](network.md).

### `hft uninstall gameId`

Un-installs a game from happyfuntimes. **WARNING!!! this DELETES FILES!!!**



