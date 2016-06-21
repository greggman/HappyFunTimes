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

var events = require('events');

var emitter = new events.EventEmitter();

/**
 * @module
 */

var arraysEqual = function(a, b) {
  if ((!a && b) || (!b && a)) {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  var len = a.length;
  for (var ii = 0; ii < len; ++ii) {
    if (a[ii] !== b[ii]) {
      return false;
    }
  }
  return true;
};


/**
 * Gets the ip address of this machine.
 * @returns {String[]} array of ip addresses.
 */
var getIpAddresses = (function() {
  // Premature optimization. Don't read this more than once a second
  var cacheTime = 1 * 1000;  // 1 second
  var lastRead = Date.now();
  var addresses;
  var oldAddressesSorted;

  var os = require('os');

  var isIpv6WeCareAbout = (function() {
    var ignoredTopSegments = {
      "fe80": true,
      "ff00": true,
      "fd00": true,
      "fec0": true,
    };
    return function(address) {
      // honestly I don't really understand ipv6 and which address make no sense. It seems
      // like the top few bits might stay but

      // should probably check for 0 using ip6addr

      var topSegment = address.substr(0, 4).toLowerCase();
      return ignoredTopSegments[topSegment] === undefined;
    };
  }());

  return function() {
    var now = Date.now();
    if (!addresses || now - lastRead > cacheTime) {
      lastRead = now;
      var interfaces = os.networkInterfaces();
      addresses = [];
      for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
          var iface = interfaces[k][k2];
          if (!iface.internal) {
            if (iface.family === 'IPv4') {
              addresses.push(iface.address);
            } else if (iface.family === 'IPv6' && isIpv6WeCareAbout(iface.address)) {
              addresses.push("[" + iface.address + "]");
            }
          }
        }
      }

      var newAddressesSorted = addresses.slice().sort();
      if (!arraysEqual(newAddressesSorted, oldAddressesSorted)) {
        oldAddressesSorted = newAddressesSorted;
        if (addresses.length > 1) {
          console.log("more than 1 IP address found: " + addresses);
        }
        emitter.emit('changed', addresses);
      }
    }
    return addresses.slice();
  };
}());

function getRequestIpAddresses(req) {
  var ips = req.headers['x-forwarded-for'];
  if (!ips && req.connection) {
    ips = req.connection.remoteAddress;
  }
  if (!ips && req.socket) {
    ips = req.socket.remoteAddress;
  }
  if (!ips && req.connection && rec.connection.socket) {
    ips = req.connection.socket.remoteAddres;
  }
  if (ips) {
    if (ips.indexOf(',')) {
      ips = ips.split(",");
    } else {
      ips = [ips];
    }
    ips = ips.map(function(s) {
      return s.trim();
    });
  }
  return ips && ips.length ? ips : [];
}


exports.getIpAddresses = getIpAddresses;
exports.getRequestIpAddresses = getRequestIpAddresses;
exports.on = emitter.on.bind(emitter);
exports.addListener = exports.on;
exports.removeListener = emitter.removeListener.bind(emitter);



