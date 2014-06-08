Unity Docs for HappyFunTimes
============================

Very similar to the JavaScript version but note there is no gameclient
(something to run on a smartphone), there is only gameserver, something to
use in the game. That's because the whole point of this library is
to allow people with smartphones (or laptops) to join your game without
needing to install any software. The browser becomes a controller. The
game itself can be in Unity but the controllers need to be browsers
to achieve this goal.

Installation
------------

1.  Clone the repo
2.  In Unity, make a new Project
3.  Pick Assets->Import Package->Character Controller
4.  Copy the contents of Unity3D/3rdParty to Assets/Plugins
5.  Copy Unity3D/Extra to Assets/Plugins/HappyFunTimesExtra
6.  Copy Unity3D/src to Assets/Plugins/HappyFunTimes
7.  Copy Unity3d/Examples to Assets/Scripts/HappyFunTimes
8.  Open the scene Unity3D/Examples/Scenes/HappyFunTimesCharacterExample
9.  Pick Edit->Project Settings->Player and check "Run in Background"

Note: These instructions include the sample projects. If all you want is
the minimum required to do your own thing with HappyFunTimes skip steps #3, #7, and #8

**RelayServer**

The relayserver is completely seperate to the Unity project.
Follow the instructions in main [README.md](../README.md#running-the-examples) to install and run the server with node.js

Integration with your app
-------------------------

`GameServer`

In some MonoBehaviour (in other words, Add a Script Component), make `GameServer` and
call init. You can pass init an optional websocket URL. The default is "ws://localhost:8080"
which means it assume the relayserver us running on the same machine as the game and
is running on the default port.

    GameServer.Options options = new GameServer.Options();
    options.gameId = "simple";
    m_server = new GameServer(options, gameObject);
    m_server.Init();

Attach 3 events

    m_server.OnPlayerConnect += StartNewPlayer;
    m_server.OnConnect += Connected;
    m_server.OnDisconnect += Disconnected;

When a player connects your `StartNewPlayer` will be called and passed a NetPlayer in
the event object. Spawn a GameObject however you please and some how pass the NetPlayer
to it. In the example simple we do this by making a `ExampleSimplePlayer` class which
is also a MonoBehaviour, add it to our newly created GameObject, and then call its
`init` function passing it the `NetPlayer`

    void StartNewPlayer(object sender, PlayerConnectMessageArgs e) {
        // Spawn a new player then add a script to it.
        GameObject gameObject = (GameObject)Instantiate(prefabToSpawnForPlayer, position, Quaternion.identity);

        // Add the ExampleSimplePlayer script to this object. Note: We could possible add this to the prefab.
        // Not sure which is best.
        ExampleSimplePlayer player = gameObject.AddComponent<ExampleSimplePlayer>();
        player.Init(e.netPlayer);
    }

At this point wire up your events you want the NetPlayer to be able to respond to. To do this
create a MessageCmdData class for each message that represents the data you'll receive. For example if the
smartphone is going to send

    client.sendCmd('move', {x:10, y:20});

Then you'd make a MessageCmdData class like thsi

    [CmdName("move")]
    private class MessageMove : MessageCmdData {
        public int x = 0;
        public int y = 0;
    };

The attribute `[CmdName("move")]` associates that class with 'move' commands. You can now
setup an event handler for when move commands come in like this

        m_netPlayer.RegisterCmdHandler<MessageMove>(OnMove);

    ...

    private void OnMove(MessageMove data) {
        m_position.x = data.x;
        m_position.z = data.y;

        gameObject.transform.localPosition = m_position;
    }

Similarly if you want to send a command to the client define a MessageCmdData. Example

    [CmdName("scored")]
    private class MessageScored : MessageCmdData {
        public MessageScored(int _points) {
            points = _points;
        }

        public int points;
    }

To send one call NetPlayer.sendCmd

        m_netPlayer.SendCmd(new MessageScored(m_rand.Next(5, 15)));

The smartphone's client will receive a 'scored' command with the data. eg. {points: 7}

    // On the phone
    var someFunctionToHandleScoring = function(data) {
       console.log("You scored " + data.points + " points!");
    };

    gameclient.addEventListener('scored', someFunctionToHandleScoring);


You also need to handle if the player's smartphone disconnects. You do this by adding an
OnDisconnect event handler.

        m_netPlayer.OnDisconnect += Remove;

    ...

    private void Remove(object sender, EventArgs e) {
        Destroy(gameObject);
    }

That's pretty much it.


