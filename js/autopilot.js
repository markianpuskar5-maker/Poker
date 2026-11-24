// ===== Автогра: «Claude» грає за вас і коротко пояснює кожен хід =====
// Логіка думає так, як живий гравець: сила стартової руки, позиція, ціна доплати,
// і головне — проти ЯКИХ рук суперника ми граємо, судячи з його ставок.

const Auto = {
  on: false,
  paused: false,
  speed: Number(localStorage.getItem('poker_auto_speed')) || 2200, // скільки «думає» перед ходом
  timer: 0, nextTimer: 0, turnId: 0,
  wasAuto: false,     // останній хід за вас зробила автогра (тоді тренер його не оцінює)
  hand: -1,           // для якої роздачі вже показано заголовок
  played: false,      // автогра брала участь у поточній роздачі
  lastEq: null,       // шанс на момент останнього рішення
  trackHand: -1,
  stats: { hands: 0, profit: 0 },
  min: false,
};

const autoAllowed = () => !!(G.table && !G.table.cash && !G.table.tourney);
const autoActive = () => Auto.on && !Auto.paused && autoAllowed();

// ---------- Що робили суперники в цій роздачі ----------
function autoTrackReset() {
  if (Auto.trackHand === G.handNo) return;
  Auto.trackHand = G.handNo;
  G.players.forEach(o => { o._apf = ''; o._ast = ''; });
}
const _autoApplyAction = applyAction;
applyAction = function (p, act) {
  autoTrackReset();
  if (act.type === 'raise') { if (G.street === 'preflop') p._apf = 'r'; p._ast = G.street; }
  else if (act.type === 'call' && G.street === 'preflop' && p._apf !== 'r') p._apf = 'c';
  return _autoApplyAction(p, act);
};

// ---------- Позиція ----------
function autoPos() {
  const n = N(), off = (0 - G.dealer + n) % n;
  if (n === 2) return off === 0 ? { k: 'sb', name: 'баттон (малий блайнд)', late: true } : { k: 'bb', name: 'великий блайнд' };
  if (off === 0) return { k: 'btn', name: 'баттон — найкраща позиція', late: true };
  if (off === 1) return { k: 'sb', name: 'малий блайнд' };
  if (off === 2) return { k: 'bb', name: 'великий блайнд' };
  if (off === n - 1 && n >= 5) return { k: 'co', name: 'катоф (перед баттоном)', late: true };
  if (off === 3) return { k: 'utg', name: 'перша позиція (UTG) — говорю першим', early: true };
  return { k: 'mp', name: 'середня позиція' };
}

