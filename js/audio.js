window.PortfolioMap = window.PortfolioMap || {};

(function () {
  "use strict";

  let ctx = null;
  let master = null;
  let ambient = null;
  let water = null;
  let fire = null;
  let tech = null;
  let enabled = false;
  let crackleTimer = null;

  function makeNoise(seconds = 2) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function loopNoise(destination, type, frequency, gainValue) {
    const source = ctx.createBufferSource();
    source.buffer = makeNoise(3);
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    const gain = ctx.createGain();
    gain.gain.value = gainValue;
    source.connect(filter).connect(gain).connect(destination);
    source.start();
    return { source, gain, filter };
  }

  function createBus(value) {
    const gain = ctx.createGain();
    gain.gain.value = value;
    gain.connect(master);
    return gain;
  }

  function init() {
    if (ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    ambient = createBus(0.16);
    water = createBus(0);
    fire = createBus(0);
    tech = createBus(0);

    loopNoise(ambient, "lowpass", 650, 0.16);
    loopNoise(ambient, "bandpass", 1100, 0.055);
    loopNoise(water, "bandpass", 1250, 0.20);
    loopNoise(water, "lowpass", 520, 0.10);
    loopNoise(fire, "highpass", 1200, 0.075);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 58;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 87;
    const g1 = ctx.createGain(); g1.gain.value = 0.08;
    const g2 = ctx.createGain(); g2.gain.value = 0.025;
    osc.connect(g1).connect(tech);
    osc2.connect(g2).connect(tech);
    osc.start(); osc2.start();

    scheduleCrackle();
  }

  function scheduleCrackle() {
    if (!ctx) return;
    window.clearTimeout(crackleTimer);
    crackleTimer = window.setTimeout(() => {
      if (enabled && fire && fire.gain.value > 0.015) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = 500 + Math.random() * 900;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.025 + Math.random() * 0.025, ctx.currentTime + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045 + Math.random() * 0.06);
        osc.connect(gain).connect(fire);
        osc.start();
        osc.stop(ctx.currentTime + 0.13);
      }
      scheduleCrackle();
    }, 160 + Math.random() * 520);
  }

  async function setEnabled(next) {
    init();
    if (!ctx) return false;
    enabled = !!next;
    if (enabled && ctx.state === "suspended") await ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(enabled ? 0.48 : 0, ctx.currentTime, 0.08);
    return true;
  }

  function proximity(px, py, x, y, radius) {
    const d = Math.hypot(px - x, py - y);
    const v = 1 - Math.min(1, d / radius);
    return v * v;
  }

  function update(player) {
    if (!ctx || !enabled) return;
    const now = ctx.currentTime;
    const waterLevel = Math.max(
      proximity(player.x, player.y, 300, 700, 430),
      proximity(player.x, player.y, 800, 845, 260)
    );
    const fireLevel = proximity(player.x, player.y, 355, 445, 260);
    const techLevel = Math.max(
      proximity(player.x, player.y, 1120, 465, 310),
      proximity(player.x, player.y, 950, 145, 390)
    );
    water.gain.setTargetAtTime(0.26 * waterLevel, now, 0.18);
    fire.gain.setTargetAtTime(0.23 * fireLevel, now, 0.15);
    tech.gain.setTargetAtTime(0.22 * techLevel, now, 0.20);
  }

  function uiClick() {
    if (!ctx || !enabled) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(360, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(230, ctx.currentTime + 0.055);
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.07);
    osc.connect(gain).connect(master);
    osc.start(); osc.stop(ctx.currentTime + 0.08);
  }

  window.PortfolioMap.Audio = { setEnabled, update, uiClick, isSupported: () => !!(window.AudioContext || window.webkitAudioContext) };
})();
