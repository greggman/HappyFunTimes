define([
    './hft/scripts/commonui',
    './hft/scripts/misc/dialog',
    './hft/scripts/misc/dpad',
    './hft/scripts/misc/input',
    './hft/scripts/misc/misc',
    './hft/scripts/misc/mobilehacks',
    './hft/scripts/misc/strings',
    './hft/scripts/misc/touch',
  ], function (
    commonUI,
    dialog,
    dpad,
    input,
    misc,
    mobileHacks,
    strings,
    touch) {
    window.sampleUI = window.sampleUI || {};
    var api = window.sampleUI;
    api.commonUI = commonUI;
    api.dialog = dialog;
    api.dpad = dpad;
    api.input = input;
    api.misc = misc;
    api.mobileHacks = mobileHacks;
    api.strings = strings;
    api.touch = touch;
});

