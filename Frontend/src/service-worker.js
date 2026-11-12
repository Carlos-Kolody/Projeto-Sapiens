// Network-first: tenta buscar a versão mais nova; usa o cache só se estiver offline.
// (O cache-first anterior fazia o navegador continuar servindo JS antigo depois de atualizações.)
const CACHE_NAME = 'sapiens-v2';
const urlsToCache = [
  './config.js',
  './login/index.html',
  './login/style.css',
  './login/script.js',
  './chat/index.html',
  './chat/style.css',
  './chat/script.js',
  './assets/tecnotooling.png',
  './assets/icon-192x192.png',
  './assets/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', event => {
  // Só cacheia arquivos do próprio frontend; chamadas à API passam direto.
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
