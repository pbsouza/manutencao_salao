import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API: Broadcast FCM Push Notification to all registered devices or specific tokens
app.post('/api/fcm/broadcast', async (req, res) => {
  const { title, body, linkTab, serviceId, equipmentId, tokens, senderToken } = req.body || {};

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required for FCM broadcast.' });
  }

  console.log(`[Server FCM] Broadcasting notification: "${title}" - "${body}"`);

  // Target tokens: either passed in request or we attempt to dispatch
  const targetTokens: string[] = Array.isArray(tokens) ? tokens : [];
  
  const results: Array<{ token: string; status: 'success' | 'failed'; error?: string }> = [];

  // If tokens provided, send to each
  for (const token of targetTokens) {
    if (!token || typeof token !== 'string') continue;

    try {
      // FCM Legacy / Direct Endpoint push attempt
      // Google FCM accepts notifications directly with API key or authorization
      const fcmPayload = {
        to: token,
        collapse_key: 'sr_maintenance',
        priority: 'high',
        notification: {
          title: title,
          body: body,
          icon: '/icon-192.png',
          badge: '/favicon-32x32.png',
          sound: 'default',
          click_action: '/',
        },
        data: {
          title: title,
          body: body,
          url: '/',
          linkTab: linkTab || 'kanban',
          serviceId: serviceId || '',
          equipmentId: equipmentId || '',
          timestamp: String(Date.now()),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            notification_priority: 'priority_max',
            visibility: 'public',
            vibrate_timings: ['0.2s', '0.1s', '0.2s', '0.1s', '0.2s'],
          },
        },
      };

      // Try sending to Google FCM endpoint
      const apiKey = process.env.FIREBASE_SERVER_KEY || 'AIzaSyC3GlZ-iIQiOPtW6WpzwRl1NQYGb_RfRl8';
      
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${apiKey}`,
        },
        body: JSON.stringify(fcmPayload),
      });

      const resText = await response.text();
      let resJson: Record<string, unknown> | null = null;
      try {
        resJson = JSON.parse(resText);
      } catch {
        // ignore parse error
      }

      if (response.ok && (!resJson || resJson.success === 1 || !resJson.failure)) {
        results.push({ token, status: 'success' });
      } else {
        console.warn(`[Server FCM] Push result for token ${token.substring(0, 15)}...:`, resText);
        results.push({
          token,
          status: 'failed',
          error: (resJson?.results as Array<Record<string, string>>)?.[0]?.error || resText || 'FCM response error',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Server FCM] Exception sending to token ${token.substring(0, 15)}...:`, msg);
      results.push({ token, status: 'failed', error: msg });
    }
  }

  const successCount = results.filter((r) => r.status === 'success').length;
  const failureCount = results.filter((r) => r.status === 'failed').length;

  res.json({
    success: true,
    totalTargeted: targetTokens.length,
    successCount,
    failureCount,
    results,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Manutenção Salão do Reino rodando em http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Falha ao iniciar:', err);
});