// ---------- Шанси проти «правдоподібних» рук суперників ----------
// Кожну випадкову руку суперника приймаємо з вагою: наскільки ймовірно, що він так зіграв би нею.
function autoIsDraw(h) {
  const all = h.concat(G.board);
  for (const s of SUITS) if (all.filter(c => c.s === s).length === 4 && h.some(c => c.s === s)) return true;
  const rs = new Set(all.map(c => c.r)), hr = new Set(h.map(c => c.r));
  if (rs.has(14)) rs.add(1);
  if (hr.has(14)) hr.add(1);
  for (let lo = 1; lo <= 10; lo++) {
    let n = 0, mine = false;
    for (let r = lo; r < lo + 5; r++) if (rs.has(r)) { n++; if (hr.has(r)) mine = true; }
    if (n === 4 && mine) return true;
  }
  return false;
}
function autoMadeWeight(h) {
  const ev = evaluate(h.concat(G.board)), bd = evaluate(G.board);
  if (ev.cat > bd.cat) {
    if (ev.cat >= 2) return 1;
    const top = Math.max(...G.board.map(c => c.r));
    return ev.tb[0] >= top ? 1 : 0.55;           // топ-пара/оверпара ставлять частіше, ніж слабка пара
  }
  if (G.board.length < 5 && autoIsDraw(h)) return 0.6; // напівблеф із дро
  return 0.18;                                       // чистий блеф — рідко
}
function autoWeight(o, h) {
  let w = 1;
  const t = startingHandInfo(h).tier;
  if (o._apf === 'r') w *= [1, 1, 1, 0.9, 0.5, 0.22, 0.06][t];
  else if (o._apf === 'c') w *= [1, 0.5, 0.8, 1, 1, 0.7, 0.3][t];
  if (G.board.length && o._ast === G.street) w *= autoMadeWeight(h);
  return w;
}
function autoEquity(me, iters = 1200) {
  const opps = liveP().filter(p => p !== me);
  const used = new Set(me.hole.concat(G.board).map(c => c.id));
  const rest = FULL_DECK.filter(c => !used.has(c.id));
  let tot = 0;
  for (let it = 0; it < iters; it++) {
    const taken = new Set();
    const draw = () => { let c; do { c = rest[Math.floor(Math.random() * rest.length)]; } while (taken.has(c.id)); taken.add(c.id); return c; };
    const hands = [];
    for (const o of opps) {
      let h;
      for (let t = 0; t < 25; t++) {
        h = [draw(), draw()];
        if (t === 24 || Math.random() < autoWeight(o, h)) break;
        taken.delete(h[0].id); taken.delete(h[1].id);
      }
      hands.push(h);
    }
    const board = G.board.slice();
    while (board.length < 5) board.push(draw());
    const my = evaluate(me.hole.concat(board)).score;
    let best = 0, eq = 0;
    for (const h of hands) {
      const sc = evaluate(h.concat(board)).score;
      if (sc > best) { best = sc; eq = 1; } else if (sc === best) eq++;
    }
    if (my > best) tot++; else if (my === best) tot += 1 / (eq + 1);
  }
  return tot / iters;
}

// ---------- Допоміжне ----------
function autoRaiseTo(me, to) {
  const maxTo = me.bet + me.chips;
  const minTo = Math.min(G.currentBet + G.minRaise, maxTo);
  to = Math.round(to / SB) * SB;
  if (to > maxTo * 0.6) to = maxTo; // якщо ставка — більше половини стека, чесніше піти ва-банк
  return Math.max(minTo, Math.min(maxTo, to));
}
const autoActName = (me, a) => {
  const toCall = G.currentBet - me.bet;
  if (a.type === 'fold') return 'ФОЛД';
  if (a.type === 'check') return 'ЧЕК';
  if (a.type === 'call') return toCall >= me.chips ? `ОЛ-ІН ${me.chips}` : `КОЛЛ ${toCall}`;
  if (a.to >= me.bet + me.chips) return `ОЛ-ІН ${a.to}`;
  return G.currentBet === 0 ? `БЕТ ${a.to}` : `РЕЙЗ до ${a.to}`;
};
function autoBoardNote() {
  const b = G.board;
  const notes = [];
  const maxSuit = Math.max(...SUITS.map(s => b.filter(c => c.s === s).length));
  if (maxSuit >= 4) notes.push('на столі 4 карти однієї масті — флеш у будь-кого з однією такою картою');
  else if (maxSuit === 3) notes.push('три карти однієї масті — можливий флеш');
  const rs = [...new Set(b.map(c => c.r))].sort((a, c) => a - c);
  for (let i = 0; i + 2 < rs.length; i++) if (rs[i + 2] - rs[i] <= 4) { notes.push('карти близькі за рангом — можливий стріт'); break; }
  if (new Set(b.map(c => c.r)).size < b.length) notes.push('стіл спарений — можливі фул-хаус і трійки');
  return notes.length ? `Стіл небезпечний: ${notes.join('; ')}.` : '';
}
function autoNames(list) { return list.map(p => p.name).join(' і '); }
const autoG = (p, m, f) => (p && p.sex === 'f' ? f : m); // рід: «підвищив / підвищила»

