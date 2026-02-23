const CACHE_NAME = 'financas-rpg-v1';
const urlsToCache = [
  './',
  './index.html',
  './static/css/style.css',
  './script/main.js',
  './assets/feliz.jpg',
  './assets/triste.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});