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

// TODO: replace tdl.log stuff

define(
  [ './virtualsocket',
    './netplayer',
  ], function(VirtualSocket, NetPlayer) {

  var emptyMsg = { };

  /**
   * options:
   *   controllerUrl: url of the controller. If not passed in
   *       assumes it's the same as the game except 'index.html'.
   *       In other words if the game's url is
   *       http://foo/bar/game.html it will assume the controller
   *       is at http://foo/bar/index.html if you don't set the
   *       controllerUrl.
   */
  var GameServer = function(options) {
    var _connected = false;
    var _socket;
    // Used in case the game tries to send messages to the server before it's connected.
    // This way the game does not have to wait for a connection to send startup messages.
    // Not sure there's a point to that :(
    var _sendQueue = [];
    var _numPlayers = 0;
    var _players = {};  // by id
    var _totalPlayerCount = 0;
    var _eventListeners = {};

    this.addEventListener = function(eventType, listener) {
      _eventListeners[eventType] = listener;
    };

    this.removeEventListener = function(eventType) {
      _eventListeners[eventType] = undefined;
    };

    var sendEvent_ = function(eventType, args) {
      var fn = _eventListeners[eventType];
      if (fn) {
        fn.apply(this, args);
      }
    }.bind(this);

    var startPlayer_ = function(msg) {
      var id = msg.id;
      var name = msg.name;

      // Ignore if we already have a player with this id.
      if (_players[id]) {
        return;
      }

      // Make up a name if no name given.
      if (!name) {
        name = "Player" + (++_totalPlayerCount);
      }

      var player = new NetPlayer(this, id);
      _players[id] = player;
      ++_numPlayers;
      sendEvent_('playerconnect', [player, name]);
    }.bind(this);

    var getPlayer_ = function(id) {
      var player = _players[id];
      return player;
    }.bind(this);

    var updatePlayer_ = function(msg) {
      var player = getPlayer_(msg.id);
      if (!player)
        return;
      player.sendEvent_(msg.data.cmd, [msg.data.data]); // FIX: Seems like gameserver should not know how to deal with this.
    }.bind(this);

    var removePlayer_ = function(msg) {
      var id = msg.id;
      var player = _players[id];
      if (player) {
        player.sendEvent_('disconnect', []);
        delete _players[id];
        --_numPlayers;
      }
    }.bind(this);

    var messageHandlers = {
      start: startPlayer_,
      update: updatePlayer_,
      remove: removePlayer_,
    };

    var processMessage_ = function(msg) {
      var fn = messageHandlers[msg.cmd];
      if (fn) {
        fn(msg);
      } else {
        console.error("Unknown Message: " + msg.cmd);
      }
    }.bind(this);

    this.isConnected = function() {
      return _connected;
    };

    var connect_ = function() {
      _socket = new VirtualSocket();
      _sendQueue = [];
      _socket.on('connect', connected_.bind(this));
      _socket.on('message', processMessage_.bind(this));
      _socket.on('disconnect', disconnected_.bind(this));
    }.bind(this);

    var connected_ = function() {
      _connected = true;
      for (var ii = 0; ii < _sendQueue.length; ++ii) {
        _socket.send(_sendQueue[ii]);
      }
      _sendQueue = [];
      sendEvent_('connect');
    }.bind(this);

    var disconnected_ = function() {
      _connected = false;
      sendEvent_('disconnect');
      while (_numPlayers > 0) {
        for (var id in _players) {
          removePlayer_(id);
          break;
        }
      }
      connect_();
    }.bind(this);

    var send_ = function(msg) {
      if (_connected == WebSocket.CONNECTING) {
        _sendQueue.push(msg);
      } else {
        _socket.send(msg);
      }
    }.bind(this);

    // This sends a command to the 'relayserver'. The relaysever uses 'cmd' to figure out what to do
    // and 'id' to figure out which client this is for. 'data' will be delieved to that client.
    this.sendCmd = function(cmd, id, data) {
      if (data === undefined) {
        data = emptyMsg;
      }
      var msg = {
        cmd: cmd,
        id: id,
        data: data
      };
      send_(msg);
    };

    // Sends a command to all clients connected to this server. It's effectively the
    // same as iterating over all NetPlayers returned in playerconnect events. The difference
    // is only one message is sent from the server (here) to the relayserver. The relayserver
    // then sends the same message to each client.
    this.broadcastCmd = function(cmd, data) {
      if (data === undefined) {
        data = emptyMsg;
      }
      this.sendCmd('broadcast', {cmd: cmd, data: data});
    };

    connect_();

    if (!options.controllerUrl) {
      var url = window.location.href;
      var subs = {"#": 1, "?": 1, "/": 0};
      for (var c in subs) {
        var ndx = subs[c] ? url.indexOf(c) : url.lastIndexOf(c);
        if (ndx >= 0) {
          url = url.substr(0, ndx);
        }
      }
      options.controllerUrl = url + "/index.html";
    }
    this.sendCmd("server", -1, options);
  };

  return GameServer;
});



