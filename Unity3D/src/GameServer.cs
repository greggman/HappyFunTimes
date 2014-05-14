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

using UnityEngine;
using DeJson;
using System;
using System.Collections.Generic;
using WebSocketSharp;

namespace HappyFunTimes {

public class GameServer {

    public class Options {
        public string gameId;
        public string controllerUrl;
    };

    public GameServer(Options options, GameObject gameObject) {
        m_options = options;
        m_gameObject = gameObject;
        m_players = new Dictionary<int, NetPlayer>();
        m_sendQueue = new List<String>();
        m_deserializer = new Deserializer();

        m_eventProcessor = m_gameObject.AddComponent<EventProcessor>();
    }

    public void Init() {
        Init("ws://localhost:8080");
    }

    public void Init(string url/* = "ws://localhost:8080" */) {

        if (m_socket == null) {
            m_socket = new WebSocket(url);
            m_socket.OnOpen += SocketOpened;
            m_socket.OnMessage += SocketMessage;
            m_socket.OnClose += SocketClosed;
            m_socket.OnError += SocketError;

            m_socket.Connect ();
        }

    }

    public void Close() {
        if (m_connected) {
            m_connected = false;
            m_socket.Close();
            m_socket = null;
        }
    }

    public void QueueEvent(Action action) {
        m_eventProcessor.QueueEvent(action);
    }

    public event EventHandler<PlayerConnectMessageArgs> OnPlayerConnect;
    public event EventHandler<EventArgs> OnConnect;
    public event EventHandler<EventArgs> OnDisconnect;

    private Options m_options;
    private bool m_connected = false;
    private int m_totalPlayerCount = 0;
    private WebSocket m_socket;
    private Dictionary<int, NetPlayer> m_players;
    private List<String> m_sendQueue;
    private Deserializer m_deserializer;
    private GameObject m_gameObject;
    private EventProcessor m_eventProcessor;

    public class MessageToClient {
        public string cmd;  // command 'server', 'update'
        public int id;      // id of client
        public Dictionary<string, object> data;
    };

    private class RelayServerCmd {
        public RelayServerCmd(string _cmd, int _id, System.Object _data) {
            cmd = _cmd;
            id = _id;
            data = _data;
        }

        public string cmd;
        public int id;
        public System.Object data;
    }

    private void SocketOpened(object sender, System.EventArgs e) {
        //invoke when socket opened
        Debug.Log("socket opened");
        m_connected = true;

        List<String>.Enumerator i = m_sendQueue.GetEnumerator();
        while (i.MoveNext()) {
            m_socket.Send(i.Current);
        }
        m_sendQueue.Clear();

        // Inform the relayserver we're a server
        SendCmd("server", -1, m_options);

        OnConnect.Emit(this, new EventArgs());
    }

    private void SocketClosed(object sender, CloseEventArgs e) {
        //invoke when socket closed
        Debug.Log("connection closed");
        m_connected = false;

        OnDisconnect.Emit(this, new EventArgs());
        while (m_players.Count > 0) {
            Dictionary<int, NetPlayer>.Enumerator i = m_players.GetEnumerator();
            i.MoveNext();
            RemovePlayer(i.Current.Key);
        }
    }

    private void SocketMessage(object sender, MessageEventArgs e) {
        //invoke when socket message
        if ( e!= null && e.Type == Opcode.Text) {
            try {
                MessageToClient m = m_deserializer.Deserialize<MessageToClient>(e.Data);
                // TODO: make this a dict to callback
                if (m.cmd.Equals("start")) {
                    StartPlayer(m.id, "");
                } else if (m.cmd.Equals("remove")) {
                    RemovePlayer(m.id);
                } else if (m.cmd.Equals("update")) {
                    UpdatePlayer(m.id, m.data);
                } else {
                    Debug.LogError("unknown client message: " + m.cmd);
                }
            } catch (Exception ex) {
                Debug.LogException(ex);  // TODO: Add object if possible
                return;
            }
        }
    }

    private void SocketError(object sender, ErrorEventArgs e) {
        //invoke when socket error
        Debug.Log("socket error: " + e.Message);
        m_connected = false;
    }

    private void StartPlayer(int id, string name) {
        if (m_players.ContainsKey(id)) {
            return;
        }

        if (string.IsNullOrEmpty(name)) {
            name = "Player" + (++m_totalPlayerCount);
        }

        NetPlayer player = new NetPlayer(this, id);
        m_players[id] = player;
        m_eventProcessor.QueueEvent(delegate() {
            // UGH! This is not thread safe because someone might add handler to OnPlayerConnect
            // Odds or low though.
            OnPlayerConnect.Emit(this, new PlayerConnectMessageArgs(player));
        });
    }

    private void UpdatePlayer(int id, Dictionary<string, object> cmd) {
        NetPlayer player;
        if (!m_players.TryGetValue(id, out player)) {
            return;
        }
        player.SendUnparsedEvent(cmd);
    }

    private void RemovePlayer(int id) {
        NetPlayer player;
        if (!m_players.TryGetValue(id, out player)) {
            return;
        }
        m_eventProcessor.QueueEvent(delegate() {
            player.Disconnect();
        });
        m_players.Remove(id);
    }

    private void Send(string msg) {
        if (m_connected) {
            m_socket.Send(msg);
        } else {
            m_sendQueue.Add(msg);
        }
    }

    // Only NetPlayer should call this.
    public void SendCmd(string cmd, int id, System.Object data) {
        var msg = new RelayServerCmd(cmd, id, data);
        string json = Serializer.Serialize(msg);
        Send(json);
    }
};

}
