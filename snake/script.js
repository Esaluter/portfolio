'use strict';

// ------------------------------------------------------------
// Configuration
// ------------------------------------------------------------

const PORTFOLIO_URL = '../index.html?returnFrom=snake';

const CONFIG = {
  columns: 24,
  rows: 24,
  startLength: 4,
  pointsPerFood: 100,
  baseTickMs: 135,
  minTickMs: 72,
  speedStepMs: 6,
  foodsPerSpeedStep: 4,
  maxNameLength: 18,
  leaderboardLimit: 10,
  storageKeys: {
    leaderboard: 'portfolioSnakeLeaderboardV1',
    best: 'portfolioSnakeBestV1',
    language: 'portfolioSnakeLanguageV1'
  }
};

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const KEY_TO_DIRECTION = {
  ArrowUp: DIRECTIONS.up,
  w: DIRECTIONS.up,
  W: DIRECTIONS.up,
  ArrowDown: DIRECTIONS.down,
  s: DIRECTIONS.down,
  S: DIRECTIONS.down,
  ArrowLeft: DIRECTIONS.left,
  a: DIRECTIONS.left,
  A: DIRECTIONS.left,
  ArrowRight: DIRECTIONS.right,
  d: DIRECTIONS.right,
  D: DIRECTIONS.right
};

const translations = {
  en: {
    backToPortfolio: 'Back to Portfolio',
    eyebrow: 'LABORATORY // MINI EXPERIMENT',
    subtitle: 'Classic rules. The walls are only portals.',
    score: 'Score',
    best: 'Best',
    statusReady: 'Ready',
    statusPlaying: 'Running',
    statusPaused: 'Paused',
    statusGameOver: 'Game Over',
    experimentEnded: 'EXPERIMENT ENDED',
    gameOver: 'Game Over',
    yourScore: 'Your score',
    yourName: 'Your name',
    namePlaceholder: 'Enter name',
    saveScore: 'Save Score',
    playAgain: 'Play Again',
    startGame: 'Start Game',
    pause: 'Pause',
    resume: 'Resume',
    controls: 'Controls',
    or: 'or',
    pauseHint: 'pause',
    localData: 'LOCAL DATA',
    leaderboard: 'Leaderboard',
    noScores: 'No saved scores yet.',
    clearLeaderboard: 'Clear leaderboard',
    localOnly: 'Records are stored only in this browser.',
    confirmClear: 'Clear the local leaderboard? This cannot be undone.',
    nameRequired: 'Enter a name before saving.',
    scoreSaved: 'Score saved.',
    scoreAlreadySaved: 'This score is already saved.',
    storageUnavailable: 'Local storage is unavailable in this browser.',
    canvasLabel: 'Snake game field'
  },
  ru: {
    backToPortfolio: 'Вернуться в портфолио',
    eyebrow: 'ЛАБОРАТОРИЯ // МИНИ-ЭКСПЕРИМЕНТ',
    subtitle: 'Классические правила. Стены здесь — просто порталы.',
    score: 'Счёт',
    best: 'Рекорд',
    statusReady: 'Готово',
    statusPlaying: 'Игра идёт',
    statusPaused: 'Пауза',
    statusGameOver: 'Игра окончена',
    experimentEnded: 'ЭКСПЕРИМЕНТ ЗАВЕРШЁН',
    gameOver: 'Игра окончена',
    yourScore: 'Ваш счёт',
    yourName: 'Ваше имя',
    namePlaceholder: 'Введите имя',
    saveScore: 'Сохранить',
    playAgain: 'Играть снова',
    startGame: 'Начать игру',
    pause: 'Пауза',
    resume: 'Продолжить',
    controls: 'Управление',
    or: 'или',
    pauseHint: 'пауза',
    localData: 'ЛОКАЛЬНЫЕ ДАННЫЕ',
    leaderboard: 'Таблица лидеров',
    noScores: 'Сохранённых результатов пока нет.',
    clearLeaderboard: 'Очистить таблицу',
    localOnly: 'Рекорды хранятся только в этом браузере.',
    confirmClear: 'Очистить локальную таблицу рекордов? Это действие нельзя отменить.',
    nameRequired: 'Введите имя перед сохранением.',
    scoreSaved: 'Результат сохранён.',
    scoreAlreadySaved: 'Этот результат уже сохранён.',
    storageUnavailable: 'Локальное хранилище недоступно в этом браузере.',
    canvasLabel: 'Игровое поле Snake'
  }
};