// ---------- Префлоп ----------
function autoPreflop(me, s) {
  const info = startingHandInfo(me.hole), pos = autoPos();
  const { toCall, pot } = s;
  const code = info.code, tn = info.tierName.toLowerCase();
  const raised = G.currentBet > BB;
  const raiser = raised ? G.aggressor : null;
  const limpers = G.players.filter(p => !p.human && !p.folded && p._apf === 'c').length;
  const stackBB = (me.chips + me.bet) / BB;
  const hasAce = me.hole.some(c => c.r === 14);
  const posTxt = `Позиція: ${pos.name}.`;
  const R = (to, why) => ({ act: { type: 'raise', to: autoRaiseTo(me, to) }, why });
  const C = why => ({ act: { type: toCall ? 'call' : 'check' }, why });
  const F = why => toCall ? { act: { type: 'fold' }, why } : { act: { type: 'check' }, why: 'Доплачувати нічого — подивлюсь флоп безкоштовно. Скидати, коли можна чекнути, не можна ніколи.' };

  // короткий стек: «ол-ін або фолд»
  if (stackBB <= 12) {
    if (info.tier <= 4 || info.pair || hasAce) return R(me.bet + me.chips, `У мене лише ${Math.round(stackBB)} BB. З коротким стеком немає сенсу ставити потроху — граю «ол-ін або фолд». ${code} для цього достатньо сильна.`);
    return F(`Мало фішок (${Math.round(stackBB)} BB), а ${code} — слабка. Чекаю руку для ол-іну.`);
  }

  if (!raised) {
    const open = BB * 3 + limpers * BB;
    const limpTxt = limpers ? ` Перед мною ${limpers === 1 ? 'один гравець лише доплатив' : `доплатили ${limpers} гравці`} — проти «лімперів» рейз більший: 3 BB + 1 BB за кожного.` : '';
    if (info.tier <= 3) return R(open, `${code} — ${tn} рука. Не просто доплачую (це пасивно), а рейзю: забираю ініціативу й змушую інших платити за гру зі мною.${limpTxt} ${posTxt}`);
    if (info.tier === 4) {
      if (pos.early && N() >= 6) return F(`${code} — непогано, але я говорю першим за великим столом: позаду багато гравців, у когось може бути краще. ${posTxt}`);
      return R(open, `${code} — хороша рука, і переді мною ніхто не підвищував. Заходжу рейзом.${limpTxt} ${posTxt}`);
    }
    // спекулятивні та слабкі руки
    const blinds = G.players.filter((p, i) => !p.human && !p.folded && (i === nextIdx(G.dealer) || i === nextIdx(nextIdx(G.dealer))));
    const loose = blinds.filter(p => p.obs && p.obs.hands >= 5 && p.obs.vpip / p.obs.hands > 0.5);
    const stealSpot = (pos.late || pos.k === 'sb') && limpers === 0;
    if (info.tier === 5) {
      if (toCall === 0) return C('Спекулятивна рука, а доплачувати нічого — чек, дивлюсь флоп.');
      if (stealSpot && !loose.length) return R(BB * 2.5, `${code} — спекулятивна рука, але всі переді мною скинули. З пізньої позиції «краду блайнди»: рейз до 2.5 BB часто забирає банк одразу. ${posTxt}`);
      if (limpers > 0 && toCall <= BB) return C(`${code} — спекулятивна рука (пари/однопасні сусіди). Доплатити ${toCall} дешево, а в банку вже кілька гравців: якщо влучу сет чи стріт — виграю багато.`);
      return F(`${code} — спекулятивна рука${loose.length ? `, а ${autoNames(loose)} часто доплачує — красти блайнди проти «липких» гравців не працює` : ', а позиція незручна'}. Пас.`);
    }
    if (toCall === 0) return C('Рука слабка, але чек безкоштовний — дивлюсь флоп.');
    if (pos.k === 'sb' && toCall <= BB / 2 && limpers === 0 && (info.suited || info.gap <= 2) && !loose.length)
      return C(`${code} — слабка, але половину блайнда я вже поставив: доплатити ${toCall} дуже дешево (треба лише ${pct(s.need)} шансу).`);
    const highCard = Math.max(...me.hole.map(c => c.r));
    if (pos.k === 'btn' && limpers === 0 && !loose.length && (highCard >= 12 || info.suited))
      return R(BB * 2.5, `${code} — слабка рука, але я на баттоні і всі скинули. Залишились тільки блайнди, і вони гратимуть без позиції — пробую вкрасти банк дешевим рейзом.`);
    return F(`${code} — слабка рука${pos.early ? ' з ранньої позиції' : ''}. Більшість рук треба скидати — це нормально, саме так економляться фішки.${loose.length && pos.late ? ` (Красти блайнди не буду: ${autoNames(loose)} часто доплачує.)` : ''}`);
  }

  // хтось уже підвищив
  const rn = raiser ? raiser.name : 'Суперник';
  const rv = autoG(raiser, 'підвищив', 'підвищила');
  const big = toCall >= (me.chips + me.bet) * 0.35;
  const xs = (G.currentBet / BB).toFixed(1).replace('.0', '');
  if (big) {
    if (info.tier <= 1 || code === 'AKo' || code === 'TT') return R(me.bet + me.chips, `${rn} ставить майже весь стек. ${code} — одна з найкращих рук, проти такої ставки йду ва-банк.`);
    if (s.eqR >= s.need) return C(`Ставка велика, але банк уже чималий: треба ${pct(s.need)}, а проти рук, якими так грають, у мене ≈${pct(s.eqR)}. Доплачую.`);
    return F(`${rn} ставить ${toCall} — це велика частина мого стека. Проти такої ставки ${code} має лише ≈${pct(s.eqR)}, а треба ${pct(s.need)}. Пас.`);
  }
  if (info.tier === 1) return R(G.currentBet * 3, `${rn} ${rv} до ${xs} BB, але ${code} — ${tn} рука. Роблю ре-рейз (3-бет) приблизно втричі: хочу більший банк і менше суперників.`);
  if (info.tier === 2) {
    if (G.currentBet <= BB * 4) return R(G.currentBet * 3, `${code} — дуже сильна рука. На звичайний рейз ${rn} відповідаю ре-рейзом утричі.`);
    return C(`${code} — дуже сильна, але ${rn} ${rv} аж до ${xs} BB — це часто ще сильніша рука. Доплачую й дивлюсь флоп.`);
  }
  if (info.tier === 3) {
    if (G.currentBet <= BB * 4) return C(`${code} — сильна рука, але ${rn} уже ${rv}. Ре-рейзити ризиковано, скидати — шкода. Колл.`);
    if (s.eqR >= s.need + 0.08) return C(`${rn} ${rv} до ${xs} BB — це сильно, але банк уже великий: треба ${pct(s.need)}, а ${code} проти таких рук має ≈${pct(s.eqR)}. Колл.`);
    return F(`${code} непогана, але ${rn} ${rv} до ${xs} BB — такий рейз зазвичай означає руку, яка сильніша. Пас.`);
  }
  if (info.pair && toCall <= me.chips * 0.07) return C(`Мала пара ${code}. Доплатити ${toCall} — дешево відносно стеків: з шансом ≈12% я зберу сет (трійку) і зможу виграти великий банк. Це називається «сет-майнінг».`);
  if ((info.suited && (info.gap <= 1 || me.hole.some(c => c.r === 14))) && (pos.late || pos.k === 'bb') && toCall <= BB * 3)
    return C(`${code} — однопасна рука з потенціалом (флеш/стріт). Доплата невелика${pos.late ? ', і я в позиції' : ', а частину я вже поставив як блайнд'}. Колл.`);
  return F(`${rn} ${rv} — це звужує його руки до сильних. ${code} проти них має ≈${pct(s.eqR)} (проти випадкових було б ${pct(s.eqRand)}). Пас.`);
}

