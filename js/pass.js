// ===== Покер-пас: сезон = календарний місяць, 30 рівнів, безкоштовна і преміум-доріжки =====
// Преміум купується за ігрові монети. Сезонні ексклюзиви видаються лише в своєму сезоні.

const PASS_TIERS = 30;
const PASS_TIER_PTS = 60;       // зірок на один рівень
const PASS_PRICE = 5000;        // преміум-доріжка
const PASS_PTS = { hand: 2, win: 2, real: 1, quiz: 1, quest: 20, allQuests: 30, lesson: 15, daily: 15, tourney: 15, career: 20, careerWin: 20 };

// Базові теми за місяцями (запасний варіант, якщо для місяця немає окремого сезону)
const SEASONS = [
  { icon: '❄️', n: 'Зимова казка', av: ['☃️', 'Сніговик'], fx: ['Хурделиця', ['❄️', '🌨️', '☃️', '✨']], back: 'Іній', title: ['Сніжний король', '#93c5fd'] },
  { icon: '💘', n: 'Покер і кохання', av: ['💘', 'Купідон'], fx: ['Валентинки', ['💘', '💌', '💝', '💋']], back: 'Валентинка', title: ['Серцеїд', '#f472b6'] },
  { icon: '🌷', n: 'Весняне пробудження', av: ['🌻', 'Соняшник'], fx: ['Цвітіння', ['🌷', '🌱', '🦋', '🌼']], back: 'Весна', title: ['Весняний вітер', '#86efac'] },
  { icon: '🎭', n: 'Місяць блефу', av: ['🎭', 'Маска'], fx: ['Маскарад', ['🎭', '🃏', '😏', '🎩']], back: 'Маскарад', title: ['Король блефу', '#c084fc'] },
  { icon: '🏝️', n: 'Тропічний стіл', av: ['🦜', 'Папуга'], fx: ['Тропіки', ['🌴', '🥥', '🦜', '🌺']], back: 'Тропіки', title: ['Тропічний шторм', '#2dd4bf'] },
  { icon: '⚽', n: 'Літній кубок', av: ['⚽', 'Футболіст'], fx: ['Гол!', ['⚽', '🏆', '🥅', '🎉']], back: 'Стадіон', title: ['Капітан команди', '#4ade80'] },
  { icon: '🌊', n: 'Морський бриз', av: ['🐬', 'Дельфін'], fx: ['Хвиля', ['🌊', '🐚', '🐬', '🫧']], back: 'Глибина', title: ['Морський вовк', '#38bdf8'] },
  { icon: '🌌', n: 'Зоряна ніч', av: ['🌠', 'Падаюча зірка'], fx: ['Метеори', ['🌠', '☄️', '🌌', '⭐']], back: 'Сузір’я', title: ['Зоряний гість', '#a78bfa'] },
  { icon: '📚', n: 'Покер-академія', av: ['🎓', 'Випускник'], fx: ['Знання', ['📚', '✏️', '🎓', '💡']], back: 'Академія', title: ['Магістр покеру', '#fbbf24'] },
  { icon: '🎃', n: 'Ніч жахів', av: ['🎃', 'Гарбуз'], fx: ['Привиди', ['🎃', '👻', '🦇', '🕸️']], back: 'Жахастик', title: ['Привид столу', '#fb923c'] },
  { icon: '🍂', n: 'Золота осінь', av: ['🦔', 'Їжачок'], fx: ['Листопад', ['🍂', '🍁', '🌰', '🍄']], back: 'Бурштин', title: ['Осінній лис', '#f59e0b'] },
  { icon: '🎄', n: 'Новорічне диво', av: ['🦌', 'Олень Санти'], fx: ['Свято', ['🎄', '🎁', '⭐', '🔔']], back: 'Святкова', title: ['Святковий джекпот', '#ef4444'] },
];
const seasonKey = m => 'p' + String(m + 1).padStart(2, '0');

