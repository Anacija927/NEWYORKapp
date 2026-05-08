// ============================================================================
// service-worker.js
// PWA New York · Jade & Arthur · mai 2026
//
// Strategies:
//   - Local files: pre-cache on install (offline garanti dès la 1re visite)
//   - Google Fonts (googleapis + gstatic): runtime cache, cache-first
//     → la 1re visite en ligne met les fontes en cache pour toujours
//   - Tout le reste: network only (rien à cacher)
//
// Pour invalider le cache (après modif d'un fichier), bumper CACHE_VERSION.
// ============================================================================

const CACHE_VERSION = 'v1';
const PRECACHE = `nyc-precache-${CACHE_VERSION}`;
const RUNTIME  = `nyc-runtime-${CACHE_VERSION}`;

// Tous les fichiers de l'app, à pré-cacher au moment de l'installation du SW.
// Si tu ajoutes un fichier (nouveau quartier, nouvelle image), AJOUTE-LE ICI
// puis bumpe la version (v1 → v2) pour forcer la mise à jour.
const PRECACHE_URLS = [
  './',
  './index.html',
  './utile.html',

  // Quartiers Manhattan (du nord au sud)
  './harlem-day.html',
  './upper-west-side-day.html',
  './upper-east-side-day.html',
  './midtown-day.html',
  './chelsea-day.html',
  './flatiron-gramercy-day.html',
  './greenwich-west-village-day.html',
  './east-village-day.html',
  './little-italy-chinatown-day.html',
  './sud-manhattan-day.html',

  // Brooklyn
  './brooklyn-index.html',
  './williamsburg-day.html',
  './dumbo-day.html',
  './bushwick-day.html',
  './brooklyn-heights-day.html',

  // Lieux & emblèmes
  './rockefeller-center.html',
  './liberty-ellis-day.html',

  // Assets
  './assets/nyc-map.jpg',
  './assets/password-gate.js',
  './assets/nav-buttons.js',
];

// ── INSTALL : pré-cache tous les fichiers locaux ──────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE : nettoie les anciens caches ────────────────────────────────
self.addEventListener('activate', (event) => {
  const allowed = new Set([PRECACHE, RUNTIME]);
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(names.map((n) => allowed.has(n) ? null : caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

// ── FETCH : stratégies par type de requête ────────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Ignore tout ce qui n'est pas GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. Google Fonts : cache-first avec mise en cache runtime
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, clone));
          }
          return res;
        }).catch(() => cached); // si offline et pas en cache, retourne null
      })
    );
    return;
  }

  // 2. Same-origin (notre app) : cache-first, fallback réseau, fallback offline
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          // Met en cache runtime pour les requêtes hors precache (rare)
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(RUNTIME).then((c) => c.put(req, clone));
          }
          return res;
        }).catch(() => {
          // Offline et pas en cache : si c'est une page HTML, on renvoie l'accueil
          if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
          // Sinon échec silencieux
          return new Response('', { status: 504, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  // 3. Tout le reste : réseau uniquement (pas de cache)
});
