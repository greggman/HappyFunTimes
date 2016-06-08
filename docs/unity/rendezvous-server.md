Title: Publishing your HappyFunTimes Game
Description: Things you might want to know when shipping a game with HappyFunTimes

Awesome! You're considering shipping a game with HappyFunTimes. When can I play?!

There's a few things you should be aware of.

1.  I make no guarantees it's going to work everywhere

    See the license. Basically this is a labor of love but not a pledge of unlimited free work from me
    so please just be aware if you run into issues, while I try to be helpful in resolving them if I'm
    able, you'll need to deal with those issues on your own. Pull Requests welcome!

2.  `happyfuntimes.net` is a limited resource

    happyfuntimes.net is the simplest server I could think of to get the job done. All it does is help
    connect your players to your game. It costs me about $10 a month to run and I don't
    mind running it especially for small indie games, game jams, free games, etc.

    That said if you make a hit game and get a million users it's probably going to fall down.

    On top of that it could fail for other reasons. There's a bug. I'm upgrading it. My ISP
    get's hacked. Etc...

    The point being if it goes down people won't be able to connect to your awesome game.

    The good new is **YOU CAN RUN YOUR OWN SERVER!!!**

    The source code for the server is at `http://github.com/greggman/happyfuntimes.net` and
    it's on my todo list to write some scripts and instructions on how to set up your own server.
    In the meantime it's just a node.js based server with no other dependencies and there are
    lots of instructions all over the internet on how to set one up.

    The terse version would be

    1.  Register a domain name.

        For example `my100playergame.com`

    2.  Rent a server

        Digital Ocean is as low as $10 a month.
        Amazon's AWS is also cheap (I've never used it)

    3.  Setup the happyfuntimes.net software on your server

    4.  Set the `rendezvousUrl` setting to your domain

        That setting is in your `PlayerSpawner` or `PlayerConnector`

        If your domain is `my100playergame.com` then in the `rendezvousUrl` setting you'd
        enter `http://my100playergame.com/api/inform2`

    That's it! You're now 100% in control. Tell your players to go to your domain to join your game.



