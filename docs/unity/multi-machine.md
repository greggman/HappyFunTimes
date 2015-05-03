Title: Multiple Computers
Description: How to make a game that runs across mutliple computers.

First of you might be interested in tnis video to see what I mean

<iframe width="853" height="480" src="https://www.youtube.com/embed/aFMNmKYE8KM?rel=0" frameborder="0" allowfullscreen></iframe>

The game above spans 6 monitors. Each monitor has it's own computer. Players can jump from monitor
to monitor and walk up and down a large level.

For Unity3D you might want to [download this sample](http://docs.happyfuntimes.net/docs/unity/samples.html?owner=greggman&repo=hft-unity-multi-game-example)
into an new scene in Unity.

This sample **MUST BE RUN FROM THE COMMAND LINE**. The reason is each instance needs an ID and so
running by clicking an app or from an editor would require editing that id. To run from the command
line you must EXPORT an executable.  With Unity closed, open a Terminal/Command Prompt, cd to the
folder your unity project is in and type `hft export` to automatically export

The on OSX these command lines would launch 3 windows in the local machine

    bin/unitymultigame-osx.app/Contents/MacOS/unitymultigame-osx --hft-id=game0 --num-games=3
    bin/unitymultigame-osx.app/Contents/MacOS/unitymultigame-osx --hft-id=game1 --num-games=3
    bin/unitymultigame-osx.app/Contents/MacOS/unitymultigame-osx --hft-id=game2 --num-games=3

If you run those commands and then open a browser window to http://localhost:18679 a player should
appear. Jumping off the left / right edges of the screen should make you go to the next window.

If you were running on multiple machines the 3 machines might use lines like this

*   machine 1

        bin/unitymultigame-osx.app/Contents/MacOS/unitymultigame-osx --hft-id=game0 --num-games=3 --hft-url=ws://192.168.1.9:18679 --hft-master

*   machine 2

        bin/unitymultigame-osx.app/Contents/MacOS/unitymultigame-osx --hft-id=game1 --num-games=3 --hft-url=ws://192.168.1.9:18679

*   machine 3

        bin/unitymultigame-osx.app/Contents/MacOS/unitymultigame-osx --hft-id=game2 --num-games=3 --hft-url=ws://192.168.1.9:18679

where `192.68.1.9` is the IP address of the machine running HappyFunTimes.

All machines must have the game in the same path AND whatever machine is running HappyFunTimes alos needs a copy
of this repo at the exact same PATH as these machines.

This particular game just runs a simple level and when you jump off the right side of the screen
it transfers that player to the next game. In other words, if you are on `game1` and you go off the
right side of the screen you'll be sent to `game2`. Conversely if you jump off the
left side you'd be send to `game0`. `--num-games` determines when to wrap around so in the above example
with `--num-games=3` if you're on `game2` and go off the right you'll be sent to `game0`.

Of course in your own game you could put up a dialog box or something and ask for an ID but
most people running multiple machine games are probably doing so in a setting they want to
automate and so using the command line seems like the best way.

## How it works

Each computer runs 100% independently with no knowledge that any other games are running.
To each computer it just looks like a normal HappyFunTimes game. Players connect just like
normal.

The difference is, based on whatever logic YOU DECIDE, your game can tell HappyFunTimes to
transfer a player to another machine. It does this by calling `NetPlayer.SwitchGame`,
specifying the id of the game to send the player to, and passing any data you want with that player.
That player will then be disconnected from this computer and connected to the computer with the specified
id.

When the player connects to the new machine the `InitializeNetPlayer` method will be called just like
normal except the data the previous machine sent is passed as well. It's up to you to decide what
data to pass.

## Passing Data from one Game to Another

Looking at the `BirdScript.cs` code the sample above. First we create a mesasge with the
data we want to send between games.

    // Message to send when sending a player to another game
    private class MessageSwitchGame : MessageCmdData
    {
        public Vector2 pos;  // where the player was
        public Vector2 vel;  // what speed he was going
        public string name;  // his name
        public Color color;  // his color
        public float dir;    // what direction he's facing
    }

Then we make some code to send a player to another game

    void SwitchGame(int dir)
    {
        MessageSwitchGame data = new MessageSwitchGame();
        data.pos = transform.position;
        data.vel = m_rigidbody2d.velocity;
        data.name = m_playerName;
        data.color = m_color;
        data.dir = m_direction;

        // Look up the id of the game where in. Something like "level3"
        string gameId = LevelSettings.settings.playerSpawner.server.Id;

        // Extract the number part
        int numNdx = gameId.IndexOfAny("0123456789".ToCharArray());
        int gameNum = System.Convert.ToInt32(gameId.Substring(numNdx));

        // Increment or Decrement the number wraping at the ends
        gameNum = (gameNum + LevelSettings.settings.numGames + dir) % LevelSettings.settings.numGames;

        // Build the ID of the game we want to switch to
        gameId = gameId.Substring(0, numNdx) + gameNum;

        // Send this player to that game.
        // Note: No more messages will be received or sent to this player.
        m_netPlayer.SwitchGame(gameId, data);
    }

IMPORTANT! You can see the logic here for how to switch game is in YOUR CODE. You make up the
rules. The code above looks at `dir` passed into the function which is either +1 if we want
to send to the next game id or -1 if want to send the the previous game id.

It then assumes the id of the current game is something that ends with numbers as in "blabla123".
It pulls out the number part, adds or subtracts one, mods it (the %) so that it wraps around
based on `numGames`.  In other words if `dir = 1` and `gameId = foo3` and `numGames = 4` then
the result will be `foo0` since *it assumes* the games are named `foo0`, `foo1`, `foo2`, `foo3`.

Finally it calls `m_netPlayer.SwitchGame(gameId, data)` which will immediately disconnect the
player from this game and send him to the game of the specified id.

The code calls `SwitchGame(-1)` when the player goes off the left side of the level and `SwitchGame(1)`
when the player goes of the right side of the level

    ...
    if (transform.position.x < LevelSettings.settings.leftEdgeOfLevel.position.x) {
        SwitchGame(-1);
    } else if (transform.position.x > LevelSettings.settings.rightEdgeOfLevel.position.x) {
        SwitchGame(1);
    }
    ...

The game receiving the player will have it's `InitializeNetPlayer` method called. Again looking
at `BirdScript.cs`

    // Called when player connects with their phone
    void InitializeNetPlayer(SpawnInfo spawnInfo)
    {
        Init();

        m_netPlayer = spawnInfo.netPlayer;
        m_netPlayer.OnDisconnect += Remove;
        m_netPlayer.OnNameChange += ChangeName;

        // Setup events for the different messages.
        m_netPlayer.RegisterCmdHandler<MessageMove>("move", OnMove);
        m_netPlayer.RegisterCmdHandler<MessageJump>("jump", OnJump);

        // We always get a `data` so check if it has one key from our expected message
        if (spawnInfo.data != null && spawnInfo.data.ContainsKey("dir")) {
            // This player was transferred from another game.

            // Turn the data back into our structure
            DeJson.Deserializer deserializer = new DeJson.Deserializer();
            MessageSwitchGame data = deserializer.Deserialize<MessageSwitchGame>(spawnInfo.data);

            // Choose a starting position based on the old position
            float x = (data.pos.x < LevelSettings.settings.leftEdgeOfLevel.position.x)
                ? LevelSettings.settings.rightEdgeOfLevel.position.x - 1 : LevelSettings.settings.leftEdgeOfLevel.position.x + 1;
            transform.localPosition = new Vector3(x, data.pos.y, 0f);

            // Set the initial velocity
            m_rigidbody2d.velocity = data.vel;

            // And the direction
            m_direction = data.dir;

            SetName(data.name);
            SetColor(data.color);
        } else {
            // This player just joined.
            MoveToRandomSpawnPoint();
            SetName(m_netPlayer.Name);
        }
    }

We can see it checks if this is a brand new player or one transfered from another machine.
It does this by checking for one of the fields of `MessageSwitchPlayer`

    // We always get a `data` so check if it has one key from our expected message
    if (spawnInfo.data != null && spawnInfo.data.ContainsKey("dir")) {
        // This player was transferred from another game.

        ...
    } else {
        // It's a brand new player

    }

In the case of it being a player transfered from another game
first it converts the data sent into a `MessageSwitchGame`.

    // Turn the data back into our structure
    DeJson.Deserializer deserializer = new DeJson.Deserializer();
    MessageSwitchGame data = deserializer.Deserialize<MessageSwitchGame>(spawnInfo.data);

Then it checks, if they were on the right on the
old game it spawns them on the left, if they were on the left it spawns them on the right.

    // Choose a starting position based on the old position
    float x = (data.pos.x < LevelSettings.settings.leftEdgeOfLevel.position.x)
        ? LevelSettings.settings.rightEdgeOfLevel.position.x - 1 : LevelSettings.settings.leftEdgeOfLevel.position.x + 1;
    transform.localPosition = new Vector3(x, data.pos.y, 0f);

Finally it sets up the other state sent from the previous game

    // Set the initial velocity
    m_rigidbody2d.velocity = data.vel;

    // And the direction
    m_direction = data.dir;

    SetName(data.name);
    SetColor(data.color);

## Command Line Arguments

The `--hft-id`, `--hft-url` and `--hft-master` are all handled by HappyFunTimes for you.

*   `--hft-id`

    This specified the game id for that machine

*   `--hft-url`

    This specifies the URL of the machine running HappyFunTimes. Only one machine should run HappyFunTimes.

    If you're really setting up an installation you probably want to make sure your router always
    gives the machine running HappyFunTimes the same IP addess. Consult your router's manual for
    how to do this.

*   `--hft-master`

    This tells HappyFunTimes which machine should receive new players. By default the first game
    to connect to HappyFunTimes will receive the players unless you pass in `--hft-master`.

    If you setup an installation with 10 machines and turn the power on you probably have no idea
    which machine will boot fastest and connect to HappyFunTimes first so you need to tell HappyFunTimes
    which machine should receive new players.

    Of course if you'd like them to be randomly assigned then setup some logic in your `InitializeNetPlayer`
    function that if the player just connect randomly picks a game id and sends them to that game.

## Custom Command Line Arguments

If you look in the sample above in `LevelSettings.cs` you can see some code like this

    void Awake()
    {
        ...
        ArgParser p = new ArgParser();
        p.TryGet<int>("num-games", ref numGames);
        ...
    }

Create an `ArgParser` and then use it to read any commmand line argumest you want. The sample
above uses "--num-games" to allow an infinite number of games but of course if you are designing
a specific game with a specific number of machines there's no reason you'd need any command line
arguments.








