// ===== Тренер: підказки, оцінка кожного рішення, коментарі до гри =====

const COACH_MODES = {
  hint: 'Підказує перед ходом і оцінює',
  judge: 'Я вирішую сам — тренер оцінює',
  off: 'Вимкнено',
};

const GRADES = {
  great: { icon: '🌟', t: 'Відмінно!', cls: 'g-great', score: 'good' },
  good: { icon: '✅', t: 'Правильно', cls: 'g-good', score: 'good' },
  ok: { icon: '🤔', t: 'Прийнятно', cls: 'g-ok', score: 'ok' },
  mistake: { icon: '⚠️', t: 'Помилка', cls: 'g-bad', score: 'bad' },
  blunder: { icon: '❌', t: 'Серйозна помилка', cls: 'g-blunder', score: 'bad' },
  info: { icon: '👀', t: 'Тренер помічає', cls: 'g-info' },
};

const STREET_NAMES = { preflop: 'Префлоп', flop: 'Флоп', turn: 'Терн', river: 'Рівер', showdown: 'Вскриття' };

const Coach = {
  mode: localStorage.getItem('poker_coach_mode') || 'hint',
  feed: [],          // коментарі поточної роздачі
  spot: null,        // аналіз ситуації на момент вашого ходу
  watched: new Set(),
  showHint: false,   // у режимі «сам вирішую» — підказку відкрито вручну
  stats: coachStatsLoad(),
};
if (!COACH_MODES[Coach.mode]) Coach.mode = 'hint';

// Окремий режим тренера для тренувальної гри і для гри на монети
// (на монети тренер не підказує безкоштовно — лише оцінює, а підказка коштує 1 BB)
const coachModeKey = () => (G.table && G.table.cash) ? 'poker_coach_mode_cash' : 'poker_coach_mode';
function loadCoachMode() {
  const cash = !!(G.table && G.table.cash);
  let m = localStorage.getItem(coachModeKey()) || (cash ? 'judge' : 'hint');
  if (!COACH_MODES[m] || (cash && m === 'hint')) m = cash ? 'judge' : 'hint';
  Coach.mode = m;
  const sel = $('opt-coach');
  if (sel) sel.value = m;
}
function coachHintCost() { return (G.table && G.table.cash) ? BB : 0; }
function coachHintClick() {
  const cost = coachHintCost();
  if (cost && !spendCoins(cost)) { notify(`Для підказки потрібно ${fmt(cost)} 🪙.`, 'warn', '💡'); return; }
  Coach.showHint = true;
  renderCoach(G.players[0]);
}

const ARCH_NOTES = {
  rock: (n, ai) => `${n} ${ai ? 'йде ол-ін' : 'підвищує'}. Це обережний гравець — найчастіше в такого сильна рука. Без хорошої комбінації краще не продовжувати.`,
  tag: (n, ai) => `${n} ${ai ? 'йде ол-ін' : 'підвищує'}. Гравець збалансований — рахуйте шанси банку, щоб вирішити.`,
  lag: (n, ai) => `${n} ${ai ? 'йде ол-ін' : 'знову атакує'}. Агресивні гравці часто блефують, тому проти них можна коллювати трохи ширше.`,
  station: (n, ai) => `${n} ${ai ? 'йде ол-ін' : 'підвищує'}! Колл-станція підвищує дуже рідко — це майже завжди сильна рука. Обережно!`,
  maniac: (n, ai) => `${n} ${ai ? 'йде ол-ін' : 'знову ставить'}. Шалений гравець ставить майже з будь-чим: із сильною рукою дайте йому самому роздувати банк.`,
};

function coachStatsLoad() {
  const base = { n: 0, good: 0, ok: 0, bad: 0 };
  try { return Object.assign(base, JSON.parse(localStorage.getItem('poker_coach_stats') || '{}')); } catch { return base; }
}
function coachStatsSave() { localStorage.setItem('poker_coach_stats', JSON.stringify(Coach.stats)); }
function coachStatsReset() {
  Coach.stats = { n: 0, good: 0, ok: 0, bad: 0 };
  coachStatsSave();
  if (G.humanResolve) renderCoach(G.players[0]); else renderCoachIdle();
}

function pct(x) { return Math.round(x * 100) + '%'; }
const coachOn = () => Coach.mode !== 'off';