// ---------- Після флопу ----------
function autoPostflop(me, s) {
  const { toCall, pot, need, eqR, nOpp } = s;
  const ev = evaluate(me.hole.concat(G.board)), bd = evaluate(G.board);
  const mine = ev.cat > bd.cat;
  const outs = G.board.length < 5 ? countOuts(me.hole, G.board).outs : 0;
  const draw = outs >= 8;
  const street = G.street;
  const handTxt = mine ? `У мене ${handName(ev).toLowerCase()}.`
    : bd.cat >= 1 ? `«${handName(ev)}» лежить на столі — це спільне для всіх, вирішить кікер.`
    : `Я не влучив — пари немає${me.hole.some(c => c.r === 14) ? ', лише туз-старша' : ''}.`;
  const outsTxt = outs ? ` Аутів: ${outs} (≈${Math.min(100, outs * (street === 'flop' ? 4 : 2))}% ${street === 'flop' ? 'до рівера' : 'на рівері'} — правило «×4 / ×2»).` : '';
  const danger = autoBoardNote();
  const aggr = G.aggressor && !G.aggressor.human ? G.aggressor : null;
  const valueT = (nOpp === 1 ? 0.62 : nOpp === 2 ? 0.5 : 0.42) + (street === 'river' ? 0.05 : 0);
  const R = (to, why) => ({ act: { type: 'raise', to: autoRaiseTo(me, to) }, why });

  if (toCall === 0) {
    if (eqR >= valueT && mine) {
      const k = danger ? 0.7 : 0.55;
      return R(Math.round(pot * k), `${handTxt} Ймовірно, моя рука найкраща (≈${pct(eqR)}). Ставлю ~${Math.round(k * 100)}% банку «на вартість» — щоб гірші руки мені платили.${danger ? ' Стіл небезпечний, тож ставка більша: не даю дешево добрати карти.' : ''}`);
    }
    if (draw && street !== 'river' && nOpp <= 2)
      return R(Math.round(pot * 0.5), `${handTxt}${outsTxt} Це хороше дро — роблю напівблеф на пів банку: суперник може скинути одразу, а якщо доплатить — я ще можу зібрати руку.`);
    const wasRaiser = me._apf === 'r';
    const topR = Math.max(...G.board.map(c => c.r));
    if (wasRaiser && street === 'flop' && nOpp === 1 && eqR >= 0.3 && !danger && topR >= 12)
      return R(Math.round(pot * 0.35), `${handTxt} Я рейзив на префлопі, а на флопі старші карти — вони краще пасують моїм рукам. Маленька «ставка-продовження» (c-bet ~⅓ банку) часто забирає банк.`);
    let why = `${handTxt}${outsTxt} `;
    if (mine && eqR >= 0.4) why += 'Рука середня — чек, щоб не роздувати банк і дешево побачити наступну карту.';
    else if (street === 'river') why += 'Блефувати тут погано: суперники доплачують, коли в них хоч щось є, а гірші руки й так програють. Чек.';
    else why += 'Чек — безкоштовно дивлюсь наступну карту.';
    if (danger && !(mine && eqR >= 0.5)) why += ' ' + danger;
    return { act: { type: 'check' }, why };
  }

  const who = aggr ? aggr.name : 'Суперник';
  const priceTxt = `Доплатити ${toCall} у банк ${pot} — треба ${pct(need)} шансу.`;
  const readTxt = Math.abs(eqR - s.eqRand) >= 0.05 && aggr
    ? ` Проти випадкових рук було б ${pct(s.eqRand)}, але ${who} ставить — значить, рука в ${autoG(aggr, 'нього', 'неї')} зазвичай краща: реально ≈${pct(eqR)}.` : '';
  if (mine && eqR >= (nOpp === 1 ? 0.75 : 0.62) && me.chips > toCall)
    return R(G.currentBet + Math.round((pot + toCall) * 0.75), `${handTxt} ${who} ставить, але моя рука дуже сильна (≈${pct(eqR)}). Підвищую — хочу виграти великий банк.`);
  if (eqR >= need) return { act: { type: 'call' }, why: `${handTxt}${outsTxt} ${priceTxt} У мене ≈${pct(eqR)} — це більше, тож колл вигідний.${readTxt}` };
  if (draw && street !== 'river' && eqR * 1.3 >= need && toCall <= me.chips * 0.15)
    return { act: { type: 'call' }, why: `${handTxt}${outsTxt} ${priceTxt} Шансів трохи бракує (≈${pct(eqR)}), але якщо зберу руку — виграю ще й наступні ставки («неявні шанси»). Колл.` };
  return { act: { type: 'fold' }, why: `${handTxt}${outsTxt} ${priceTxt} У мене лише ≈${pct(eqR)}.${readTxt} Пас — краще втратити вже поставлене, ніж доплачувати без шансів.` };
}

