// ===== Кар'єра: турне містами, дуелі один на один з босами =====
// Кожне місто — бос зі своїм стилем гри. Перша перемога дає ексклюзивний предмет,
// якого немає в магазині, і відкриває наступне місто.

const CAREER_STACK = 1000;
const CAREER_LEVEL_HANDS = 5;
const CAREER_FIRST_K = 2.5;   // перша перемога: приз = внесок × 2.5
const CAREER_REPEAT_K = 1.8;  // повторна перемога

const CAREER = [
  {
    id: 'vin', city: 'Вінниця', icon: '🏘️', fee: 300, lvl: 1, skill: 0.28,
    boss: { name: 'Дядько Петро', avatar: '👴', sex: 'm', style: 'Скеля', hello: 'Сорок років граю, синку. Тузи — от і вся стратегія.',
      traits: { tight: 0.93, aggr: 0.3, bluff: 0.02, sticky: 0.05, trap: 0.1 } },
    bio: 'Пенсіонер, що грає вже сорок років і заходить у банк лише з дуже сильними картами.',
    tip: 'Скеля майже не блефує. Частіше піднімайте ставки, щоб забирати його блайнди. А коли він сам ставить або рейзить — скидайте все, крім дуже сильних рук.',
    reward: [{ cat: 'avatar', id: '🗿', n: 'Кам’яний ідол' }],
  },
  {
    id: 'kyiv', city: 'Київ', icon: '🌰', fee: 800, lvl: 2, skill: 0.36,
    boss: { name: 'Оксана Вихор', avatar: '💃', sex: 'f', style: 'Маніячка', hello: 'Сподіваюсь, ти не боїшся великих ставок? 😈',
      traits: { tight: 0.1, aggr: 0.96, bluff: 0.45, sticky: 0.2, tiltProne: 1 } },
    bio: 'Ставить і рейзить майже з будь-якими картами. Тисне так, що новачки скидають навіть добрі руки.',
    tip: 'Не намагайтеся її перерейзити блефом. Чекайте на непогану руку (пара, туз із сильною карткою) і дайте їй ставити самій — колл виграє більше, ніж фолд.',
    reward: [{ cat: 'frame', id: 'kyiv', n: 'Каштанова' }],
  },
  {
    id: 'lviv', city: 'Львів', icon: '☕', fee: 1500, lvl: 3, skill: 0.45,
    boss: { name: 'Пан Станіслав', avatar: '🧐', sex: 'm', style: 'Пастка', hello: 'Кава готова, карти роздано. Прошу, пане.',
      traits: { trap: 0.8, tight: 0.62, aggr: 0.45, bluff: 0.1, sticky: 0.1 } },
    bio: 'Ввічливий і тихий. Із сильною рукою любить чекати — і раптово рейзить, коли ви вже вклали фішки.',
    tip: 'Якщо він довго чекав, а потім різко поставив — у нього майже завжди є щось сильне. Не роздувайте банк зі слабкою парою.',
    reward: [{ cat: 'back', id: 'lviv', n: 'Львівська кава' }],
  },
  {
    id: 'odesa', city: 'Одеса', icon: '⚓', fee: 3000, lvl: 4, skill: 0.52,
    boss: { name: 'Моряк Жора', avatar: '🧑‍✈️', sex: 'm', style: 'Липучка', hello: 'Шо, будемо грати чи будемо дивитися? Я все одно доплачу!',
      traits: { sticky: 0.8, aggr: 0.2, bluff: 0.03, tight: 0.25 } },
    bio: 'Доплачує майже завжди — «а раптом прийде». Блефувати проти нього марно.',
    tip: 'Ніколи не блефуйте проти Липучки. Зате з сильною рукою ставте більше: він заплатить. Ставки на розмір банку — ваш найкращий друг.',
    reward: [{ cat: 'felt', id: 'odesa', n: 'Чорне море' }],
  },
  {
    id: 'praha', city: 'Прага', icon: '🏰', fee: 5000, lvl: 5, skill: 0.62,
    boss: { name: 'Магда Ілюзія', avatar: '🧝‍♀️', sex: 'f', style: 'Блеферка', hello: 'Повір мені… або ні. В цьому й уся магія ✨',
      traits: { bluff: 0.55, aggr: 0.8, tight: 0.45, sticky: 0.05 } },
    bio: 'Чарівниця столу: часто ставить без нічого і чудово розповідає історію ставками.',
    tip: 'Ловіть її на блефі: з середньою рукою (пара) частіше доплачуйте, особливо на рівері. Але після трьох ставок поспіль вона буває чесною.',
    reward: [{ cat: 'fx', id: 'magic', n: 'Фокус-покус', e: '🪄' }],
  },
  {
    id: 'monaco', city: 'Монако', icon: '🛥️', fee: 8000, lvl: 6, skill: 0.74,
    boss: { name: 'Барон фон Пот', avatar: '🤵', sex: 'm', style: 'Математик', hello: 'Ймовірності на моєму боці. Почнемо?',
      traits: { tight: 0.6, aggr: 0.62, bluff: 0.16, sticky: 0.02, tiltProne: 0.15 } },
    bio: 'Рахує шанси банку і майже не помиляється. На емоції не піддається.',
    tip: 'Проти математика не працюють хитрощі — працює дисципліна. Грайте сильні руки, рахуйте шанси банку і використовуйте позицію дилера.',
    reward: [{ cat: 'chips', id: 'monaco', n: 'Монакські' }],
  },
  {
    id: 'vegas', city: 'Лас-Вегас', icon: '🎰', fee: 12000, lvl: 8, skill: 0.82,
    boss: { name: 'Текс «Акула»', avatar: '🕴️', sex: 'm', style: 'Акула', hello: 'У Вегасі вас роздягнуть до нитки. Але я — швидше.',
      traits: { tight: 0.55, aggr: 0.86, bluff: 0.25, sticky: 0, tiltProne: 0.2 } },
    bio: 'Агресивний професіонал: помічає ваші звички й тисне саме туди, де ви слабкі.',
    tip: 'Акула пам’ятає, як ви граєте. Змінюйте темп: іноді доплачуйте замість рейзу з сильною рукою і не скидайте завжди на його ставку.',
    reward: [{ cat: 'title', id: 'vegas', n: 'Гроза Вегасу', c: '#f43f5e' }],
  },
  {
    id: 'macau', city: 'Макао', icon: '🏮', fee: 20000, lvl: 10, skill: 0.9,
    boss: { name: 'Майстер Лі', avatar: '🧘', sex: 'm', style: 'Легенда', hello: 'Ти пройшов довгий шлях. Покажи, чого навчився.',
      traits: { tight: 0.62, aggr: 0.75, bluff: 0.2, sticky: 0, trap: 0.3, tiltProne: 0.1 } },
    bio: 'Фінальний бос. Поєднує все: терпіння, агресію, пастки й холодний розрахунок.',
    tip: 'Тут знадобиться все, чого ви навчилися. Не поспішайте, бережіть фішки, коли блайнди малі, і грайте сміливіше, коли вони ростуть.',
    reward: [{ cat: 'avatar', id: '🐲', n: 'Дракон Макао' }, { cat: 'title', id: 'world', n: 'Чемпіон світу', c: '#fde047' }],
  },
];

