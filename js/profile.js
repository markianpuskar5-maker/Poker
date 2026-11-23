// ===== Профіль гравця: монети, досвід, статистика, досягнення, бонуси =====

const PROFILE_KEY = 'poker_profile_v1';
const START_COINS = 2000;
const BROKE_LINE = 200;             // менше — гравець «на мілині» і може отримати допомогу
const RESCUE_AMOUNT = 500;
const RESCUE_CD = 10 * 60 * 1000;   // допомога — не частіше ніж раз на 10 хвилин
const QUIZ_COIN = 10;               // за правильну відповідь у тренуванні
const QUIZ_STREAK_BONUS = 20;       // за кожні 5 правильних поспіль
const QUIZ_DAILY_CAP = 500;         // ліміт монет з тренування на день
const LESSON_COIN = 50;
const DAILY_REWARDS = [150, 200, 250, 300, 400, 500, 700];

function defaultProfile() {
  return {
    name: 'Гравець',
    coins: START_COINS,
    xp: 0,
    owned: { back: ['classic'], felt: ['green'], chips: ['classic'], avatar: ['🙂'], frame: ['none'], title: ['none'], fx: ['confetti'] },
    equip: { back: 'classic', felt: 'green', chips: 'classic', avatar: '🙂', frame: 'none', title: 'none', fx: 'confetti' },
    stats: { hands: 0, won: 0, biggest: 0, bestCat: -1, cashHands: 0, cashProfit: 0, quizRight: 0, quizBest: 0, great: 0, sessions: 0, bought: 0, chests: 0 },
    ach: {},
    daily: { last: '', streak: 0 },
    quizDay: { d: '', n: 0 },
    rescueAt: 0,
    seat: null,         // { table, chips } — фішки на кеш-столі (на випадок закриття вкладки)
    lessonsPaid: [],
  };
}

function mergeInto(base, src) {
  for (const k in src) {
    const v = src[k];
    const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
    if (isObj(v) && isObj(base[k])) mergeInto(base[k], v);
    else base[k] = v;
  }
  return base;
}

const Prof = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    return raw ? mergeInto(defaultProfile(), raw) : defaultProfile();
  } catch { return defaultProfile(); }
})();

function saveProfile() { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(Prof)); } catch { } }

const fmt = n => Math.round(n).toLocaleString('uk-UA');
const todayStr = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

// ---------- Рівні ----------
function xpForLevel(l) { return 50 * (l - 1) * l; } // 2→100, 3→300, 4→600, 5→1000 …
function levelOf(xp) { let l = 1; while (xp >= xpForLevel(l + 1)) l++; return l; }
function myLevel() { return levelOf(Prof.xp); }
function levelProgress() {
  const l = myLevel(), a = xpForLevel(l), b = xpForLevel(l + 1);
  return { l, cur: Prof.xp - a, need: b - a, k: (Prof.xp - a) / (b - a) };
}

function addXp(n) {
  if (!n) return;
  const before = myLevel();
  Prof.xp += n;
  const after = myLevel();
  if (after > before) {
    let bonus = 0;
    for (let l = before + 1; l <= after; l++) bonus += l * 100;
    Prof.coins += bonus;
    saveProfile();
    const opened = TABLES.filter(t => t.lvl > before && t.lvl <= after);
    notify(`<b>Новий рівень: ${after}!</b><br>Нагорода: <span class="earn">+${fmt(bonus)} 🪙</span>${opened.length ? `<br>Відкрито стіл: ${opened.map(t => t.icon + ' ' + t.name).join(', ')}` : ''}`, 'level', '⭐');
    updateWalletUI(bonus);
    if (after >= 5) unlockAch('level_5');
  }
  saveProfile();
  updateHud();
}