// ---------- Окремі сезони (неповторні: їхні предмети більше ніколи не повернуться) ----------
// Кожен — 6 ексклюзивів на преміум-доріжці: аватар (8), рамка (12), ефект (16), сукно (20), сорочка (24), титул (30).
// Щоб додати новий сезон: ключ «рік-місяць», предмети з унікальним id і CSS-класи fr-/fl-/bk- у style.css.
const SEASON_SPECIAL = {
  '2026-12': {
    icon: '🚂', n: 'Новорічний експрес', d: 'Святковий потяг везе подарунки до кожного столу.',
    items: [
      { t: 8, cat: 'avatar', id: '🤶', n: 'Снігурочка' },
      { t: 12, cat: 'frame', id: 's2612', n: 'Гірлянда' },
      { t: 16, cat: 'fx', id: 's2612', n: 'Новорічна ніч', e: '🎆', emoji: ['🎄', '🎁', '❄️', '🎆', '🔔', '⭐'] },
      { t: 20, cat: 'felt', id: 's2612', n: 'Ялинкове' },
      { t: 24, cat: 'back', id: 's2612', n: 'Подарунок' },
      { t: 30, cat: 'title', id: 's2612', n: 'Дух Нового року', c: '#f87171' },
    ],
  },
  '2027-1': {
    icon: '🧊', n: 'Крижана корона', d: 'Найхолодніший сезон: зберігайте холодну голову за столом.',
    items: [
      { t: 8, cat: 'avatar', id: '🥶', n: 'Морозко' },
      { t: 12, cat: 'frame', id: 's2701', n: 'Крижана' },
      { t: 16, cat: 'fx', id: 's2701', n: 'Північне сяйво', e: '🌌', emoji: ['❄️', '💠', '✨', '🌌', '🧊'] },
      { t: 20, cat: 'felt', id: 's2701', n: 'Льодовик' },
      { t: 24, cat: 'back', id: 's2701', n: 'Аврора' },
      { t: 30, cat: 'title', id: 's2701', n: 'Крижане серце', c: '#67e8f9' },
    ],
  },
  '2027-2': {
    icon: '🌹', n: 'Казино кохання', d: 'Місяць закоханих: ризикуйте серцем, а не всім стеком.',
    items: [
      { t: 8, cat: 'avatar', id: '😻', n: 'Закоханий кіт' },
      { t: 12, cat: 'frame', id: 's2702', n: 'Серцебиття' },
      { t: 16, cat: 'fx', id: 's2702', n: 'Любовний лист', e: '💌', emoji: ['💌', '💘', '🌹', '💕', '💞'] },
      { t: 20, cat: 'felt', id: 's2702', n: 'Рубіновий оксамит' },
      { t: 24, cat: 'back', id: 's2702', n: 'Троянда' },
      { t: 30, cat: 'title', id: 's2702', n: 'Покер-Ромео', c: '#fb7185' },
    ],
  },
};

// Опис сезону за id «рік-місяць»
function seasonDef(sid) {
  if (SEASON_SPECIAL[sid]) return SEASON_SPECIAL[sid];
  const m = Number(sid.split('-')[1]) - 1;
  const s = SEASONS[m], k = seasonKey(m);
  return {
    icon: s.icon, n: s.n,
    items: [
      { t: 8, cat: 'avatar', id: s.av[0] }, { t: 16, cat: 'fx', id: k },
      { t: 24, cat: 'back', id: k }, { t: 30, cat: 'title', id: k },
    ],
  };
}

// Сезонні предмети реєструються в магазині як ексклюзиви
SEASONS.forEach((s, m) => {
  const k = seasonKey(m);
  SHOP.avatar.items.push({ id: s.av[0], n: s.av[1], price: 0, ex: 'pass' });
  SHOP.fx.items.push({ id: k, n: s.fx[0], e: s.fx[1][0], price: 0, ex: 'pass' });
  SHOP.back.items.push({ id: k, n: s.back, price: 0, ex: 'pass' });
  SHOP.title.items.push({ id: k, n: s.title[0], c: s.title[1], price: 0, ex: 'pass' });
  FX_KINDS[k] = { emoji: s.fx[1] };
});
Object.values(SEASON_SPECIAL).forEach(sp => sp.items.forEach(x => {
  const it = { id: x.id, n: x.n, price: 0, ex: 'pass' };
  if (x.c) it.c = x.c;
  if (x.e) it.e = x.e;
  SHOP[x.cat].items.push(it);
  if (x.emoji) FX_KINDS[x.id] = { emoji: x.emoji };
}));

