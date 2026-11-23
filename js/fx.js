// ===== Анімації та ефекти =====

const FX = {
  reduced: window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches,
  ease: 'cubic-bezier(.2,.8,.2,1)',
};

const fxSleep = ms => new Promise(r => setTimeout(r, ms));

// Чекає завершення анімації, але не довше ніж ms (вкладка у фоні, елемент видалено тощо)
function fxDone(anim, ms) {
  return Promise.race([anim.finished.catch(() => {}), fxSleep(ms + 60)]);
}

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

function isVisible(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

// Свайп убік або вгору закриває елемент (сповіщення, підказки тренера)
function swipeToDismiss(el, onDismiss) {
  let id = null, sx = 0, sy = 0, dx = 0, dy = 0, moved = false;
  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    id = e.pointerId; sx = e.clientX; sy = e.clientY; dx = dy = 0; moved = false;
  });
  el.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    dx = e.clientX - sx;
    dy = Math.min(0, e.clientY - sy); // тягнемо лише вгору
    if (!moved && Math.hypot(dx, dy) > 8) {
      moved = true;
      el.style.transition = 'none';
      try { el.setPointerCapture(id); } catch { }
    }
    if (!moved) return;
    const d = Math.max(Math.abs(dx), Math.abs(dy) * 1.6);
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    el.style.opacity = Math.max(.1, 1 - d / 240);
  });
  const end = e => {
    if (e.pointerId !== id) return;
    id = null;
    if (!moved) return;
    el._swiped = true;
    setTimeout(() => { el._swiped = false; }, 300);
    const gone = Math.abs(dx) > 70 || dy < -35;
    el.style.transition = 'transform .25s ease-out, opacity .25s ease-out';
    if (gone) {
      const horiz = Math.abs(dx) > Math.abs(dy);
      el.style.transform = horiz ? `translate(${Math.sign(dx) * innerWidth}px, ${dy}px)` : `translate(${dx}px, -160px)`;
      el.style.opacity = 0;
      setTimeout(onDismiss, 230);
    } else {
      el.style.transform = '';
      el.style.opacity = '';
      setTimeout(() => { el.style.transition = ''; }, 260);
    }
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  // після свайпу не спрацьовує «клік»
  el.addEventListener('click', e => { if (el._swiped) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
}
function resetSwipe(el) { el.style.transform = el.style.opacity = el.style.transition = ''; }

// FLIP: елемент «прилітає» з точки from (елемента або {x,y,w})
function flyIn(el, from, { delay = 0, dur = 420, rotate = -18, fade = false } = {}) {
  if (FX.reduced || !el.animate) return Promise.resolve();
  const f = from instanceof Element ? centerOf(from) : from;
  const t = centerOf(el);
  const s = f.w && t.w ? Math.max(.4, Math.min(1.6, f.w / t.w)) : 1;
  // один ключовий кадр — кінцевий стан береться з CSS (зберігає нахил/підсвітку)
  const a = el.animate([
    { transform: `translate(${f.x - t.x}px, ${f.y - t.y}px) scale(${s}) rotate(${rotate}deg)`, opacity: fade ? 0 : 1, offset: 0 },
  ], { duration: dur, delay, easing: FX.ease, fill: 'backwards' });
  return fxDone(a, dur + delay);
}

// Елемент відлітає до точки to і зникає
function flyOut(el, to, { delay = 0, dur = 380, rotate = 25 } = {}) {
  if (FX.reduced || !el.animate) return Promise.resolve();
  const f = centerOf(el);
  const t = to instanceof Element ? centerOf(to) : to;
  const a = el.animate([
    { transform: 'none', opacity: 1 },
    { transform: `translate(${t.x - f.x}px, ${t.y - f.y}px) scale(.6) rotate(${rotate}deg)`, opacity: 0 },
  ], { duration: dur, delay, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
  return fxDone(a, dur + delay);
}

// Політ фішок між двома елементами
function flyChips(fromEl, toEl, { count = 3, dur = 480, stagger = 70, color } = {}) {
  if (FX.reduced || !fromEl || !toEl || !isVisible(fromEl) || !isVisible(toEl)) return Promise.resolve();
  const f = centerOf(fromEl), t = centerOf(toEl);
  const jobs = [];
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'fly-chip' + (color ? ' ' + color : '');
    c.style.left = f.x + 'px';
    c.style.top = f.y + 'px';
    document.body.appendChild(c);
    const jx = (Math.random() - .5) * 18, jy = (Math.random() - .5) * 10;
    const mx = (t.x - f.x) / 2 + jx, my = (t.y - f.y) / 2 - 40 + jy; // дуга
    const a = c.animate([
      { transform: 'translate(-50%,-50%) scale(.7)', opacity: 0 },
      { transform: `translate(calc(-50% + ${mx}px), calc(-50% + ${my}px)) scale(1.1)`, opacity: 1, offset: .5 },
      { transform: `translate(calc(-50% + ${t.x - f.x}px), calc(-50% + ${t.y - f.y}px)) scale(.9)`, opacity: .9 },
    ], { duration: dur, delay: i * stagger, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'both' });
    jobs.push(fxDone(a, dur + i * stagger).then(() => c.remove()));
  }
  return Promise.all(jobs).then(() => bump(toEl));
}

// Короткий «стрибок» елемента
function bump(el, cls = 'bump') {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// Плавна зміна числа
function tweenNumber(el, to, dur = 600) {
  if (!el) return;
  const from = Number(el.dataset.v ?? to);
  el.dataset.v = to;
  if (el._raf) cancelAnimationFrame(el._raf);
  if (from === to || FX.reduced || document.hidden) { el.textContent = to; return; }
  const t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * e);
    if (k < 1) el._raf = requestAnimationFrame(step);
    else el._raf = null;
  };
  el._raf = requestAnimationFrame(step);
  if (to > from) bump(el, 'n-up'); else bump(el, 'n-down');
}

// Повторно запустити CSS-анімацію появи
function replay(el, cls = 'fade-in') {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// Конфеті
// opt.emoji — замість кольорових папірців летять емодзі; opt.colors — свої кольори
function confetti(n = 90, opt = {}) {
  if (FX.reduced) return;
  const colors = opt.colors || ['#f5c451', '#ff6b6b', '#4ade80', '#60a5fa', '#c084fc', '#fff'];
  const W = innerWidth, H = innerHeight;
  if (opt.emoji) n = Math.round(n * .45);
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    if (opt.emoji) {
      p.classList.add('emoji');
      p.textContent = opt.emoji[i % opt.emoji.length];
      p.style.fontSize = (16 + Math.random() * 14) + 'px';
    } else {
      p.style.background = colors[i % colors.length];
      if (Math.random() < .4) p.style.borderRadius = '50%';
    }
    p.style.left = (W / 2 + (Math.random() - .5) * 200) + 'px';
    p.style.top = (H * .45) + 'px';
    document.body.appendChild(p);
    const ang = Math.random() * Math.PI * 2;
    const v = 200 + Math.random() * 380;
    const dx = Math.cos(ang) * v, dy = Math.sin(ang) * v * .7 - 260;
    const dur = 1300 + Math.random() * 900;
    const a = p.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${dx * .8}px, ${dy}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: .45 },
      { transform: `translate(${dx}px, ${dy + 520}px) rotate(${Math.random() * 900}deg)`, opacity: 0 },
    ], { duration: dur, easing: 'cubic-bezier(.15,.6,.4,1)', fill: 'forwards' });
    fxDone(a, dur).then(() => p.remove());
  }
}