// ---------- Аналіз ситуації ----------
function analyzeSpot(me) {
  const toCall = G.currentBet - me.bet;
  const pot = potTotal();
  const nOpp = liveP().length - 1;
  const eq = calcEquity(me.hole, G.board, nOpp, 2000).equity;
  const need = toCall > 0 ? toCall / (pot + toCall) : 0;
  const o = (G.board.length === 3 || G.board.length === 4) ? countOuts(me.hole, G.board) : { outs: 0, cards: [] };
  return {
    street: G.street, toCall, pot, nOpp, eq, need,
    strength: eq * (nOpp + 1),
    outs: o.outs, outCards: o.cards,
    info: G.street === 'preflop' ? startingHandInfo(me.hole) : null,
    ev: G.board.length ? evaluate(me.hole.concat(G.board)) : null,
    rec: recommend(me, eq, need, toCall, nOpp),
    currentBet: G.currentBet, raised: G.currentBet > BB,
    chips: me.chips, bet: me.bet,
    isLate: G.dealer === 0, isSB: nextIdx(G.dealer) === 0, isBB: nextIdx(nextIdx(G.dealer)) === 0,
  };
}

// ---------- Рекомендація (що зробив би тренер) ----------
function recommend(me, eq, need, toCall, nOpp) {
  const strength = eq * (nOpp + 1);
  const pot = potTotal();
  if (G.street === 'preflop') {
    const info = startingHandInfo(me.hole);
    const isLate = G.dealer === 0;
    const isBB = nextIdx(nextIdx(G.dealer)) === 0;
    const isSB = nextIdx(G.dealer) === 0;
    const raised = G.currentBet > BB;
    if (info.tier <= 2) {
      return { act: raised ? 'РЕЙЗ (ре-рейз)' : 'РЕЙЗ', cls: 'raise', why: `${info.code} — ${info.tierName.toLowerCase()} рука. З такими картами треба підвищувати, щоб збільшити банк і відсіяти слабкі руки суперників.${raised ? ' Навіть після чужого рейзу варто підвищити ще (приблизно в 3 рази).' : ` Стандартний рейз — 3 великі блайнди (${BB * 3}).`}` };
    }
    if (info.tier === 3) {
      if (raised && G.currentBet > BB * 4) return { act: 'КОЛЛ або ФОЛД', cls: 'call', why: `${info.code} — сильна, але не найкраща рука. Проти великого рейзу можна сколлювати, якщо ставка не надто велика (порівняй шанс ${pct(eq)} з потрібними ${pct(need)}).` };
      return { act: raised ? 'КОЛЛ' : 'РЕЙЗ', cls: raised ? 'call' : 'raise', why: `${info.code} — сильна рука. ${raised ? 'Хтось уже підвищив, тож колл — обережний і розумний варіант.' : 'Ніхто не підвищував — заходь рейзом.'}` };
    }
    if (info.tier <= 5) {
      if (toCall === 0) return { act: 'ЧЕК', cls: 'check', why: `Ви на великому блайнді і ніхто не підвищив — подивіться флоп безкоштовно.` };
      if (!raised && (isLate || isSB || isBB) && info.tier === 4) return { act: isLate ? 'РЕЙЗ' : 'КОЛЛ', cls: isLate ? 'raise' : 'call', why: `${info.code} — ${info.tierName.toLowerCase()} рука. ${isLate ? 'На баттоні (пізня позиція) нею варто атакувати блайнди рейзом.' : 'Доплатити трохи з блайнда — нормально.'}` };
      if (!raised && (isLate || isSB) && info.tier === 5) return { act: 'КОЛЛ або ФОЛД', cls: 'call', why: `${info.code} — спекулятивна рука. Можна дешево подивитися флоп з пізньої позиції, але якщо сумніваєтесь — скидайте.` };
      if (raised && need < 0.2 && info.pair) return { act: 'КОЛЛ', cls: 'call', why: `Мала пара: колл дешевий, і з ймовірністю ≈12% на флопі ви зберете сет (трійку), який часто виграє великий банк.` };
      return { act: 'ФОЛД', cls: 'fold', why: `${info.code} — ${info.tierName.toLowerCase()} рука, ${raised ? 'а суперник уже підвищив' : 'а позиція рання'}. Не варто вкладати фішки, чекайте кращого моменту.` };
    }
    if (toCall === 0) return { act: 'ЧЕК', cls: 'check', why: 'Слабка рука, але подивитися флоп можна безкоштовно.' };
    return { act: 'ФОЛД', cls: 'fold', why: `${info.code} — слабка стартова рука. Новачки програють найбільше саме тому, що грають такі руки. Скидайте без жалю!` };
  }
  const ev = evaluate(me.hole.concat(G.board));
  const outs = (G.board.length < 5) ? countOuts(me.hole, G.board).outs : 0;
  const drawNote = outs >= 8 ? ` У вас сильне дро (${outs} аутів).` : '';
  if (toCall === 0) {
    if (strength >= 1.6 || eq > 0.6) return { act: 'БЕТ (½–¾ банку)', cls: 'raise', why: `Ваша рука (${handName(ev).toLowerCase()}) ймовірно найкраща (шанс ${pct(eq)}). Ставте, щоб суперники з гіршими руками платили вам. Розмір: ${Math.round(pot / 2)}–${Math.round(pot * 0.75)}.` };
    if (outs >= 8 && nOpp <= 2) return { act: 'БЕТ або ЧЕК', cls: 'raise', why: `У вас дро з ${outs} аутами. Ставка-напівблеф: суперник може скинути, а якщо ні — у вас ще є шанс зібрати руку.` };
    if (strength >= 1.0) return { act: 'ЧЕК або невеликий бет', cls: 'check', why: `Рука середня (шанс ${pct(eq)}). Чек дозволяє дешево побачити наступну карту і не роздувати банк.` };
    return { act: 'ЧЕК', cls: 'check', why: `Рука слабка (шанс ${pct(eq)}). Чек нічого не коштує — подивимося, що буде далі.${drawNote}` };
  }
  if (strength >= 1.9 && eq > 0.55) return { act: 'РЕЙЗ', cls: 'raise', why: `Сильна рука: ${handName(ev).toLowerCase()} (шанс ${pct(eq)}). Підвищуйте, щоб виграти більший банк!` };
  if (eq >= need * 1.1) return { act: 'КОЛЛ', cls: 'call', why: `Шанс виграти ${pct(eq)} більший за потрібні ${pct(need)} — колл вигідний у довгостроковій перспективі.${drawNote}` };
  if (eq >= need * 0.9) return { act: 'КОЛЛ або ФОЛД (на межі)', cls: 'call', why: `Шанс ${pct(eq)} майже дорівнює потрібним ${pct(need)} — рішення на межі. Подумайте, чи суперник часто блефує (агресивні й шалені гравці роблять це частіше).` };
  return { act: 'ФОЛД', cls: 'fold', why: `Шанс ${pct(eq)} менший за потрібні ${pct(need)}. Платити ${toCall} тут невигідно — у довгій перспективі ви будете втрачати.${drawNote}` };
}

