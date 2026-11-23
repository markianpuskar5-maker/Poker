// ===== Гра: столи, ставки, боти =====

let SB = 10, BB = 20; // змінюються залежно від столу

// Типи суперників
const ARCH = {
  rock: { m: 'Обережний', f: 'Обережна', tight: 0.85, aggr: 0.35, bluff: 0.05, sticky: 0 },
  tag: { m: 'Збалансований', f: 'Збалансована', tight: 0.55, aggr: 0.6, bluff: 0.15, sticky: 0 },
  lag: { m: 'Агресивний', f: 'Агресивна', tight: 0.25, aggr: 0.85, bluff: 0.35, sticky: 0 },
  station: { m: 'Колл-станція', f: 'Колл-станція', tight: 0.2, aggr: 0.12, bluff: 0.03, sticky: 0.75 },
  maniac: { m: 'Шалений', f: 'Шалена', tight: 0.08, aggr: 0.95, bluff: 0.5, sticky: 0.3 },
};

const BOT_NAMES = [
  ['Тарас', '🧔', 'm'], ['Марко', '👨', 'm'], ['Остап', '🧑‍🦱', 'm'], ['Богдан', '👴', 'm'], ['Дмитро', '🧑', 'm'],
  ['Андрій', '👨‍🦰', 'm'], ['Ігор', '🕵️', 'm'], ['Роман', '🧑‍🎤', 'm'], ['Назар', '👱', 'm'], ['Степан', '🧓', 'm'],
  ['Олена', '👩', 'f'], ['Ірина', '👩‍🦰', 'f'], ['Соломія', '👱‍♀️', 'f'], ['Оксана', '👩‍🦱', 'f'], ['Марта', '👵', 'f'],
  ['Христина', '👩‍🎤', 'f'], ['Дарина', '👩‍💼', 'f'], ['Віра', '👩‍🔬', 'f'],
];

const PRACTICE_TABLE = { id: 'practice', icon: '🎓', name: 'Гра з тренером', sb: 10, bb: 20, buyin: 1000, cash: false };
const PRACTICE_BOTS = [['Олена', '👩', 'f', 'rock'], ['Тарас', '🧔', 'm', 'lag'], ['Марко', '👨', 'm', 'tag']];