// ------------------------------------------------------------
// DOM references
// ------------------------------------------------------------

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const elements = {
  backLink: document.getElementById('backLink'),
  scoreValue: document.getElementById('scoreValue'),
  bestValue: document.getElementById('bestValue'),
  bestCard: document.getElementById('bestCard'),
  statusCard: document.querySelector('.status-card'),
  statusText: document.getElementById('statusText'),
  startButton: document.getElementById('startButton'),
  pauseButton: document.getElementById('pauseButton'),
  gameOverOverlay: document.getElementById('gameOverOverlay'),
  finalScoreValue: document.getElementById('finalScoreValue'),
  scoreForm: document.getElementById('scoreForm'),
  playerName: document.getElementById('playerName'),
  saveScoreButton: document.getElementById('saveScoreButton'),
  formMessage: document.getElementById('formMessage'),
  playAgainButton: document.getElementById('playAgainButton'),
  leaderboardList: document.getElementById('leaderboardList'),
  emptyLeaderboard: document.getElementById('emptyLeaderboard'),
  clearLeaderboardButton: document.getElementById('clearLeaderboardButton'),
  languageButtons: [...document.querySelectorAll('[data-lang]')]
};

// ------------------------------------------------------------
// Safe localStorage helpers
// ------------------------------------------------------------

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function storageRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}

function loadLeaderboard() {
  const raw = storageGet(CONFIG.storageKeys.leaderboard);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry) => (
        entry &&
        typeof entry.name === 'string' &&
        Number.isFinite(entry.score) &&
        entry.score >= 0
      ))
      .map((entry) => ({
        name: entry.name.trim().slice(0, CONFIG.maxNameLength),
        score: Math.floor(entry.score)
      }))
      .filter((entry) => entry.name.length > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, CONFIG.leaderboardLimit);
  } catch (error) {
    return [];
  }
}

