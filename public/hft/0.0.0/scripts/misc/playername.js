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
define(['./cookies'], function(Cookie) {

  var $ = function(id) {
    return document.getElementById(id);
  };

  var PlayerNameHandler = function(client, element) {
    var nameCookie = new Cookie("name");
    var name = nameCookie.get() || "";

    // UGH! I guess this name stuff should move to CommonUI. At one point
    // it seemed separte
    var nameentry = $("hft-nameentry");
    var content = $("hft-content");
    var contentOriginalDisplay = content.style.display;

    var setName = function() {
      element.value = name;
    }.bind(this);

    var handleSetNameMsg = function(msg) {
      name = msg.name;
      setName();
    };

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

    var finishEnteringName = function(e) {
      // Unfortunately hiding the controls screwed up iOS Safari. After editing
      // the name the page would be scrolled down a certain number of pixels
      // like a 2/3rd of the page worth. No idea why. So again I needed
      // to do some hacky fix like scroll back to the top.
      content.style.display = contentOriginalDisplay;
      nameentry.style.display = "none";
      window.scroll(0,1);
      window.scroll(0,0);
      e.preventDefault();
      element.blur();
      var newName = element.value.replace(/[<>]/g, '');
      if (newName.length > 16) {
        newName = newName.substring(0, 16);
      }
      if (newName.length == 0) {
        element.value = name;
      } else if (newName != name) {
        name = newName;
        nameCookie.set(name, 700);
        sendName();
      }
      sendBusy(false);
    }.bind(this);

    this.startNameEntry = function() {
      // Chrome on Android seems to really mess up here. Or rather my CSS-fu sucks
      // so where as on iOS when you edit your name it just works, on Chrome
      // the controls fly up over the input=text area. This was the hacky
      // solution. Just hide the controls while entering the name. (see below)
      nameentry.style.display = "block";
      content.style.display = "none";
      element.focus();
    }.bind(this);

    // If the user's name is "" the game may send a name.
    client.addEventListener('setName', handleSetNameMsg);

    element.addEventListener('click', startEnteringName, false);
    element.addEventListener('change', finishEnteringName, false);
    element.addEventListener('blur', finishEnteringName, false);
    element.addEventListener('focus', startEnteringName, false);

    if (element.form) {
      element.form.addEventListener('submit', finishEnteringName, false);
    }

    setName();
    sendName();
  };

  return PlayerNameHandler;
});