// ---------- Рішення ----------
function autoDecide(me) {
  autoTrackReset();
  const toCall = G.currentBet - me.bet;
  const pot = potTotal();
  const nOpp = liveP().length - 1;
  const need = toCall > 0 ? toCall / (pot + toCall) : 0;
  const eqRand = calcEquity(me.hole, G.board, nOpp, 1500).equity;
  const eqR = autoEquity(me);
  const s = { toCall, pot, nOpp, need, eqRand, eqR };
  const d = G.street === 'preflop' ? autoPreflop(me, s) : autoPostflop(me, s);
  Auto.lastEq = eqR;
  let stat = `📊 проти випадкових рук: ${pct(eqRand)}`;
  if (Math.abs(eqR - eqRand) >= 0.04) stat += ` · проти рук, якими так грають: ≈${pct(eqR)}`;
  if (toCall && d.act.type !== 'raise') stat += ` · треба: ${pct(need)}`;
  d.stat = stat;
  return d;
}

// ---------- Хід ----------
function autoTurn(me) {
  clearTimeout(Auto.timer);
  const id = ++Auto.turnId;
  Auto.played = true;
  autoHandHeader();
  const d = autoDecide(me);
  const cls = d.act.type;
  const street = STREET_NAMES[G.street] || '';
  autoSay(`<div class="ap-act ${cls}"><span>${street}</span>${autoActName(me, d.act)}</div><p>${d.why}</p><small>${d.stat}</small>`, 'turn');
  setCoach('<p class="muted">🤖 Зараз ходить Claude — пояснення у вікні «Claude грає». Натисніть ⏸, щоб зіграти цей хід самому.</p>');
  const btnId = cls === 'fold' ? 'btn-fold' : cls === 'raise' ? 'btn-raise' : 'btn-call';
  if (cls === 'raise') { $('raise-num').value = $('raise-range').value = d.act.to; updateRaiseLabel(); }
  Auto.timer = setTimeout(() => {
    if (id !== Auto.turnId || !G.humanResolve || !autoActive()) return;
    const b = $(btnId);
    b.classList.add('auto-press');
    Auto.timer = setTimeout(() => {
      b.classList.remove('auto-press');
      if (id !== Auto.turnId || !G.humanResolve || !autoActive()) return;
      Auto.wasAuto = true;
      setControls(false);
      const r = G.humanResolve; G.humanResolve = null;
      r(d.act);
    }, 380);
  }, Auto.speed);
}

