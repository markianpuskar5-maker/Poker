// ===== Магазин: косметика, скрині-сюрпризи, пропозиція дня =====

const SHOP = {
  back: {
    title: 'Сорочки карт', icon: '🂠',
    items: [
      { id: 'classic', n: 'Класична', price: 0 },
      { id: 'navy', n: 'Нічний синій', price: 300 },
      { id: 'emerald', n: 'Смарагд', price: 400 },
      { id: 'cherry', n: 'Вишня', price: 500 },
      { id: 'carbon', n: 'Карбон', price: 700 },
      { id: 'forest', n: 'Ліс', price: 800 },
      { id: 'ice', n: 'Крига', price: 900 },
      { id: 'sunset', n: 'Захід сонця', price: 1000 },
      { id: 'pink', n: 'Рожева мрія', price: 1200 },
      { id: 'gold', n: 'Золото', price: 2000, lvl: 4 },
      { id: 'galaxy', n: 'Галактика', price: 2500, lvl: 5 },
      { id: 'neon', n: 'Неон', price: 3000, lvl: 6 },
      { id: 'lava', n: 'Лава', price: 3500, lvl: 6 },
      { id: 'royal', n: 'Королівська', price: 6000, lvl: 8 },
      { id: 'diamond', n: 'Діамантова', price: 9000, lvl: 10 },
    ],
  },
  felt: {
    title: 'Сукно столу', icon: '🟩',
    items: [
      { id: 'green', n: 'Класичне зелене', price: 0 },
      { id: 'blue', n: 'Океан', price: 500 },
      { id: 'wine', n: 'Бордо', price: 700 },
      { id: 'violet', n: 'Аметист', price: 900 },
      { id: 'red', n: 'Казино', price: 1000 },
      { id: 'orange', n: 'Помаранч', price: 1100 },
      { id: 'teal', n: 'Бірюза', price: 1200 },
      { id: 'pink', n: 'Фламінго', price: 1500 },
      { id: 'ice', n: 'Арктика', price: 1800, lvl: 2 },
      { id: 'noir', n: 'Нуар', price: 2000, lvl: 3 },
      { id: 'night', n: 'Опівніч', price: 2500, lvl: 4 },
      { id: 'space', n: 'Космос', price: 4000, lvl: 6 },
      { id: 'gold', n: 'Монако', price: 5000, lvl: 7 },
      { id: 'royal', n: 'Королівське', price: 7000, lvl: 9 },
    ],
  },
  chips: {
    title: 'Фішки', icon: '🪙',
    items: [
      { id: 'classic', n: 'Класичні', price: 0 },
      { id: 'mono', n: 'Чорно-білі', price: 400 },
      { id: 'pastel', n: 'Пастель', price: 600 },
      { id: 'ocean', n: 'Морські', price: 800 },
      { id: 'neon', n: 'Неонові', price: 1200 },
      { id: 'fire', n: 'Вогняні', price: 1500, lvl: 3 },
      { id: 'gold', n: 'Золоті', price: 3000, lvl: 5 },
      { id: 'royal', n: 'Королівські', price: 5000, lvl: 8 },
    ],
  },
  avatar: {
    title: 'Аватари', icon: '🙂',
    items: [
      { id: '🙂', n: 'Усмішка', price: 0 },
      { id: '😎', n: 'Крутий', price: 150 },
      { id: '🤓', n: 'Відмінник', price: 150 },
      { id: '🐱', n: 'Кіт', price: 200 },
      { id: '🐶', n: 'Пес', price: 200 },
      { id: '🤠', n: 'Ковбой', price: 250 },
      { id: '🐵', n: 'Мавпочка', price: 250 },
      { id: '🦊', n: 'Лис', price: 300 },
      { id: '🐼', n: 'Панда', price: 300 },
      { id: '🐸', n: 'Жабка', price: 300 },
      { id: '🐧', n: 'Пінгвін', price: 300 },
      { id: '🐨', n: 'Коала', price: 350 },
      { id: '🦉', n: 'Сова', price: 400 },
      { id: '🤡', n: 'Клоун', price: 500 },
      { id: '🐯', n: 'Тигр', price: 500 },
      { id: '🐺', n: 'Вовк', price: 600 },
      { id: '🤖', n: 'Робот', price: 600 },
      { id: '🦅', n: 'Орел', price: 700 },
      { id: '🐙', n: 'Восьминіг', price: 800 },
      { id: '🧙', n: 'Чарівник', price: 900 },
      { id: '🧛', n: 'Вампір', price: 900 },
      { id: '🎅', n: 'Санта', price: 1000 },
      { id: '🥷', n: 'Ніндзя', price: 1000, lvl: 2 },
      { id: '🦁', n: 'Лев', price: 1200, lvl: 3 },
      { id: '🧑‍🚀', n: 'Астронавт', price: 1200, lvl: 3 },
      { id: '🦄', n: 'Єдиноріг', price: 1500, lvl: 3 },
      { id: '🦹', n: 'Лиходій', price: 1500, lvl: 3 },
      { id: '💀', n: 'Череп', price: 1800, lvl: 4 },
      { id: '👽', n: 'Прибулець', price: 2000, lvl: 4 },
      { id: '🦖', n: 'Динозавр', price: 2000, lvl: 4 },
      { id: '🦚', n: 'Павич', price: 2200, lvl: 5 },
      { id: '🦈', n: 'Акула', price: 2500, lvl: 5 },
      { id: '🧞', n: 'Джин', price: 3000, lvl: 5 },
      { id: '🐉', n: 'Дракон', price: 3500, lvl: 6 },
      { id: '🤴', n: 'Принц', price: 4000, lvl: 6 },
      { id: '👸', n: 'Принцеса', price: 4000, lvl: 6 },
      { id: '👑', n: 'Король покеру', price: 8000, lvl: 9 },
      { id: '💎', n: 'Діамант', price: 10000, lvl: 10 },
    ],
  },
  frame: {
    title: 'Рамки аватара', icon: '🖼️',
    items: [
      { id: 'none', n: 'Без рамки', price: 0 },
      { id: 'silver', n: 'Срібна', price: 300 },
      { id: 'gold', n: 'Золота', price: 800 },
      { id: 'ruby', n: 'Рубінова', price: 1000 },
      { id: 'emerald', n: 'Смарагдова', price: 1000 },
      { id: 'neon', n: 'Неонова', price: 2000, lvl: 3 },
      { id: 'rainbow', n: 'Веселка', price: 3500, lvl: 5 },
      { id: 'fire', n: 'Полум’я', price: 5000, lvl: 7 },
    ],
  },
  title: {
    title: 'Титули', icon: '🏷️',
    items: [
      { id: 'none', n: 'Без титулу', price: 0 },
      { id: 'rookie', n: 'Новачок', price: 100, c: '#94a3b8' },
      { id: 'lucky', n: 'Щасливчик', price: 500, c: '#4ade80' },
      { id: 'rock', n: 'Скеля', price: 600, c: '#a3e635' },
      { id: 'math', n: 'Математик', price: 800, c: '#60a5fa' },
      { id: 'bluffer', n: 'Блефер', price: 800, c: '#f472b6' },
      { id: 'shark', n: 'Акула', price: 1200, c: '#22d3ee' },
      { id: 'maestro', n: 'Маестро', price: 2000, lvl: 3, c: '#c084fc' },
      { id: 'prof', n: 'Професор покеру', price: 3000, lvl: 5, c: '#fb923c' },
      { id: 'legend', n: 'Легенда', price: 6000, lvl: 8, c: '#f5c451' },
      { id: 'king', n: 'Король столу', price: 10000, lvl: 10, c: '#facc15' },
    ],
  },
  fx: {
    title: 'Ефекти перемоги', icon: '🎉',
    items: [
      { id: 'confetti', n: 'Конфеті', price: 0, e: '🎊' },
      { id: 'hearts', n: 'Сердечка', price: 600, e: '💖' },
      { id: 'goldconf', n: 'Золоте конфеті', price: 700, e: '✨' },
      { id: 'snow', n: 'Снігопад', price: 800, e: '❄️' },
      { id: 'coins', n: 'Золотий дощ', price: 900, e: '🪙' },
      { id: 'party', n: 'Вечірка', price: 1000, e: '🥳' },
      { id: 'flowers', n: 'Квіти', price: 1100, e: '🌸' },
      { id: 'stars', n: 'Зорепад', price: 1200, e: '🌟' },
      { id: 'cards', n: 'Колода в повітрі', price: 1400, e: '🃏' },
      { id: 'suits', n: 'Масті', price: 1500, e: '♠️' },
      { id: 'fireworks', n: 'Феєрверк', price: 1800, lvl: 3, e: '🎆' },
      { id: 'rainbow', n: 'Веселка', price: 2000, lvl: 4, e: '🌈' },
      { id: 'fire', n: 'Вогонь', price: 2500, lvl: 5, e: '🔥' },
      { id: 'diamonds', n: 'Діаманти', price: 3000, lvl: 6, e: '💎' },
      { id: 'space', n: 'Космос', price: 4000, lvl: 7, e: '🚀' },
      { id: 'royal', n: 'Королівський салют', price: 5000, lvl: 8, e: '👑' },
    ],
  },
};

