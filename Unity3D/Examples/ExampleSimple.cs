using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;
using HappyFunTimes;
using CSSParse;

namespace HappyFunTimesExample {

public class ExampleSimple : MonoBehaviour {

    public GameObject prefabToSpawnForPlayer;

    // Use this for initialization
    void Start () {
        m_rand = new System.Random();

        GameServer.Options options = new GameServer.Options();
        options.gameId = "simple";
        options.controllerUrl = "http://localhost:8080/examples/simple/index.html";
        m_server = new GameServer(options, gameObject);
        m_server.Init();

        m_server.OnPlayerConnect += StartNewPlayer;
        m_server.OnConnect += Connected;
        m_server.OnDisconnect += Disconnected;
    }

    void StartNewPlayer(object sender, PlayerConnectMessageArgs e) {
        ExampleSimpleGameSettings settings = ExampleSimpleGameSettings.settings();
        Vector3 position = new Vector3(m_rand.Next(settings.areaWidth), 0, m_rand.Next(settings.areaHeight));
        // Spawn a new player then add a script to it.
        GameObject gameObject = (GameObject)Instantiate(prefabToSpawnForPlayer, position, Quaternion.identity);
        // Add the ExampleSimplePlayer script to this object. Note: We could possible add this to the prefab.
        // Not sure which is best.
        ExampleSimplePlayer player = gameObject.AddComponent<ExampleSimplePlayer>();
        player.Init(e.netPlayer);
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

    public System.Random m_rand;
    private GameServer m_server;
}

}  // namespace HappyFunTimesExample

