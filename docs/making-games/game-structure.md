Title: HTML5/Electron Game Structure
Description: The Structure of HappyFunTimes Games

Each HFT game consists of two different components that must exist to run the game
properly. One component is the game and one is the controller, which both also
have corresponding Javascript and CSS files.

#### Contents

*   [Basic file structure](#basic-file-structure)
*   [Game Component](#game-component)
*   [Controller Component](#controller-component)

---

## Basic file structure

These files are **required** for all HappyFunTimes games

    controller.html             // The HTML for your controller
    game.html                   // The HTML for your game
    main.js                     // The code that launches game.html in Electron
    package.json                // Names your game and your dependencies

These files are required if you want to ship your game as a standalone app

    build/icon.icns             // An Icon for your app on Mac at least 256x256
    build/icon.ico              // An Icon for your app on Windows at least 256x256

For more information about the `package.json` file, visit the [Package Json](packagejson.md)
page.

---

### Game Component

The game component runs on PC that is connected to a TV.
This component receives input from the controllers
and displays the computed results on the screen.

#### game.html

The `game.html` file contains the HTML that will be used to display the game
itself. You can use any HTML5 based game library like [Phasar](https://phaser.io/),
[Pixi.js](http://www.pixijs.com), [Turbulenz](http://biz.turbulenz.com/developers),
[Cocos-2DX](https://github.com/cocos2d/cocos2d-html5), [Three.js](http://threejs.org/),
etc. Happyfuntimes itself is only a library that provides a way to use smartphones
as controllers.

---

### Controller Component

The controller component is what runs on the mobile devices that are used by the
players to control their player or control other parts of the game.
There can be multiple active controllers at the same time as they represent the
single players of the game.

#### controller.html

The `controller.html` file contains the HTML that will be displayed on the mobile
device. Depending on the type of the game, there could be a single touch area,
gamepad-like move controllers or input fields for text.

---

Next step: [Writing Games](writing-games.md)
