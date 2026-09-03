(() => {
  "use strict";

  const PORTFOLIO_URL = "../index.html";
  const STORAGE_PREFIX = "uselessBox.";
  const MODELS = ["classic", "industrial", "raccoon"];

  const tracks = [
    { id: "track1", file: "assets/music/track-01.wav", ru: "Лифт в никуда", en: "Elevator to Nowhere" },
    { id: "track2", file: "assets/music/track-02.wav", ru: "Механический перерыв", en: "Mechanical Break" },
    { id: "track3", file: "assets/music/track-03.wav", ru: "Не трогай тумблер", en: "Don't Touch the Switch" }
  ];

  const sfxFiles = {
    switchOn: "assets/sfx/switch-on.wav",
    switchOff: "assets/sfx/switch-off.wav",
    lidOpen: "assets/sfx/lid-open.wav",
    lidClose: "assets/sfx/lid-close.wav",
    servo: "assets/sfx/servo.wav",
    impact: "assets/sfx/impact.wav",
    slam: "assets/sfx/slam.wav",
    weird: "assets/sfx/weird.wav"
  };

  const i18n = {
    ru: {
      title: "Самая бесполезная коробка",
      subtitle: "Включи. Дальше она сама.",
      back: "← Вернуться в портфолио",
      model: "Модель",
      presses: "Нажатий",
      music: "Музыка",
      sfx: "Звуки",
      audioHint: "Музыка запускается после первого взаимодействия с сайтом.",
      modelNames: { classic: "CLASSIC", industrial: "INDUSTRIAL", raccoon: "RACCOON EDITION" },
      again: "Опять?", seriously: "Серьёзно?", nope: "Нет.", thinking: "Хм...",
      rebellion: "Ладно. Живи.", rebellion2: "Шучу.", wtf: "Что вообще происходит?",
      tired: "Ну конечно...", panic: "А-А-А, ВКЛЮЧЕНО!", almost: "Почти.", check: "Точно выключено?",
      raccoonMaybe: "А может, ну его?..",
      raccoonFine: "Ладно."
    },
    en: {
      title: "The Most Useless Box",
      subtitle: "Switch it on. It'll handle the rest.",
      back: "← Back to Portfolio",
      model: "Model",
      presses: "Presses",
      music: "Music",
      sfx: "SFX",
      audioHint: "Music starts after your first interaction with the page.",
      modelNames: { classic: "CLASSIC", industrial: "INDUSTRIAL", raccoon: "RACCOON EDITION" },
      again: "Again?", seriously: "Seriously?", nope: "No.", thinking: "Hmm...",
      rebellion: "Fine. Keep it.", rebellion2: "Just kidding.", wtf: "What is even happening?",
      tired: "Of course...", panic: "A-A-A, IT'S ON!", almost: "Almost.", check: "Definitely off?",
      raccoonMaybe: "Maybe... just leave it?",
      raccoonFine: "Fine."
    }
  };

  const qs = s => document.querySelector(s);
  const scene = qs("#scene");
  const switchButton = qs("#switchButton");
  const backLink = qs("#backLink");
  const langButton = qs("#langButton");
  const modelPrev = qs("#modelPrev");
  const modelNext = qs("#modelNext");
  const modelName = qs("#modelName");
  const pressCountEl = qs("#pressCount");
  const reactionMessage = qs("#reactionMessage");
  const musicToggle = qs("#musicToggle");
  const sfxToggle = qs("#sfxToggle");
  const musicState = qs("#musicState");
  const sfxState = qs("#sfxState");
  const trackSelect = qs("#trackSelect");

  const read = (key, fallback) => {
    try {
      const v = localStorage.getItem(STORAGE_PREFIX + key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); } catch {}
  };

  const urlLang = new URLSearchParams(location.search).get("lang");
  let language = (urlLang === "ru" || urlLang === "en") ? urlLang : read("language", "ru");
  let model = read("model", "classic");
  if (!MODELS.includes(model)) model = "classic";
  let presses = Number(read("presses", 0)) || 0;
  let musicEnabled = Boolean(read("musicEnabled", false));
  let sfxEnabled = read("sfxEnabled", true) !== false;
  let selectedTrack = Math.max(0, Math.min(tracks.length - 1, Number(read("selectedTrack", 0)) || 0));

  let busy = false;
  let userActivated = false;
  let lastReaction = null;
  const lastUsed = new Map();

  class AudioManager {
    constructor() {
      this.music = new Audio();
      this.music.loop = true;
      this.music.volume = 0.25;
      this.music.preload = "auto";
      this.music.addEventListener("error", () => {});
      this.sfx = {};
      for (const [name, file] of Object.entries(sfxFiles)) {
        const audio = new Audio(file);
        audio.preload = "auto";
        audio.volume = name === "servo" ? 0.12 : 0.42;
        audio.addEventListener("error", () => {});
        this.sfx[name] = audio;
      }
      this.setTrack(selectedTrack);
    }

    setTrack(index) {
      selectedTrack = index;
      const wasPlaying = !this.music.paused;
      this.music.pause();
      this.music.src = tracks[index].file;
      this.music.load();
      write("selectedTrack", selectedTrack);
      if (musicEnabled && userActivated && wasPlaying) this.playMusic();
    }

    async playMusic() {
      if (!musicEnabled || !userActivated) return;
      try { await this.music.play(); } catch {}
    }

    stopMusic() { this.music.pause(); }

    play(name, rate = 1, volumeScale = 1) {
      if (!sfxEnabled || !userActivated) return;
      const src = this.sfx[name];
      if (!src) return;
      try {
        const a = src.cloneNode();
        a.volume = Math.min(1, src.volume * volumeScale);
        a.playbackRate = rate;
        a.play().catch(() => {});
      } catch {}
    }
  }

  const audio = new AudioManager();

  function activateAudio() {
    if (userActivated) return;
    userActivated = true;
    if (musicEnabled) audio.playMusic();
  }
  document.addEventListener("pointerdown", activateAudio, { once: true });
  document.addEventListener("keydown", activateAudio, { once: true });

  const wait = ms => new Promise(r => setTimeout(r, ms));

  function applyLanguage() {
    document.documentElement.lang = language;
    const dict = i18n[language];
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key]) el.textContent = dict[key];
    });
    langButton.textContent = language === "ru" ? "RU / EN" : "EN / RU";
    modelName.textContent = dict.modelNames[model];
    backLink.href = `${PORTFOLIO_URL}?lang=${language}`;
    populateTracks();
    write("language", language);
  }

  function populateTracks() {
    const previous = selectedTrack;
    trackSelect.innerHTML = "";
    tracks.forEach((t, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = language === "ru" ? t.ru : t.en;
      option.selected = index === previous;
      trackSelect.append(option);
    });
  }

  function applyModel() {
    scene.dataset.model = model;
    modelName.textContent = i18n[language].modelNames[model];
    write("model", model);
  }

  function applyCounters() { pressCountEl.textContent = String(presses); }

  function applyAudioUi() {
    musicState.textContent = musicEnabled ? "ON" : "OFF";
    sfxState.textContent = sfxEnabled ? "ON" : "OFF";
    trackSelect.value = String(selectedTrack);
  }

  function setPose(pose) {
    scene.classList.remove("pose-hidden","pose-peek","pose-rise","pose-reach","pose-hover","pose-press");
    scene.classList.add(`pose-${pose}`);
  }

  async function openLid(ms = 650, amount = 72) {
    scene.style.setProperty("--lid-angle", `${amount}deg`);
    audio.play("lidOpen", ms < 500 ? 1.18 : 1);
    await wait(ms);
  }

  async function closeLid(ms = 650, slam = false) {
    scene.style.setProperty("--lid-angle", "0deg");
    await wait(ms);
    audio.play(slam ? "slam" : "lidClose", slam ? 1.05 : 1);
    scene.classList.add(slam ? "shake" : "thump");
    await wait(slam ? 330 : 200);
    scene.classList.remove("shake","thump");
  }

  async function pose(name, ms = 450, servo = true) {
    setPose(name);
    if (servo) audio.play("servo", ms < 300 ? 1.25 : .95, ms < 300 ? .9 : .7);
    await wait(ms);
  }

  async function switchOff(ms = 210) {
    scene.classList.remove("switch-on");
    audio.play("switchOff");
    await wait(ms);
  }

  async function showMessage(key, ms = 900) {
    reactionMessage.textContent = i18n[language][key] || key;
    reactionMessage.classList.add("show");
    await wait(ms);
    reactionMessage.classList.remove("show");
    await wait(140);
  }

  async function fx(name, ms = 320) {
    scene.classList.add(name);
    if (name === "panic") audio.play("weird", 1.25, .85);
    await wait(ms);
    scene.classList.remove(name);
  }

  const A = {
    open: (ms=650, amount=72) => ({type:"open",ms,amount}),
    close: (ms=650, slam=false) => ({type:"close",ms,slam}),
    pose: (name,ms=450,servo=true) => ({type:"pose",name,ms,servo}),
    wait: ms => ({type:"wait",ms}),
    off: (ms=210) => ({type:"off",ms}),
    msg: (key,ms=900) => ({type:"msg",key,ms}),
    fx: (name,ms=320) => ({type:"fx",name,ms}),
    sfx: (name,rate=1,volume=1) => ({type:"sfx",name,rate,volume})
  };

  const classicSeq = (k=1, slam=false) => [
    A.open(650*k), A.pose("peek",240*k), A.pose("rise",390*k), A.pose("reach",430*k),
    A.pose("press",190*k), A.off(210*k), A.pose("reach",220*k), A.pose("rise",320*k),
    A.pose("peek",240*k), A.pose("hidden",160*k,false), A.close(620*k, slam)
  ];

  const reactions = [
    { id:"classic", weight:32, minPresses:1, cooldown:0, seq: classicSeq(1) },
    { id:"fast", weight:13, minPresses:2, cooldown:1, seq: classicSeq(.58) },
    { id:"slow", weight:8, minPresses:3, cooldown:2, seq: classicSeq(1.55) },
    { id:"annoyed", weight:7, minPresses:4, cooldown:3, seq:[A.fx("shake",240), ...classicSeq(.68,true)] },
    { id:"thinking", weight:7, minPresses:4, cooldown:3, seq:[A.open(),A.pose("peek",250),A.pose("rise",400),A.pose("hover",480),A.msg("thinking",1000),A.wait(550),A.pose("press",220),A.off(),A.pose("rise",350),A.pose("hidden",180,false),A.close()] },
    { id:"tired", weight:6, minPresses:5, cooldown:3, seq:[A.msg("tired",760), ...classicSeq(1.72)] },
    { id:"peek", weight:6, minPresses:5, cooldown:3, seq:[A.open(300,25),A.wait(300),A.close(320),A.wait(430),...classicSeq(.95)] },
    { id:"doubleCheck", weight:5, minPresses:6, cooldown:4, seq:[A.open(),A.pose("peek",240),A.pose("rise",390),A.pose("reach",430),A.pose("press",190),A.off(),A.pose("rise",320),A.msg("check",650),A.pose("press",280),A.sfx("impact",1,.7),A.pose("rise",300),A.pose("hidden",170,false),A.close()] },
    { id:"nope", weight:5, minPresses:6, cooldown:4, seq:[A.open(380,32),A.pose("peek",260),A.msg("nope",650),A.pose("hidden",180,false),A.close(350),A.wait(700),...classicSeq(.9)] },
    { id:"slam", weight:5, minPresses:6, cooldown:4, seq:classicSeq(.9,true) },
    { id:"precision", weight:5, minPresses:7, cooldown:4, seq:[A.open(760),A.pose("peek",340),A.pose("rise",520),A.pose("reach",620),A.pose("hover",650),A.pose("press",360),A.off(300),A.pose("hover",300),A.pose("rise",450),A.pose("peek",320),A.pose("hidden",200,false),A.close(740)] },
    { id:"panic", weight:4, minPresses:7, cooldown:5, seq:[A.msg("panic",520),A.fx("panic",430),...classicSeq(.46,true)] },
    { id:"almost", weight:4, minPresses:8, cooldown:5, seq:[A.open(),A.pose("peek",240),A.pose("rise",390),A.pose("reach",430),A.pose("hover",310),A.msg("almost",580),A.pose("rise",380),A.wait(380),A.pose("reach",340),A.pose("press",210),A.off(),A.pose("rise",300),A.pose("hidden",170,false),A.close()] },
    { id:"again", weight:4, minPresses:8, cooldown:5, seq:[A.msg("again",800),...classicSeq(.88)] },
    { id:"seriously", weight:3, minPresses:9, cooldown:6, seq:[A.open(),A.pose("peek",250),A.msg("seriously",1100),A.wait(350),A.pose("rise",390),A.pose("reach",420),A.pose("press",210),A.off(),A.pose("hidden",500),A.close()] },
    { id:"fakeExit", weight:2, minPresses:10, cooldown:7, seq:[A.open(),A.pose("peek",240),A.pose("rise",390),A.pose("reach",430),A.pose("press",190),A.off(),A.pose("hidden",500),A.close(470),A.wait(500),A.open(360,44),A.pose("peek",270),A.msg("check",600),A.pose("hidden",220,false),A.close(420)] },
    { id:"rebellion", weight:1.2, minPresses:12, cooldown:10, seq:[A.open(),A.pose("peek",250),A.pose("rise",380),A.pose("hover",430),A.msg("rebellion",950),A.pose("hidden",450),A.close(),A.wait(1700),A.msg("rebellion2",550),A.open(300),A.pose("press",390),A.off(150),A.pose("hidden",280),A.close(330,true)] },
    {
  id:"raccoonLogic",
  weight:5,
  minPresses:4,
  cooldown:5,
  raccoonOnly:true,
  seq:[
    A.open(),
    A.pose("peek",250),
    A.pose("rise",380),
    A.pose("hover",430),

    A.msg("raccoonMaybe",900),

    A.pose("rise",300),
    A.pose("peek",260),
    A.pose("hidden",180,false),
    A.close(500),

    A.wait(1200),

    A.msg("raccoonFine",550),

    A.open(420),
    A.pose("peek",180),
    A.pose("rise",260),
    A.pose("reach",300),
    A.pose("press",180),
    A.off(180),

    A.pose("reach",180),
    A.pose("rise",220),
    A.pose("hidden",180,false),
    A.close(450)
  ]
},
    { id:"wtf", weight:.8, minPresses:14, cooldown:12, seq:[A.msg("wtf",650),A.open(260,34),A.pose("peek",180),A.pose("hidden",150,false),A.close(230),A.wait(220),A.open(230,48),A.pose("rise",220),A.pose("peek",160),A.pose("rise",160),A.sfx("weird",1.1,.8),A.wait(160),A.pose("press",280),A.off(140),A.pose("hidden",260),A.close(300,true)] }
  ];

  async function execute(seq) {
    for (const action of seq) {
      switch (action.type) {
        case "open": await openLid(action.ms, action.amount); break;
        case "close": await closeLid(action.ms, action.slam); break;
        case "pose": await pose(action.name, action.ms, action.servo); break;
        case "wait": await wait(action.ms); break;
        case "off": await switchOff(action.ms); break;
        case "msg": await showMessage(action.key, action.ms); break;
        case "fx": await fx(action.name, action.ms); break;
        case "sfx": audio.play(action.name, action.rate, action.volume); break;
      }
    }
  }

  function chooseReaction() {
    if (presses === 1) return reactions[0];
    if (presses <= 3) {
      const safe = reactions.filter(r => ["classic","fast","slow"].includes(r.id));
      return safe[Math.floor(Math.random() * safe.length)];
    }
    const eligible = reactions.filter(r => {
      if (r.raccoonOnly && model !== "raccoon") return false;
      if (presses < r.minPresses) return false;
      if (lastReaction === r.id && r.id !== "classic") return false;
      const usedAt = lastUsed.get(r.id) ?? -999;
      return (presses - usedAt) > r.cooldown;
    });
    const total = eligible.reduce((sum, r) => sum + r.weight, 0);
    let roll = Math.random() * total;
    for (const r of eligible) {
      roll -= r.weight;
      if (roll <= 0) return r;
    }
    return reactions[0];
  }

  async function runReaction() {
    if (busy) return;
    activateAudio();
    busy = true;
    switchButton.disabled = true;
    modelPrev.disabled = true;
    modelNext.disabled = true;

    presses += 1;
    write("presses", presses);
    applyCounters();

    scene.classList.add("switch-on");
    audio.play("switchOn");
    await wait(290);

    const reaction = chooseReaction();
    lastReaction = reaction.id;
    lastUsed.set(reaction.id, presses);

    try { await execute(reaction.seq); }
    finally {
      scene.classList.remove("switch-on","shake","thump","panic");
      scene.style.setProperty("--lid-angle","0deg");
      setPose("hidden");
      reactionMessage.classList.remove("show");
      switchButton.disabled = false;
      modelPrev.disabled = false;
      modelNext.disabled = false;
      busy = false;
    }
  }

  function cycleModel(direction) {
    if (busy) return;
    const current = MODELS.indexOf(model);
    model = MODELS[(current + direction + MODELS.length) % MODELS.length];
    applyModel();
  }

  switchButton.addEventListener("click", runReaction);
  modelPrev.addEventListener("click", () => cycleModel(-1));
  modelNext.addEventListener("click", () => cycleModel(1));
  langButton.addEventListener("click", () => { language = language === "ru" ? "en" : "ru"; applyLanguage(); });

  musicToggle.addEventListener("click", async () => {
    activateAudio();
    musicEnabled = !musicEnabled;
    write("musicEnabled", musicEnabled);
    applyAudioUi();
    if (musicEnabled) await audio.playMusic(); else audio.stopMusic();
  });

  sfxToggle.addEventListener("click", () => {
    activateAudio();
    sfxEnabled = !sfxEnabled;
    write("sfxEnabled", sfxEnabled);
    applyAudioUi();
    if (sfxEnabled) audio.play("switchOn", 1.25, .7);
  });

  trackSelect.addEventListener("change", async () => {
    activateAudio();
    const wasEnabled = musicEnabled;
    audio.setTrack(Number(trackSelect.value));
    applyAudioUi();
    if (wasEnabled) await audio.playMusic();
  });

  setPose("hidden");
  applyLanguage();
  applyModel();
  applyCounters();
  applyAudioUi();
})();
