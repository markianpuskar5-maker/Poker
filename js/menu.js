// ===== Головне меню, вибір столу (лобі), профіль =====

function seatedBanner() {
  if (!G.table) return '';
  const me = G.players[0];
  return `<div class="banner seated">
    <span class="bn-i">${G.table.icon}</span>
    <div><b>Ви за столом «${G.table.name}»</b><br><small>Фішок на столі: ${fmt(me ? me.chips : 0)}${G.table.cash ? '' : ' (тренувальні)'}</small></div>
    <button class="btn primary" onclick="showView('play')">Повернутися до гри ▶</button>
  </div>`;
}

// ---------- Головне меню ----------
function renderMenu() {
  const el = $('view-menu');
  const lp = levelProgress();
  const d = dailyState();
  const done = lessonDone().length;
  const unlocked = TABLES.filter(t => t.lvl <= lp.l).length;
  const owned = Object.values(Prof.owned).reduce((s, a) => s + a.length, 0);
  const achN = Object.keys(Prof.ach).length;

  // щоденний бонус
  const cur = d.can ? Math.min(d.streak, 7) - 1 : -1;
  const doneN = d.can ? cur : Math.min(d.streak, 7);
  const pips = DAILY_REWARDS.map((r, i) =>
    `<div class="pip ${i < doneN ? 'done' : ''} ${i === cur ? 'cur' : ''}"><small>День ${i + 1}</small><b>${r}</b></div>`).join('');
  const daily = `<div class="mcard daily">
    <div class="mc-h">🎁 Щоденний бонус</div>
    <div class="pips">${pips}</div>
    ${d.can ? `<button class="btn primary" onclick="claimDaily()">Забрати +${d.reward} 🪙</button>` : `<div class="muted">✓ Бонус отримано. Повертайтеся завтра — серія: ${d.streak} дн.</div>`}
  </div>`;

  // допомога банкруту
  let rescue = '';
  if (isBroke()) {
    const left = rescueLeft();
    rescue = `<div class="mcard rescue">
      <div class="mc-h">💸 Монети закінчуються?</div>
      <p>Фонд підтримки гравців видає <b>${RESCUE_AMOUNT} 🪙</b>, якщо на балансі менше ${BROKE_LINE}.</p>
      ${left ? `<button class="btn" disabled>Наступна допомога через <span id="rescue-timer">${mmss(left)}</span></button>` : `<button class="btn primary" onclick="claimRescue()">Отримати ${RESCUE_AMOUNT} 🪙</button>`}
      <p class="muted">Або заробіть у <a href="#" onclick="showView('quiz');return false">Тренуванні</a>: +${QUIZ_COIN} 🪙 за кожну правильну відповідь.</p>
    </div>`;
  }

  const tile = (cls, icon, t, desc, meta, action) =>
    `<button class="tile ${cls}" onclick="${action}"><span class="t-icon">${icon}</span><span class="t-t">${t}</span><span class="t-d">${desc}</span><span class="t-m">${meta}</span></button>`;

  el.innerHTML = `<div class="menu">
    <div class="hero">
      <div class="hero-l">
        <button class="hero-av" onclick="showView('shop');shopTab='avatar';renderShop()" title="Змінити аватар">${Prof.equip.avatar}</button>
        <div>
          <small class="muted">Привіт,</small>
          <h1>${escapeHtml(Prof.name)}</h1>
          <div class="lvl-row"><span class="lvl-badge">Рівень ${lp.l}</span><div class="xpbar"><i style="width:${Math.round(lp.k * 100)}%"></i></div><small class="muted">${lp.cur} / ${lp.need} XP</small></div>
        </div>
      </div>
      <div class="hero-r">
        <small class="muted">Баланс</small>
        <div class="balance-big"><span class="coin"></span>${fmt(Prof.coins)}</div>
        <small class="muted">монет</small>
      </div>
    </div>
    ${seatedBanner()}
    <div class="mrow">${daily}${rescue}</div>
    <div class="tiles">
      ${tile('t-learn', '📘', 'Навчання', 'Покер з нуля: правила, комбінації, стратегія', `<span class="mini-bar"><i style="width:${Math.round(done / LESSONS.length * 100)}%"></i></span>${done}/${LESSONS.length} уроків · +${LESSON_COIN} 🪙 за урок`, "showView('learn')")}
      ${tile('t-quiz', '🎯', 'Тренування', '5 видів вправ: комбінації, шанси, стартові руки', `🪙 Сьогодні: ${quizEarnedToday()}/${QUIZ_DAILY_CAP}`, "showView('quiz')")}
      ${tile('t-coach', '🎓', 'Гра з тренером', 'Безкоштовні фішки. Тренер підказує й оцінює кожен хід', 'Без ризику · ідеально для старту', 'startPractice()')}
      ${tile('t-cash', '🪙', 'Гра на монети', 'Кеш-столи: ставиш монети з балансу, виграєш — більше', `${unlocked} з ${TABLES.length} столів відкрито`, "showView('lobby')")}
      ${tile('t-shop', '🛍️', 'Магазин', 'Сорочки карт, сукно, аватари, ефекти перемоги', `${owned} предметів у колекції`, "showView('shop')")}
      ${tile('t-prof', '🏆', 'Профіль і досягнення', 'Статистика, досягнення та налаштування', `${achN}/${ACHIEVEMENTS.length} досягнень`, "showView('profile')")}
    </div>
  </div>`;
  replay(el.firstElementChild, 'fade-in');
}

