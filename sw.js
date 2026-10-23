// Offline support: the page itself is network-first (so updates show up), everything else cache-first.
// The charting and formula libraries are pinned copies in vendor/, precached with the page so the installed app works
// with no connection. Bump CACHE when a vendor file changes.
const CACHE = 'rbi-v4';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  './vendor/plotly-cartesian-2.35.2.min.js', './vendor/mathjax-3.2.2-tex-svg-full.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // the page and data files (refreshed monthly, e.g. data/counties.json) are network-first, so updates show up
  const isPage = req.mode === 'navigate' || (url.origin === location.origin && (url.pathname.endsWith('.html') || url.pathname.includes('/data/')));
  if (isPage) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(cc => cc.put(req, c)); return r; })
      .catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(cc => cc.put(req, c)); }
    return r;
  })));
});