// ---------- Оцінка рішення гравця ----------
function gradeDecision(s, act) {
  const allIn = act.type === 'raise' ? act.to >= s.bet + s.chips : (act.type === 'call' && s.toCall >= s.chips);
  if (s.street === 'preflop') return gradePreflop(s, act, allIn);
  return gradePostflop(s, act, allIn);
}

function gradePreflop(s, act, allIn) {
  const i = s.info, code = i.code, tn = i.tierName.toLowerCase();
  const rc = s.rec.cls;
  if (act.type === 'fold') {
    if (i.tier <= 2) return { g: 'blunder', text: `${code} — ${tn} рука! Такі карти приходять рідко, їх треба розігрувати рейзом, а не скидати.` };
    if (i.tier === 3 && !(s.raised && s.currentBet > BB * 4)) return { g: 'mistake', text: `${code} — сильна рука. Скидати її надто обережно — тут краще ${s.raised ? 'колл' : 'рейз'}.` };
    if (rc === 'fold') return { g: 'good', text: `Правильно скинули ${code}. ${s.raised ? 'Проти рейзу' : 'З цієї позиції'} така рука в довгостроковій перспективі програє. Дисципліна економить фішки!` };
    return { g: 'ok', text: `Скинути ${code} можна, але тут краще було «${s.rec.act.toLowerCase()}». ${s.rec.why}` };
  }
  if (act.type === 'check') {
    if (i.tier <= 3) return { g: 'ok', text: `Чек з ${code} — не помилка, але з сильною рукою на великому блайнді краще підвищити, щоб збільшити банк.` };
    return { g: 'good', text: `Безкоштовно дивимось флоп з ${code} — правильно, платити нічого не треба.` };
  }
  if (act.type === 'call') {
    if (i.tier <= 2 && !allIn) return { g: 'ok', text: `Колл з ${code} — не помилка, але ${tn} рука заслуговує на рейз: так ви виграєте більше і відсієте слабкі руки.` };
    if (rc === 'call') return { g: 'good', text: `Колл з ${code} — розумне рішення. ${s.rec.why}` };
    if (rc === 'raise') return { g: 'ok', text: `Колл прийнятний, але з ${code} ${s.isLate ? 'на баттоні ' : ''}краще було підвищити — агресія виграє більше.` };
    if (rc === 'check') return { g: 'good', text: `Нормально.` };
    if (s.isSB && s.toCall <= BB / 2 && i.tier <= 5) return { g: 'ok', text: `Доплатити пів блайнда з ${code} — допустимо, але рука слабка: без сильної комбінації на флопі більше не вкладайте.` };
    return { g: s.toCall > BB * 3 ? 'blunder' : 'mistake', text: `${code} — ${tn} рука. Коллювати ${s.toCall} з нею — типова помилка новачків: такі руки рідко виграють великий банк. Краще фолд.` };
  }
  // рейз
  const raiseBB = act.to / BB;
  if (i.tier <= 3 || rc === 'raise') {
    let note = '';
    if (!allIn && !s.raised && raiseBB < 2.5) note = ` Але розмір замалий — стандарт 3 BB (${BB * 3}).`;
    else if (!allIn && !s.raised && raiseBB > 6) note = ' Але розмір завеликий — достатньо 3 BB, інакше слабші руки просто скинуть і ви виграєте мало.';
    else if (allIn && i.tier > 1) note = ' Хоча ол-ін на префлопі — занадто ризиковано: ви ставите все, коли можна виграти й меншою ставкою.';
    const g = note ? (allIn && i.tier > 1 ? 'ok' : 'good') : (i.tier <= 2 ? 'great' : 'good');
    return { g, text: `Рейз з ${code} — саме так! ${i.tier <= 2 ? 'З преміум рукою' : 'Із сильною рукою'} треба грати агресивно.${note}` };
  }
  if (i.tier <= 5 && !allIn) return { g: 'ok', text: `Рейз з ${code} — агресивно. Іноді це спрацьовує, але з такою рукою ${s.raised ? 'проти рейзу краще скинути' : 'краще грати обережніше'}.` };
  return { g: allIn ? 'blunder' : 'mistake', text: `${allIn ? 'Ол-ін' : 'Рейз'} з ${code} — ризиковано: це ${tn} рука, і якщо вас зрівняють, ви часто будете позаду.` };
}

