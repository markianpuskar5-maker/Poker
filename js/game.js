// ===== Гра: столи, ставки, боти =====

let SB = 10, BB = 20; // змінюються залежно від столу

// ---------- Характер ботів ----------
// Жодних ярликів: кожен бот — унікальна суміш рис, яка ще й змінюється від настрою,
// розміру стека, втоми та того, що він помітив про вашу гру.
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; // ≈ −1…1

function rollPersona(skill) {
  const sk = clamp(skill + rnd(-0.18, 0.18), 0.05, 0.98);
  // досвідчені гравці ближчі до «правильної» гри, новачки — розкидані у крайнощі
  const pull = (v, target) => v + (target - v) * sk * 0.55;
  return {
    skill: sk,
    tight: clamp(pull(rnd(0.05, 0.95), 0.6)),
    aggr: clamp(pull(rnd(0.1, 0.95), 0.62)),
    bluff: clamp(pull(rnd(0.0, 0.45), 0.16)),
    sticky: clamp((Math.random() < 0.35 ? rnd(0.25, 0.75) : rnd(0, 0.2)) * (1 - sk * 0.8)),
    trap: rnd(0, 0.35),               // схильність «причаїтися» із сильною рукою
    sizing: rnd(0.45, 0.95),          // улюблений розмір ставки (частка банку)
    open: pick([2.5, 3, 3, 3, 3.5, 4]), // розмір відкриття на префлопі, у BB
    tempo: rnd(0.65, 1.45),           // хтось думає швидко, хтось довго
    chatty: rnd(0.05, 0.45),          // наскільки балакучий
    tiltProne: rnd(0.15, 1),          // як сильно засмучується
    patience: Math.round(rnd(25, 110)), // скільки роздач готовий сидіти
  };
}

