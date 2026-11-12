/* Service worker de Resuelve Matemáticas.
   IMPORTANTE: al publicar una versión nueva, sube VERSION aquí y en index.html
   (la prueba `npm test` comprueba que coinciden). */
const VERSION = '3.0.0';
const CACHE = 'rm-' + VERSION;
const ARCHIVOS = ['./', 'index.html', 'manifest.webmanifest', 'logo.svg',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('rm-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Páginas: primero la red (así nunca se queda una versión vieja), con respaldo en caché sin conexión.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copia = r.clone(); caches.open(CACHE).then(c => c.put('index.html', copia)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  // Resto: caché primero y se actualiza en segundo plano.
  e.respondWith(caches.match(req).then(hit => {
    const red = fetch(req).then(r => { if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); } return r; }).catch(() => hit);
    return hit || red;
  }));
});
