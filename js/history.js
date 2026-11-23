// ===== Історія роздач з розбором, графік прогресу =====

const HIST_KEY = 'poker_history';
const HIST_MAX = 40;
const cc = c => ({ 14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: 'T' }[c.r] || c.r) + c.s;
const ccs = arr => arr.map(cc).join(' ');

function histLoad() { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; } }
function histSave(list) { try { localStorage.setItem(HIST_KEY, JSON.stringify(list.slice(-HIST_MAX))); } catch { } }

// ---------- Запис роздачі (викликає game.js) ----------
const Rec = { cur: null };
function recStart() {
  const t = G.table;
  Rec.cur = {
    t: Date.now(), no: G.handNo,
    table: t.name, icon: t.icon, sb: SB, bb: BB, kind: t.tourney ? 'tourney' : t.cash ? 'cash' : 'practice',
    dealer: G.dealer,
    players: G.players.map(p => ({ n: p.name, av: p.avatar, st: p.handStart, h: p.human ? 1 : 0 })),
    hole: '', acts: [], board: '', shown: {}, res: '', diff: 0,
  };
}
function recHole() { if (Rec.cur) Rec.cur.hole = ccs(G.players[0].hole); }
function recAct(p, text) {
  if (!Rec.cur) return;
  Rec.cur.acts.push({ s: G.street, i: G.players.indexOf(p), a: text, pot: potTotal(), b: G.board.length });
}
function recGrade(item) {
  if (!Rec.cur) return;
  for (let k = Rec.cur.acts.length - 1; k >= 0; k--) {
    const a = Rec.cur.acts[k];
    if (a.i === 0) { a.g = item.g; a.why = item.text; a.rec = item.rec; return; }
  }
}
function recEnd(diff, resultHtml) {
  const r = Rec.cur;
  if (!r) return;
  r.board = ccs(G.board);
  G.players.forEach((p, i) => { if (p.shown && !p.human && p.hole.length) r.shown[i] = ccs(p.hole); });
  r.res = resultHtml.replace(/<br\s*\/?>/g, ' · ').replace(/<[^>]+>/g, '');
  r.diff = diff;
  const list = histLoad();
  list.push(r);
  histSave(list);
  Rec.cur = null;
}

// ---------- Перегляд історії ----------
const GRADE_ICON = { great: '🌟', good: '✅', ok: '🤔', mistake: '⚠️', blunder: '❌' };

function renderHistory() {
  const el = $('view-history');
  const list = histLoad().slice().reverse();
  const items = list.map((h, k) => {
    const grades = h.acts.filter(a => a.g).map(a => GRADE_ICON[a.g] || '').join('');
    const d = new Date(h.t);
    return `<button class="hist-item" onclick="openReplay(${list.length - 1 - k})">
      <div class="hi-top"><span>${h.icon} ${h.table}</span><small class="muted">${d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</small></div>
      <div class="hi-mid">
        ${h.hole ? renderCardMarkup(`[[${h.hole}]]`) : ''}
        <span class="hi-board">${h.board ? renderCardMarkup(`[[${h.board}]]`) : '<small class="muted">без флопу</small>'}</span>
        <b class="hi-diff ${h.diff > 0 ? 'pos' : h.diff < 0 ? 'neg' : ''}">${h.diff > 0 ? '+' : ''}${fmt(h.diff)}</b>
      </div>
      ${grades ? `<div class="hi-g">${grades}</div>` : ''}
    </button>`;
  }).join('');
  el.innerHTML = `<div class="page-wrap">
    <div class="page-head"><div><h2>📜 Історія роздач</h2><p class="muted">Останні ${HIST_MAX} роздач. Натисніть на роздачу, щоб переглянути її крок за кроком з оцінками ваших рішень.</p></div></div>
    ${items ? `<div class="hist-list">${items}</div>` : '<div class="mcard"><p class="muted">Тут з’являться ваші роздачі. Зіграйте кілька — і зможете розібрати кожну.</p></div>'}
  </div>`;
  replay(el.firstElementChild, 'fade-in');
}

const STREET_ORDER = ['preflop', 'flop', 'turn', 'river', 'showdown'];
let replayState = null;

