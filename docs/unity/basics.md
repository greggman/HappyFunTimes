Title: The Basics of HappyFunTimes and Unity
Description: Read This so you know what to expect

HappyFunTimes library that lets you
make games that use smartphones as controllers. The games
can be created in HTML5 or Unity3D (more coming).

HappyFunTimes only provides the communications. It does
**not** provide controller implementations (the part that
runs on the phone) though there are many samples you can
start from. In fact [if you want to get started quick
as possible see the included gamepads](gamepad.md).
Otherwise the following covers the basics of how to
make everything custom.

HappyFunTimes also does not supply a game engine. That's
what Unity3D is for.

## Open the simple example

The closest example to the code below is contained in the simple scene
in `Assets/HappyFunTimes/MoreSamples/Simple/Scenes/HappyFunTimesSimpleExample`
Inside you'll find `ExampleSimpleSpawner` that contains the `PlayerSpawner`
mentioned below. Similarly you'll find it spawns a prefab called `PrefabForExampleSimple`
that contains a script `ExampleSimplePlayer` that is very similar to the code
below.

For the JavaScript parts look inside
`Assets/WebPlayerTemplates/HappyFunTimes/controllers/simple/scripts/controller.js`

## How it works

When a player connects the HappyFunTimes script `PlayerSpawner`
spawns prefab in your game and calls the
`InitializeNetPlayer` method in any scripts attached
to that prefab. `InitializeNetPlayer` is passed a
`NetPlayer` object. That object can be used to send
and receive messages from the phone.

## Receiving data from the Phone

When your `InitializeNetPlayer` method is called you can
register command handlers by calling `NetPlayer.RegisterCmdHandler`
and passing the name of the command and the function to call
when the command arrives from the phone. For example:

    private HappyFunTimes.NetPlayer m_netPlayer;

    void InitializeNetPlayer(SpawnInfo spawnInfo) {
        // Save the netplayer object so we can use it send messages to the phone
        m_netPlayer = spawnInfo.netPlayer;

        // Register handler to call if the player disconnects from the game.
        m_netPlayer.OnDisconnect += Remove;

        // Setup events for the different messages.
        m_netPlayer.RegisterCmdHandler<MessageColor>("color", OnColor);
        m_netPlayer.RegisterCmdHandler<MessageMove>("move", OnMove);
    }

Here you can see a typical `InitializeNetPlayer` method in C#. This line

    m_netPlayer.RegisterCmdHandler<MessageMove>("move", OnMove);

says when the command "move" comes in, convert the data in that message to
a `MessageMove` class and then call the method `OnMove`.

The `MessageMove` class makes all its fields public

    private class MessageMove {
        public float x = 0;
        public float y = 0;
    };

The `OnMove` method looks like this

    private void OnMove(MessageMove data) {
        m_position.x = data.x;
        m_position.z = data.y;

        gameObject.transform.localPosition = m_position;
    }

The `JavaScript` running on the phone looks like this

    client.sendCmd('move', {
      x: position.x,
      y: position.y,
    });

Whenever the phone executes that snippet of JavaScript the `OnMove`
method we registered with `RegisterCmdHandler` will get called.

**Note: It's up to you to make up commands appropriate for your game.
It's also up to you to decide what data to pass from the phone to the
game and create the approriate class and function to receive the data.**

Of course you can always start with one of the samples

## Sending data to the phone

Sending data to the phone is just the reverse. First we make
class to represent the data we want to send.

    private class MessageScored {
        public MessageScored(int _points) {
            points = _points;
        }

        public int points;
    }

Then we send it through the `NetPlayer` object we saved in `InitializeNetPlayer`.

    // Tell the phone it scored 100 points
    m_netPlayer.SendCmd("scored", new MessageScored(100));

On the phone a handler must be registered for that command

    client.addEventListener('scored', function(data) {
      score += data.points;
    });

Again **It's up to you to decide what messages your game needs, make a class
to represent that data and write the corresponding JavaScript to receive it.**

## Handling players Disconnecting

Players will disconnect from the game. Maybe they started talking to someone. Maybe
they got a call and stopped playing. Regardless it's up to you to deal with it.
This line in your `InitializeNetPlayer` method says when the player disconnects
call the `Remove` method.

    // Register handler to call if the player disconnects from the game.
    m_netPlayer.OnDisconnect += Remove;

The sample `Remove` method looks like this

    private void Remove(object sender, EventArgs e) {
        Destroy(gameObject);
    }

