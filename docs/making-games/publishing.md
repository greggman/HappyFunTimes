To publish a HappyFunTimes app

If Unity just export from Unity [see unity docs](../unity).

If HTML5 the easist way to start with an existing happyfuntimes app.

1.  Install node.js
2.  Open a terminal or `node command prompt` on Windows
3.  git clone (or download) [an example](writing-games.md#available-example-games)
4.  Install any packages it needs by

        cd path/it/was/cloned-or-unzipped-to
        npm install

5.  Test that it works

        npm run start

    Will run the game in development mode.

        npm run startp

    Will run the game in production mode. (fullscreen)

6.  copy your files in.

    Your game should be a webpage named `game.html` and your controller a controller named `controller.html`.
    Use any HTML game engines or libraries you want. You can use `<script>` tags or AMD or CommonJS to load
    your javascript. Note I can't help you write a game but you can read the docs about the specific happyfuntimes
    parts and look at the existing games as examples

7.  Check that it works in both development and production modes

        npm run start   # starts in development mode
        npm run startp  # starts in production mode

8.  Make an icon.png file and convert it to both an .ico and .icns file

    I did this using an online service like https://iconverticons.com/online/

    Download and copy the results to `build/icon.icns` and `build/icon.ico` respectively

    **NOTE: Your icon should be 256x256 or you'll get an error**

9.  Edit the `package.json` file and change the `name`, `productName`, `description`, `version`, `appId`

    [See package.json](packagejson.md).

10. type `npm run pack`

    When it's finished there should be an app in `dist/mac` or `dist/win` which you can test.

11. type `npm run dist`

    This will make a `.dmg` file on mac or an installer file on windows again in `dist/mac` or `dist/win`

    The installers are compressed so they will likely be much smaller then the apps from the previous step.

Publish your game wherever you want. Note that if you expect your game to be super popular you may want to
consider running your own rendezvous server (the server that connects player's phones to the game). By that
I mean players normally connect to the game by going to `happyfuntimes.net` but you can run your own
server like `my100playergame.com` and tell users to go there.





