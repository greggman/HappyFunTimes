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
  var RTCPeerConnection = /* window.RTCPeerConnection || */ window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  var ipAddressRE = /\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/;

  var getIpFromString = function(s) {
    var r = s.match(ipAddressRE);
    return r[0];
  };

  var configuration = { "iceServers": [] };
  var localIPs = [];
  var checked = false;
  var callbacks = [];
  var callbacksNeededToFinish = 2;

  var invalidAddresses = [
    "0.0.0.0",
    "127.0.0.1",
  ];

  var addIPAddress = function(address) {
    if (invalidAddresses.indexOf(address) >= 0) {
      return;
    }
    if (localIPs.indexOf(address) >= 0) {
      return;
    }
    localIPs.push(address);
  };

  var setChecked = function() {
    if (callbacksNeededToFinish <= 0) {
      checked = true;
      for (var ii = 0; ii < callbacks.length; ++ii) {
        callbacks[ii](localIPs);
      }
      callbacks = [];
    }
  };

  var decrementCallbacksNeededToFinish = function() {
    --callbacksNeededToFinish;
    setChecked();
  };

  if (RTCPeerConnection) {
    var pc = new RTCPeerConnection(configuration);
    if (window.mozRTCPeerConnection) {  // FF needs a channel/stream to proceed
      pc.createDataChannel('', {reliable:false});
    };
    pc.onicecandidate = function (evt) {
      if (evt.candidate) {
        grepSPD(evt.candidate.candidate);
      }

      if (pc.iceGatheringState == "complete") {
        decrementCallbacksNeededToFinish();
      }
    };

    pc.createOffer(function (offerDesc) {
        grepSPD(offerDesc.sdp);
        pc.setLocalDescription(offerDesc);
        decrementCallbacksNeededToFinish();
      }, function (e) {
        decrementCallbacksNeededToFinish();
      });
  } else {
   //browser doesn't support webrtc
   callbacksNeededToFinish = 0;
   setChecked();
  }

  var grepSPD = function(sdp) {
    var hosts = [];
    sdp.split('\r\n').forEach(function (line) {
      if (~line.indexOf("a=candidate")) {
        var parts = line.split(' ');
        var addr = parts[4];
        var type = parts[7];
        if (type === 'host') {
          addIPAddress(addr);
        }
      } else if (~line.indexOf("c=")) {
        var parts = line.split(' ');
        var addr = parts[2];
        addIPAddress(addr);
      }
    });
    setChecked();
  }

  /**
   * Gets the local ip addresses of this machine.
   *
   * @param {!function(!Array.<string>)} array of ipaddresses.
   *        Will be empty if not ipaddress can be determined.
   */
  var getLocalIpAddresses = function(callback) {
    if (checked) {
      setTimeout(function() {
        callback(localIPs);
      }, 0);
    } else {
      callbacks.push(callback);
    }
  };

  return {
    getLocalIpAddresses: getLocalIpAddresses,
  };
});