const TABLES = [
  { id: 'micro', icon: '🏠', name: 'Кухонний стіл', desc: 'Дружня гра з новачками. Тут найлегше почати.', sb: 5, bb: 10, min: 200, max: 1000, lvl: 1, pool: ['station', 'station', 'maniac', 'lag', 'rock', 'tag'], foes: 'новачки, колл-станції' },
  { id: 'club', icon: '♣️', name: 'Клуб «Трефа»', desc: 'Аматори, які вже знають правила.', sb: 10, bb: 20, min: 400, max: 2000, lvl: 2, pool: ['station', 'rock', 'lag', 'tag', 'maniac'], foes: 'аматори різних стилів' },
  { id: 'river', icon: '🌊', name: 'Казино «Рівер»', desc: 'Серйозні гравці. Помилки коштують дорожче.', sb: 25, bb: 50, min: 1000, max: 5000, lvl: 4, pool: ['rock', 'tag', 'lag', 'tag', 'station'], foes: 'досвідчені гравці' },
  { id: 'high', icon: '🎩', name: 'Хайролер-зал', desc: 'Великі ставки й агресивні суперники.', sb: 100, bb: 200, min: 4000, max: 20000, lvl: 6, pool: ['tag', 'lag', 'tag', 'rock', 'maniac'], foes: 'сильні й агресивні' },
  { id: 'vip', icon: '👑', name: 'VIP «Роял»', desc: 'Еліта. Лише для найкращих.', sb: 250, bb: 500, min: 10000, max: 50000, lvl: 9, pool: ['tag', 'lag', 'tag', 'rock'], foes: 'професіонали' },
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
function makeBot([name, avatar, sex], arch, chips) {
  const a = ARCH[arch];
  return { name, avatar, sex, arch, style: a[sex], tight: a.tight, aggr: a.aggr, bluff: a.bluff, sticky: a.sticky, human: false, chips };
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
  return makeBot(pick(BOT_NAMES.filter(n => !used.has(n[0]))), pick(t.pool), botStack(t));
}

function initPlayers(buyin) {
  const t = G.table;
  G.players = [{ name: 'Ви', avatar: Prof.equip.avatar, human: true, chips: buyin }];
  if (t.cash) for (let k = 0; k < 3; k++) G.players.push(randomBot(t));
  else PRACTICE_BOTS.forEach(([n, av, sx, ar]) => G.players.push(makeBot([n, av, sx], ar, t.buyin)));
  G.players.forEach(seatify);
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
      <div class="seat-box" ${!p.human ? `title="${p.name}: ${p.style.toLowerCase()} гравець"` : ''}>
        <div class="seat-av">${p.avatar}</div>
        <div class="seat-info">
          <div class="seat-name">${p.name}<span class="badges"></span></div>
          <div class="seat-chips"><span class="coin"></span><span class="v">${p.chips}</span></div>
          ${!p.human ? `<div class="seat-style a-${p.arch}">${p.style}</div>` : ''}
        </div>
        <div class="seat-action"></div>
        <div class="seat-think"><i></i><i></i><i></i></div>
      </div>
      <div class="seat-bet"><span class="chipstack"><i></i><i></i><i></i></span><span class="v">0</span></div>`;
    wrap.appendChild(s);
    seatEls.push({
      root: s,
      av: s.querySelector('.seat-av'),
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
      else { await sleep(G.leaveAfter ? 60 : G.settings.speed); act = botDecide(p); }
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
  G.players.forEach((p, i) => {
    if (p.human) return;
    if (!t.cash) {
      if (p.chips <= 0) { p.chips = t.buyin; log(`🔄 ${p.name} докупає ${t.buyin} фішок.`, 'sys'); }
      return;
    }
    const broke = p.chips <= 0;
    if (broke || Math.random() < 0.04) {
      const nb = randomBot(t);
      log(broke ? `💸 ${p.name} програє все і йде з-за столу.` : `👋 ${p.name} забирає ${p.chips} і йде з-за столу.`, 'sys');
      log(`🪑 За стіл сідає <b>${nb.name}</b> — ${nb.style.toLowerCase()} гравець, фішок: ${nb.chips}.`, 'sys');
      G.players[i] = seatify(nb, i);
      changed = true;
    }
  });
  if (changed) buildTable();
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
  G.players.forEach(p => Object.assign(p, { hole: [], bet: 0, total: 0, folded: false, allIn: false, acted: false, lastAction: '', shown: false }));
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
function botDecide(p) {
  const toCall = G.currentBet - p.bet;
  const pot = potTotal();
  const nOpp = liveP().length - 1;
  const eqR = calcEquity(p.hole, G.board, nOpp, 300);
  const eq = eqR.equity;
  const strength = eq * (nOpp + 1); // 1.0 = середня рука
  const r = Math.random();
  const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;
  const maxTo = p.bet + p.chips;
  const raiseTo = mult => {
    let to;
    if (G.street === 'preflop') to = G.currentBet === BB ? BB * (3 + Math.floor(Math.random() * 2)) : G.currentBet * 3;
    else to = G.currentBet + Math.max(G.minRaise, Math.round((pot + toCall) * mult / SB) * SB);
    to = Math.max(to, G.currentBet + G.minRaise);
    return { type: 'raise', to: Math.min(to, maxTo) };
  };
  const strongT = 1.75 - p.aggr * 0.35;
  if (toCall === 0) {
    if (strength > strongT && r < 0.45 + p.aggr * 0.45) return raiseTo(0.5 + Math.random() * 0.3);
    if (strength > 1.2 && r < p.aggr * 0.4) return raiseTo(0.5);
    if (r < p.bluff * 0.5 && nOpp <= 2) return raiseTo(0.5);
    return { type: 'check' };
  }
  // є ставка
  const commit = toCall / (p.chips + p.bet);
  if (strength > strongT + 0.35 && r < 0.3 + p.aggr * 0.5 && p.chips > toCall) return raiseTo(0.75);
  // шалені гравці іноді підвищують з будь-чим
  if (p.bluff > 0.4 && r < p.bluff * 0.3 && commit < 0.15 && p.chips > toCall * 3) return raiseTo(0.6);
  if (commit > 0.35 && strength < 1.35 + p.tight * 0.3 - p.sticky * 0.6) return Math.random() < p.bluff * 0.3 + p.sticky * 0.4 ? { type: 'call' } : { type: 'fold' };
  if (G.street === 'preflop') {
    const callT = 0.8 + p.tight * 0.4 + Math.min(0.6, (toCall / BB) * 0.04) - p.sticky * 0.45;
    if (strength >= callT) return { type: 'call' };
    if (toCall <= BB / 2 && r < 0.5 + p.sticky * 0.4) return { type: 'call' }; // малий блайнд доплачує
    return { type: 'fold' };
  }
  const need = potOdds * (0.85 + p.tight * 0.5) * (1 - p.sticky * 0.45);
  if (eq >= need) return { type: 'call' };
  if (r < p.bluff * 0.25 && commit < 0.1 && p.chips > toCall) return raiseTo(0.6);
  return { type: 'fold' };
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
