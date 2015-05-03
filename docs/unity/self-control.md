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

For Unity games the files for controllers exist in
`Assets/WebPlayerTemplates/HappyFunTimes`. The relevant files are:

    controller.html           // The HTML for your controller
    css/controller.css        // The CSS for your controller
    scripts/controller.js     // The main script for your controller

Edit those 3 files to create your controller. If you need other
JavaScript libraries or other assets (image, sounds) put them
in `Assets/WebPlayerTemplates/HappyFunTimes` or a deeper like
`Assets/WebPlayerTemplates/HappyFunTimes/images` and/or
`Assets/WebPlayerTemplates/HappyFunTimes/sounds`

`contoller.html` is inserted into a template at runtime. The template provides
common UI features like the settings icon in the top right corner, name input,
and support for switching games.

### controller.js

The minimum contents of a `controller.js` is

    "use strict";

    // Start the main app logic.
    requirejs(
      [ 'hft/gameclient',
        'hft/commonui',
        'hft/misc/misc',
        'hft/misc/mobilehacks',
      ], function(
        GameClient,
        CommonUI,
        Misc,
        MobileHacks) {
      var g_client;

      var globals = {
        debug: false,
      };
      Misc.applyUrlSettings(globals);
      MobileHacks.fixHeightHack();

      g_client = new GameClient();

      CommonUI.setupStandardControllerUI(g_client, globals);

      // Insert your controller specific code here.
    });

Currently the rest is up to you. Add HTML elements as you see fit. Read HTML events and
call `g_client.sendCmd` to pass whatever events you want back to the game. Add listeners
with `g_client.addEventListener` for any events you want to send from the game back to the
controller.

    g_client.sendCmd('foo', { someNumber: 123, someString, "abc", someBool: true});

Will emit a message on the corresponding `NetPlayer` in the game.

    using HappyFunTimes;

    ...

    class FooMsg : MessageCmdData {
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

    class BarMsg : MessageCmdData {
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

    g_client.addEventListener('bar', handleBar);

    function handleBar(data) {
      console.log(data);
      // should show { aString: "hello", aBool: true, aNumber: 1.23 }
    }

### Dealing with different phone sizes

The hardest part of creating a controller is handling
CSS and placement across browser versions and devices. For example iOS6.1,
iOS7.0, iOS7.1, iOS8.3 all provide a different size usable area
in Safari. On top fo that 3.5inch iPhones vs 4inch iPhones and newer provide a different usable area.
And finally add Android on top of that and possibly iPad and other tablets and you can see
this is the hardest part.

If you design on a iPhone6 plus be sure to test on some smaller phones like an iPhone4s.
If you happen to be on a Mac the iOS Simulator that comes with XCode is your friend.

Keep your controllers simple or look up responsive design