function autoHandHeader() {
  if (Auto.hand === G.handNo) return;
  Auto.hand = G.handNo;
  const me = G.players[0], info = startingHandInfo(me.hole);
  autoSay(`<div class="ap-hand">Роздача №${G.handNo} · <b>${me.hole.map(c => `<i class="${c.s === 'h' || c.s === 'd' ? 'red' : ''}">${cardText(c)}</i>`).join(' ')}</b> · ${info.tierName.toLowerCase()} · ${autoPos().name.split(' —')[0]}</div>`, 'head');
}

// Кінець роздачі: короткий підсумок і урок
function autoHandEnd(diff) {
  if (!Auto.played) return;
  Auto.played = false;
  Auto.stats.hands++;
  Auto.stats.profit += diff;
  const me = G.players[0];
  const live = liveP();
  const winners = G.lastWinners.map(i => G.players[i]);
  const showdown = live.length > 1;
  const evs = p => handName(evaluate(p.hole.concat(G.board))).toLowerCase();
  const sign = diff > 0 ? `+${diff}` : String(diff);
  let t;
  if (me.folded) {
    if (diff === 0) t = 'Скинув, нічого не поставивши.';
    else t = `Скинув, втрата ${-diff}.`;
    if (showdown && winners.length) t += ` До речі, на вскритті ${winners.length > 1 ? 'виграли' : autoG(winners[0], 'виграв', 'виграла')} ${autoNames(winners)}: ${evs(winners[0])} (${winners[0].hole.map(cardText).join(' ')}).`;
    else if (G.board.length && diff < 0) t += ' Краще втратити трохи, ніж доплачувати без шансів.';
  } else if (!showdown) {
    t = `🏆 Всі скинули — забираю банк (${sign}).${me._r ? ' Агресія окупилась: ставкою можна виграти й без найкращої руки.' : ''}`;
  } else if (winners.includes(me)) {
    t = `🏆 Виграв на вскритті (${sign}): ${evs(me)}.`;
  } else {
    const w = winners[0];
    t = `Програв ${-diff}: у ${w.name} ${evs(w)} (${w.hole.map(cardText).join(' ')}).`;
    if (Auto.lastEq != null && Auto.lastEq >= 0.5) t += ` Під час останнього рішення я був фаворитом (≈${pct(Auto.lastEq)}) — це не помилка, а везіння суперника. Судимо рішення, а не результат.`;
    else t += ' Я доплачував, бо ціна була вигідна, але цього разу не склалося.';
  }
  autoSay(`<p class="ap-end ${diff > 0 ? 'pos' : diff < 0 ? 'neg' : ''}">${t}</p>`, 'end');
  autoSyncUI();
}

