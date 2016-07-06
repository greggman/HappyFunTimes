define([
    './hft/scripts/gameclient',
    './hft/scripts/gameserver',
    './hft/scripts/syncedclock',
  ], function (
    GameClient,
    GameServer,
    SyncedClock) {
    window.hft = window.hft || {};
    var api = window.hft;
    api.GameClient = GameClient;
    api.GameServer = GameServer;
    api.SyncedClock = SyncedClock;
});
