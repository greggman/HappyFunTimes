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

var main = function(Cookie, Misc, MobileHacks) {

  var $ = function(id) {
    return document.getElementById(id);
  };

  var nameContainer = $("namecontainer");
  var nameInput = $("hft-name");
  var okay = $("okay");
  var nameRE = /^player\d+$/i;
  var args = Misc.parseUrlQuery();
  var nameCookie = new Cookie("name");
  var name = nameCookie.get() || "";

  var gotoIndex = function() {
    gotoIndex = function() {};

    var newName = nameInput.value.replace(/[<>]/g, '');
    if (newName.length > 16) {
      newName = newName.substring(0, 16);
    }
    nameCookie.set(newName, 700);
    nameContainer.style.display = "block";

    if (args.fromHFTNet && newName != args.name) {
      var iframe = document.createElement("iframe");
      iframe.src = "http://happyfuntimes.net/save-name.html?name=" + encodeURIComponent(newName);
      document.body.appendChild(iframe);
    }

    // Give the iframe 1/2 a second to complete.
    setTimeout(function() {
      window.location.href = "/";
    }, 500);
  };

  var finishEnteringName = function(e) {
    e.preventDefault();
    gotoIndex();
    return false;
  };

  // If no cookie name. Use args
  if (name.length == 0 || nameRE.test(name)) {
    name = args.name || "";
  }

  nameInput.value = name;

  // If no name display
  if (name.length == 0 || nameRE.test(name) || args.show) {
    nameContainer.style.display = "block";
    nameInput.value = Math.random() > 0.5 ? "Jill" : "Jim";
    nameInput.focus();

    nameInput.addEventListener('change', finishEnteringName, false);
    nameInput.addEventListener('submit', finishEnteringName, false);
    if (nameInput.form) {
      nameInput.form.addEventListener('submit', finishEnteringName, false);
    }
    okay.addEventListener('click', finishEnteringName, false);

  } else {
    gotoIndex();
  }


};

// Start the main app logic.
requirejs(
  [ './scripts/misc/cookies',
    './scripts/misc/misc',
    './scripts/misc/mobilehacks',
    './scripts/IO',
  ],
  main
);