// Репліки за столом. {m|f} — варіанти для чоловіків і жінок
const CHAT = {
  sit: ['Всім привіт!', 'Добрий вечір, панове.', 'Ну що, роздавайте!', 'Сподіваюсь, карта сьогодні піде 🙂', 'Привіт! Я ненадовго… мабуть.', 'О, знайомі обличчя.'],
  winBig: ['Оце так банк! 😄', 'Йес!', 'Дякую, дякую 🙏', 'Сьогодні мій вечір!', 'Я ж каза{в|ла}, що в мене є 😎', 'Красиво зайшло.'],
  winSmall: ['Беру.', 'Дрібничка, а приємно.', 'Ок 🙂', 'Потихеньку.'],
  loseBig: ['Та ну…', 'Ну як так?!', 'Ех, рівер…', 'Неймовірно. Просто неймовірно.', 'Я так і зна{в|ла} 😩', 'Це покер, детка…', 'Добре зіграно. Але боляче.'],
  tilt: ['Все, тепер я зл{ий|а}.', 'Нічого, зараз відіграюсь!', 'Знову?! 😤', 'Карта просто не йде сьогодні.'],
  foldBig: ['Забирай.', 'Не цього разу.', 'Покажеш? Ні? Ну ок.', 'Хм… пас.', 'Віддаю, хай тобі щастить.'],
  allin: ['Ол-ін!', 'Йду на все!', 'Ну, з Богом 🙏', 'Все або нічого!'],
  callBig: ['Хм… бачу.', 'Не вірю. Колл.', 'Ну подивимось, що в тебе.', 'Ти блефуєш, я відчуваю.'],
  bluffShown: ['Хе-хе, нічого в мене не було 😏', 'Іноді треба ризикувати!'],
  leaveWin: ['Я, мабуть, піду поки в плюсі. Всім дякую!', 'Час забирати виграш. Бувайте!'],
  leaveLose: ['Все, з мене досить на сьогодні.', 'Піду провітрюсь…', 'Сьогодні не мій день. Бувайте.'],
  leave: ['Мені пора, дякую за гру!', 'Все, біжу. Гарної гри!'],
};
function chatLine(p, kind) {
  const s = pick(CHAT[kind]);
  return s.replace(/\{([^|}]*)\|([^}]*)\}/g, (_, m, f) => (p.sex === 'f' ? f : m));
}
// Бот іноді щось каже. force — сказати точно
function botSay(p, kind, force = false) {
  if (p.human || !CHAT[kind]) return;
  if (!force && Math.random() > p.chatty) return;
  const text = chatLine(p, kind);
  log(`💬 <b>${p.name}</b>: «${text}»`, 'chat');
  const el = seatEls[p.seat] && seatEls[p.seat].chat;
  if (!el || G.players[p.seat] !== p) return;
  el.textContent = text;
  replay(el, 'show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

// Настрій: < 0 — засмучений (тільт), > 0 — впевнений
function moodEmoji(p) {
  if (p.human) return '';
  if (p.mood < -0.55) return '😤';
  if (p.mood < -0.3) return '😕';
  if (p.mood > 0.45) return '😎';
  return '';
}

const TABLE_SKILL = { practice: 0.45, micro: 0.2, club: 0.38, river: 0.58, high: 0.75, vip: 0.9 };

const BOT_NAMES = [
  ['Тарас', '🧔', 'm'], ['Марко', '👨', 'm'], ['Остап', '🧑‍🦱', 'm'], ['Богдан', '👴', 'm'], ['Дмитро', '🧑', 'm'],
  ['Андрій', '👨‍🦰', 'm'], ['Ігор', '🕵️', 'm'], ['Роман', '🧑‍🎤', 'm'], ['Назар', '👱', 'm'], ['Степан', '🧓', 'm'],
  ['Олена', '👩', 'f'], ['Ірина', '👩‍🦰', 'f'], ['Соломія', '👱‍♀️', 'f'], ['Оксана', '👩‍🦱', 'f'], ['Марта', '👵', 'f'],
  ['Христина', '👩‍🎤', 'f'], ['Дарина', '👩‍💼', 'f'], ['Віра', '👩‍🔬', 'f'],
];

const PRACTICE_TABLE = { id: 'practice', icon: '🎓', name: 'Гра з тренером', sb: 10, bb: 20, buyin: 1000, cash: false };
const PRACTICE_BOTS = [['Олена', '👩', 'f'], ['Тарас', '🧔', 'm'], ['Марко', '👨', 'm']];

const TABLES = [
  { id: 'micro', icon: '🏠', name: 'Кухонний стіл', desc: 'Дружня гра з новачками. Тут найлегше почати.', sb: 5, bb: 10, min: 200, max: 1000, lvl: 1, foes: 'новачки, які люблять доплачувати' },
  { id: 'club', icon: '♣️', name: 'Клуб «Трефа»', desc: 'Аматори, які вже знають правила.', sb: 10, bb: 20, min: 400, max: 2000, lvl: 2, foes: 'аматори, кожен зі своїми звичками' },
  { id: 'river', icon: '🌊', name: 'Казино «Рівер»', desc: 'Серйозні гравці. Помилки коштують дорожче.', sb: 25, bb: 50, min: 1000, max: 5000, lvl: 4, foes: 'досвідчені гравці' },
  { id: 'high', icon: '🎩', name: 'Хайролер-зал', desc: 'Великі ставки й сміливі суперники.', sb: 100, bb: 200, min: 4000, max: 20000, lvl: 6, foes: 'сильні, помічають ваші звички' },
  { id: 'vip', icon: '👑', name: 'VIP «Роял»', desc: 'Еліта. Лише для найкращих.', sb: 250, bb: 500, min: 10000, max: 50000, lvl: 9, foes: 'професіонали' },
].map(t => ({ ...t, cash: true }));

const G = {
  players: [],
  dealer: -1,
  board: [],
  deck: [],
  street: 'idle',
  currentBet: 0,
  minRaise: BB,
  handNo: 0,
  activeIdx: -1,
  humanResolve: null,
  table: null,
  session: null,
  leaveAfter: false,
  autoTimer: 0,
  settings: {
    showBots: false,
    speed: Number(localStorage.getItem('poker_speed')) || 800,
    auto: localStorage.getItem('poker_auto') === '1',
  },
  lastWinners: [],
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);

function cardHTML(c, cls = '') {
  const red = c.s === 'h' || c.s === 'd';
  return `<div class="card ${red ? 'red' : 'black'} ${cls}" data-id="${c.id}"><span class="cr">${RANK_STR[c.r]}</span><span class="cs">${SUIT_SYM[c.s]}</span><span class="cbig">${SUIT_SYM[c.s]}</span></div>`;
}
function backHTML(cls = '') { return `<div class="card back ${cls}"></div>`; }

// ---------- Гравці ----------
function makeBot([name, avatar, sex], skill, chips) {
  return {
    name, avatar, sex, human: false, chips,
    ...rollPersona(skill),
    mood: rnd(-0.1, 0.25),     // настрій змінюється від виграшів і програшів
    handsHere: 0, startChips: chips,
    obs: { hands: 0, vpip: 0, raised: 0 }, // що за ним помітили (для тренера)
  };
}
function seatify(p, i) {
  return Object.assign(p, { seat: i, hole: [], bet: 0, total: 0, folded: false, allIn: false, acted: false, lastAction: '', shown: false });
}
function botStack(t) {
  const lo = t.min / t.bb, hi = t.max / t.bb;
  return Math.round(lo + Math.random() * (hi - lo)) * t.bb;
}
function randomBot(t) {
  const used = new Set(G.players.map(p => p.name));
  return makeBot(pick(BOT_NAMES.filter(n => !used.has(n[0]))), TABLE_SKILL[t.id] ?? 0.45, botStack(t));
}

function initPlayers(buyin) {
  const t = G.table;
  G.players = [{ name: 'Ви', avatar: Prof.equip.avatar, human: true, chips: buyin }];
  if (t.cash) for (let k = 0; k < 3; k++) G.players.push(randomBot(t));
  else PRACTICE_BOTS.forEach(nm => G.players.push(makeBot(nm, TABLE_SKILL.practice, t.buyin)));
  G.players.forEach(seatify);
  // що боти помічають про вашу гру за цим столом
  G.reads = { hands: 0, vpip: 0, raised: 0, bluffsShown: 0 };
}

// Наскільки ви, на думку ботів, агресивні: 0.25 — звично, більше — часто ставите
function humanAggro() {
  const r = G.reads;
  return (r.raised + 1 + r.bluffsShown * 2) / (r.hands + 4);
}

const N = () => G.players.length;
const nextIdx = i => (i + 1) % N();
const potTotal = () => G.players.reduce((s, p) => s + p.total, 0);
const liveP = () => G.players.filter(p => !p.folded);
const canAct = p => !p.folded && !p.allIn;
const isCash = () => !!(G.table && G.table.cash);

// ---------- Журнал ----------
function log(msg, cls = '') {
  const el = $('log');
  const d = document.createElement('div');
  d.className = 'log-line ' + cls;
  d.innerHTML = msg;
  el.appendChild(d);
  el.scrollTop = el.scrollHeight;
}

// ---------- Рендер ----------
function positionName(i) {
  const d = G.dealer;
  if (i === d) return 'Дилер (баттон) — найкраща позиція, ходиш останнім після флопу';
  if (i === nextIdx(d)) return 'Малий блайнд — погана позиція після флопу, ходиш першим';
  if (i === nextIdx(nextIdx(d))) return 'Великий блайнд — на префлопі ходиш останнім, після флопу — рано';
  return 'Рання позиція (UTG) — ходиш першим на префлопі, грай лише сильні руки';
}

// Карта на столі: дві сторони, що перевертаються
function tableCard(c, cls = '') {
  const d = document.createElement('div');
  d.className = `card3d down ${cls}`;
  d.dataset.id = c.id;
  d.innerHTML = `<div class="cf">${cardHTML(c, 'face')}${backHTML('face rear')}</div>`;
  d._dealing = true;
  d._wantDown = true;
  return d;
}

const seatEls = [];
const boardSlots = [];

function buildTable() {
  const wrap = $('seats');
  wrap.innerHTML = '';
  seatEls.length = 0;
  G.players.forEach((p, i) => {
    const s = document.createElement('div');
    s.className = `seat seat-${i}`;
    s.innerHTML = `
      <div class="seat-cards"></div>
      <div class="seat-box">
        <div class="seat-av">${p.avatar}</div>
        <span class="seat-mood"></span>
        <div class="seat-info">
          <div class="seat-name">${p.name}<span class="badges"></span></div>
          <div class="seat-chips"><span class="coin"></span><span class="v">${p.chips}</span></div>
          ${p.human ? `<div class="seat-title">${titleBadge()}</div>` : ''}
        </div>
        <div class="seat-chat"></div>
        <div class="seat-action"></div>
        <div class="seat-think"><i></i><i></i><i></i></div>
      </div>
      <div class="seat-bet"><span class="chipstack"><i></i><i></i><i></i></span><span class="v">0</span></div>`;
    wrap.appendChild(s);
    seatEls.push({
      root: s,
      av: s.querySelector('.seat-av'),
      mood: s.querySelector('.seat-mood'),
      chat: s.querySelector('.seat-chat'),
      cards: s.querySelector('.seat-cards'),
      box: s.querySelector('.seat-box'),
      badges: s.querySelector('.badges'),
      chips: s.querySelector('.seat-chips .v'),
      action: s.querySelector('.seat-action'),
      bet: s.querySelector('.seat-bet'),
      betV: s.querySelector('.seat-bet .v'),
    });
  });
  const b = $('board');
  b.innerHTML = '';
  boardSlots.length = 0;
  for (let k = 0; k < 5; k++) {
    const sl = document.createElement('div');
    sl.className = 'slot';
    b.appendChild(sl);
    boardSlots.push(sl);
  }
}

function deckEl() {
  const d = $('deck');
  return isVisible(d) ? d : $('pot');
}

function actionKind(t) {
  if (!t) return '';
  if (t.startsWith('Фолд')) return 'k-fold';
  if (t.startsWith('Чек')) return 'k-check';
  if (t.startsWith('Колл')) return 'k-call';
  if (t.startsWith('SB') || t.startsWith('BB')) return 'k-blind';
  return 'k-raise';
}

function render() {
  if (seatEls.length !== G.players.length) buildTable();
  const newHole = [];
  G.players.forEach((p, i) => renderSeat(p, i, newHole));
  const newBoard = renderBoard();
  tweenNumber($('pot'), G.awarded ? 0 : potTotal());
  $('table').classList.toggle('ended', !!G.awarded);
  const names = { idle: '', preflop: 'Префлоп', flop: 'Флоп', turn: 'Терн', river: 'Рівер', showdown: 'Вскриття' };
  const sl = $('street-label');
  const txt = names[G.street] || '';
  if (sl.textContent !== txt) { sl.textContent = txt; replay(sl, 'pop-in'); }
  $('hand-no').textContent = G.handNo ? `Роздача №${G.handNo}` : '';
  positionDealer();
  if (newHole.length) G.dealAnim = dealHoleAnim(newHole);
  if (newBoard.length) G.boardAnim = dealBoardAnim(newBoard);
}

function renderSeat(p, i, newHole) {
  const el = seatEls[i];
  const active = i === G.activeIdx;
  const r = el.root.classList;
  r.toggle('active', active);
  r.toggle('thinking', active && !p.human);
  r.toggle('folded', p.folded);
  r.toggle('winner', G.lastWinners.includes(i));
  r.toggle('busted', p.chips <= 0 && !p.hole.length);

  if (el.av.textContent !== p.avatar) el.av.textContent = p.avatar;
  const moodE = moodEmoji(p);
  if (el.mood.textContent !== moodE) { el.mood.textContent = moodE; if (moodE) replay(el.mood, 'pop-in'); }
  el.mood.title = moodE === '😎' ? 'У гарному настрої' : moodE ? 'Засмучений після програшу' : '';

  const isSB = i === nextIdx(G.dealer), isBB = i === nextIdx(nextIdx(G.dealer));
  const badges = G.handNo ? `${isSB ? '<span class="badge sb">SB</span>' : ''}${isBB ? '<span class="badge bb">BB</span>' : ''}` : '';
  if (el.badges.innerHTML !== badges) el.badges.innerHTML = badges;

  tweenNumber(el.chips, p.chips);

  if (el.action.dataset.t !== p.lastAction) {
    el.action.dataset.t = p.lastAction;
    el.action.textContent = p.lastAction;
    el.action.className = 'seat-action ' + actionKind(p.lastAction) + (p.lastAction ? ' show' : '');
    if (p.lastAction) replay(el.action, 'pop');
  }

  el.bet.classList.toggle('show', p.bet > 0);
  if (p.bet > 0) tweenNumber(el.betV, p.bet, 350);

  // ---- карти гравця ----
  const wrap = el.cards;
  const key = p.hole.map(c => c.id).join(',');
  if (wrap.dataset.key !== key) {
    wrap.innerHTML = '';
    wrap.dataset.key = key;
    wrap.dataset.mucked = '';
    p.hole.forEach((c, k) => {
      const ce = tableCard(c, p.human ? '' : 'sm2');
      wrap.appendChild(ce);
      newHole.push({ el: ce, seat: i, k });
    });
  }
  const reveal = p.human || p.shown || (G.settings.showBots && !isCash());
  const hide = p.folded && !reveal;
  [...wrap.children].forEach(ce => {
    ce._wantDown = !reveal;
    ce.classList.toggle('dim', p.folded);
    if (!ce._dealing) ce.classList.toggle('down', ce._wantDown);
  });
  if (hide && !wrap.dataset.mucked) {
    wrap.dataset.mucked = '1';
    [...wrap.children].forEach((ce, k) => flyOut(ce, deckEl(), { delay: k * 60 }).then(() => { if (wrap.dataset.mucked) ce.style.visibility = 'hidden'; }));
  } else if (!hide && wrap.dataset.mucked) {
    wrap.dataset.mucked = '';
    [...wrap.children].forEach(ce => { ce.getAnimations().forEach(a => a.cancel()); ce.style.visibility = ''; });
  }
}

function renderBoard() {
  const fresh = [];
  boardSlots.forEach((sl, k) => {
    const c = G.board[k];
    const cur = sl.firstElementChild;
    if (!c) { if (cur) sl.innerHTML = ''; return; }
    if (cur && Number(cur.dataset.id) === c.id) return;
    sl.innerHTML = '';
    const ce = tableCard(c);
    ce._wantDown = false;
    sl.appendChild(ce);
    fresh.push(ce);
  });
  return fresh;
}

function landCard(ce) {
  ce._dealing = false;
  ce.classList.toggle('down', ce._wantDown);
}

// Роздача закритих карт: по одній кожному, починаючи з малого блайнда
function dealHoleAnim(items) {
  const order = [];
  for (let k = 1; k <= N(); k++) order.push((G.dealer + k) % N());
  items.sort((a, b) => (a.k - b.k) || (order.indexOf(a.seat) - order.indexOf(b.seat)));
  const from = deckEl();
  return Promise.all(items.map((it, n) =>
    flyIn(it.el, from, { delay: n * 95, dur: 380, rotate: -30 + Math.random() * 20 })
      .then(() => fxSleep(it.k === 0 ? 120 : 0))
      .then(() => landCard(it.el))
  )).then(() => fxSleep(FX.reduced ? 0 : 350));
}

// Викладання спільних карт: прилітають з колоди і перевертаються
function dealBoardAnim(els) {
  const from = deckEl();
  return Promise.all(els.map((ce, n) =>
    flyIn(ce, from, { delay: n * 140, dur: 420, rotate: -10 })
      .then(() => fxSleep(60 + n * 90))
      .then(() => landCard(ce))
  )).then(() => fxSleep(FX.reduced ? 0 : 500));
}

function positionDealer() {
  const btn = $('dealer-btn');
  if (G.dealer < 0 || !G.handNo || !seatEls[G.dealer]) { btn.classList.add('hidden'); return; }
  const tr = $('table').getBoundingClientRect();
  const br = seatEls[G.dealer].box.getBoundingClientRect();
  const x = G.dealer === 1 ? br.right - tr.left - 6 : br.left - tr.left - 22;
  const y = G.dealer === 1 ? br.bottom - tr.top - 8 : br.top - tr.top - 14;
  btn.style.transform = `translate(${x}px, ${y}px)`;
  btn.classList.remove('hidden');
}

// Карти минулої роздачі відлітають у колоду
async function sweepTable() {
  const cards = [...document.querySelectorAll('#table .card3d')].filter(c => c.style.visibility !== 'hidden');
  if (!cards.length) return;
  const to = deckEl();
  cards.forEach(c => c.classList.remove('hl', 'lo'));
  await Promise.all(cards.map((c, n) => flyOut(c, to, { delay: n * 25, dur: 340 })));
}

// Ставки збираються в банк
async function gatherBets() {
  const jobs = [];
  G.players.forEach((p, i) => {
    if (p.bet > 0) {
      const b = seatEls[i].bet;
      jobs.push(flyChips(b, $('pot-chips'), { count: 3, dur: 420, stagger: 50 }));
      b.classList.remove('show');
    }
  });
  if (jobs.length) await Promise.all(jobs);
}

function chipCount(amt) { return Math.max(1, Math.min(6, Math.round(Math.log2(amt / (BB / 2) + 1)))); }

function highlightCards(ids) {
  document.querySelectorAll('#table .card3d').forEach(el => {
    const on = ids.includes(Number(el.dataset.id));
    el.classList.toggle('hl', on);
    el.classList.toggle('lo', !on && !el.classList.contains('down'));
  });
}

// ---------- Ставки ----------
function put(p, amt) {
  amt = Math.min(amt, p.chips);
  p.chips -= amt; p.bet += amt; p.total += amt;
  if (p.chips === 0) p.allIn = true;
  if (p.human) syncSeat();
  return amt;
}

function applyAction(p, act) {
  const toCall = G.currentBet - p.bet;
  let text = '';
  if (act.type === 'fold') {
    p.folded = true; text = 'Фолд';
  } else if (act.type === 'check') {
    text = 'Чек';
  } else if (act.type === 'call') {
    const a = put(p, toCall);
    text = p.allIn ? `Ол-ін ${a}` : `Колл ${a}`;
  } else if (act.type === 'raise') {
    const target = Math.min(act.to, p.bet + p.chips);
    const wasBet = G.currentBet === 0;
    put(p, target - p.bet);
    if (p.bet > G.currentBet) {
      const inc = p.bet - G.currentBet;
      if (inc >= G.minRaise) G.minRaise = inc;
      G.currentBet = p.bet;
      G.players.forEach(o => { if (o !== p && canAct(o)) o.acted = false; });
    }
    text = p.allIn ? `Ол-ін ${p.bet}` : wasBet ? `Бет ${p.bet}` : `Рейз до ${p.bet}`;
  }
  if (act.type === 'raise') { G.aggressor = p; p._r = true; }
  if (G.street === 'preflop' && (act.type === 'call' || act.type === 'raise')) p._vp = true;
  p.acted = true;
  p.lastAction = text;
  log(`<b>${p.name}</b>: ${text}`, p.human ? 'me' : '');
}

async function bettingRound(startIdx) {
  let idx = startIdx;
  let guard = 0;
  while (guard++ < 200) {
    if (liveP().length <= 1) return;
    const actors = G.players.filter(canAct);
    const pending = actors.filter(p => !p.acted || p.bet < G.currentBet);
    if (!pending.length) return;
    if (actors.length === 1 && actors[0].bet >= G.currentBet) return;
    const p = G.players[idx];
    if (canAct(p) && (!p.acted || p.bet < G.currentBet)) {
      G.activeIdx = idx;
      render();
      let act;
      if (p.human) act = await humanTurn(p);
      else {
        act = botDecide(p);
        await sleep(G.leaveAfter ? 60 : botThinkTime(p, act));
        botReact(p, act);
      }
      const before = p.bet;
      applyAction(p, act);
      G.activeIdx = -1;
      render();
      if (p.human) { if (!G.leaveAfter) coachAfterHuman(p, act); }
      else coachWatchBot(p, act);
      if (p.bet > before) await flyChips(seatEls[idx].box, seatEls[idx].bet, { count: chipCount(p.bet - before) });
      else await sleep(act.type === 'fold' ? 300 : 150);
      if (p.human) renderCoachIdle();
    }
    idx = nextIdx(idx);
  }
}

function collectBets() {
  G.players.forEach(p => { p.bet = 0; p.acted = false; if (!p.folded && !p.allIn) p.lastAction = ''; });
  G.currentBet = 0;
  G.minRaise = BB;
  G.aggressor = null;
}

// ---------- Роздача ----------
async function playHand() {
  if (G.running || !G.table) return;
  clearTimeout(G.autoTimer);
  G.running = true;
  try { await playHandInner(); } finally { G.running = false; }
  if (G.leaveAfter) leaveTable();
}

// Перед роздачею: банкрути-боти йдуть, на їх місце сідають нові
function refreshBots() {
  const t = G.table;
  let changed = false;
  const newcomers = [];
  G.players.forEach((p, i) => {
    if (p.human) return;
    if (!t.cash) {
      if (p.chips <= 0) { p.chips = t.buyin; log(`🔄 ${p.name} докупає ${t.buyin} фішок.`, 'sys'); }
      return;
    }
    const broke = p.chips <= 0;
    // люди йдуть по-різному: хтось утомився, хтось на емоціях, хтось забирає виграш
    const up = p.chips > p.startChips * 1.7, down = p.chips < p.startChips * 0.5;
    const leaveP = 0.012 + (p.handsHere > p.patience ? 0.07 : 0) + (p.mood < -0.6 ? 0.05 : 0) + (up ? 0.03 : 0) + (down ? 0.02 : 0);
    if (broke || Math.random() < leaveP) {
      const nb = randomBot(t);
      if (broke) log(`💸 ${p.name} програє все і йде з-за столу.`, 'sys');
      else {
        botSay(p, up ? 'leaveWin' : p.mood < -0.4 || down ? 'leaveLose' : 'leave', true);
        log(`👋 ${p.name} забирає ${p.chips} і йде з-за столу.`, 'sys');
      }
      log(`🪑 За стіл сідає <b>${nb.name}</b>, фішок: ${nb.chips}.`, 'sys');
      G.players[i] = seatify(nb, i);
      newcomers.push(nb);
      changed = true;
    }
  });
  if (changed) buildTable();
  newcomers.forEach(nb => setTimeout(() => botSay(nb, 'sit', Math.random() < 0.6), 400));
}

async function playHandInner() {
  $('next-box').classList.add('hidden');
  setControls(false);
  $('result').innerHTML = '';
  G.lastWinners = [];
  const me = G.players[0];
  if (me.chips <= 0) { showBust(); return; }
  await sweepTable();
  G.awarded = false;
  refreshBots();
  me.avatar = Prof.equip.avatar;
  G.players.forEach(p => Object.assign(p, { hole: [], bet: 0, total: 0, folded: false, allIn: false, acted: false, lastAction: '', shown: false, _r: false, _vp: false, handStart: p.chips }));
  G.aggressor = null;
  // у кожного «свій день»: трохи інакший настрій від роздачі до роздачі
  G.players.forEach(p => { if (!p.human) { p.vibe = gauss() * 0.1; p.mood *= 0.88; } });
  G.handNo++;
  coachHandStart();
  G.dealer = nextIdx(G.dealer);
  G.board = [];
  G.deck = newDeck();
  const sbI = nextIdx(G.dealer), bbI = nextIdx(sbI);
  log(`<hr><b>— Роздача №${G.handNo} —</b> Дилер: ${G.players[G.dealer].name}`, 'sys');
  put(G.players[sbI], SB); G.players[sbI].lastAction = `SB ${G.players[sbI].bet}`;
  put(G.players[bbI], BB); G.players[bbI].lastAction = `BB ${G.players[bbI].bet}`;
  log(`${G.players[sbI].name} ставить малий блайнд ${SB}, ${G.players[bbI].name} — великий блайнд ${BB}.`, 'sys');
  G.currentBet = BB; G.minRaise = BB;
  G.street = 'preflop';
  render();
  await Promise.all([
    flyChips(seatEls[sbI].box, seatEls[sbI].bet, { count: 1 }),
    flyChips(seatEls[bbI].box, seatEls[bbI].bet, { count: 2 }),
  ]);
  for (let k = 0; k < 2; k++) G.players.forEach(p => p.hole.push(G.deck.pop()));
  log(`🃏 Ваші карти: <b>${me.hole.map(cardText).join(' ')}</b>`, 'me');
  render();
  await G.dealAnim;
  renderCoachIdle();
  await bettingRound(nextIdx(bbI));

  const streets = [['flop', 3, 'Флоп: на стіл викладено 3 спільні карти'], ['turn', 1, 'Терн: 4-та спільна карта'], ['river', 1, 'Рівер: остання, 5-та спільна карта']];
  for (const [st, n, msg] of streets) {
    if (liveP().length <= 1) break;
    await gatherBets();
    collectBets();
    G.street = st;
    for (let k = 0; k < n; k++) G.board.push(G.deck.pop());
    log(`📍 ${msg}: <b>${G.board.map(cardText).join(' ')}</b>`, 'street');
    render();
    await G.boardAnim;
    coachStreetNote();
    renderCoachIdle();
    if (G.players.filter(canAct).length >= 2) await bettingRound(nextIdx(G.dealer));
    else await sleep(G.leaveAfter ? 100 : G.settings.speed);
  }
  await finishHand();
}

function buildPots() {
  const levels = [...new Set(G.players.map(p => p.total).filter(x => x > 0))].sort((a, b) => a - b);
  const pots = [];
  let prev = 0;
  for (const lv of levels) {
    let amt = 0;
    G.players.forEach(p => { amt += Math.min(p.total, lv) - Math.min(p.total, prev); });
    const elig = G.players.filter(p => !p.folded && p.total >= lv);
    if (elig.length) pots.push({ amt, elig });
    else if (pots.length) pots[pots.length - 1].amt += amt;
    prev = lv;
  }
  // об'єднати сусідні банки з однаковими учасниками
  const merged = [];
  for (const pt of pots) {
    const last = merged[merged.length - 1];
    if (last && last.elig.length === pt.elig.length && last.elig.every(p => pt.elig.includes(p))) last.amt += pt.amt;
    else merged.push({ ...pt });
  }
  return merged;
}

async function finishHand() {
  G.activeIdx = -1;
  await gatherBets();
  G.players.forEach(p => p.bet = 0);
  const live = liveP();
  const me = G.players[0];
  const startChips = me.chips + me.total;
  const meBefore = me.chips;
  const potBefore = potTotal();
  let html = '';
  if (live.length > 1) {
    // вскриття: перевертаємо карти суперників
    G.street = 'showdown';
    live.forEach(p => p.shown = true);
    render();
    await sleep(FX.reduced ? 200 : 900);
  }
  if (live.length === 1) {
    const w = live[0];
    const pot = potTotal();
    w.chips += pot;
    G.lastWinners = [w.seat];
    log(`🏆 <b>${w.name}</b> забирає банк <b>${pot}</b> — усі інші скинули карти.`, 'win');
    html = `<div class="res-t">${w.human ? '🎉 Ви виграли' : w.name + ' виграє'} ${pot}</div><div class="res-s">Усі інші скинули карти — вскриття не було.</div>`;
    G.street = 'showdown';
  } else {
    G.street = 'showdown';
    live.forEach(p => p.shown = true);
    const evals = new Map(live.map(p => [p, evaluate(p.hole.concat(G.board))]));
    log('🔍 <b>Вскриття:</b>', 'street');
    live.forEach(p => log(`&nbsp;&nbsp;${p.name}: ${p.hole.map(cardText).join(' ')} → <b>${handName(evals.get(p))}</b>`));
    const pots = buildPots();
    const lines = [];
    const winSeats = new Set();
    pots.forEach((pt, pi) => {
      const best = Math.max(...pt.elig.map(p => evals.get(p).score));
      const ws = pt.elig.filter(p => evals.get(p).score === best);
      const share = Math.floor(pt.amt / ws.length);
      let rem = pt.amt - share * ws.length;
      // залишок — першому переможцю після дилера
      const order = [];
      for (let k = 1; k <= N(); k++) { const pp = G.players[(G.dealer + k) % N()]; if (ws.includes(pp)) order.push(pp); }
      order.forEach(p => { p.chips += share + (rem > 0 ? 1 : 0); if (rem > 0) rem--; winSeats.add(p.seat); });
      const potName = pots.length > 1 ? (pi === 0 ? 'Основний банк' : `Побічний банк ${pi}`) : 'Банк';
      const wn = ws.map(p => p.name).join(' і ');
      const hn = handName(evals.get(ws[0]));
      if (pt.elig.length === 1) {
        lines.push(`${ws[0].name} повертає неколловану ставку ${pt.amt}`);
        log(`↩️ ${ws[0].name} отримує назад ${pt.amt} (ніхто не зрівняв)`, 'sys');
      } else {
        lines.push(`${potName} ${pt.amt}: <b>${wn}</b> — ${hn}${ws.length > 1 ? ' (поділ)' : ''}`);
        log(`🏆 ${potName} <b>${pt.amt}</b> → <b>${wn}</b> (${hn})${ws.length > 1 ? ' — банк ділиться' : ''}`, 'win');
      }
    });
    G.lastWinners = [...winSeats];
    html = `<div class="res-t">${G.lastWinners.includes(0) ? '🎉 Ви виграли!' : '🏆 ' + G.lastWinners.map(i => G.players[i].name).join(' і ') + ' виграє'}</div><div class="res-s">${lines.join('<br>')}</div>`;
  }
  syncSeat();
  botsAfterHand(live);
  if (live.length > 1) highlightCards(bestFive(G.players[G.lastWinners[0]].hole.concat(G.board)).map(c => c.id));
  const potEl = $('pot-chips');
  const flights = G.lastWinners.map(i => flyChips(potEl, seatEls[i].box, { count: Math.min(8, 2 + chipCount(potBefore)), dur: 650, stagger: 60 }));
  G.awarded = true;
  render();
  await Promise.all(flights);
  $('result').innerHTML = html;
  replay($('result'), 'pop-in');

  // ---- результат для профілю ----
  const diff = me.chips - startChips;
  const received = me.chips - meBefore;
  const won = G.lastWinners.includes(0) && received > me.total;
  const myEv = !me.folded && G.board.length === 5 ? evaluate(me.hole.concat(G.board)) : null;
  const s = G.session;
  s.hands++;
  if (won) s.wins++;
  if (received - me.total > s.biggest) s.biggest = received - me.total;
  if (myEv && myEv.cat > s.best) s.best = myEv.cat;
  onHandEnd({
    won, received, diff, bb: BB, cash: isCash(),
    showdown: live.length > 1,
    cat: myEv ? myEv.cat : -1,
    royal: !!(myEv && myEv.cat === 8 && myEv.tb[0] === 14),
    bluff: live.length === 1 && live[0] === me && G.board.length >= 3 && evaluate(me.hole.concat(G.board)).cat === 0,
  });

  if (diff > 0) winFx(diff >= BB * 15 ? 140 : 70);
  renderCoachReview(diff);
  updateTableBar();
  if (G.leaveAfter) return;
  showNextButton();
  if (me.chips <= 0) { $('btn-next').textContent = isCash() ? '💸 Фішки закінчились' : '💸 Докупити фішки'; }
  else {
    $('btn-next').textContent = 'Наступна роздача ▶';
    if (G.settings.auto) {
      const h = G.handNo;
      G.autoTimer = setTimeout(() => {
        const visible = $('view-play').classList.contains('active') && $('modal').classList.contains('hidden');
        if (G.handNo === h && G.table && visible) nextHandClick();
      }, 2800);
    }
  }
}

function showBust() {
  const t = G.table;
  if (!t.cash) {
    showModal(`<h2>Фішки закінчились 😔</h2><p>Нічого страшного — так вчаться всі! Подумай, які рішення привели до програшу. Тренер завжди підкаже.</p>
    <p class="muted">За тренувальним столом фішки безкоштовні.</p>
    <p class="modal-btns"><button class="btn primary" onclick="rebuy()">Взяти ще ${t.buyin} фішок</button><button class="btn" onclick="closeModal();leaveTable()">Вийти в меню</button></p>`);
    return;
  }
  const can = Prof.coins >= t.min;
  showModal(`<h2>Фішки на столі закінчились 😔</h2>
    <p>За цим столом ви програли все, що принесли. Так буває навіть у профі — головне не грати на емоціях (це називається <b>тільт</b>).</p>
    <p>На балансі: <b class="coin-txt">🪙 ${fmt(Prof.coins)}</b></p>
    ${can ? '' : `<p class="muted">Для докупу потрібно щонайменше ${fmt(t.min)} 🪙. Спробуйте дешевший стіл${Prof.coins < BROKE_LINE ? ' або отримайте допомогу в меню' : ''}.</p>`}
    <p class="modal-btns">${can ? `<button class="btn primary" onclick="openBuyIn('${t.id}', true)">Докупитися</button>` : ''}<button class="btn" onclick="closeModal();leaveTable()">Встати з-за столу</button></p>`);
}
function rebuy() {
  G.players[0].chips = G.table.buyin;
  log(`🔄 Ви взяли ${G.table.buyin} тренувальних фішок.`, 'sys');
  closeModal();
  playHand();
}

// ---------- Хід людини ----------
function humanTurn(p) {
  if (G.leaveAfter) return Promise.resolve({ type: 'fold' });
  return new Promise(resolve => {
    G.humanResolve = resolve;
    setupControls(p);
    coachBeforeHuman(p);
    renderCoach(p);
  });
}

function setupControls(p) {
  const toCall = G.currentBet - p.bet;
  const maxTo = p.bet + p.chips;
  const minTo = Math.min(G.currentBet + G.minRaise, maxTo);
  setControls(true);
  $('btn-call').textContent = toCall === 0 ? 'Чек' : (toCall >= p.chips ? `Ол-ін ${p.chips}` : `Колл ${toCall}`);
  const canRaise = p.chips > toCall;
  $('raise-box').style.display = canRaise ? '' : 'none';
  const rng = $('raise-range'), num = $('raise-num');
  const step = BB <= 20 ? 5 : BB / 10;
  rng.min = num.min = minTo; rng.max = num.max = maxTo; rng.step = step;
  const pot = potTotal();
  const def = Math.min(maxTo, Math.max(minTo, G.street === 'preflop' ? G.currentBet * 3 : G.currentBet + Math.round((pot + toCall) * 0.66 / step) * step));
  rng.value = num.value = def;
  updateRaiseLabel();
  $('btn-fold').style.visibility = toCall === 0 ? 'hidden' : 'visible';
  document.querySelectorAll('.preset').forEach(b => {
    b.onclick = () => {
      let v;
      const k = b.dataset.p;
      const potAfterCall = potTotal() + toCall;
      if (k === 'min') v = minTo;
      else if (k === 'half') v = G.currentBet + Math.round(potAfterCall / 2);
      else if (k === 'pot') v = G.currentBet + potAfterCall;
      else if (k === '3bb') v = BB * 3;
      else v = maxTo;
      v = Math.max(minTo, Math.min(maxTo, v));
      rng.value = num.value = v;
      updateRaiseLabel();
    };
  });
  document.querySelector('.preset[data-p="3bb"]').style.display = G.street === 'preflop' && G.currentBet === BB ? '' : 'none';
}

function setControls(on) {
  const c = $('controls');
  c.classList.remove('hidden', 'between');
  c.classList.toggle('off', !on);
  if (on) replay(c, 'your-turn');
  c.querySelectorAll('button, input').forEach(b => { if (b.id !== 'btn-next') b.disabled = !on; });
}

// Кінець роздачі: замість кнопок дій — «Наступна роздача»
function showNextButton() {
  const c = $('controls');
  c.classList.remove('off', 'hidden');
  c.classList.add('between');
  $('next-box').classList.remove('hidden');
  replay($('next-box'), 'pop-in');
}

function nextHandClick() {
  if (G.running || !G.table || $('next-box').classList.contains('hidden')) return;
  if (G.players[0].chips <= 0) showBust(); else playHand();
}

function updateRaiseLabel() {
  const p = G.players[0];
  const v = Number($('raise-num').value);
  const max = p.bet + p.chips;
  $('btn-raise').textContent = v >= max ? `Ол-ін ${max}` : (G.currentBet === 0 ? `Бет ${v}` : `Рейз до ${v}`);
  const rng = $('raise-range');
  const k = (Number(rng.value) - Number(rng.min)) / ((Number(rng.max) - Number(rng.min)) || 1);
  rng.style.setProperty('--fill', Math.round(Math.max(0, Math.min(1, k)) * 100) + '%');
}

function humanAct(type) {
  if (!G.humanResolve) return;
  const p = G.players[0];
  const toCall = G.currentBet - p.bet;
  let act;
  if (type === 'fold') act = toCall === 0 ? { type: 'check' } : { type: 'fold' };
  else if (type === 'call') act = toCall === 0 ? { type: 'check' } : { type: 'call' };
  else {
    let v = Number($('raise-num').value) || 0;
    const min = Math.min(G.currentBet + G.minRaise, p.bet + p.chips);
    v = Math.max(min, Math.min(p.bet + p.chips, v));
    act = { type: 'raise', to: v };
  }
  setControls(false);
  const r = G.humanResolve; G.humanResolve = null;
  r(act);
}

// ---------- ШІ ботів ----------
// Рішення бота. diff (0…1) — наскільки важке рішення: від нього залежить, скільки він «думає»
function botDecide(p) {
  const toCall = G.currentBet - p.bet;
  const pot = potTotal();
  const nOpp = liveP().length - 1;
  const eqTrue = calcEquity(p.hole, G.board, nOpp, 300).equity;
  // люди не рахують шанси точно: що менше досвіду, то більша похибка
  const vibe = p.vibe || 0;
  const eq = clamp(eqTrue + gauss() * (1 - p.skill) * 0.14 + vibe * 0.3, 0.01, 0.99);
  const strength = eq * (nOpp + 1); // 1.0 = середня рука
  const tilt = Math.max(0, -p.mood), conf = Math.max(0, p.mood);
  const others = G.players.filter(o => o !== p && o.chips + o.total > 0);
  const avgStack = others.reduce((s, o) => s + o.chips + o.total, 0) / Math.max(1, others.length);
  const bully = p.chips > avgStack * 1.8 ? 0.1 : 0;         // великий стек тисне на інших
  const t = {                                                // риси саме зараз
    tight: clamp(p.tight - tilt * 0.4 - conf * 0.08 + vibe),
    aggr: clamp(p.aggr + tilt * 0.3 + conf * 0.12 + bully),
    bluff: clamp(p.bluff + tilt * 0.22 + bully * 0.5),
    sticky: clamp(p.sticky + tilt * 0.25),
  };
  const r = Math.random();
  const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;
  const maxTo = p.bet + p.chips;
  const roundTo = v => Math.round(v / SB) * SB;
  const size = () => clamp(p.sizing + rnd(-0.15, 0.2) + tilt * 0.25, 0.33, 1.3);
  const raiseTo = (mult, diff) => {
    let to;
    if (G.street === 'preflop') to = G.currentBet === BB ? roundTo(BB * (p.open + tilt + rnd(-0.25, 0.5))) : roundTo(G.currentBet * rnd(2.6, 3.4));
    else to = G.currentBet + Math.max(G.minRaise, roundTo((pot + toCall) * mult));
    to = Math.max(to, G.currentBet + G.minRaise);
    return { type: 'raise', to: Math.min(to, maxTo), diff };
  };
  // що бот помітив про вас: якщо ви часто ставите — він вам менше вірить
  const vsHuman = toCall > 0 && G.aggressor && G.aggressor.human;
  const readAdj = vsHuman ? clamp((humanAggro() - 0.25) * 0.9 * p.skill, -0.2, 0.3) : 0;
  const strongT = 1.75 - t.aggr * 0.35;

  // короткий стек на префлопі: ол-ін або пас
  if (G.street === 'preflop' && p.chips < BB * 12 && strength > 1.25 - t.aggr * 0.25 + t.tight * 0.15) return { type: 'raise', to: maxTo, diff: 0.7 };

  if (toCall === 0) {
    // із монстром іноді причаюється, щоб хтось поставив
    if (strength > strongT + 0.3 && G.street !== 'river' && G.street !== 'preflop' && r < p.trap) return { type: 'check', diff: 0.6 };
    if (strength > strongT && r < 0.45 + t.aggr * 0.45) return raiseTo(size(), 0.4);
    if (strength > 1.2 && r < t.aggr * 0.4) return raiseTo(size() * 0.8, 0.5);
    if (r < t.bluff * 0.5 && nOpp <= 2) return raiseTo(size() * 0.85, 0.7);
    return { type: 'check', diff: strength < 0.8 ? 0.15 : 0.35 };
  }
  // є ставка
  const commit = toCall / (p.chips + p.bet);
  if (strength > strongT + 0.35 && r < 0.3 + t.aggr * 0.5 && p.chips > toCall) return raiseTo(size() + 0.1, 0.6);
  if (t.bluff > 0.3 && r < t.bluff * 0.3 && commit < 0.15 && p.chips > toCall * 3) return raiseTo(size(), 0.8);
  if (commit > 0.35 && strength < 1.35 + t.tight * 0.3 - t.sticky * 0.6 - readAdj)
    return Math.random() < t.bluff * 0.3 + t.sticky * 0.4 + readAdj ? { type: 'call', diff: 1 } : { type: 'fold', diff: 0.9 };
  if (G.street === 'preflop') {
    const callT = 0.8 + t.tight * 0.4 + Math.min(0.6, (toCall / BB) * 0.04) - t.sticky * 0.45 - readAdj;
    if (strength >= callT) return { type: 'call', diff: strength - callT < 0.15 ? 0.7 : 0.3 };
    if (toCall <= BB / 2 && r < 0.5 + t.sticky * 0.4) return { type: 'call', diff: 0.3 }; // малий блайнд доплачує
    return { type: 'fold', diff: callT - strength < 0.15 ? 0.6 : 0.1 };
  }
  const need = potOdds * (0.85 + t.tight * 0.5) * (1 - t.sticky * 0.45) * (1 - readAdj);
  if (eq >= need) return { type: 'call', diff: eq - need < 0.08 ? 0.8 : 0.35 };
  if (r < t.bluff * 0.25 && commit < 0.1 && p.chips > toCall) return raiseTo(size(), 0.9);
  return { type: 'fold', diff: need - eq < 0.08 ? 0.75 : 0.2 };
}

// Скільки бот «думає»: легкі рішення — швидко, важкі — довше, іноді надовго задумується
function botThinkTime(p, act) {
  const base = G.settings.speed * p.tempo;
  const d = act.diff ?? 0.5;
  let k = 0.5 + d * 1.15;
  if (act.type === 'fold' && d < 0.25) k = 0.45;
  if (Math.random() < 0.06) k *= 1.9;        // задумався
  if (p.mood < -0.5) k *= 0.75;              // на емоціях діє поспіхом
  return Math.round(clamp(base * k * rnd(0.8, 1.25), 250, G.settings.speed * 3));
}

// Коротка реакція на власну дію
function botReact(p, act) {
  const toCall = G.currentBet - p.bet;
  const pot = potTotal();
  const goesAllIn = (act.type === 'raise' && act.to >= p.bet + p.chips) || (act.type === 'call' && toCall >= p.chips);
  if (goesAllIn && p.chips > BB * 5) botSay(p, 'allin');
  else if (act.type === 'fold' && toCall >= pot * 0.45 && toCall >= BB * 3) { if (Math.random() < 0.5) botSay(p, 'foldBig'); }
  else if (act.type === 'call' && toCall >= pot * 0.5 && G.aggressor && G.aggressor.human) { if (Math.random() < 0.5) botSay(p, 'callBig'); }
}

// Після роздачі: настрій, спостереження, репліки
function botsAfterHand(live) {
  const showdown = live.length > 1;
  const me = G.players[0];
  // що боти помітили про вас
  G.reads.hands++;
  if (me._vp) G.reads.vpip++;
  if (me._r) G.reads.raised++;
  if (showdown && live.includes(me) && me._r && G.board.length === 5 && evaluate(me.hole.concat(G.board)).cat === 0) G.reads.bluffsShown++;

  const speakers = [];
  G.players.forEach(p => {
    if (p.human) return;
    p.handsHere++;
    p.obs.hands++;
    if (p._vp) p.obs.vpip++;
    if (p._r) p.obs.raised++;
    const delta = p.chips - p.handStart;
    if (delta < 0 && showdown && live.includes(p)) {
      // програв на вскритті — боляче
      const sev = clamp(-delta / BB / 40 + -delta / Math.max(1, p.handStart), 0, 1.2);
      p.mood -= sev * 0.6 * p.tiltProne;
      if (sev > 0.45) speakers.push({ p, kind: p.mood < -0.5 ? 'tilt' : 'loseBig', pr: sev, force: sev > 0.8 });
    } else if (delta > 0) {
      const g = clamp(delta / BB / 40, 0, 1);
      p.mood += g * 0.35;
      if (g > 0.5) speakers.push({ p, kind: 'winBig', pr: g, force: g > 0.9 });
      else if (Math.random() < 0.25) speakers.push({ p, kind: 'winSmall', pr: 0.1 });
      // виграв без вскриття з нічим — іноді хизується
      if (!showdown && p._r && G.board.length >= 3 && evaluate(p.hole.concat(G.board)).cat === 0 && Math.random() < 0.3) speakers.push({ p, kind: 'bluffShown', pr: 0.5 });
    }
    p.mood = clamp(p.mood, -1, 1);
  });
  // говорить не більше одного, щоб не було галасу
  speakers.sort((a, b) => b.pr - a.pr);
  if (speakers[0]) setTimeout(() => botSay(speakers[0].p, speakers[0].kind, speakers[0].force), 700);
}

// ---------- Тренер: див. js/coach.js ----------

// ---------- Стіл: сісти / встати ----------
function startTable(t, buyin) {
  G.table = t;
  SB = t.sb; BB = t.bb;
  G.minRaise = BB;
  G.session = { hands: 0, wins: 0, buyins: buyin, dec: 0, good: 0, biggest: 0, best: -1 };
  G.leaveAfter = false;
  initPlayers(buyin);
  G.dealer = Math.floor(Math.random() * N());
  G.handNo = 0;
  G.board = []; G.street = 'idle'; G.lastWinners = []; G.awarded = false;
  $('log').innerHTML = '';
  $('result').innerHTML = '';
  buildTable();
  render();
  setControls(false);
  loadCoachMode();
  updateOptsVisibility();
  updateTableBar();
  coachHandStart();
  renderCoachIdle();
  showView('play');
  log(t.cash
    ? `Ви сіли за стіл «${t.name}» з ${fmt(buyin)} фішками. Блайнди ${SB}/${BB}.`
    : `Тренувальна гра: блайнди ${SB}/${BB}, у кожного по ${buyin} фішок. Тренер підказує кожен хід.`, 'sys');
  setTimeout(playHand, 350);
  // хтось за столом вітається
  const bots = G.players.filter(p => !p.human);
  setTimeout(() => botSay(pick(bots), 'sit', true), 900);
}

function startPractice() {
  if (G.table) {
    if (G.table.cash) notify(`Ви за столом «${G.table.name}». Спершу встаньте з-за столу.`, 'warn', '🪑');
    showView('play');
    return;
  }
  startTable(PRACTICE_TABLE, PRACTICE_TABLE.buyin);
}

function requestLeave() {
  if (!G.table) return;
  if (!G.running) { leaveTable(); return; }
  if (G.leaveAfter) { G.leaveAfter = false; updateTableBar(); return; }
  const me = G.players[0];
  const inHand = me.hole.length && !me.folded && !me.allIn && G.street !== 'showdown';
  if (inHand) {
    showModal(`<h2>Вийти посеред роздачі?</h2><p>Ви ще в грі. Якщо встанете зараз — ваші карти буде скинуто${me.total ? `, а вже поставлені <b>${me.total}</b> фішок залишаться в банку` : ''}.</p>
      <p class="modal-btns"><button class="btn primary" onclick="confirmLeave()">Скинути й вийти</button><button class="btn" onclick="closeModal()">Залишитися</button></p>`);
    return;
  }
  confirmLeave();
}

function confirmLeave() {
  closeModal();
  if (!G.running) { leaveTable(); return; }
  G.leaveAfter = true;
  if (G.humanResolve) {
    setControls(false);
    const r = G.humanResolve; G.humanResolve = null;
    r({ type: 'fold' });
  }
  updateTableBar();
}

function leaveTable() {
  const t = G.table;
  if (!t) return;
  clearTimeout(G.autoTimer);
  const me = G.players[0];
  const s = G.session;
  const chips = me ? me.chips : 0;
  if (t.cash) {
    Prof.seat = null;
    addCoins(chips);
  }
  G.table = null; G.session = null; G.leaveAfter = false;
  G.players = []; G.handNo = 0; G.dealer = -1; G.board = []; G.street = 'idle'; G.lastWinners = []; G.awarded = false; G.activeIdx = -1;
  SB = 10; BB = 20;
  buildTable();
  render();
  $('result').innerHTML = '';
  $('controls').classList.add('hidden');
  $('next-box').classList.add('hidden');
  coachHandStart();
  updateTableBar();
  showView(t.cash ? 'lobby' : 'menu');
  if (!s || !s.hands) return;
  const profit = chips - s.buyins;
  const q = s.dec ? Math.round(s.good / s.dec * 100) + '%' : '—';
  showModal(`<h2>${t.icon} ${t.name}: підсумок гри</h2>
    <div class="sum-grid">
      <div><span>Роздач</span><b>${s.hands}</b></div>
      <div><span>Виграно банків</span><b>${s.wins}</b></div>
      ${t.cash ? `<div><span>Результат</span><b class="${profit > 0 ? 'pos' : profit < 0 ? 'neg' : ''}">${profit > 0 ? '+' : ''}${fmt(profit)} 🪙</b></div>` : ''}
      <div><span>Найбільший виграш</span><b>${fmt(s.biggest)}</b></div>
      <div><span>Найкраща рука</span><b>${s.best >= 0 ? CAT_NAMES[s.best] : '—'}</b></div>
      <div><span>Якість рішень</span><b>${q}</b></div>
    </div>
    ${t.cash ? `<p>На баланс повернено <b class="coin-txt">${fmt(chips)} 🪙</b>. Зараз у вас <b class="coin-txt">${fmt(Prof.coins)} 🪙</b>.</p>` : ''}
    <p class="muted">${profit > 0 ? 'Гарна сесія! Вчасно встати з-за столу з прибутком — теж уміння.' : profit < 0 && t.cash ? 'Не пощастило. Перегляньте помилки в коментарях тренера і спробуйте знову.' : 'Кожна роздача — це досвід.'}</p>
    <p class="modal-btns"><button class="btn primary" onclick="closeModal()">Гаразд</button></p>`);
}

function updateTableBar() {
  const t = G.table;
  $('table-bar').classList.toggle('hidden', !t);
  if (!t) return;
  $('tb-icon').textContent = t.icon;
  $('tb-name').textContent = t.name;
  $('tb-info').textContent = `Блайнди ${t.sb}/${t.bb} · ${t.cash ? 'гра на монети' : 'безкоштовні фішки'}`;
  const s = G.session;
  let sess = `Роздач: <b>${s.hands}</b>`;
  if (t.cash && G.players[0]) {
    const profit = G.players[0].chips - s.buyins;
    sess += ` · Сесія: <b class="${profit > 0 ? 'pos' : profit < 0 ? 'neg' : ''}">${profit > 0 ? '+' : ''}${fmt(profit)}</b>`;
  }
  $('tb-sess').innerHTML = sess;
  const b = $('btn-leave');
  b.textContent = G.leaveAfter ? '⏳ Вийдете після роздачі (скасувати)' : '🚪 Встати з-за столу';
  b.classList.toggle('pending', G.leaveAfter);
}

function updateOptsVisibility() {
  const cash = isCash();
  $('opt-show-row').classList.toggle('hidden', cash);
  const o = $('opt-coach').querySelector('option[value="hint"]');
  o.hidden = o.disabled = cash;
  $('opt-coach-note').classList.toggle('hidden', !cash);
}

function initGameUI() {
  buildTable();
  render();
  addEventListener('resize', positionDealer);
  $('btn-fold').onclick = () => humanAct('fold');
  $('btn-call').onclick = () => humanAct('call');
  $('btn-raise').onclick = () => humanAct('raise');
  $('raise-range').oninput = e => { $('raise-num').value = e.target.value; updateRaiseLabel(); };
  $('raise-num').oninput = e => { $('raise-range').value = e.target.value; updateRaiseLabel(); };
  $('btn-next').onclick = nextHandClick;
  $('btn-leave').onclick = requestLeave;
  $('opt-coach').value = Coach.mode;
  $('opt-coach').onchange = e => setCoachMode(e.target.value);
  $('coach-toast').onclick = hideCoachToast;
  swipeToDismiss($('coach-toast'), () => { const el = $('coach-toast'); hideCoachToast(); setTimeout(() => resetSwipe(el), 350); });
  $('opt-show').onchange = e => { G.settings.showBots = e.target.checked; if (G.players.length) render(); };
  $('opt-speed').value = String(G.settings.speed);
  if (!$('opt-speed').value) $('opt-speed').value = '800';
  $('opt-speed').onchange = e => { G.settings.speed = Number(e.target.value); localStorage.setItem('poker_speed', e.target.value); };
  $('opt-auto').checked = G.settings.auto;
  $('opt-auto').onchange = e => { G.settings.auto = e.target.checked; localStorage.setItem('poker_auto', e.target.checked ? '1' : '0'); };
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (!G.humanResolve) {
      const playing = $('view-play').classList.contains('active') && $('modal').classList.contains('hidden');
      if (playing && (e.key === 'n' || e.key === 'т' || e.key === ' ') && !$('next-box').classList.contains('hidden')) { e.preventDefault(); nextHandClick(); }
      return;
    }
    if (!$('modal').classList.contains('hidden')) return;
    if (e.key === 'f' || e.key === 'а') humanAct('fold');
    if (e.key === 'c' || e.key === 'с' || e.key === ' ') { e.preventDefault(); humanAct('call'); }
    if (e.key === 'r' || e.key === 'к') humanAct('raise');
  });
  updateTableBar();
  renderCoachIdle();
}