// ---------- Нагороди рівнів ----------
// Безкоштовна доріжка: монети, кожен 5-й — звичайна скриня.
// Преміум: сезонні ексклюзиви, скрині (5, 15, 25 — рідкісна; 10, 20 — легендарна, якщо там немає предмета), решта — монети.
function passReward(t, prem, sid = seasonNow().id) {
  if (!prem) return t % 5 === 0 ? { chest: 'common' } : { coins: Math.round((30 + t * 3) / 10) * 10 };
  const x = seasonDef(sid).items.find(i => i.t === t);
  if (x) return { item: [x.cat, x.id] };
  if (t === 10 || t === 20) return { chest: 'legend' };
  if (t % 5 === 0) return { chest: 'rare' };
  return { coins: Math.round((120 + t * 8) / 10) * 10 };
}
function rewardLabel(r) {
  if (r.coins) return { i: '🪙', t: fmt(r.coins) };
  if (r.chest) return { i: CHESTS.find(c => c.id === r.chest).icon, t: { common: 'Скриня', rare: 'Рідкісна', legend: 'Легенд.' }[r.chest] };
  const it = findItem(r.item[0], r.item[1]);
  return { i: r.item[0] === 'avatar' ? it.id : r.item[0] === 'fx' ? it.e : SHOP[r.item[0]].icon, t: it.n, ex: true };
}
// Підсумок преміум-доріжки (для вітрини)
function premSummary(sid = seasonNow().id) {
  let coins = 0, chests = 0, items = 0;
  for (let t = 1; t <= PASS_TIERS; t++) {
    const r = passReward(t, true, sid);
    if (r.coins) coins += r.coins; else if (r.chest) chests++; else items++;
  }
  return { coins, chests, items };
}
function seasonPreview(sid, cls = 'ps-exs') {
  const items = seasonDef(sid).items;
  return `<div class="${cls}" style="--cols:${items.length};--mcols:${items.length > 4 ? 3 : items.length}">${items.map(x => {
    const it = findItem(x.cat, x.id);
    return `<div class="ps-ex"><div class="sp">${shopPreview(x.cat, it)}</div><small>${it.n}</small></div>`;
  }).join('')}</div>`;
}
// ---------- Стан сезону ----------
function seasonNow(d = new Date()) {
  const m = d.getMonth(), y = d.getFullYear();
  return { id: `${y}-${m + 1}`, m, end: new Date(y, m + 1, 1).getTime() };
}
function passLeftText(ms) {
  const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5);
  return d > 0 ? `${d} дн. ${h} год.` : `${h} год. ${Math.floor(ms % 36e5 / 6e4)} хв.`;
}
function passState() {
  const sn = seasonNow();
  const p = Prof.pass;
  if (p && p.s === sn.id) return p;
  // новий сезон: незабрані нагороди минулого сезону видаються автоматично
  if (p && p.s) {
    const old = passSettle(p);
    if (old.length) setTimeout(() => notify(`Сезон «${seasonDef(p.s).n}» завершився. Незабрані нагороди зараховано: ${old.join(', ')}`, 'level', '🎟️'), 1200);
  }
  Prof.pass = { s: sn.id, m: sn.m, pts: 0, prem: false, cf: [], cp: [] };
  saveProfile();
  return Prof.pass;
}
const passTier = p => Math.min(PASS_TIERS, Math.floor(p.pts / PASS_TIER_PTS));
function passClaimable(p = passState()) {
  const tier = passTier(p);
  let n = 0;
  for (let t = 1; t <= tier; t++) {
    if (!p.cf.includes(t)) n++;
    if (p.prem && !p.cp.includes(t)) n++;
  }
  return n;
}