function openReplay(idx) {
  const h = histLoad()[idx];
  if (!h) return;
  replayState = { h, step: 0 };
  // одразу стаємо на перше ваше рішення
  const first = h.acts.findIndex(a => a.i === 0 && !/^(SB|BB)/.test(a.a));
  replayState.step = first >= 0 ? first + 1 : 1;
  drawReplay();
}
function replayGo(d) {
  if (!replayState) return;
  const n = replayState.h.acts.length + 1;
  replayState.step = d === 'end' ? n : Math.max(1, Math.min(n, replayState.step + d));
  drawReplay();
}
function drawReplay() {
  const { h, step } = replayState;
  const total = h.acts.length;
  const atEnd = step > total;
  const cur = h.acts[Math.min(step, total) - 1];
  const boardAll = h.board ? h.board.split(' ') : [];
  const nBoard = atEnd ? boardAll.length : (cur ? cur.b : 0);
  const board = boardAll.slice(0, nBoard).join(' ');
  const name = i => h.players[i] ? (h.players[i].h ? 'Ви' : h.players[i].n) : '?';
  const rows = h.acts.slice(0, Math.min(step, total)).map((a, k) => {
    const prevStreet = k > 0 ? h.acts[k - 1].s : null;
    const sep = a.s !== prevStreet ? `<div class="rp-street">${STREET_NAMES[a.s] || a.s}</div>` : '';
    return `${sep}<div class="rp-act ${a.i === 0 ? 'me' : ''} ${k === step - 1 && !atEnd ? 'cur' : ''}"><span>${a.i === 0 ? '🫵 ' : ''}${name(a.i)}</span><b>${a.a}</b>${a.g ? `<span class="rp-g">${GRADE_ICON[a.g] || ''}</span>` : ''}</div>`;
  }).join('');
  let note = '';
  if (!atEnd && cur && cur.g) {
    const gr = GRADES[cur.g];
    note = `<div class="cf-item ${gr.cls}"><div class="cf-head">${gr.icon} <b>${gr.t}</b></div><div class="cf-text">${cur.why}</div>${gr.score !== 'good' && cur.rec ? `<div class="cf-rec">Тренер радив: <b>${cur.rec.toLowerCase()}</b></div>` : ''}</div>`;
  }
  let end = '';
  if (atEnd) {
    const shown = Object.entries(h.shown).map(([i, cards]) => `<div class="rp-show">${name(+i)}: ${renderCardMarkup(`[[${cards}]]`)}</div>`).join('');
    end = `${shown}<div class="verdict ${h.diff >= 0 ? 'v-good' : 'v-bad'}">${h.res}<br><b>Ваш результат: ${h.diff > 0 ? '+' : ''}${fmt(h.diff)}</b></div>`;
  }
  showModal(`<div class="replay">
    <h2>${h.icon} Роздача №${h.no} <small class="muted">${h.table} · ${h.sb}/${h.bb}</small></h2>
    <div class="rp-cards">
      <div><small class="muted">Ваші карти</small>${h.hole ? renderCardMarkup(`[[${h.hole}]]`, false) : ''}</div>
      <div><small class="muted">Стіл</small>${board ? renderCardMarkup(`[[${board}]]`, false) : '<div class="rp-empty">—</div>'}</div>
    </div>
    <div class="rp-pot">Банк: <b>${fmt(atEnd ? (h.acts[total - 1] || {}).pot || 0 : cur ? cur.pot : 0)}</b></div>
    <div class="rp-log">${rows}</div>
    ${note}${end}
    <div class="rp-nav">
      <button class="btn" ${step <= 1 ? 'disabled' : ''} onclick="replayGo(-1)">◀</button>
      <span class="muted">${atEnd ? 'Підсумок' : `Крок ${step} з ${total}`}</span>
      <button class="btn" ${atEnd ? 'disabled' : ''} onclick="replayGo(1)">▶</button>
      <button class="btn" ${atEnd ? 'disabled' : ''} onclick="replayGo('end')">⏭</button>
    </div>
  </div>`);
  const log = document.querySelector('.rp-log');
  if (log) log.scrollTop = log.scrollHeight;
}

// ---------- Прогрес по днях ----------
const PROG_KEY = 'poker_progress';
function progLoad() { try { return JSON.parse(localStorage.getItem(PROG_KEY) || '[]'); } catch { return []; } }
function progressTick() {
  const list = progLoad();
  const d = todayStr();
  const cs = (typeof Coach !== 'undefined' && Coach.stats) || { n: 0, good: 0 };
  const row = { d, coins: Prof.coins + (G.table && G.table.cash && G.players[0] ? G.players[0].chips : 0), n: cs.n, good: cs.good, hands: Prof.stats.hands };
  const last = list[list.length - 1];
  if (last && last.d === d) {
    if (last.coins === row.coins && last.n === row.n && last.hands === row.hands) return;
    list[list.length - 1] = row;
  } else list.push(row);
  try { localStorage.setItem(PROG_KEY, JSON.stringify(list.slice(-90))); } catch { }
}

