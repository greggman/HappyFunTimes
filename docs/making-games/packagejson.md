Package.json
============

`package.json` isn't really specifically a happyfuntimes thing. It's part
of `npm` (the Node Package Manager). It makes it easy to add libraries
to your project, one of those libaries being `happyfuntimes`

If you're planning on shipping a game and you started with one of
the sample projects you'll need to edit your `package.json` file
to set the name of your game, etc.

`package.json` is a JSON file and JSON has a very strict format.

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

*   It's case sensitive. `"productName"` is **NOT** the same as `"ProductName"`

### Required fields

A standard package.json looks like this

    {
      "name": "JumpJump",
      "productName": "Jump Jump",
      "description": "A game with Jumping",
      "version": "0.0.2",
      "private": false,
      "build": {
        "appId": "com.greggman.hftJumpJump",
        "asar": false,
        "mac": {
          "category": "public.app-category.games"
        }
      },
      "main": "main.js",
      "scripts": {
        "start": "cross-env NODE_ENV=development electron main.js",
        "startp": "cross-env NODE_ENV=production electron main.js",
        "pack": "build --dir",
        "dist": "build"
      },
      "dependencies": {
        "happyfuntimes": "^0.1.1",
        "optionator": "^0.8.2"
      },
      "devDependencies": {
        "cross-env": "^3.1.3",
        "electron": "^1.4.5",
        "electron-builder": "^8.6.0"
      }
    }

#### `name`

A name for your game. No spaces, ascii only

#### `productName`

A name for your game. Can include spaces. UTF-8

#### `description`

A description.

#### `build.appId`

A app id for the various stores

#### `version`

A version number in [semver format](http://semver.org/).

This will be used when building your app.

