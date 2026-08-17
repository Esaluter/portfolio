window.PortfolioMap = window.PortfolioMap || {};

(function () {
  "use strict";

  const W = 1600;
  const H = 900;

  // Игровая область отделена от фоновой иллюстрации.
  // Игрок исследует центральную часть полуострова, а море, далёкие горы
  // и фон остаются естественными границами, а не "невидимыми стенами".
  const walkableAreas = [
    {
      id: "main-peninsula",
      points: [
        { x: 470, y: 790 },
        { x: 500, y: 750 },
        { x: 520, y: 700 },
        { x: 545, y: 650 },
        { x: 535, y: 600 },
        { x: 520, y: 555 },
        { x: 460, y: 505 },
        { x: 455, y: 445 },
        { x: 500, y: 382 },
        { x: 575, y: 330 },
        { x: 660, y: 295 },
        { x: 725, y: 250 },
        { x: 772, y: 205 },
        { x: 835, y: 175 },
        { x: 940, y: 172 },
        { x: 1020, y: 205 },
        { x: 1085, y: 270 },
        { x: 1132, y: 340 },
        { x: 1210, y: 385 },
        { x: 1280, y: 445 },
        { x: 1325, y: 525 },
        { x: 1315, y: 610 },
        { x: 1260, y: 675 },
        { x: 1175, y: 730 },
        { x: 1080, y: 770 },
        { x: 980, y: 795 },
        { x: 885, y: 822 },
        { x: 825, y: 855 },
        { x: 735, y: 850 },
        { x: 650, y: 832 },
        { x: 560, y: 815 }
      ]
    }
  ];

  // Крупные внутренние водоёмы/разрывы внутри доступного полуострова.
  const blockedPolygons = [
    {
      id: "analytics-lake",
      kind: "water",
      points: [
        { x: 175, y: 575 },
        { x: 345, y: 558 },
        { x: 455, y: 575 },
        { x: 505, y: 610 },
        { x: 505, y: 665 },
        { x: 480, y: 720 },
        { x: 420, y: 765 },
        { x: 330, y: 785 },
        { x: 245, y: 760 },
        { x: 190, y: 710 },
        { x: 165, y: 645 }
      ]
    }
  ];

  // Локальные препятствия. Не пытаемся коллизией описать каждый камень:
  // только то, через что проходить визуально совсем странно.
  const obstacles = [
    { id: "about-grove", x: 265, y: 335, width: 155, height: 126, kind: "forest" },
    { id: "github-grove", x: 1160, y: 315, width: 135, height: 175, kind: "forest" },
    { id: "east-cliff", x: 1275, y: 470, width: 82, height: 165, kind: "rock" },
    { id: "south-east-cliff", x: 1165, y: 680, width: 125, height: 78, kind: "rock" }
  ];

  const locations = [
    {
      id: "analytics",
      titleKey: "location.analytics.title",
      subtitleKey: "location.analytics.subtitle",
      x: 130,
      y: 560,
      width: 330,
      height: 250,
      collisionRect: { x: 185, y: 655, width: 164, height: 90 },
      interactionPoint: { x: 565, y: 685 },
      label: { x: 300, y: 548 },
      category: "major",
      render: { assetKey: "analytics", x: 108, y: 548, width: 330, height: 324 },
      action: { type: "internal", href: "pages/analytics.html" }
    },
    {
      id: "about",
      titleKey: "location.about.title",
      subtitleKey: "location.about.subtitle",
      x: 250,
      y: 355,
      width: 240,
      height: 150,
      collisionRect: { x: 300, y: 430, width: 135, height: 46 },
      interactionPoint: { x: 505, y: 512 },
      label: { x: 360, y: 346 },
      category: "major",
      action: { type: "internal", href: "pages/about.html" }
    },
    {
      id: "github",
      titleKey: "location.github.title",
      subtitleKey: "location.github.subtitle",
      x: 1020,
      y: 366,
      width: 210,
      height: 190,
      collisionRect: { x: 1072, y: 438, width: 115, height: 103 },
      interactionPoint: { x: 995, y: 505 },
      label: { x: 1122, y: 385 },
      category: "major",
      action: { type: "external", configKey: "github" }
    },
    {
      id: "contacts",
      titleKey: "location.contacts.title",
      subtitleKey: "location.contacts.subtitle",
      x: 705,
      y: 174,
      width: 210,
      height: 142,
      collisionRect: { x: 748, y: 248, width: 142, height: 50 },
      interactionPoint: { x: 810, y: 356 },
      label: { x: 822, y: 170 },
      category: "major",
      action: { type: "internal", href: "pages/contacts.html" }
    },
    {
      id: "laboratory",
      titleKey: "location.laboratory.title",
      subtitleKey: "location.laboratory.subtitle",
      x: 760,
      y: 32,
      width: 340,
      height: 165,
      collisionRect: { x: 865, y: 82, width: 185, height: 88 },
      interactionPoint: { x: 948, y: 246 },
      label: { x: 1045, y: 38 },
      category: "major",
      action: { type: "internal", href: "pages/experiments.html" }
    }
  ];

  for (const location of locations) {
    const rect = location.collisionRect || { x: location.x, y: location.y, width: location.width, height: location.height };
    obstacles.push({
      id: `location-${location.id}`,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      kind: "building",
      locationId: location.id
    });
  }

  function findLocation(id) {
    return locations.find((location) => location.id === id) || null;
  }

  window.PortfolioMap.WORLD = {
    width: W,
    height: H,
    walkableAreas,
    blockedPolygons,
    obstacles,
    locations,
    findLocation
  };
})();