function loadBest() {
  const raw = storageGet(CONFIG.storageKeys.best);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function getInitialLanguage() {
  const queryLanguage = new URLSearchParams(window.location.search).get('lang');
  if (queryLanguage === 'ru' || queryLanguage === 'en') {
    return queryLanguage;
  }

  const stored = storageGet(CONFIG.storageKeys.language);
  if (stored === 'ru' || stored === 'en') {
    return stored;
  }

  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

// ------------------------------------------------------------
// Game state
// ------------------------------------------------------------

const state = {
  status: 'idle', // idle | playing | paused | gameOver
  snake: [],
  food: null,
  direction: { ...DIRECTIONS.right },
  pendingDirection: null,
  score: 0,
  best: loadBest(),
  foodsEaten: 0,
  tickMs: CONFIG.baseTickMs,
  loopTimer: null,
  language: getInitialLanguage(),
  leaderboard: loadLeaderboard(),
  scoreSaved: false,
  newestLeaderboardIndex: -1,
  foodSpawnAt: performance.now(),
  eatFlashUntil: 0,
  newBestFlashUntil: 0
};

// ------------------------------------------------------------
// Initialization
// ------------------------------------------------------------

function initialize() {
  elements.backLink.href = PORTFOLIO_URL;
  resetBoardState();
  applyLanguage(state.language, false);
  updateScoreUI();
  updateStatusUI();
  renderLeaderboard();
  bindEvents();
  requestAnimationFrame(renderFrame);
}

function bindEvents() {
  elements.startButton.addEventListener('click', startGame);
  elements.pauseButton.addEventListener('click', togglePause);
  elements.playAgainButton.addEventListener('click', startGame);
  elements.scoreForm.addEventListener('submit', saveCurrentScore);
  elements.clearLeaderboardButton.addEventListener('click', clearLeaderboard);

  elements.languageButtons.forEach((button) => {
    button.addEventListener('click', () => applyLanguage(button.dataset.lang));
  });

  document.addEventListener('keydown', handleKeydown, { passive: false });
}

// ------------------------------------------------------------
// Localization
// ------------------------------------------------------------

function t(key) {
  return translations[state.language][key] ?? translations.en[key] ?? key;
}

function applyLanguage(language, persist = true) {
  if (!translations[language]) return;

  state.language = language;
  document.documentElement.lang = language;

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    node.placeholder = t(key);
  });

  elements.languageButtons.forEach((button) => {
    const isActive = button.dataset.lang === language;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  canvas.setAttribute('aria-label', t('canvasLabel'));

  if (persist) {
    storageSet(CONFIG.storageKeys.language, language);
  }

  updateStatusUI();
  updatePauseButton();

  if (elements.formMessage.textContent) {
    elements.formMessage.textContent = state.scoreSaved ? t('scoreSaved') : '';
    elements.formMessage.classList.remove('is-error');
  }
}

// ------------------------------------------------------------
// Input
// ------------------------------------------------------------

function handleKeydown(event) {
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  if (isTyping) return;

  if (event.code === 'Space') {
    event.preventDefault();
    if (state.status === 'playing' || state.status === 'paused') {
      togglePause();
    }
    return;
  }

  const nextDirection = KEY_TO_DIRECTION[event.key];
  if (!nextDirection) return;

  event.preventDefault();

  if (state.status !== 'playing' && state.status !== 'paused') {
    return;
  }

  queueDirection(nextDirection);
}

function queueDirection(nextDirection) {
  // Only one turn is accepted between movement ticks. This prevents a rapid
  // Right -> Up -> Left sequence from becoming an illegal reversal in one tick.
  if (state.pendingDirection) return;

  if (isOpposite(nextDirection, state.direction)) return;
  if (sameDirection(nextDirection, state.direction)) return;

  state.pendingDirection = { ...nextDirection };
}

function isOpposite(a, b) {
  return a.x + b.x === 0 && a.y + b.y === 0;
}

function sameDirection(a, b) {
  return a.x === b.x && a.y === b.y;
}

// ------------------------------------------------------------
// Game lifecycle
// ------------------------------------------------------------

function startGame() {
  stopLoop();
  resetBoardState();

  state.status = 'playing';
  state.scoreSaved = false;
  state.newestLeaderboardIndex = -1;

  elements.gameOverOverlay.hidden = true;
  elements.playerName.value = '';
  elements.formMessage.textContent = '';
  elements.formMessage.classList.remove('is-error');
  elements.saveScoreButton.disabled = false;

  updateScoreUI();
  updateStatusUI();
  updatePauseButton();
  updateStartButton();
  scheduleNextTick();
}

function resetBoardState() {
  const centerX = Math.floor(CONFIG.columns / 2);
  const centerY = Math.floor(CONFIG.rows / 2);

  state.snake = Array.from({ length: CONFIG.startLength }, (_, index) => ({
    x: centerX - index,
    y: centerY
  }));

  state.direction = { ...DIRECTIONS.right };
  state.pendingDirection = null;
  state.score = 0;
  state.foodsEaten = 0;
  state.tickMs = CONFIG.baseTickMs;
  state.food = generateFood();
  state.foodSpawnAt = performance.now();
  state.eatFlashUntil = 0;
}

function togglePause() {
  if (state.status === 'playing') {
    state.status = 'paused';
    stopLoop();
  } else if (state.status === 'paused') {
    state.status = 'playing';
    scheduleNextTick();
  } else {
    return;
  }

  updateStatusUI();
  updatePauseButton();
}

function endGame() {
  stopLoop();
  state.status = 'gameOver';
  state.pendingDirection = null;

  elements.finalScoreValue.textContent = String(state.score);
  elements.gameOverOverlay.hidden = false;
  elements.playerName.focus({ preventScroll: true });

  updateStatusUI();
  updatePauseButton();
  updateStartButton();
}

function stopLoop() {
  if (state.loopTimer !== null) {
    clearTimeout(state.loopTimer);
    state.loopTimer = null;
  }
}

function scheduleNextTick() {
  stopLoop();
  if (state.status !== 'playing') return;

  state.loopTimer = window.setTimeout(() => {
    state.loopTimer = null;
    tick();
    scheduleNextTick();
  }, state.tickMs);
}

// ------------------------------------------------------------
// Movement and collisions
// ------------------------------------------------------------

function tick() {
  if (state.status !== 'playing') return;

  if (state.pendingDirection) {
    state.direction = state.pendingDirection;
    state.pendingDirection = null;
  }

  const currentHead = state.snake[0];
  const nextHead = {
    x: wrap(currentHead.x + state.direction.x, CONFIG.columns),
    y: wrap(currentHead.y + state.direction.y, CONFIG.rows)
  };

  const willEat = state.food && sameCell(nextHead, state.food);

  // When the snake is not eating, the tail leaves its cell on the same tick.
  // Excluding that last cell avoids a false collision when the head moves there.
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);

  if (bodyToCheck.some((segment) => sameCell(segment, nextHead))) {
    endGame();
    return;
  }

  state.snake.unshift(nextHead);

  if (willEat) {
    handleFoodEaten();
  } else {
    state.snake.pop();
  }
}

function wrap(value, size) {
  return (value + size) % size;
}

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function handleFoodEaten() {
  state.score += CONFIG.pointsPerFood;
  state.foodsEaten += 1;
  state.tickMs = calculateTickSpeed(state.foodsEaten);
  state.eatFlashUntil = performance.now() + 160;

  if (state.score > state.best) {
    state.best = state.score;
    state.newBestFlashUntil = performance.now() + 700;
    storageSet(CONFIG.storageKeys.best, String(state.best));
  }

  state.food = generateFood();
  state.foodSpawnAt = performance.now();
  updateScoreUI();
}

function calculateTickSpeed(foodsEaten) {
  const speedSteps = Math.floor(foodsEaten / CONFIG.foodsPerSpeedStep);
  return Math.max(CONFIG.minTickMs, CONFIG.baseTickMs - speedSteps * CONFIG.speedStepMs);
}

function generateFood() {
  const occupied = new Set(state.snake.map((segment) => `${segment.x},${segment.y}`));
  const freeCells = [];

  for (let y = 0; y < CONFIG.rows; y += 1) {
    for (let x = 0; x < CONFIG.columns; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) return null;
  return freeCells[Math.floor(Math.random() * freeCells.length)];
}

// ------------------------------------------------------------
// Score, leaderboard and persistence
// ------------------------------------------------------------

function saveCurrentScore(event) {
  event.preventDefault();

  if (state.status !== 'gameOver') return;

  if (state.scoreSaved) {
    showFormMessage(t('scoreAlreadySaved'));
    return;
  }

  const name = elements.playerName.value.trim().slice(0, CONFIG.maxNameLength);
  elements.playerName.value = name;

  if (!name) {
    showFormMessage(t('nameRequired'), true);
    elements.playerName.focus();
    return;
  }

  const entry = { name, score: state.score };
  const withNewEntry = [...state.leaderboard, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, CONFIG.leaderboardLimit);

  // Locate the inserted object by identity before serialization so we can flash it.
  state.newestLeaderboardIndex = withNewEntry.indexOf(entry);
  state.leaderboard = withNewEntry;

  const saved = storageSet(CONFIG.storageKeys.leaderboard, JSON.stringify(state.leaderboard));
  state.scoreSaved = true;
  elements.saveScoreButton.disabled = true;

  showFormMessage(saved ? t('scoreSaved') : t('storageUnavailable'), !saved);
  renderLeaderboard();
}

function clearLeaderboard() {
  if (state.leaderboard.length === 0) return;
  if (!window.confirm(t('confirmClear'))) return;

  state.leaderboard = [];
  state.newestLeaderboardIndex = -1;
  storageRemove(CONFIG.storageKeys.leaderboard);
  renderLeaderboard();
}

function renderLeaderboard() {
  elements.leaderboardList.replaceChildren();

  state.leaderboard.forEach((entry, index) => {
    const item = document.createElement('li');
    item.className = 'leaderboard-item';
    if (index === state.newestLeaderboardIndex) {
      item.classList.add('is-new');
    }

    const name = document.createElement('span');
    name.className = 'player-name';
    name.textContent = entry.name;
    name.title = entry.name;

    const score = document.createElement('span');
    score.className = 'player-score';
    score.textContent = String(entry.score);

    item.append(name, score);
    elements.leaderboardList.append(item);
  });

  const isEmpty = state.leaderboard.length === 0;
  elements.emptyLeaderboard.hidden = !isEmpty;
  elements.clearLeaderboardButton.disabled = isEmpty;
}

function showFormMessage(message, isError = false) {
  elements.formMessage.textContent = message;
  elements.formMessage.classList.toggle('is-error', isError);
}

// ------------------------------------------------------------
// UI state
// ------------------------------------------------------------

function updateScoreUI() {
  elements.scoreValue.textContent = String(state.score);
  elements.bestValue.textContent = String(state.best);

  if (performance.now() < state.newBestFlashUntil) {
    elements.bestCard.classList.remove('new-best');
    // Reflow intentionally restarts the short highlight when the best changes again.
    void elements.bestCard.offsetWidth;
    elements.bestCard.classList.add('new-best');
  }
}

function updateStatusUI() {
  const keyByStatus = {
    idle: 'statusReady',
    playing: 'statusPlaying',
    paused: 'statusPaused',
    gameOver: 'statusGameOver'
  };

  elements.statusText.textContent = t(keyByStatus[state.status]);
  elements.statusCard.dataset.status = state.status;
}

function updatePauseButton() {
  elements.pauseButton.disabled = state.status !== 'playing' && state.status !== 'paused';
  elements.pauseButton.textContent = state.status === 'paused' ? t('resume') : t('pause');
}

function updateStartButton() {
  elements.startButton.hidden = state.status === 'playing' || state.status === 'paused' || state.status === 'gameOver';
}

// ------------------------------------------------------------
// Canvas rendering
// ------------------------------------------------------------

function renderFrame(now) {
  drawScene(now);
  requestAnimationFrame(renderFrame);
}

function drawScene(now) {
  const width = canvas.width;
  const height = canvas.height;
  const cellWidth = width / CONFIG.columns;
  const cellHeight = height / CONFIG.rows;

  ctx.clearRect(0, 0, width, height);
  drawBackground(width, height, cellWidth, cellHeight);

  if (state.food) {
    drawFood(state.food, cellWidth, cellHeight, now);
  }

  drawSnake(cellWidth, cellHeight);

  if (now < state.eatFlashUntil && state.snake[0]) {
    drawEatFlash(state.snake[0], cellWidth, cellHeight, now);
  }
}

function drawBackground(width, height, cellWidth, cellHeight) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#081713');
  gradient.addColorStop(1, '#030b09');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(126, 255, 205, 0.055)';
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = 1; x < CONFIG.columns; x += 1) {
    const px = Math.round(x * cellWidth) + 0.5;
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
  }

  for (let y = 1; y < CONFIG.rows; y += 1) {
    const py = Math.round(y * cellHeight) + 0.5;
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
  }

  ctx.stroke();

  // A soft edge glow hints that crossing the border is intentional, not fatal.
  const edgeGradient = ctx.createRadialGradient(width / 2, height / 2, width * 0.25, width / 2, height / 2, width * 0.72);
  edgeGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  edgeGradient.addColorStop(1, 'rgba(67, 255, 181, 0.045)');
  ctx.fillStyle = edgeGradient;
  ctx.fillRect(0, 0, width, height);
}

