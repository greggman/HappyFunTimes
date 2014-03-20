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
// FIX: Can these be private?
    [CmdName("color")]
    public class MessageColor : MessageCmdData {
        public string color = "";    // in CSS format rgb(r,g,b)
    };

    [CmdName("move")]
    public class MessageMove : MessageCmdData {
        public int x = 0;
        public int y = 0;
    };

    // NOTE: This message is only sent, never received
    // therefore it does not need a no parameter constructor.
    // If you do receive one you'll get an error unless you
    // add a no parameter constructor.
    [CmdName("scored")]
    public class MessageScored : MessageCmdData {
        public MessageScored(int _points) {
            points = _points;
        }

        public int points;
    }

    public void Init(NetPlayer netPlayer, ExampleSimple exampleSimple) {
        m_netPlayer = netPlayer;
        m_exampleSimple = exampleSimple;
    }

    void Start() {
        m_position = gameObject.transform.localPosition;
        m_color = new Color(0.0f, 1.0f, 0.0f);

        m_netPlayer.OnDisconnect += Remove;
        // Setup events for the different messages.
        m_netPlayer.RegisterCmdHandler<MessageColor>(OnColor);
        m_netPlayer.RegisterCmdHandler<MessageMove>(OnMove);
    }

    public void Update() {
    }

    public void OnTriggerEnter(Collider other) {
        // Because of physics layers we can only collide with the goal
        m_netPlayer.SendCmd(new MessageScored(m_exampleSimple.m_rand.Next(5, 15)));
    }

    void Remove(object sender, EventArgs e) {
        Destroy(gameObject);
    }

    private void OnColor(MessageColor data) {
        m_color = Style.ParseCSSColor(data.color);
        gameObject.renderer.material.color = m_color;
    }

    private void OnMove(MessageMove data) {
        m_position.x = data.x;
        m_position.z = m_exampleSimple.areaHeight - data.y - 1;  // because in 2D down is positive.

        gameObject.transform.localPosition = m_position;
    }

    private NetPlayer m_netPlayer;
    private ExampleSimple m_exampleSimple;
    private Vector3 m_position;
    private Color m_color;
}

}  // namespace HappyFunTimesExample

