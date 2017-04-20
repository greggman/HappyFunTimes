Title: 3d Characters
Description: How to control 3D characters with HappyFunTimes

Follow these steps

* Make a new project

  <img width="1000" height="570" src="images/3d-001-new-project.png" />

* Open the asset store

  <img width="212" height="336" src="images/3d-002-asset-store.png" />

* Download HappyFunTimes

  <img width="975" height="559" src="images/3d-003-dl-hft.png" />

* Import the standard character assets

  <img width="405" height="400" src="images/3d-004-import-characters.png" />

* Create an empty GameObject for a level manager

  <img width="245" height="583" src="images/3d-005-create-empty.png" />

* Rename it "LevelManager" and add a player spawner, then click the little circle
  on the far right of `prefab to spawn for player`

  <img width="357" height="516" src="images/3d-006-add-playerspanwer.gif" />

* Select the "ThirdPersonContoller" prefab (setting the `prefab to spawn for player`)

  <img width="486" height="682" src="images/3d-007-select-prefab.gif" />

* Select the prefab in the hierarchy, It's in `Assets/Standard Assets/Characters/ThirdPersonCharacter/Prefabs`.

  <img width="516" height="429" src="images/3d-008-edit-prefab.gif" />

* Add an `HFTInput` script to the prefab.

  <img width="357" height="582" src="images/3d-008b-add-hftinput.gif" />

* Select the `ThirdPersonUserControl` script in `Assets/Standard Assets/Characters/ThirdPersonCharacter/Scripts`.

  <img width="712" height="432" src="images/3d-009-select-script.gif" />

* Duplicate it (Cmd-D / Ctrl-D or Edit->Duplicate from the menus), Rename it `ThirdPersonUserControlHFT`,
  and move it to the `Asset` folder (or somewhere outside of Standard Assets)

  <img width="826" height="431" src="images/3d-010-dup-script.gif" />

* Edit the script (see [the gamepad docs](gamepad.html))

  The steps are

     1.  rename it `ThirdPersonUserControllerHFT`
     2.  add a `private HFTInput m_hftInput;`
     3.  In `Start` set `m_hftInput = GetComponent<HFTInput>();`;
     4.  In `Update` check for `m_hftInput.GetButtonDown("fire1");`
     5.  In `FixedUpdate` add in `+ m_hftInput.GetAxis("Horizontal")` and
         `- m_hftInput.GetAxis("Vertical")`
     6.  Also add `m_hftInput.GetButton("fire2")` to the crouch check

  <img width="643" height="353" src="images/3d-011-edit-script.gif" />

* Select the prefab again

  <img width="486" height="682" src="images/3d-007-select-prefab.gif" />

* Delete the `ThirdPersonUserControl` script on the prefab, and
  add the `ThirdPersonUserControlHFT` script on the prefab

  <img width="355" height="581" src="images/3d-012-replace-script.gif" />

* Create a Plane GameObject

  <img width="355" height="481" src="images/3d-013-create-plane.png" />

* Add a Box Collider

  <img width="400" height="435" src="images/3d-014-add-box-collider.png" />

* Set the Box center and size. center = `x:0, y:-0.5, z:0`, size = `x:10, y:1, z:10`

  <img width="369" height="123" src="images/3d-015-set-box-size.gif" />

* Run it

  <img width="789" height="483" src="images/3d-016-run.gif" />

Hopefully that shows how simple it is to get started.



