// Firebase Cloud Messaging Service Worker (FCM)
// Handles background push notifications when the app is minimized, in background, or device is locked

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

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Background message handler for FCM
  messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background push message:', payload);

    const title = payload.notification?.title || payload.data?.title || 'Salão do Reino • Manutenção 🔔';
    const body = payload.notification?.body || payload.data?.body || 'Nova notificação de manutenção recebida no seu dispositivo.';
    const icon = payload.notification?.icon || payload.data?.icon || '/icon-192.png';
    const badge = payload.notification?.badge || payload.data?.badge || '/favicon-32x32.png';
    const tag = payload.data?.tag || payload.collapse_key || `fcm-push-${Date.now()}`;

    const notificationOptions = {
      body: body,
      icon: icon,
      badge: badge,
      vibrate: [200, 100, 200, 100, 200],
      tag: tag,
      renotify: true,
      requireInteraction: true,
      data: {
        url: payload.data?.url || '/',
        linkTab: payload.data?.linkTab || 'kanban',
        serviceId: payload.data?.serviceId || null,
        equipmentId: payload.data?.equipmentId || null,
        timestamp: Date.now(),
        ...(payload.data || {})
      },
      actions: [
        { action: 'open_app', title: 'Abrir App 📱' },
        { action: 'dismiss', title: 'Dispensar' }
      ]
    };

    return self.registration.showNotification(title, notificationOptions);
  });
} catch (err) {
  console.warn('[firebase-messaging-sw.js] Falha ao inicializar compat FCM:', err);
}

// Notification click event handler
self.addEventListener('notificationclick', function (event) {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification.tag);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      // Check if there is already a window open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Send message to the client to switch tabs if data provided
          if (event.notification.data?.linkTab && 'postMessage' in client) {
            client.postMessage({
              type: 'FCM_NAVIGATE',
              linkTab: event.notification.data.linkTab,
              serviceId: event.notification.data.serviceId,
              equipmentId: event.notification.data.equipmentId
            });
          }
          return client.focus();
        }
      }
      // If no window is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Push event fallback in case standard Web Push arrives
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    console.log('[firebase-messaging-sw.js] Push event payload:', payload);

    const title = payload.notification?.title || payload.title || payload.data?.title || 'Salão do Reino • Manutenção 🔔';
    const body = payload.notification?.body || payload.body || payload.data?.body || 'Atualização no sistema de manutenção';
    const icon = payload.notification?.icon || payload.icon || '/icon-192.png';
    const badge = payload.notification?.badge || payload.badge || '/favicon-32x32.png';

    const options = {
      body: body,
      icon: icon,
      badge: badge,
      vibrate: [200, 100, 200, 100, 200],
      tag: payload.tag || `push-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      data: payload.data || { url: '/' }
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Salão do Reino • Alerta 🔔', {
        body: text,
        icon: '/icon-192.png',
        vibrate: [200, 100, 200]
      })
    );
  }
});
