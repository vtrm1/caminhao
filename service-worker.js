const CACHE_VERSION = 'v2';
const CACHE_NAME = `caminhao-cache-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-48-48.png',
  '/icon-96-96.png',
  '/icon-192-192.png',
  '/icon-512-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Ignorar Firebase e Google
  if (
    req.url.includes('firebase') ||
    req.url.includes('googleapis') ||
    req.url.includes('gstatic')
  ) {
    return;
  }

  if (req.method !== 'GET') return;

  event.respondWith(cacheThenNetwork(req));
});

async function cacheThenNetwork(req) {
  const cached = await caches.match(req);
  if (cached) return cached;

  try {
    const fresh = await fetch(req);
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    return await caches.match('/index.html');
  }
}
