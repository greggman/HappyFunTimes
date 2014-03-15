"use strict";

define(function() {

  // To play a sound, simply call audio.playSound(id), where id is
  // one of the keys of the g_sound_files array, e.g. "damage".
  var AudioManager = function(sounds, log) {
    var g_context;
    var g_audioMgr;
    var g_soundBank = {};
    var g_canPlay = false;
    var g_canPlayOgg;
    var g_canPlayMp3;

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

    // on iOS and possibly other devices you can't play any
    // sounds in the browser unless you first play a sound
    // in response to a user gesture. So, make something
    // to respond to a user gesture.
    var setupGesture = function() {
      var iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );
      var needUserGesture = iOS;
      if (needUserGesture) {
        var count = 0;
        var div = document.createElement('div');
        div.style.position = "absolute";
        div.style.left = "0px";
        div.style.top = "0px";
        div.style.width = window.innerWidth + "px";
        div.style.height = window.innerHeight + "px";
        div.style.zIndex = 10000000;
        div.style.overflow = "none";
        div.style.backgroundColor = "rgba(128,128,255, 0.5)";
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        div.style.fontSize = "4em";
        div.style.color = "white";
        div.innerText = "Tap to Start";
        var that = this;
        div.addEventListener('click', function() {
          ++count;
          if (count == 2) {
            // just playing any sound does not seem to work.
            var source = g_context.createOscillator();
            source.frequency.value = 440;
            source.connect(g_context.destination);
            source.start(0);
            setTimeout(function() {
              source.disconnect();
            }, 100);
            div.parentNode.removeChild(div);
          }
        });
        document.body.appendChild(div);
      }
    };

    function init(sounds) {
      var a = new Audio()
      g_canPlayOgg = a.canPlayType("audio/ogg");
      g_canPlayMp3 = a.canPlayType("audio/mp3");
      g_canPlay = g_canPlayOgg || g_canPlayMp3;
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

      var changeExt = function(filename, ext) {
        return filename.substring(0, filename.length - 3) + ext;
      };

      for (var sound in sounds) {
        var data = sounds[sound];
        var ext = data.filename.substring(data.filename.length - 3);
        if (ext == 'ogg' && !g_canPlayOgg) {
          data.filename = changeExt(data.filename, "mp3");
        } else if (ext == 'mp3' && !g_canPlayMp3) {
          data.filename = changeExt(data.filename, "ogg");
        }
        g_soundBank[sound] = new create(sound, data.filename, data.samples);
      }

      if (webAudioAPI) {
        setupGesture();
      }
    };
    init(sounds);
  };

  return AudioManager;
});
