import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = parseInt(process.env.PORT || '80', 10);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create DATA_DIR:', err.message);
  }
}

const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const WORKOUTS_FILE = path.join(DATA_DIR, 'workouts.json');
const ROUTES_FILE = path.join(DATA_DIR, 'routes.json');

function readJsonFile(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // 1. Transparent CORS proxy for Home Assistant
  if (parsedUrl.pathname === '/ha-proxy') {
    const target = parsedUrl.searchParams.get('target');
    if (!target) {
      res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ error: 'Missing target URL parameter' }));
    }

    try {
      const forwardHeaders = {};
      for (const [k, v] of Object.entries(req.headers)) {
        const lk = k.toLowerCase();
        if (['authorization', 'content-type', 'cf-access-client-id', 'cf-access-client-secret'].includes(lk)) {
          forwardHeaders[k] = v;
        }
      }

      const targetRes = await fetch(target, {
        method: req.method || 'GET',
        headers: forwardHeaders,
        signal: AbortSignal.timeout(10000)
      });

      const body = await targetRes.text();
      res.writeHead(targetRes.status, {
        'Content-Type': targetRes.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(body);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify({ error: `Falha no proxy local: ${err.message}` }));
    }
  }

  // 2. Healthcheck endpoint
  if (parsedUrl.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('OK');
  }

  // 3. Centralized Settings API (synced across all user devices & Docker env variables)
  if (parsedUrl.pathname === '/api/settings') {
    if (req.method === 'GET') {
      const saved = readJsonFile(SETTINGS_FILE, {});
      // Allow overriding or defaulting via Unraid Docker Environment Variables
      const envSettings = {};
      if (process.env.HA_URL) envSettings.haUrl = process.env.HA_URL;
      if (process.env.HA_TOKEN) envSettings.haToken = process.env.HA_TOKEN;
      if (process.env.CF_CLIENT_ID) envSettings.cfClientId = process.env.CF_CLIENT_ID;
      if (process.env.CF_CLIENT_SECRET) envSettings.cfClientSecret = process.env.CF_CLIENT_SECRET;
      if (process.env.GOOGLE_MAPS_API_KEY) envSettings.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

      const merged = { ...saved, ...envSettings };
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(merged));
    }
    if (req.method === 'POST') {
      try {
        const body = await readBody(req);
        const existing = readJsonFile(SETTINGS_FILE, {});
        const updated = { ...existing, ...body };
        writeJsonFile(SETTINGS_FILE, updated);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ success: true, settings: updated }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    }
  }

  // 4. Centralized Workouts API
  if (parsedUrl.pathname === '/api/workouts') {
    if (req.method === 'GET') {
      const workouts = readJsonFile(WORKOUTS_FILE, null);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(workouts));
    }
    if (req.method === 'POST') {
      try {
        const body = await readBody(req);
        writeJsonFile(WORKOUTS_FILE, body);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    }
  }

  // 5. Centralized Custom Routes API
  if (parsedUrl.pathname === '/api/routes') {
    if (req.method === 'GET') {
      const routes = readJsonFile(ROUTES_FILE, null);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(routes));
    }
    if (req.method === 'POST') {
      try {
        const body = await readBody(req);
        writeJsonFile(ROUTES_FILE, body);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    }
  }

  // 6. Static Files (SPA with fallback to index.html)
  let relativePath = parsedUrl.pathname.replace(/^\/+/, '');
  let filePath = path.join(DIST_DIR, relativePath);

  // If path doesn't exist or is directory, serve index.html (SPA routing)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  try {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable'
    });
    res.end(content);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Merach Dashboard server running on port ${PORT}`);
});