function drawSnake(cellWidth, cellHeight) {
  state.snake.forEach((segment, index) => {
    const isHead = index === 0;
    const inset = isHead ? 3.1 : 4.2;
    const x = segment.x * cellWidth + inset;
    const y = segment.y * cellHeight + inset;
    const w = cellWidth - inset * 2;
    const h = cellHeight - inset * 2;

    const intensity = Math.max(0.34, 1 - index / Math.max(state.snake.length * 1.35, 1));

    ctx.save();
    ctx.shadowColor = isHead ? 'rgba(157, 255, 215, 0.56)' : 'rgba(85, 238, 171, 0.18)';
    ctx.shadowBlur = isHead ? 13 : 5;
    ctx.fillStyle = isHead
      ? '#b5ffe0'
      : `rgba(89, 232, 166, ${0.46 + intensity * 0.44})`;
    roundedRect(ctx, x, y, w, h, isHead ? 7 : 6);
    ctx.fill();
    ctx.restore();
  });

  drawHeadDetails(cellWidth, cellHeight);
}

function drawHeadDetails(cellWidth, cellHeight) {
  const head = state.snake[0];
  if (!head) return;

  const centerX = head.x * cellWidth + cellWidth / 2;
  const centerY = head.y * cellHeight + cellHeight / 2;
  const dir = state.direction;
  const perpendicular = { x: -dir.y, y: dir.x };
  const forwardOffset = 5;
  const sideOffset = 4.6;

  ctx.fillStyle = '#0a2a20';

  [-1, 1].forEach((side) => {
    const eyeX = centerX + dir.x * forwardOffset + perpendicular.x * sideOffset * side;
    const eyeY = centerY + dir.y * forwardOffset + perpendicular.y * sideOffset * side;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 1.7, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawFood(food, cellWidth, cellHeight, now) {
  const age = Math.max(0, now - state.foodSpawnAt);
  const spawnScale = Math.min(1, age / 150);
  const pulse = 1 + Math.sin(now / 170) * 0.08;
  const radius = Math.min(cellWidth, cellHeight) * 0.27 * spawnScale * pulse;
  const x = food.x * cellWidth + cellWidth / 2;
  const y = food.y * cellHeight + cellHeight / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(255, 109, 132, 0.72)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#ff748d';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.64)';
  ctx.beginPath();
  ctx.arc(x - radius * 0.28, y - radius * 0.3, Math.max(1, radius * 0.18), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEatFlash(head, cellWidth, cellHeight, now) {
  const remaining = Math.max(0, state.eatFlashUntil - now);
  const progress = 1 - remaining / 160;
  const x = head.x * cellWidth + cellWidth / 2;
  const y = head.y * cellHeight + cellHeight / 2;
  const radius = cellWidth * (0.35 + progress * 0.75);

  ctx.save();
  ctx.globalAlpha = Math.max(0, 0.4 * (1 - progress));
  ctx.strokeStyle = '#a8ffd5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

initialize();