function gradePostflop(s, act, allIn) {
  const hn = handName(s.ev).toLowerCase(), eqP = pct(s.eq), needP = pct(s.need);
  const strong = s.strength >= 1.6 || s.eq > 0.6;
  if (act.type === 'fold') {
    if (s.eq >= s.need * 1.1) return { g: (s.eq > 0.6 || s.eq >= s.need * 2) ? 'blunder' : 'mistake', text: `Ви скинули, хоча шанс виграти ${eqP} більший за потрібні ${needP}. Колл тут був вигідний${s.outs >= 8 ? ` — у вас ${s.outs} аутів` : ''}.` };
    if (s.eq >= s.need * 0.9) return { g: 'ok', text: `Рішення на межі: шанс ${eqP} ≈ потрібним ${needP}. Фолд — нормальний обережний вибір.` };
    return { g: 'good', text: `Правильний фолд: шанс ${eqP} менший за потрібні ${needP}. Ви зберегли фішки.` };
  }
  if (act.type === 'check') {
    if (strong) return { g: 'ok', text: `Чек із сильною рукою (${hn}, шанс ${eqP}) — ви упускаєте цінність. Ставка ½–¾ банку змусила б гірші руки платити вам.` };
    if (s.outs >= 8) return { g: 'good', text: `Чек із дро (${s.outs} аутів) — безкоштовно бачимо наступну карту. Добре.` };
    return { g: 'good', text: `Чек — розумно: рука ${s.strength >= 1 ? 'середня' : 'слабка'} (шанс ${eqP}), не варто роздувати банк.` };
  }
  if (act.type === 'call') {
    if (s.strength >= 1.9 && s.eq > 0.55 && !allIn) return { g: 'ok', text: `Колл із дуже сильною рукою (${hn}) — непогано, але рейз виграв би більше.` };
    if (s.eq >= s.need * 1.1) return { g: 'good', text: `Вигідний колл: шанс ${eqP} > потрібних ${needP}.${s.outs >= 8 ? ` Ваші ${s.outs} аутів роблять колл прибутковим.` : ''}` };
    if (s.eq >= s.need * 0.9) return { g: 'ok', text: `Колл на межі: шанс ${eqP} ≈ потрібним ${needP}. Можна і так, і так.` };
    return { g: s.eq < s.need * 0.6 ? 'blunder' : 'mistake', text: `Колл невигідний: шанс ${eqP}, а потрібно ${needP}. Платити ${s.toCall} тут — втрата в довгостроковій перспективі. Краще фолд.` };
  }
  // бет / рейз
  const word = s.toCall ? 'Рейз' : 'Бет';
  const add = act.to - s.currentBet;
  const ratio = add / Math.max(1, s.pot + s.toCall);
  let note = '';
  if (!allIn && ratio < 0.3) note = ' Але ставка замала — суперники дешево бачать наступну карту. Краще ½–¾ банку.';
  else if (!allIn && ratio > 1.5) note = ' Але ставка дуже велика — слабші руки просто скинуть. Зазвичай достатньо ½–¾ банку.';
  if (strong) return { g: note ? 'good' : 'great', text: `${word} із сильною рукою (${hn}, шанс ${eqP}) — чудово, ви берете цінність!${note}` };
  if (s.outs >= 8) return { g: 'good', text: `Напівблеф із дро (${s.outs} аутів): суперник може скинути, а якщо ні — у вас ще є шанс зібрати руку.${note}` };
  if (!s.toCall && s.strength >= 1.0) return { g: 'ok', text: `Бет із середньою рукою (шанс ${eqP}) — допустимо, але чек теж був хорошим варіантом.${note}` };
  if (!s.toCall && s.nOpp === 1 && !allIn) return { g: 'ok', text: `Блеф проти одного суперника іноді спрацьовує. Але робіть це рідко — з шансом ${eqP} вас часто зрівняють.` };
  return { g: allIn ? 'blunder' : 'mistake', text: `${allIn ? 'Ол-ін' : word} зі слабкою рукою (шанс ${eqP}) — ризиковано${s.nOpp > 1 ? ' проти кількох суперників' : ''}. Блефувати варто рідко і проти одного гравця.` };
}

