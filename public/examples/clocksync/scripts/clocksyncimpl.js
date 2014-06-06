/*
 * Copyright 2014, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

define([
    '../../../scripts/syncedclock',
    '../../../scripts/misc/logger',
    '../../scripts/audio',
  ],
  function(SyncedClock, Logger, AudioManager) {

    return function() {
      var g_name = "";
      var g_canvas;
      var g_clientServer;
      var g_audioManager;
      var g_services = {};

      function $(id) {
        return document.getElementById(id);
      }

      var sounds = {
        tick: {
          filename: "assets/tick.ogg",
          samples: 1,
        },
      };

      var clock = SyncedClock.createClock(true);
      g_services.clock = clock;
      var logger = new Logger.HTMLLogger($("log"));
      g_services.logger = logger;

      //console.log = logger.log.bind(logger);
      //console.error = logger.error.bind(logger);

      g_audioManager = new AudioManager(sounds);

      var clockElement = $("time");
      var clockNode = document.createTextNode("");
      clockElement.appendChild(clockNode);

      var element = $("top");
      var canvas = $("mark");
      var ctx = canvas.getContext("2d");

      var lastState = 0;
      var render = function() {
        var time = clock.getTime();
        var eighthSecondTicks = Math.floor(time * 8);
        var newState = (eighthSecondTicks % 8) == 0;


        ctx.fillStyle = newState ? '#CCC' : '#AAA';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = "#FFF";
        ctx.save();
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.beginPath();
        ctx.arc(0, 0, ctx.canvas.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = newState ? '#FF0' : '#F00';
        ctx.rotate(time * Math.PI * 2 % (Math.PI * 2));
        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(-10, 0);
        ctx.lineTo(0, -ctx.canvas.height / 2);
        ctx.lineTo(10, 0);
        ctx.lineTo(0, 10);
        ctx.fill();
        ctx.restore();


        if (newState != lastState) {
          lastState = newState;
          if (newState) {
            g_audioManager.playSound('tick');
          }
        }

        var seconds = (Math.floor(time) % 60).toString();
        clockNode.nodeValue = "0".substring(seconds.length - 1) + seconds;

        requestAnimationFrame(render);
      };
      render();
    };
  }
);


