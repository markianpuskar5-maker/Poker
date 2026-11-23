// ===== Щоденні завдання =====
// Щодня — 3 завдання. Виконали — монети й досвід; усі три — бонус. Одне завдання на день можна замінити.

const QUESTS = [
  { id: 'hands10', icon: '🃏', t: 'Зіграйте 10 роздач', goal: 10, r: 100, on: { hand: () => 1 } },
  { id: 'win3', icon: '🏆', t: 'Виграйте 3 банки', goal: 3, r: 150, on: { hand: e => e.won ? 1 : 0 } },
  { id: 'winBtn', icon: '🔘', t: 'Виграйте 2 банки, сидячи на дилері (баттоні)', goal: 2, r: 200, on: { hand: e => e.won && e.dealer ? 1 : 0 } },
  { id: 'twoPair', icon: '✌️', t: 'Виграйте вскриття з двома парами або сильніше', goal: 1, r: 200, on: { hand: e => e.won && e.showdown && e.cat >= 2 ? 1 : 0 } },
  { id: 'foldWeak', icon: '🧘', t: 'Правильно скиньте слабку руку на префлопі 5 разів', goal: 5, r: 150, on: { decision: e => e.street === 'preflop' && e.type === 'fold' && e.score === 'good' ? 1 : 0 } },
  { id: 'goodDec', icon: '✅', t: 'Ухваліть 8 правильних рішень (оцінка тренера)', goal: 8, r: 150, on: { decision: e => e.score === 'good' ? 1 : 0 } },
  { id: 'quiz15', icon: '🎯', t: 'Дайте 15 правильних відповідей у тренуванні', goal: 15, r: 150, on: { quiz: e => e.ok ? 1 : 0 } },
  { id: 'quizStreak', icon: '🔥', t: 'Зробіть серію з 5 правильних відповідей', goal: 1, r: 120, on: { quiz: e => e.ok && e.streak >= 5 ? 1 : 0 } },
  { id: 'bigPot', icon: '💰', t: 'Виграйте банк щонайменше 20 великих блайндів', goal: 1, r: 200, on: { hand: e => e.won && e.received >= e.bb * 20 ? 1 : 0 } },
  { id: 'cash5', icon: '🪙', t: 'Зіграйте 5 роздач на монети', goal: 5, r: 150, on: { hand: e => e.cash ? 1 : 0 }, need: () => myLevel() >= 1 },
  { id: 'steal2', icon: '🎭', t: 'Заберіть 2 банки без вскриття своєю ставкою', goal: 2, r: 180, on: { hand: e => e.won && !e.showdown && e.raised ? 1 : 0 } },
  { id: 'allinWin', icon: '💥', t: 'Виграйте роздачу, пішовши ол-ін', goal: 1, r: 220, on: { hand: e => e.won && e.allIn ? 1 : 0 } },
  { id: 'tourney1', icon: '🏟️', t: 'Зіграйте турнір', goal: 1, r: 200, on: { tourney: () => 1 } },
  { id: 'tourneyTop', icon: '🥉', t: 'Займіть призове місце в турнірі', goal: 1, r: 400, on: { tourney: e => e.prize > 0 ? 1 : 0 } },
  { id: 'lesson', icon: '📘', t: 'Пройдіть новий урок', goal: 1, r: 100, on: { lesson: () => 1 }, need: () => lessonDone().length < LESSONS.length },
  { id: 'shop', icon: '🛍️', t: 'Купіть щось у магазині або відкрийте скриню', goal: 1, r: 100, on: { buy: () => 1 } },
];
const QUEST_ALL_BONUS = 250;

function questSeed(s) { let h = 11; for (const ch of s) h = (h * 33 + ch.charCodeAt(0)) >>> 0; return h; }
function questsToday() {
  const d = todayStr();
  if (!Prof.quests || Prof.quests.d !== d) {
    const pool = QUESTS.filter(q => !q.need || q.need());
    let h = questSeed(d + Prof.name.length);
    const pickIds = [];
    while (pickIds.length < 3 && pickIds.length < pool.length) {
      const q = pool[h % pool.length];
      if (!pickIds.includes(q.id)) pickIds.push(q.id);
      h = (h * 1103515245 + 12345) >>> 0;
    }
    Prof.quests = { d, list: pickIds.map(id => ({ id, n: 0, done: false })), rerolled: false, bonus: false };
    saveProfile();
  }
  return Prof.quests;
}
const questDef = id => QUESTS.find(q => q.id === id);

function gameEvent(type, e = {}) {
  const st = questsToday();
  let changed = false;
  st.list.forEach(it => {
    if (it.done) return;
    const q = questDef(it.id);
    const f = q && q.on[type];
    if (!f) return;
    const add = f(e);
    if (!add) return;
    it.n = Math.min(q.goal, it.n + add);
    changed = true;
    if (it.n >= q.goal) {
      it.done = true;
      Prof.coins += q.r;
      saveProfile();
      updateWalletUI(q.r);
      addXp(30);
      notify(`<b>Завдання виконано!</b><br>${q.t}<br><span class="earn">+${q.r} 🪙</span>`, 'ach', q.icon);
      if (typeof sfx === 'function') { sfx('ach'); buzz('ach'); }
    }
  });
  if (changed && !st.bonus && st.list.every(x => x.done)) {
    st.bonus = true;
    Prof.coins += QUEST_ALL_BONUS;
    updateWalletUI(QUEST_ALL_BONUS);
    setTimeout(() => notify(`<b>Усі завдання дня виконано!</b><br>Бонус: <span class="earn">+${QUEST_ALL_BONUS} 🪙</span>`, 'level', '🌟'), 900);
  }
  if (changed) {
    saveProfile();
    if ($('view-menu').classList.contains('active')) renderMenu();
  }
}

function rerollQuest(i) {
  const st = questsToday();
  if (st.rerolled || st.list[i].done) return;
  const used = new Set(st.list.map(x => x.id));
  const pool = QUESTS.filter(q => !used.has(q.id) && (!q.need || q.need()));
  if (!pool.length) return;
  st.list[i] = { id: pick(pool).id, n: 0, done: false };
  st.rerolled = true;
  saveProfile();
  renderMenu();
}

function questsHTML() {
  const st = questsToday();
  const doneN = st.list.filter(x => x.done).length;
  const items = st.list.map((it, i) => {
    const q = questDef(it.id);
    if (!q) return '';
    return `<div class="quest ${it.done ? 'done' : ''}">
      <span class="q-i">${it.done ? '✅' : q.icon}</span>
      <div class="q-b"><div class="q-t">${q.t}</div>
        <div class="q-p"><span class="mini-bar"><i style="width:${Math.round(it.n / q.goal * 100)}%"></i></span><small>${it.n}/${q.goal}</small></div></div>
      <span class="q-r">${it.done ? '' : `+${q.r} 🪙`}</span>
      ${!it.done && !st.rerolled ? `<button class="q-swap" title="Замінити завдання (раз на день)" onclick="rerollQuest(${i})">↻</button>` : ''}
    </div>`;
  }).join('');
  return `<div class="mcard quests">
    <div class="mc-h">📋 Завдання дня <small class="muted">${doneN}/3 · усі три — ще +${QUEST_ALL_BONUS} 🪙</small></div>
    ${items}
  </div>`;
}
