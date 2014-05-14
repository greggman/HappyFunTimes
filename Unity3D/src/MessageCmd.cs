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

using System;
using System.Collections.Generic;
using DeJson;

namespace HappyFunTimes {

public class MessageCmd {
    public MessageCmd() {
        cmd = "";
        data = null;
    }

    public MessageCmd(string _cmd, MessageCmdData _data) {
        cmd = _cmd;
        data = _data;
    }

    public string cmd;           // command to emit
    public MessageCmdData data;  // data for command
};

/// <summary>
/// Base class for all message data. Be sure to set the CmdName attribute
/// </summary>
/// <example>
/// <code>
///
/// [CmdName("playerHit")]
/// public class PlayerHit : MessageCmdData
///     public int numHitPoints;
/// }
/// </code>
/// </example>
public class MessageCmdData {

    public static string GetCmdName(System.Type type) {
        //Querying Class Attributes
        foreach (Attribute attr in type.GetCustomAttributes(true)) {
            CmdNameAttribute cmdNameAttr = attr as CmdNameAttribute;
            if (cmdNameAttr != null) {
                return cmdNameAttr.CmdName;
            }
        }
        return null;
    }

}

// This is just to cache the command names since iterating over fields seems like it
// would be slow. Probably a pre-mature optimization.
public class MessageCmdDataNameDB {

    public static string GetCmdName(System.Type type) {
        string name;
        if (!m_typeToCommandName.TryGetValue(type, out name)) {
            name = MessageCmdData.GetCmdName(type);
            m_typeToCommandName[type] = name;
        }
        return name;
    }

    private static Dictionary<System.Type, string> m_typeToCommandName = new Dictionary<System.Type, string>();
}

/// <summary>
/// Attibute used to associate a command name with a class.
/// In C# land we could just use the name of the class through reflection
/// but these names originate in JavaScript where there is no class name.
/// </summary>
[AttributeUsage(AttributeTargets.Class)]
public class CmdNameAttribute : System.Attribute
{
   public readonly string CmdName;

   public CmdNameAttribute(string cmdName)
   {
      this.CmdName = cmdName;
   }
}

// Deserialize from base MessageCmdData into a concrete derived type.
public class MessageCmdDataCreator : Deserializer.CustomCreator {

    // base class that goes in dictionary of names -> creators
    public abstract class Creator {
        public abstract object Create();
    }

    // concrete creators
    public class TypedCreator<T> : Creator where T : new()  {
        public override object Create() {
            return new T();
        }
    }

    public class TypeBasedCreator : Creator {
        public TypeBasedCreator(System.Type type) {
            m_type = type;
        }

        public override object Create() {
            return Activator.CreateInstance(m_type);
        }

        private System.Type m_type;
    }

    public MessageCmdDataCreator() {
        m_creators = new Dictionary<string, Creator>();
    }

    public void RegisterCreator<T>() where T : new() {
        string name = MessageCmdData.GetCmdName(typeof(T));
        if (name == null) {
            System.InvalidOperationException ex = new System.InvalidOperationException("missing CmdNameAttribute");
            throw ex;
        }

        m_creators[name] = new TypedCreator<T>();
    }

    public void RegisterCreator(System.Type type) {
        string name = MessageCmdData.GetCmdName(type);
        if (name == null) {
            System.InvalidOperationException ex = new System.InvalidOperationException("missing CmdNameAttribute");
            throw ex;
        }
        m_creators[name] = new TypeBasedCreator(type);
    }

    public override object Create(Dictionary<string, object> src, Dictionary<string, object> parentSrc) {
        string typeName = (string)parentSrc["cmd"];
        Creator creator;
        if (m_creators.TryGetValue(typeName, out creator)) {
            return creator.Create();
        }
        return null;
    }

    public override System.Type TypeToCreate() {
        return typeof(MessageCmdData);
    }

    Dictionary<string, Creator> m_creators;
};


}  // namespace HappyFunTimes
