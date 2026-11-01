const WORLD = (() => {
  const obstacles = [
    // Village houses and props
    {x:115,y:210,w:270,h:170,type:"house"},
    {x:430,y:155,w:245,h:175,type:"house"},
    {x:170,y:610,w:235,h:170,type:"house"},
    {x:520,y:650,w:285,h:190,type:"tavern"},
    {x:700,y:280,w:170,h:135,type:"house"},
    // Forest rocks / dense groves
    {x:1020,y:170,w:145,h:120,type:"grove"},
    {x:1190,y:455,w:190,h:145,type:"grove"},
    {x:970,y:825,w:175,h:150,type:"grove"},
    {x:1420,y:255,w:180,h:150,type:"grove"},
    {x:1535,y:705,w:220,h:165,type:"grove"},
    {x:1280,y:1120,w:165,h:140,type:"grove"},
    {x:1640,y:1300,w:150,h:155,type:"grove"},
    // Old road debris
    {x:1990,y:505,w:190,h:90,type:"cart"},
    {x:2135,y:1190,w:160,h:110,type:"rocks"},
    {x:2350,y:360,w:150,h:120,type:"rocks"},
    // Ruins
    {x:2660,y:260,w:420,h:70,type:"wall"},
    {x:2660,y:260,w:70,h:430,type:"wall"},
    {x:3010,y:260,w:70,h:430,type:"wall"},
    {x:2785,y:530,w:170,h:160,type:"chapel"},
    {x:2710,y:970,w:280,h:65,type:"wall"},
    {x:3000,y:970,w:65,h:300,type:"wall"},
    // Lair bones / stones (small)
    {x:3380,y:350,w:130,h:90,type:"rocks"},
    {x:3530,y:1500,w:145,h:90,type:"rocks"}
  ];

  const npcs = [
    {id:"elder", name:"Староста", x:510, y:470, kind:"elder"},
    {id:"innkeeper", name:"Трактирщик", x:650, y:620, kind:"innkeeper"},
    {id:"oldWoman", name:"Старая Марта", x:290, y:560, kind:"oldWoman"},
    {id:"farmer", name:"Крестьянин", x:790, y:510, kind:"farmer"},
    {id:"forester", name:"Лесник Герхард", x:1100, y:1420, kind:"forester"}
  ];

  const clues = [
    {id:"forester", x:1100, y:1420, label:"Рассказ лесника", source:"npc"},
    {id:"cart", x:2085, y:465, label:"Следы у разрушенной телеги", source:"world"},
    {id:"carcass", x:1540, y:1015, label:"Метка и следы у туши", source:"world"},
    {id:"note", x:2440, y:1495, label:"Записка пропавшего", source:"world"}
  ];

  const decorSeed = [
    [920,320],[980,610],[1050,1040],[1130,1260],[1220,250],[1260,780],[1330,390],[1390,980],
    [1460,540],[1510,1180],[1580,350],[1660,930],[1730,530],[1810,1120],[1880,280],
    [2300,760],[2470,530],[2580,1420],[3180,440],[3260,860],[3320,1250],[3470,1040],[3680,620]
  ];

  const lamps = [
    {x:420,y:520},{x:610,y:510},{x:760,y:560},{x:470,y:900},{x:810,y:820}
  ];

  return {
    obstacles, npcs, clues, decorSeed, lamps,
    gate: {x:3120,y:0,w:55,h:2200},
    lairTrigger: {x:3220,y:550,w:590,h:1050},
    villageBoundary: 900
  };
})();
