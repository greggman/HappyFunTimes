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

define(function() {
  /**
   * Shell class for offline use.
   *
   * @constructor
   *
   * You can use this class as a substitute for NetPlayer when
   * offline. It just provides no-ops for NetPlayer functions.
   *
   * Example:
   *   if (offline) {
   *     // We're testing locally so just manually create //
   *     players.
   *
   *     var player1 = new MyPlayer(new LocalNetPlayer());
   *     var player2 = new MyPlayer(new LocalNetPlayer());
   *     addPlayer(player1);
   *     addPlayer(player2);
   *
   *   } else {
   *     // We're online so create players as they connect.
   *     var server = new GameServer(...);
   *     server.addEventListener(
   *         'playerconnect',
   *         function(netPlayer) {
   *           addPlayer(new MyPlayer(netPlayer));
   *         });
   */
  var LocalNetPlayer = (function() {
    var _count = 0;
    return function() {
      this.id = ++_count;
    }
  }());

  LocalNetPlayer.prototype.addEventListener = function() {
  };

  LocalNetPlayer.prototype.removeEventListener = function() {
  };

  LocalNetPlayer.prototype.sendCmd = function() {
  };

  return LocalNetPlayer;
});


