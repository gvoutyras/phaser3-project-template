import Phaser from "phaser";

var config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 1600,
  height: 1200,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
    extend: {
      // player: null,
      // healthpoints: null,
      // reticle: null,
      // moveKeys: null,
      // playerBullets: null,
      // enemyBullets: null,
      // time: 0,
    },
  },
};

let player = null,
  healthpoints = null,
  reticle = null,
  moveKeys = null,
  playerBullets = null,
  enemyBullets = null,
  time = 0,
  enemy = null,
  hp1,
  hp2,
  hp3,
  camera;

let platforms;

var game = new Phaser.Game(config);

var keyQ;

var Bullet = new Phaser.Class({
  Extends: Phaser.GameObjects.Image,

  initialize:
    // Bullet Constructor
    function Bullet(scene) {
      Phaser.GameObjects.Image.call(this, scene, 0, 0, "bullet");
      this.speed = 1;
      this.born = 0;
      this.direction = 0;
      this.xSpeed = 0;
      this.ySpeed = 0;
      this.setSize(12, 12, true);
    },

  // Fires a bullet from the player to the reticle
  fire: function (shooter, target) {
    this.setPosition(shooter.x, shooter.y); // Initial position
    this.direction = Math.atan((target.x - this.x) / (target.y - this.y));

    // Calculate X and y velocity of bullet to moves it from shooter to target
    if (target.y >= this.y) {
      this.xSpeed = this.speed * Math.sin(this.direction);
      this.ySpeed = this.speed * Math.cos(this.direction);
    } else {
      this.xSpeed = -this.speed * Math.sin(this.direction);
      this.ySpeed = -this.speed * Math.cos(this.direction);
    }

    this.rotation = shooter.rotation; // angle bullet with shooters rotation
    this.born = 0; // Time since new bullet spawned
  },

  // Updates the position of the bullet each cycle
  update: function (time, delta) {
    this.x += this.xSpeed * delta;
    this.y += this.ySpeed * delta;
    this.born += delta;
    if (this.born > 1800) {
      this.setActive(false);
      this.setVisible(false);
    }
  },
});

function preload() {
  // Load in images and sprites
  this.load.spritesheet("player_handgun", "./src/assets/player_handgun.png", {
    frameWidth: 66,
    frameHeight: 60,
  }); // Made by tokkatrain: https://tokkatrain.itch.io/top-down-basic-set
  this.load.image("bullet", "./src/assets/bullet6.png");
  this.load.image("target", "./src/assets/ball.png");
  this.load.image("background", "./src/assets/uv-grid-4096-ian-maclachlan.png");
  this.load.image("ground", "./src/assets/platform.png");
}

function create() {
  camera = this.cameras.main.setBounds(0, 0, 1600 * 2, 1200 * 2);
  this.physics.world.setBounds(0, 0, 1600 * 2, 1200 * 2);

  this.add.image(0, 0, "background").setOrigin(0);
  this.add.image(1920, 0, "background").setOrigin(0).setFlipX(true);
  this.add.image(0, 1080, "background").setOrigin(0).setFlipY(true);
  this.add
    .image(1920, 1080, "background")
    .setOrigin(0)
    .setFlipX(true)
    .setFlipY(true);

  // Add 2 groups for Bullet objects
  playerBullets = this.physics.add.group({
    classType: Bullet,
    runChildUpdate: true,
  });

  platforms = this.physics.add.staticGroup();

  platforms.create(400, 568, "ground").setScale(2).refreshBody();

  platforms.create(600, 400, "ground");
  platforms.create(50, 250, "ground");
  platforms.create(750, 220, "ground");

  player = this.physics.add.sprite(800, 600, "player_handgun");
  reticle = this.physics.add.sprite(800, 700, "target");
  player
    .setOrigin(0.5, 0.5)
    .setDisplaySize(132, 120)
    .setCollideWorldBounds(true);
  reticle
    .setOrigin(0.5, 0.5)
    .setDisplaySize(25, 25)
    .setCollideWorldBounds(true);

  this.physics.add.collider(player, platforms);

  // Set camera properties
  this.cameras.main.zoom = 0.5;
  this.cameras.main.startFollow(player);

  // Pointer lock will only work after mousedown
  game.canvas.addEventListener("mousedown", function () {
    game.input.mouse.requestPointerLock();
  });

  // Move reticle upon locked pointer move
  this.input.on(
    "pointermove",
    function (pointer) {
      if (this.input.mouse.locked) {
        reticle.x += pointer.movementX;
        reticle.y += pointer.movementY;
      }
    },
    this
  );

  this.input.mouse.disableContextMenu();

  //#region Fire Bullet on Q
  /**
   * Fire bullet on Q press
   */
  this.input.keyboard.on("keydown-Q", () => {
    if (player.active === false) return;

    // Get bullet from bullets group
    var bullet = playerBullets.get().setActive(true).setVisible(true);

    if (bullet) {
      bullet.fire(player, reticle);
      return;
      // this.physics.add.collider(enemy, bullet, enemyHitCallback);
    }
  });
  //#endregion
}

