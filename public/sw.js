const CACHE = 'app-v15';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/main.js',
  'js/splash.js',
  'js/proc.js',
  'js/theme.js',
  'js/gallery.js',
  'js/tools.js',
  'js/hd.js',
  'js/hd-worker.js',
  'js/refine.js',
  'js/ui.js',
  'js/model.js',
  'js/worker.js',
  'js/image.js',
  'vendor/ort/ort.wasm.min.mjs',
  'vendor/ort/ort-wasm-simd-threaded.mjs',
  'vendor/ort/ort-wasm-simd-threaded.wasm',
  'models/u2netp.onnx',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/maskable-192.png',
  'assets/icons/maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k.startsWith('app-') && k !== CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin || req.url.indexOf('modnet') !== -1 || req.url.indexOf('ads-config') !== -1) return;
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('index.html');
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