function mmss(ms) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

setInterval(() => {
  const t = document.getElementById('rescue-timer');
  if (!t || !$('view-menu').classList.contains('active')) return;
  const left = rescueLeft();
  if (left <= 0) renderMenu(); else t.textContent = mmss(left);
}, 1000);

// ---------- Лобі: вибір столу ----------
function renderLobby() {
  const el = $('view-lobby');
  const lvl = myLevel();
  const seated = !!G.table;
  const cards = TABLES.map(t => {
    const locked = lvl < t.lvl;
    const poor = Prof.coins < t.min;
    let btn;
    if (G.table && G.table.id === t.id) btn = `<button class="btn primary" onclick="showView('play')">Повернутися ▶</button>`;
    else if (locked) btn = `<button class="btn" disabled>🔒 Потрібен рівень ${t.lvl}</button>`;
    else if (seated) btn = `<button class="btn" disabled>Ви за іншим столом</button>`;
    else if (poor) btn = `<button class="btn" disabled>Потрібно ≥ ${fmt(t.min)} 🪙</button>`;
    else btn = `<button class="btn primary" onclick="openBuyIn('${t.id}')">Сісти за стіл</button>`;
    return `<div class="tcard ${locked ? 'locked' : ''} tc-${t.id}">
      <div class="tc-top"><span class="tc-i">${t.icon}</span><div><b>${t.name}</b><small>${t.desc}</small></div></div>
      <div class="tc-rows">
        <div><span>Блайнди</span><b>${fmt(t.sb)} / ${fmt(t.bb)}</b></div>
        <div><span>Бай-ін</span><b>${fmt(t.min)} – ${fmt(t.max)} 🪙</b></div>
        <div><span>Суперники</span><b>${t.foes}</b></div>
      </div>
      ${btn}
    </div>`;
  }).join('');
  el.innerHTML = `<div class="page-wrap">
    <div class="page-head"><div><h2>🃏 Оберіть стіл</h2><p class="muted">За столами на монети ви ризикуєте своїм балансом. Встали з-за столу — фішки повертаються на баланс.</p></div>
      <div class="balance-big"><span class="coin"></span>${fmt(Prof.coins)}</div></div>
    ${seatedBanner()}
    <div class="tcard practice">
      <div class="tc-top"><span class="tc-i">🎓</span><div><b>Гра з тренером</b><small>Безкоштовні фішки — монети не витрачаються. Тренер підказує кожен хід, можна бачити карти ботів.</small></div></div>
      ${G.table && !G.table.cash ? `<button class="btn primary" onclick="showView('play')">Повернутися ▶</button>` : `<button class="btn primary" ${seated ? 'disabled' : ''} onclick="startPractice()">Грати безкоштовно</button>`}
    </div>
    <h3 class="sec-h">🪙 Столи на монети</h3>
    <div class="tables">${cards}</div>
    ${isBroke() ? `<div class="banner warn"><span class="bn-i">💸</span><div>Замало монет для гри. Загляньте в <a href="#" onclick="showView('menu');return false">меню</a> — там є допомога для гравців на мілині.</div></div>` : ''}
  </div>`;
  replay(el.firstElementChild, 'fade-in');
}

