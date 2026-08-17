window.PortfolioMap = window.PortfolioMap || {};

(function () {
  "use strict";

  const NS = window.PortfolioMap;
  const CONFIG = NS.CONFIG;
  const WORLD = NS.WORLD;
  const Geometry = NS.Geometry;
  const I18N = NS.I18N;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const prompt = document.getElementById("interactionPrompt");
  const promptText = document.getElementById("interactionText");
  const toast = document.getElementById("toast");
  const transitionLayer = document.getElementById("transitionLayer");
  const loadingScreen = document.getElementById("loadingScreen");
  const introScreen = document.getElementById("introScreen");
  const introStart = document.getElementById("introStart");
  const menuButton = document.getElementById("menuButton");
  const menuLayer = document.getElementById("menuLayer");
  const menuClose = document.getElementById("menuClose");
  const languageToggle = document.getElementById("languageToggle");
  const soundToggle = document.getElementById("soundToggle");
  const menuSoundToggle = document.getElementById("menuSoundToggle");
  const externalModal = document.getElementById("externalModal");
  const externalTitle = document.getElementById("externalTitle");
  const externalText = document.getElementById("externalText");
  const externalCancel = document.getElementById("externalCancel");
  const externalConfirm = document.getElementById("externalConfirm");
  const fallback = document.getElementById("fallback");

  const state = {
    player: {
      x: CONFIG.player.start.x,
      y: CONFIG.player.start.y,
      radius: CONFIG.player.radius,
      facingX: 0,
      facingY: 1,
      walking: false
    },
    keys: new Set(),
    route: [],
    routeIndex: 0,
    routeTargetLocationId: null,
    hoveredLocationId: null,
    nearbyLocationId: null,
    targetMarker: null,
    deniedMarker: null,
    lastTime: performance.now(),
    toastTimer: null,
    externalPendingLocation: null,
    uiLocks: new Set(["loading"]),
    experienceActive: false,
    soundEnabled: CONFIG.defaults.soundEnabled,
    language: CONFIG.defaults.language,
    returnFrom: null,
    started: false,
    images: {}
  };

  function boot() {
    window.__portfolioRuntimeReady = true;
    try {
      state.returnFrom = restoreReturnPosition();
      resolveInitialLanguage();
      restoreSoundPreference();
      bindEvents();
      applyLanguage();
      updateSoundButtons();
      state.started = true;
      requestAnimationFrame(frame);
      beginEntryFlow();
    } catch (error) {
      console.error("Portfolio map failed to start:", error);
      showFallback(error);
    }
  }

  function showFallback(error) {
    console.error(error);
    updateFallbackLinks();
    if (NS.Audio) NS.Audio.setEnabled(false).catch(() => {});
    loadingScreen.hidden = true;
    introScreen.hidden = true;
    menuLayer.hidden = true;
    externalModal.hidden = true;
    fallback.hidden = false;
  }

  function resolveInitialLanguage() {
    const url = new URL(window.location.href);
    const requested = url.searchParams.get("lang");
    state.language = I18N.supported.includes(requested) ? requested : CONFIG.defaults.language;
  }

  function safeReplaceUrl(url) {
    try {
      history.replaceState({}, "", url.pathname + url.search + url.hash);
    } catch (error) {
      console.warn("Could not update URL state in this browser context:", error);
    }
  }

  function applyLanguage() {
    I18N.setLanguage(state.language);
    languageToggle.textContent = state.language.toUpperCase();
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.language === state.language);
    });
    updateSoundButtons();
    refreshDynamicText();
    updateFallbackLinks();
  }

  function setLanguage(language) {
    if (!I18N.supported.includes(language)) return;
    state.language = language;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", language);
    safeReplaceUrl(url);
    applyLanguage();
  }

  function toggleLanguage() {
    setLanguage(state.language === "ru" ? "en" : "ru");
  }

  const SOUND_STORAGE_KEY = "portfolioMap.soundEnabled";

  function readStoredSoundPreference() {
    try {
      const value = sessionStorage.getItem(SOUND_STORAGE_KEY);
      if (value === "1") return true;
      if (value === "0") return false;
    } catch (_) {
      // file:// and strict privacy modes may deny web storage. Query params still preserve the state.
    }
    return null;
  }

  function storeSoundPreference(enabled) {
    try {
      sessionStorage.setItem(SOUND_STORAGE_KEY, enabled ? "1" : "0");
    } catch (_) {
      // Optional persistence only; navigation also carries the value explicitly.
    }
  }

  function restoreSoundPreference() {
    const url = new URL(window.location.href);
    const param = url.searchParams.get("sound");
    if (param === "1" || param === "0") {
      state.soundEnabled = param === "1";
      storeSoundPreference(state.soundEnabled);
      url.searchParams.delete("sound");
      safeReplaceUrl(url);
      return;
    }

    const stored = readStoredSoundPreference();
    state.soundEnabled = stored === null ? CONFIG.defaults.soundEnabled : stored;
  }

  function armAudioResume() {
    if (!state.soundEnabled || !NS.Audio) return;
    const resume = async () => {
      await NS.Audio.setEnabled(true);
      window.removeEventListener("pointerdown", resume, true);
      window.removeEventListener("keydown", resume, true);
    };
    window.addEventListener("pointerdown", resume, true);
    window.addEventListener("keydown", resume, true);
  }

  async function restoreAudioIfNeeded() {
    if (!state.soundEnabled || !NS.Audio) return;
    await NS.Audio.setEnabled(true);
    armAudioResume();
  }

  async function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    storeSoundPreference(state.soundEnabled);
    if (NS.Audio) await NS.Audio.setEnabled(state.soundEnabled);
    updateSoundButtons();
    if (state.soundEnabled) showToast(I18N.t("hud.soundDemo"));
  }

  function updateSoundButtons() {
    const label = I18N.t(state.soundEnabled ? "hud.soundOn" : "hud.soundOff");
    soundToggle.textContent = label;
    menuSoundToggle.textContent = label;
  }

  function locationTitle(location) {
    return I18N.t(location.titleKey || location.id);
  }

  function refreshDynamicText() {
    const nearby = getNearbyLocation();
    if (nearby) promptText.textContent = I18N.t("prompt.open", { title: locationTitle(nearby) });
    if (!externalModal.hidden && state.externalPendingLocation) refreshExternalModalText();
  }

  function updateFallbackLinks() {
    document.querySelectorAll("[data-fallback-location]").forEach((link) => {
      const location = WORLD.findLocation(link.dataset.fallbackLocation);
      if (!location || location.action.type !== "internal") return;
      const url = new URL(location.action.href, document.baseURI || window.location.href);
      url.searchParams.set("from", location.id);
      url.searchParams.set("lang", state.language);
      url.searchParams.set("sound", state.soundEnabled ? "1" : "0");
      link.href = url.href;
    });

    const github = document.querySelector("[data-fallback-external='github']");
    if (github) github.href = CONFIG.links.github;
  }

  function restoreReturnPosition() {
    const url = new URL(window.location.href);
    const returnFrom = url.searchParams.get("returnFrom");
    if (!returnFrom) return null;

    const location = WORLD.findLocation(returnFrom);
    if (location) {
      const safe = findSafeReturnPosition(location);
      state.player.x = safe.x;
      state.player.y = safe.y;
    }

    url.searchParams.delete("returnFrom");
    safeReplaceUrl(url);
    return location ? location.id : null;
  }

  function findSafeReturnPosition(location) {
    const center = {
      x: location.interactionPoint.x,
      y: location.interactionPoint.y
    };
    const preferred = {
      x: center.x,
      y: center.y + CONFIG.player.safeReturnDistance
    };

    return findNearestWalkable(preferred) || findNearestWalkable(location.interactionPoint) || { ...CONFIG.player.start };
  }

  function findNearestWalkable(origin) {
    const radius = state.player.radius;
    const base = {
      x: Geometry.clamp(origin.x, radius, WORLD.width - radius),
      y: Geometry.clamp(origin.y, radius, WORLD.height - radius)
    };
    if (Geometry.pointIsWalkable(base.x, base.y, WORLD, radius)) return base;

    for (let ring = 12; ring <= 160; ring += 12) {
      for (let i = 0; i < 32; i += 1) {
        const angle = (Math.PI * 2 * i) / 32;
        const point = {
          x: Geometry.clamp(base.x + Math.cos(angle) * ring, radius, WORLD.width - radius),
          y: Geometry.clamp(base.y + Math.sin(angle) * ring, radius, WORLD.height - radius)
        };
        if (Geometry.pointIsWalkable(point.x, point.y, WORLD, radius)) return point;
      }
    }
    return null;
  }

  function ensurePlayerWalkable() {
    const p = state.player;
    if (Geometry.pointIsWalkable(p.x, p.y, WORLD, p.radius)) return true;
    const safe = findNearestWalkable({ x: p.x, y: p.y });
    if (!safe) return false;
    p.x = safe.x;
    p.y = safe.y;
    cancelRoute();
    showToast(I18N.t("toast.unstuck"));
    return true;
  }

  function loadImage(path) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${path}`));
      image.src = path;
    });
  }

  async function preloadAssets() {
    const entries = Object.entries(CONFIG.assets);
    const results = await Promise.all(entries.map(async ([key, path]) => {
      try {
        return [key, await loadImage(path), null];
      } catch (error) {
        return [key, null, error];
      }
    }));

    for (const [key, image, error] of results) {
      if (image) state.images[key] = image;
      else console.warn(`Optional asset failed to load: ${key}`, error);
    }

    // The illustrated map is the only critical visual asset. The player and
    // individual landmark overlays have graceful canvas fallbacks.
    if (!state.images.baseMap) throw new Error("Critical map asset failed to load");
  }

  function beginEntryFlow() {
    const startedAt = performance.now();
    const windowReady = new Promise((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });

    Promise.all([windowReady, preloadAssets()])
      .then(() => {
        const elapsed = performance.now() - startedAt;
        const remaining = Math.max(0, CONFIG.transitions.minimumLoadingMs - elapsed);
        window.setTimeout(finishLoading, remaining);
      })
      .catch(showFallback);
  }

  function finishLoading() {
    loadingScreen.classList.add("is-leaving");
    window.setTimeout(() => {
      loadingScreen.hidden = true;
      unlockUI("loading");
      restoreAudioIfNeeded();

      if (state.returnFrom) {
        state.experienceActive = true;
        return;
      }

      introScreen.hidden = false;
      lockUI("intro");
    }, CONFIG.transitions.fadeMs);
  }

  function startJourney() {
    if (introScreen.hidden) return;
    state.experienceActive = true;
    introScreen.classList.add("is-leaving");
    window.setTimeout(() => {
      introScreen.hidden = true;
      introScreen.classList.remove("is-leaving");
      unlockUI("intro");
    }, 220);
  }

  function lockUI(reason) {
    state.uiLocks.add(reason);
    state.keys.clear();
    cancelRoute();
    state.player.walking = false;
  }

  function unlockUI(reason) {
    state.uiLocks.delete(reason);
  }

  function isUiBlocked() {
    return state.uiLocks.size > 0 || !state.experienceActive;
  }

  function bindEvents() {
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp, { passive: false });
    window.addEventListener("blur", () => state.keys.clear());

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", () => {
      state.hoveredLocationId = null;
      canvas.style.cursor = "crosshair";
    });
    canvas.addEventListener("pointerdown", onPointerDown);

    introStart.addEventListener("click", startJourney);
    menuButton.addEventListener("click", openMenu);
    menuClose.addEventListener("click", closeMenu);
    menuLayer.addEventListener("pointerdown", (event) => {
      if (event.target === menuLayer) closeMenu();
    });
    languageToggle.addEventListener("click", toggleLanguage);
    soundToggle.addEventListener("click", toggleSound);
    menuSoundToggle.addEventListener("click", toggleSound);

    document.querySelectorAll("[data-language]").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.language));
    });

    document.querySelectorAll("[data-menu-location]").forEach((button) => {
      button.addEventListener("click", () => openLocationFromMenu(button.dataset.menuLocation));
    });

    externalCancel.addEventListener("click", closeExternalModal);
    externalConfirm.addEventListener("click", confirmExternalNavigation);
    externalModal.addEventListener("pointerdown", (event) => {
      if (event.target === externalModal) closeExternalModal();
    });
  }

  function isControlCode(code) {
    const groups = CONFIG.controls;
    return Object.values(groups).some((codes) => codes.includes(code));
  }

  function onKeyDown(event) {
    if (isControlCode(event.code)) event.preventDefault();

    if (CONFIG.controls.cancel.includes(event.code)) {
      if (!externalModal.hidden) closeExternalModal();
      else if (!menuLayer.hidden) closeMenu();
      return;
    }

    if (isUiBlocked()) return;

    if (CONFIG.controls.interact.includes(event.code) && !event.repeat) {
      const location = getNearbyLocation();
      if (location) activateLocation(location);
      return;
    }

    const movementKey = [
      ...CONFIG.controls.up,
      ...CONFIG.controls.down,
      ...CONFIG.controls.left,
      ...CONFIG.controls.right
    ].includes(event.code);

    if (movementKey) {
      cancelRoute();
      state.keys.add(event.code);
    }
  }

  function onKeyUp(event) {
    state.keys.delete(event.code);
  }

  function onPointerMove(event) {
    if (!state.experienceActive) return;
    const point = pointerToWorld(event);
    const location = getLocationAtPoint(point.x, point.y);
    state.hoveredLocationId = location ? location.id : null;
    if (location) canvas.style.cursor = "pointer";
    else canvas.style.cursor = Geometry.pointIsWalkable(point.x, point.y, WORLD, state.player.radius)
      ? "crosshair"
      : "not-allowed";
  }

  function onPointerDown(event) {
    if (isUiBlocked() || event.button !== 0) return;

    const point = pointerToWorld(event);
    const location = getLocationAtPoint(point.x, point.y);
    if (location) moveTo(location.interactionPoint, location.id);
    else moveTo(point, null);
  }

  function pointerToWorld(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function moveTo(target, targetLocationId) {
    ensurePlayerWalkable();
    const goal = {
      x: Geometry.clamp(target.x, state.player.radius, WORLD.width - state.player.radius),
      y: Geometry.clamp(target.y, state.player.radius, WORLD.height - state.player.radius)
    };

    const path = NS.findPath(
      { x: state.player.x, y: state.player.y },
      goal,
      WORLD,
      state.player.radius,
      CONFIG.pathfinding
    );

    if (!path || path.length < 2) {
      cancelRoute();
      state.deniedMarker = { x: goal.x, y: goal.y, bornAt: performance.now() };
      showToast(I18N.t("toast.blocked"));
      return;
    }

    state.route = path.slice(1);
    state.routeIndex = 0;
    state.routeTargetLocationId = targetLocationId;
    state.targetMarker = { x: goal.x, y: goal.y, bornAt: performance.now() };
    state.deniedMarker = null;
  }

  function cancelRoute() {
    state.route = [];
    state.routeIndex = 0;
    state.routeTargetLocationId = null;
    state.targetMarker = null;
  }

  function getLocationAtPoint(x, y) {
    return WORLD.locations.find((location) =>
      x >= location.x - 14 &&
      x <= location.x + location.width + 14 &&
      y >= location.y - 18 &&
      y <= location.y + location.height + 24
    ) || null;
  }

  function getNearbyLocation() {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const location of WORLD.locations) {
      const dx = state.player.x - location.interactionPoint.x;
      const dy = state.player.y - location.interactionPoint.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= CONFIG.player.interactionRadius && distance < nearestDistance) {
        nearest = location;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function update(deltaSeconds) {
    if (state.experienceActive) ensurePlayerWalkable();

    if (!isUiBlocked()) {
      const manual = getManualVector();
      if (manual.x !== 0 || manual.y !== 0) updateManualMovement(manual, deltaSeconds);
      else if (state.route.length) updateAutoMovement(deltaSeconds);
      else state.player.walking = false;
    } else {
      state.player.walking = false;
    }

    if (NS.Audio) NS.Audio.update(state.player);

    const nearby = state.experienceActive ? getNearbyLocation() : null;
    state.nearbyLocationId = nearby ? nearby.id : null;
    prompt.hidden = !nearby || isUiBlocked();
    if (nearby) promptText.textContent = I18N.t("prompt.open", { title: locationTitle(nearby) });
  }

  function getManualVector() {
    const held = (codes) => codes.some((code) => state.keys.has(code));
    let x = 0;
    let y = 0;
    if (held(CONFIG.controls.left)) x -= 1;
    if (held(CONFIG.controls.right)) x += 1;
    if (held(CONFIG.controls.up)) y -= 1;
    if (held(CONFIG.controls.down)) y += 1;
    const len = Math.hypot(x, y);
    return len ? { x: x / len, y: y / len } : { x: 0, y: 0 };
  }

  function updateManualMovement(vector, dt) {
    const distance = CONFIG.player.speed * dt;
    state.player.facingX = vector.x;
    state.player.facingY = vector.y;
    const moved = movePlayerWithCollision(vector.x * distance, vector.y * distance);
    state.player.walking = moved > 0.02;
  }

  function updateAutoMovement(dt) {
    const waypoint = state.route[state.routeIndex];
    if (!waypoint) return finishRoute();

    const dx = waypoint.x - state.player.x;
    const dy = waypoint.y - state.player.y;
    const distance = Math.hypot(dx, dy);
    const step = CONFIG.player.speed * dt;

    if (distance <= Math.max(4, step)) {
      if (!Geometry.pointIsWalkable(waypoint.x, waypoint.y, WORLD, state.player.radius)) {
        cancelRoute();
        state.player.walking = false;
        showToast(I18N.t("toast.blocked"));
        return;
      }
      state.player.x = waypoint.x;
      state.player.y = waypoint.y;
      state.routeIndex += 1;
      if (state.routeIndex >= state.route.length) finishRoute();
      return;
    }

    const nx = dx / distance;
    const ny = dy / distance;
    state.player.facingX = nx;
    state.player.facingY = ny;
    const moved = movePlayerWithCollision(nx * step, ny * step);
    state.player.walking = moved > 0.02;

    if (moved < 0.02) {
      cancelRoute();
      state.player.walking = false;
      showToast(I18N.t("toast.blocked"));
    }
  }

  function movePlayerWithCollision(dx, dy) {
    const p = state.player;
    const beforeX = p.x;
    const beforeY = p.y;

    const candidateX = Geometry.clamp(p.x + dx, p.radius, WORLD.width - p.radius);
    if (Geometry.pointIsWalkable(candidateX, p.y, WORLD, p.radius)) p.x = candidateX;

    const candidateY = Geometry.clamp(p.y + dy, p.radius, WORLD.height - p.radius);
    if (Geometry.pointIsWalkable(p.x, candidateY, WORLD, p.radius)) p.y = candidateY;

    return Math.hypot(p.x - beforeX, p.y - beforeY);
  }

  function finishRoute() {
    const targetLocationId = state.routeTargetLocationId;
    state.route = [];
    state.routeIndex = 0;
    state.routeTargetLocationId = null;
    state.targetMarker = null;
    state.player.walking = false;

    if (targetLocationId) {
      const location = WORLD.findLocation(targetLocationId);
      if (location && getNearbyLocation()?.id === location.id) activateLocation(location);
    }
  }

  function activateLocation(location) {
    if (isUiBlocked()) return;
    if (NS.Audio) NS.Audio.uiClick();
    if (location.action.type === "external") return openExternalModal(location);
    if (location.action.type === "internal") navigateInternal(location);
  }

  function openLocationFromMenu(locationId) {
    const location = WORLD.findLocation(locationId);
    if (!location) return;
    closeMenu();
    if (location.action.type === "external") openExternalModal(location);
    else navigateInternal(location);
  }

  function openMenu() {
    if (NS.Audio) NS.Audio.uiClick();
    if (!state.experienceActive || !menuLayer.hidden) return;
    menuLayer.hidden = false;
    lockUI("menu");
  }

  function closeMenu() {
    if (menuLayer.hidden) return;
    menuLayer.hidden = true;
    unlockUI("menu");
  }

  function openExternalModal(location) {
    state.externalPendingLocation = location;
    externalModal.hidden = false;
    lockUI("external");
    refreshExternalModalText();
  }

  function refreshExternalModalText() {
    const location = state.externalPendingLocation;
    if (!location) return;
    const url = CONFIG.links[location.action.configKey];
    externalTitle.textContent = I18N.t("external.title", { title: locationTitle(location) });
    externalText.textContent = url === "https://github.com/"
      ? I18N.t("external.placeholder")
      : I18N.t("external.normal");
  }

  function navigateInternal(location) {
    lockUI("transition");
    transitionLayer.classList.add("is-active");
    window.setTimeout(() => {
      const url = new URL(location.action.href, document.baseURI || window.location.href);
      url.searchParams.set("from", location.id);
      url.searchParams.set("lang", state.language);
      url.searchParams.set("sound", state.soundEnabled ? "1" : "0");
      window.location.href = url.href;
    }, CONFIG.transitions.fadeMs);
  }

  function closeExternalModal() {
    externalModal.hidden = true;
    state.externalPendingLocation = null;
    unlockUI("external");
  }

  function confirmExternalNavigation() {
    const location = state.externalPendingLocation;
    if (!location) return closeExternalModal();
    const url = CONFIG.links[location.action.configKey];
    window.open(url, "_blank", "noopener,noreferrer");
    closeExternalModal();
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    state.toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1300);
  }

  function frame(now) {
    try {
      const deltaSeconds = Math.min(0.04, (now - state.lastTime) / 1000);
      state.lastTime = now;
      update(deltaSeconds);
      draw(now);
      requestAnimationFrame(frame);
    } catch (error) {
      showFallback(error);
    }
  }

  function draw(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTerrain();
    drawWaterShimmer(now);
    drawMountainMist(now);
    drawRoute();
    drawLocationAuras(now);
    drawRenderedLocations();
    drawLivingLights(now);
    drawSmoke(now);
    drawPlayer(now);
    drawLocationLabels();
    drawMarkers(now);
    drawDebug();
  }

  function drawTerrain() {
    const base = state.images.baseMap;
    if (base) {
      ctx.drawImage(base, 0, 0, canvas.width, canvas.height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
      gradient.addColorStop(0, "#7a927b");
      gradient.addColorStop(1, "#32524c");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const vignette = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    vignette.addColorStop(0, "rgba(7, 11, 16, 0.02)");
    vignette.addColorStop(1, "rgba(7, 11, 16, 0.16)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }


  function drawWaterShimmer(now) {
    const t = now / 1000;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineCap = "round";
    const zones = [
      { x: 40, y: 770, w: 560, h: 115, count: 15 },
      { x: 300, y: 610, w: 285, h: 145, count: 10 },
      { x: 1240, y: 720, w: 340, h: 150, count: 9 }
    ];
    for (const z of zones) {
      for (let i = 0; i < z.count; i++) {
        const phase = t * (0.65 + i * 0.018) + i * 1.31;
        const x = z.x + ((i * 73 + t * (22 + i % 4 * 4)) % z.w);
        const y = z.y + (i * 37) % z.h + Math.sin(phase) * 7;
        const len = 28 + (i % 4) * 15;
        ctx.strokeStyle = `rgba(205, 242, 238, ${0.13 + (Math.sin(phase) + 1) * 0.06})`;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(x - len / 2, y);
        ctx.quadraticCurveTo(x, y - 5, x + len / 2, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawMountainMist(now) {
    const t = now / 1000;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const wisps = [
      { x: 650, y: 120, rx: 230, ry: 42, speed: 16, a: 0.13 },
      { x: 900, y: 190, rx: 280, ry: 48, speed: 12, a: 0.11 },
      { x: 1190, y: 245, rx: 230, ry: 42, speed: 14, a: 0.10 }
    ];
    for (let i = 0; i < wisps.length; i++) {
      const w = wisps[i];
      const drift = ((t * w.speed + i * 95) % 210) - 105;
      const x = w.x + drift;
      const g = ctx.createRadialGradient(x, w.y, 10, x, w.y, w.rx);
      g.addColorStop(0, `rgba(235,242,244,${w.a})`);
      g.addColorStop(0.55, `rgba(230,240,243,${w.a * 0.72})`);
      g.addColorStop(1, "rgba(225,235,238,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, w.y + Math.sin(t * 0.25 + i) * 7, w.rx, w.ry, -0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLivingLights(now) {
    const t = now / 1000;
    const lights = [
      { x: 318, y: 675, r: 24, warm: true, phase: 0.2 },
      { x: 492, y: 522, r: 22, warm: true, phase: 1.4 },
      { x: 1127, y: 493, r: 25, warm: false, phase: 2.2 },
      { x: 986, y: 112, r: 20, warm: false, phase: 3.1 }
    ];
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const l of lights) {
      const pulse = 0.72 + Math.sin(t * 3.2 + l.phase) * 0.23 + Math.sin(t * 7.1 + l.phase) * 0.08;
      const rgb = l.warm ? "255,180,72" : "83,220,255";
      const g = ctx.createRadialGradient(l.x, l.y, 1, l.x, l.y, l.r * 2.5);
      g.addColorStop(0, `rgba(${rgb},${0.55 * pulse})`);
      g.addColorStop(0.25, `rgba(${rgb},${0.28 * pulse})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSmoke(now) {
    const t = now / 1000;
    const sources = [
      // Analytics: particles now originate directly at the chimney mouth.
      { x: 320, y: 594, spread: 18, rise: 108, count: 9, a: 0.28, speed: 0.23 },
      // About: campfire smoke + the small stove/chimney behind the tent.
      { x: 493, y: 515, spread: 15, rise: 72, count: 7, a: 0.21, speed: 0.26 },
      { x: 516, y: 478, spread: 16, rise: 94, count: 8, a: 0.23, speed: 0.22 },
      { x: 1000, y: 105, spread: 24, rise: 92, count: 6, a: 0.17, speed: 0.19 }
    ];
    ctx.save();
    for (let s = 0; s < sources.length; s++) {
      const src = sources[s];
      for (let i = 0; i < src.count; i++) {
        const cycle = (t * src.speed + i / src.count) % 1;
        const y = src.y - cycle * src.rise;
        const x = src.x + Math.sin(t * 1.05 + i * 1.9 + s) * src.spread * cycle;
        const r = 7 + cycle * 23;
        const alpha = src.a * Math.sin(Math.PI * cycle);
        const g = ctx.createRadialGradient(x, y, 1, x, y, r);
        g.addColorStop(0, `rgba(235,232,220,${alpha})`);
        g.addColorStop(0.55, `rgba(225,225,218,${alpha * 0.55})`);
        g.addColorStop(1, "rgba(225,225,215,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawLocationAuras(now) {
    for (const location of WORLD.locations) {
      const active = state.hoveredLocationId === location.id || state.nearbyLocationId === location.id;
      if (!active) continue;
      const pulse = 0.18 + (Math.sin(now / 180) + 1) * 0.08;
      ctx.save();
      ctx.globalAlpha = 0.9;
      const g = ctx.createRadialGradient(location.interactionPoint.x, location.interactionPoint.y, 6, location.interactionPoint.x, location.interactionPoint.y, 40);
      g.addColorStop(0, `rgba(255, 239, 181, ${0.95})`);
      g.addColorStop(0.35, `rgba(255, 239, 181, ${0.22 + pulse})`);
      g.addColorStop(1, "rgba(255, 239, 181, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(location.interactionPoint.x, location.interactionPoint.y, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawRenderedLocations() {
    for (const location of WORLD.locations) {
      if (!location.render) continue;
      const image = state.images[location.render.assetKey];
      if (!image) continue;
      const active = state.hoveredLocationId === location.id || state.nearbyLocationId === location.id;
      ctx.save();
      if (active) {
        ctx.shadowColor = "rgba(255, 227, 157, 0.55)";
        ctx.shadowBlur = 24;
      }
      ctx.drawImage(image, location.render.x, location.render.y, location.render.width, location.render.height);
      ctx.restore();
    }
  }

  function drawLocationLabels() {
    for (const location of WORLD.locations) {
      const active = state.hoveredLocationId === location.id || state.nearbyLocationId === location.id;
      drawLocationLabel(location, active);
    }
  }

  function drawLocationLabel(location, active) {
    const centerX = location.label?.x ?? (location.x + location.width / 2);
    const baseY = location.label?.y ?? (location.y - 12);
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = `${active ? 800 : 750} ${active ? 22 : 19}px system-ui`;
    const title = locationTitle(location);
    const metrics = ctx.measureText(title);
    const padX = 12;
    const boxW = metrics.width + padX * 2;
    const boxH = 32;
    ctx.fillStyle = active ? "rgba(18, 24, 22, 0.92)" : "rgba(18, 24, 22, 0.72)";
    roundRect(ctx, centerX - boxW / 2, baseY - boxH + 6, boxW, boxH, 10);
    ctx.fill();
    ctx.fillStyle = active ? "#fff3cf" : "#f3f1e8";
    ctx.fillText(title, centerX, baseY);
    ctx.restore();
  }

  function drawRoute() {
    if (!CONFIG.debug.showPath || !state.route.length) return;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 246, 204, 0.55)";
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(state.player.x, state.player.y);
    for (let i = state.routeIndex; i < state.route.length; i += 1) ctx.lineTo(state.route[i].x, state.route[i].y);
    ctx.stroke();
    ctx.restore();
  }

  function drawMarkers(now) {
    if (state.targetMarker) {
      const pulse = 0.55 + Math.sin((now - state.targetMarker.bornAt) / 120) * 0.18;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 242, 186, ${pulse})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(state.targetMarker.x, state.targetMarker.y, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (state.deniedMarker) {
      const age = now - state.deniedMarker.bornAt;
      if (age > 800) {
        state.deniedMarker = null;
      } else {
        ctx.save();
        ctx.globalAlpha = 1 - age / 800;
        ctx.strokeStyle = "#ff8d7f";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(state.deniedMarker.x - 12, state.deniedMarker.y - 12);
        ctx.lineTo(state.deniedMarker.x + 12, state.deniedMarker.y + 12);
        ctx.moveTo(state.deniedMarker.x + 12, state.deniedMarker.y - 12);
        ctx.lineTo(state.deniedMarker.x - 12, state.deniedMarker.y + 12);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function drawPlayer(now) {
    if (!state.experienceActive) return;
    const p = state.player;
    const bob = p.walking ? Math.sin(now / 75) * 2.2 : Math.sin(now / 700) * 0.6;
    const image = state.images.player;

    ctx.save();
    ctx.translate(p.x, p.y + bob);

    ctx.fillStyle = "rgba(0, 0, 0, 0.23)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 17, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (image) {
      const width = CONFIG.player.spriteWidth;
      const height = CONFIG.player.spriteHeight;
      const flip = p.facingX < -0.22 ? -1 : 1;
      ctx.scale(flip, 1);
      ctx.drawImage(image, -width / 2, -height + 8, width, height);
    } else {
      drawFallbackPlayer();
    }

    ctx.restore();
  }

  function drawFallbackPlayer() {
    ctx.fillStyle = "#6b4831";
    roundRect(ctx, -13, -7, 26, 26, 8);
    ctx.fill();
    ctx.fillStyle = "#d6b66d";
    roundRect(ctx, -10, -12, 20, 27, 8);
    ctx.fill();
    ctx.fillStyle = "#e1b58c";
    ctx.beginPath();
    ctx.arc(0, -19, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3e3a30";
    ctx.fillRect(-13, -28, 26, 5);
    roundRect(ctx, -9, -35, 18, 11, 5);
    ctx.fill();
  }

  function drawDebug() {
    if (CONFIG.debug.showCollisionBoxes) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 77, 77, 0.8)";
      ctx.lineWidth = 2;
      for (const obstacle of WORLD.obstacles) ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.restore();
    }

    if (CONFIG.debug.showInteractionPoints) {
      ctx.save();
      for (const location of WORLD.locations) {
        ctx.fillStyle = "#00ffff";
        ctx.beginPath();
        ctx.arc(location.interactionPoint.x, location.interactionPoint.y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (CONFIG.debug.showGrid) {
      const size = CONFIG.pathfinding.cellSize;
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= WORLD.width; x += size) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.height); ctx.stroke();
      }
      for (let y = 0; y <= WORLD.height; y += size) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.width, y); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function roundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  boot();
})();