// ---------- Монети ----------
function addCoins(n) {
  if (!n) return;
  Prof.coins += n;
  saveProfile();
  updateWalletUI(n);
}
function spendCoins(n) {
  if (n <= 0) return true;
  if (Prof.coins < n) return false;
  Prof.coins -= n;
  saveProfile();
  updateWalletUI(-n);
  return true;
}

// Фішки на кеш-столі зберігаються в профілі: закрили вкладку — фішки повернуться
function syncSeat() {
  if (!G.table || !G.table.cash || !Prof.seat || !G.players[0]) return;
  Prof.seat.chips = G.players[0].chips;
  saveProfile();
}
function recoverSeat() {
  if (!Prof.seat) return;
  const c = Prof.seat.chips || 0;
  Prof.seat = null;
  Prof.coins += c;
  saveProfile();
  if (c > 0) setTimeout(() => notify(`Повернено <b>${fmt(c)} 🪙</b> з незавершеної гри за столом.`, 'info', '↩️'), 500);
}
// Гру закрили посеред турніру — повертаємо половину внеску
function recoverTourney() {
  if (!Prof.tourney) return;
  const back = Math.round((Prof.tourney.buy || 0) / 2);
  Prof.tourney = null;
  Prof.coins += back;
  saveProfile();
  if (back) setTimeout(() => notify(`Турнір перервано, бо гру було закрито. Повернено половину внеску: <b>${fmt(back)} 🪙</b>.`, 'warn', '🏟️'), 700);
}

// ---------- Допомога при банкрутстві ----------
function isBroke() {
  const tableChips = G.table && G.table.cash && G.players[0] ? G.players[0].chips : 0;
  return Prof.coins + tableChips < BROKE_LINE;
}
function rescueLeft() { return Math.max(0, Prof.rescueAt + RESCUE_CD - Date.now()); }
function claimRescue() {
  if (!isBroke() || rescueLeft() > 0) return;
  Prof.rescueAt = Date.now();
  addCoins(RESCUE_AMOUNT);
  notify(`Фонд підтримки гравців: <span class="earn">+${RESCUE_AMOUNT} 🪙</span><br>Почніть з дешевшого столу і грайте обережніше!`, 'info', '🤝');
  if (typeof renderMenu === 'function') renderMenu();
}

// ---------- Щоденний бонус ----------
function dailyState() {
  const t = todayStr(), y = todayStr(new Date(Date.now() - 864e5));
  if (Prof.daily.last === t) return { can: false, streak: Prof.daily.streak };
  const streak = Prof.daily.last === y ? Prof.daily.streak + 1 : 1;
  return { can: true, streak, reward: DAILY_REWARDS[Math.min(streak, 7) - 1] };
}
function claimDaily() {
  const d = dailyState();
  if (!d.can) return;
  Prof.daily = { last: todayStr(), streak: d.streak };
  addCoins(d.reward);
  addXp(20);
  notify(`Щоденний бонус (день ${d.streak}): <span class="earn">+${d.reward} 🪙</span>`, 'info', '🎁');
  if (typeof winFx === 'function') winFx(50);
  renderMenu();
}

