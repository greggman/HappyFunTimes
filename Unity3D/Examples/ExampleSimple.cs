using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;
using HappyFunTimes;
using CSSParse;

namespace HappyFunTimesExample {

public class ExampleSimple : MonoBehaviour {

    public int areaWidth = 300;  // matches JavaScript
    public int areaHeight = 300;

    public GameObject prefabToSpawn;

    class Goal {
        public Goal(ExampleSimple exampleSimple) {
            m_exampleSimple = exampleSimple;
            m_position = new Vector3();
            m_color = new Color();
            m_gameObject = (GameObject)Instantiate(m_exampleSimple.prefabToSpawn, Vector3.zero, Quaternion.identity);
            PickGoal();
        }

        public void PickGoal() {
            m_position.x = m_exampleSimple.m_rand.Next(m_exampleSimple.areaWidth);
            m_position.z = m_exampleSimple.m_rand.Next(m_exampleSimple.areaHeight);
        }

        public void Update() {
            if ((Time.frameCount & 4) == 0) {
                m_color.r = 1.0f;
                m_color.g = 0.75f;
                m_color.b = 0.80f;
            } else {
                m_color.r = 1.0f;
                m_color.g = 0.0f;
                m_color.b = 0.0f;
            }

            m_gameObject.renderer.material.color = m_color;
            m_gameObject.transform.localPosition = m_position;
        }

        public bool IsHit(Vector3 otherPosition) {
            float dx = otherPosition.x - m_position.x;
            float dz = otherPosition.z - m_position.z;
            return dx * dx + dz * dz < m_radiusesSquared;
        }

        private ExampleSimple m_exampleSimple;
        private GameObject m_gameObject;
        private Vector3 m_position;
        private Color m_color;
        private float m_radiusesSquared = (15 * 15 * 2);
    }

    class Player {
        // Classes based on MessageCmdData are automatically registered for deserialization
        // by CmdName.
        [CmdName("color")]
        public class MessageColor : MessageCmdData {
            public string color;    // in CSS format rgb(r,g,b)
        };

        [CmdName("move")]
        public class MessageMove : MessageCmdData {
            public int x;
            public int y;
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

        public Player(NetPlayer netPlayer, ExampleSimple exampleSimple) {
            m_netPlayer = netPlayer;
            m_exampleSimple = exampleSimple;
            m_gameObject = null;
            m_position = new Vector3(m_exampleSimple.m_rand.Next(m_exampleSimple.areaWidth), 0, m_exampleSimple.m_rand.Next(m_exampleSimple.areaHeight));
            m_color = new Color(0.0f, 1.0f, 0.0f);

            // Setup events for the different messages.
            netPlayer.RegisterCmdHandler<MessageColor>(OnColor);
            netPlayer.RegisterCmdHandler<MessageMove>(OnMove);
        }

        public void Remove() {
            Destroy(m_gameObject);
            m_gameObject = null;
        }

        public void Update() {
            // We can't spawn game objects except during Start/Update
            if (m_gameObject == null) {
                m_gameObject = (GameObject)Instantiate(m_exampleSimple.prefabToSpawn, Vector3.zero, Quaternion.identity);
            }
        }

        // Check if this Player is associated with a particular NetPlayer.
        public bool IsNetPlayer(NetPlayer netPlayer) {
            return netPlayer == m_netPlayer;
        }

        private void OnColor(MessageColor data) {
            m_color = Style.ParseCSSColor(data.color);
            m_gameObject.renderer.material.color = m_color;
        }

        private void OnMove(MessageMove data) {
            m_position.x = data.x;
            m_position.z = m_exampleSimple.areaHeight - data.y - 1;  // because in 2D down is positive.

            m_gameObject.transform.localPosition = m_position;

            if (m_exampleSimple.HitGoal(m_position)) {
                m_netPlayer.SendCmd(new MessageScored(m_exampleSimple.m_rand.Next(5, 15)));
            }
        }

        private NetPlayer m_netPlayer;
        private ExampleSimple m_exampleSimple;
        private GameObject m_gameObject;
        private Vector3 m_position;
        private Color m_color;


        // TODO/FIX move to some utils class
    }

    class CheckNetPlayer {
        public CheckNetPlayer(NetPlayer netPlayer) {
            m_netPlayer = netPlayer;
        }

        public bool IsNetPlayer(Player player) {
            return player.IsNetPlayer(m_netPlayer);
        }

        private NetPlayer m_netPlayer;
    }

    bool HitGoal(Vector3 position) {
        bool hit = m_goal.IsHit(position);
        if (hit) {
            m_goal.PickGoal();
        }
        return hit;
    }

    // Use this for initialization
    void Start () {
        m_rand = new System.Random();
        m_players = new List<Player>();
        m_goal = new Goal(this);

        m_server = new GameServer(gameObject);
        m_server.Init();

        m_server.OnPlayerConnect += StartNewPlayer;
        m_server.OnPlayerDisconnect += RemovePlayer;
        m_server.OnConnect += Connected;
        m_server.OnDisconnect += Disconnected;
    }

    void StartNewPlayer(object sender, PlayerConnectMessageArgs e) {
        m_players.Add(new Player(e.netPlayer, this));
    }

    void RemovePlayer(object sender, PlayerDisconnectMessageArgs e) {
        // There's probably an easier anonymous function way to do this

        // First find the player so we can call remove
        foreach (Player player in m_players) {
            if (player.IsNetPlayer(e.netPlayer)) {
                player.Remove();
                break;
            }
        }

        // Now remove it from our list.
        m_players.RemoveAll(new CheckNetPlayer(e.netPlayer).IsNetPlayer);
    }

    void Connected(object sender, EventArgs e) {
    }

    void Disconnected(object sender, EventArgs e) {
    }

    void Cleanup() {
        if (m_server != null) {
            m_server.Close();
        }
    }

    void OnDestroy() {
        Cleanup();
    }

    void OnApplicationExit() {
        Cleanup();
    }

    void Update() {
        // Player's should probably be GameObjecs and have a script component that is doing this
        foreach (Player player in m_players) {
            player.Update();
        }
        m_goal.Update();
    }

    public System.Random m_rand;
    private Goal m_goal;
    private GameServer m_server;
    private List<Player> m_players;
}

}  // namespace HappyFunTimesExample