// Ексклюзивні предмети кар'єри — в магазині (лише коли вже виграні)
CAREER.forEach(c => c.reward.forEach(r => {
  const it = { id: r.id, n: r.n, price: 0, ex: 'career' };
  if (r.c) it.c = r.c;
  if (r.e) it.e = r.e;
  SHOP[r.cat].items.push(it);
}));
FX_KINDS.magic = { emoji: ['🪄', '✨', '🔮', '🎩', '🐇'] };

function careerState() {
  if (!Prof.career || typeof Prof.career !== 'object') Prof.career = { beat: {} };
  if (!Prof.career.beat) Prof.career.beat = {};
  return Prof.career;
}
const careerBeat = id => careerState().beat[id] || 0;
const careerBeatCount = () => CAREER.filter(c => careerBeat(c.id) > 0).length;
// Місто відкрите, якщо переможено попереднього боса
const careerOpenCity = i => i === 0 || careerBeat(CAREER[i - 1].id) > 0;
const careerPrize = c => Math.round(c.fee * (careerBeat(c.id) ? CAREER_REPEAT_K : CAREER_FIRST_K) / 10) * 10;

function careerRewardHTML(c, big = false) {
  return c.reward.map(r => {
    const it = findItem(r.cat, r.id);
    if (!it) return '';
    if (!big) return itemChip(r.cat, it);
    return `<div class="cr-prize"><div class="sp">${shopPreview(r.cat, it)}</div><b>${it.n}</b><small class="muted">${SHOP[r.cat].icon} ${SHOP[r.cat].title}</small></div>`;
  }).join('');
}

