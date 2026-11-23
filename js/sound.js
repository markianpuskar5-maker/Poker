// ===== Звуки та вібрація =====
// Звуки синтезуються Web Audio — жодних файлів, працює офлайн.

const Snd = {
  on: localStorage.getItem('poker_sound') !== '0',
  vib: localStorage.getItem('poker_vib') !== '0',
  ctx: null,
  master: null,
  noiseBuf: null,
};

function sndInit() {
  if (Snd.ctx) return Snd.ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  Snd.ctx = new AC();
  Snd.master = Snd.ctx.createGain();
  Snd.master.gain.value = 0.45;
  Snd.master.connect(Snd.ctx.destination);
  const len = Snd.ctx.sampleRate * 0.5;
  Snd.noiseBuf = Snd.ctx.createBuffer(1, len, Snd.ctx.sampleRate);
  const d = Snd.noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return Snd.ctx;
}
// Телефони дозволяють звук лише після дотику — «будимо» аудіо при першій взаємодії
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => {
  if (!Snd.on) return;
  const c = sndInit();
  if (c && c.state === 'suspended') c.resume();
}, { passive: true }));

function tone(freq, dur, { type = 'sine', vol = 0.3, delay = 0, slide = 0, attack = 0.005 } = {}) {
  const c = Snd.ctx, t = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(Snd.master);
  o.start(t);
  o.stop(t + dur + 0.02);
}
function noise(dur, { vol = 0.25, delay = 0, freq = 3000, q = 1, type = 'bandpass', sweep = 0 } = {}) {
  const c = Snd.ctx, t = c.currentTime + delay;
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = Snd.noiseBuf;
  f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(Snd.master);
  s.start(t);
  s.stop(t + dur + 0.02);
}

const SOUNDS = {
  deal: () => noise(0.07, { vol: 0.22, freq: 2600, q: 0.8 }),
  flip: () => { noise(0.05, { vol: 0.18, freq: 3800 }); tone(900, 0.04, { vol: 0.04, type: 'triangle' }); },
  chip: () => { tone(2500, 0.035, { type: 'triangle', vol: 0.12 }); tone(3200, 0.03, { type: 'triangle', vol: 0.09, delay: 0.04 }); tone(2800, 0.03, { type: 'triangle', vol: 0.07, delay: 0.075 }); },
  check: () => { tone(170, 0.07, { vol: 0.35 }); tone(160, 0.07, { vol: 0.3, delay: 0.12 }); },
  fold: () => noise(0.22, { vol: 0.12, freq: 1800, type: 'lowpass', sweep: 300 }),
  turn: () => { tone(660, 0.16, { vol: 0.16 }); tone(990, 0.22, { vol: 0.14, delay: 0.11 }); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { vol: 0.16, type: 'triangle', delay: i * 0.09 })),
  bigwin: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.32, { vol: 0.16, type: 'triangle', delay: i * 0.08 })); tone(1568, 0.6, { vol: 0.1, delay: 0.45 }); },
  lose: () => { tone(392, 0.25, { vol: 0.12, type: 'triangle' }); tone(311, 0.4, { vol: 0.12, type: 'triangle', delay: 0.18 }); },
  coin: () => { tone(1319, 0.08, { vol: 0.12, type: 'square' }); tone(1760, 0.2, { vol: 0.1, type: 'square', delay: 0.07 }); },
  ach: () => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.2, { vol: 0.1, delay: i * 0.06 })),
  level: () => { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.18, { vol: 0.14, type: 'triangle', delay: i * 0.1 })); tone(1047, 0.5, { vol: 0.14, type: 'triangle', delay: 0.42 }); },
  pop: () => tone(880, 0.06, { vol: 0.08, slide: 1400 }),
  tick: () => tone(1200, 0.02, { vol: 0.05, type: 'square' }),
  chest: () => { noise(0.4, { vol: 0.1, freq: 600, type: 'lowpass', sweep: 4000 }); tone(1568, 0.4, { vol: 0.1, delay: 0.35 }); },
};

function sfx(name) {
  if (!Snd.on || document.hidden) return;
  const c = sndInit();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  try { SOUNDS[name] && SOUNDS[name](); } catch { }
}

// Вібрація (Android; iPhone вібрацію сайтам не дозволяє)
const HAPTIC = { turn: [35], win: [30, 60, 30], bigwin: [40, 50, 40, 50, 80], lose: [70], tap: [10], ach: [20, 40, 20] };
function buzz(kind) {
  if (!Snd.vib || !navigator.vibrate) return;
  try { navigator.vibrate(HAPTIC[kind] || [15]); } catch { }
}
const canVibrate = () => !!navigator.vibrate;

function setSound(on) { Snd.on = on; localStorage.setItem('poker_sound', on ? '1' : '0'); if (on) { sndInit(); sfx('pop'); } }
function setVibration(on) { Snd.vib = on; localStorage.setItem('poker_vib', on ? '1' : '0'); if (on) buzz('tap'); }
