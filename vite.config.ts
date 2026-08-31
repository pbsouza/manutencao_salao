import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function fcmBroadcastPlugin(): Plugin {
  return {
    name: 'fcm-broadcast-api',
    configureServer(server) {
      server.middlewares.use('/api/fcm/broadcast', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const { title, body: contentBody, linkTab, serviceId, equipmentId, tokens } = parsed;
              const targetTokens: string[] = Array.isArray(tokens) ? tokens : [];
              const apiKey = process.env.FIREBASE_SERVER_KEY || 'AIzaSyC3GlZ-iIQiOPtW6WpzwRl1NQYGb_RfRl8';

              const results: Array<{ token: string; status: 'success' | 'failed' }> = [];

              for (const token of targetTokens) {
                if (!token) continue;
                try {
                  const fcmPayload = {
                    to: token,
                    collapse_key: 'sr_maintenance',
                    priority: 'high',
                    notification: {
                      title: title || 'Salão do Reino • Manutenção',
                      body: contentBody || 'Atualização de serviço recebida.',
                      icon: '/icon-192.png',
                      badge: '/favicon-32x32.png',
                      sound: 'default',
                    },
                    data: {
                      title: title || 'Salão do Reino • Manutenção',
                      body: contentBody || 'Atualização de serviço recebida.',
                      linkTab: linkTab || 'kanban',
                      serviceId: serviceId || '',
                      equipmentId: equipmentId || '',
                      timestamp: String(Date.now()),
                    },
                  };

                  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `key=${apiKey}`,
                    },
                    body: JSON.stringify(fcmPayload),
                  });

                  if (response.ok) {
                    results.push({ token, status: 'success' });
                  } else {
                    results.push({ token, status: 'failed' });
                  }
                } catch {
                  results.push({ token, status: 'failed' });
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                totalTargeted: targetTokens.length,
                successCount: results.filter((r) => r.status === 'success').length,
                results,
              }));
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: msg }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), fcmBroadcastPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
