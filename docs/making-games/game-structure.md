Title: Game Structure
Description: The Structure of HappyFunTimes Games

Each HFT game consists of two different components that must exist to run the game
properly. One component is the game and one is the controller, which both also
have corresponding Javascript and CSS files.

#### Contents

*   [Basic file structure](#basic-file-structure)
*   [Game Component](#game-component)
*   [Controller Component](#controller-component)
*   [Require.js](#require-js)

---

## Basic file structure

These files are **required** for all HappyFunTimes games

    css/controller.css          // The CSS for your controller
    css/game.css                // The CSS for your controller
    scripts/controller.js       // The main script for your controller
    scripts/game.js             // The main script for your controller
    controller.html             // The HTML for your controller
    game.html                   // The HTML for your game
    package.json                // The data about your game.
    screenshot.png              // At least one screenshot 640x480 is good
    icon.png                    // An icon, 128x128

For more information about the `package.json` file, visit the [Package Json](packagejson.md)
page.

---

### Game Component

The game component runs on the main device that opened the game, in most cases a
PC that is connected to a TV. The component receives input from the controllers
and displays the computed results on the screen.
There is only one game active at a time.

#### game.html

The `game.html` file contains the HTML that will be used to display the game
itself. It can contain various elements which depend on what you need to display
for all players.
In most cases it will contain the elements that represent the players and a goal
that needs to be reached or whatever the game is about.

#### game.js

The `game.js` file contains the main logic that runs the whole game. It starts
the game itself, manages connecting players, receives player input and handles
how the input is processed and displayed to the players.
You will get more information about the contents of this file in
[Writing Games > `game.js`](writing-games.md#game-js).

#### game.css

The `game.css` file contains the styling for the game. It can be static but you can
also generate a CSS file by using a CSS preprocessor. There are no specific
requirements regarding this file. Styling is completely up to you.

---

### Controller Component

The controller component is what runs on the mobile devices that are used by the
players to control their player or control other parts of the game.
There can be multiple active controllers at the same time as they represent the
single players of the game.

#### controller.html

The `controller.html` file contains the HTML that will be displayed on the mobile
device. Dependin on the type of the game, there could be a single touch area,
gamepad-like move controllers or input fields for text.

#### controller.js

The `controller.js` file contains the main logic that controls how the controller
behaves, how he reacts to what happens in the game and how player input should be
pushed to the game component.
You will get more information about the contents of this file in
[Writing Games > `controller.js`](writing-games.md#controller-js).

#### controller.css

The `controller.css` file contains the styling for the controller. It can be static
but you can also generate a CSS file by using a CSS preprocessor. There are no specific
requirements regarding this file. Styling is completely up to you.

_Hint: There are multiple CSS snippets in the [Tips docs](../tips.md) that can be used
to eliminate unwanted behaviour like context menus._

---

### Require.js

Currently most JavaScript in HappyFunTimes uses [require.js](http://requirejs.org) to load and
reference files. Requirejs is awesome because it provides both dependency injection
and a module system.

---

Next step: [Writing Games](writing-games.md)
