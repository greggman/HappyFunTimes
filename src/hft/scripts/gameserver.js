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
    './misc/cookies',
    './netplayer',
    './virtualsocket',
  ], function(
    Cookie,
    NetPlayer,
    VirtualSocket) {

  var emptyMsg = { };

  /**
   * @typedef {Object} GameServer~Options
   * @property {Socket} [socket] Socket to use for communications
   * @property {boolean} [quiet] true = don't print any console messages
   * @property {boolean} [reconnectOnDisconnect]
   */

  /**
   * GameServer is used by a game to talk to the various
   * controllers (phones) of the people playing the game.
   * @constructor
   * @alias GameServer
   * @param {GameServer~Options} [options] options.
   */
  var GameServer = function(options) {
    options = options || {};
    var log = options.quiet ? function() {} : console.log.bind(console);
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
    var _systemMsgHandler;
    var _connectData = {
      id: undefined,
      needNewHFT: undefined,
    };
    var _getters = {};
    Object.keys(_connectData).forEach(function(key) {
      _getters[key] = function() {
        throw "you can't read " + key + " before you've connected";
      };
      Object.defineProperty(this, key, {
        get: function() {
          return _getters[key]();
        },
        set: function() {},
        enumerable: true,
        configurable: true,
      });
    }.bind(this));
    var _reloaded = false;

    if (!options.gameId) {
      options.gameId = "HFTHTML5";
    }

    this.setSystemMsgHandler_ = function(handler) {
      _systemMsgHandler = handler;
    };

    /**
     * Event that we've connected to happyFunTimes
     *
     * @event GameServer#connected
     */

    /**
     * Event that we've been disconnected from happyFunTimes
     *
     * @event GameServer#disconnected
     */

    /**
     * Event that a new player has joined the game.
     *
     * @event GameServer#playerconnected
     * @param {NetPlayer} netPlayer a NetPlayer used to communicate
     *        with the controller for the player.
     */

    /**
     * Adds an event listener for the given event type. Valid
     * commands include 'connect' (we connected to happyFunTimes),
     * 'disconnect' we were disconnected from the relaysefver,
     * 'playerconnect' a new player has joined the game.
     *
     * @param {string} eventType name of event
     * @param {GameServer~Listener} listener callback to call for
     *        event.
     */
    this.addEventListener = function(eventType, listener) {
      _eventListeners[eventType] = listener;
    };

    /**
     * @callback GameServer~Listener
     * @param {Object} data data from sender.
     */

    /**
     * Removes an eventListener
     * @param {string} eventType name of event
     */
    this.removeEventListener = function(eventType) {
      _eventListeners[eventType] = undefined;
    };

    var sendEvent_ = function(eventType, args) {
      var fn = _eventListeners[eventType];
      if (fn) {
        fn.apply(this, args);
      }
    }.bind(this);

    var removePlayer_ = function(id) {
      var player = _players[id];
      if (player) {
        player.sendEvent_('disconnect', []);
        delete _players[id];
        --_numPlayers;
      }
    };

    var handleStartPlayer_ = function(msg) {
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

      var player = new NetPlayer(this, id, msg.data, name);
      _players[id] = player;
      ++_numPlayers;
      sendEvent_('playerconnect', [player, name, msg.data]);
    }.bind(this);

    var getPlayer_ = function(id) {
      var player = _players[id];
      return player;
    };

    var handleUpdatePlayer_ = function(msg) {
      var player = getPlayer_(msg.id);
      if (!player) {
        return;
      }
      player.sendEvent_(msg.data.cmd, [msg.data.data]); // FIX: Seems like gameserver should not know how to deal with this.
    };

    var handleRemovePlayer_ = function(msg) {
      removePlayer_(msg.id);
    };

    var handleSystemMsg_ = function(msg) {
      if (_systemMsgHandler) {
        _systemMsgHandler(msg.data);
      }
    };

    var handleLogMsg_ = function(data) {
      var fn = console[data.type] || console.log;
      fn.call(console, data.msg);
    };

    var handleGameMsg_ = function(msg) {
      sendEvent_(msg.data.cmd, [msg.data.data, msg.id]);
    };

    var handleGameStart_ = function(msg) {
      Object.keys(_connectData).forEach(function(key) {
        _connectData[key] = msg.data[key];
        _getters[key] = function() {
          return _connectData[key];
        };
      });
      sendEvent_('connect', [msg.data]);
    };

    var messageHandlers = {
      gamestart: handleGameStart_,
      update: handleUpdatePlayer_,
      upgame: handleGameMsg_,
      remove: handleRemovePlayer_,
      start: handleStartPlayer_,
      system: handleSystemMsg_,
      log: handleLogMsg_,
    };

    var processMessage_ = function(msg) {
      var fn = messageHandlers[msg.cmd];
      if (fn) {
        fn(msg);
      } else {
        console.error("Unknown Message: " + msg.cmd);
      }
    };

    /**
     * True if we're connected to happyFunTimes
     * @returns {Boolean} true if were connected.
     */
    this.isConnected = function() {
      return _connected;
    };

    /**
     * True if we were auto-reloaded after a disconnect.
     * This happens if HFT stops running and then is re-started
     * @return {Boolean} true if this is a reload.
     */
    this.isReloaded = function() {
      return _reloaded;
    };

    var connect_ = function() {
      _socket = options.socket || new VirtualSocket(options);
      _sendQueue = [];
      _socket.on('connect', connected_.bind(this));  // eslint-disable-line
      _socket.on('message', processMessage_.bind(this));
      _socket.on('disconnect', disconnected_.bind(this));  // eslint-disable-line
    }.bind(this);

    var connected_ = function() {
      log("connected");
      _connected = true;
      this.sendCmd("server", -1, options);
      for (var ii = 0; ii < _sendQueue.length; ++ii) {
        _socket.send(_sendQueue[ii]);
      }
      _sendQueue = [];

      // This `preconnect` message is a kind of hack.
      // This used to be a `connect` message but
      // I needed to be able to pass an `id` back to the
      // connect message. On top of that, GameSupport
      // was using the `connect` message. In order to allow
      // games using `GameSupport` to use the `connect` message
      // I changed this to `_hft_preconnect`. Games can therefore
      // receive teh `connect` message. I changed `GameSupport`
      // to a watch for `_hft_preconnect`
      sendEvent_('_hft_preconnect');
    }.bind(this);

    var disconnected_ = function() {
      log("disconnected");
      _connected = false;
      sendEvent_('disconnect');
      while (_numPlayers > 0) {
        for (var id in _players) {
          if (Object.hasOwnProperty.call(_players, id)) {
            removePlayer_(id);
          }
          break;
        }
      }

      if (options.reconnectOnDisconnect) {
        setTimeout(connect_, 2000);
      }
    };

    var send_ = function(msg) {
      if (!_socket.isConnected()) {
        _sendQueue.push(msg);
      } else {
        _socket.send(msg);
      }
    };

    /**
     * This sends a command to the 'happyFunTimes'. happyFunTimes uses 'cmd' to figure out what to do
     *  and 'id' to figure out which client this is for. 'data' will be delieved to that client.
     *
     * Only NetPlayer should call this.
     *
     * @private
     * @param {String} cmd name of command to send
     * @param {String} id id of client to relay command to
     * @param {Object=} data a jsonifiable object to send.
     */
    this.sendCmd = function(cmd, id, data) {
      if (data === undefined) {
        data = emptyMsg;
      }
      var msg = {
        cmd: cmd,
        id: id,
        data: data,
      };
      send_(msg);
    };

    /**
     * Sends a command to all controllers connected to this server.
     * It's effectively the same as iterating over all NetPlayers
     * returned in playerconnect events and calling sendCmd on each
     * one. The difference is only one message is sent from the
     * server (here) to happyFunTimes. happyFunTimes then sends
     * the same message to each client.
     *
     * @param {String} cmd name of command to send
     * @param {Object} [data] a jsonifyable object.
     */
    this.broadcastCmd = function(cmd, data) {
      if (data === undefined) {
        data = emptyMsg;
      }
      this.sendCmd('broadcast', -1, {cmd: cmd, data: data});
    };

    this.sendCmdToGame = function(cmd, id, data) {
      if (data === undefined) {
        data = emptyMsg;
      }
      this.sendCmd('peer', id, {cmd: cmd, data: data});
    };

    /**
     * Sends a command to all games, including yourself.
     */
    this.broadcastCmdToGames = function(cmd, data) {
      if (data === undefined) {
        data = emptyMsg;
      }
      this.sendCmd('bcastToGames', -1, {cmd: cmd, data: data});
    };

    connect_();
  };

  return GameServer;
});


