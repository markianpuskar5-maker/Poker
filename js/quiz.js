// ===== Тренування: вікторини =====

function rint(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function noDup(cards) { return new Set(cards.map(c => c.id)).size === cards.length; }

// Згенерувати 5 карт заданої категорії, без карт із exclude
function makeHandOfCat(cat, exclude = []) {
  const ex = new Set(exclude.map(c => c.id));
  for (let t = 0; t < 3000; t++) {
    let h;
    switch (cat) {
      case 8: {
        const s = pick(SUITS), hi = rint(5, 14);
        h = [0, 1, 2, 3, 4].map(k => makeCard(hi - k === 1 ? 14 : hi - k, s));
        break;
      }
      case 7: {
        const q = rint(2, 14);
        h = SUITS.map(s => makeCard(q, s));
        let k; do { k = rint(2, 14); } while (k === q);
        h.push(makeCard(k, pick(SUITS)));
        break;
      }
      case 6: {
        const tr = rint(2, 14); let p; do { p = rint(2, 14); } while (p === tr);
        const s3 = shuffle(SUITS.slice()).slice(0, 3), s2 = shuffle(SUITS.slice()).slice(0, 2);
        h = s3.map(s => makeCard(tr, s)).concat(s2.map(s => makeCard(p, s)));
        break;
      }
      case 5: {
        const s = pick(SUITS);
        const ranks = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]).slice(0, 5);
        h = ranks.map(r => makeCard(r, s));
        break;
      }
      case 4: {
        const hi = rint(5, 14);
        h = [0, 1, 2, 3, 4].map(k => makeCard(hi - k === 1 ? 14 : hi - k, pick(SUITS)));
        break;
      }
      default:
        h = newDeck().slice(0, 5);
    }
    if (noDup(h) && !h.some(c => ex.has(c.id)) && evaluate(h).cat === cat) return h;
  }
  return null;
}

function sortForShow(cards) { return cards.slice().sort((a, b) => b.r - a.r); }
function randomCat() { return pick([0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8]); }

const Quiz = {
  mode: 'compare',
  score: 0, total: 0, streak: 0,
  answered: false,
  data: null,
};

const QUIZ_MODES = {
  compare: { title: 'Яка рука сильніша?', desc: 'Порівняй дві комбінації з 5 карт.' },
  name: { title: 'Назви комбінацію', desc: 'Визнач найкращу комбінацію з 7 карт (2 твої + 5 на столі).' },
  winner: { title: 'Хто виграє?', desc: 'Визнач переможця на вскритті.' },
  odds: { title: 'Колл чи фолд?', desc: 'Порахуй аути і шанси банку.' },
  preflop: { title: 'Грати чи скинути?', desc: 'Оціни стартову руку на префлопі.' },
};

function renderQuizTabs() {
  document.getElementById('quiz-tabs').innerHTML = Object.entries(QUIZ_MODES).map(([k, m]) =>
    `<button class="qtab ${Quiz.mode === k ? 'active' : ''}" onclick="setQuizMode('${k}')">${m.title}</button>`).join('');
}

function setQuizMode(m) {
  Quiz.mode = m; Quiz.score = 0; Quiz.total = 0; Quiz.streak = 0;
  renderQuizTabs();
  nextQuestion();
}

function quizScoreHTML() {
  const pct = Quiz.total ? Math.round(Quiz.score / Quiz.total * 100) : 0;
  return `<div class="qscore">Правильно: <b>${Quiz.score}</b> з ${Quiz.total} (${pct}%) &nbsp; 🔥 Серія: <b>${Quiz.streak}</b> &nbsp; 🪙 Сьогодні: <b>${quizEarnedToday()}</b>/${QUIZ_DAILY_CAP}</div>`;
}

function cardsRow(cards, cls = '') { return `<div class="cards-row ${cls}">${cards.map(c => cardHTML(c)).join('')}</div>`; }

