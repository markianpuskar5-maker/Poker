// ===== Резервна копія прогресу =====
// Прогрес живе в пам'яті браузера. Тут його можна зберегти як код/файл і відновити на іншому пристрої.

const BACKUP_PREFIX = 'PS1.';

function backupKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    // історію роздач не копіюємо — вона велика, а код має бути коротким
    if (k && k.startsWith('poker_') && k !== 'poker_backup_at' && k !== 'poker_history') keys.push(k);
  }
  return keys;
}
const b64enc = s => btoa(unescape(encodeURIComponent(s)));
const b64dec = s => decodeURIComponent(escape(atob(s)));
function checksum(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0').slice(0, 6); }

function makeBackupCode() {
  const data = {};
  backupKeys().forEach(k => data[k] = localStorage.getItem(k));
  const body = b64enc(JSON.stringify({ v: 1, t: Date.now(), data }));
  return BACKUP_PREFIX + body + '.' + checksum(body);
}
function parseBackupCode(code) {
  code = String(code || '').replace(/\s+/g, '');
  if (!code.startsWith(BACKUP_PREFIX)) throw new Error('Це не код збереження Покер-Школи.');
  const parts = code.slice(BACKUP_PREFIX.length).split('.');
  if (parts.length !== 2 || checksum(parts[0]) !== parts[1]) throw new Error('Код пошкоджений або скопійований не повністю.');
  const obj = JSON.parse(b64dec(parts[0]));
  if (!obj || !obj.data || !obj.data.poker_profile_v1) throw new Error('У коді немає профілю гравця.');
  return obj;
}
function backupSummary(obj) {
  try {
    const p = JSON.parse(obj.data.poker_profile_v1);
    return `<b>${escapeHtml(p.name || 'Гравець')}</b> · ${fmt(p.coins || 0)} 🪙 · рівень ${levelOf(p.xp || 0)} · збережено ${new Date(obj.t).toLocaleString('uk-UA')}`;
  } catch { return ''; }
}
function markBackedUp() { localStorage.setItem('poker_backup_at', String(Date.now())); }
function lastBackupText() {
  const t = Number(localStorage.getItem('poker_backup_at'));
  if (!t) return 'Ще не зберігали';
  const days = Math.floor((Date.now() - t) / 864e5);
  return days === 0 ? 'Сьогодні' : days === 1 ? 'Вчора' : `${days} дн. тому`;
}
function backupDue() {
  const t = Number(localStorage.getItem('poker_backup_at'));
  return Prof.stats.hands >= 30 && (!t || Date.now() - t > 7 * 864e5);
}

function openBackup() {
  const share = !!navigator.share;
  showModal(`<h2>💾 Резервна копія прогресу</h2>
    <p class="muted">Монети, рівень, покупки й досягнення зберігаються лише в цьому браузері. Збережіть копію — і зможете відновити все на іншому телефоні чи комп'ютері.</p>
    <div class="bk-box">
      <h3>Зберегти</h3>
      <div class="bk-btns">
        ${share ? `<button class="btn primary" onclick="backupShare()">📤 Надіслати собі</button>` : ''}
        <button class="btn ${share ? '' : 'primary'}" onclick="backupDownload()">⬇️ Завантажити файл</button>
        <button class="btn" onclick="backupCopy()">📋 Скопіювати код</button>
      </div>
      <small class="muted">Остання копія: ${lastBackupText()}</small>
    </div>
    <div class="bk-box">
      <h3>Відновити</h3>
      <textarea id="bk-code" class="bk-code" placeholder="Вставте сюди код збереження (починається з PS1.)"></textarea>
      <div class="bk-btns">
        <button class="btn primary" onclick="backupRestoreFrom($('bk-code').value)">Відновити з коду</button>
        <label class="btn">📂 Вибрати файл<input type="file" accept=".txt,.json,text/plain" hidden onchange="backupFile(this)"></label>
      </div>
    </div>`);
}

function backupFileName() { const d = new Date(); return `poker-school-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.txt`; }
async function backupShare() {
  const code = makeBackupCode();
  try {
    const file = new File([code], backupFileName(), { type: 'text/plain' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'Покер-Школа: збереження' });
    else await navigator.share({ title: 'Покер-Школа: збереження', text: code });
    markBackedUp();
    notify('Копію збережено 👍', 'info', '💾');
    closeModal();
  } catch (e) { if (e && e.name !== 'AbortError') backupDownload(); }
}
function backupDownload() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([makeBackupCode()], { type: 'text/plain' }));
  a.download = backupFileName();
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  markBackedUp();
  notify('Файл збереження завантажено.', 'info', '💾');
}
async function backupCopy() {
  const code = makeBackupCode();
  try { await navigator.clipboard.writeText(code); }
  catch {
    const ta = $('bk-code'); ta.value = code; ta.select();
    try { document.execCommand('copy'); } catch { }
  }
  markBackedUp();
  notify('Код скопійовано. Збережіть його в нотатках або надішліть собі.', 'info', '📋');
}
function backupFile(input) {
  const f = input.files && input.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => backupRestoreFrom(r.result);
  r.readAsText(f);
}
function backupRestoreFrom(code) {
  let obj;
  try { obj = parseBackupCode(code); }
  catch (e) { notify(e.message || 'Не вдалося прочитати код.', 'warn', '⚠️'); return; }
  showModal(`<h2>Відновити прогрес?</h2>
    <p>${backupSummary(obj)}</p>
    <p class="muted">Поточний прогрес на цьому пристрої буде замінено.</p>
    <p class="modal-btns"><button class="btn primary" id="bk-go">Так, відновити</button><button class="btn" onclick="openBackup()">Назад</button></p>`);
  $('bk-go').onclick = () => {
    backupKeys().forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('poker_history');
    Object.entries(obj.data).forEach(([k, v]) => { if (k.startsWith('poker_')) localStorage.setItem(k, v); });
    markBackedUp();
    location.reload();
  };
}
