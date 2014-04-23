#pragma strict

public var targetSpeed : float = 0.001f;
public var positionSpeed : float = 0.001f;
public var minBBSize : float = 6.0f;
public var fovExtra : float = -10.0f;

private var _startingPosition : Vector3;

class PlayerInfo extends System.Object {
  var player : GameObject;
  var deltaAngle: float;
};

class PlayerInfoComparer implements IComparer {
  function Compare(x:PlayerInfo, y:PlayerInfo) : int {
    if (x.deltaAngle < y.deltaAngle) return -1;
    return x.deltaAngle > y.deltaAngle ? 1 : 0;
  }

  function Compare(a : Object, b : Object) : int {
    return Compare(a as PlayerInfo, b as PlayerInfo);
  }
};

private var _comparer : PlayerInfoComparer = new PlayerInfoComparer();
private var _playerInfos : PlayerInfo[];
private var _target : Vector3 = new Vector3(0,0,0);

function wrapAngle(a : float) : float {
    if (a < -System.Math.PI) {
        return a + System.Math.PI * 2.0f;
    }
    if (a > System.Math.PI) {
        return a - System.Math.PI * 2.0f;
    }
    return a;
};

function Start () {
    _startingPosition = transform.position;
}

function LateUpdate () {
    // walk over all the players.
    var players : GameObject[];
    players = GameObject.FindGameObjectsWithTag("NetPlayers");
    if (players.length == 0) {
      return;
    }

    if (_playerInfos == null || _playerInfos.Length != players.length) {
      _playerInfos = new PlayerInfo[players.Length];
      for (var pp : int = 0; pp < players.Length; ++pp) {
        _playerInfos[pp] = new PlayerInfo();
      }
    }

    var fov : float = Camera.main.fieldOfView * System.Math.PI / 180.0f;
    var cameraDir : float = transform.eulerAngles.y * System.Math.PI / 180.0f;

    for (var ii : int = 0; ii < players.Length; ++ii) {
      var player = players[ii];
      var info : PlayerInfo = _playerInfos[ii];
      info.player = player;

      var delta : Vector3 = player.transform.position - transform.position;
      var realAngle : float = System.Math.Atan2(delta.x, delta.z);
      info.deltaAngle = wrapAngle(realAngle - cameraDir);
    }

    _playerInfos.Sort(_playerInfos, _comparer);

    var p0 : Vector3 = _playerInfos[0].player.transform.position;
    var p1 : Vector3 = _playerInfos[_playerInfos.Length - 1].player.transform.position;

    var center : Vector3 = (p0 + p1) * 0.5f;
    var bbSize : float = Vector3.Distance(p0, p1);
    var desiredDistFromBBCenter : float = (bbSize / 2.0f) / System.Math.Tan((fov + fovExtra * System.Math.PI / 180) / 2.0f);
    desiredDistFromBBCenter = System.Math.Max(minBBSize, desiredDistFromBBCenter);

    var direction : Vector3 = new Vector3(p0.z - p1.z, 0.0f, -(p0.x - p1.x)).normalized;
    if (direction.magnitude < 0.00001f) {
      var perpDir : Vector3 = (transform.position - center).normalized;
      direction.x = perpDir.x;
      direction.y = 0.0f;
      direction.z = perpDir.y;
      //direction = (transform.position - center).normalized;
      //direction.y = 0.0f;
    }

    var desiredPosition : Vector3 = center + direction * -desiredDistFromBBCenter;

    _target = Vector3.Lerp(_target, center, targetSpeed);
    var targetDelta : Vector3 = _target - transform.position;
    var rotation : Quaternion = new Quaternion();
    rotation.SetLookRotation(targetDelta);
    transform.localRotation = rotation;

    desiredPosition.y = _startingPosition.y;
    var newPosition : Vector3 = Vector3.Lerp(transform.position, desiredPosition, positionSpeed);
    transform.localPosition = newPosition;
}
