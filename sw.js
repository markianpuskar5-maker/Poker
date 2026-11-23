// Service worker: гра працює без інтернету після першого відкриття.
// Після зміни файлів гри збільште номер версії, щоб телефон підтягнув оновлення.
const CACHE = 'poker-school-v5';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/fx.js', 'js/sound.js', 'js/engine.js', 'js/profile.js', 'js/lessons.js', 'js/quiz.js',
  'js/coach.js', 'js/game.js', 'js/shop.js', 'js/quests.js', 'js/history.js', 'js/backup.js', 'js/menu.js', 'js/app.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Спочатку мережа (щоб бачити оновлення), а без інтернету — з кешу
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
