Title: Making Controllers
Description: How to make controllers for HappyFunTimes

Controllers are the part that runs on the phone as in
the phone becomes a game controller.

Controllers are just webpages that appear on the phone.
HappyFunTimes provides the connection between the phone
and the game but it's up to you to make HTML, CSS,
JavaScript, Images and whatever else you need for your
controllers.

The easist path is to choose one of the existing games
and start modifying.

For Unity games the files for samples controllers exist in
`Assets/WebPlayerTemplates/HappyFunTimes/controllers`. For each
controller the relevant files are:

    controller.html           // The HTML for your controller
    css/controller.css        // The CSS for your controller
    scripts/controller.js     // The main script for your controller

Edit or better copy those 3 files to create your controller. If you need other
JavaScript libraries or other assets (image, sounds) put them
somewhere under `Assets/WebPlayerTemplates/HappyFunTimes` or a deeper like
`Assets/WebPlayerTemplates/HappyFunTimes/images` and/or
`Assets/WebPlayerTemplates/HappyFunTimes/mygame/sounds`

### controller.html

The minimum content of controller.html is

    <script src="/hft/hft.js"></script>

Everything else is option. You can put your own script directly in the HTML
or put outside with another script tag. All of the sample controller load
at least 2 more scripts

    <script src="/sample-ui/sample-ui.js"></script>
    <script src="scripts/controller.js"></script>

Some load more for 3rdparty libraries etc...

### controller.js

The minimum contents of a `controller.js` (or wherever you put your JavaScript) is

    var client = new hft.GameClient();

That's it. If you'd like to use the sample ui
then you'd also add something like

    var commonUI = sampleUI.commonUI;
    var input = sampleUI.input;
    var misc = sampleUI.misc;
    var mobileHacks = sampleUI.mobileHacks;
    var strings = sampleUI.strings;
    var touch = sampleUI.touch;

    var globals = {
      debug: false,
      //orientation: "landscape-primary",
    };
    misc.applyUrlSettings(globals);
    mobileHacks.fixHeightHack();
    mobileHacks.disableContextMenu();

    var client = new hft.GameClient();   // -------- NOTICE LINE FROM ABOVE -----------

    commonUI.setupStandardControllerUI(client, globals);
    commonUI.askForNameOnce();
    commonUI.showMenu(true);

If you use the sample-ui put your elements inside the the `id="hft-content"` div and before
the `id="hft-menu"` div.

    <div id="hft-content">

        <!-- your elements go here if you're using the sample-ui -->

        <div id="hft-menu"><img src="/hft/assets/gear-icon.svg"></div>
    </div>

The rest is up to you. Add HTML elements as you see fit. Read HTML events and
call `client.sendCmd` to pass whatever events you want back to the game. Add listeners
with `client.addEventListener` for any events you want to send from the game back to the
controller.

    client.sendCmd('foo', { someNumber: 123, someString, "abc", someBool: true});

Will emit a message on the corresponding `NetPlayer` in the game.

    using HappyFunTimes;

    ...

    class FooMsg {
      public int someNumber;
      public string someString;
      public bool someBool;
    };

    private NetPlayer m_netPlayer;

    void InitializeNetPlayer(SpawnInfo spawnInfo) {
       // save off the NetPlayer so we can communicate with the phone
       m_netPlayer = spawnInfo.netPlayer;

       // Register a method to call when the phone sends the `foo` message
       m_netPlayer.RegisterCmdHandler<FooMsg>("foo", OnFooMsg);
    }

    void OnFooMsg(FooMsg msgData) {
      // do something with the data you sent from the phone
      Debug.Log("someNumber: " + msgData.someNumber);
      Debug.Log("someString: " + msgData.someString);
      Debug.Log("someBool: " + msgData.someBool);
    }

Similary any message sent by the game

    class BarMsg {
      BarMsg(string s, bool b, float n) {
        aString = s;
        aBool = b;
        aNumber = n;
      }

      public string aString;
      public bool aBool;
      public flaot aNumber;
    };

    m_netPlayer.sendCmd("bar", new BarMsg(("hello", true, 1.23));

Will emit an event back in the controller.

    client.addEventListener('bar', handleBar);

    function handleBar(data) {
      console.log(data);
      // should show { aString: "hello", aBool: true, aNumber: 1.23 }
    }

### Dealing with different phone sizes

The hardest part of creating a controller is handling
CSS and placement across browser versions and devices. For example iOS6.1,
iOS7.0, iOS7.1, iOS8.3, iOS9.x all provide a different size usable area
in Safari. On top fo that 3.5inch iPhones vs 4inch iPhones and newer provide a different usable area.
And finally add Android on top of that and possibly iPad and other tablets and you can see
this is the hardest part.

If you design on a iPhone6 plus be sure to test on some smaller phones like an iPhone4s.
Keep your controllers simple or look up responsive design. Possibly consider using a
[CSS framework](https://www.google.com/search?q=css%20frameworks&rct=j).

## Debugging

If you happen to be on a Mac [the iOS Simulator](https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/iOS_Simulator_Guide/Introduction/Introduction.html)
that comes with [XCode](https://developer.apple.com/xcode/download/) is your friend.
Also see [Chrome's phone emulation mode](https://developers.google.com/web/tools/chrome-devtools/iterate/device-mode/emulate-mobile-viewports).
[Chrome's dev tools can even emulate phone orientation](https://developers.google.com/web/tools/chrome-devtools/iterate/device-mode/device-input-and-sensors?hl=en).

[Chrome's Remote Debugging](https://developers.google.com/web/tools/chrome-devtools/debug/remote-debugging/remote-debugging?hl=en)
and [Safari Remote Debugging](https://developer.apple.com/library/iad/documentation/AppleApplications/Conceptual/Safari_Developer_Guide/GettingStarted/GettingStarted.html#//apple_ref/doc/uid/TP40007874-CH2-SW8)
are super useful. You plug you phone into the computer with a USB cable and you can
debug webpages running on your phone from your computer.

## More info

For more info see [The Basics of HappyFunTimes and Unity](basics.md)