// ---------- Досягнення ----------
const ACHIEVEMENTS = [
  { id: 'first_hand', icon: '🃏', t: 'Перша роздача', d: 'Зіграйте першу роздачу', r: 50 },
  { id: 'first_win', icon: '🏆', t: 'Перший банк', d: 'Виграйте будь-який банк', r: 100 },
  { id: 'hands_100', icon: '💯', t: 'Завсідник', d: 'Зіграйте 100 роздач', r: 500, goal: s => [s.hands, 100] },
  { id: 'hands_500', icon: '🎖️', t: 'Ветеран', d: 'Зіграйте 500 роздач', r: 1500, goal: s => [s.hands, 500] },
  { id: 'big_pot', icon: '💰', t: 'Великий банк', d: 'Виграйте за раз щонайменше 50 великих блайндів', r: 300 },
  { id: 'bluff', icon: '🎭', t: 'Блефувальник', d: 'Заберіть банк без вскриття, маючи лише старшу карту', r: 200 },
  { id: 'flush', icon: '♦️', t: 'Масть іде', d: 'Виграйте вскриття з флешем або сильніше', r: 200 },
  { id: 'quads', icon: '🎲', t: 'Каре!', d: 'Зберіть каре або стріт-флеш', r: 500 },
  { id: 'royal', icon: '👑', t: 'Роял-флеш', d: 'Зберіть найсильнішу руку в покері', r: 5000 },
  { id: 'lessons', icon: '🎓', t: 'Випускник', d: 'Пройдіть усі уроки', r: 300 },
  { id: 'quiz_50', icon: '🎯', t: 'Влучний', d: '50 правильних відповідей у тренуванні', r: 300, goal: s => [s.quizRight, 50] },
  { id: 'streak_10', icon: '🔥', t: 'У вогні', d: 'Серія з 10 правильних відповідей поспіль', r: 200 },
  { id: 'great_10', icon: '🌟', t: 'Учень тренера', d: 'Отримайте 10 оцінок «Відмінно» від тренера', r: 300, goal: s => [s.great, 10] },
  { id: 'cash_first', icon: '🪙', t: 'Справжня гра', d: 'Сядьте за стіл на монети', r: 100 },
  { id: 'high', icon: '🎩', t: 'Хайролер', d: 'Сядьте за стіл «Хайролер» або VIP', r: 1000 },
  { id: 'shop_5', icon: '🛍️', t: 'Модник', d: 'Купіть 5 предметів у магазині', r: 300, goal: s => [s.bought, 5] },
  { id: 'shop_15', icon: '🧳', t: 'Колекціонер', d: 'Зберіть 15 предметів', r: 800, goal: s => [s.bought, 15] },
  { id: 'shop_40', icon: '🏛️', t: 'Магнат', d: 'Зберіть 40 предметів', r: 3000, goal: s => [s.bought, 40] },
  { id: 'chest_1', icon: '🗝️', t: 'Щасливий ключ', d: 'Відкрийте першу скриню', r: 100 },
  { id: 'tourney_win', icon: '🏟️', t: 'Чемпіон', d: 'Виграйте турнір', r: 500 },
  { id: 'level_5', icon: '⭐', t: 'Досвідчений', d: 'Досягніть 5 рівня', r: 250 },
];

function unlockAch(id) {
  if (Prof.ach[id]) return;
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return;
  Prof.ach[id] = Date.now();
  Prof.coins += a.r;
  saveProfile();
  updateWalletUI(a.r);
  notify(`<b>Досягнення: ${a.t}</b><br>${a.d}<br><span class="earn">+${fmt(a.r)} 🪙</span>`, 'ach', a.icon);
}
function checkGoalAch() {
  ACHIEVEMENTS.forEach(a => {
    if (!a.goal || Prof.ach[a.id]) return;
    const [v, g] = a.goal(Prof.stats);
    if (v >= g) unlockAch(a.id);
  });
}

// ---------- Події з гри / тренування / уроків ----------
function onHandEnd(r) {
  const s = Prof.stats;
  s.hands++;
  if (r.won) s.won++;
  if (r.received > s.biggest) s.biggest = r.received;
  if (r.cat > s.bestCat) s.bestCat = r.cat;
  if (r.cash) { s.cashHands++; s.cashProfit += r.diff; }
  saveProfile();
  addXp((r.cash ? 6 : 4) + (r.won ? 6 : 0));
  unlockAch('first_hand');
  if (r.won) unlockAch('first_win');
  if (r.won && r.received >= r.bb * 50) unlockAch('big_pot');
  if (r.bluff) unlockAch('bluff');
  if (r.won && r.showdown && r.cat >= 5) unlockAch('flush');
  if (r.cat >= 7) unlockAch('quads');
  if (r.royal) unlockAch('royal');
  checkGoalAch();
}

