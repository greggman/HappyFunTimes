define([
    './hft/scripts/gameclient',
    './hft/scripts/gameserver',
    './hft/scripts/localnetplayer',
    './hft/scripts/syncedclock',
  ], function (
    GameClient,
    GameServer,
    LocalNetPlayer,
    SyncedClock) {
    return {
      GameClient: GameClient,
      GameServer: GameServer,
      LocalNetPlayer: LocalNetPlayer,
      SyncedClock: SyncedClock,
    };
});
