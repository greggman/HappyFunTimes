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
   * Manages a player across the net.
   *
   * **NOTE: YOU DO NOT CREATE THESE DIRECTLY**. They are created
   * by the `GameServer` whenever a new player joins your game.
   * They are passed to you in the 'playerconnect' event from
   * `GameServer`
   *
   * @constructor
   * @private
   * @alias NetPlayer
   * @param {GameServer} server
   * @param {number} id
   * @param {string} name
   */
  var NetPlayer = function(server, id, data, name) {
    var _server = server;
    var _id = id;
    var _eventListeners = { };
    var _internalListeners = { };
    var _connected = true;
    var _sessionId = data ? data.__hft_session_id__ : undefined;
    var _self = this;
    var _emptyMsg = {};
    var _name = name;
    var _busy = false;

    if (data && data.__hft_name__) {
      _name = data.__hft_name__;
    }

    function sendCmd(cmd, msg) {
      if (!_connected) {
        return;
      }
      if (msg === undefined) {
        msg = _emptyMsg;
      }
      _server.sendCmd("client", _id, {cmd: cmd, data: msg});
    }

    /**
     * Sends a message to this player.
     *
     * @method
     * @param {string} cmd
     * @param {object} [msg] a jsonifyable object.
     */
    this.sendCmd = sendCmd;

    /**
     * Adds an event listener
     *
     * You make up these events. Calling
     *
     *     GameClient.sendCmd('someEvent', { foo: 123 });
     *
     * In the controller (the phone) will emit an event `someEvent`
     * which will end up calling the listener. That listener will be
     * passed the data. In the example above that data is
     * `{foo:123}`
     *
     *     function handleSomeEvent(data) {
     *       console.log("foo = " + data.foo);
     *     }
     *
     *     someNetPlayer.addEventListener('someEvent', handleSomeEvent);
     *
     *
     * @param {string} eventType name of event.
     * @param {function(object)} listener function to call when event
     *        arrives
     */
    this.addEventListener = function(eventType, listener) {
      switch (eventType) {
        case 'disconnect':
          listener = function(listener) {
            return function() {
               _self.removeAllListeners();
               _connected = false;
               return listener.apply(_self, arguments);
            };
          }(listener);
          break;
      }
      _eventListeners[eventType] = listener;
    };

    /**
     * Synonym for {@link Netplayer#addEventListener}.
     * @method
     * @param {string} eventType name of event.
     * @param {function(object)} listener function to call when event
     *        arrives
     */
    this.on = this.addEventListener;

    /**
     * Removes an event listener
     * @param {string} eventType name of event to remove
     */
    this.removeEventListener = function(eventType) {
      _eventListeners[eventType] = undefined;
    };

    /**
     * Removes all listeners
     */
    this.removeAllListeners = function() {
      _eventListeners = { };
    };

    var _sendEvent = function(eventType, args) {
      var fn = _eventListeners[eventType] || _internalListeners[eventType];
      if (fn) {
        fn.apply(this, args);
      } else {
        console.error("NetPlayer: Unknown Event: " + eventType);
      }
    };
    this.sendEvent_ = _sendEvent;

    var _sendEventIfHandler = function(eventType, args) {
      if (_eventListeners[eventType]) {
        _sendEvent(eventType, args);
      }
    };

    /**
     * Moves this player to another game.
     *
     * You can use this function to make multi-computer / multi-screen
     * games. See [hft-tonde-iko](http://github.com/greggman/hft-tonde-iko)
     * as an example.
     *
     * @param {string} gameId id of game to send player to
     * @param {*} data data to give to game receiving the player.
     */
    this.switchGame = function(gameId, data) {
      if (_connected) {
        _server.sendCmd("switchGame", _id, {gameId: gameId, data: data});
        _connected = false;
      }
    };

    function ignoreMsg() {
    }

    function handleSetNameMsg(data) {
      if (data.name && data.name.length > 0) {
        _name = data.name;
        _sendEventIfHandler('hft_namechange');
      }
    }

    function handleBusyMsg(data) {
      _busy = data.busy;
      _sendEventIfHandler('hft_busy');
    }

    function handleLogMsg(data) {
      var fn = console[data.type] || console.log;
      fn.call(console, data.msg);
    }

    _internalListeners["setName"] = ignoreMsg;
    _internalListeners["_hft_setname_"] = handleSetNameMsg;
    _internalListeners["busy"] = ignoreMsg;
    _internalListeners["_hft_busy_"] = handleBusyMsg;
    _internalListeners["_hft_log_"] = handleLogMsg;

    /**
     * Whether or not this netplayer is connected.
     * you shouldn't need to look at this. Use 'disconnect' event.
     * @return {boolean} true if player is connected.
     */
    this.isConnected = function() {
      return _connected;
    };

    /**
     * A sessionId for this player
     *
     * This id should be the same if they disconnect and later reconnect
     * so you can use it to restore their state if you want.
     * @return {string} session id for player
     */
    this.getSessionId = function() {
      return _sessionId;
    };

    /**
     * A unique id for this NetPlayer object.
     *
     * this id will not repeat even if the user disconnects and reconnects.
     * @return {string} id for player
     */
    this.getId = function() {
      return _id;
    };

    /**
     * The players's name.
     * Use event 'hft_namechange' to watch for a change.
     * @return {string} name of player
     */
    this.getName = function() {
      return _name;
    };

    /**
     * Whether or not player is in system menu on controller (editing name)
     * Use event 'hft_busy' to watch for a change.
     * @return {boolean} true if busy.
     */
    this.isBusy = function() {
      return _busy;
    };
  };

  /**
   * Event that the player has left.
   * @event NetPlayer#disconnected
   */

  /**
   * Event that player has changed their name
   *
   * check `getName` to get their new name.
   * @event NetPlayer#hft_namechange
   */

  /**
   * Event that player entered or exited the system menu
   *
   * Meaning they aren't playing the game.
   * check `isBusy` to find out if they are in the menu or not.
   * @event NetPlayer#hft_busy
   */

  return NetPlayer;
});

