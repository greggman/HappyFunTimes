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

namespace HappyFunTimes {

public class NetPlayer {

    public delegate void TypedCmdEventHandler<T>(T eventArgs) where T : MessageCmdData;

    private class CmdConverter<T> where T : MessageCmdData
    {
        public CmdConverter(TypedCmdEventHandler<T> handler) {
            m_handler = handler;
        }

        public void Callback(GameServer server, MessageCmdData data) {
            server.QueueEvent(delegate() {
                m_handler((T)data);
            });
        }

        TypedCmdEventHandler<T> m_handler;
    }

    public NetPlayer(GameServer server, int id) {
        m_server = server;
        m_id = id;
        m_handlers = new Dictionary<string, CmdEventHandler>();
        m_deserializer = new Deserializer();
        m_mcdc = new MessageCmdDataCreator();
        m_deserializer.RegisterCreator(m_mcdc);
    }

    public void RegisterCmdHandler<T>(TypedCmdEventHandler<T> callback) where T : MessageCmdData {
        string name = MessageCmdDataNameDB.GetCmdName(typeof(T));
        if (name == null) {
            throw new System.InvalidOperationException("no CmdNameAttribute on " + typeof(T).Name);
        }
        CmdConverter<T> converter = new CmdConverter<T>(callback);
        m_handlers[name] = converter.Callback;
        m_mcdc.RegisterCreator(typeof(T));
    }


    /// <param name="server">This needs the server because messages need to be queued as they need to be delivered on anther thread</param>.
    private delegate void CmdEventHandler(GameServer server, MessageCmdData cmdData);

    public void SendCmd(MessageCmdData data) { // Make it Ob's name is the message.
        string name = MessageCmdDataNameDB.GetCmdName(data.GetType());
        MessageCmd msgCmd = new MessageCmd(name, data);
        m_server.SendCmd("client", m_id, msgCmd);
    }

    public void SendUnparsedEvent(Dictionary<string, object> data) {
        // If there are no handlers registered then the object using this NetPlayer
        // has not been instantiated yet. The issue is the GameSever makes a NetPlayer.
        // It then has to queue an event to start that player so that it can be started
        // on another thread. But, before that event has triggered other messages might
        // come through. So, if there are no handlers then we add an event to run the
        // command later. It's the same queue that will birth the object that needs the
        // message.
        if (m_handlers.Count == 0) {
            m_server.QueueEvent(delegate() {
                SendUnparsedEvent(data);
            });
            return;
        }

        try {
            MessageCmd cmd = m_deserializer.Deserialize<MessageCmd>(data);
            CmdEventHandler handler;
            if (!m_handlers.TryGetValue(cmd.cmd, out handler)) {
                Debug.LogError("unhandled NetPlayer cmd: " + cmd.cmd);
                return;
            }
            handler(m_server, cmd.data);
        } catch (Exception ex) {
            Debug.LogException(ex);
        }

    }

    public void Disconnect() {
        OnDisconnect(this, new EventArgs());
    }

    public event EventHandler<EventArgs> OnDisconnect;

    private GameServer m_server;
    private int m_id;
    private Dictionary<string, CmdEventHandler> m_handlers;  // handlers by command name
    private Deserializer m_deserializer;
    private MessageCmdDataCreator m_mcdc;
};


}