// Видати нагороду, повертає короткий опис
function passGive(r) {
  if (r.coins) { addCoins(r.coins); return `+${fmt(r.coins)} 🪙`; }
  if (r.chest) {
    const x = chestRoll(r.chest);
    return x.coins ? `${x.ch.icon} → +${fmt(x.coins)} 🪙` : `${x.ch.icon} → ${itemChip(x.cat, x.it)}`;
  }
  const [cat, id] = r.item;
  giveExclusive(cat, id);
  return `✨ ${itemChip(cat, findItem(cat, id))}`;
}
function passSettle(p) {
  const out = [];
  const tier = passTier(p);
  for (let t = 1; t <= tier; t++) {
    if (!p.cf.includes(t)) { p.cf.push(t); out.push(passGive(passReward(t, false, p.s))); }
    if (p.prem && !p.cp.includes(t)) { p.cp.push(t); out.push(passGive(passReward(t, true, p.s))); }
  }
  saveProfile();
  return out;
}

// ---------- Зірки сезону ----------
function passAdd(n) {
  if (!n) return;
  const p = passState();
  const before = passTier(p);
  p.pts += n;
  const after = passTier(p);
  saveProfile();
  if (after > before) {
    notify(`<b>Покер-пас: рівень ${after}!</b><br>${after >= PASS_TIERS ? 'Сезон пройдено повністю! 🏅' : 'Заберіть нагороду в Покер-пасі.'}`, 'level', '🎟️');
    if (after >= PASS_TIERS) unlockAch('pass_30');
  }
  if ($('view-pass') && $('view-pass').classList.contains('active')) renderPass();
}
function passOnEvent(type, e) {
  let n = 0;
  if (type === 'hand') n = PASS_PTS.hand + (e.won ? PASS_PTS.win : 0) + (e.cash || e.tourney ? PASS_PTS.real : 0);
  else if (type === 'quiz') n = e.ok ? PASS_PTS.quiz : 0;
  else if (type === 'lesson') n = PASS_PTS.lesson;
  else if (type === 'tourney') n = PASS_PTS.tourney;
  else if (type === 'career') n = PASS_PTS.career + (e.win ? PASS_PTS.careerWin : 0);
  if (n) passAdd(n);
}

// ---------- Дії ----------
function passBuy() {
  const p = passState();
  if (p.prem) return;
  if (!spendCoins(PASS_PRICE)) { notify(`Потрібно ${fmt(PASS_PRICE)} 🪙.`, 'warn', '🪙'); return; }
  p.prem = true;
  saveProfile();
  unlockAch('pass_prem');
  sfx('chest'); winFx(120, 'royal');
  closeModal();
  notify('<b>Преміум Покер-пас відкрито!</b><br>Усі нагороди за пройдені рівні вже чекають на вас.', 'level', '🎟️');
  renderPass();
}
function passBuyAsk() {
  const s = seasonDef(passState().s), sum = premSummary();
  showModal(`<h2>🎟️ Преміум Покер-пас</h2>
    <p>Сезон «${s.icon} ${s.n}». Преміум-доріжка діє до кінця сезону і зараховує нагороди за всі вже пройдені рівні.</p>
    <div class="sum-grid"><div><span>Ціна</span><b>${fmt(PASS_PRICE)} 🪙</b></div><div><span>Монет на доріжці</span><b class="pos">${fmt(sum.coins)} 🪙</b></div><div><span>Скринь</span><b>${sum.chests}</b></div></div>
    <p class="muted">Плюс ${sum.items} сезонних ексклюзивів, яких ніколи не буде в магазині.</p>
    <p class="modal-btns"><button class="btn primary big" ${Prof.coins < PASS_PRICE ? 'disabled' : ''} onclick="passBuy()">Відкрити · ${fmt(PASS_PRICE)} 🪙</button><button class="btn" onclick="closeModal()">Пізніше</button></p>`);
}
function passClaim(t, prem) {
  const p = passState();
  if (t > passTier(p)) return;
  const list = prem ? p.cp : p.cf;
  if ((prem && !p.prem) || list.includes(t)) return;
  list.push(t);
  saveProfile();
  const r = passReward(t, prem);
  const txt = passGive(r);
  sfx(r.coins ? 'coin' : 'chest');
  if (r.coins) notify(`Покер-пас, рівень ${t}: <span class="earn">${txt}</span>`, 'info', '🎟️');
  else {
    showModal(`<div class="chest-open"><div class="chest-rar r-legend">Рівень ${t}</div><h2>Нагорода Покер-пасу</h2><p class="pass-got">${txt}</p>
      <p class="modal-btns"><button class="btn primary" onclick="closeModal()">Чудово!</button></p></div>`);
    winFx(r.item ? 120 : 60, r.item ? 'royal' : Prof.equip.fx);
  }
  renderPass();
}
function passClaimAll() {
  const p = passState();
  const out = passSettle(p);
  if (!out.length) return;
  sfx('chest'); winFx(90);
  showModal(`<div class="chest-open"><h2>🎟️ Нагороди отримано</h2><div class="pass-got-list">${out.map(x => `<div>${x}</div>`).join('')}</div>
    <p class="modal-btns"><button class="btn primary" onclick="closeModal()">Чудово!</button></p></div>`);
  renderPass();
}

