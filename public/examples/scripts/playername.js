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

// Functions for dealing with the player's name. The name events are arguably
// not part of the HappyFunTimes library but they are used in most of the samples
// so I put them here.
define(['./cookies'], function(Cookies) {

  var playerRE = /^Player\d+$/i;

  var PlayerNameHandler = function(client, element) {
    var name = Cookies.readCookie("name") || "";

    var setName = function() {
      element.value = name;
    }.bind(this);

    var sendName = function() {
      client.sendCmd('setName', {
          name: name,
      });
    }.bind(this);

    var sendBusy = function(busy) {
      client.sendCmd('busy', {
          busy: busy,
      });
    }.bind(this);

    var startEnteringName = function() {
      // Allow the game to help the player by, for example, removing her character
      // while she's entering her name. Unfortunately that could be used to cheat
      // as in just before she's about to be hit she clicks the name. It's up the individual
      // game to decide if it want's to pay attention to the 'busy' event.
      sendBusy(true);
    }.bind(this);

    var finishEnteringName = function() {
      name = element.value.replace(/[<>]/g, '');
      // Only set the cookie if the name isn't "Player\d+"
      if (!playerRE.test(name)) {
        Cookies.createCookie("name", name, 90);
      }
      sendName();
      sendBusy(false);
    }.bind(this);

    // If the user's name is "" the game may send a name.
    client.addEventListener('setName', setName);

    element.addEventListener('click', startEnteringName, false);
    element.addEventListener('change', finishEnteringName, false);
    element.addEventListener('blue', startEnteringName, false);
    setName();
    sendName();
  };

  return PlayerNameHandler;
});

