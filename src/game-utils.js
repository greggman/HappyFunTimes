define([
    './hft-utils/dist/audio',
    './hft-utils/dist/imageloader',
    './hft-utils/dist/imageutils',
    './hft/scripts/gamesupport',
  ], function (
    AudioManager,
    imageLoader,
    imageUtils,
    gameSupport
  ) {
  window.AudioManager = AudioManager;
  window.imageLoader = imageLoader;
  window.imageUtils = imageUtils;
  window.gameSupport = gameSupport;
});