// Після роздачі — наступна сама
function autoScheduleNext() {
  clearTimeout(Auto.nextTimer);
  if (!autoActive()) return;
  const h = G.handNo;
  Auto.nextTimer = setTimeout(() => {
    if (!autoActive() || G.running || !G.table || G.handNo !== h) return;
    if (!$('view-play').classList.contains('active') || !$('modal').classList.contains('hidden')) return;
    if (G.players[0].chips <= 0) { autoSay('<p class="ap-end">Фішки закінчились — беру нові тренувальні 1000.</p>', 'end'); rebuy(); return; }
    nextHandClick();
  }, Math.max(1800, Auto.speed + 900));
}

// ---------- Вікно коментарів ----------
function autoBuildPanel() {
  if ($('auto-panel')) return;
  const el = document.createElement('div');
  el.id = 'auto-panel';
  el.className = 'auto-panel hidden';
  el.innerHTML = `
    <div class="ap-head">
      <b>🤖 Claude грає</b><span id="ap-status" class="ap-status"></span>
      <button id="ap-pause" title="Пауза: ходите ви">⏸</button>
      <button id="ap-min" title="Згорнути">—</button>
      <button id="ap-off" title="Вимкнути автогру">✕</button>
    </div>
    <div class="ap-body">
      <div class="ap-tools"><span>Темп:</span>
        <button data-s="3800">Повільно</button><button data-s="2200">Норм.</button><button data-s="900">Швидко</button>
        <span id="ap-stats" class="ap-stats"></span>
      </div>
      <div id="ap-feed" class="ap-feed"></div>
    </div>`;
  document.body.appendChild(el);
  addEventListener('resize', autoPlacePanel);
  $('ap-pause').onclick = autoTogglePause;
  $('ap-min').onclick = () => { Auto.min = !Auto.min; autoSyncUI(); };
  $('ap-off').onclick = () => autoToggle(false);
  el.querySelectorAll('.ap-tools button').forEach(b => b.onclick = () => {
    Auto.speed = Number(b.dataset.s); localStorage.setItem('poker_auto_speed', b.dataset.s); autoSyncUI();
  });
}