function onDecision(g) {
  if (g === 'great') Prof.stats.great++;
  saveProfile();
  addXp({ great: 5, good: 3, ok: 1 }[g] || 0);
  checkGoalAch();
}

function quizEarnedToday() { return Prof.quizDay.d === todayStr() ? Prof.quizDay.n : 0; }

function onQuiz(ok, streak) {
  if (typeof gameEvent === 'function') gameEvent('quiz', { ok, streak });
  if (!ok) return 0;
  const s = Prof.stats;
  s.quizRight++;
  if (streak > s.quizBest) s.quizBest = streak;
  if (Prof.quizDay.d !== todayStr()) Prof.quizDay = { d: todayStr(), n: 0 };
  const want = QUIZ_COIN + (streak > 0 && streak % 5 === 0 ? QUIZ_STREAK_BONUS : 0);
  const earn = Math.max(0, Math.min(want, QUIZ_DAILY_CAP - Prof.quizDay.n));
  Prof.quizDay.n += earn;
  Prof.coins += earn;
  saveProfile();
  if (earn) updateWalletUI(earn);
  addXp(4);
  if (streak >= 10) unlockAch('streak_10');
  checkGoalAch();
  return earn;
}

function onLessonDone(i) {
  if (Prof.lessonsPaid.includes(i)) return;
  Prof.lessonsPaid.push(i);
  if (typeof gameEvent === 'function') gameEvent('lesson', { i });
  Prof.coins += LESSON_COIN;
  saveProfile();
  updateWalletUI(LESSON_COIN);
  addXp(30);
  if (lessonDone().length >= LESSONS.length) unlockAch('lessons');
}

// ---------- Сповіщення ----------
function notify(html, kind = 'info', icon = 'ℹ️') {
  const box = document.getElementById('toasts');
  if (!box) return;
  const t = document.createElement('div');
  t.className = 'toast t-' + kind;
  t.innerHTML = `<div class="toast-i">${icon}</div><div class="toast-b">${html}</div>`;
  if (typeof sfx === 'function') {
    if (kind === 'ach') { sfx('ach'); buzz('ach'); }
    else if (kind === 'level') { sfx('level'); buzz('ach'); }
  }
  const close = () => { if (!t.isConnected) return; t.classList.add('out'); setTimeout(() => t.remove(), 320); };
  t.onclick = close;
  if (typeof swipeToDismiss === 'function') swipeToDismiss(t, () => t.remove());
  box.appendChild(t);
  setTimeout(close, kind === 'ach' || kind === 'level' ? 6500 : 4500);
  // на телефоні — не більше двох сповіщень одночасно
  const max = matchMedia('(max-width: 700px)').matches ? 2 : 4;
  while (box.children.length > max) box.firstChild.remove();
}

// ---------- Верхня панель: рівень і гаманець ----------
function updateHud() {
  const lp = levelProgress();
  const lv = document.getElementById('hud-lvl');
  if (lv) {
    lv.innerHTML = `<span class="lv-n">${lp.l}</span><span class="lv-bar"><i style="width:${Math.round(lp.k * 100)}%"></i></span>`;
    lv.title = `Рівень ${lp.l}: ${lp.cur} / ${lp.need} досвіду`;
  }
  const w = document.getElementById('wallet-v');
  if (w) w.textContent = fmt(Prof.coins);
  const av = document.getElementById('hud-av');
  if (av) av.textContent = Prof.equip.avatar;
}

function updateWalletUI(delta) {
  updateHud();
  if (typeof progressTick === 'function') progressTick();
  const w = document.getElementById('wallet');
  if (!w || !delta) return;
  bump(w);
  const d = document.createElement('span');
  d.className = 'wallet-delta ' + (delta > 0 ? 'pos' : 'neg');
  d.textContent = (delta > 0 ? '+' : '−') + fmt(Math.abs(delta));
  w.appendChild(d);
  setTimeout(() => d.remove(), 1500);
}
