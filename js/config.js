window.PortfolioMap = window.PortfolioMap || {};

window.PortfolioMap.CONFIG = {
  world: {
    width: 1600,
    height: 900,
    background: "#223936"
  },

  player: {
    start: { x: 800, y: 818 },
    radius: 16,
    speed: 235,
    interactionRadius: 72,
    safeReturnDistance: 46,

    spriteWidth: 92,
    spriteHeight: 100,

    // Idle behaviour. After a short pause the raccoon starts doing
    // occasional one-shot reactions, but never while the player is moving.
    idleReactionDelayMs: 5200,
    idleReactionMinGapMs: 3800,
    idleReactionMaxGapMs: 7200,

    animations: {
      idle: {
        assetKey: "playerIdle",
        frameWidth: 192,
        frameHeight: 208,
        frameCount: 6,
        frameDuration: 280,
        loop: true,
        mirrorWithFacing: true
      },
      runLeft: {
        assetKey: "playerRunLeft",
        frameWidth: 192,
        frameHeight: 208,
        frameCount: 8,
        frameDuration: 120,
        loop: true,
        mirrorWithFacing: false
      },
      runRight: {
        assetKey: "playerRunRight",
        frameWidth: 192,
        frameHeight: 208,
        frameCount: 8,
        frameDuration: 120,
        loop: true,
        mirrorWithFacing: false
      },
      waiting: {
        assetKey: "playerWaiting",
        frameWidth: 192,
        frameHeight: 208,
        frameCount: 6,
        frameDuration: 150,
        loop: false,
        mirrorWithFacing: true
      },
      wave: {
        assetKey: "playerWave",
        frameWidth: 192,
        frameHeight: 208,
        frameCount: 4,
        frameDuration: 140,
        loop: false,
        mirrorWithFacing: true
      },
      look: {
        assetKey: "playerLook",
        frameWidth: 192,
        frameHeight: 208,
        frameCount: 16,
        frameDuration: 180,
        loop: false,
        mirrorWithFacing: false
      },
      review: {
        assetKey: "playerReview",
        frameWidth: 192,
        frameHeight: 208,
        frameCount: 6,
        frameDuration: 150,
        loop: false,
        mirrorWithFacing: true
      },
      failed: {
        assetKey: "playerFailed",
        frameWidth: 192,
        frameHeight: 208,
        frameCount: 8,
        frameDuration: 140,
        loop: false,
        mirrorWithFacing: true
      },
      jump: {
        assetKey: "playerJump",
        frameWidth: 192,
        frameHeight: 208,
        frameCount: 5,
        frameDuration: 140,
        loop: false,
        mirrorWithFacing: true
      },
      action: {
        assetKey: "playerAction",
        frameWidth: 192,
        frameHeight: 208,
        frameCount: 6,
        frameDuration: 120,
        loop: false,
        mirrorWithFacing: true
      }
    }
  },

  controls: {
    up: ["KeyW", "ArrowUp"],
    down: ["KeyS", "ArrowDown"],
    left: ["KeyA", "ArrowLeft"],
    right: ["KeyD", "ArrowRight"],
    interact: ["KeyE", "Enter"],
    cancel: ["Escape"]
  },

  pathfinding: {
    cellSize: 25,
    maxIterations: 12000
  },

  transitions: {
    fadeMs: 280,
    minimumLoadingMs: 650
  },

  links: {
    // TODO before publishing: replace with your real GitHub URL.
    github: "https://github.com/Esaluter"
  },

  defaults: {
    language: "ru",
    soundEnabled: false
  },

  assets: {
    baseMap: "assets/map/base-map.jpg",
    analytics: "assets/locations/analytics.png",
    snake: "assets/locations/snake.png",
    warehouse: "assets/locations/warehouse.png",
    uselessBox: "assets/locations/useless-box.png",
    cinema: "assets/locations/cinema.png",

    // Old static player remains as a graceful fallback.
    player: "assets/player/player.png",

    // Raccoon Animation System V2
    playerIdle: "assets/player/raccoon/idle-strip.png",
    playerRunLeft: "assets/player/raccoon/run-left-strip.png",
    playerRunRight: "assets/player/raccoon/run-right-strip.png",
    playerWaiting: "assets/player/raccoon/waiting-strip.png",
    playerWave: "assets/player/raccoon/wave-strip.png",
    playerLook: "assets/player/raccoon/look-directions-strip.png",
    playerReview: "assets/player/raccoon/review-strip.png",
    playerFailed: "assets/player/raccoon/failed-strip.png",
    playerJump: "assets/player/raccoon/jumping-strip.png",
    playerAction: "assets/player/raccoon/action-strip.png"
  },

  debug: {
    showGrid: false,
    showCollisionBoxes: false,
    showPath: false,
    showInteractionPoints: false
  }
};
