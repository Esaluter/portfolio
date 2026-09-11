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

  // Размер на карте
  spriteWidth: 92,
  spriteHeight: 100,

  // Через сколько бездействия переключаться в waiting
  waitingDelayMs: 5500,

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
      loop: true,
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

  // Старый персонаж оставим как запасной fallback
  player: "assets/player/player.png",

  // Новый енот
  playerIdle: "assets/player/raccoon/idle-strip.png",
  playerRunLeft: "assets/player/raccoon/run-left-strip.png",
  playerRunRight: "assets/player/raccoon/run-right-strip.png",
  playerWaiting: "assets/player/raccoon/waiting-strip.png",
  playerWave: "assets/player/raccoon/wave-strip.png"
},

  debug: {
    showGrid: false,
    showCollisionBoxes: false,
    showPath: false,
    showInteractionPoints: false
  }
};