function nextQuestion() {
  Quiz.answered = false;
  const gen = { compare: genCompare, name: genName, winner: genWinner, odds: genOdds, preflop: genPreflop }[Quiz.mode];
  Quiz.data = gen();
  renderQuestion();
}

function genCompare() {
  const c1 = randomCat();
  const c2 = Math.random() < 0.4 ? c1 : randomCat();
  const a = makeHandOfCat(c1);
  const b = makeHandOfCat(c2, a);
  const ea = evaluate(a), eb = evaluate(b);
  const ans = ea.score > eb.score ? 'a' : eb.score > ea.score ? 'b' : 'tie';
  return { a: sortForShow(a), b: sortForShow(b), ea, eb, ans };
}

function genName() {
  const five = makeHandOfCat(randomCat());
  const rest = newDeck().filter(c => !five.some(f => f.id === c.id));
  const seven = shuffle(five.concat(rest.slice(0, 2)));
  const hole = seven.slice(0, 2), board = seven.slice(2);
  const ev = evaluate(seven);
  return { hole, board, ev, ans: ev.cat, best: bestFive(seven) };
}

function genWinner() {
  for (let t = 0; t < 50; t++) {
    const d = newDeck();
    const h1 = d.slice(0, 2), h2 = d.slice(2, 4), board = d.slice(4, 9);
    const e1 = evaluate(h1.concat(board)), e2 = evaluate(h2.concat(board));
    if (Math.abs(e1.cat - e2.cat) > 2 && t < 40) continue;
    if (e1.cat === 0 && e2.cat === 0 && t < 40) continue;
    const ans = e1.score > e2.score ? '1' : e2.score > e1.score ? '2' : 'tie';
    return { h1, h2, board, e1, e2, ans, b1: bestFive(h1.concat(board)), b2: bestFive(h2.concat(board)) };
  }
}

const DRAWS = [
  { name: 'Флеш-дро (4 карти однієї масті)', outs: 9, hole: 'Ah 9h', board: 'Kh 6h 2c' },
  { name: 'Відкрите стріт-дро', outs: 8, hole: '8c 7d', board: '6s 5h Kd' },
  { name: 'Гатшот (внутрішнє стріт-дро)', outs: 4, hole: '9c 8d', board: '6s 5h Kd' },
  { name: 'Флеш-дро + відкрите стріт-дро', outs: 15, hole: '9s 8s', board: '7s 6d 2s' },
  { name: 'Дві оверкарти', outs: 6, hole: 'Ac Kd', board: '9s 6h 2c' },
  { name: 'Сет потрібен з кишенькової пари', outs: 2, hole: '5c 5d', board: 'Ks Qh 9c' },
];

function genOdds() {
  for (let t = 0; t < 100; t++) {
    const draw = pick(DRAWS);
    const street = Math.random() < 0.5 ? 'flop' : 'turn';
    const pot = pick([40, 60, 80, 100, 120, 150, 200, 300]);
    const bet = Math.round(pot * pick([0.25, 0.33, 0.5, 0.75, 1, 1.5]) / 5) * 5;
    // Рахуємо лише одну наступну карту (суперник ставитиме знову)
    const unseen = street === 'flop' ? 47 : 46;
    const eq = draw.outs / unseen;
    const need = bet / (pot + 2 * bet);
    if (Math.abs(eq - need) < 0.03) continue;
    let board = parseCards(draw.board);
    if (street === 'turn') {
      const used = new Set(parseCards(draw.hole).concat(board).map(c => c.id));
      const blanks = FULL_DECK.filter(c => !used.has(c.id) && c.r >= 2 && c.r <= 3 && c.s !== 'h' && c.s !== 's');
      board = board.concat([pick(blanks)]);
    }
    return { draw, street, pot, bet, eq, need, hole: parseCards(draw.hole), board, ans: eq > need ? 'call' : 'fold' };
  }
}

