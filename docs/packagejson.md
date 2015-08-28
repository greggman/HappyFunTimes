Package.json
============

HappyFunTimes uses a `package.json` file to hold some extra data about a
game or installation needed to run the game correctly.

This file defines some data about your game. It is a JSON file and JSON has a very strict format.

*   No trailing commmas.

    Good

        {
          "a": 123,
          "b": 456
        }

    Bad

        {
          "a": 123,
          "b": 456,
        }

*   No comments! JSON is NOT JavaScript.

*   All Strings and identifiers must be quoted with double quotes. The only things not quoted are numbers and `true`, `false`,
    and `null`.

*   It's case sensitive. `"HappyFunTimes"` is NOT the same as `"happyFunTimes"`

### Required fields

A standard package.json looks like this

    {
      "name": "JumpJump",
      "description": "A game with Jumping",
      "version": "0.0.2",
      "private": false,
      "dependencies": {
      },
      "happyFunTimes": {
        "gameId": "jumpjump",
        "category": "game",
        "apiVersion": "1.3.0",
        "gameType": "html",
        "minPlayers": 1
      }
    }

####   `name`

A name for your game. Used on the main screen of HappyFunTimes and SuperHappyFunTimes

####   `description`

A description. Used on superhappyfuntimes. No HTML allowed currently.

####   `version`

Used on superhappyfuntimes so users can know if there is a newer version for them to download.

####   `happyFunTimes.gameId`

This is the id for your game. Every game on superhappyfuntimes must have a unique id.
only A-Z, 0-9, _, - are allowed and no more than 60 charactera.

####   `happyFunTimes.apiVersion`

This is the happyFunTimes API version needed by this game. If this number is higher
than the version of happyFunTimes the user has installed they will be asked to upgrade.
It is also used by happyFunTimes to provide the correct API for the game.

####   `happyFunTimes.gameType`

This is used by happyFunTimes to figure out how to deal with the game. For example
how to launch the game and how to publish it.

Valid values are

*   `html`
*   `Unity3D`
*   `Unity3DLibrary`

####   `happyFunTimes.minPlayers`

How many players are required to play this game. For example, jumpjump you can play with
one player. It's probably not any fun but you can player. boomboom on the otherhand
requires 2 players. It will not start until there are 2 players.

This is only used on the superhappyfuntimes to set expectations. If you have a game that requires
10 players please consider marking it here.

####   `happyFunTimes.category`

This is also only used on superhappyfuntimes to set expections and hopefully to, um, categories
things. Current values

*   `game` A game
*   `example` Not a game, not really meant to be played, just an example
*   `demo` Not a game, something else like an exhibit, possibly not playable without more stuff

####   `happyFunTimes.useScriptTag`

True indicates you don't want to use requirejs instead you want to use `<script>` tags. Your `apiVerison`
must be `1.3.0` or higher

I really like [require.js](http://requirejs.org) style of modules. It encourages
dependency injection, it also supports module independence. But, for many it's non
standard and they're not used to it.

So, if you want to just use standard script tags make sure your `package.json` has its
`happyFunTimes.apiVersion` set to `1.3.0` or higher and add the flag `happyFunTimes.useScriptTag` set
to `true`. Example:

    {
      ...
      "happyFunTimes": {
        ...
        "apiVersion": "1.3.0",
        "useScriptTag": true,
        ...
      }
    }

The `<script>` tags for HappyFunTimes are automatically
added for you and so is the script tag that includes `scripts/game.js` for your game and
`scripts/controller.js` for your controller. If you need any other scripts
(like three.js or pixi.js or jquery) add script tags to
either `game.html` or `controller.html`.  The HappyFunTimes libraries will be inserted before
those tags. The `game.js` or `controller.js` will be inserted after.

See example: http://github.com/hft-simple-script/

####   `happyFunTimes.ignore`

Used to prevent certainly files from being part of the published game.

This is an array of strings in the format of `.gitignore` ([see git docs](http://git-scm.com/docs/gitignore))
not including the double asterix syntax. So for example

    {
      ...
      "happyFunTimes": {
        ...
        ignore: [
          "/src/",
          "*.psd"
        ],
        ...
      }
    }

would exclude the `<projectdir>/src` folder as well as any photoshop files.

####   `happyFunTimes.templateFileOptions`

requires apiVersion `1.15.0` or higher.

by default `game.html` automatically gets inserted into `templates/game.gameview.html`.
'controller.html` automatically gets inserted into `templates/controller.index.html`.

If your project needs other files to be treated similarly you can use this option. A good example
is [Tonde-Iko](http://github.com/greggman/hft-tonde-iko). Its `game.html` is just a menu for
debugging, testing, and lanching individual screens. The game itself is run from `realgame.html`.
There's also a network stress test in `stress.html` and a file that creates the controller avatar
texture atlas in `makeimage.html`.

Each of those needed the templating treatment to get the happyfuntimes support libraries etc so
this was added to the package.json

    {
      "name": "Tonde-Iko",
      ...
      "happyFunTimes": {
        "gameId": "tonde-iko",
        ...
        "templateFileOptions": [
          { "filename": "realgame.html",  "template": "game" },
          { "filename": "stress.html",    "template": "game" },
          { "filename": "makeimage.html", "template": "game" }
        ]
      }
    }

That basically says for those 3 files use the `game` template. They will automatically use
their respective scripts and css so for example `realgame.html` uses `scripts/realgame.js`
and `css/realgame.css`