// ---------- Сторінка пасу ----------
function renderPass() {
  const el = $('view-pass');
  const p = passState();
  const sn = seasonNow();
  const s = seasonDef(p.s), sum = premSummary(p.s);
  const tier = passTier(p);
  const inTier = tier >= PASS_TIERS ? PASS_TIER_PTS : p.pts - tier * PASS_TIER_PTS;
  const left = sn.end - Date.now();
  const hurry = left < 3 * 864e5;
  const claim = passClaimable(p);
  const cell = (t, prem) => {
    const r = passReward(t, prem, p.s), l =rewardLabel(r);
    const got = (prem ? p.cp : p.cf).includes(t);
    const reached = t <= tier;
    const lockedPrem = prem && !p.prem;
    let st, act = '';
    if (got) st = 'got';
    else if (reached && !lockedPrem) { st = 'ready'; act = `onclick="passClaim(${t},${prem})"`; }
    else st = lockedPrem ? 'plock' : 'wait';
    return `<button class="ps-cell ${prem ? 'prem' : 'free'} ${st} ${l.ex ? 'ex' : ''}" ${act} ${st === 'ready' ? '' : 'tabindex="-1"'}>
      <span class="ps-i">${l.i}</span><span class="ps-t">${l.t}</span>
      <span class="ps-s">${got ? '✓' : st === 'ready' ? '<span class="d-only">Забрати</span><span class="m-only">🎁</span>' : lockedPrem ? '🔒' : ''}</span></button>`;
  };
  let rows = '';
  for (let t = 1; t <= PASS_TIERS; t++) {
    rows += `<div class="ps-row ${t <= tier ? 'reached' : ''} ${t === tier + 1 ? 'next' : ''}" id="ps-${t}">
      <div class="ps-n">${t}</div>${cell(t, false)}${cell(t, true)}</div>`;
  }
  // анонс наступного сезону: що в ньому буде, щоб відкладати монети заздалегідь
  const nx = seasonNow(new Date(sn.end + 36e5));
  const nd = seasonDef(nx.id);
  const nextHTML = `<div class="ps-next mcard"><div class="ps-shop-t"><b>🔜 Наступний сезон: ${nd.icon} ${nd.n}</b>
      <small class="muted">Старт ${new Date(sn.end).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}${nd.d ? ' · ' + nd.d : ''}</small></div>
      ${seasonPreview(nx.id, 'ps-exs ps-exs-next')}
      <small class="muted">Відкладіть ${fmt(PASS_PRICE)} 🪙 на преміум — ці предмети будуть лише в тому сезоні.</small></div>`;
  const soon = left < 7 * 864e5;
  el.innerHTML = `<div class="page-wrap pass">
    <div class="ps-head mcard">
      <div class="ps-season"><span class="ps-si">${s.icon}</span><div><small class="muted">Сезон</small><h2>${s.n}</h2>${s.d ? `<small class="ps-d">${s.d}</small>` : ''}
        <span class="ps-left ${hurry ? 'hurry' : ''}">⏳ До кінця: <b id="ps-timer">${passLeftText(left)}</b></span></div></div>
      <div class="ps-lvl"><div class="ps-big">${tier}<small>/${PASS_TIERS}</small></div>
        <div class="ps-bar"><i style="width:${Math.round(inTier / PASS_TIER_PTS * 100)}%"></i></div>
        <small class="muted">${tier >= PASS_TIERS ? 'Сезон пройдено! 🏅' : `⭐ ${inTier} / ${PASS_TIER_PTS} до рівня ${tier + 1}`}</small></div>
    </div>
    ${p.prem ? `<div class="banner ps-prem-on"><span class="bn-i">👑</span><div><b>Преміум активний</b><br><small class="muted">Забирайте нагороди обох доріжок.</small></div></div>`
      : `<div class="ps-shop mcard"><div class="ps-shop-t"><b>👑 Преміум-доріжка</b><small class="muted">${sum.items} сезонних ексклюзивів · ${sum.chests} скринь · ${fmt(sum.coins)} 🪙</small></div>
        ${seasonPreview(p.s)}
        <button class="btn primary big" onclick="passBuyAsk()">Відкрити за ${fmt(PASS_PRICE)} 🪙</button>
        <small class="muted ps-fomo">${hurry ? '🔥 Сезон скоро закінчиться — ексклюзиви зникнуть!' : 'Ексклюзиви сезону зникнуть, коли сезон закінчиться.'}</small></div>`}
    ${soon ? nextHTML : ''}
    ${claim ? `<button class="btn primary big ps-all" onclick="passClaimAll()">🎁 Забрати все (${claim})</button>` : ''}
    <details class="ps-how mcard"><summary>⭐ Як заробляти зірки</summary><div class="ps-how-l">
      <span>🃏 Роздача +${PASS_PTS.hand}</span><span>🏆 Виграний банк +${PASS_PTS.win}</span><span>🪙 Гра на монети/турнір +${PASS_PTS.real}</span>
      <span>🎯 Правильна відповідь +${PASS_PTS.quiz}</span><span>📋 Завдання дня +${PASS_PTS.quest}</span><span>🌟 Усі завдання +${PASS_PTS.allQuests}</span>
      <span>📘 Урок +${PASS_PTS.lesson}</span><span>🎁 Щоденний бонус +${PASS_PTS.daily}</span><span>🏟️ Турнір +${PASS_PTS.tourney}</span>
      <span>🗺️ Дуель у Кар’єрі +${PASS_PTS.career} (перемога +${PASS_PTS.career + PASS_PTS.careerWin})</span></div></details>
    <div class="ps-track">
      <div class="ps-row ps-hrow"><div class="ps-n">Рів.</div><div>🆓 Безкоштовно</div><div>👑 Преміум</div></div>
      ${rows}
    </div>
    ${soon ? '' : nextHTML}
  </div>`;
  replay(el.firstElementChild, 'fade-in');
  const target = $('ps-' + Math.max(1, Math.min(PASS_TIERS, tier)));
  if (target && tier > 3) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
}

// Таймер сезону на сторінці
setInterval(() => {
  const t = document.getElementById('ps-timer');
  if (!t || !$('view-pass').classList.contains('active')) return;
  const left = seasonNow().end - Date.now();
  if (left <= 0 || Prof.pass && Prof.pass.s !== seasonNow().id) renderPass(); else t.textContent = passLeftText(left);
}, 30000);
