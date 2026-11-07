// Service worker de ZOMBRAX: guarda el juego en el teléfono para abrirlo rápido y sin conexión.
// Al publicar una actualización del juego, cambia el número de VERSION para que los teléfonos la descarguen.
const VERSION = 'zombrax-v1';
const ARCHIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
const MOTOR3D = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS).then(() => c.add(MOTOR3D).catch(() => {}))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  // el multijugador (Firebase) y el APK siempre van por internet
  if (r.method !== 'GET' || /firebase|googleapis|gstatic/.test(u.hostname) || u.pathname.endsWith('.apk')) return;
  // la página del juego: primero internet (para recibir actualizaciones), si no hay conexión la copia guardada
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then(res => { const c = res.clone(); caches.open(VERSION).then(k => k.put('./index.html', c)); return res; })
              .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // el resto (motor 3D, íconos): primero la copia guardada
  e.respondWith(
    caches.match(r).then(m => m || fetch(r).then(res => {
      if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(VERSION).then(k => k.put(r, c)); }
      return res;
    }))
  );
});
