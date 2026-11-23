// ===== Навігація, модальні вікна, запуск =====

function moveNavInd() {
  const b = document.querySelector('.nav-btn.active'), ind = document.getElementById('nav-ind');
  if (!b) { ind.style.opacity = 0; return; }
  ind.style.opacity = 1;
  ind.style.width = b.offsetWidth + 'px';
  ind.style.transform = `translate(${b.offsetLeft}px, ${b.offsetTop}px)`;
  ind.style.height = b.offsetHeight + 'px';
}

const VIEW_RENDER = {
  menu: () => renderMenu(),
  lobby: () => renderLobby(),
  shop: () => renderShop(),
  profile: () => renderProfile(),
  quiz: () => { const s = document.querySelector('#quiz-area .qscore'); if (s) s.outerHTML = quizScoreHTML(); },
};
const NAV_OF = { lobby: 'play', profile: 'menu' };

function showView(v) {
  if (v === 'play' && !G.table) v = 'lobby';
  document.querySelectorAll('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  const nav = NAV_OF[v] || v;
  document.querySelectorAll('.nav-btn[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === nav));
  if (VIEW_RENDER[v]) VIEW_RENDER[v]();
  document.body.classList.toggle('at-table', v === 'play');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  moveNavInd();
  if (v === 'play') requestAnimationFrame(positionDealer);
}

let modalTimer;
function showModal(html) {
  clearTimeout(modalTimer);
  const m = document.getElementById('modal');
  document.getElementById('modal-body').innerHTML = html;
  m.classList.remove('hidden', 'closing');
}
function closeModal() {
  const m = document.getElementById('modal');
  if (m.classList.contains('hidden')) return;
  m.classList.add('closing');
  modalTimer = setTimeout(() => m.classList.add('hidden'), FX.reduced ? 0 : 220);
}
addEventListener('resize', moveNavInd);

function showCheat() {
  showModal(`<h2>📋 Шпаргалка: комбінації</h2><p class="muted">Від найсильнішої до найслабшої</p>` +
    renderCardMarkup(`<table class="ranks">
    <tr><td class="n">1</td><td><b>Роял-флеш</b></td><td>[[As Ks Qs Js Ts]]</td></tr>
    <tr><td class="n">2</td><td><b>Стріт-флеш</b></td><td>[[9h 8h 7h 6h 5h]]</td></tr>
    <tr><td class="n">3</td><td><b>Каре</b></td><td>[[Qc Qd Qh Qs 4d]]</td></tr>
    <tr><td class="n">4</td><td><b>Фул-хаус</b></td><td>[[Kh Kd Kc 7s 7h]]</td></tr>
    <tr><td class="n">5</td><td><b>Флеш</b></td><td>[[Ad Jd 8d 6d 2d]]</td></tr>
    <tr><td class="n">6</td><td><b>Стріт</b></td><td>[[Tc 9d 8s 7h 6c]]</td></tr>
    <tr><td class="n">7</td><td><b>Трійка</b></td><td>[[8s 8h 8d Kc 3s]]</td></tr>
    <tr><td class="n">8</td><td><b>Дві пари</b></td><td>[[Jh Js 4c 4d Ah]]</td></tr>
    <tr><td class="n">9</td><td><b>Пара</b></td><td>[[Ac Ad 9h 6s 3c]]</td></tr>
    <tr><td class="n">10</td><td><b>Старша карта</b></td><td>[[Ks Jd 8c 5h 2s]]</td></tr></table>
    <p><b>Дії:</b> Фолд — скинути · Чек — пропустити (якщо немає ставки) · Колл — зрівняти · Бет/Рейз — поставити/підвищити · Ол-ін — усі фішки.</p>
    <p><b>Шанси банку:</b> потрібний % = доплата ÷ (банк + доплата). <b>Аути:</b> ×4 на флопі, ×2 на терні.</p>
    <p><b>Клавіші в грі:</b> F — фолд, C / пробіл — чек/колл, R — рейз, N — наступна роздача.</p>`));
}

document.querySelectorAll('.nav-btn[data-view]').forEach(b => b.onclick = () => showView(b.dataset.view));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ---------- Запуск ----------
recoverSeat();
applySkins();
renderLessonList();
openLesson(Math.min(lessonDone().length, LESSONS.length - 1));
renderQuizTabs();
nextQuestion();
initGameUI();
showView('menu');
if (document.fonts) document.fonts.ready.then(moveNavInd);
