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
requirejs(
  [ 'hft/commonui',
    'hft/gameclient',
    'hft/gameserver',
    'hft/gamesupport',
    'hft/io',
    'hft/localnetplayer',
    'hft/misc/cookies',
    'hft/misc/cssparse',
    'hft/misc/dpad',
    'hft/misc/gamebutton',
    'hft/misc/grid',
    'hft/misc/input',
    'hft/misc/misc',
    'hft/misc/mobilehacks',
    'hft/misc/random',
    'hft/misc/storage',
    'hft/misc/strings',
    'hft/misc/ticker',
    'hft/misc/timeout',
    'hft/misc/touch',
    'hft/syncedclock',
  ], function(
    CommonUI,
    GameClient,
    GameServer,
    GameSupport,
    IO,
    LocalNetPlayer,
    Cookies,
    CSSParse,
    DPad,
    GameButton,
    Grid,
    Input,
    Misc,
    MobileHacks,
    Random,
    Storage,
    Strings,
    Ticker,
    Timeout,
    Touch,
    SyncedClock) {
  window.HFT = {
    CommonUI:       CommonUI,
    GameClient:     GameClient,
    GameServer:     GameServer,
    GameSupport:    GameSupport,
    IO:             IO,
    LocalNetPlayer: LocalNetPlayer,
    Cookies:        Cookies,
    CSSParse:       CSSParse,
    DPad:           DPad,
    GameButton:     GameButton,
    Grid:           Grid,
    Input:          Input,
    Misc:           Misc,
    MobileHacks:    MobileHacks,
    Random:         Random,
    Storage:        Storage,
    Strings:        Strings,
    Ticker:         Ticker,
    Timeout:        Timeout,
    Touch:          Touch,
    SyncedClock:    SyncedClock,
  };
}, undefined, true);

