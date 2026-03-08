const STATIC_CACHE = 'fruteria-static-v9';
const RUNTIME_CACHE = 'fruteria-runtime-v9';

const urlsToPrecache = [
  './',
  './index.html',
  './styles.css',
  './js/core/utils.js',
  './js/services/storage.service.js',
  './js/services/image.service.js',
  './js/services/promotion.engine.js',
  './js/app/fruteria.app.js',
  './js/main.js',
  './manifest.json',
  './favicon.ico',
  './sw.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(urlsToPrecache)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
        .map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Solo manejamos peticiones GET; el resto sigue directo a red.
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigation = request.mode === 'navigate';

  // Paginas HTML: primero red, si falla usamos cache y finalmente fallback minimo.
  if (isNavigation) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Recursos estaticos locales: cache rapido + actualizacion en segundo plano.
  if (isSameOrigin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Recursos externos (CDN, iconos, etc.): cache-first con fallback a red.
  event.respondWith(cacheFirst(request));
});

async function networkFirstNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    const fallback = await caches.match('./index.html');
    if (fallback) return fallback;

    return new Response(
      '<!doctype html><html lang="es"><meta charset="utf-8"><title>Sin conexion</title><body><h1>Sin conexion</h1><p>No hay red y no existe contenido en cache.</p></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse && networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || networkPromise || fetch(request);
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}