// ---------- Сторінка кар'єри ----------
function renderCareer() {
  const el = $('view-career');
  const lvl = myLevel();
  const beatN = careerBeatCount();
  let curIdx = CAREER.findIndex((c, i) => careerOpenCity(i) && !careerBeat(c.id));
  const nodes = CAREER.map((c, i) => {
    const beat = careerBeat(c.id);
    const open = careerOpenCity(i);
    const lowLvl = open && lvl < c.lvl;
    const state = beat ? 'done' : !open ? 'locked' : lowLvl ? 'lvl' : 'open';
    let btn;
    if (G.table && G.table.career === c.id) btn = `<button class="btn primary small" onclick="event.stopPropagation();showView('play')">Повернутися ▶</button>`;
    else if (state === 'locked') btn = `<span class="cr-lock">🔒 Спершу переможіть боса в місті ${CAREER[i - 1].city}</span>`;
    else if (state === 'lvl') btn = `<span class="cr-lock">🔒 Потрібен рівень ${c.lvl}</span>`;
    else btn = `<button class="btn small ${beat ? '' : 'primary'}" onclick="event.stopPropagation();careerOpen('${c.id}')">${beat ? 'Реванш' : 'Кинути виклик'} · ${fmt(c.fee)} 🪙</button>`;
    return `<div class="cr-node cr-${state} ${i === curIdx ? 'cr-cur' : ''}" ${state === 'locked' ? '' : `onclick="careerOpen('${c.id}')"`}>
      <div class="cr-pin"><span>${c.icon}</span>${beat ? '<i>✓</i>' : ''}</div>
      <div class="cr-body">
        <div class="cr-top"><b class="cr-city">${i + 1}. ${c.city}</b>${beat ? `<small class="cr-wins">перемог: ${beat}</small>` : ''}</div>
        <div class="cr-boss"><span class="cr-bav">${state === 'locked' ? '❔' : c.boss.avatar}</span><div><b>${state === 'locked' ? '???' : c.boss.name}</b><span class="cr-style">${c.boss.style}</span></div></div>
        <div class="cr-rew"><small class="muted">${beat ? 'Здобуто:' : 'Нагорода:'}</small>${careerRewardHTML(c)}<span class="item-chip coin-chip">🪙 ${fmt(careerPrize(c))}</span></div>
        ${btn}
      </div>
    </div>`;
  }).join('');
  el.innerHTML = `<div class="page-wrap career">
    <div class="page-head"><div><h2>🗺️ Кар’єра</h2><p class="muted">Турне містами: дуелі один на один з босами. Перемога відкриває наступне місто і дає ексклюзивний предмет, якого немає в магазині.</p></div>
      <div class="balance-big"><span class="coin"></span>${fmt(Prof.coins)}</div></div>
    <div class="cr-prog mcard"><div><b>Переможено босів: ${beatN} / ${CAREER.length}</b><div class="xpbar"><i style="width:${Math.round(beatN / CAREER.length * 100)}%"></i></div></div>
      <small class="muted">${curIdx >= 0 ? `Наступна ціль: ${CAREER[curIdx].icon} ${CAREER[curIdx].city} — внесок ${fmt(CAREER[curIdx].fee)} 🪙` : beatN === CAREER.length ? '🏆 Ви пройшли все турне! Реванші приносять монети.' : ''}</small></div>
    <div class="cr-route">${nodes}</div>
  </div>`;
  replay(el.firstElementChild, 'fade-in');
  const cur = el.querySelector('.cr-cur');
  if (cur && beatN > 1) setTimeout(() => cur.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
}

// Вікно боса: хто він, як його обіграти, що на кону
function careerOpen(id) {
  const i = CAREER.findIndex(c => c.id === id);
  const c = CAREER[i];
  if (!c || !careerOpenCity(i)) return;
  const beat = careerBeat(id);
  const lowLvl = myLevel() < c.lvl;
  const poor = Prof.coins < c.fee;
  let btn;
  if (G.table && G.table.career === id) btn = `<button class="btn primary big" onclick="closeModal();showView('play')">Повернутися до дуелі ▶</button>`;
  else if (G.table) btn = `<button class="btn" disabled>Спершу встаньте з-за іншого столу</button>`;
  else if (lowLvl) btn = `<button class="btn" disabled>🔒 Потрібен рівень ${c.lvl}</button>`;
  else if (poor) btn = `<button class="btn" disabled>Потрібно ${fmt(c.fee)} 🪙 (є ${fmt(Prof.coins)})</button>`;
  else btn = `<button class="btn primary big" onclick="careerStart('${id}')">⚔️ ${beat ? 'Реванш' : 'До бою'} · ${fmt(c.fee)} 🪙</button>`;
  showModal(`<div class="cr-modal">
    <div class="cr-mhead"><span class="cr-mav">${c.boss.avatar}</span><div><small class="muted">${c.icon} ${c.city}</small><h2>${c.boss.name}</h2><span class="cr-style">${c.boss.style}</span></div></div>
    <p class="cr-quote">«${c.boss.hello}»</p>
    <p>${c.bio}</p>
    <div class="cr-tip"><b>🎓 Порада тренера</b><p>${c.tip}</p></div>
    <div class="sum-grid"><div><span>Внесок</span><b>${fmt(c.fee)} 🪙</b></div><div><span>Приз</span><b class="pos">${fmt(careerPrize(c))} 🪙</b></div><div><span>Фішки</span><b>${fmt(CAREER_STACK)}</b></div></div>
    ${beat ? `<p class="muted">✓ Ви вже перемагали тут (${beat}×). Реванш приносить монети.</p>` : `<h3 class="cr-rh">✨ Ексклюзивна нагорода</h3><div class="cr-prizes">${careerRewardHTML(c, true)}</div>`}
    <p class="modal-btns">${btn}<button class="btn" onclick="closeModal()">Пізніше</button></p>
    <p class="muted cr-note">Дуель один на один, блайнди ростуть кожні ${CAREER_LEVEL_HANDS} роздач. Не закривайте гру до кінця — інакше повернеться лише половина внеску.</p>
  </div>`);
}

function careerStart(id) {
  const i = CAREER.findIndex(c => c.id === id);
  const c = CAREER[i];
  if (!c || G.table || !careerOpenCity(i) || myLevel() < c.lvl) return;
  if (!spendCoins(c.fee)) { notify('Недостатньо монет для внеску.', 'warn', '🪙'); return; }
  Prof.tourney = { id: 'c_' + id, buy: c.fee };
  Prof.stats.sessions++;
  saveProfile();
  closeModal();
  G.tour = { level: 0, hands: 0 };
  startTable({
    id: 'c_' + id, career: id, city: c.city, icon: c.icon, name: `${c.city}: ${c.boss.name}`,
    tourney: true, cash: false, size: 2, stack: CAREER_STACK, levelHands: CAREER_LEVEL_HANDS,
    buy: c.fee, prizes: [careerPrize(c), 0], skill: c.skill, boss: c.boss,
    sb: BLIND_LEVELS[0][0], bb: BLIND_LEVELS[0][1],
  }, CAREER_STACK);
}

// Кінець дуелі (викликається з endTourney)
function careerEnd(t, place, forfeit) {
  const c = CAREER.find(x => x.id === t.career);
  const s = G.session;
  const win = place === 1 && !forfeit;
  const first = win && !careerBeat(c.id);
  const prize = win ? t.prizes[0] : 0;
  Prof.tourney = null;
  const got = [];
  if (win) {
    careerState().beat[c.id] = careerBeat(c.id) + 1;
    Prof.stats.careerBeat = careerBeatCount();
    if (first) c.reward.forEach(r => { if (giveExclusive(r.cat, r.id)) got.push(r); });
  }
  saveProfile();
  cleanupTable();
  showView('career');
  if (prize) addCoins(prize);
  addXp(forfeit ? 5 : win ? (first ? 200 : 80) : 30);
  checkGoalAch();
  gameEvent('career', { win, first });
  if (win) { winFx(first ? 170 : 100, first ? 'royal' : Prof.equip.fx); sfx('bigwin'); buzz('bigwin'); }
  const next = CAREER[CAREER.indexOf(c) + 1];
  const items = got.map(r => {
    const it = findItem(r.cat, r.id);
    return `<div class="cr-prize got"><div class="sp">${shopPreview(r.cat, it)}</div><b>${it.n}</b>
      <button class="btn small primary" onclick="equipItem('${r.cat}','${r.id}');this.disabled=true;this.textContent='✓ Обрано'">Обрати</button></div>`;
  }).join('');
  showModal(`<div class="tour-end cr-end">
    <div class="te-medal">${forfeit ? '🏳️' : win ? '🏆' : c.boss.avatar}</div>
    <h2>${forfeit ? 'Ви здалися' : win ? `${c.boss.name} переможений!` : `${c.boss.name} цього разу сильніший`}</h2>
    <p class="muted">${c.icon} ${c.city} · ${c.boss.style}</p>
    <div class="sum-grid">
      <div><span>Роздач</span><b>${s ? s.hands : 0}</b></div>
      <div><span>Приз</span><b class="${prize ? 'pos' : ''}">${prize ? '+' + fmt(prize) + ' 🪙' : '—'}</b></div>
      <div><span>Якість рішень</span><b>${s && s.dec ? Math.round(s.good / s.dec * 100) + '%' : '—'}</b></div>
    </div>
    ${items ? `<h3 class="cr-rh">✨ Ексклюзив ваш!</h3><div class="cr-prizes">${items}</div>` : ''}
    ${first && next ? `<p>🔓 Відкрито нове місто: <b>${next.icon} ${next.city}</b>${myLevel() < next.lvl ? ` (з рівня ${next.lvl})` : ''}</p>` : ''}
    ${!win ? `<p class="cr-tip"><b>🎓 Порада:</b> ${c.tip}</p>` : ''}
    <p class="modal-btns"><button class="btn primary" onclick="closeModal()">Гаразд</button>${!win && Prof.coins >= c.fee ? `<button class="btn" onclick="careerOpen('${c.id}')">Реванш · ${fmt(c.fee)} 🪙</button>` : ''}</p>
  </div>`);
}
