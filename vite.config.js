import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Transparent CORS proxy middleware for Home Assistant API calls
function haProxyPlugin() {
  return {
    name: 'ha-proxy-middleware',
    configureServer(server) {
      server.middlewares.use('/ha-proxy', async (req, res) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const target = urlObj.searchParams.get('target');
          if (!target) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing target URL parameter' }));
            return;
          }

          const forwardHeaders = {};
          if (req.headers['authorization']) {
            forwardHeaders['Authorization'] = req.headers['authorization'];
          }
          if (req.headers['content-type']) {
            forwardHeaders['Content-Type'] = req.headers['content-type'];
          }
          if (req.headers['cf-access-client-id']) {
            forwardHeaders['CF-Access-Client-Id'] = req.headers['cf-access-client-id'];
          }
          if (req.headers['cf-access-client-secret']) {
            forwardHeaders['CF-Access-Client-Secret'] = req.headers['cf-access-client-secret'];
          }

          const response = await fetch(target, {
            method: req.method || 'GET',
            headers: forwardHeaders,
            signal: AbortSignal.timeout(8000)
          });

          res.statusCode = response.status;
          res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          const body = await response.text();
          res.end(body);
        } catch (err) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `Falha no proxy local: ${err.message}` }));
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    haProxyPlugin()
  ],
})
