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


exports.options = [
  { option: 'port', alias: 'p', type: 'Int',     description: 'port. Default 18679'},
  { option: 'dns',              type: 'Boolean', description: 'enable dns server'},
  { option: 'address',          type: 'String',  description: 'ip address for dns and controller url conversion'},
  { option: 'app-mode',         type: 'Boolean', description: 'run as an app'},
  { option: 'show',             type: 'String',  description: 'html file to launch, default "games"'},
  { option: 'system-name',      type: 'String',  description: 'name used if multiple happyFunTimes servers are running on the same network. Default = computer name'},
  { option: 'ask-name',         type: 'Boolean', description: 'ask for name on start, use --no-ask-name to set to false', default: "true"},
  { option: 'menu',             type: 'Boolean', description: 'show menu icon on controller, use --no-menu to turn off', default: "true"},
  { option: 'minify',           type: 'Boolean', description: 'minify -minify.js files', default: false},
  { option: 'kiosk',            type: 'Boolean', description: 'skip the index', default: false},
];