function enemyHitCallback(enemyHit, bulletHit) {
  // Reduce health of enemy
  if (bulletHit.active === true && enemyHit.active === true) {
    enemyHit.health = enemyHit.health - 1;
    console.log("Enemy hp: ", enemyHit.health);

    // Kill enemy if health <= 0
    if (enemyHit.health <= 0) {
      enemyHit.setActive(false).setVisible(false);
    }

    // Destroy bullet
    bulletHit.setActive(false).setVisible(false);
  }
}

function playerHitCallback(playerHit, bulletHit) {
  // Reduce health of player
  if (bulletHit.active === true && playerHit.active === true) {
    playerHit.health = playerHit.health - 1;
    console.log("Player hp: ", playerHit.health);

    // Kill hp sprites and kill player if health <= 0
    if (playerHit.health == 2) {
      hp3.destroy();
    } else if (playerHit.health == 1) {
      hp2.destroy();
    } else {
      hp1.destroy();
      // Game over state should execute here
    }

    // Destroy bullet
    bulletHit.setActive(false).setVisible(false);
  }
}

// Ensures sprite speed doesnt exceed maxVelocity while update is called
function constrainVelocity(sprite, maxVelocity) {
  if (!sprite || !sprite.body) return;

  var angle, currVelocitySqr, vx, vy;
  vx = sprite.body.velocity.x;
  vy = sprite.body.velocity.y;
  currVelocitySqr = vx * vx + vy * vy;

  if (currVelocitySqr > maxVelocity * maxVelocity) {
    angle = Math.atan2(vy, vx);
    vx = Math.cos(angle) * maxVelocity;
    vy = Math.sin(angle) * maxVelocity;
    sprite.body.velocity.x = vx;
    sprite.body.velocity.y = vy;
  }
}

// Ensures reticle does not move offscreen
function constrainReticle(reticle) {
  var distX = reticle.x - player.x; // X distance between player & reticle
  var distY = reticle.y - player.y; // Y distance between player & reticle

  // Ensures reticle cannot be moved offscreen (player follow)
  if (distX > 800) reticle.x = player.x + 800;
  else if (distX < -800) reticle.x = player.x - 800;

  if (distY > 600) reticle.y = player.y + 600;
  else if (distY < -600) reticle.y = player.y - 600;
}

function update(time, delta) {
  let wasReleased = true;
  // Rotates player to face towards reticle
  player.rotation = Phaser.Math.Angle.Between(
    player.x,
    player.y,
    reticle.x,
    reticle.y
  );

  this.input.on(
    "pointerdown",
    (pointer) => {
      if (pointer.rightButtonDown()) {
        player.setVelocity(500);
        this.physics.moveToObject(player, reticle, 1000);
      }
      // if (pointer.leftButtonDown()) {
      //   if (player.active === false) return;

      //   // Get bullet from bullets group
      //   var bullet = playerBullets.get().setActive(true).setVisible(true);

      //   if (bullet) {
      //     bullet.fire(player, reticle);
      //     // this.physics.add.collider(enemy, bullet, enemyHitCallback);
      //   }
      // }
    },
    this
  );

  this.input.on(
    "pointerup",
    (pointer) => {
      if (pointer.rightButtonReleased()) {
        player.setVelocity(0);
      }
    },
    this
  );

  //Make reticle move with player
  reticle.body.velocity.x = player.body.velocity.x;
  reticle.body.velocity.y = player.body.velocity.y;

  // Constrain velocity of player
  constrainVelocity(player, 500);

  // Constrain position of constrainReticle
  constrainReticle(reticle);

  // // Make enemy fire
  // enemyFire(enemy, player, time, this);
}

const getRelativePositionToCanvas = () => {
  return {
    x: (game.x - camera.worldView.x) * camera.zoom,
    y: (game.y - camera.worldView.y) * camera.zoom,
  };
};
