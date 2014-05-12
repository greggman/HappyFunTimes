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
"use strict";

define([
    '../../scripts/gamebutton',
    '../../scripts/imageprocess',
    '../../scripts/input',
    '../../scripts/misc',
    './bomb',
  ], function(
    GameButton,
    ImageProcess,
    Input,
    Misc,
    Bomb) {

  var availableColors = [];
  var nameFontOptions = {
    font: "40px sans-serif",
    yOffset: 36,
    height: 44,
    fillStyle: "white",
    backgroundColor: "rgba(0,0,0,0.5)",
  };

  //    2     -1 = not pressed
  //  3 | 1
  //   \|/
  // 4--+--0
  //   /|\
  //  5 | 7
  //    6
  var walkAnim = ['avatarWalkR0', 'avatarWalkR1', 'avatarWalkR2', 'avatarWalkR1'];
  var directionInfo = [
    { /* 0 right */
      dx:  1,
      dy:  0,
      hflip: false,
      anims: {
        idle: 'avatarStandR',
        walk: walkAnim,
      },
      noChangeDirs: [],
    },
    { /* 1 right up*/
      dx:  1,
      dy: -1,
      hflip: false,
      anims: {
        idle: 'avatarStandR',
        walk: walkAnim,
      },
      noChangeDirs: [0, 2],
    },
    { /* 2 up */
      dx:  0,
      dy: -1,
      hflip: false,
      anims: {
        idle: 'avatarStandU',
        walk: ['avatarWalkU0', 'avatarWalkU1'],
      },
      noChangeDirs: [],
    },
    { /* 3 left up */
      dx: -1,
      dy: -1,
      hflip: true,
      anims: {
        idle: 'avatarStandR',
        walk: walkAnim,
      },
      noChangeDirs: [2, 4],
    },
    { /* 4 left */
      dx: -1,
      dy:  0,
      hflip: true,
      anims: {
        idle: 'avatarStandR',
        walk: walkAnim,
      },
      noChangeDirs: [],
    },
    { /* 5 left down */
      dx: -1,
      dy:  1,
      hflip: true,
      anims: {
        idle: 'avatarStandR',
        walk: walkAnim,
      },
      noChangeDirs: [4, 6],
    },
    { /* 6 down */
      dx:  0,
      dy:  1,
      hflip: false,
      anims: {
        idle: 'avatarStandD',
        walk: ['avatarWalkD0', 'avatarWalkD1'],
      },
      noChangeDirs: [],
    },
    { /* 7 right down */
      dx:  1,
      dy:  1,
      hflip: false,
      anims: {
        idle: 'avatarStandR',
        walk: walkAnim,
      },
      noChangeDirs: [0, 6],
    },
  ];

  var moveInfoTable = [
    { dxMult: 1, dyMult: 0, xOffset: 1, yOffset: 0, }, // row
    { dxMult: 0, dyMult: 1, xOffset: 0, yOffset: 1, }, // col
  ];

  var freeBombs = [];
  var getBomb = function(services) {
    if (freeBombs.length) {
      return freeBombs.pop();
    }
    return new Bomb(services);
  };

  var putBomb = function(bomb) {
    bomb.reset();
    freeBombs.push(bomb);
  };

  /**
   * Player represents a player in the game.
   * @constructor
   */
  var Player = (function() {
    return function(services, position, name, netPlayer) {
      this.services = services;
      this.renderer = services.renderer;
      this.roundsPlayed = 0;
      this.wins = 0;

      // add the button before the player so it will get
      // processed first.
      this.abutton = new GameButton(services.entitySystem);

      services.entitySystem.addEntity(this);
      services.drawSystem.addEntity(this);
      this.netPlayer = netPlayer;
      this.position = position;

      if (availableColors.length == 0) {
        var avatar = this.services.images.avatar;
        for (var ii = 0; ii < 64; ++ii) {
          availableColors.push({
            hsv: [ii % 16 / 16, 0, 0, 0],
            set: ii / 16 | 0,
          });
        }
      }

      this.nameTextures = {
      };

      this.color = availableColors[Math.floor(Math.random() * availableColors.length)];
      availableColors.splice(this.color, 1);
      this.sendCmd('setColor', this.color);
      this.setName(name);

      this.imageSet = this.services.images.avatar[this.color.set];

      var images = this.services.images;

      this.textures = {
        u_texture: this.imageSet.avatarStandU,
      };

      netPlayer.addEventListener('disconnect', Player.prototype.handleDisconnect.bind(this));
      netPlayer.addEventListener('pad', Player.prototype.handlePadMsg.bind(this));
      netPlayer.addEventListener('abutton', Player.prototype.handleAButtonMsg.bind(this));
      netPlayer.addEventListener('show', Player.prototype.handleShowMsg.bind(this));
      netPlayer.addEventListener('setName', Player.prototype.handleNameMsg.bind(this));
      netPlayer.addEventListener('busy', Player.prototype.handleBusyMsg.bind(this));

      this.setState('waiting');
    };
  }());

  Player.prototype.reset = function(x, y) {
    var globals = this.services.globals;
    while (this.bombs && this.bombs.length) {
      putBomb(this.bombs.pop());
    }
    this.setPosition(x, y);
    this.sprite = this.services.spriteManager.createSprite();
    this.sprite.uniforms.u_hsvaAdjust = this.color.hsv.slice();
    this.nameSprite = this.services.spriteManager.createSprite();
    this.inRow = true; // false = in column
    this.playing = true;
    this.alive = true;
    this.display = true;
    this.scale = 1;
    this.rotation = 0;
    this.animTimer = 0;
    this.bombs = [];
    for (var ii = 0; ii < globals.numStartingBombs; ++ii) {
      this.bombs.push(getBomb(this.services));
    }
    this.bombSize = globals.bombStartSize;
    this.haveKick = false;
    this.setFacing(6);
    this.setAnimFrame(this.anims.idle);
    this.direction = -1;  // direction player is pressing.
    this.setState('start');

//if (!window.bombs) {
//  window.bombs = true;
//  setTimeout(function() { this.tryPlaceBomb( 1, 1); }.bind(this),  250);
//  setTimeout(function() { this.tryPlaceBomb( 3, 1); }.bind(this),  500);
//  setTimeout(function() { this.tryPlaceBomb( 5, 1); }.bind(this),  750);
//  setTimeout(function() { this.tryPlaceBomb(15, 1); }.bind(this), 1000);
//  setTimeout(function() { this.tryPlaceBomb( 3, 3); }.bind(this), 1250);
//}

  };

  Player.prototype.reportDied = function() {
    if (this.alive) {
      this.alive = false;
      this.services.playerManager.playerDied();
    }
  };

  Player.prototype.setBombSize = function(size) {
    var levelManager = this.services.levelManager;
    var maxSize = Math.max(levelManager.tilesAcross, levelManager.tilesDown);
    this.bombSize = Math.min(maxSize, size);
  };

  Player.prototype.returnBomb = function(bomb) {
    this.bombs.push(bomb);
  };

  Player.prototype.setAnimFrame = function(name) {
    this.textures.u_texture = this.imageSet[name];
  };

  Player.prototype.setFacing = function(direction) {
    var oldFacing = this.facing;
    this.facing = direction;
    this.facingInfo = directionInfo[direction];
    this.hflip = this.facingInfo.hflip;
    if (this.facingInfo.noChangeDirs.indexOf(oldFacing) < 0) {
      this.anims = this.facingInfo.anims;
    }
  };

  Player.prototype.validatePosition = function() {
    var levelManager = this.services.levelManager;
    var tileWidth  = 16;
    var tileHeight = 16;
    var tx = this.position[0] / tileWidth  | 0;
    var ty = this.position[1] / tileHeight | 0;
    if (tx < 1 || ty < 1 || tx > levelManager.tilesAcross - 2 || ty > levelManager.tilesDown - 2) {
      throw 'bad position';
    }

  };

  Player.prototype.setPosition = function(x, y) {
    this.position[0] = x;
    this.position[1] = y;
    this.validatePosition();
  };

  Player.prototype.sendWinner = function() {
    this.sendCmd('winner');
  };

  Player.prototype.sendTied = function() {
    this.sendCmd('tied');
  };

  Player.prototype.deleteNameImage = function() {
    if (this.nameTextures.u_texture) {
      this.nameTextures.u_texture.destroy();
      delete this.nameTextures.u_texture;
    }
  };

  Player.prototype.setName = function(name) {
    if (name != this.playerName) {
      this.playerName = name;
      this.deleteNameImage();
      this.nameTextures.u_texture = this.services.createTexture(
          ImageProcess.makeTextImage(name, nameFontOptions));
    }
  };

  Player.prototype.setState = function(state) {
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
  };

  Player.prototype.removeFromGame = function() {
    this.reportDied();
    this.deleteNameImage();
    this.services.entitySystem.removeEntity(this);
    this.services.drawSystem.removeEntity(this);
    this.services.playerManager.removePlayer(this);
    this.services.spriteManager.deleteSprite(this.sprite);
    this.services.spriteManager.deleteSprite(this.nameSprite);
    this.abutton.destroy();
    availableColors.push(this.color);
  };

  Player.prototype.handleDisconnect = function() {
    this.removeFromGame();
  };

  Player.prototype.handleBusyMsg = function(msg) {
    // We ignore this message
  };

  Player.prototype.handlePadMsg = function(msg) {
    this.direction = msg.dir;
    if (this.direction >= 0) {
      this.setFacing(this.direction);
    }
  };

  Player.prototype.handleAButtonMsg = function(msg) {
    this.abutton.setState(msg.abutton);
  };

  Player.prototype.handleShowMsg = function(msg) {
    this.userRequestShowName = msg.show;
  };


  Player.prototype.handleNameMsg = function(msg) {
    if (!msg.name) {
      this.sendCmd('setName', {
        name: this.playerName
      });
    } else {
     this.setName(msg.name.replace(/[<>]/g, ''));
    }
  };

  Player.prototype.checkBombPlace = function() {
    if (!this.abutton.justOn()) {
      return;
    }
    var tileWidth = 16;
    var tileHeight = 16;
    var tx = (this.position[0] + tileWidth  * 0.5 * this.facingInfo.dx) / tileWidth  | 0;
    var ty = (this.position[1] + tileHeight * 0.5 * this.facingInfo.dy) / tileHeight | 0;
    if (!this.tryPlaceBomb(tx, ty)) {
      tx = this.position[0] / tileWidth  | 0;
      ty = this.position[1] / tileHeight | 0;
      this.tryPlaceBomb(tx, ty);
    }
  };

  Player.prototype.tryPlaceBomb = function(tx, ty) {
    if (!this.bombs.length) {
      return;
    }
    var levelManager = this.services.levelManager;
    var tile = levelManager.layer1.getTile(tx, ty);
    var tileInfo = levelManager.getTileInfo(tile);

    if (!tileInfo.info.bombOk) {
      return;
    }

    this.services.audioManager.playSound('placeBomb');
    var bomb = this.bombs.pop();
    bomb.place(this, tx, ty, this.bombSize);
    return true;
  };

  Player.prototype.restoreBomb = function(bomb) {
    this.bombs.push(bomb);
  };

  Player.prototype.sendCmd = function(cmd, data) {
    this.netPlayer.sendCmd(cmd, data);
  };

  Player.prototype.checkForDeath = function() {
    // Need to check if we're standing on death.
    // Could be 1 of 2 tiles (or is it 4?). I think
    // as long as there are no open areas it's 2.

    // For now let's just check the center and see
    // how it feels.
    var tileWidth = 16;
    var tileHeight = 16;
    var tx = (this.position[0]) / tileWidth  | 0;
    var ty = (this.position[1]) / tileHeight | 0;
    var levelManager = this.services.levelManager;
    var tile = levelManager.layer1.getTile(tx, ty);
    var tileInfo = levelManager.getTileInfo(tile);
    if (tileInfo.info.flame) {
      this.setState('die');
      return true;
    }

    // Lets check for powerups here too?
    var crateType = tileInfo.info.crateType;
    if (crateType) {
      levelManager.layer1.setTile(tx, ty, levelManager.tiles.empty.id);
      switch (crateType) {
      case 'gold':
        this.setBombSize(10000);
        break;
      case 'kick':
        this.haveKick = true;
        break;
      case 'bomb':
        this.bombs.push(getBomb(this.services));
        break;
      case 'flame':
        this.setBombSize(this.bombSize + 1);
        break;
      }
    }


  };

  // This state is when the round has finished.
  // Show the character but don't update anything.
  Player.prototype.init_end = function() {
  };

  Player.prototype.state_end = function() {
  };

  // This state is when you're waiting to join a game.
  // Don't show any characters.
  Player.prototype.init_waiting = function() {
    this.display = false;
    this.alive = false;
    this.sendCmd('waitForNextGame'); //??
  };

  Player.prototype.state_waiting = function() {
  };

  // This state is just before the game has started
  Player.prototype.init_start = function() {
    // player.reset will have just been called.
    this.showName = true;
    this.sendCmd('start');
  };

  Player.prototype.state_start = function() {
  };

  Player.prototype.init_idle = function() {
    this.showName = false;
  };

  Player.prototype.state_idle = function() {
    this.setAnimFrame(this.anims.idle);
    if (this.checkForDeath()) {
      return;
    }
    this.checkBombPlace();
    if (this.direction >= 0) {
      this.setState('walk');
    }
  };

  Player.prototype.init_walk = function() {
    this.animTimer = 0;
  };

  Player.prototype.state_walk = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;
    this.animTimer += globals.walkAnimSpeed;
    this.setAnimFrame(this.anims.walk[(this.animTimer | 0) % this.anims.walk.length]);

    if (this.direction < 0) {
      this.setState('idle');
      return;
    }

    // we're either in a column, row, or at an intersection
    var tileWidth  = 16;
    var tileHeight = 16;

    var tx = this.position[0] / tileWidth  | 0;
    var ty = this.position[1] / tileHeight | 0;
    var inCol = tx % 2 == 1;
    var inRow = ty % 2 == 1;
    var inIntersection = inRow && inCol;

    var dx = this.facingInfo.dx;
    var dy = this.facingInfo.dy;

    var moveDX = dx * globals.walkSpeed * globals.elapsedTime;
    var moveDY = dy * globals.walkSpeed * globals.elapsedTime;

    //      col
    //       |
    // _____/ \______row
    //      \ /
    //       |
    //

    var centerOfTileX = tx * tileWidth  + tileWidth  / 2;
    var centerOfTileY = ty * tileHeight + tileHeight / 2;
    var dxFromCenterOfTile = centerOfTileX - this.position[0];
    var dyFromCenterOfTile = centerOfTileY - this.position[1];

    var centerOfCol = (tx - (tx % 2) + 1.5) * tileWidth;
    var centerOfRow = (ty - (ty % 2) + 1.5) * tileHeight;
    var dxFromCenterOfCol = centerOfCol - this.position[0];
    var dyFromCenterOfRow = centerOfRow - this.position[1];

    var targetCol = ((this.position[0] - tileWidth  / 2) / tileWidth  | 0) & 0xFFFE;
    var targetRow = ((this.position[1] - tileHeight / 2) / tileHeight | 0) & 0xFFFE;
    var centerOfTargetCol = (targetCol + 1.5) * tileWidth;
    var centerOfTargetRow = (targetRow + 1.5) * tileHeight;
    var dxFromCenterOfTargetCol = centerOfTargetCol - this.position[0];
    var dyFromCenterOfTargetRow = centerOfTargetRow - this.position[1];

    // This seems fucking rediculous to me. I'm missing the simple solution
    // stairing me in the face :(
    if (this.inRow) {
      if (!moveDX && moveDY) {
        var t = Math.abs(moveDY) * Misc.sign(dxFromCenterOfTargetCol);
        moveDX = Misc.minToZero(dxFromCenterOfTargetCol, t);
      }
      if (moveDY) {
        var newX = this.position[0] + moveDX;
        var newDxFromCenterOfCol = centerOfCol - newX;
        if (dxFromCenterOfCol == 0 || Misc.sign(newDxFromCenterOfCol) != Misc.sign(dxFromCenterOfCol)) {
          moveDX = dxFromCenterOfCol;
          this.inRow = false;
        } else {
          moveDY = 0;
        }
      }
    } else {
      if (!moveDY && moveDX) {
        var t = Math.abs(moveDX) * Misc.sign(dyFromCenterOfTargetRow);
        moveDY = Misc.minToZero(dyFromCenterOfTargetRow, t);
      }
      if (moveDX) {
        var newY = this.position[1] + moveDY;
        var newDyFromCenterOfRow = centerOfRow - newY;
        if (dyFromCenterOfRow == 0 || Misc.sign(newDyFromCenterOfRow) != Misc.sign(dyFromCenterOfRow)) {
          moveDY = dyFromCenterOfRow;
          this.inRow = true;
        } else {
          moveDX = 0;
        }
      }
    }

    var newX = this.position[0] + moveDX;
    var newY = this.position[1];

    if (moveDX) {
      var tileX = newX + tileWidth  / 2 * Misc.sign(moveDX);
      var tileY = newY;
      var tile = levelManager.layer1.getTileByPixels(tileX, tileY);
      var tileInfo = levelManager.getTileInfo(tile);
      if (tileInfo.info.solid) {
        // Where ever we were standing was safe so don't move us back further than that.
        // This will allow us to walk off a bomb?
        moveDX = (Misc.sign(dxFromCenterOfTile) == Misc.sign(moveDX)) ? dxFromCenterOfTile : 0;
      }
    }

    newX = this.position[0] + moveDX;
    newY = this.position[1] + moveDY;

    if (moveDY) {
      var tileX = newX;
      var tileY = newY + tileHeight / 2 * Misc.sign(moveDY);
      var tile = levelManager.layer1.getTileByPixels(tileX, tileY);
      var tileInfo = levelManager.getTileInfo(tile);
      if (tileInfo.info.solid) {
        // Where ever we were standing was safe so don't move us back further than that.
        // This will allow us to walk off a bomb?
        moveDY = (Misc.sign(dyFromCenterOfTile) == Misc.sign(moveDY)) ? dyFromCenterOfTile : 0;
      }
    }

    var newX = this.position[0] + moveDX;
    var newY = this.position[1] + moveDY;

    this.position[0] = newX;
    this.position[1] = newY;

this.validatePosition();


    if (this.checkForDeath()) {
      return;
    }

    this.checkBombPlace();
  };

  Player.prototype.init_die = function() {
    this.services.audioManager.playSound('die');
    this.sendCmd('died');
    this.reportDied();
    this.dieTimer = 0;
  };

  Player.prototype.state_die = function() {
    var globals = this.services.globals;
    this.sprite.uniforms.u_hsvaAdjust[0] += globals.dieColorSpeed * globals.elapsedTime;
    this.sprite.uniforms.u_hsvaAdjust[2] = (globals.frameCount & 2) ? 1 : 0;
    this.rotation += globals.dieRotationSpeed * globals.elapsedTime;
    this.dieTimer += globals.elapsedTime;
    if (this.dieTimer >= globals.dieDuration) {
      this.setState('evaporate');
    }
  };

  Player.prototype.init_evaporate = function() {
    this.dieTimer = 0;
  };

  Player.prototype.state_evaporate = function() {
    var globals = this.services.globals;
    this.sprite.uniforms.u_hsvaAdjust[0] += globals.dieColorSpeed * globals.elapsedTime;
    this.sprite.uniforms.u_hsvaAdjust[2] = (globals.frameCount & 2) ? 1 : 0;
    this.rotation += globals.dieRotationSpeed * globals.elapsedTime;
    this.scale += globals.dieScaleSpeed * globals.elapsedTime;
    this.dieTimer += globals.elapsedTime;
    var a = this.dieTimer / globals.evaporateDuration;
    this.sprite.uniforms.u_hsvaAdjust[3] = -a;
    if (this.dieTimer >= globals.evaporateDuration) {
      this.setState('dead');
    }
  };

  Player.prototype.init_dead = function() {
    this.display = false;
  };

  Player.prototype.state_dead = function() {
  };

  Player.prototype.draw = function(renderer) {
    if (!this.display) {
      return;
    }
    var globals = this.services.globals;
    var images = this.services.images;
    var spriteRenderer = this.services.spriteRenderer;
    var off = {};
    this.services.levelManager.getDrawOffset(off);

    var scale  = globals.scale * this.scale;
    var width  = 16 * scale;
    var height = 16 * scale;

    var sprite = this.sprite;
    sprite.uniforms.u_texture = this.textures.u_texture;
    sprite.x = off.x + this.position[0] * globals.scale;
    sprite.y = off.y + this.position[1] * globals.scale;
    sprite.width = width;
    sprite.height = height;
    sprite.rotation = this.rotation;
    sprite.xScale = this.hflip ? -1 : 1;

    if (!this.hideName && (this.showName || this.userRequestShowName)) {
      var nameSprite = this.nameSprite;
      var width  = this.nameTextures.u_texture.img.width  / 4;
      var height = this.nameTextures.u_texture.img.height / 4;
      var x = off.x + this.position[0] * globals.scale;
      var y = off.y + (this.position[1] - height - 2) * globals.scale

      width  *= globals.scale;
      height *= globals.scale;

      nameSprite.uniforms.u_texture = this.nameTextures.u_texture;
      nameSprite.x = x,
      nameSprite.y = y,
      nameSprite.width = width,
      nameSprite.height = height,
      nameSprite.visible = true;
    } else {
      this.nameSprite.visible = false;
    }
  };

  return Player;
});

