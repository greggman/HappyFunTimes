Title: HappyFunTimes Development
Description: Working on HappyFunTimes itself (not happyfuntimes games)

This is a few tips for working on HappyFunTimes itself. If you're making a game
there's probably no reason for you to read this document. This is mostly
notes to myself and whoever else is working on HappyFunTimes itself.

### HFT_RENDEZVOUS_URL

Setting `HFT_RENDEZVOUS_URL` to a URL lets you specific a custom rendezvous server.
The default url is `http://happyfuntimes.net/api/inform2`. You'd set this if you
want to run your own so that you can tell users go to for example `mygame.com` instead
of `happyfuntimes.net`.

[The source for the rendezvous server is here](https://github.com/greggman/happyfuntimes.net).

### HFT_RENDEZVOUS_IP

This is for dev/debugging only

`HFT_RENDEZVOUS_IP` is Used to specify the IP address to report to the rendevous server. Normally the IP address
is derived from the network connection. The rendezvous server generally sees your NAT router's
ip. But, when testing locally, with happyfuntimes and the rendezvous server running on the same
machine it will just see `127.0.0.1` as the ip. So, it will record that some system at `127.0.0.1`
is hosting games at say `192.168.0.10`. You then try to connect by going to `192.168.0.10:1337` from
another machine on your local net who's IP address is `192.168.0.11`. Because you're not both
behind NAT the rendezvous server sees different IP addresses for you and your test machine.

That's the long way of saying you need to set `HFT_RENDEZVOUS_IP` to the same IP address
as your test machine / phone if you want to test a local rendezvous server.

    HFT_RENDEZVOUS_IP=192.168.0.11 HFT_RENDEZVOUS_URL=http://localhost:1337/api/inform2 npm start


