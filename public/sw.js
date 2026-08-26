const CACHE_NAME = 'manutencao-sr-pwa-v3';

// Get base path from ServiceWorker registration scope (e.g. '/manutencao_salao/' or '/')
const getScopePath = () => {
  try {
    const scopeUrl = new URL(self.registration.scope);
    return scopeUrl.pathname.endsWith('/') ? scopeUrl.pathname : scopeUrl.pathname + '/';
  } catch (e) {
    return './';
  }
};

const BASE_PATH = getScopePath();

const STATIC_ASSETS = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}favicon.svg`,
  `${BASE_PATH}favicon.png`,
  `${BASE_PATH}icon.svg`,
  `${BASE_PATH}icon-192.png`,
  `${BASE_PATH}icon-192x192.png`,
  `${BASE_PATH}icon-512.png`,
  `${BASE_PATH}icon-512x512.png`,
  `${BASE_PATH}icon-maskable-512.png`,
  `${BASE_PATH}apple-touch-icon.png`
];

// Install Event - Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Add assets individually so one failure does not break the whole cache
      return Promise.allSettled(
        STATIC_ASSETS.map((assetUrl) =>
          fetch(assetUrl).then((response) => {
            if (response.ok) {
              return cache.put(assetUrl, response);
            }
          }).catch((err) => {
            console.warn('Non-fatal asset cache skip:', assetUrl, err);
          })
        )
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event - Clean old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event - Smart Cache Strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests, Chrome extensions, and Google/Firebase APIs
  if (
    event.request.method !== 'GET' ||
    url.protocol.startsWith('chrome-extension') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firebaseinstallations.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Navigation requests (HTML / SPA route) -> Network First with fallback to index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match(`${BASE_PATH}index.html`) || caches.match(BASE_PATH);
          });
        })
    );
    return;
  }

  // Static Assets (Icons, fonts, images, css, js) -> Cache First, fallback to Network
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2|woff|ttf|css|js)$/) ||
    STATIC_ASSETS.some((asset) => url.pathname.endsWith(asset) || url.href.endsWith(asset))
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        }).catch(() => {
          return caches.match(`${BASE_PATH}index.html`);
        });
      })
    );
    return;
  }

  // Default Network First
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
