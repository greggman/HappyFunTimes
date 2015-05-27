Title: Museums & Installations
Description: Setting up for a Museum or Installation - Instant Connect Mode

Asking players to connect to a local network and then type in URL like
`happyfuntimes.net` works just fine but HappyFunTimes supports an even
simpiler style for things like museums, events, and art installations.

In this mode players connect to a dedicated router for the game. On iOS
The moment they connect to to the WiFi they are instantly directed to the
game, nothing to type. On Android they can type any url, for example,
`h.com` and they'll get connected to the game.

No internet connection is needed in this mode.

Setup for most routers
----------------------

First, get a router. You probably have an old one sitting around or if you want to be portable I
recommend the [TP-Link TL-WR702N](http://google.com/#q=TP-Link+TL-WR702N) though
it will only handle 13-14 players and it's under $20.

Go to your router's admin page and find the DHCP settings. Somewhere there
should be a place that lets you assign a specfiic IP address to a specific MAC
address. On TL-WR702N that's under Advanced Settings->DHCP->Address Reservations

I looked up the MAC address for my machine (the machine running HappyFunTimes) and assigned it
directly to `192.168.2.9`.

<div style="text-align: center;"><a href="images/router-address-reservation.png"><img width="342" height="184" src="images/router-address-reservation.png"></a></div>

I then went to the main DHCP settings at Advanced Settings->DHCP->DHCP Settings and
configured it to give out IP addresses from to `192.168.2.10` to `192.168.2.250`.
Finally I set the DNS there to the same address I used for the HappyFunTimes machine.
(`192.168.2.9`)

<div style="text-align: center;"><a href="images/router-dhcp-settings.png"><img width="343" height="224" src="images/router-dhcp-settings.png"></a></div>

With that done I picked a nice name for my WiFi's SSID under
Basic Settings->Wireless->Wireless Settings

<div style="text-align: center;"><a href="images/router-wifi-settings.png"><img width="390" height="237" src="images/router-wifi-settings.png"></a></div>

and in my case I decided to turn off security so no password is needed.
<div style="text-align: center;"><a href="images/router-wifi-security.png"><img width="375" height="221" src="images/router-wifi-security.png"></a></div>

This may or may not be a good idea since lots of people's devices are set to automatically
connect to open routers. If you're in a relatively isolated location and everyone is going to
play it's probably good. If you're in a more public location you probably want to add a
password just so people not playing don't get accidentally connected.

With that done, reboot the router, connect your machine.
[Now follow the instructions above](#starting-happyfuntimes-in-installation-mode)

Using your router for normal internet access
--------------------------------------------

Once you've made these changes on your router the only things you should need to
to use it as a normal router again are

1.  Clear the DNS address in your DHCP settings

    You set the DNS address to point to the machine being the relayserver. Either
    clear that setting or set it to a real DNS server like Google's Public DNS servers
    `8.8.8.8` and `8.8.4.4`

2.  Turn security back on

    If you make your WiFi open/unsecured you probably want to turn that back on

Starting HappyFunTimes in installation mode
-------------------------------------------

Open a node command prompt or terminal and on OSX type

    sudo hft start --dns

On Windows just

    hft start --dns

You need `sudo` on OSX because port 80 is normally restricted to admin users only.

Go to `http://localhost/games.html` and pick a game.

Now try connecting a smartphone to your router. If it's an iOS device it *should*
automatcally come up with a page that says "Start". If it's an Android device
open the browser and go to `hft.com` or any `http://` url.

Setting Up an Airport Extreme
-----------------------------

Unlike every other router in existence the Airport Extreme requires custom
software to configure it. If you're on Windows or Linux you'll need to
[download it here](https://support.apple.com/downloads/airport).

Connect it by ethernet cable to your computer.
Use one of the top 3 sockets on the airport extreme to connect
(not to be confused with the bottom socket which is for incoming internet).

Start the Airport Utility on your computer and select the airport extreme
from the image then select edit.

<div style="text-align: center;"><img src="images/airport-extreme.png" width="50%" height="50%" /></div>

Under the Network section click the `+` button to add your machine
to the DHCP reservation list.

<div style="text-align: center;"><img src="images/airport-extreme-reserve-ip.png" width="50% height="50%" /></div>

Then add your machine. You'll need to know your machine's mac address.

On Mac you can look that in the the menus pick
`Apple Menu->System Preferences` then click on `Network`.
Select the Thunderbolt connection

<div style="text-align: center;"><img src="images/osx-network-thunderbolt.png" width="50% height="50%" /></div>

and then clicking the hardware section

<div style="text-align: center;"><img src="images/osx-macaddress.png" width="50% height="50%" /></div>

On Windows you can look up your Mac address by opening a command prompt
and typing `getmac`

Type that number into the aiport extreme settings and "MAC address" (yes the numbers in these
picutres don't match. For you they should match).
In description put whatever you want to remember
that's your machine. Select "Mac Address" for "Reserve Address By".

<div style="text-align: center;"><img src="images/airport-extreme-reserve-ip-details.png" width="50% height="50%" /></div>

Note the number under IPv4 Address. It probably defaults to the correct
number for your setup. Note the number.

In the Internet section of the Airport Utility put that number in the
2 spaces for DNS Servers

<div style="text-align: center;"><img src="images/airport-extreme-dns.png" width="50% height="50%" /></div>

Note: with these numbers set in DNS server your Airport Extreme will no longer work for internet
access. You can only use it for HappyFunTimes installation mode. To use it for internet run
the Airport Utility again and clear those 2 numbers.

After that you may want to setup the WiFi security. I would suggest adding
a simple password because otherwise people's phones walking by your installation will
connect to it even if they don't plan on interacting with it.

Finally click "update" at the bottom to update your Airport Extreme.

[Now follow the instructions above](#starting-happyfuntimes-in-installation-mode)

Maximum Number of Players
=========================

Apparently the TP-Link TL-WR702N only supports around 15 wireless devices at a time which
means the main computer running the game and 14 players.

[Netgear claims their dual band routers can support 64 devices](http://kb.netgear.com/app/answers/detail/a_id/24043/~/how-many-clients-can-you-connect-wirelessly-to-a-netgear-router%3F).
Unfortunatly netgear routers don't allow you to change the DNS server their DHCP server reports
so avoid them. They always report themsevles and/or they always look on the WAN for resolution
instead of the LAN. You can install a different firmware like DD-WRT if you're adventurous but
otherwise choose something else.

[Apple claims 50 devices with the Airport Extreme](http://www.apple.com/airport-extreme/specs/)
though it's ambigous if that means 50 wifi devices or something else. I got one and so far it's
been pretty great. One time I had 92 people playing Bombbomb. I'm not sure if that was a bug
or real since the specs say 50 people. Maybe it's 50 for 5ghz and 50 for 2.5ghz?

[Buffalo claims between 10 and 50 depending on the device](http://faq.buffalo.jp/app/answers/detail/a_id/326).

This is all pretty frustrating. It would be nice to know the least expensive way to allow lots
of players. If you're a network guru please contact me or submit a pull request with updates
on what's best. Especially given the specfic needs of HappyFunTimes. We're not streaming video
or dowloading torrents so for example, rather than buying the top end routers consumer routers
maybe it's better to by 2 to 4 cheap home routers and set all but one of them into AP mode (Access Point)?
Or should we go to business routers? Unfortunately at this time I have no idea.

If you try this setup with a different router please post your results. Add to this doc or file an issue
or something so that others can learn how to configure their routers.


