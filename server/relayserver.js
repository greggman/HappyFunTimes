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

var sys = require('sys');
var debug = require('debug')('relayserver');

var SocketIOServer = function(server) {
  debug("Using Socket.io");

  var sio = require('socket.io');
  var io = sio.listen(server);

  var SIOClient = function(client) {
    this.client = client;

    this.send = function(msg) {
      this.client.emit('message', msg);
    };

    this.on = function(eventName, fn) {
      this.client.on(eventName, fn);
    };
  };

  this.on = function(eventName, fn) {
    if (eventName == 'connection') {
      io.sockets.on(eventName, function(client) {
        var wrapper = new SIOClient(client);
        fn(wrapper);
      });
    } else {
      io.sockets.on(eventName, fn);  // does this case exist?
    }
  };
};

var WSServer = function(server) {
  debug("Using WebSockets directly");

  var WebSocketServer = require('ws').Server;
  var wss = new WebSocketServer({server: server});

  var WSClient = function(client) {
    this.client = client;

    this.send = function(msg) {
      this.client.send(JSON.stringify(msg));
    };

    this.on = function(eventName, fn) {
      if (eventName == 'disconnect') {
        eventName = 'close';
      }
      if (eventName == 'message') {
        this.client.on(eventName, function(data, flags) {
          debug("rcvd: " + data);
          fn(JSON.parse(data));
        });
      } else {
        this.client.on(eventName, fn);
      }
    };
  };

  this.on = function(eventName, fn) {
    if (eventName == 'connection') {
      wss.on(eventName, function(client) {
        var wrapper = new WSClient(client);
        fn(wrapper);
      });
    } else {
      wss.on(eventName, fn);  // does this case exist?
    }
  };

};

var RelayServer = function(server) {

  var g_nextSessionId = 1;
  var g_clients = {};
  var g_numClients = 0;
  var g_servers = {};
  var g_numServers = 0;

  var broadcast = function(message) {
    for (var id in g_clients) {
      g_clients[id].send(message);
    }
  };

  var addClient = function(client) {
    client.sessionId = g_nextSessionId++;
    debug("connection: cid:" + client.sessionId + "\n");
    g_clients[client.sessionId] = client;
    ++g_numClients;
    debug("add: num clients: " + g_numClients);
  };

  var removeClient = function(client) {
    delete g_clients[client.sessionId];
    if (g_numClients) {
      --g_numClients;
      debug("remove: num clients: " + g_numClients);
      if (g_numClients == 0) {
        debug("all clients disconnected");
      }
    }
  }

  var addServer = function(client) {
    if (!g_servers[client.sessionId]) {
      g_servers[client.sessionId] = client;
      ++g_numServers;
      debug("add: num servers: " + g_numServers);
      return true;
    }
    return false
  }

  var removeServer = function(client) {
    if (!g_servers[client.sessionId]) {
      return false;
    }
    delete g_servers[client.sessionId];
    --g_numServers;
    debug("remove num servers: " + g_numServers);
    if (g_numServers == 0) {
      debug("all servers disconnected");
    }
    return true;
  }

  var sendMsgToServer = function(msg) {
    if (!g_numServers) {
      debug("no servers!");
      return;
    }
    for (var id in g_servers) {
      var server = g_servers[id];
      server.send(msg);
    }
  };

  // --- messages to relay server ---
  //
  // server:
  //   desc: identifies this session as a server
  //   args: none
  //
  // client:
  //   desc: sends a message to a specific client
  //   args:
  //      id:   session id of client
  //      data: object
  //
  // update:
  //   desc: sends an update to the game server
  //   args:
  //      anything

  // -- messages to the game server --
  //
  // update:
  //   desc: updates a player
  //   args:
  //      id: id of player to update
  //      data: data
  //
  // remove:
  //   desc: removes a player
  //   args:
  //      id: id of player to remove.
  //

  // -- messages to player --
  //

  var processMessage = function(client, message) {
    switch (message.cmd) {
      case 'server':
        removeClient(client);
        addServer(client);
        g_servers[client.sessionId] = client;
        break;
      case 'client': {
        var client = g_clients[message.id];
        if (client) {
          client.send(message.data);
        } else {
          debug("no client: " + message.id);
        }
        break;
      }
      case 'broadcast': {
        message.cmd = 'update';
        for (var id in g_clients) {
          debug("sending to: " + id);
          g_clients[id].send(message);
        }
        break;
      }
      case 'update':
        message.id = client.sessionId;
        sendMsgToServer(message);
        break;
      default:
        debug("unkonwn message: " + message.cmd);
        break;
    }
  };

  //var io = new SocketIOServer(server);
  var io = new WSServer(server);

  io.on('connection', function(client){
      addClient(client);

      sendMsgToServer({
          cmd: 'start',
          id: client.sessionId,
      });

      client.on('message', function(message){
          debug("cid:" + client.sessionId + " msg:" + message);
          processMessage(client, message);
      });

      client.on('disconnect', function(){
          if (!removeServer(client)){
              sendMsgToServer({
                  cmd: 'remove',
                  id: client.sessionId,
              });
              removeClient(client);
          }
      });
  });

};

exports.RelayServer = RelayServer;