const FX_KINDS = {
  confetti: {},
  hearts: { emoji: ['💖', '❤️', '💕', '💗'] },
  goldconf: { colors: ['#f5c451', '#ffd873', '#d99a1e', '#fff3c4', '#fde68a'] },
  snow: { emoji: ['❄️', '❅', '❆', '⛄'] },
  coins: { emoji: ['🪙', '💰', '🪙', '💵'] },
  party: { emoji: ['🥳', '🎈', '🎉', '🎊'] },
  flowers: { emoji: ['🌸', '🌷', '🌺', '🌼'] },
  stars: { emoji: ['⭐', '✨', '🌟', '💫'] },
  cards: { emoji: ['🃏', '♠️', '♥️', '♦️', '♣️'] },
  suits: { emoji: ['♠️', '♥️', '♦️', '♣️'] },
  fireworks: { colors: ['#f87171', '#facc15', '#4ade80', '#60a5fa', '#e879f9', '#fff'], waves: 3 },
  rainbow: { colors: ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#8b5cf6'], then: 'rainbowE' },
  rainbowE: { emoji: ['🌈', '☁️', '✨'] },
  fire: { emoji: ['🔥', '💥', '🔥', '✨'] },
  diamonds: { emoji: ['💎', '💠', '✨', '💍'] },
  space: { emoji: ['🚀', '🪐', '⭐', '🌙', '☄️'] },
  royal: { emoji: ['👑', '💎', '✨', '🏆'], then: 'confetti' },
};

function winFx(n = 70, kind = Prof.equip.fx) {
  const k = FX_KINDS[kind] || {};
  const waves = k.waves || 1;
  for (let w = 0; w < waves; w++) setTimeout(() => confetti(n, k), w * 300);
  if (k.then) setTimeout(() => confetti(n, FX_KINDS[k.then] || {}), waves * 260);
}

// Класи скінів на <body>: bk- сорочки, fl- сукно, ch- фішки, fr- рамка
const SKIN_PREFIX = { back: 'bk-', felt: 'fl-', chips: 'ch-', frame: 'fr-' };
function applySkins() {
  const b = document.body;
  const pre = Object.values(SKIN_PREFIX);
  [...b.classList].forEach(c => { if (pre.some(p => c.startsWith(p))) b.classList.remove(c); });
  for (const [cat, p] of Object.entries(SKIN_PREFIX)) b.classList.add(p + Prof.equip[cat]);
  updateHud();
}

// Титул гравця
function myTitle() {
  const t = SHOP.title.items.find(x => x.id === Prof.equip.title);
  return t && t.id !== 'none' ? t : null;
}
function titleBadge(t = myTitle()) {
  return t ? `<span class="p-title" style="--tt:${t.c}">${t.n}</span>` : '';
}

// ---------- Рідкість ----------
function rarity(price) {
  if (!price) return { cls: 'r-free', n: 'Базовий' };
  if (price < 600) return { cls: 'r-common', n: 'Звичайний' };
  if (price < 1500) return { cls: 'r-rare', n: 'Рідкісний' };
  if (price < 4000) return { cls: 'r-epic', n: 'Епічний' };
  return { cls: 'r-legend', n: 'Легендарний' };
}

function allItems() {
  const out = [];
  for (const [cat, c] of Object.entries(SHOP)) c.items.forEach(it => { if (it.price > 0) out.push({ cat, it }); });
  return out;
}
const isOwned = (cat, id) => Prof.owned[cat].includes(id);

// ---------- Пропозиція дня: −30% на один предмет ----------
const DEAL_OFF = .3;
function dailyDeal() {
  const list = allItems();
  const s = todayStr();
  let h = 7;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  // спершу шукаємо предмет, якого ще немає
  for (let i = 0; i < list.length; i++) {
    const x = list[(h + i * 7) % list.length];
    if (!isOwned(x.cat, x.it.id)) return { ...x, price: Math.round(x.it.price * (1 - DEAL_OFF) / 10) * 10 };
  }
  return null;
}
function priceOf(cat, it) {
  const d = dailyDeal();
  return d && d.cat === cat && d.it.id === it.id ? d.price : it.price;
}

// ---------- Скрині-сюрпризи ----------
const CHESTS = [
  { id: 'common', n: 'Звичайна скриня', icon: '📦', price: 450, min: 1, max: 1000, d: 'Предмет вартістю до 1 000 🪙' },
  { id: 'rare', n: 'Рідкісна скриня', icon: '🎁', price: 1500, min: 1000, max: 3000, lvl: 2, d: 'Предмет вартістю 1 000 – 3 000 🪙' },
  { id: 'legend', n: 'Легендарна скриня', icon: '💎', price: 4500, min: 3000, max: Infinity, lvl: 4, d: 'Предмет від 3 000 🪙 — навіть вищого рівня!' },
];
function chestPool(ch) {
  return allItems().filter(x => !isOwned(x.cat, x.it.id) && x.it.price >= ch.min && x.it.price <= ch.max);
}

let shopTab = 'back';

function shopPreview(cat, it) {
  switch (cat) {
    case 'back': return `<div class="sp-cards"><div class="card back bk-${it.id}"></div><div class="card back bk-${it.id}"></div></div>`;
    case 'felt': return `<div class="felt-swatch fl-${it.id}"><span class="card sm red"><span class="cr">A</span><span class="cs">♥</span><span class="cbig">♥</span></span></div>`;
    case 'chips': return `<div class="sp-chipset ch-${it.id}"><i></i><i></i><i></i></div>`;
    case 'avatar': return `<div class="sp-av">${it.id}</div>`;
    case 'frame': return `<div class="sp-av fr-prev fr-${it.id}">${Prof.equip.avatar}</div>`;
    case 'title': return it.id === 'none' ? `<div class="sp-title muted">—</div>` : `<div class="sp-title">${titleBadge(it)}</div>`;
    case 'fx': return `<div class="sp-fx">${it.e}</div>`;
  }
  return '';
}

function itemCard(cat, it, opts = {}) {
  const lvl = myLevel();
  const owned = isOwned(cat, it.id);
  const eq = Prof.equip[cat] === it.id;
  const locked = !owned && it.lvl && lvl < it.lvl;
  const price = priceOf(cat, it);
  const poor = !owned && !locked && Prof.coins < price;
  const r = rarity(it.price);
  let btn;
  if (eq) btn = `<button class="btn small" disabled>✓ Обрано</button>`;
  else if (owned) btn = `<button class="btn small" onclick="equipItem('${cat}','${it.id}')">Обрати</button>`;
  else if (locked) btn = `<button class="btn small" disabled>🔒 Рівень ${it.lvl}</button>`;
  else btn = `<button class="btn small primary" ${poor ? 'disabled' : ''} onclick="buyItem('${cat}','${it.id}')">Купити · ${fmt(price)} 🪙</button>`;
  const priceTxt = owned ? '<span class="muted">Ваше</span>'
    : !it.price ? 'Безкоштовно'
    : price < it.price ? `<s class="muted">${fmt(it.price)}</s> <b>${fmt(price)} 🪙</b>` : `${fmt(it.price)} 🪙`;
  return `<div class="shop-item ${r.cls} ${eq ? 'equipped' : ''} ${locked ? 'locked' : ''} ${opts.deal ? 'deal' : ''}">
    ${it.price ? `<span class="rar">${r.n}</span>` : ''}
    <div class="sp" ${cat === 'fx' ? `onclick="winFx(70,'${it.id}')" title="Натисніть, щоб переглянути"` : ''}>${shopPreview(cat, it)}</div>
    <div class="si-n">${it.n}</div>
    ${opts.deal ? `<div class="si-cat muted">${SHOP[cat].icon} ${SHOP[cat].title}</div>` : ''}
    <div class="si-p">${priceTxt}</div>
    ${btn}
  </div>`;
}

function renderShop() {
  const el = $('view-shop');
  const lvl = myLevel();
  const tabs = Object.entries(SHOP).map(([k, c]) => {
    const got = c.items.filter(it => isOwned(k, it.id)).length;
    return `<button class="qtab ${k === shopTab ? 'active' : ''}" onclick="shopTab='${k}';renderShop()">${c.icon} ${c.title} <small class="qt-n">${got}/${c.items.length}</small></button>`;
  }).join('') + `<button class="qtab qtab-chest ${shopTab === 'chest' ? 'active' : ''}" onclick="shopTab='chest';renderShop()">🎁 Скрині</button>`;

  let body;
  if (shopTab === 'chest') {
    body = `<p class="muted">У скрині завжди предмет, якого у вас ще немає. Зазвичай він коштує більше, ніж сама скриня!</p>
      <div class="chest-grid">${CHESTS.map(ch => {
        const left = chestPool(ch).length;
        const locked = ch.lvl && lvl < ch.lvl;
        const btn = locked ? `<button class="btn small" disabled>🔒 Рівень ${ch.lvl}</button>`
          : !left ? `<button class="btn small" disabled>✓ Усе зібрано</button>`
          : `<button class="btn small primary" ${Prof.coins < ch.price ? 'disabled' : ''} onclick="openChest('${ch.id}')">Відкрити · ${fmt(ch.price)} 🪙</button>`;
        return `<div class="chest-card ch-${ch.id} ${locked ? 'locked' : ''}">
          <div class="chest-i">${ch.icon}</div>
          <div class="si-n">${ch.n}</div>
          <small class="muted">${ch.d}</small>
          <small class="muted">Залишилось предметів: <b>${left}</b></small>
          ${btn}
        </div>`;
      }).join('')}</div>`;
  } else {
    const cat = SHOP[shopTab];
    body = `${shopTab === 'fx' ? '<p class="muted">Натисніть на ефект, щоб переглянути його.</p>' : ''}
      ${shopTab === 'title' ? '<p class="muted">Титул показується під вашим ім’ям за столом, у меню та профілі.</p>' : ''}
      <div class="shop-grid">${cat.items.map(it => itemCard(shopTab, it)).join('')}</div>`;
  }

  const deal = dailyDeal();
  const dealHtml = deal ? `<div class="deal-box">
      <div class="deal-h"><span class="deal-tag">−${Math.round(DEAL_OFF * 100)}%</span><div><b>Пропозиція дня</b><small class="muted">Оновлюється щодня опівночі</small></div></div>
      <div class="deal-item">${itemCard(deal.cat, deal.it, { deal: true })}</div>
    </div>` : '';

  const total = allItems().length + Object.keys(SHOP).length;
  const ownedN = Object.values(Prof.owned).reduce((s, a) => s + a.length, 0);
  el.innerHTML = `<div class="page-wrap">
    <div class="page-head"><div><h2>🛍️ Магазин</h2><p class="muted">Прикрасьте свою гру. Монети заробляються грою, уроками, тренуванням, бонусами й досягненнями.</p>
      <p class="coll">Колекція: <b>${ownedN}</b> / ${total} <span class="mini-bar"><i style="width:${Math.round(ownedN / total * 100)}%"></i></span></p></div>
      <div class="balance-big"><span class="coin"></span>${fmt(Prof.coins)}</div></div>
    ${dealHtml}
    <div class="quiz-tabs shop-tabs">${tabs}</div>
    ${body}
  </div>`;
  replay(el.firstElementChild, 'fade-in');
}

function grantItem(cat, id) {
  if (isOwned(cat, id)) return;
  Prof.owned[cat].push(id);
  Prof.stats.bought++;
  saveProfile();
  checkGoalAch();
}

function buyItem(cat, id) {
  const it = SHOP[cat].items.find(x => x.id === id);
  if (!it || isOwned(cat, id)) return;
  if (it.lvl && myLevel() < it.lvl) return;
  if (!spendCoins(priceOf(cat, it))) { notify('Недостатньо монет.', 'warn', '🪙'); return; }
  grantItem(cat, id);
  notify(`Куплено: <b>${it.n}</b>`, 'info', '🛍️');
  equipItem(cat, id);
}

function equipItem(cat, id) {
  if (!isOwned(cat, id)) return;
  Prof.equip[cat] = id;
  saveProfile();
  applySkins();
  if (cat === 'fx') winFx(60, id);
  if (cat === 'avatar' && G.players[0] && !G.running) { G.players[0].avatar = id; render(); }
  if (cat === 'title') document.querySelectorAll('.seat-0 .seat-title').forEach(e => e.innerHTML = titleBadge());
  if ($('view-shop').classList.contains('active')) renderShop();
}

function openChest(chId) {
  const ch = CHESTS.find(c => c.id === chId);
  if (!ch || (ch.lvl && myLevel() < ch.lvl)) return;
  const pool = chestPool(ch);
  if (!pool.length) return;
  if (!spendCoins(ch.price)) { notify('Недостатньо монет.', 'warn', '🪙'); return; }
  const { cat, it } = pool[Math.floor(Math.random() * pool.length)];
  grantItem(cat, it.id);
  Prof.stats.chests = (Prof.stats.chests || 0) + 1;
  saveProfile();
  unlockAch('chest_1');
  const r = rarity(it.price);
  showModal(`<div class="chest-open"><div class="chest-big shaking">${ch.icon}</div><p class="muted">Відкриваємо…</p></div>`);
  setTimeout(() => {
    const again = chestPool(ch).length && Prof.coins >= ch.price;
    $('modal-body').innerHTML = `<div class="chest-open">
      <div class="chest-rar ${r.cls}">${r.n}</div>
      <div class="chest-prize ${r.cls}">${shopPreview(cat, it)}</div>
      <h2>${it.n}</h2>
      <p class="muted">${SHOP[cat].icon} ${SHOP[cat].title} · вартість ${fmt(it.price)} 🪙</p>
      <p class="modal-btns">
        <button class="btn primary" onclick="equipItem('${cat}','${it.id}');closeModal()">Обрати зараз</button>
        ${again ? `<button class="btn" onclick="openChest('${ch.id}')">Ще одну · ${fmt(ch.price)} 🪙</button>` : ''}
        <button class="btn" onclick="closeModal()">Закрити</button>
      </p></div>`;
    winFx(it.price >= 3000 ? 90 : 50, it.price >= 3000 ? 'royal' : 'confetti');
    if (shopTab === 'chest') renderShop();
  }, FX.reduced ? 0 : 1100);
}
