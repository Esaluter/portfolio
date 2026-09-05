const CONFIG = Object.freeze({
  world: { width: 3900, height: 2200 },
  player: {
    speed: 245,
    maxHp: 100,
    damage: 30,
    attackCooldown: 0.42,
    attackRange: 82,
    radius: 21
  },
  ren: {
    followDistance: 82,
    speed: 285,
    shotCooldown: 1.15,
    damage: 19,
    shotRange: 430
  },
  enemy: {
    wolf:     { hp: 45, damage: 11, speed: 115, radius: 19, attackCooldown: 0.9 },
    corrupted:{ hp: 70, damage: 14, speed: 78,  radius: 23, attackCooldown: 1.15 },
    imp:      { hp: 32, damage: 8,  speed: 145, radius: 16, attackCooldown: 0.72 },
    boss:     { hp: 360,damage: 22, speed: 92,  radius: 49, attackCooldown: 1.0 }
  },
  interactionRange: 78,
  cluesRequired: 3,
  autosaveSeconds: 6,
  storageKey: "hunters_old_forest_v1"
});
