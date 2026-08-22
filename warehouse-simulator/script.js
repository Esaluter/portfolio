(() => {
  'use strict';

  const ZONES = [
    { id: 'receiving', key: 'zone.receiving' },
    { id: 'putaway', key: 'zone.putaway' },
    { id: 'picking', key: 'zone.picking' },
    { id: 'packing', key: 'zone.packing' },
    { id: 'shipping', key: 'zone.shipping' }
  ];

  const GLOBAL_UPGRADES = [
    { id: 'training', titleKey: 'global.training', descKey: 'global.training.desc' },
    { id: 'equipment', titleKey: 'global.equipment', descKey: 'global.equipment.desc' },
    { id: 'optimization', titleKey: 'global.optimization', descKey: 'global.optimization.desc' }
  ];

  const STORAGE = {
    lang: 'warehouseSimulator.lang',
    bestEndless: 'warehouseSimulator.bestEndless',
    sound: 'warehouseSimulator.sound',
    hintsSeen: 'warehouseSimulator.hintsSeen'
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const dom = {
    money: $('#moneyKpi'),
    sla: $('#slaKpi'),
    incoming: $('#incomingKpi'),
    shipped: $('#shippedKpi'),
    time: $('#timeKpi'),
    freeStaff: $('#freeStaffKpi'),
    speed: $('#speedKpi'),
    criticalBanner: $('#criticalBanner'),
    shutdownCountdown: $('#shutdownCountdown'),
    inboundAmount: $('#inboundAmount'),
    inboundBar: $('#inboundBar'),
    warehouseFlow: $('#warehouseFlow'),
    freeStaffDetail: $('#freeStaffDetail'),
    totalStaffDetail: $('#totalStaffDetail'),
    freeStaffIcons: $('#freeStaffIcons'),
    hireBtn: $('#hireBtn'),
    fireBtn: $('#fireBtn'),
    hireCost: $('#hireCost'),
    globalUpgrades: $('#globalUpgrades'),
    eventLog: $('#eventLog'),
    langToggle: $('#langToggle'),
    startLangToggle: $('#startLangToggle'),
    startOverlay: $('#startOverlay'),
    scenarioList: $('#scenarioList'),
    startBtn: $('#startBtn'),
    eventOverlay: $('#eventOverlay'),
    eventType: $('#eventType'),
    eventTitle: $('#eventTitle'),
    eventBody: $('#eventBody'),
    eventChoices: $('#eventChoices'),
    shutdownOverlay: $('#shutdownOverlay'),
    shutdownStats: $('#shutdownStats'),
    restartBtn: $('#restartBtn'),
    chooseScenarioBtn: $('#chooseScenarioBtn'),
    toast: $('#toast'),
    transferLayer: $('#transferLayer'),
    activeEffects: $('#activeEffects'),
    helpBtn: $('#helpBtn'),
    helpStripBtn: $('#helpStripBtn'),
    startHelpBtn: $('#startHelpBtn'),
    helpOverlay: $('#helpOverlay'),
    closeHelpBtn: $('#closeHelpBtn'),
    firstRunHints: $('#firstRunHints'),
    dismissHintsBtn: $('#dismissHintsBtn'),
    soundBtn: $('#soundBtn'),
    shutdownRating: $('#shutdownRating'),
    shutdownQuote: $('#shutdownQuote'),
    slaChart: $('#slaChart'),
    incomingChart: $('#incomingChart')
  };

  let language = localStorage.getItem(STORAGE.lang) || 'ru';
  if (!window.WAREHOUSE_TRANSLATIONS[language]) language = 'en';

  let selectedScenarioId = 'endless';
  let state = null;
  let lastFrame = performance.now();
  let uiAccumulator = 0;
  let toastTimer = null;
  let helpRestoreSpeed = null;
  let soundEnabled = localStorage.getItem(STORAGE.sound) === '1';
  let audioContext = null;
  let lastShipmentSoundAt = 0;

  function t(key) {
    return window.WAREHOUSE_TRANSLATIONS[language]?.[key]
      || window.WAREHOUSE_TRANSLATIONS.en?.[key]
      || key;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function formatMoney(value) {
    return `$${Math.max(0, Math.floor(value)).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}`;
  }

  function formatNumber(value, digits = 0) {
    return Number(value).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US', {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits
    });
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const m = Math.floor(safe / 60).toString().padStart(2, '0');
    const s = (safe % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeQueue(capacity = Infinity) {
    return { capacity, cohorts: [] };
  }

  function queueAmount(queue) {
    let sum = 0;
    for (const cohort of queue.cohorts) sum += cohort.amount;
    return sum;
  }

  function addCohort(queue, amount, age) {
    if (amount <= 0.00001) return;
    const last = queue.cohorts[queue.cohorts.length - 1];
    if (last && Math.abs(last.age - age) < 1) {
      const total = last.amount + amount;
      last.age = ((last.age * last.amount) + (age * amount)) / total;
      last.amount = total;
    } else {
      queue.cohorts.push({ amount, age });
    }
  }

  function takeFromQueue(queue, amount) {
    let remaining = amount;
    const moved = [];

    while (remaining > 0.00001 && queue.cohorts.length) {
      const cohort = queue.cohorts[0];
      const part = Math.min(cohort.amount, remaining);
      moved.push({ amount: part, age: cohort.age });
      cohort.amount -= part;
      remaining -= part;
      if (cohort.amount <= 0.00001) queue.cohorts.shift();
    }
    return moved;
  }

  function ageAllQueues(dt) {
    for (const queue of state.queues) {
      for (const cohort of queue.cohorts) cohort.age += dt;
    }
  }

  function createEmployee(type, zone, trainingLeft = 0) {
    return {
      id: ++state.employeeSequence,
      type,
      zone,
      trainingLeft
    };
  }

  function buildEmployees(config) {
    state.employees = [];
    state.employeeSequence = 0;
    for (const zone of ZONES) {
      const init = config[zone.id] || { worker: 0, trainee: 0 };
      for (let i = 0; i < init.worker; i++) state.employees.push(createEmployee('worker', zone.id));
      for (let i = 0; i < init.trainee; i++) state.employees.push(createEmployee('trainee', zone.id, adjustedTrainingDuration()));
    }
    const free = config.free || { worker: 0, trainee: 0 };
    for (let i = 0; i < free.worker; i++) state.employees.push(createEmployee('worker', null));
    for (let i = 0; i < free.trainee; i++) state.employees.push(createEmployee('trainee', null, adjustedTrainingDuration()));
  }

  function employeesInZone(zoneId, type = null) {
    return state.employees.filter((employee) => employee.zone === zoneId && (!type || employee.type === type));
  }

  function freeEmployees(type = null) {
    return state.employees.filter((employee) => employee.zone === null && (!type || employee.type === type));
  }

  function adjustedTrainingDuration() {
    if (!state) return 90;
    const level = state.globalLevels?.training || 0;
    return state.scenario.trainingDuration * Math.pow(0.88, level);
  }

  function processRate(zoneId) {
    const zoneIndex = ZONES.findIndex((zone) => zone.id === zoneId);
    const workers = employeesInZone(zoneId, 'worker').length;
    const trainees = employeesInZone(zoneId, 'trainee').length;
    const trainingLevel = state.globalLevels.training;
    const equipmentLevel = state.globalLevels.equipment;
    const optimizationLevel = state.globalLevels.optimization;

    const workerEfficiency = state.scenario.workerProductivity * (1 + trainingLevel * 0.055);
    const traineeEfficiency = state.scenario.traineeProductivity * (1 + trainingLevel * 0.035);
    const effectiveStaff = workers * workerEfficiency + trainees * traineeEfficiency;
    const zoneLevelMultiplier = 1 + (state.zoneLevels[zoneId] - 1) * state.scenario.zoneUpgradeBonus;
    const equipmentMultiplier = 1 + equipmentLevel * 0.055;
    const optimizationMultiplier = 1 + optimizationLevel * 0.045;

    let modifier = 1;
    for (const active of state.modifiers) {
      if (active.target === zoneId || active.target === 'all') modifier *= active.factor;
    }

    const base = state.scenario.processBasePerWorker[zoneId];
    const rate = base * effectiveStaff * zoneLevelMultiplier * equipmentMultiplier * optimizationMultiplier * modifier;
    return Math.max(0, rate || 0);
  }

  function currentIncomingRate() {
    const minutes = state.gameTime / 60;
    let rate = state.scenario.baseIncomingPerMinute * (1 + state.scenario.growthPerGameMinute * minutes);
    if (state.peak.active) rate *= state.peak.multiplier;
    for (const active of state.modifiers) {
      if (active.target === 'incoming') rate *= active.factor;
    }
    return rate;
  }

  function currentIncomePerUnit() {
    let value = state.scenario.incomePerUnit;
    for (const active of state.modifiers) {
      if (active.target === 'income') value *= active.factor;
    }
    return value;
  }

  function currentHireCost() {
    const baseline = 12;
    const extra = Math.max(0, state.employees.length - baseline);
    return Math.round(state.scenario.hireCost * Math.pow(1.035, extra));
  }

  function zoneUpgradeCost(zoneId) {
    const level = state.zoneLevels[zoneId];
    return Math.round(state.scenario.zoneUpgradeBaseCost * Math.pow(state.scenario.upgradeCostGrowth, level - 1));
  }

  function bufferUpgradeCost(index) {
    const level = state.bufferLevels[index];
    return Math.round(state.scenario.bufferUpgradeBaseCost * Math.pow(state.scenario.upgradeCostGrowth, level - 1));
  }

  function globalUpgradeCost(id) {
    const level = state.globalLevels[id];
    return Math.round(state.scenario.globalUpgradeBaseCost * Math.pow(state.scenario.upgradeCostGrowth, level));
  }

  function resetGame(scenarioId) {
    const scenario = deepClone(window.WAREHOUSE_SCENARIOS[scenarioId]);
    state = {
      phase: 'playing', scenario, scenarioId, gameTime: 0, speed: 1, speedBeforeDecision: 1,
      money: scenario.startBudget, earned: 0, shipped: 0, incomingTotal: 0,
      queues: [makeQueue(Infinity), makeQueue(scenario.bufferCapacity[0]), makeQueue(scenario.bufferCapacity[1]), makeQueue(scenario.bufferCapacity[2]), makeQueue(scenario.bufferCapacity[3])],
      zoneLevels: Object.fromEntries(ZONES.map((zone) => [zone.id, 1])),
      bufferLevels: [1, 1, 1, 1], globalLevels: { training: 0, equipment: 0, optimization: 0 },
      modifiers: [], employeeSequence: 0, employees: [], sla: 100, slaSum: 0, slaTime: 0, criticalTime: 0,
      maxQueue: 0, bottleneckTime: Object.fromEntries(ZONES.map((zone) => [zone.id, 0])),
      peak: { active: false, endAt: 0, multiplier: 1 },
      nextPeakAt: scenario.peak.enabled ? randomBetween(scenario.peak.everyMin, scenario.peak.everyMax) : Infinity,
      nextEventAt: randomBetween(scenario.eventFrequency.min, scenario.eventFrequency.max),
      eventHistory: {}, lastEventId: null, logs: [], currentDecision: null,
      lastShippedFlash: 0, lastShipmentValue: 0,
      history: { sla: [], incoming: [], nextSampleAt: 0 }, shutdownQuoteIndex: Math.floor(Math.random() * 5) + 1
    };

    buildEmployees(scenario.initialStaff);
    dom.shutdownOverlay.classList.remove('visible');
    dom.eventOverlay.classList.remove('visible');
    dom.helpOverlay.classList.remove('visible');
    dom.startOverlay.classList.remove('visible');
    lastFrame = performance.now();
    uiAccumulator = 1;
    addLog('information', scenario.titleKey, 'start.subtitle');
    renderFirstRunHints();
    sampleHistory(true);
    renderAll();
  }

  function simulationTick(dt) {
    if (!state || state.phase !== 'playing' || state.speed === 0) return;

    state.gameTime += dt;
    ageAllQueues(dt);
    updateTraining(dt);
    updateModifiers();
    updatePeak();
    updateEvents();

    const incoming = currentIncomingRate() * (dt / 60);
    addCohort(state.queues[0], incoming, 0);
    state.incomingTotal += incoming;

    // Downstream-first processing frees buffer capacity before upstream zones act.
    for (let i = ZONES.length - 1; i >= 0; i--) processZone(i, dt);

    updateSla(dt);
    updateBottleneckStats(dt);
    sampleHistory();
  }

  function processZone(index, dt) {
    const zone = ZONES[index];
    const inputQueue = state.queues[index];
    const capacityThisTick = processRate(zone.id) * (dt / 60);
    const inputAmount = queueAmount(inputQueue);
    if (capacityThisTick <= 0 || inputAmount <= 0) return;

    let allowed = Math.min(capacityThisTick, inputAmount);
    if (index < ZONES.length - 1) {
      const outputQueue = state.queues[index + 1];
      const outputSpace = Math.max(0, outputQueue.capacity - queueAmount(outputQueue));
      allowed = Math.min(allowed, outputSpace);
      if (allowed <= 0) return;
    }

    const moved = takeFromQueue(inputQueue, allowed);
    const movedAmount = moved.reduce((sum, cohort) => sum + cohort.amount, 0);

    if (index === ZONES.length - 1) {
      state.shipped += movedAmount;
      const income = movedAmount * currentIncomePerUnit();
      state.money += income;
      state.earned += income;
      if (movedAmount > 0.02) {
        state.lastShippedFlash = performance.now();
        state.lastShipmentValue = income;
        if (performance.now() - lastShipmentSoundAt > 900) {
          playSound('shipment');
          lastShipmentSoundAt = performance.now();
        }
      }
    } else {
      const outputQueue = state.queues[index + 1];
      for (const cohort of moved) addCohort(outputQueue, cohort.amount, cohort.age);
    }
  }

  function updateTraining(dt) {
    let graduated = 0;
    for (const employee of state.employees) {
      if (employee.type !== 'trainee') continue;
      employee.trainingLeft -= dt;
      if (employee.trainingLeft <= 0) {
        employee.type = 'worker';
        employee.trainingLeft = 0;
        graduated++;
      }
    }
    if (graduated > 0) {
      showToast(t('toast.graduated'));
      addLog('information', 'global.training', 'toast.graduated');
    }
  }

  function updateModifiers() {
    if (!state.modifiers.length) return;
    state.modifiers = state.modifiers.filter((modifier) => modifier.expiresAt > state.gameTime);
  }

  function updatePeak() {
    const peakConfig = state.scenario.peak;
    if (!peakConfig.enabled) return;

    if (state.peak.active && state.gameTime >= state.peak.endAt) {
      state.peak.active = false;
      state.peak.multiplier = 1;
      state.nextPeakAt = state.gameTime + randomBetween(peakConfig.everyMin, peakConfig.everyMax);
      addLog('information', 'peak.end.title', 'peak.end.body');
    }

    if (!state.peak.active && state.gameTime >= state.nextPeakAt) {
      state.peak.active = true;
      state.peak.multiplier = randomBetween(peakConfig.multiplierMin, peakConfig.multiplierMax);
      state.peak.endAt = state.gameTime + randomBetween(peakConfig.durationMin, peakConfig.durationMax);
      addLog('problem', 'peak.start.title', 'peak.start.body');
    }
  }

  function updateEvents() {
    if (state.currentDecision || state.gameTime < state.nextEventAt) return;
    const pool = state.scenario.eventPool || [];
    if (!pool.length) return;

    const eligible = pool
      .map((id) => window.WAREHOUSE_EVENTS[id])
      .filter(Boolean)
      .filter(eventIsEligible);

    state.nextEventAt = state.gameTime + randomBetween(state.scenario.eventFrequency.min, state.scenario.eventFrequency.max);
    if (!eligible.length) {
      state.nextEventAt = Math.min(state.nextEventAt, state.gameTime + 18);
      return;
    }

    const event = weightedEventChoice(eligible);
    if (event) triggerEvent(event);
  }

  function triggerEvent(event) {
    state.eventHistory[event.id] = state.gameTime;
    state.lastEventId = event.id;
    playSound(event.type === 'problem' ? 'warning' : 'event');

    if (event.type === 'information') {
      if (event.effect || event.effects) applyEventEffects(event.effects || [event.effect], event.titleKey, false);
      addLog('information', event.titleKey, event.bodyKey);
      return;
    }

    if (event.type === 'problem') {
      applyEventEffects(event.effects || [event.effect], event.titleKey, true);
      addLog('problem', event.titleKey, event.bodyKey);
      return;
    }

    if (event.type === 'decision') openDecision(event);
  }

  function openDecision(event) {
    state.currentDecision = event;
    state.speedBeforeDecision = state.speed || 1;
    state.speed = 0;
    renderDecision(event);
    dom.eventOverlay.classList.add('visible');
    addLog('decision', event.titleKey, event.bodyKey);
    renderSpeedButtons();
  }

  function resolveDecision(event, choice) {
    if (choice.cost) {
      if (state.money < choice.cost) return showToast(t('toast.noMoney'));
      state.money -= choice.cost;
    }

    if (choice.action === 'trainAll') {
      for (const trainee of state.employees.filter((employee) => employee.type === 'trainee')) {
        trainee.type = 'worker'; trainee.trainingLeft = 0;
      }
    } else if (choice.action === 'addTrainee') {
      state.employees.push(createEmployee('trainee', null, adjustedTrainingDuration()));
    } else if (choice.action === 'addWorker') {
      state.employees.push(createEmployee('worker', null, 0));
    }

    if (choice.effect || choice.effects) applyEventEffects(choice.effects || [choice.effect], event.titleKey, false);
    if (choice.resultKey) addLog('decision', event.titleKey, choice.resultKey);

    state.currentDecision = null;
    dom.eventOverlay.classList.remove('visible');
    state.speed = state.speedBeforeDecision;
    playSound('ui');
    renderAll();
  }

  function updateSla(dt) {
    let total = 0;
    let weightedAge = 0;
    let overdue = 0;
    let maxFill = 0;

    for (let i = 0; i < state.queues.length; i++) {
      const queue = state.queues[i];
      for (const cohort of queue.cohorts) {
        total += cohort.amount;
        weightedAge += cohort.amount * cohort.age;
        if (cohort.age > state.scenario.slaTargetAge) overdue += cohort.amount;
      }
      if (i > 0) maxFill = Math.max(maxFill, queueAmount(queue) / queue.capacity);
    }

    if (total < 0.01) {
      state.sla = 100;
    } else {
      const avgAge = weightedAge / total;
      const overdueShare = overdue / total;
      const agePenalty = Math.min(30, (avgAge / state.scenario.slaTargetAge) * 24);
      const overduePenalty = overdueShare * 58;
      const pressurePenalty = Math.max(0, maxFill - 0.72) * 32;
      state.sla = clamp(100 - agePenalty - overduePenalty - pressurePenalty, 0, 100);
    }

    state.slaSum += state.sla * dt;
    state.slaTime += dt;

    if (state.sla < state.scenario.criticalSla) {
      state.criticalTime += dt;
    } else {
      state.criticalTime = Math.max(0, state.criticalTime - dt * 1.65);
    }

    if (state.criticalTime >= state.scenario.shutdownAfter) shutdown();
  }

  function currentBottleneck() {
    let best = { zoneId: 'receiving', pressure: 0 };
    const inboundAmount = queueAmount(state.queues[0]);
    const inboundReference = Math.max(20, currentIncomingRate() * 1.5);
    best.pressure = inboundAmount / inboundReference;

    for (let i = 1; i < state.queues.length; i++) {
      const pressure = queueAmount(state.queues[i]) / state.queues[i].capacity;
      if (pressure > best.pressure) best = { zoneId: ZONES[i].id, pressure };
    }
    return best;
  }

  function updateBottleneckStats(dt) {
    for (let i = 1; i < state.queues.length; i++) {
      state.maxQueue = Math.max(state.maxQueue, queueAmount(state.queues[i]));
    }
    const bottleneck = currentBottleneck();
    if (bottleneck.pressure > 0.52) state.bottleneckTime[bottleneck.zoneId] += dt;
  }

  function mainBottleneckId() {
    return Object.entries(state.bottleneckTime).sort((a, b) => b[1] - a[1])[0]?.[0] || 'receiving';
  }

  function calculateScore() {
    const avgSla = state.slaTime ? state.slaSum / state.slaTime : state.sla;
    return Math.max(0, Math.round(state.shipped * 32 + state.gameTime * 2.2 + avgSla * 16 + state.earned * 0.08));
  }

  function shutdown() {
    if (state.phase === 'shutdown') return;
    state.phase = 'shutdown'; state.speed = 0; state.currentDecision = null;
    dom.eventOverlay.classList.remove('visible');
    sampleHistory(true);

    const score = calculateScore();
    let best = Number(localStorage.getItem(STORAGE.bestEndless) || 0);
    if (state.scenarioId === 'endless' && score > best) {
      best = score;
      localStorage.setItem(STORAGE.bestEndless, String(score));
    }

    dom.shutdownOverlay.classList.add('visible');
    renderShutdownStats(score, best);
    playSound('shutdown');
    renderAll();
    requestAnimationFrame(drawShutdownCharts);
  }

  function renderShutdownStats(score, best) {
    const avgSla = state.slaTime ? state.slaSum / state.slaTime : state.sla;
    const bottleneck = ZONES.find((zone) => zone.id === mainBottleneckId());
    const rows = [
      ['shutdown.time', formatTime(state.gameTime)], ['shutdown.shipped', formatNumber(state.shipped, 0)],
      ['shutdown.earned', formatMoney(state.earned)], ['shutdown.finalSla', `${formatNumber(state.sla, 1)}%`],
      ['shutdown.avgSla', `${formatNumber(avgSla, 1)}%`], ['shutdown.maxQueue', formatNumber(state.maxQueue, 1)],
      ['shutdown.bottleneck', t(bottleneck.key)], ['shutdown.score', formatNumber(score, 0)]
    ];
    if (state.scenarioId === 'endless') rows.push(['shutdown.best', formatNumber(best, 0)]);

    dom.shutdownStats.innerHTML = rows.map(([key, value]) => `<div class="stat-row"><span>${escapeHtml(t(key))}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
    dom.shutdownRating.textContent = t(shutdownRatingKey(avgSla));
    dom.shutdownQuote.textContent = t(`shutdown.quote.${state.shutdownQuoteIndex || 1}`);
  }

  function hireEmployee() {
    if (!state || state.phase !== 'playing') return;
    const cost = currentHireCost();
    if (state.money < cost) return showToast(t('toast.noMoney'));
    state.money -= cost;
    state.employees.push(createEmployee('trainee', null, adjustedTrainingDuration()));
    showToast(t('toast.hired'));
    playSound('ui');
    renderAll();
  }

  function fireEmployee() {
    if (!state || state.phase !== 'playing') return;
    const free = freeEmployees();
    if (!free.length) return showToast(t('toast.noFreeToFire'));
    const target = free.find((employee) => employee.type === 'trainee') || free[free.length - 1];
    state.employees = state.employees.filter((employee) => employee.id !== target.id);
    playSound('ui');
    renderAll();
  }

  function assignEmployee(zoneId) {
    if (!state || state.phase !== 'playing') return;
    const free = freeEmployees();
    if (!free.length) return showToast(t('toast.noFreeStaff'));
    const employee = free.find((item) => item.type === 'worker') || free[0];
    employee.zone = zoneId;
    animateTransfer('staff-panel', `zone-${zoneId}`);
    showToast(t('toast.staffMoved'));
    renderAll();
  }

  function unassignEmployee(zoneId) {
    if (!state || state.phase !== 'playing') return;
    const assigned = employeesInZone(zoneId);
    if (!assigned.length) return showToast(t('toast.nobodyToRemove'));
    const employee = assigned.find((item) => item.type === 'trainee') || assigned[assigned.length - 1];
    employee.zone = null;
    animateTransfer(`zone-${zoneId}`, 'staff-panel');
    showToast(t('toast.staffMoved'));
    renderAll();
  }

  function buyZoneUpgrade(zoneId) {
    if (!state || state.phase !== 'playing') return;
    if (state.zoneLevels[zoneId] >= state.scenario.maxZoneLevel) return;
    const cost = zoneUpgradeCost(zoneId);
    if (state.money < cost) return showToast(t('toast.noMoney'));
    state.money -= cost;
    state.zoneLevels[zoneId]++;
    showToast(t('toast.upgraded'));
    playSound('upgrade');
    renderAll();
  }

  function buyBufferUpgrade(index) {
    if (!state || state.phase !== 'playing') return;
    if (state.bufferLevels[index] >= state.scenario.maxBufferLevel) return;
    const cost = bufferUpgradeCost(index);
    if (state.money < cost) return showToast(t('toast.noMoney'));
    state.money -= cost;
    state.bufferLevels[index]++;
    state.queues[index + 1].capacity += state.scenario.bufferUpgradeBonus;
    showToast(t('toast.bufferUpgraded'));
    playSound('upgrade');
    renderAll();
  }

  function buyGlobalUpgrade(id) {
    if (!state || state.phase !== 'playing') return;
    if (state.globalLevels[id] >= state.scenario.maxGlobalLevel) return;
    const cost = globalUpgradeCost(id);
    if (state.money < cost) return showToast(t('toast.noMoney'));
    state.money -= cost;
    state.globalLevels[id]++;
    showToast(t('toast.upgraded'));
    playSound('upgrade');
    renderAll();
  }

  function setSpeed(speed) {
    if (!state || state.phase !== 'playing' || state.currentDecision) return;
    state.speed = speed;
    renderSpeedButtons();
    renderKpis();
  }

  function zoneStatus(index) {
    const zoneId = ZONES[index].id;
    const rate = processRate(zoneId);
    const input = queueAmount(state.queues[index]);
    const inputPressure = index === 0
      ? input / Math.max(20, currentIncomingRate() * 1.5)
      : input / state.queues[index].capacity;

    let blocked = false;
    if (index < ZONES.length - 1) {
      const output = state.queues[index + 1];
      blocked = queueAmount(output) >= output.capacity - 0.01;
    }
    if (blocked) return { key: 'status.blocked', cls: 'blocked' };

    const bottleneck = currentBottleneck();
    if (bottleneck.zoneId === zoneId && bottleneck.pressure > 0.58) return { key: 'status.bottleneck', cls: 'bottleneck' };
    if (inputPressure > 0.5 || rate < currentIncomingRate() * 0.9) return { key: 'status.busy', cls: 'busy' };
    return { key: 'status.ok', cls: 'ok' };
  }

  function renderAll() {
    renderI18n();
    renderKpis();
    renderWarehouse();
    renderStaff();
    renderGlobalUpgrades();
    renderActiveEffects();
    renderEventLog();
    renderCritical();
    renderSpeedButtons();
  }

  function renderI18n() {
    document.documentElement.lang = language;
    document.title = t('app.title');
    $$('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    $$('[data-tooltip-key]').forEach((node) => { node.dataset.tip = t(node.dataset.tooltipKey); });
    dom.langToggle.textContent = language === 'ru' ? 'EN' : 'RU';
    dom.startLangToggle.textContent = language === 'ru' ? 'EN' : 'RU';
    renderSoundButton();
    renderScenarioList();
  }

  function renderKpis() {
    if (!state) return;
    const free = freeEmployees().length;
    dom.money.textContent = formatMoney(state.money);
    dom.sla.textContent = `${formatNumber(state.sla, 1)}%`;
    dom.incoming.textContent = formatNumber(currentIncomingRate(), 1);
    dom.shipped.textContent = formatNumber(state.shipped, 0);
    dom.time.textContent = formatTime(state.gameTime);
    dom.freeStaff.textContent = String(free);
    dom.speed.textContent = state.speed === 0 ? t('control.paused') : `×${state.speed}`;

    const slaCard = dom.sla.closest('.kpi-card');
    slaCard.classList.remove('good', 'warning', 'danger');
    slaCard.classList.add(state.sla < state.scenario.criticalSla ? 'danger' : state.sla < 82 ? 'warning' : 'good');
  }

  function renderWarehouse() {
    if (!state) return;
    const inbound = queueAmount(state.queues[0]);
    const inboundReference = Math.max(30, currentIncomingRate() * 2);
    dom.inboundAmount.textContent = formatNumber(inbound, 1);
    dom.inboundBar.style.width = `${clamp((inbound / inboundReference) * 100, 0, 100)}%`;

    const pieces = [];
    for (let i = 0; i < ZONES.length; i++) {
      pieces.push(zoneCardHtml(i));
      if (i < ZONES.length - 1) pieces.push(bufferCardHtml(i));
    }
    dom.warehouseFlow.innerHTML = pieces.join('');

    dom.warehouseFlow.querySelectorAll('[data-action="assign"]').forEach((button) => button.addEventListener('click', () => assignEmployee(button.dataset.zone)));
    dom.warehouseFlow.querySelectorAll('[data-action="unassign"]').forEach((button) => button.addEventListener('click', () => unassignEmployee(button.dataset.zone)));
    dom.warehouseFlow.querySelectorAll('[data-action="zone-upgrade"]').forEach((button) => button.addEventListener('click', () => buyZoneUpgrade(button.dataset.zone)));
    dom.warehouseFlow.querySelectorAll('[data-action="buffer-upgrade"]').forEach((button) => button.addEventListener('click', () => buyBufferUpgrade(Number(button.dataset.buffer))));

    if (performance.now() - state.lastShippedFlash < 420) {
      const shipping = document.getElementById('zone-shipping');
      shipping?.classList.add('ship-flash');
      if (shipping) {
        const pop = document.createElement('span');
        pop.className = 'shipping-feedback';
        pop.textContent = `+${formatMoney(state.lastShipmentValue)}`;
        shipping.appendChild(pop);
      }
    }
  }

  function zoneCardHtml(index) {
    const zone = ZONES[index];
    const workers = employeesInZone(zone.id, 'worker').length;
    const trainees = employeesInZone(zone.id, 'trainee').length;
    const status = zoneStatus(index);
    const level = state.zoneLevels[zone.id];
    const maxed = level >= state.scenario.maxZoneLevel;
    const cost = zoneUpgradeCost(zone.id);

    return `
      <article class="zone-card ${status.cls}" id="zone-${zone.id}">
        <div class="zone-header"><div class="zone-name">${escapeHtml(t(zone.key))}</div><div class="zone-level">${escapeHtml(t('zone.level'))} ${level}</div></div>
        ${zoneSceneHtml(zone.id, workers, trainees)}
        <div class="zone-metrics">
          <div class="metric-line"><span class="tip-target" data-tip="${escapeAttr(t('tooltip.worker'))}">${escapeHtml(t('zone.workers'))}</span><strong>${workers}</strong></div>
          <div class="metric-line"><span class="tip-target" data-tip="${escapeAttr(t('tooltip.trainee'))}">${escapeHtml(t('zone.trainees'))}</span><strong>${trainees}</strong></div>
          <div class="metric-line"><span class="tip-target" data-tip="${escapeAttr(t('tooltip.capacity'))}">${escapeHtml(t('zone.capacity'))}</span><strong>${formatNumber(processRate(zone.id), 1)}</strong></div>
          <div class="metric-line"><span>${escapeHtml(t('zone.status'))}</span><span class="status-chip ${status.cls}">${escapeHtml(t(status.key))}</span></div>
        </div>
        <div class="zone-controls"><button class="mini-btn" type="button" data-action="unassign" data-zone="${zone.id}">−</button><div class="staff-count">${workers + trainees} ${escapeHtml(t('zone.staff').toLowerCase())}</div><button class="mini-btn" type="button" data-action="assign" data-zone="${zone.id}">+</button></div>
        <button class="primary-btn upgrade-btn" type="button" data-action="zone-upgrade" data-zone="${zone.id}" ${maxed ? 'disabled' : ''}>${maxed ? escapeHtml(t('zone.max')) : `${escapeHtml(t('zone.upgrade'))} · ${formatMoney(cost)}`}</button>
      </article>`;
  }

  function bufferCardHtml(index) {
    const queue = state.queues[index + 1];
    const amount = queueAmount(queue);
    const ratio = clamp(amount / queue.capacity, 0, 1);
    const boxCount = Math.min(14, Math.ceil(ratio * 14));
    const boxes = new Array(boxCount).fill('<span class="box-dot"></span>').join('');
    const level = state.bufferLevels[index];
    const maxed = level >= state.scenario.maxBufferLevel;
    const cost = bufferUpgradeCost(index);
    const loadClass = ratio >= .98 ? 'full danger' : ratio > .82 ? 'danger' : ratio > .62 ? 'warning' : '';

    return `
      <article class="buffer-card ${loadClass}" id="buffer-${index}">
        <div class="tip-target" data-tip="${escapeAttr(t('tooltip.buffer'))}"><div class="buffer-label">${escapeHtml(t('buffer.title'))} ${index + 1}</div><div class="buffer-count">${formatNumber(amount, 0)} / ${formatNumber(queue.capacity, 0)}</div></div>
        <div class="buffer-lane"><div class="buffer-fill" style="height:${ratio * 100}%"></div><div class="buffer-boxes">${boxes}</div></div>
        <button class="ghost-btn buffer-upgrade" type="button" data-action="buffer-upgrade" data-buffer="${index}" ${maxed ? 'disabled' : ''}>${maxed ? escapeHtml(t('zone.max')) : `${escapeHtml(t('buffer.upgrade'))} · ${formatMoney(cost)}`}</button>
      </article>`;
  }

  function renderPeopleIcons(workers, trainees, maxIcons) {
    const total = workers + trainees;
    if (!total) return '<span style="color:var(--muted);font-size:10px">—</span>';
    const scale = total > maxIcons ? maxIcons / total : 1;
    const shownWorkers = Math.max(0, Math.round(workers * scale));
    const shownTrainees = Math.max(0, Math.min(maxIcons - shownWorkers, Math.round(trainees * scale)));
    let html = '';
    for (let i = 0; i < shownWorkers; i++) html += '<span class="person-dot"></span>';
    for (let i = 0; i < shownTrainees; i++) html += '<span class="person-dot trainee"></span>';
    return html;
  }

  function renderStaff() {
    if (!state) return;
    const freeWorkers = freeEmployees('worker').length;
    const freeTrainees = freeEmployees('trainee').length;
    const free = freeWorkers + freeTrainees;
    dom.freeStaffDetail.textContent = String(free);
    dom.totalStaffDetail.textContent = String(state.employees.length);
    dom.freeStaffIcons.innerHTML = renderPeopleIcons(freeWorkers, freeTrainees, 16);
    dom.hireCost.textContent = formatMoney(currentHireCost());
    dom.hireBtn.textContent = `${t('staff.hire')} · ${formatMoney(currentHireCost())}`;
    dom.hireBtn.disabled = state.phase !== 'playing' || state.money < currentHireCost();
    dom.fireBtn.disabled = state.phase !== 'playing' || free === 0;
  }

  function renderGlobalUpgrades() {
    if (!state) return;
    const tips = { training: 'tooltip.training', equipment: 'tooltip.equipment', optimization: 'tooltip.optimization' };
    dom.globalUpgrades.innerHTML = GLOBAL_UPGRADES.map((upgrade) => {
      const level = state.globalLevels[upgrade.id];
      const maxed = level >= state.scenario.maxGlobalLevel;
      const cost = globalUpgradeCost(upgrade.id);
      return `<div class="global-card tip-target" data-tip="${escapeAttr(t(tips[upgrade.id]))}"><h3>${escapeHtml(t(upgrade.titleKey))}</h3><p>${escapeHtml(t(upgrade.descKey))}</p><div class="global-meta"><span>${escapeHtml(t('zone.level'))} ${level}</span><strong>${maxed ? escapeHtml(t('zone.max')) : formatMoney(cost)}</strong></div><button class="primary-btn" type="button" data-global="${upgrade.id}" ${maxed ? 'disabled' : ''}>${escapeHtml(t('global.upgrade'))}</button></div>`;
    }).join('');
    dom.globalUpgrades.querySelectorAll('[data-global]').forEach((button) => button.addEventListener('click', () => buyGlobalUpgrade(button.dataset.global)));
  }

  function renderEventLog() {
    if (!state) return;
    if (!state.logs.length) { dom.eventLog.innerHTML = `<div class="log-empty">${escapeHtml(t('events.none'))}</div>`; return; }
    const icons = { information: '●', problem: '⚠', decision: '◆' };
    dom.eventLog.innerHTML = state.logs.slice(-10).reverse().map((entry) => {
      const title = entry.titleText || t(entry.titleKey);
      const body = entry.bodyText || t(entry.bodyKey);
      return `<div class="log-entry ${entry.type}"><div class="log-entry-head"><span class="log-icon">${icons[entry.type] || '•'}</span><time>${formatTime(entry.at)}</time></div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></div>`;
    }).join('');
  }

  function renderCritical() {
    if (!state) return;
    const critical = state.sla < state.scenario.criticalSla || state.criticalTime > 0;
    dom.criticalBanner.classList.toggle('hidden', !critical);
    if (critical) dom.shutdownCountdown.textContent = Math.max(0, Math.ceil(state.scenario.shutdownAfter - state.criticalTime));
  }

  function renderSpeedButtons() {
    $$('.speed-btn').forEach((button) => {
      const value = Number(button.dataset.speed);
      button.classList.toggle('active', !!state && state.speed === value);
      button.disabled = !state || state.phase !== 'playing' || !!state.currentDecision;
    });
  }

  function renderScenarioList() {
    if (!dom.scenarioList) return;
    const scenarios = Object.values(window.WAREHOUSE_SCENARIOS);
    dom.scenarioList.innerHTML = scenarios.map((scenario) => {
      const stars = '★'.repeat(scenario.difficulty || 1) + '☆'.repeat(Math.max(0, 3 - (scenario.difficulty || 1)));
      return `<article class="scenario-card ${scenario.id === selectedScenarioId ? 'selected' : ''}" data-scenario="${scenario.id}"><h3>${escapeHtml(t(scenario.titleKey))}</h3><p>${escapeHtml(t(scenario.descriptionKey))}</p><div class="difficulty-row"><span>${escapeHtml(t('start.difficulty'))}: ${escapeHtml(t(scenario.difficultyKey))}</span><b class="stars">${stars}</b></div><div class="scenario-stats"><span>${escapeHtml(t('start.flow'))}: ${formatNumber(scenario.baseIncomingPerMinute, 0)}/min</span><span>${escapeHtml(t('start.style'))}: ${escapeHtml(t(scenario.styleKey))}</span><span>${formatMoney(scenario.startBudget)}</span><span>SLA ${scenario.criticalSla}%</span></div></article>`;
    }).join('');
    dom.scenarioList.querySelectorAll('[data-scenario]').forEach((card) => card.addEventListener('click', () => { selectedScenarioId = card.dataset.scenario; renderScenarioList(); }));
  }

  function addLog(type, titleKey, bodyKey) {
    if (!state) return;
    state.logs.push({ type, titleKey, bodyKey, at: state.gameTime });
    if (state.logs.length > 30) state.logs.shift();
  }

  function addLogText(type, titleText, bodyText) {
    if (!state) return;
    state.logs.push({ type, titleText, bodyText, at: state.gameTime });
    if (state.logs.length > 30) state.logs.shift();
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.classList.add('visible');
    toastTimer = setTimeout(() => dom.toast.classList.remove('visible'), 1500);
  }

  function animateTransfer(fromId, toId) {
    const from = document.getElementById(fromId); const to = document.getElementById(toId);
    if (!from || !to) return;
    const a = from.getBoundingClientRect(); const b = to.getBoundingClientRect();
    const dot = document.createElement('span'); dot.className = 'transfer-dot';
    dot.style.left = `${a.left + a.width / 2}px`; dot.style.top = `${a.top + a.height / 2}px`;
    dom.transferLayer.appendChild(dot);
    requestAnimationFrame(() => { dot.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px)`; dot.style.opacity = '0'; });
    setTimeout(() => dot.remove(), 620);
  }


  function eventIsEligible(event) {
    if (event.minTime && state.gameTime < event.minTime) return false;
    if (event.allowedScenarios && !event.allowedScenarios.includes(state.scenarioId)) return false;
    if (state.lastEventId === event.id) return false;
    const last = state.eventHistory[event.id];
    if (last != null && event.cooldown && state.gameTime - last < event.cooldown) return false;
    const conditions = !event.condition ? [] : Array.isArray(event.condition) ? event.condition : [event.condition];
    return conditions.every(checkEventCondition);
  }

  function checkEventCondition(condition) {
    if (!condition) return true;
    switch (condition.type) {
      case 'traineesAtLeast': return state.employees.filter((employee) => employee.type === 'trainee').length >= condition.value;
      case 'moneyAtLeast': return state.money >= condition.value;
      case 'shippedAtLeast': return state.shipped >= condition.value;
      case 'queueFillAtLeast': return state.queues.slice(1).some((queue) => queueAmount(queue) / queue.capacity >= condition.value);
      case 'freeStaffAtLeast': return freeEmployees().length >= condition.value;
      case 'freeStaffBelow': return freeEmployees().length < condition.value;
      case 'totalStaffBelow': return state.employees.length < condition.value;
      case 'slaBelow': return state.sla < condition.value;
      default: return true;
    }
  }

  function weightedEventChoice(events) {
    const total = events.reduce((sum, event) => sum + (event.weight || 1), 0);
    let roll = Math.random() * total;
    for (const event of events) { roll -= event.weight || 1; if (roll <= 0) return event; }
    return events[events.length - 1];
  }

  function applyEventEffects(effects, titleKey, mitigateNegative) {
    for (const raw of (effects || []).filter(Boolean)) {
      let factor = raw.factor;
      if (mitigateNegative && factor < 1 && ['all','receiving','putaway','picking','packing','shipping'].includes(raw.target)) {
        const equipmentMitigation = state.globalLevels.equipment * 0.08;
        factor = 1 - ((1 - factor) * clamp(1 - equipmentMitigation, 0.55, 1));
      }
      state.modifiers.push({ id: `${titleKey}-${raw.target}-${state.gameTime}-${Math.random()}`, target: raw.target, factor, expiresAt: state.gameTime + raw.duration, titleKey });
    }
  }

  function renderDecision(event) {
    dom.eventType.textContent = t('event.type.decision');
    dom.eventTitle.textContent = t(event.titleKey);
    dom.eventBody.textContent = t(event.bodyKey);
    dom.eventChoices.innerHTML = '';
    for (const choice of event.choices) {
      const button = document.createElement('button');
      button.className = choice.cost ? 'primary-btn' : 'ghost-btn';
      button.textContent = t(choice.labelKey);
      if (choice.cost && state.money < choice.cost) button.disabled = true;
      button.addEventListener('click', () => resolveDecision(event, choice));
      dom.eventChoices.appendChild(button);
    }
  }

  function renderActiveEffects() {
    if (!state || !dom.activeEffects) return;
    if (!state.modifiers.length) { dom.activeEffects.innerHTML = `<div class="log-empty">${escapeHtml(t('effects.none'))}</div>`; return; }
    dom.activeEffects.innerHTML = state.modifiers.slice().sort((a,b) => a.expiresAt - b.expiresAt).map((modifier) => {
      const remaining = Math.max(0, modifier.expiresAt - state.gameTime);
      const positive = modifierIsPositive(modifier);
      const pct = Math.round(Math.abs(modifier.factor - 1) * 100);
      const sign = modifier.factor >= 1 ? '+' : '−';
      return `<div class="effect-card ${positive ? 'positive' : 'negative'}"><strong>${escapeHtml(t(modifier.titleKey))}</strong><div class="effect-line"><span>${escapeHtml(t(`effect.target.${modifier.target}`))} <b>${sign}${pct}%</b></span><time>${formatTime(remaining)}</time></div></div>`;
    }).join('');
  }

  function modifierIsPositive(modifier) {
    if (modifier.target === 'incoming') return modifier.factor < 1;
    if (modifier.target === 'income') return modifier.factor > 1;
    return modifier.factor > 1;
  }

  function zoneSceneHtml(zoneId, workers, trainees) {
    const people = renderWorkerSprites(workers, trainees, 5);
    const common = '<span class="scene-floor"></span>';
    const scenes = {
      receiving: `${common}<span class="scene-door"></span><span class="scene-truck"></span><span class="scene-pallet p1"></span><span class="scene-pallet p2"></span>`,
      putaway: `${common}<span class="scene-rack r1"></span><span class="scene-rack r2"></span><span class="scene-rack r3"></span><span class="scene-forklift"></span>`,
      picking: `${common}<span class="scene-shelf"></span><span class="scene-cart"></span><span class="scene-box b3"></span>`,
      packing: `${common}<span class="scene-table t1"></span><span class="scene-table t2"></span><span class="scene-box b1"></span><span class="scene-box b2"></span><span class="scene-box b3"></span>`,
      shipping: `${common}<span class="scene-door"></span><span class="scene-truck outbound"></span><span class="scene-pallet p1"></span>`
    };
    return `<div class="zone-scene scene-${zoneId}">${scenes[zoneId] || common}<div class="scene-people">${people}</div></div>`;
  }

  function renderWorkerSprites(workers, trainees, maxIcons) {
    const total = workers + trainees;
    if (!total) return '';
    const shownWorkers = Math.min(workers, maxIcons);
    const shownTrainees = Math.min(trainees, Math.max(0, maxIcons - shownWorkers));
    let html = '';
    for (let i=0;i<shownWorkers;i++) html += '<span class="worker-sprite"></span>';
    for (let i=0;i<shownTrainees;i++) html += '<span class="worker-sprite trainee"></span>';
    const hidden = total - shownWorkers - shownTrainees;
    if (hidden > 0) html += `<span class="worker-more">+${hidden}</span>`;
    return html;
  }

  function sampleHistory(force = false) {
    if (!state?.history) return;
    if (!force && state.gameTime < state.history.nextSampleAt) return;
    state.history.sla.push(state.sla);
    state.history.incoming.push(currentIncomingRate());
    if (state.history.sla.length > 800) { state.history.sla.shift(); state.history.incoming.shift(); }
    state.history.nextSampleAt = state.gameTime + 3;
  }

  function shutdownRatingKey(avgSla) {
    if (avgSla >= 95 && state.gameTime >= 600) return 'shutdown.rating.excellent';
    if (avgSla >= 88) return 'shutdown.rating.stable';
    if (avgSla >= 76) return 'shutdown.rating.held';
    if (avgSla >= 62) return 'shutdown.rating.crumble';
    return 'shutdown.rating.apocalypse';
  }

  function drawShutdownCharts() {
    if (!state?.history) return;
    drawMiniChart(dom.slaChart, state.history.sla, 0, 100, '#66d9a3');
    const incoming = state.history.incoming;
    const maxIncoming = Math.max(10, ...incoming) * 1.08;
    drawMiniChart(dom.incomingChart, incoming, 0, maxIncoming, '#61b9ff');
  }

  function drawMiniChart(canvas, values, min, max, color) {
    if (!canvas || !values.length) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(240, Math.floor(rect.width || 320)); const height = Math.max(80, Math.floor(rect.height || 90));
    canvas.width = width * dpr; canvas.height = height * dpr;
    const ctx = canvas.getContext('2d'); ctx.scale(dpr,dpr); ctx.clearRect(0,0,width,height);
    ctx.strokeStyle='rgba(146,167,179,.16)'; ctx.lineWidth=1;
    for(let i=1;i<4;i++){const y=(height/4)*i;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();
    values.forEach((value,index)=>{const x=values.length===1?0:(index/(values.length-1))*width;const y=height-clamp((value-min)/(max-min||1),0,1)*height;if(index===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();
  }

  function renderFirstRunHints() {
    if (!dom.firstRunHints) return;
    const seen = localStorage.getItem(STORAGE.hintsSeen) === '1';
    dom.firstRunHints.classList.toggle('hidden', seen || !state);
  }

  function dismissHints() {
    localStorage.setItem(STORAGE.hintsSeen, '1');
    dom.firstRunHints.classList.add('hidden');
    showToast(t('toast.hintsDismissed'));
  }

  function openHelp() {
    if (state?.currentDecision) return;
    if (state && state.phase === 'playing') { helpRestoreSpeed = state.speed; state.speed = 0; }
    dom.helpOverlay.classList.add('visible');
    renderSpeedButtons(); renderKpis();
  }

  function closeHelp() {
    dom.helpOverlay.classList.remove('visible');
    if (state && state.phase === 'playing' && helpRestoreSpeed != null) state.speed = helpRestoreSpeed;
    helpRestoreSpeed = null;
    renderSpeedButtons(); if (state) renderKpis();
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem(STORAGE.sound, soundEnabled ? '1' : '0');
    renderSoundButton();
    if (soundEnabled) playSound('ui');
  }

  function renderSoundButton() {
    if (!dom.soundBtn) return;
    dom.soundBtn.textContent = t(soundEnabled ? 'sound.on' : 'sound.off');
  }

  function playSound(kind) {
    if (!soundEnabled) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioContext.createOscillator(); const gain = audioContext.createGain();
      const now = audioContext.currentTime; const tones = { ui:520, event:620, warning:230, upgrade:760, shipment:880, shutdown:130 };
      osc.frequency.setValueAtTime(tones[kind] || 500, now);
      if (kind === 'shutdown') osc.frequency.exponentialRampToValueAtTime(70, now + .42);
      gain.gain.setValueAtTime(.0001,now); gain.gain.exponentialRampToValueAtTime((kind==='warning'||kind==='shutdown') ? .055 : .028,now+.015); gain.gain.exponentialRampToValueAtTime(.0001,now+(kind==='shutdown' ? .48 : .12));
      osc.connect(gain); gain.connect(audioContext.destination); osc.start(now); osc.stop(now+(kind==='shutdown' ? .5 : .14));
    } catch (_) { /* Sound is optional. */ }
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll('`','&#096;');
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function frame(now) {
    const realDt = clamp((now - lastFrame) / 1000, 0, 0.1);
    lastFrame = now;

    if (state && state.phase === 'playing' && state.speed > 0 && !state.currentDecision) {
      const gameDt = realDt * state.speed;
      simulationTick(gameDt);
      uiAccumulator += realDt;
      if (uiAccumulator >= 0.18) {
        renderAll();
        uiAccumulator = 0;
      }
    }

    requestAnimationFrame(frame);
  }

  function changeLanguage() {
    language = language === 'ru' ? 'en' : 'ru';
    localStorage.setItem(STORAGE.lang, language);
    renderI18n();
    if (state?.currentDecision) renderDecision(state.currentDecision);
    if (state) {
      renderAll();
      if (state.phase === 'shutdown') {
        const score = calculateScore();
        const best = Number(localStorage.getItem(STORAGE.bestEndless) || 0);
        renderShutdownStats(score, best);
        requestAnimationFrame(drawShutdownCharts);
      }
    }
  }

  function bindEvents() {
    dom.langToggle.addEventListener('click', changeLanguage);
    dom.startLangToggle.addEventListener('click', changeLanguage);
    dom.startBtn.addEventListener('click', () => resetGame(selectedScenarioId));
    dom.hireBtn.addEventListener('click', hireEmployee);
    dom.fireBtn.addEventListener('click', fireEmployee);
    dom.restartBtn.addEventListener('click', () => resetGame(state.scenarioId));
    dom.chooseScenarioBtn.addEventListener('click', () => {
      dom.shutdownOverlay.classList.remove('visible'); dom.startOverlay.classList.add('visible');
      selectedScenarioId = state?.scenarioId || selectedScenarioId; state = null; renderScenarioList(); renderSpeedButtons();
    });
    dom.helpBtn.addEventListener('click', openHelp);
    dom.helpStripBtn.addEventListener('click', openHelp);
    dom.startHelpBtn.addEventListener('click', openHelp);
    dom.closeHelpBtn.addEventListener('click', closeHelp);
    dom.dismissHintsBtn.addEventListener('click', dismissHints);
    dom.soundBtn.addEventListener('click', toggleSound);
    $$('.speed-btn').forEach((button) => button.addEventListener('click', () => setSpeed(Number(button.dataset.speed))));
  }

  function init() {
    bindEvents(); renderI18n(); renderScenarioList(); dom.startOverlay.classList.add('visible'); renderSpeedButtons(); requestAnimationFrame(frame);
  }

  init();
})();
