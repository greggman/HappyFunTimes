Title: Playing Sounds from Controllers
Description: How to play sounds from the Phone

To be clear, if you make your own custom controllers you can play sounds any way you'd
like. This document is specifically about playing sounds from the sample [Gamepad controller](gamepad.md)

## Making Sounds

There are currently 2 ways to make sounds for the sample gamepad controllers.

1.  JSFX

    This is the recommended way as it's light weight.

    1.  Go to the [JSFX sound maker](http://egonelbre.com/project/jsfx/).

    2.  Adjust the values until you get a sound you like.

    3.  Copy the sound values (near top of the page just below the buttons) to a text file with the extension ".jsfx.txt"
        putting a name in front of each set of values. Save that file some where below
        `Assets/WebPlayerTemplates/HappyFunTimes`

    For example here is the sample `sounds.jsfx.txt` file

        coin      ["square",0.0000,0.4000,0.0000,0.0240,0.4080,0.3480,20.0000,909.0000,2400.0000,0.0000,0.0000,0.0000,0.0100,0.0003,0.0000,0.2540,0.1090,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]
        jump      ["square",0.0000,0.4000,0.0000,0.0960,0.0000,0.1720,20.0000,245.0000,2400.0000,0.3500,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.5000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]
        coinland  ["square",0.0000,0.4000,0.0000,0.0520,0.3870,0.1160,20.0000,1050.0000,2400.0000,0.0000,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]
        bonkhead  ["sine",0.0000,0.4000,0.0000,0.0000,0.5070,0.1400,20.0000,1029.0000,2400.0000,-0.7340,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.3780,0.0960,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]
        land      ["sine",0.0000,0.4000,0.0000,0.1960,0.0000,0.1740,20.0000,1012.0000,2400.0000,-0.7340,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.3780,0.0960,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]
        kicked    ["noise",0.0000,1.0000,0.0000,0.0400,0.0000,0.2320,20.0000,822.0000,2400.0000,-0.6960,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0270,0.0000]
        dropkick  ["sine",0.0000,1.0000,0.0000,0.0880,0.0000,0.3680,20.0000,653.0000,2400.0000,0.2360,0.0000,0.1390,47.1842,0.9623,-0.4280,0.0000,0.0000,0.4725,0.0000,0.0000,-0.0060,-0.0260,1.0000,0.0000,0.0000,0.0000,0.0000]
        bounce    ["noise",0.0000,1.0000,0.0000,0.0220,0.0000,0.1480,20.0000,309.0000,2400.0000,-0.3300,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]

2.  Use sounds files

    Put sound files (`.mp3` or `.wav`) somewhere below `Assets/WebPlayerTemplates/HappyFunTimes`
    They have to be in there because they must be served to the phone.

    **Note**: it's a good idea to keep them as small as possible because each time a player connects to
    the game the phone will have to download all the sounds.

## Playing Sounds

To use the sounds:

1.  On some global gameobject (like LevelManager in all the samples)
    add an `HFTGlobalSoundHelper` script component.

    This component scans for and loads the sounds from all folders below `Assets/WebPlayerTemplates/HappyFunTimes`
    looking for `.mp3` and `.wav` and `.jsfx.txt` files

2.  On the prefab that gets spawned for your players, the same prefab you put
    an `HFTInput` or `HFTGamepad` script component add the `HFTSoundPlayer` script
    component.

3.  In your `Awake` or `Start` look up the `HFTSoundPlayer` component

        private HFTSoundPlayer m_soundPlayer;

        void Awake()
        {
             m_soundPlayer = GetComponent<HFTSoundPlayer>();
        }

4.  To play a sound call `m_soundPlayer.PlaySound` with the name of the sound (no extension).
    In other words if you have `sounds/explosion.mp3` then you can trigger that sound on
    the user's phone with

        m_soundPlayer.PlaySound("explosion");

    Or if you named a JSFX sound like

        bounce    ["noise",0.0000,1.0000,0.0000,0.0220,0.0000,0.1480,20.0000,309.0000,2400.0000,-0.3300,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000]

    Then

        m_soundPlayer.PlaySound("bounce");

That's it!

## Names must be Unique!

Note that sounds are referenced by name only so you can't have 2 sounds with the same filename
even if they are in different folders. Simiarly they can't clash with the names in the sounds.jsfx.txt
file. So for example if you look at the example sounds.jsfx.txt file above you'll see there's a sound
called `coin`. That would conflict with a sound file called `coin.mp3`.

If you don't like those limits see `HFTGlobalSoundHelper.cs`, `HFTSoundPlayer.cs`, and `HTFSounds.cs` as well
as the corresponding support in `Assets/WebPlayerTemplates/HappyFunTimes/controllers/gamepad/scripts/controller.js`
and edit or better copy them and add your own features.