// Широкий екран: у бічну колонку (замість тренера). Вужчий: плаваюче вікно.
function autoPlacePanel() {
  const p = $('auto-panel'), side = document.querySelector('#view-play .side');
  if (!p || !side) return;
  const wide = innerWidth > 1100;
  if (wide && p.parentElement !== side) side.prepend(p);
  else if (!wide && p.parentElement !== document.body) document.body.appendChild(p);
  document.body.classList.toggle('auto-side', wide && !p.classList.contains('hidden') && !p.classList.contains('min'));
  const f = $('ap-feed'); if (f) f.scrollTop = f.scrollHeight;
}

function autoSay(html, cls = '') {
  autoBuildPanel();
  const f = $('ap-feed');
  const d = document.createElement('div');
  d.className = 'ap-item ' + cls;
  d.innerHTML = html;
  f.appendChild(d);
  while (f.children.length > 120) f.removeChild(f.firstChild);
  f.scrollTop = f.scrollHeight;
}

function autoSyncUI() {
  autoBuildPanel();
  const show = Auto.on && autoAllowed();
  const p = $('auto-panel');
  p.classList.toggle('hidden', !show);
  p.classList.toggle('min', Auto.min || Auto.paused);
  autoPlacePanel();
  $('ap-pause').textContent = Auto.paused ? '▶' : '⏸';
  $('ap-pause').title = Auto.paused ? 'Продовжити автогру' : 'Пауза: ходите ви';
  $('ap-status').textContent = Auto.paused ? 'пауза — ходите ви' : '';
  p.querySelectorAll('.ap-tools button').forEach(b => b.classList.toggle('on', Number(b.dataset.s) === Auto.speed));
  const st = Auto.stats;
  $('ap-stats').innerHTML = st.hands ? `роздач: <b>${st.hands}</b> · <b class="${st.profit > 0 ? 'pos' : st.profit < 0 ? 'neg' : ''}">${st.profit > 0 ? '+' : ''}${st.profit}</b>` : '';
  const b = $('tb-auto');
  if (b) {
    b.classList.toggle('hidden', !autoAllowed());
    b.classList.toggle('on', Auto.on);
    b.title = Auto.on ? 'Автогра увімкнена — натисніть, щоб грати самому' : 'Автогра: Claude грає за вас і пояснює кожен хід';
  }
}

function autoToggle(force) {
  if (!autoAllowed()) { notify('Автогра працює за тренувальним столом «Гра з тренером».', 'info', '🤖'); return; }
  const on = force === undefined ? !Auto.on : force;
  if (on === Auto.on) return;
  Auto.on = on; Auto.paused = false; Auto.min = false;
  clearTimeout(Auto.timer); clearTimeout(Auto.nextTimer);
  autoSyncUI();
  if (on) {
    Auto.stats = { hands: 0, profit: 0 };
    autoSay('<p class="ap-intro">Привіт! Граю за вас і коротко пояснюю кожен хід. ⏸ — пауза (зіграти самому), темп можна змінити вгорі.</p>', 'intro');
    autoResume();
  } else {
    Auto.turnId++;
    if (G.humanResolve) { coachBeforeHuman(G.players[0]); renderCoach(G.players[0]); }
  }
}

function autoTogglePause() {
  Auto.paused = !Auto.paused;
  clearTimeout(Auto.timer); clearTimeout(Auto.nextTimer);
  Auto.turnId++;
  autoSyncUI();
  if (Auto.paused) {
    autoSay('<p class="ap-intro">⏸ Пауза — тепер ходите ви. Натисніть ▶, щоб я продовжив.</p>', 'intro');
    if (G.humanResolve) { coachBeforeHuman(G.players[0]); renderCoach(G.players[0]); }
  } else autoResume();
}

function autoResume() {
  if (!autoActive()) return;
  if (G.humanResolve) autoTurn(G.players[0]);
  else if (!G.running && G.table) {
    if (G.handNo === 0 || !$('next-box').classList.contains('hidden')) autoScheduleNext();
  }
}

// панель столу оновлюється — оновлюємо й кнопку автогри
const _autoUpdateTableBar = updateTableBar;
updateTableBar = function () { _autoUpdateTableBar(); autoSyncUI(); };
