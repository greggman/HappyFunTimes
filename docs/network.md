Setting up for a Museum or Installation
===========================================

Asking players to connect to a local network and then type in URL like
`happyfuntimes.net` works just fine but HappyFunTimes supports an even
simpiler style for things like museums, events, and art installations.

In this mode players connect to a dedicated router for the game. On iOS
The moment they connect to to the WiFi they are instantly directed to the
game, nothing to type. On Android they can type any url, for example,
`h.com` and they'll get connected to the game.

Setup
-----

First, get a router. You probably have an old one sitting around or if you want to be portable I
recommend the [TP-Link TL-WR702N](http://google.com/#q=TP-Link+TL-WR702N) though
it will only handle 13-14 players.

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

Install some software. I could give you the cryptic paths so you don't have to do this but
this is easier IMO.

1.  Install HappyFunTimes http://superhappyfuntimes.net/install
2.  Install node.js http://nodejs.org/download
3.  Open a node command prompt/terminal and type `npm install -g hft-cli`

With that done, reboot the router, connect your machine, then open a node command prompt or terminal
and on OSX type

    sudo hft start --dns

On Windows just

    hft start --dns

You need `sudo` on OSX because port 80 is normally restricted to admin users only.

Go to `http://localhost/games.html` and pick a game.

Now try connecting a smartphone to your router. If it's an iOS device it *should*
automatcally come up with a page that says "Start". If it's an Android device
open the browser and go to `hft.com` or any `http://` url.

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

Maximum Number of Players
=========================

Apparently the TP-Link TL-WR702N only supports around 15 wireless devices at a time which
means the main computer running the game and 14 players.

[Netgear claims their dual band routers can support 64 devices](http://kb.netgear.com/app/answers/detail/a_id/24043/~/how-many-clients-can-you-connect-wirelessly-to-a-netgear-router%3F).
Unfortunatly netgear routers don't allow you to change the DNS server their DHCP server reports
so avoid them. They always report themsevles and/or they always look on the WAN for resolution
instead of the LAN. If you're lucky you can install a different firmware but otherwise avoid them.

[Apple claims 50 devices with the Airport Extreme](http://www.apple.com/airport-extreme/specs/)
though it's ambigous if that means 50 wifi devices or something else.

[Buffalo claims between 10 and 50 depending on the device](http://faq.buffalo.jp/app/answers/detail/a_id/326).

This is all pretty frustrating. It would be nice to know the least expensive way to allow lots
of players. If you're a network guru please contact me or submit a pull request with updates
on what's best. Especially given the specfic needs of HappyFunTimes. We're not streaming video
or dowloading torrents so for example, rather than buying the top end routers consumer routers
maybe it's better to by 2 to 4 cheap home routers and set all but one of them into AP mode (Access Point)?
Or should we go to business routers? Unfortunately at this time I have no idea.

