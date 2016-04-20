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

var strings = require('../lib/strings');

var g = {
  srcLangs: {
    "en": {
      connect: 'Connect to %(wifiName)s Wifi%(password)s, on iOS just wait, on Android use Chrome and go to "h.com"',
      password: " password: %(wifiPass)s",
    },
    "ja": {
      connect: "「%(wifiName)s」の無線LANを接続%(password)s, iPhoneならそのまま待って下さい, Androidなら「Chrome」を起動して「h.com」へ行って下さい",
      password: " パスワード：「%(wifiPass)s」",
    },
  },
  langs: {},
  msgs: {},
};

function getLang(langId) {
  var lang = g.langs[langId.toLowerCase()];
  if (!lang) {
    lang = g.langs[langId.toLowerCase().substr(0, 2)];
  }
  return lang;
}

function getLangsMessage(langs, msgId, concatStr) {
  concatStr = concatStr || " ";
  var msgs = [];
  var foundIds = {};
  langs.forEach(function(langId) {
    var lang = getLang(langId);
    if (lang && !foundIds[lang.id]) {
      foundIds[lang.id] = true;
      msgs.push(lang[msgId]);
    }
  });
  return msgs.join(concatStr);
}

/**
 * @typedef {Object} Lang~Options
 * @parameter {string} wifiName the name of the wifi eg. "HappyFunTimes"
 * @parameter {string} [wifiPass] the password to access the wifi.
 * @parameter {string} [langs] comma separated language ids. eg. "en,ja"
 */

/**
 * inits the languages
 *
 * @param {Lang~Options} options
 */
function init(options) {
  options = options || {};
  Object.keys(g.srcLangs).forEach(function(key) {
    var srcLang = g.srcLangs[key];
    var dstLang = {};

    dstLang.id = key;

    var subs = {
      password: "",
      wifiPass: "",
    };

    if (options.wifiPass) {
      subs.password = strings.replaceParams(srcLang.password, options);
    }

    Object.keys(srcLang).forEach(function(key) {
        var src = process.env["HFT_LANG_" + key.toUpperCase()] || srcLang[key];
        dstLang[key] = strings.replaceParams(src, [subs, options]);
    });

    g.langs[key] = dstLang;
  });


  var langIds = (options.langs || 'en').split(",").map(function(id) {
    return id.toLowerCase();
  });
  g.msgs.connect = getLangsMessage(langIds, "connect");
}

function getString(msgId) {
  return g.msgs[msgId];
}

exports.init = init;
exports.getLang = getLang;
exports.getString = getString;