// ---------- Події гри (викликає game.js) ----------
function coachHandStart() {
  Coach.feed = [];
  Coach.spot = null;
  Coach.watched = new Set();
  Coach.showHint = false;
  hideCoachToast();
}

function coachBeforeHuman(p) {
  Coach.spot = coachOn() ? analyzeSpot(p) : null;
  Coach.showHint = false;
}

function coachAfterHuman(p, act) {
  const s = Coach.spot;
  Coach.spot = null;
  if (!coachOn() || !s) return;
  const r = gradeDecision(s, act);
  const item = { g: r.g, text: r.text, action: p.lastAction, street: s.street, rec: s.rec.act };
  Coach.feed.push(item);
  const sc = GRADES[r.g].score;
  Coach.stats.n++;
  Coach.stats[sc]++;
  coachStatsSave();
  if (G.session) { G.session.dec++; if (sc === 'good') G.session.good++; }
  onDecision(r.g);
  showCoachToast(item);
  flashSeat(GRADES[r.g].score);
}

// Тренер стежить за суперниками
function coachWatchBot(p, act) {
  const me = G.players[0];
  if (!coachOn() || me.folded || act.type !== 'raise') return;
  const key = G.street + p.seat;
  if (Coach.watched.has(key)) return;
  Coach.watched.add(key);
  const big = p.bet >= potTotal() * 0.6 || p.allIn;
  const note = ARCH_NOTES[p.arch];
  const text = (note ? note(p.name, p.allIn) : `${p.name} підвищує.`) + (big ? ' Ставка велика — це сильний сигнал.' : '');
  Coach.feed.push({ g: 'info', text, street: G.street });
  renderCoachIdle();
}

