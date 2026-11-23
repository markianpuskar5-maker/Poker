// ===== Магазин косметики: сорочки карт, сукно, аватари, ефекти перемоги =====

const SHOP = {
  back: {
    title: 'Сорочки карт', icon: '🂠',
    items: [
      { id: 'classic', n: 'Класична', price: 0 },
      { id: 'navy', n: 'Нічний синій', price: 300 },
      { id: 'emerald', n: 'Смарагд', price: 400 },
      { id: 'carbon', n: 'Карбон', price: 700 },
      { id: 'sunset', n: 'Захід сонця', price: 1000 },
      { id: 'gold', n: 'Золото', price: 2000, lvl: 4 },
      { id: 'neon', n: 'Неон', price: 3000, lvl: 6 },
      { id: 'royal', n: 'Королівська', price: 6000, lvl: 8 },
    ],
  },
  felt: {
    title: 'Сукно столу', icon: '🟩',
    items: [
      { id: 'green', n: 'Класичне зелене', price: 0 },
      { id: 'blue', n: 'Океан', price: 500 },
      { id: 'wine', n: 'Бордо', price: 700 },
      { id: 'violet', n: 'Аметист', price: 900 },
      { id: 'teal', n: 'Бірюза', price: 1200 },
      { id: 'noir', n: 'Нуар', price: 2000, lvl: 3 },
      { id: 'gold', n: 'Монако', price: 5000, lvl: 7 },
    ],
  },
  avatar: {
    title: 'Аватари', icon: '🙂',
    items: [
      { id: '🙂', n: 'Усмішка', price: 0 },
      { id: '😎', n: 'Крутий', price: 150 },
      { id: '🤓', n: 'Відмінник', price: 150 },
      { id: '🤠', n: 'Ковбой', price: 250 },
      { id: '🦊', n: 'Лис', price: 300 },
      { id: '🐼', n: 'Панда', price: 300 },
      { id: '🐸', n: 'Жабка', price: 300 },
      { id: '🐯', n: 'Тигр', price: 500 },
      { id: '🤖', n: 'Робот', price: 600 },
      { id: '🧙', n: 'Чарівник', price: 900 },
      { id: '🦁', n: 'Лев', price: 1200, lvl: 3 },
      { id: '🦄', n: 'Єдиноріг', price: 1500, lvl: 3 },
      { id: '👽', n: 'Прибулець', price: 2000, lvl: 4 },
      { id: '🦈', n: 'Акула', price: 2500, lvl: 5 },
      { id: '🐉', n: 'Дракон', price: 3500, lvl: 6 },
      { id: '👑', n: 'Король покеру', price: 8000, lvl: 9 },
    ],
  },
  fx: {
    title: 'Ефект перемоги', icon: '🎉',
    items: [
      { id: 'confetti', n: 'Конфеті', price: 0, e: '🎊' },
      { id: 'hearts', n: 'Сердечка', price: 600, e: '💖' },
      { id: 'coins', n: 'Золотий дощ', price: 900, e: '🪙' },
      { id: 'stars', n: 'Зорепад', price: 1200, e: '🌟' },
      { id: 'suits', n: 'Масті', price: 1500, e: '♠️' },
      { id: 'fire', n: 'Вогонь', price: 2500, lvl: 5, e: '🔥' },
      { id: 'royal', n: 'Королівський салют', price: 5000, lvl: 8, e: '👑' },
    ],
  },
};

const FX_KINDS = {
  confetti: {},
  hearts: { emoji: ['💖', '❤️', '💕', '💗'] },
  coins: { emoji: ['🪙', '💰', '🪙', '💵'] },
  stars: { emoji: ['⭐', '✨', '🌟', '💫'] },
  suits: { emoji: ['♠️', '♥️', '♦️', '♣️'] },
  fire: { emoji: ['🔥', '💥', '🔥', '✨'] },
  royal: { emoji: ['👑', '💎', '✨', '🏆'] },
};

function winFx(n = 70, kind = Prof.equip.fx) {
  const k = FX_KINDS[kind] || {};
  confetti(n, k);
  if (kind === 'royal') setTimeout(() => confetti(n), 250);
}

