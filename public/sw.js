// Service Worker: App-Shell offline verfügbar machen.
// Firebase-/Google-Anfragen (andere Origins) werden nie abgefangen.
const CACHE = 'questlog-v1';
const SHELL = ['/', '/quest', '/sitzungen', '/auswertung', '/reflexion', '/manifest.webmanifest', '/icons/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/__/')) return; // Firebase-Auth-Handler

  if (req.mode === 'navigate') {
    // Seiten: Netz zuerst, offline aus dem Cache (Query-String wie ?id= ignorieren).
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(url.pathname, copy));
          return res;
        })
        .catch(() => caches.match(url.pathname).then((r) => r || caches.match('/'))),
    );
    return;
  }

  // Statische Assets (gehashte Dateinamen): Cache zuerst.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