// Тренер коментує нову вулицю
function coachStreetNote() {
  const me = G.players[0];
  if (!coachOn() || me.folded || G.board.length < 3) return;
  const notes = [];
  const ev = evaluate(me.hole.concat(G.board));
  const prev = G.board.length > 3 ? evaluate(me.hole.concat(G.board.slice(0, -1))) : null;
  const boardEv = evaluate(G.board);
  if (ev.cat >= 2 && ev.cat > boardEv.cat && (!prev || ev.cat > prev.cat)) notes.push(`💪 Ви зібрали: <b>${handName(ev).toLowerCase()}</b>! Тепер важливо отримати за це фішки.`);
  const suits = {};
  G.board.forEach(c => suits[c.s] = (suits[c.s] || 0) + 1);
  const maxSuit = Math.max(...Object.values(suits));
  if (maxSuit >= 3 && ev.cat !== 5 && ev.cat < 6) notes.push(maxSuit >= 4 ? 'На столі 4 карти однієї масті — флеш дуже ймовірний, будьте обережні.' : 'На столі 3 карти однієї масті — у когось може бути флеш.');
  const ranks = [...new Set(G.board.map(c => c.r))];
  if (ranks.length < G.board.length && ev.cat < 6) notes.push('На столі пара — можливі трійки й фул-хаус.');
  const has = new Set(ranks); if (has.has(14)) has.add(1);
  let st = false;
  for (let lo = 1; lo <= 10 && !st; lo++) { let n = 0; for (let k = 0; k < 5; k++) if (has.has(lo + k)) n++; if (n >= 3) st = true; }
  if (st && ev.cat < 4) notes.push('Карти столу йдуть близько — хтось може мати стріт.');
  if (!notes.length) return;
  Coach.feed.push({ g: 'info', text: notes.join(' '), street: G.street });
  renderCoachIdle();
}

// ---------- Тост на столі ----------
let coachToastTimer;
function showCoachToast(item) {
  const el = $('coach-toast');
  if (!el) return;
  const gr = GRADES[item.g];
  el.className = 'coach-toast ' + gr.cls;
  el.innerHTML = `<div class="ct-av">🎓</div><div class="ct-body"><div class="ct-t">${gr.icon} ${gr.t}<span class="ct-act">${item.action || ''}</span></div><div class="ct-s">${item.text}</div></div>`;
  replay(el, 'show');
  clearTimeout(coachToastTimer);
  coachToastTimer = setTimeout(hideCoachToast, gr.score === 'bad' ? 9000 : 6000);
}
function hideCoachToast() {
  const el = $('coach-toast');
  if (el) el.classList.remove('show');
}
function flashSeat(score) {
  const box = seatEls[0] && seatEls[0].box;
  if (!box) return;
  replay(box, score === 'good' ? 'coach-ok' : score === 'bad' ? 'coach-bad' : 'coach-meh');
}

// ---------- Панель тренера ----------
function coachStatsHTML() {
  const s = Coach.stats;
  if (!s.n) return `<div class="coach-stats"><span class="muted">Тренер оцінюватиме кожне ваше рішення.</span></div>`;
  const acc = Math.round(s.good / s.n * 100);
  return `<div class="coach-stats">
    <div class="cs-row"><span>Якість рішень</span><b class="${acc >= 70 ? 'pos' : acc < 50 ? 'neg' : ''}">${acc}%</b></div>
    <div class="cs-bar"><i class="b-good" style="width:${s.good / s.n * 100}%"></i><i class="b-ok" style="width:${s.ok / s.n * 100}%"></i><i class="b-bad" style="width:${s.bad / s.n * 100}%"></i></div>
    <div class="cs-legend"><span>✅ ${s.good}</span><span>🤔 ${s.ok}</span><span>⚠️ ${s.bad}</span><button class="link" onclick="coachStatsReset()">скинути</button></div>
  </div>`;
}

function coachFeedHTML(title = 'Коментарі до роздачі') {
  if (!Coach.feed.length) return '';
  const items = Coach.feed.slice().reverse().map(f => {
    const gr = GRADES[f.g];
    return `<div class="cf-item ${gr.cls}">
      <div class="cf-head">${gr.icon} <b>${f.g === 'info' ? 'Тренер помічає' : gr.t}</b><span class="cf-st">${STREET_NAMES[f.street] || ''}${f.action ? ' · ' + f.action : ''}</span></div>
      <div class="cf-text">${f.text}</div>
      ${f.g !== 'info' && GRADES[f.g].score !== 'good' && f.rec ? `<div class="cf-rec">Тренер радив: <b>${f.rec.toLowerCase()}</b></div>` : ''}
    </div>`;
  }).join('');
  return `<div class="coach-feed"><div class="cf-title">${title}</div>${items}</div>`;
}

function setCoach(h) {
  const el = $('coach');
  el.innerHTML = h;
  replay(el, 'fade-in');
}

