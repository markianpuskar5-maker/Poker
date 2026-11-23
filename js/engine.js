// ===== Покерний рушій: карти, колода, оцінка комбінацій, шанси =====

const SUITS = ['s', 'h', 'd', 'c'];
const SUIT_SYM = { s: '♠', h: '♥', d: '♦', c: '♣' };
const SUIT_NAME = { s: 'піки', h: 'черви', d: 'бубни', c: 'трефи' };
const RANK_STR = { 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
const RANK_ONE = { 2: 'двійка', 3: 'трійка', 4: 'четвірка', 5: "п'ятірка", 6: 'шістка', 7: 'сімка', 8: 'вісімка', 9: "дев'ятка", 10: 'десятка', 11: 'валет', 12: 'дама', 13: 'король', 14: 'туз' };
const RANK_MANY = { 2: 'двійок', 3: 'трійок', 4: 'четвірок', 5: "п'ятірок", 6: 'шісток', 7: 'сімок', 8: 'вісімок', 9: "дев'яток", 10: 'десяток', 11: 'вальтів', 12: 'дам', 13: 'королів', 14: 'тузів' };

const CAT_NAMES = ['Старша карта', 'Пара', 'Дві пари', 'Трійка (сет)', 'Стріт', 'Флеш', 'Фул-хаус', 'Каре', 'Стріт-флеш'];

function makeCard(r, s) {
  return { r, s, si: SUITS.indexOf(s), id: r * 4 + SUITS.indexOf(s) };
}

const FULL_DECK = [];
for (let r = 2; r <= 14; r++) for (const s of SUITS) FULL_DECK.push(makeCard(r, s));

// "As", "Td", "10h" -> карта
function parseCard(str) {
  const s = str.slice(-1).toLowerCase();
  let rs = str.slice(0, -1).toUpperCase();
  const map = { A: 14, K: 13, Q: 12, J: 11, T: 10 };
  const r = map[rs] || parseInt(rs, 10);
  return makeCard(r, s);
}
function parseCards(str) { return str.trim().split(/\s+/).filter(Boolean).map(parseCard); }

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function newDeck() { return shuffle(FULL_DECK.slice()); }

function cardText(c) { return RANK_STR[c.r] + SUIT_SYM[c.s]; }

// Знайти старшу карту стріту серед рангів (масив, будь-який порядок)
function straightHigh(ranks) {
  const has = new Array(15).fill(false);
  for (const r of ranks) has[r] = true;
  if (has[14]) has[1] = true;
  for (let h = 14; h >= 5; h--) {
    if (has[h] && has[h - 1] && has[h - 2] && has[h - 3] && has[h - 4]) return h;
  }
  return 0;
}

function mkResult(cat, tb) {
  let score = cat;
  for (let i = 0; i < 5; i++) score = score * 15 + (tb[i] || 0);
  return { cat, tb, score };
}

// Оцінка найкращої 5-карткової комбінації з 2..7 карт
function evaluate(cards) {
  const cnt = new Array(15).fill(0);
  const suitR = [[], [], [], []];
  for (const c of cards) { cnt[c.r]++; suitR[c.si].push(c.r); }
  let flushRanks = null;
  for (let s = 0; s < 4; s++) if (suitR[s].length >= 5) flushRanks = suitR[s].slice().sort((a, b) => b - a);
  if (flushRanks) {
    const h = straightHigh(flushRanks);
    if (h) return mkResult(8, [h]);
  }
  const quads = [], trips = [], pairs = [], uniq = [];
  for (let r = 14; r >= 2; r--) {
    if (cnt[r] > 0) uniq.push(r);
    if (cnt[r] === 4) quads.push(r);
    else if (cnt[r] === 3) trips.push(r);
    else if (cnt[r] === 2) pairs.push(r);
  }
  if (quads.length) {
    const q = quads[0];
    return mkResult(7, [q, uniq.find(r => r !== q) || 0]);
  }
  if (trips.length && (trips.length > 1 || pairs.length)) {
    const t = trips[0];
    const p = Math.max(trips[1] || 0, pairs[0] || 0);
    return mkResult(6, [t, p]);
  }
  if (flushRanks) return mkResult(5, flushRanks.slice(0, 5));
  const sh = straightHigh(uniq);
  if (sh) return mkResult(4, [sh]);
  if (trips.length) {
    const t = trips[0];
    return mkResult(3, [t, ...uniq.filter(r => r !== t).slice(0, 2)]);
  }
  if (pairs.length >= 2) {
    const [p1, p2] = pairs;
    return mkResult(2, [p1, p2, uniq.find(r => r !== p1 && r !== p2) || 0]);
  }
  if (pairs.length === 1) {
    const p = pairs[0];
    return mkResult(1, [p, ...uniq.filter(r => r !== p).slice(0, 3)]);
  }
  return mkResult(0, uniq.slice(0, 5));
}

// Людська назва комбінації
function handName(res) {
  const t = res.tb;
  switch (res.cat) {
    case 0: return `Старша карта — ${RANK_ONE[t[0]]}`;
    case 1: return `Пара ${RANK_MANY[t[0]]}`;
    case 2: return `Дві пари — ${RANK_MANY[t[0]]} і ${RANK_MANY[t[1]]}`;
    case 3: return `Трійка ${RANK_MANY[t[0]]}`;
    case 4: return t[0] === 5 ? 'Стріт від туза до п\'ятірки' : `Стріт до ${RANK_STR[t[0]]}`;
    case 5: return `Флеш, старша ${RANK_ONE[t[0]]}`;
    case 6: return `Фул-хаус: ${RANK_MANY[t[0]]} і ${RANK_MANY[t[1]]}`;
    case 7: return `Каре ${RANK_MANY[t[0]]}`;
    case 8: return t[0] === 14 ? 'Роял-флеш!' : `Стріт-флеш до ${RANK_STR[t[0]]}`;
  }
  return '';
}

// Найкращі 5 карт (для підсвічування)
function bestFive(cards) {
  if (cards.length <= 5) return cards.slice();
  let best = null, bestScore = -1;
  const n = cards.length;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++)
    for (let d = c + 1; d < n; d++) for (let e = d + 1; e < n; e++) {
      const h = [cards[a], cards[b], cards[c], cards[d], cards[e]];
      const sc = evaluate(h).score;
      if (sc > bestScore) { bestScore = sc; best = h; }
    }
  return best;
}

