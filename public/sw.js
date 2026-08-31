const CACHE_NAME = 'manutencao-sr-pwa-v4';

// Import Firebase Messaging scripts inside Service Worker for background push handling
try {
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

  const firebaseConfig = {
    projectId: "gen-lang-client-0282193407",
    appId: "1:247473690470:web:678a3df908e902cc019aa7",
    apiKey: "AIzaSyC3GlZ-iIQiOPtW6WpzwRl1NQYGb_RfRl8",
    authDomain: "gen-lang-client-0282193407.firebaseapp.com",
    storageBucket: "gen-lang-client-0282193407.firebasestorage.app",
    messagingSenderId: "247473690470"
  };

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Mensagem FCM em segundo plano:', payload);
    const title = payload.notification?.title || payload.data?.title || 'Salão do Reino • Manutenção 🔔';
    const body = payload.notification?.body || payload.data?.body || 'Atualização de serviço recebida.';
    const icon = payload.notification?.icon || payload.data?.icon || '/icon-192.png';
    const badge = payload.notification?.badge || payload.data?.badge || '/favicon-32x32.png';

    return self.registration.showNotification(title, {
      body,
      icon,
      badge,
      vibrate: [200, 100, 200, 100, 200],
      tag: payload.data?.tag || `fcm-bg-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      data: {
        url: payload.data?.url || '/',
        linkTab: payload.data?.linkTab || 'kanban',
        serviceId: payload.data?.serviceId || null,
        timestamp: Date.now(),
        ...(payload.data || {})
      }
    });
  });
} catch (fcmErr) {
  console.warn('[sw.js] Firebase compat skip:', fcmErr);
}

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

// Push Notification Event Listener (Web Push)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Manutenção Salão do Reino 🛠️',
    body: 'Nova atualização de serviço ou manutenção preventiva agendada.',
    icon: `${BASE_PATH}icon-192.png`,
    badge: `${BASE_PATH}favicon.png`,
    data: { url: BASE_PATH },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        ...data,
        ...payload,
        icon: payload.icon || `${BASE_PATH}icon-192.png`,
        badge: payload.badge || `${BASE_PATH}favicon.png`,
      };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: data.data || { url: BASE_PATH },
    tag: data.tag || 'sr-maintenance-push',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click Event Listener - Focus app or open tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || BASE_PATH;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