function genPreflop() {
  const d = newDeck();
  const hole = d.slice(0, 2);
  const info = startingHandInfo(hole);
  const pos = pick([
    { k: 'early', n: 'Рання позиція (ходиш першим)', max: 3 },
    { k: 'late', n: 'Пізня позиція (дилер, ходиш останнім)', max: 4 },
  ]);
  // Пороги: рання — класи 1-3, пізня — 1-4 (спекулятивні 5 — «дешево», рахуємо як фолд для простоти)
  const ans = info.tier <= pos.max ? 'play' : 'fold';
  return { hole, info, pos, ans };
}

function renderQuestion() {
  const q = Quiz.data;
  const m = QUIZ_MODES[Quiz.mode];
  let body = '', btns = '';
  switch (Quiz.mode) {
    case 'compare':
      body = `<div class="cmp"><div><h4>Рука А</h4>${cardsRow(q.a)}</div><div class="vs">VS</div><div><h4>Рука Б</h4>${cardsRow(q.b)}</div></div>`;
      btns = `<button class="btn ans" data-a="a">Рука А сильніша</button><button class="btn ans" data-a="tie">Однакові</button><button class="btn ans" data-a="b">Рука Б сильніша</button>`;
      break;
    case 'name':
      body = `<div class="nm"><div><h4>Твої карти</h4>${cardsRow(q.hole)}</div><div><h4>Стіл</h4>${cardsRow(q.board)}</div></div>`;
      btns = CAT_NAMES.map((n, i) => `<button class="btn ans" data-a="${i}">${n}</button>`).join('');
      break;
    case 'winner':
      body = `<div class="nm"><div><h4>Гравець 1</h4>${cardsRow(q.h1)}</div><div><h4>Стіл</h4>${cardsRow(q.board)}</div><div><h4>Гравець 2</h4>${cardsRow(q.h2)}</div></div>`;
      btns = `<button class="btn ans" data-a="1">Гравець 1</button><button class="btn ans" data-a="tie">Нічия</button><button class="btn ans" data-a="2">Гравець 2</button>`;
      break;
    case 'odds':
      body = `<div class="nm"><div><h4>Твої карти</h4>${cardsRow(q.hole)}</div><div><h4>Стіл (${q.street === 'flop' ? 'флоп' : 'терн'})</h4>${cardsRow(q.board)}</div></div>
        <p class="qinfo">У тебе <b>${q.draw.name.toLowerCase()}</b>. У банку було <b>${q.pot}</b>, суперник ставить <b>${q.bet}</b>. Тобі треба доплатити <b>${q.bet}</b>.<br>
        <small>Вважай, що в тебе одна карта попереду. Якщо збереш — виграєш, якщо ні — програєш.</small></p>`;
      btns = `<button class="btn ans" data-a="call">Колл</button><button class="btn ans" data-a="fold">Фолд</button>`;
      break;
    case 'preflop':
      body = `<div class="nm"><div><h4>Твої карти</h4>${cardsRow(q.hole)}</div></div>
        <p class="qinfo">Стіл на 6 гравців, до тебе всі скинули. <b>${q.pos.n}</b>.<br>Будеш входити в гру (рейзом) чи скинеш?</p>`;
      btns = `<button class="btn ans" data-a="play">Грати (рейз)</button><button class="btn ans" data-a="fold">Фолд</button>`;
      break;
  }
  document.getElementById('quiz-area').innerHTML = `
    ${quizScoreHTML()}
    <h2>${m.title}</h2><p class="muted">${m.desc}</p>
    <div class="qbody">${body}</div>
    <div class="qbtns">${btns}</div>
    <div id="qfeedback"></div>`;
  replay(document.getElementById('quiz-area'), 'fade-in');
  document.querySelectorAll('#quiz-area .ans').forEach(b => b.onclick = () => answerQuiz(b.dataset.a, b));
}