// Вікно бай-іну (також для докупу після програшу)
function openBuyIn(id, rebuy = false) {
  const t = TABLES.find(x => x.id === id);
  if (!t) return;
  const maxAfford = Math.min(t.max, Math.floor(Prof.coins / t.bb) * t.bb);
  if (maxAfford < t.min) { notify(`Потрібно щонайменше ${fmt(t.min)} 🪙.`, 'warn', '🪙'); return; }
  const def = Math.min(maxAfford, Math.max(t.min, Math.round(t.max / 2 / t.bb) * t.bb));
  showModal(`<h2>${t.icon} ${rebuy ? 'Докуп фішок' : t.name}</h2>
    <p class="muted">Блайнди ${fmt(t.sb)}/${fmt(t.bb)}. Скільки монет взяти за стіл?</p>
    <div class="buyin">
      <div class="bi-val"><span class="coin"></span><b id="bi-v">${fmt(def)}</b><small id="bi-bb">${Math.round(def / t.bb)} BB</small></div>
      <input type="range" id="bi-range" min="${t.min}" max="${maxAfford}" step="${t.bb}" value="${def}">
      <div class="bi-lim"><span>${fmt(t.min)}</span><span>${fmt(maxAfford)}</span></div>
      <p class="bi-after">Залишиться на балансі: <b id="bi-left">${fmt(Prof.coins - def)}</b> 🪙</p>
      <p id="bi-warn" class="bi-warn"></p>
    </div>
    <p class="modal-btns"><button class="btn primary big" id="bi-go">${rebuy ? 'Докупитися' : 'Сісти за стіл'}</button><button class="btn" onclick="closeModal()">Скасувати</button></p>`);
  const rng = $('bi-range');
  const upd = () => {
    const v = Number(rng.value);
    $('bi-v').textContent = fmt(v);
    $('bi-bb').textContent = Math.round(v / t.bb) + ' BB';
    $('bi-left').textContent = fmt(Prof.coins - v);
    const k = (v - t.min) / ((maxAfford - t.min) || 1);
    rng.style.setProperty('--fill', Math.round(k * 100) + '%');
    $('bi-warn').innerHTML = v > (Prof.coins + (G.players[0] ? G.players[0].chips : 0)) / 5
      ? '⚠️ Це більше ніж 1/5 ваших монет. Професіонали так не ризикують — програш сильно вдарить по балансу.' : '';
  };
  rng.oninput = upd;
  upd();
  $('bi-go').onclick = () => {
    const v = Number(rng.value);
    if (!spendCoins(v)) return;
    closeModal();
    if (rebuy) {
      G.players[0].chips += v;
      G.session.buyins += v;
      Prof.seat = { table: t.id, chips: G.players[0].chips };
      saveProfile();
      log(`🔄 Ви докупили ${fmt(v)} фішок.`, 'sys');
      render();
      updateTableBar();
      playHand();
    } else {
      Prof.seat = { table: t.id, chips: v };
      Prof.stats.sessions++;
      saveProfile();
      unlockAch('cash_first');
      if (t.id === 'high' || t.id === 'vip') unlockAch('high');
      startTable(t, v);
    }
  };
}