// Метод Монте-Карло: шанс виграти проти nOpp випадкових рук
function calcEquity(hole, board, nOpp, iters = 1000) {
  const used = new Set(hole.concat(board).map(c => c.id));
  const rest = FULL_DECK.filter(c => !used.has(c.id));
  const need = nOpp * 2 + (5 - board.length);
  let win = 0, tie = 0, share = 0;
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < need; i++) {
      const j = i + Math.floor(Math.random() * (rest.length - i));
      const tmp = rest[i]; rest[i] = rest[j]; rest[j] = tmp;
    }
    let k = 0;
    const fullBoard = board.slice();
    while (fullBoard.length < 5) fullBoard.push(rest[k++]);
    const my = evaluate(hole.concat(fullBoard)).score;
    let best = 0, eq = 0;
    for (let o = 0; o < nOpp; o++) {
      const sc = evaluate([rest[k++], rest[k++]].concat(fullBoard)).score;
      if (sc > best) { best = sc; eq = 1; } else if (sc === best) eq++;
    }
    if (my > best) win++;
    else if (my === best) { tie++; share += 1 / (eq + 1); }
  }
  return { win: win / iters, tie: tie / iters, equity: (win + share) / iters };
}

// Ауты: карти, що покращують руку гравця (а не лише стіл)
function countOuts(hole, board) {
  if (board.length < 3 || board.length > 4) return { outs: 0, cards: [] };
  const used = new Set(hole.concat(board).map(c => c.id));
  const cur = evaluate(hole.concat(board));
  const outs = [];
  for (const c of FULL_DECK) {
    if (used.has(c.id)) continue;
    const nb = board.concat([c]);
    const nr = evaluate(hole.concat(nb));
    if (nr.cat <= cur.cat) continue;
    if (nr.cat < 2 && cur.cat === 0) {
      // пара з картою на руці, яка старша за всі карти столу (оверкарта)
      const top = Math.max(...board.map(x => x.r));
      if (!(hole.some(h => h.r === c.r) && c.r > top)) continue;
    }
    const br = evaluate(nb);
    if (nr.cat <= br.cat) continue; // покращився лише стіл
    outs.push(c);
  }
  return { outs: outs.length, cards: outs };
}

// Опис стартової руки: нотація і "клас"
function startingHandInfo(hole) {
  const [a, b] = hole[0].r >= hole[1].r ? hole : [hole[1], hole[0]];
  const pair = a.r === b.r;
  const suited = a.s === b.s;
  const code = RANK_STR[a.r].replace('10', 'T') + RANK_STR[b.r].replace('10', 'T') + (pair ? '' : suited ? 's' : 'o');
  const tiers = [
    ['AA', 'KK', 'QQ', 'JJ', 'AKs'],
    ['TT', 'AQs', 'AJs', 'KQs', 'AKo'],
    ['99', '88', 'ATs', 'KJs', 'QJs', 'JTs', 'AQo'],
    ['77', '66', 'A9s', 'KTs', 'QTs', 'J9s', 'T9s', '98s', 'KQo', 'AJo'],
    ['55', '44', '33', '22', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'K9s', 'Q9s', 'T8s', '87s', '76s', '65s', 'ATo', 'KJo', 'QJo', 'JTo'],
  ];
  let tier = 6;
  for (let i = 0; i < tiers.length; i++) if (tiers[i].includes(code)) { tier = i + 1; break; }
  const tierNames = { 1: 'Преміум', 2: 'Дуже сильна', 3: 'Сильна', 4: 'Хороша', 5: 'Спекулятивна', 6: 'Слабка' };
  return { code, pair, suited, tier, tierName: tierNames[tier], gap: a.r - b.r };
}