function answerQuiz(a, btn) {
  if (Quiz.answered) return;
  Quiz.answered = true;
  const q = Quiz.data;
  const ok = String(a) === String(q.ans);
  Quiz.total++;
  if (ok) { Quiz.score++; Quiz.streak++; } else Quiz.streak = 0;
  const earned = onQuiz(ok, Quiz.streak);
  const capped = ok && !earned;
  document.querySelectorAll('#quiz-area .ans').forEach(b => {
    if (b.dataset.a === String(q.ans)) b.classList.add('correct');
    else if (b === btn) b.classList.add('wrong');
    b.disabled = true;
  });
  let ex = '';
  switch (Quiz.mode) {
    case 'compare':
      ex = `Рука А: <b>${handName(q.ea)}</b>. Рука Б: <b>${handName(q.eb)}</b>.<br>` +
        (q.ea.cat !== q.eb.cat ? `${CAT_NAMES[Math.max(q.ea.cat, q.eb.cat)]} старша за ${CAT_NAMES[Math.min(q.ea.cat, q.eb.cat)].toLowerCase()}.`
          : q.ans === 'tie' ? 'Комбінації повністю однакові — нічия.' : 'Комбінації однакові, тому вирішують старші карти/кікери.');
      break;
    case 'name':
      ex = `Найкраща комбінація: <b>${handName(q.ev)}</b>.<br>Ці 5 карт: ${cardsRow(sortForShow(q.best), 'mini')}`;
      break;
    case 'winner':
      ex = `Гравець 1: <b>${handName(q.e1)}</b> ${cardsRow(sortForShow(q.b1), 'mini')}Гравець 2: <b>${handName(q.e2)}</b> ${cardsRow(sortForShow(q.b2), 'mini')}` +
        (q.ans === 'tie' ? 'Найкращі 5 карт однакові — банк ділиться.' : `Перемагає <b>гравець ${q.ans}</b>.`);
      break;
    case 'odds': {
      const eqp = Math.round(q.eq * 100), np = Math.round(q.need * 100);
      ex = `Аутів: <b>${q.draw.outs}</b>. Шанс зібрати на наступній карті ≈ ${q.draw.outs}×2 ≈ <b>${eqp}%</b>.<br>
        Банк після колу: ${q.pot} + ${q.bet} + ${q.bet} = ${q.pot + 2 * q.bet}. Потрібно: ${q.bet} ÷ ${q.pot + 2 * q.bet} ≈ <b>${np}%</b>.<br>
        ${q.eq > q.need ? `${eqp}% > ${np}% → <b>колл вигідний</b>.` : `${eqp}% < ${np}% → колл у довгостроковій перспективі збитковий, <b>фолд</b>.`}`;
      break;
    }
    case 'preflop':
      ex = `Рука <b>${q.info.code}</b> — клас «<b>${q.info.tierName}</b>». ` +
        (q.ans === 'play' ? `Її варто грати з цієї позиції.` :
          q.info.tier === 5 ? `Спекулятивна рука: можна зіграти дешево з пізньої позиції, але новачку краще скинути.` :
            q.pos.k === 'early' ? `З ранньої позиції грай лише сильні руки (класи «Преміум», «Дуже сильна», «Сильна»).` : `Навіть з пізньої позиції ця рука занадто слабка.`);
      break;
  }
  document.getElementById('qfeedback').innerHTML = `
    <div class="fb ${ok ? 'ok' : 'bad'}"><div class="fb-t">${ok ? '✅ Правильно!' : '❌ Неправильно'}${earned ? `<span class="earn">+${earned} 🪙</span>` : ''}${capped ? '<span class="muted fb-cap">денний ліміт монет вичерпано</span>' : ''}</div>${ex}</div>
    <button class="btn primary" id="qnext">Наступне питання →</button>`;
  document.getElementById('qnext').onclick = nextQuestion;
  document.querySelector('#quiz-area .qscore').outerHTML = quizScoreHTML();
  bump(document.querySelector('#quiz-area .qscore'), ok ? 'n-up' : 'n-down');
  if (ok && Quiz.streak > 0 && Quiz.streak % 5 === 0) winFx(60);
  const fbEl = document.querySelector('#qfeedback .fb');
  if (fbEl && fbEl.scrollIntoView) setTimeout(() => fbEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
}