function handSummary(me) {
  let h = '';
  if (G.street === 'preflop') {
    const info = startingHandInfo(me.hole);
    h += `<div class="c-row"><span>Ваша рука:</span><b>${info.code}</b></div>
      <div class="c-row"><span>Клас руки:</span><b class="tier t${info.tier}">${info.tierName}</b></div>`;
  } else {
    const ev = evaluate(me.hole.concat(G.board));
    h += `<div class="c-row"><span>Комбінація:</span><b>${handName(ev)}</b></div>`;
  }
  h += `<div class="c-pos">📍 ${positionName(0)}</div>`;
  return h;
}

function renderCoachIdle() {
  if (Coach.mode === 'off') { setCoach('<p class="muted">Тренер вимкнений. Увімкніть його в налаштуваннях нижче.</p>'); return; }
  const me = G.players[0];
  if (!me || !me.hole.length) { setCoach(coachStatsHTML() + '<p class="muted">Роздача ось-ось почнеться — я дивитимусь за кожним твоїм ходом.</p>'); return; }
  let h = coachStatsHTML();
  if (me.folded) h += `<p class="muted">Ви скинули карти. Спостерігайте за суперниками — це теж навчання!</p>`;
  else h += `<div class="coach-now">${Coach.mode === 'hint' ? handSummary(me) : ''}<p class="muted">👀 Стежу за грою… очікуємо на хід суперників.</p></div>`;
  h += coachFeedHTML();
  setCoach(renderCardMarkup(h));
}

function renderCoach(me) {
  if (Coach.mode === 'off') { setCoach('<p class="muted">Тренер вимкнений.</p>'); return; }
  const s = Coach.spot || analyzeSpot(me);
  let h = coachStatsHTML();
  if (Coach.mode === 'judge' && !Coach.showHint) {
    h += `<div class="coach-now judge"><div class="rec-t">🤔 Ваш хід — вирішіть самі</div>
      ${G.street === 'preflop' ? `<div class="c-row"><span>Ваша рука:</span><b>${s.info.code}</b></div>` : `<div class="c-row"><span>Комбінація:</span><b>${handName(s.ev)}</b></div>`}
      <div class="c-pos">📍 ${positionName(0)}</div>
      <div class="c-row"><span>Банк:</span><b>${s.pot}</b></div>
      ${s.toCall ? `<div class="c-row"><span>Треба доплатити:</span><b>${s.toCall}</b></div>` : '<div class="c-row"><span>Ставки немає</span><b>можна чек</b></div>'}
      <small class="muted">Подумайте: наскільки сильна рука? Чи вигідні шанси банку? Після ходу я скажу, чи правильно.</small>
      <button class="btn small" onclick="coachHintClick()">💡 Підказати${coachHintCost() ? ` (${fmt(coachHintCost())} 🪙)` : ''}</button></div>`;
    h += coachFeedHTML();
    setCoach(h);
    return;
  }
  const avg = 1 / (s.nOpp + 1);
  h += `<div class="coach-now">` + handSummary(me);
  h += `<div class="c-row"><span>Шанс виграти:</span><b>${pct(s.eq)}</b></div>
    <div class="eqbar"><div style="width:${Math.round(s.eq * 100)}%"></div><i style="left:${Math.round(avg * 100)}%" title="середній шанс"></i></div>
    <small class="muted">Проти ${s.nOpp} суперник${s.nOpp === 1 ? 'а' : 'ів'} з випадковими картами. Середній шанс — ${pct(avg)} (риска).</small>`;
  if (s.toCall > 0) {
    h += `<div class="c-row"><span>Треба доплатити:</span><b>${s.toCall}</b></div>
      <div class="c-row"><span>Шанси банку:</span><b>потрібно ≥ ${pct(s.need)}</b></div>
      <small class="muted">${s.toCall} ÷ (${s.pot} + ${s.toCall}) = ${pct(s.need)}</small>`;
  }
  if (s.outs > 0) {
    const mult = G.board.length === 3 ? 4 : 2;
    h += `<div class="c-row"><span>Аути:</span><b>${s.outs}</b></div>
     <small class="muted">Карти, що покращать вашу руку: ${s.outCards.map(cardText).join(' ')}<br>
     Правило ${mult}: ${s.outs} × ${mult} ≈ ${Math.min(100, s.outs * mult)}% покращити руку ${mult === 4 ? 'до рівера' : 'на рівері'}.</small>`;
  }
  h += `<div class="rec rec-${s.rec.cls}"><div class="rec-t">Порада: ${s.rec.act}</div><div>${s.rec.why}</div></div></div>`;
  h += coachFeedHTML();
  setCoach(h);
}

