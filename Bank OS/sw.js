/* Bank OS — service worker.
   Cache só da casca do app. Dados financeiros nunca são cacheados:
   toda chamada à API vai direto à rede. */
var CACHE = 'bankos-v3';
var CASCA = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CASCA); }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  var mesmaOrigem = url.origin === location.origin;

  // Chamadas ao Apps Script e ao agregador: sempre rede, nunca cache.
  if (e.request.method !== 'GET' || !mesmaOrigem) return;

  e.respondWith(
    fetch(e.request).then(function (r) {
      var copia = r.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copia); });
      return r;
    }).catch(function () { return caches.match(e.request); })
  );
});
