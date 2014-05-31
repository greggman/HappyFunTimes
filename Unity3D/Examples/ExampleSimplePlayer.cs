using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;
using HappyFunTimes;
using CSSParse;

namespace HappyFunTimesExample {

class ExampleSimplePlayer : MonoBehaviour {
    // Classes based on MessageCmdData are automatically registered for deserialization
    // by CmdName.
    [CmdName("color")]
    private class MessageColor : MessageCmdData {
        public string color = "";    // in CSS format rgb(r,g,b)
    };

    [CmdName("move")]
    private class MessageMove : MessageCmdData {
        public float x = 0;
        public float y = 0;
    };

    [CmdName("setName")]
    private class MessageSetName : MessageCmdData {
        public MessageSetName() {  // needed for deserialization
        }
        public MessageSetName(string _name) {
            name = _name;
        }
        public string name = "";
    };

    [CmdName("busy")]
    private class MessageBusy : MessageCmdData {
        public bool busy = false;
    }

    // NOTE: This message is only sent, never received
    // therefore it does not need a no parameter constructor.
    // If you do receive one you'll get an error unless you
    // add a no parameter constructor.
    [CmdName("scored")]
    private class MessageScored : MessageCmdData {
        public MessageScored(int _points) {
            points = _points;
        }

        public int points;
    }

    public void Init(NetPlayer netPlayer) {
        m_netPlayer = netPlayer;
        m_name = "Player" + (++s_nextPlayerId);
    }

    void Start() {
        m_rand = new System.Random();
        m_position = gameObject.transform.localPosition;
        m_color = new Color(0.0f, 1.0f, 0.0f);
        m_netPlayer.OnDisconnect += Remove;
        // Setup events for the different messages.
        m_netPlayer.RegisterCmdHandler<MessageColor>(OnColor);
        m_netPlayer.RegisterCmdHandler<MessageMove>(OnMove);
        m_netPlayer.RegisterCmdHandler<MessageSetName>(OnSetName);
        m_netPlayer.RegisterCmdHandler<MessageBusy>(OnBusy);
    }

    public void Update() {
    }

    public void OnTriggerEnter(Collider other) {
        // Because of physics layers we can only collide with the goal
        m_netPlayer.SendCmd(new MessageScored(m_rand.Next(5, 15)));
    }

    private void Remove(object sender, EventArgs e) {
        Destroy(gameObject);
    }

    private void OnColor(MessageColor data) {
        m_color = CSSParse.Style.ParseCSSColor(data.color);
        gameObject.renderer.material.color = m_color;
    }

    private void OnMove(MessageMove data) {
        ExampleSimpleGameSettings settings = ExampleSimpleGameSettings.settings();
        m_position.x = data.x * settings.areaWidth;
        m_position.z = settings.areaHeight - (data.y * settings.areaHeight) - 1;  // because in 2D down is positive.

        gameObject.transform.localPosition = m_position;
    }

    private void OnSetName(MessageSetName data) {
        if (data.name.Length == 0) {
            m_netPlayer.SendCmd(new MessageSetName(m_name));
        } else {
            m_name = data.name;
        }
    }

    private void OnBusy(MessageBusy data) {
        // not used.
    }

    private System.Random m_rand;
    private NetPlayer m_netPlayer;
    private Vector3 m_position;
    private Color m_color;
    private string m_name;
    private static int s_nextPlayerId = 0;
}

}  // namespace HappyFunTimesExample

