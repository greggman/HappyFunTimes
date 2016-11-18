Title: HappyFunTimes Development
Description: Working on HappyFunTimes itself (not happyfuntimes games)

This is a few tips for working on HappyFunTimes itself. If you're making a game
there's probably no reason for you to read this document. This is mostly
notes to myself and whoever else is working on HappyFunTimes itself.

## Environment Variables

There are a bunch of ENV vars you can set for testing.

### HFT_PUBLISH_USER

Can be used to set a user:pass for calling `hft publish` vs command line arguments.

### HFT_SETTINGS

Used to set any setting in `hft.hanson`.

It's a JSON string which will be applied to the settings in `hft.hanson`. For example
when testing the rendevous server locally.

    HFT_SETTINGS={settings:{rendezvousUrl:\"http://localhost:1337/api/inform2\"}} hft start

Also see [`HFT_RENDEZVOUS_IP`](#hft-rendezvous-ip).

### HFT_RENDEZVOUS_IP

Used to specify the IP address to report to the rendevous server. Normally the IP address
is derived from the network connection. The rendezvous server generally sees your NAT router's
ip. But, when testing locally, with happyfuntimes and the rendezvous server running on the same
machine it will just see `127.0.0.1` as the ip. So, it will record that some system at `127.0.0.1`
is hosting games at say `192.168.0.10`. You then try to connect by going to `192.168.0.10:1337` from
another machine on your local net who's IP address is `192.168.0.11`. Because you're not both
behind NAT the rendezvous server sees different IP addresses for you and your test machine.

That's the long way of saying you need to set `HFT_RENDEZVOUS_IP` to the same IP address
as your test machine / phone.

    HFT_RENDEZVOUS_IP=192.168.0.11 HFT_SETTINGS={settings:{rendezvousUrl:\"http://localhost:1337/api/inform2\"}} hft start

## Controller Startup

I'm sure there's a much more organized way to do this but.... To get cordova/phonegap support I hacked
a bunch of stuff. Basically as of version 1.10.0 happyfuntimes emits script tags for your app
with `type="hft-late"` so that they don't execute. It then tries to load the cordva/phonegap bridge.
After success or failure it then finds all the scripts with `type="hft-late"` and creates
new scripts with `type="text/javascript"`.

I did all of that because I wanted the cordova stuff to be up and running and ready to use before
any user scripts execute what-so-ever. Without that user scripts would have to wait on some kind
of `hft-ready` event or register a callback or something. While I'd be fine with that my experience
with students using HFT is the less "must do it this ways" the better.
