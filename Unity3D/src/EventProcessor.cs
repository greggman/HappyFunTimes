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

// This is needed to send the events to on the correct thread.
public class EventProcessor : MonoBehaviour {

    public void QueueEvent(Action action) {
        lock(m_queueLock) {
            m_queuedEvents.Add(action);
        }
    }

    void Start() {
        m_queuedEvents = new List<Action>();
        m_executingEvents = new List<Action>();
    }

    void Update() {
        MoveQueuedEventsToExecuting();

        if (m_executingEvents != null) {
            while (m_executingEvents.Count > 0) {
                Action e = m_executingEvents[0];
                m_executingEvents.RemoveAt(0);
                e();
            }
        }
    }

    private void MoveQueuedEventsToExecuting() {
        lock(m_queueLock) {
            if (m_executingEvents != null) {
                while (m_queuedEvents.Count > 0) {
                    Action e = m_queuedEvents[0];
                    m_executingEvents.Add(e);
                    m_queuedEvents.RemoveAt(0);
                }
            }
        }
    }

    private System.Object m_queueLock = new System.Object();
    private List<Action> m_queuedEvents;
    private List<Action> m_executingEvents;
}


}  // namespace HappyFunTimes

