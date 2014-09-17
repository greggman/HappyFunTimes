Migrating Older Games
=====================

*   [Migrating from 0.x.x to 1.x.x](#migrate-from-0xx-to-1xx)

## Migrating from 0.x.x to 1.x.x

I'm really sorry but to separate the games and turn happyfuntimes into a kind
of virtual console required some non-backward compatible changes. I'll do my
best not to break things in the future.

If you made a game for HappyFunTimes before they were separated from HappyFunTimes
here are some of the steps you need to take.

*   First, [install happyfuntimes](http://superhappyfuntimes.net/install) and run it at least once.

*   Install the hft command. Type `npm install -g hft-cli`

*   copy or move your game to a new folder outside of happyfuntimes

    pre version 1 all games existed side happyfuntimes in `public/examples/gameid` or
    `public/games/gameid`. Now they should be completely outside of happyfuntimes
    in their own folder

*   add a `.gitignore` file. Copy one from one of the examples. Ideally of the same type
    so for example if it's a unity game [use this one](https://github.com/greggman/hft-unitycharacterexample/blob/master/.gitignore).
    If it's an html5 game [try this one](https://github.com/greggman/hft-boomboom/blob/master/.gitignore).

*   inside that the folder type `git init`

*   edit `package.json'

    [It should only have these fields](makinggames.md#packagejson).
    Delete any others and edit appropriately

*   if you were using audio in HTML5 or TDL from one of the previous samples [copy a bower.json file](https://github.com/greggman/hft-jumpjump/blob/master/bower.json)

    *   edit bower.json

           "name"
           "deps"
           private: true // this is not itself a bower package

    *   run `bower install`

*   Make an icon.png/jpg/gif (64x64 or 128x128)

*   Make a screenshot.jpg/png/gif (640x480)

*   delete `gameview.html` and `index.html`

    Note: in the past there was a script, `build.py` that copied the contents of `game.html` into
    `gameview.html` and `controller.html` into `index.html`. These operation now happen at runtime.

    But, because the old process was manual many people edited `index.html` and `gameview.html`
    by hand so before you delete them make sure you copy the relavent changes into `game.html`
    and `controller.html`

*   if you had a script before like `mygame.js` or `mycontroller.js` they must be specifically
    called `scripts/game.js` and `scripts/controller.js`. They will get included automatically
    so don't add any `<script>` tags for them in the files above.

*   in all your .js files there was a `requirejs` or `define` function call that listed
    other files to include.

        define(['../../../somefile`])

        requirejs(['../../../someotherfile])

    Any path that started with `../../../scripts` should now be `hft` In other words search and replace
    `../../../scripts` with `hft`.

    Any path that started with `../../../3rdparty/tdl` should now be `../bower_components/tdl/tdl`

    Any path that started with `../../scripts` should now be `../bower_components/hft-utils/dist`

    Any reference to `imageprocess` is now `imageutils`

    tersely

        '../../../3rdparty/tdl/???' -> '../bower_components/tdl/tdl/???'
        '../../../scripts'          -> 'hft'
        '../../scripts'             -> '../bower_components/hft-utils/dist'
        imageprocess'               -> 'imageutils/

*   Edit your `game.js` and where you make `GameServer` don't pass in anything anymore.

    old

        g_server = new GameServer({gameId: "someidformygame"});

    new

        g_server = new GameServer();

*   Edit your `controller.js` and where you make `GameClient` don't pass in anything

    old

        g_client = new GameClient({gameId: "someidformygame"});

    new

        g_client = new GameClient();

*   For a unity game (close unity)

    *   Move all the files from your project to the game folder. It should end up like this

            Assets
            ProjectSettings
            Temp
            controller.html
            icon.png
            screenshot.png
            Library
            README.md
            css
            package.json
            scripts

    *   Delete `Assets/Plugins/HappyFunTimes` and `Assets/Plugin/HappyFunTimesExtra`

    *   Copy the [HappyFunTimes plugin .dlls](https://github.com/greggman/hft-unity3d/releases/download/v0.0.2/HappyFunTimes-Unity3D-Plugin.zip) in to `Assets/Plugins`

    *   Don't set the gameId nor the controllerUrl in your spanwer

        UnityScript

        old

            function Start () {
                var options : HappyFunTimes.GameServer.Options = new HappyFunTimes.GameServer.Options();
                options.gameId = "unitycharacterexample";
                options.controllerUrl = "http://localhost:8080/examples/unitycharacterexample/index.html";
                m_server = new HappyFunTimes.GameServer(options, gameObject);
                ...
            }

        new

            function Start () {
                var options : HappyFunTimes.GameServer.Options = new HappyFunTimes.GameServer.Options();
                m_server = new HappyFunTimes.GameServer(options, gameObject);
                ...
            }

        C#

        old

            void Start () {
                GameServer.Options options = new GameServer.Options();
                options.gameId = "simple";
                options.controllerUrl = "http://localhost:8080/examples/simple/index.html";
                m_server = new GameServer(options, gameObject);
                m_server.Init();
                ...
            }

        new

            void Start () {
                GameServer.Options options = new GameServer.Options();
                m_server = new GameServer(options, gameObject);
                m_server.Init();
                ...
            }

    *   Alternatively you don't need your own spawner anymore. There's a generic one in
        in the new HappyFunTimes plugin dlls you just installed. More [docs on how to use it
        here](https://github.com/greggman/HappyFunTimes/blob/master/docs/unitydocs.md#spawning-player-gameobjects).

*   type `hft check`

    it should say things look ok

*   type `hft add`

    This should add your game to your local happyfuntimes installation

*   Test it.

    Run the new happyfuntimes and see if your game works

*   make a repo on github

*   execute these git commands (of course replease `<githubname>` and `<reponame>`)

        git add . --all
        git remote add origin git@github.com:<githubname>/<reponame>.git
        git push -u origin master

If you can't get your old game to work, commit it github and send me a link. I'll fork it, fix it, and submit a pull request.

Once it works you can publish it as well. [For html games see](makinggames.md#hft-publish).
[For Unity3D games see](unitydocs.md#publishing).



