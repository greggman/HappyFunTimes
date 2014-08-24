
public var prefabToSpawnForPlayer : GameObject;

private var m_rand : System.Random;
private var m_server : HappyFunTimes.GameServer;
private var m_count : int = 0;

// Use this for initialization
function Start () {
    m_rand = new System.Random();

    var options : HappyFunTimes.GameServer.Options = new HappyFunTimes.GameServer.Options();
    options.gameId = "unitycharacterexample";
    options.controllerUrl = "http://localhost:8080/examples/unitycharacterexample/index.html";
    m_server = new HappyFunTimes.GameServer(options, gameObject);
    m_server.Init();

    m_server.OnPlayerConnect += StartNewPlayer;
    m_server.OnConnect += Connected;
    m_server.OnDisconnect += Disconnected;
}

function StartNewPlayer(sender, e : HappyFunTimes.PlayerConnectMessageArgs) {
    //ExampleSimpleGameSettings settings = ExampleSimpleGameSettings.settings();
    var x = m_rand.Next(-10, 10);
    var y = 1.0f; // puts him above ground
    var z = m_rand.Next(-10, 10);
    var position : Vector3 = new Vector3(x, y, z);
    // Spawn a new player then add a script to it.
    var gameObject : GameObject = Instantiate(prefabToSpawnForPlayer, position, Quaternion.identity);
    // Get the Example3rdPersonController script to this object.
    var player : Example3rdPersonController = gameObject.GetComponent(Example3rdPersonController);
    player.Init(e.netPlayer, "Player" + (++m_count));
}

function Connected(sender, e : System.EventArgs) {
}

function Disconnected(sender, e : System.EventArgs) {
}

function Cleanup() {
    if (m_server) {
        m_server.Close();
        m_server = null;
    }
}

function OnDestroy() {
    Cleanup();
}

function OnApplicationExit() {
    Cleanup();
}