That method immediately destroys the prefab that was originally created.
**It's up to you to decide what is appropriate for your game to do when
a player disconnects**. For example maybe rather than kill the `GameObject`
you'd like the let AI take over for that player. Or maybe you'd like to [keep
it around and either let the player reconnect or let some other player use it](reusing-players.html).
It's really up to you.

## HappyFunTimes on the phone

If you open `Assets/WebPlayerTemplates/HappyFunTimes/controllers/simple/controller.html` you'll
see the HTML for a sample controller. You can see it includes 3 scripts

    <script src="/hft/hft.js"></script>
    <script src="/sample-ui/sample-ui.js"></script>
    <script src="scripts/controller.js"></script>

`hft.js` is HappyFunTimes. This script connects the phone to the game. it is the only part 100% required
for HappyFunTimes.

It exposes `hft.GameClient` which you initialize like this

    var client = new hft.GameClient();

At at that point you can add handlers and send messages like above.

If you want to display something when the player is disconnected, for example if you stop the game,
you can add a handle

    client.addEventListener('disconnect', functionToCallWhenDisconnected);

The sample-ui, see below, already handles this message but if you're not using the sample-ui then
this is how you check for being disconnected. Other than displaying a message there's not much to
do. HappyFunTimes will take care of reconnecting the player if the game restarts.

## The sample-ui

All of the sample controllers are based off some code called the "sample-ui". It's just that, a sample.
You're free to use it or not. The sample UI manages orientation, fullscreen, letting the player enter
a name, etc.. It also has functions for reading touch input etc.. Look at any sample to see how it's
used.

A typical example looks like this. First we pull out all the libraries into local variables

    var commonUI = sampleUI.commonUI;
    var input = sampleUI.input;
    var misc = sampleUI.misc;
    var mobileHacks = sampleUI.mobileHacks;
    var strings = sampleUI.strings;
    var touch = sampleUI.touch;

Then after we've created the `HFT.GameClient` (see above) we call a few functions

    commonUI.setupStandardControllerUI(client, globals);
    commonUI.askForNameOnce();
    commonUI.showMenu(true);

The first one

    commonUI.setupStandardControllerUI(client, globals);

Lets the sample-ui look for disconnect and messages related to the player's name

The second line

    commonUI.askForNameOnce();

says "if the player hasn't set their name ask them to enter one".
If you're game doesn't need a player name delete that line.

The last line

    commonUI.showMenu(true);

says show the gear menu in the top right that lets the player change their name
If you don't want the menu change this `true` to `false`.

Above that in most controllers is this

    var globals = {
      debug: false,
      //orientation: "landscape-primary",
    };
    misc.applyUrlSettings(globals);
    mobileHacks.fixHeightHack();
    mobileHacks.disableContextMenu();

The first part just declares some global object to hold various settings

This line

    misc.applyUrlSettings(globals);

parses the query string into globals. In particular a JSON string assigned to settings
so if your controller URL is `http://localhost:18679?settings={foo:123,bar:"abc"}`
then `globals.foo` will be `123` and `globals.bar` will be `"abc"`.
You can use this during development to pass in stuff for testing etc.

This line

    mobileHacks.fixHeightHack();

tries to deal with some quirks of mobile browsers.

The last line

    mobileHacks.disableContextMenu();

tries to disable the context menu. Otherwise if the player holds their finger on the
phone its browser menu will pop up asking them if they want to copy etc...

## Docs for the sample-ui

[The various JavaScript functions of the sample-ui are documented here](/docs/hft/).

## Dealing with the player's name

One other thing the sample-ui does is let the player enter and edit a name. On the C# side
there is a corresponding class `HFTPlayerNameManager` that deals with the messages related
to name editing from the sample-ui. To use it create an instance of that class in your
`InitializeNetPlayer` function. For example

    private HFTPlayerNameManager m_playerNameManager;

    void InitializeNetPlayer(SpawnInfo spawnInfo) {
        ...
        // Track name changes
        m_playerNameManager = new HFTPlayerNameManager(m_netPlayer);
        m_playerNameManager.OnNameChange += ChangeName;

        ...
    }

    private void ChangeName(string name) {
        Debug.Log("new name is: " + name);
    }

Be sure to cleanup when your `GameObject` is destroyed.

    void OnDestroy() {
        if (m_playerNameManager != null) {
          m_playerNameManager.Close();
          m_playerNameManager = null;
        }
    }

## More

See [Make Controllers](self-control.md) for a few more details.
