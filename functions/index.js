const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');

// Initialize Firebase Admin SDK
initializeApp();

const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-manutenosalodore-2212c8fa-bb2a-4905-a330-cb547086c9c6';

/**
 * Helper to get the Firestore instance for our specific database
 */
function getDb() {
  try {
    return getFirestore(DATABASE_ID);
  } catch (err) {
    logger.warn('Could not initialize named Firestore database, falling back to default:', err);
    return getFirestore();
  }
}

/**
 * Dispatches a high-priority FCM Push Notification to all registered device tokens
 */
async function sendPushToAllTokens({ title, body, linkTab, serviceId, equipmentId, senderToken }) {
  const db = getDb();
  const messaging = getMessaging();

  // 1. Fetch all registered device tokens
  const tokensSnapshot = await db.collection('fcmTokens').get();
  if (tokensSnapshot.empty) {
    logger.info('No registered FCM tokens found in fcmTokens collection.');
    return { success: true, count: 0, sentCount: 0 };
  }

  const tokenDocs = [];
  tokensSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data && data.token) {
      // Exclude sender if requested to avoid echo
      if (!senderToken || data.token !== senderToken) {
        tokenDocs.push({ id: doc.id, token: data.token });
      }
    }
  });

  if (tokenDocs.length === 0) {
    logger.info('No target device tokens after filtering sender.');
    return { success: true, count: 0, sentCount: 0 };
  }

  const tokens = tokenDocs.map((t) => t.token);
  logger.info(`Sending FCM Push to ${tokens.length} registered device(s)...`);

  const tag = serviceId ? `sr-service-${serviceId}` : equipmentId ? `sr-eq-${equipmentId}` : `sr-push-${Date.now()}`;

  // 2. Build multi-platform push message
  const multicastMessage = {
    tokens,
    notification: {
      title: title || 'Salão do Reino • Manutenção 🔔',
      body: body || 'Nova notificação de serviço recebida.',
    },
    data: {
      title: title || 'Salão do Reino • Manutenção 🔔',
      body: body || 'Nova notificação de serviço recebida.',
      linkTab: linkTab || 'kanban',
      serviceId: serviceId || '',
      equipmentId: equipmentId || '',
      tag,
      timestamp: String(Date.now()),
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'sr_maintenance_channel',
        sound: 'default',
        priority: 'high',
        defaultSound: true,
        defaultVibrateTimings: true,
        tag,
      },
    },
    webpush: {
      headers: {
        Urgency: 'high',
        TTL: '86400',
      },
      notification: {
        icon: '/icon-192.png',
        badge: '/favicon-32x32.png',
        vibrate: [200, 100, 200, 100, 200],
        tag,
        renotify: true,
        requireInteraction: true,
      },
      fcmOptions: {
        link: '/',
      },
    },
  };

  // 3. Send multicast message
  const response = await messaging.sendEachForMulticast(multicastMessage);
  logger.info(`FCM multicast sent: ${response.successCount} successful, ${response.failureCount} failed.`);

  // 4. Clean up inactive / unregistered tokens automatically
  const tokensToDelete = [];
  response.responses.forEach((resp, idx) => {
    if (!resp.success && resp.error) {
      const code = resp.error.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        tokensToDelete.push(tokenDocs[idx].id);
      }
    }
  });

  if (tokensToDelete.length > 0) {
    logger.info(`Cleaning up ${tokensToDelete.length} stale FCM token(s)...`);
    const batch = db.batch();
    tokensToDelete.forEach((docId) => {
      batch.delete(db.collection('fcmTokens').doc(docId));
    });
    await batch.commit().catch((err) => logger.warn('Error deleting stale tokens:', err));
  }

  // 5. Log notification in Firestore
  try {
    const notifId = `fcm_log_${Date.now()}`;
    await db.collection('fcmNotifications').doc(notifId).set({
      title,
      body,
      targetTokensCount: tokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
      status: 'SENT',
      sentAt: new Date().toISOString(),
      linkTab: linkTab || 'kanban',
      serviceId: serviceId || null,
      equipmentId: equipmentId || null,
    });
  } catch (logErr) {
    logger.warn('Could not write fcmNotifications log:', logErr);
  }

  return {
    success: true,
    totalCount: tokens.length,
    sentCount: response.successCount,
    failedCount: response.failureCount,
  };
}

/**
 * TRIGGER 1: Automatically sends a Push Notification whenever a new service/task
 * is registered in Firestore (/services/{serviceId})
 */
exports.onServiceCreated = onDocumentCreated(
  {
    document: 'services/{serviceId}',
    database: DATABASE_ID,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      logger.info('No data associated with the event.');
      return;
    }

    const service = snap.data();
    const serviceId = event.params.serviceId;

    logger.info(`New service created: ${service.title} (${serviceId})`);

    const title = 'Novo Problema Registrado 🔔';
    const body = `[${service.category || 'Geral'} • ${service.location || 'Salão'}] ${service.title || 'Chamado de manutenção'} — Prioridade: ${service.priority || 'Média'}`;

    await sendPushToAllTokens({
      title,
      body,
      linkTab: 'kanban',
      serviceId,
    });
  }
);

/**
 * TRIGGER 2: Also listen on default database in case the project uses the default database
 */
exports.onServiceCreatedDefault = onDocumentCreated(
  {
    document: 'services/{serviceId}',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const service = snap.data();
    const serviceId = event.params.serviceId;

    const title = 'Novo Problema Registrado 🔔';
    const body = `[${service.category || 'Geral'} • ${service.location || 'Salão'}] ${service.title || 'Chamado de manutenção'} — Prioridade: ${service.priority || 'Média'}`;

    await sendPushToAllTokens({
      title,
      body,
      linkTab: 'kanban',
      serviceId,
    });
  }
);

/**
 * TRIGGER 3: Processes notifications queued via Firestore (/fcmQueue/{queueId})
 * Allows web clients (even on GitHub Pages) to trigger push notifications without any backend!
 */
exports.onFcmQueueCreated = onDocumentCreated(
  {
    document: 'fcmQueue/{queueId}',
    database: DATABASE_ID,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const item = snap.data();
    const queueId = event.params.queueId;

    if (item.status === 'PROCESSED') return;

    logger.info(`Processing fcmQueue item: ${queueId}`);

    const result = await sendPushToAllTokens({
      title: item.title,
      body: item.body,
      linkTab: item.linkTab || 'kanban',
      serviceId: item.serviceId,
      equipmentId: item.equipmentId,
      senderToken: item.senderToken,
    });

    // Mark as processed
    await snap.ref.update({
      status: 'PROCESSED',
      processedAt: new Date().toISOString(),
      sentCount: result.sentCount,
      failedCount: result.failedCount,
    });
  }
);

/**
 * HTTP ENDPOINT: sendPushNotification
 * Allows triggering push directly via HTTPS request with CORS support
 */
exports.sendPushNotification = onRequest(
  { cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
      return;
    }

    try {
      const { title, body, linkTab, serviceId, equipmentId, senderToken } = req.body || {};

      if (!title || !body) {
        res.status(400).json({ error: 'Missing title or body' });
        return;
      }

      const result = await sendPushToAllTokens({
        title,
        body,
        linkTab,
        serviceId,
        equipmentId,
        senderToken,
      });

      res.status(200).json(result);
    } catch (err) {
      logger.error('Error in sendPushNotification HTTP endpoint:', err);
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }
);