// ---------- Профіль ----------
function renderProfile() {
  const el = $('view-profile');
  const s = Prof.stats;
  const lp = levelProgress();
  const cs = Coach.stats;
  const acc = cs.n ? Math.round(cs.good / cs.n * 100) + '%' : '—';
  const winRate = s.hands ? Math.round(s.won / s.hands * 100) + '%' : '—';
  const stat = (k, v, cls = '') => `<div class="st"><span>${k}</span><b class="${cls}">${v}</b></div>`;
  const ach = ACHIEVEMENTS.map(a => {
    const got = !!Prof.ach[a.id];
    let prog = '';
    if (!got && a.goal) {
      const [v, g] = a.goal(s);
      prog = `<div class="mini-bar"><i style="width:${Math.min(100, Math.round(v / g * 100))}%"></i></div><small class="muted">${Math.min(v, g)} / ${g}</small>`;
    }
    return `<div class="ach ${got ? 'got' : ''}"><div class="ach-i">${a.icon}</div><div class="ach-b"><b>${a.t}</b><small>${a.d}</small>${prog}</div><div class="ach-r">${got ? '✓' : '+' + fmt(a.r) + ' 🪙'}</div></div>`;
  }).join('');
  el.innerHTML = `<div class="page-wrap">
    <div class="prof-head">
      <button class="hero-av" onclick="shopTab='avatar';showView('shop')" title="Змінити аватар">${Prof.equip.avatar}</button>
      <div class="ph-main">
        <label class="muted" for="prof-name">Ім'я гравця</label>
        <input id="prof-name" class="name-input" maxlength="18" value="${escapeHtml(Prof.name)}">
        <div class="lvl-row"><span class="lvl-badge">Рівень ${lp.l}</span><div class="xpbar"><i style="width:${Math.round(lp.k * 100)}%"></i></div><small class="muted">${lp.cur} / ${lp.need} XP</small></div>
      </div>
      <div class="hero-r"><small class="muted">Баланс</small><div class="balance-big"><span class="coin"></span>${fmt(Prof.coins)}</div></div>
    </div>
    <h3 class="sec-h">📊 Статистика</h3>
    <div class="stats-grid">
      ${stat('Роздач зіграно', fmt(s.hands))}
      ${stat('Виграно банків', `${fmt(s.won)} <small>(${winRate})</small>`)}
      ${stat('Найбільший виграш', fmt(s.biggest))}
      ${stat('Найкраща рука', s.bestCat >= 0 ? CAT_NAMES[s.bestCat] : '—')}
      ${stat('Результат гри на монети', (s.cashProfit > 0 ? '+' : '') + fmt(s.cashProfit) + ' 🪙', s.cashProfit > 0 ? 'pos' : s.cashProfit < 0 ? 'neg' : '')}
      ${stat('Роздач на монети', fmt(s.cashHands))}
      ${stat('Якість рішень (тренер)', acc)}
      ${stat('Оцінок «Відмінно»', fmt(s.great))}
      ${stat('Правильних відповідей', fmt(s.quizRight))}
      ${stat('Найдовша серія', fmt(s.quizBest))}
      ${stat('Уроків пройдено', `${lessonDone().length} / ${LESSONS.length}`)}
      ${stat('Предметів куплено', fmt(s.bought))}
    </div>
    <h3 class="sec-h">🏆 Досягнення <small class="muted">${Object.keys(Prof.ach).length} / ${ACHIEVEMENTS.length}</small></h3>
    <div class="ach-grid">${ach}</div>
    <div class="danger-zone"><button class="btn small" onclick="askReset()">🗑️ Скинути весь прогрес</button></div>
  </div>`;
  const inp = $('prof-name');
  inp.onchange = () => { Prof.name = inp.value.trim().slice(0, 18) || 'Гравець'; inp.value = Prof.name; saveProfile(); notify("Ім'я збережено", 'info', '✏️'); };
  replay(el.firstElementChild, 'fade-in');
}

function askReset() {
  showModal(`<h2>Скинути прогрес?</h2><p>Буде видалено монети, рівень, покупки, досягнення, статистику та пройдені уроки. Це не можна скасувати.</p>
    <p class="modal-btns"><button class="btn fold" onclick="resetProgress()">Так, скинути все</button><button class="btn" onclick="closeModal()">Скасувати</button></p>`);
}
function resetProgress() {
  ['poker_profile_v1', 'poker_lessons', 'poker_coach_stats'].forEach(k => localStorage.removeItem(k));
  location.reload();
}
