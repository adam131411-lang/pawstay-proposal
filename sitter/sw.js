/* 爪爪日常 保母端 PWA Service Worker — cache-first App Shell */
const CACHE = 'pawfect-sitter-v2';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './css/app.css', './css/sitter.css', './js/sitter-data.js', './js/pricing.js', './js/sitter-app.js',
  './assets/logo/logo.png', './assets/logo/app-icon.png', './assets/logo/logo-square.png',
  './assets/species/cat.png', './assets/species/dog.png', './assets/species/exotic.png',
  './assets/app/livecam.jpg'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      if (res.ok && e.request.url.startsWith(self.location.origin)) {
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
