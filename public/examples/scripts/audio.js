"use strict";

define(function() {

  // To play a sound, simply call audio.playSound(id), where id is
  // one of the keys of the g_sound_files array, e.g. "damage".
  var AudioManager = function(sounds) {
    var g_context;
    var g_audioMgr;
    var g_soundBank = {};
    var g_canPlay = false;

    function WebAudioSound(name, filename, samples) {
      this.name = name;
      var that = this;
      var req = new XMLHttpRequest();
      req.open("GET", filename, true);
      req.responseType = "arraybuffer";
      req.onload = function() {
        g_context.decodeAudioData(req.response, function onSuccess(decodedBuffer) {
          // Decoding was successful, do something useful with the audio buffer
          that.buffer = decodedBuffer;
        }, function onFailure() {
           console.error("failed to decoding audio buffer: " + filename);
        });
      }
      req.addEventListener("error", function(e) {
        console.error("failed to load:", filename, " : ", e.target.status);
      }, false);
      req.send();
    }

    WebAudioSound.prototype.play = function() {
      if (!this.buffer) {
        console.log(this.name, " not loaded");
        return;
      }
      var src = g_context.createBufferSource();
      src.buffer = this.buffer;
      src.connect(g_context.destination);
      src.start(0);
    };

    function AudioTagSound(name, filename, samples) {
      this.waiting_on_load = samples;
      this.samples = samples;
      this.name = name;
      this.play_idx = 0;
      this.audio = {};
      for (var i = 0; i < samples; i++) {
        var audio = new Audio();
        var that = this;
        audio.addEventListener("canplaythrough", function() {
          that.waiting_on_load--;
        }, false);
        audio.src = filename;
        //audio.onerror = handleError(filename, audio);
        audio.load();
        this.audio[i] = audio;
      }
    };

    AudioTagSound.prototype.play = function() {
      if (this.waiting_on_load > 0) {
        console.log(this.name, " not loaded");
        return;
      }
      this.play_idx = (this.play_idx + 1) % this.samples;
      var a = this.audio[this.play_idx];
      // console.log(this.name, ":", this.play_idx, ":", a.src);
      var b = new Audio();
      b.src = a.src;
      b.addEventListener("canplaythrough", function() {
        b.play();
        }, false);
      b.load();
    };

      function handleError(filename, audio) {
          return function(e) {
            console.error("can't load ", filename);
            /*
            if (filename.substr(filename.length - 4) == ".ogg") {
              filename = filename.substr(0, filename.length - 4) + ".mp3";
              console.log("trying ", filename);
              audio.src = filename;
              audio.onerror = handleError(filename, audio);
              audio.load();
            } else if (filename.substr(filename.length - 4) == ".mp3") {
              filename = filename.substr(0, filename.length - 4) + ".wav";
              console.log("trying ", filename);
              audio.src = filename;
              audio.onerror = handleError(filename, audio);
              audio.load();
            }
            */
          }
      }

    this.playSound = function(name) {
      if (!g_canPlay)
        return;
      var sound = g_soundBank[name];
      if (!sound) {
        console.error("audio: '" + name + "' not known.");
        return;
      }
      sound.play();
    };

    function init(sounds) {
      var a = new Audio()
      g_canPlay = a.canPlayType("audio/ogg") || a.canPlayType("audio/mp3");
      if (!g_canPlay)
        return;

      var create;
      var webAudioAPI = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
      if (webAudioAPI) {
        console.log("Using Web Audio API");
        g_context = new webAudioAPI();
        create = WebAudioSound;
      } else {
        console.log("Using Audio Tag");
        create = AudioTagSound;
      }

      for (var sound in sounds) {
        var data = sounds[sound];
        g_soundBank[sound] = new create(sound, data.filename, data.samples);
      }
    };
    init(sounds);
  };

  return AudioManager;
});
