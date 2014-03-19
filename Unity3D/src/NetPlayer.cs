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
using System;
using System.Collections.Generic;

namespace HappyFunTimes {

public class NetPlayer {

    public delegate void TypedCmdEventHandler<T>(T eventArgs) where T : MessageCmdData;

    private class CmdConverter<T> where T : MessageCmdData
    {
        //private class CmdEventMsg<T> : EventProcessor.EventMsg where T : MessageCmdData {
        private class CmdEventMsg : EventProcessor.EventMsg {
            public CmdEventMsg(TypedCmdEventHandler<T> handler, MessageCmdData data) {
                m_handler = handler;
                m_data = data;
            }

            public override void Execute() {
                m_handler((T)m_data);
            }

            private TypedCmdEventHandler<T> m_handler;
            private MessageCmdData m_data;
        }

        public CmdConverter(TypedCmdEventHandler<T> handler) {
            m_handler = handler;
        }

        public void Callback(GameServer server, MessageCmdData data) {
            CmdEventMsg msg = new CmdEventMsg(m_handler, data);
            server.QueueEvent(msg);
        }

        TypedCmdEventHandler<T> m_handler;
    }

    // Used to queue events before there are any handlers.
    private class SendCmdEventMsg : EventProcessor.EventMsg {
        public SendCmdEventMsg(NetPlayer netPlayer, MessageCmd cmd) {
            m_netPlayer = netPlayer;
            m_cmd = cmd;
        }

        public override void Execute() {
            m_netPlayer.SendEvent(m_cmd);
        }

        private NetPlayer m_netPlayer;
        private MessageCmd m_cmd;
    }

    public NetPlayer(GameServer server, int id) {
        m_server = server;
        m_id = id;
        m_handlers = new Dictionary<string, CmdEventHandler>();
    }

    public void RegisterCmdHandler<T>(TypedCmdEventHandler<T> callback) where T : MessageCmdData {
        string name = MessageCmdDataNameDB.GetCmdName(typeof(T));
        if (name == null) {
            throw new System.InvalidOperationException("no CmdNameAttribute on " + typeof(T).Name);
        }
        CmdConverter<T> converter = new CmdConverter<T>(callback);
        m_handlers[name] = converter.Callback;
    }

    private delegate void CmdEventHandler(GameServer server, MessageCmdData cmdData);

    public void SendCmd(MessageCmdData data) { // Make it Ob's name is the message.
        string name = MessageCmdDataNameDB.GetCmdName(data.GetType());
        MessageCmd msgCmd = new MessageCmd(name, data);
        m_server.SendCmd("client", m_id, msgCmd);
    }

    public void SendEvent(MessageCmd cmd) {
        // If there are no handlers registered then the object using this NetPlayer
        // has not been instantiated yet. The issue is the GameSever makes a NetPlayer.
        // It then has to queue an event to start that player so that it can be started
        // on another thread. But, befor that event has triggered other messages might
        // come through. So, if there are no handlers then we add an event to run the
        // command later. It's the same queue that will birth the object that needs the
        // message.
        if (m_handlers.Count == 0) {
            m_server.QueueEvent(new SendCmdEventMsg(this, cmd));
            return;
        }

        CmdEventHandler handler;
        if (!m_handlers.TryGetValue(cmd.cmd, out handler)) {
            Debug.LogError("unhandled NetPlayer cmd: " + cmd.cmd);
            return;
        }
        handler(m_server, cmd.data);
    }

    private GameServer m_server;
    private int m_id;
    private Dictionary<string, CmdEventHandler> m_handlers;  // handlers by command name
};


}