function progressSeries() {
  const list = progLoad();
  const label = d => { const [y, m, dd] = d.split('-'); return `${dd}.${String(m).padStart(2, '0')}`; };
  const coins = list.map(r => ({ x: label(r.d), y: r.coins }));
  const acc = [];
  for (let i = 0; i < list.length; i++) {
    const p = i ? list[i - 1] : { n: 0, good: 0 };
    const dn = list[i].n - p.n, dg = list[i].good - p.good;
    if (dn >= 3) acc.push({ x: label(list[i].d), y: Math.round(dg / dn * 100) });
  }
  return { coins, acc };
}

// Лінійний графік: один ряд, одна вісь, підказка при дотику
function chartHTML(id, title, points, unit, empty) {
  if (points.length < 2) return `<div class="chart-card"><div class="ch-t">${title}</div><p class="muted ch-empty">${empty}</p></div>`;
  const last = points[points.length - 1].y;
  return `<div class="chart-card"><div class="ch-t">${title} <b>${fmt(last)}${unit}</b></div>
    <div class="chart" id="${id}" data-unit="${unit}" data-pts='${JSON.stringify(points)}'></div></div>`;
}
function drawCharts(root = document) {
  root.querySelectorAll('.chart[data-pts]').forEach(el => {
    const pts = JSON.parse(el.dataset.pts), unit = el.dataset.unit;
    const W = Math.max(240, el.clientWidth), H = 150, L = 44, R = 10, T = 10, B = 24;
    let lo = Math.min(...pts.map(p => p.y)), hi = Math.max(...pts.map(p => p.y));
    if (unit === '%') { lo = 0; hi = 100; }
    if (hi === lo) { hi += 1; lo = Math.max(0, lo - 1); }
    if (unit !== '%') {
      // «круглі» межі осі
      const mag = Math.pow(10, Math.floor(Math.log10(Math.max(1, hi - lo))));
      lo = Math.max(0, Math.floor(lo / mag) * mag); hi = Math.ceil(hi / mag) * mag;
      if ((hi - lo) / mag % 2) hi += mag;
    }
    const x = i => L + (pts.length === 1 ? 0 : i * (W - L - R) / (pts.length - 1));
    const y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    const ticks = [lo, (lo + hi) / 2, hi];
    const grid = ticks.map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="ch-grid"/><text x="${L - 6}" y="${y(v) + 4}" class="ch-ax" text-anchor="end">${fmt(v)}${unit === '%' ? '%' : ''}</text>`).join('');
    const step = Math.ceil(pts.length / 5);
    const last = pts.length - 1;
    const xl = pts.map((p, i) => ((i % step === 0 && last - i >= step * 0.7) || i === last) ? `<text x="${x(i)}" y="${H - 6}" class="ch-ax" text-anchor="middle">${p.x}</text>` : '').join('');
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join('');
    const area = `${path}L${x(pts.length - 1).toFixed(1)},${H - B}L${x(0).toFixed(1)},${H - B}Z`;
    el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${pts.map(p => p.x + ': ' + p.y + unit).join(', ')}">
      ${grid}${xl}<path d="${area}" class="ch-area"/><path d="${path}" class="ch-line"/>
      <circle cx="${x(pts.length - 1)}" cy="${y(pts[pts.length - 1].y)}" r="4" class="ch-dot"/>
      <line class="ch-cross" y1="${T}" y2="${H - B}" style="display:none"/><circle class="ch-hdot" r="5" style="display:none"/>
    </svg><div class="ch-tip" style="display:none"></div>`;
    const svg = el.querySelector('svg'), cross = el.querySelector('.ch-cross'), hd = el.querySelector('.ch-hdot'), tip = el.querySelector('.ch-tip');
    const show = e => {
      const r = svg.getBoundingClientRect();
      const px = e.clientX - r.left;
      let i = Math.round((px - L) / ((W - L - R) / Math.max(1, pts.length - 1)));
      i = Math.max(0, Math.min(pts.length - 1, i));
      cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.style.display = '';
      hd.setAttribute('cx', x(i)); hd.setAttribute('cy', y(pts[i].y)); hd.style.display = '';
      tip.innerHTML = `<small>${pts[i].x}</small><b>${fmt(pts[i].y)}${unit}</b>`;
      tip.style.display = '';
      tip.style.left = Math.min(W - 90, Math.max(0, x(i) - 40)) + 'px';
      tip.style.top = Math.max(0, y(pts[i].y) - 46) + 'px';
    };
    const hide = () => { cross.style.display = hd.style.display = tip.style.display = 'none'; };
    svg.addEventListener('pointermove', show);
    svg.addEventListener('pointerdown', show);
    svg.addEventListener('pointerleave', hide);
  });
}