function applySkins() {
  const b = document.body;
  [...b.classList].forEach(c => { if (c.startsWith('bk-') || c.startsWith('fl-')) b.classList.remove(c); });
  b.classList.add('bk-' + Prof.equip.back, 'fl-' + Prof.equip.felt);
  updateHud();
}

let shopTab = 'back';

function shopPreview(cat, it) {
  switch (cat) {
    case 'back': return `<div class="sp-cards"><div class="card back bk-${it.id}"></div><div class="card back bk-${it.id}"></div></div>`;
    case 'felt': return `<div class="felt-swatch fl-${it.id}"><span class="card sm red"><span class="cr">A</span><span class="cs">♥</span><span class="cbig">♥</span></span></div>`;
    case 'avatar': return `<div class="sp-av">${it.id}</div>`;
    case 'fx': return `<div class="sp-fx">${it.e}</div>`;
  }
  return '';
}

function renderShop() {
  const el = $('view-shop');
  const lvl = myLevel();
  const tabs = Object.entries(SHOP).map(([k, c]) =>
    `<button class="qtab ${k === shopTab ? 'active' : ''}" onclick="shopTab='${k}';renderShop()">${c.icon} ${c.title}</button>`).join('');
  const cat = SHOP[shopTab];
  const items = cat.items.map(it => {
    const owned = Prof.owned[shopTab].includes(it.id);
    const eq = Prof.equip[shopTab] === it.id;
    const locked = !owned && it.lvl && lvl < it.lvl;
    const poor = !owned && !locked && Prof.coins < it.price;
    let btn;
    if (eq) btn = `<button class="btn small" disabled>✓ Обрано</button>`;
    else if (owned) btn = `<button class="btn small" onclick="equipItem('${shopTab}','${it.id}')">Обрати</button>`;
    else if (locked) btn = `<button class="btn small" disabled>🔒 Рівень ${it.lvl}</button>`;
    else btn = `<button class="btn small primary" ${poor ? 'disabled' : ''} onclick="buyItem('${shopTab}','${it.id}')">Купити · ${fmt(it.price)} 🪙</button>`;
    return `<div class="shop-item ${eq ? 'equipped' : ''} ${locked ? 'locked' : ''}">
      <div class="sp" ${shopTab === 'fx' ? `onclick="winFx(70,'${it.id}')" title="Натисніть, щоб переглянути"` : ''}>${shopPreview(shopTab, it)}</div>
      <div class="si-n">${it.n}</div>
      <div class="si-p">${owned ? '<span class="muted">Ваше</span>' : it.price ? `${fmt(it.price)} 🪙` : 'Безкоштовно'}</div>
      ${btn}
    </div>`;
  }).join('');
  el.innerHTML = `<div class="page-wrap">
    <div class="page-head"><div><h2>🛍️ Магазин</h2><p class="muted">Прикрасьте свою гру. Монети заробляються грою, уроками, тренуванням, бонусами й досягненнями.</p></div>
      <div class="balance-big"><span class="coin"></span>${fmt(Prof.coins)}</div></div>
    <div class="quiz-tabs">${tabs}</div>
    ${shopTab === 'fx' ? '<p class="muted">Натисніть на ефект, щоб переглянути його.</p>' : ''}
    <div class="shop-grid">${items}</div>
  </div>`;
  replay(el.firstElementChild, 'fade-in');
}

function buyItem(cat, id) {
  const it = SHOP[cat].items.find(x => x.id === id);
  if (!it || Prof.owned[cat].includes(id)) return;
  if (it.lvl && myLevel() < it.lvl) return;
  if (!spendCoins(it.price)) { notify('Недостатньо монет.', 'warn', '🪙'); return; }
  Prof.owned[cat].push(id);
  Prof.stats.bought++;
  saveProfile();
  notify(`Куплено: <b>${it.n}</b>`, 'info', '🛍️');
  checkGoalAch();
  equipItem(cat, id);
}

function equipItem(cat, id) {
  if (!Prof.owned[cat].includes(id)) return;
  Prof.equip[cat] = id;
  saveProfile();
  applySkins();
  if (cat === 'fx') winFx(60, id);
  if (cat === 'avatar' && G.players[0] && !G.running) { G.players[0].avatar = id; render(); }
  renderShop();
}
