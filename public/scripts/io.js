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

define({
  /**
   * sends a JSON 'POST' request, returns JSON repsonse
   * @param {string} url url to POST to.
   * @param {!object} jsonObject JavaScript object on which to call JSON.stringify.
   * @param {!function(object, error)} callback Function to call on success or failure. If successful error will be null
   * @param {!object} opt_options Optional options.
   *     {number} timeout: timeout in ms to abort request. Default = no-timeout
   */
  sendJSON: function(url, jsonObject, callback, opt_options) {
    opt_options = opt_options || { };
    var error = 'sendJSON failed to load url "' + url + '"';
    var request = new XMLHttpRequest();
    if (request.overrideMimeType) {
      request.overrideMimeType('text/plain');
    }
    request.timeout = opt_options.timeout || 0;
    request.open('POST', url, true);
    var js = JSON.stringify(jsonObject);
    var finish = function() {
      if (request.readyState == 4) {
        var json = undefined;
        // HTTP reports success with a 200 status. The file protocol reports
        // success with zero. HTTP does not use zero as a status code (they
        // start at 100).
        // https://developer.mozilla.org/En/Using_XMLHttpRequest
        var success = request.status == 200 || request.status == 0;
        if (success) {
          try {
            json = JSON.parse(request.responseText);
          } catch (e) {
            success = false;
          }
        }
        callback(json, success ? null : 'could not load: ' + url);
      }
    };
    try {
      request.onreadystatechange = finish;
      request.setRequestHeader("Content-type", "application/json");
      request.send(js);
    } catch (e) {
      setTimeout(function() { callback(null, 'could not load: ' + url) }, 0);
    }
  },
});