function renderCoachReview(diff) {
  if (Coach.mode === 'off') { setCoach(`<div class="c-row"><span>Результат роздачі:</span><b class="${diff > 0 ? 'pos' : diff < 0 ? 'neg' : ''}">${diff > 0 ? '+' : ''}${diff}</b></div>`); return; }
  const me = G.players[0];
  const graded = Coach.feed.filter(f => f.g !== 'info');
  const good = graded.filter(f => GRADES[f.g].score === 'good').length;
  const bad = graded.filter(f => GRADES[f.g].score === 'bad').length;
  let h = coachStatsHTML();
  h += `<div class="review"><div class="c-row"><span>Результат роздачі:</span><b class="${diff > 0 ? 'pos' : diff < 0 ? 'neg' : ''}">${diff > 0 ? '+' : ''}${diff}</b></div>`;
  let verdict;
  if (!graded.length) verdict = 'У цій роздачі вам не довелося приймати рішень.';
  else if (!bad && diff < 0) verdict = `Ви програли, але <b>грали правильно</b> (${good} з ${graded.length} рішень — добрі). Це просто невезіння — у довгій грі такі рішення приносять прибуток.`;
  else if (!bad) verdict = `Чудова роздача: <b>${good} з ${graded.length}</b> рішень — правильні! 👏`;
  else if (diff > 0) verdict = `Ви виграли, але були помилки (${bad}). Цього разу пощастило — не покладайтесь на це.`;
  else verdict = `Помилок у роздачі: <b>${bad}</b>. Перегляньте коментарі нижче — саме на таких моментах і вчаться.`;
  h += `<div class="verdict ${bad ? 'v-bad' : 'v-good'}">${verdict}</div>`;
  const live = liveP();
  if (live.length > 1) {
    h += '<p><b>Розбір вскриття:</b></p><ul>';
    live.forEach(p => h += `<li>${p.name}: ${handName(evaluate(p.hole.concat(G.board)))}</li>`);
    h += '</ul><p class="muted">Підсвічені карти — 5 карт виграшної комбінації.</p>';
  }
  if (me.folded && G.board.length === 5) {
    const myEv = evaluate(me.hole.concat(G.board));
    const winners = G.lastWinners.map(i => G.players[i]).filter(p => p.shown);
    const wouldWin = winners.length && winners.every(w => myEv.score > evaluate(w.hole.concat(G.board)).score);
    h += `<p class="muted">Якби ви не скинули, у вас було б: ${handName(myEv).toLowerCase()}${wouldWin ? ' — і ви б виграли. Але рішення оцінюють за шансами на момент ходу, а не за картами, що вийшли потім.' : '.'}</p>`;
  }
  h += '</div>';
  h += coachFeedHTML('Ваші рішення в роздачі');
  const tips = [
    'Грайте менше рук, але агресивніше — це головний принцип сильних гравців.',
    'Позиція — ключ. На баттоні можна грати більше рук.',
    'Не женіться за дро, якщо шанси банку не дозволяють.',
    'Обережні гравці ставлять переважно із сильними руками — поважайте їхні рейзи.',
    'Агресивні гравці часто блефують — проти них можна коллювати частіше.',
    'Проти колл-станції не блефуйте — вона зрівняє. Зате ставте більше із сильною рукою.',
    'Встати з-за столу в плюсі — теж уміння. Не намагайтеся відігратися на емоціях.',
    'Флеш сильніший за стріт, фул-хаус — за флеш.',
    'Стіл з трьома картами однієї масті — хтось може мати флеш.',
    'Розмір ставки ½–¾ банку — універсальний вибір.',
  ];
  h += `<div class="tip">💡 ${pick(tips)}</div>`;
  setCoach(h);
}

function setCoachMode(m) {
  if (G.table && G.table.cash && m === 'hint') m = 'judge';
  Coach.mode = m;
  localStorage.setItem(coachModeKey(), m);
  const sel = $('opt-coach');
  if (sel && sel.value !== m) sel.value = m;
  if (!G.players.length) { renderCoachIdle(); return; }
  if (G.humanResolve) {
    if (coachOn() && !Coach.spot) Coach.spot = analyzeSpot(G.players[0]);
    renderCoach(G.players[0]);
  } else renderCoachIdle();
}
