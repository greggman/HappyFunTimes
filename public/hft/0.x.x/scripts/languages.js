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
    './misc/strings',
    './hft-settings',
  ], function(
    strings,
    hftSettings
  ) {
  var langs = {
    "en": {
      connect: 'Connect to %(wifiName)s Wifi%(password)s, on iOS just wait, on Android use Chrome and go to "h.com"',
      password: " password: %(wifiPass)s",
    },
    "ja": {
      connect: "「%(wifiName)s」の無線LANを接続%(password)s, iPhoneならそのまま待って下さい, Androidなら「Chrome」を起動して「h.com」へ行って下さい",
      password: " パスワード：「%(wifiPass)s」",
    },
  };

  Object.keys(langs).forEach(function(key) {
      var lang = langs[key];
      lang.id = key;

      var subs = {
        password: "",
        wifiPass: "",
      };

      if (hftSettings.wifiPass) {
        subs.password = strings.replaceParams(lang.password, hftSettings);
      }

      Object.keys(lang).forEach(function(key) {
          lang[key] = strings.replaceParams(lang[key], [subs, hftSettings]);
      });

  });

  function getLang(langId) {
    var lang = langs[langId.toLowerCase()];
    if (!lang) {
      lang = langs[langId.toLowerCase().substr(0, 2)];
    }
    return lang;
  }

  function getDefaultLang() {
    var lang = getLang(window.navigator.language);
    if (!lang) {
      lang = getLang("en");
    }
    return lang;
  }

  function getLangs(langIds) {
    var langs = [];
    if (langIds) {
      if (typeof langIds === 'string') {
        langIds = langIds.split(",");
      }
      var foundIds = {};
      langIds.forEach(function(id) {
        var lang = getLang(id);
        if (lang && !foundIds[lang.id]) {
          foundIds[lang.id] = lang.id;
          langs.push(lang);
        }
      });
    }
    return langs;
  }

  return {
    getDefaultLang: getDefaultLang,
    getLang: getLang,
    getLangs: getLangs,
  }
});

