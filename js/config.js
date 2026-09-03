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
    spriteWidth: 70,
    spriteHeight: 92
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
    player: "assets/player/player.png"
},

  debug: {
    showGrid: false,
    showCollisionBoxes: false,
    showPath: false,
    showInteractionPoints: false
  }
};
