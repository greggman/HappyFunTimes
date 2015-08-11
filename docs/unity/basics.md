Title: The Basics of HappyFunTimes and Unity
Description: Read This so you know what to expect

HappyFunTimes is a small app and a library that lets you
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

## How it works

When a player connects the HappyFunTimes unity plugin
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

The `MessageMove` class must inherit from `MessageCmdData` looks like this

    private class MessageMove : MessageCmdData {
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
game and create the approriate class to receive the data.**

Of course you can always start with one of the samples

## Sending data to the phone

Sending data to the phone is just the reverse. First we make
class to represent the data we want to send.

    private class MessageScored : MessageCmdData {
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



