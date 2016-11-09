Title: Handling Disconnect and Reconnect.
Description: What to do when a player disconnects and reconnects.

For many games this doesn't matter. Do nothing. A player that disconnects
and reconnects later just starts as a new player. The majority of samples
HappyFunTimes games work this way.

But, let's say you're making a multi-player long play game something like

<iframe width="853" height="480" src="https://www.youtube.com/embed/FBsDF4qLF7w?rel=0" frameborder="0" allowfullscreen></iframe>

A player is expected to play for 15 minutes to an hour. While they are playing
waiting for other players to make their moves they go get a snack or start
reading their facebook newsfeed.

Finally when it's time for them to make a move again they've disconnected.

There's 2 ways around this.

1.  If your game has a fixed number of characters you can try using the `PlayerConnector`.

    The `PlayerConnector` lets you designate `GameObjects` in your scene to connect players
    to. The `GameObjects` are never deleted. If a player reconnects they'll be attached to
    the same `GameObject` they were before.

    For more info see [Controlling GameObjects already in the scene](player-connect.html#controlling-gameobjects-already-in-the-scene).

2.  Use `NetPlayer.GetSessionId()`

    In your game each NetPlayer object has a `session id`. You can access the session
    id by calling `m_netPlayer.GetSessionId()`. That id will stay the same when a player
    reconnects to a game.

    So, you can make some player state, associate it with the session id, then if a player
    reconnects you can use their session id to get their old state. For example

        class PlayerState {
          public int score = 0;
          public int characterClass = 0;
        };

        static Dictionary<string, PlayerState> s_playerStates = new Dictionary<string, PlayerState>();

        void InitializeNetPlayer(SpawnInfo spawnInfo) {

            m_netPlayer = spawnInfo.netPlayer;

            // See if we already have state for this player
            PlayerState playerState = null;
            if (!s_playerStates.TryGetValue(m_netPlayer.GetSessionId(), out playerState)) {

                // This is a new player so setup their player state
                playerState = new PlayerState();

                // Save it in case they disconnect and reconnect later
                s_playerStates[m_netPlayer.GetSessionId()] = playerState;
            }

            // adjust the GameObject based on PlayerState
            ....
        }

Of course it's not that simple. What do you do if they never reconnect? Maybe
it got too late and they left. Maybe they got sucked into a conversation
and are no longer interested in playing. Maybe their battery died on their
phone. All of that is a design issue and I can't really help but it's something
you should think about if you're designing a long play game.
