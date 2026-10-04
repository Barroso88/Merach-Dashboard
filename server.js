import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

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

// ==========================================
// POSTGRESQL DATABASE INTEGRATION (UNRAID)
// ==========================================
let dbPool = null;
let isPostgresReady = false;
let lastPostgresError = null;

async function initPostgresTables() {
  if (!dbPool) return;
  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS merach_settings (
        id VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS merach_workouts (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        duration_seconds INTEGER NOT NULL,
        distance_km NUMERIC(8, 2) NOT NULL,
        calories_kcal INTEGER NOT NULL,
        avg_speed NUMERIC(6, 1) NOT NULL,
        max_speed NUMERIC(6, 1) NOT NULL,
        avg_cadence INTEGER NOT NULL,
        max_cadence INTEGER NOT NULL,
        avg_resistance INTEGER,
        notes TEXT,
        samples JSONB,
        raw_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_merach_workouts_date ON merach_workouts(date DESC);

      CREATE TABLE IF NOT EXISTS merach_routes (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabelas do PostgreSQL (settings, workouts, routes) verificadas e ativas!');
  } catch (err) {
    console.error('⚠️ Erro ao criar tabelas no PostgreSQL:', err.message);
    throw err;
  }
}

async function upsertWorkoutToPostgres(w) {
  if (!dbPool || !w || !w.id) return;
  const wId = String(w.id);
  const wTitle = String(w.title || 'Treino Merach Bike');
  const wDate = new Date(w.date || Date.now()).toISOString();
  const wDuration = Math.round(Number(w.durationSeconds || w.duration) || 0);
  const wDistance = Number(Number(w.distanceKm || w.distance || 0).toFixed(2));
  const wCalories = Math.round(Number(w.caloriesKcal || w.calories || 0));
  const wAvgSpeed = Number(Number(w.avgSpeed || 0).toFixed(1));
  const wMaxSpeed = Number(Number(w.maxSpeed || 0).toFixed(1));
  const wAvgCadence = Math.round(Number(w.avgCadence || 0));
  const wMaxCadence = Math.round(Number(w.maxCadence || 0));
  const wAvgResistance = Math.round(Number(w.avgResistance || 0));
  const wNotes = String(w.notes || '');
  const wSamples = JSON.stringify(w.samples || []);
  const wRawData = JSON.stringify(w);

  await dbPool.query(`
    INSERT INTO merach_workouts (
      id, title, date, duration_seconds, distance_km, calories_kcal,
      avg_speed, max_speed, avg_cadence, max_cadence, avg_resistance,
      notes, samples, raw_data
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      date = EXCLUDED.date,
      duration_seconds = EXCLUDED.duration_seconds,
      distance_km = EXCLUDED.distance_km,
      calories_kcal = EXCLUDED.calories_kcal,
      avg_speed = EXCLUDED.avg_speed,
      max_speed = EXCLUDED.max_speed,
      avg_cadence = EXCLUDED.avg_cadence,
      max_cadence = EXCLUDED.max_cadence,
      avg_resistance = EXCLUDED.avg_resistance,
      notes = EXCLUDED.notes,
      samples = EXCLUDED.samples,
      raw_data = EXCLUDED.raw_data
  `, [
    wId, wTitle, wDate, wDuration, wDistance, wCalories,
    wAvgSpeed, wMaxSpeed, wAvgCadence, wMaxCadence, wAvgResistance,
    wNotes, wSamples, wRawData
  ]);
}

async function upsertRouteToPostgres(r) {
  if (!dbPool || !r || !r.id) return;
  const rId = String(r.id);
  const rTitle = String(r.name || r.title || 'Percurso');
  const rData = JSON.stringify(r);

  await dbPool.query(`
    INSERT INTO merach_routes (id, title, data)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      data = EXCLUDED.data
  `, [rId, rTitle, rData]);
}

async function autoMigrateLocalDataToPostgres() {
  if (!dbPool || !isPostgresReady) return;
  try {
    const localWorkouts = readJsonFile(WORKOUTS_FILE, []).filter(w => w && !isMockWorkout(w.id));
    if (localWorkouts.length > 0) {
      for (const w of localWorkouts) {
        await upsertWorkoutToPostgres(w);
      }
      console.log(`🔄 Sincronizados ${localWorkouts.length} treinos locais para o PostgreSQL.`);
    }

    const localRoutes = readJsonFile(ROUTES_FILE, []);
    if (localRoutes.length > 0) {
      for (const r of localRoutes) {
        await upsertRouteToPostgres(r);
      }
      console.log(`🔄 Sincronizadas ${localRoutes.length} rotas personalizadas para o PostgreSQL.`);
    }
  } catch (err) {
    console.warn('Aviso na migração inicial para Postgres:', err.message);
  }
}

async function connectPostgres(configOverride = null) {
  const currentSettings = readJsonFile(SETTINGS_FILE, {});
  const savedPg = currentSettings?.postgresConfig || {};

  const host = configOverride?.host || process.env.PG_HOST || process.env.PGHOST || savedPg.host;
  const dbUrl = configOverride?.databaseUrl || process.env.DATABASE_URL || savedPg.databaseUrl;
  const port = parseInt(configOverride?.port || process.env.PG_PORT || process.env.PGPORT || savedPg.port || '5432', 10);
  const user = configOverride?.user || process.env.PG_USER || process.env.PGUSER || savedPg.user || 'postgres';
  const password = configOverride?.password !== undefined 
    ? configOverride.password 
    : (process.env.PG_PASSWORD ?? process.env.PGPASSWORD ?? savedPg.password ?? '');
  const database = configOverride?.database || process.env.PG_DATABASE || process.env.PGDATABASE || savedPg.database || 'merach';

  if (!dbUrl && !host) {
    isPostgresReady = false;
    lastPostgresError = 'Nenhum host ou URL de PostgreSQL configurado';
    return { success: false, error: lastPostgresError };
  }

  const poolConfig = dbUrl
    ? { connectionString: dbUrl }
    : {
        host,
        port,
        user,
        password,
        database
      };

  try {
    if (dbPool) {
      try { await dbPool.end(); } catch {}
    }

    const newPool = new Pool({
      ...poolConfig,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10
    });

    await newPool.query('SELECT NOW()');
    dbPool = newPool;
    await initPostgresTables();
    isPostgresReady = true;
    lastPostgresError = null;
    console.log(`✅ Ligado ao PostgreSQL no Unraid com sucesso (${dbUrl ? 'URL' : `${host}:${port}/${database}`})!`);

    await autoMigrateLocalDataToPostgres();
    return { success: true };
  } catch (err) {
    console.warn('⚠️ Falha ao contactar PostgreSQL, a usar armazenamento local em ficheiro:', err.message);
    isPostgresReady = false;
    lastPostgresError = err.message;
    return { success: false, error: err.message };
  }
}

// Initial connection attempt on server launch
connectPostgres().catch(() => {});

function isMockWorkout(id) {
  return ['wo-1', 'wo-2', 'wo-3', 'wo-4', 'wo-5', 'wo-6', 'wo-7'].includes(id);
}

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

  // 3. PostgreSQL Live Test Endpoint
  if (parsedUrl.pathname === '/api/postgres/test') {
    if (req.method === 'POST') {
      try {
        const body = await readBody(req);
        const testRes = await connectPostgres(body);
        if (testRes.success) {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ 
            success: true, 
            message: 'Ligação ao PostgreSQL estabelecida com sucesso! Tabelas verificadas.' 
          }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(JSON.stringify({ success: false, error: testRes.error }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    }
  }

  // 4. Centralized Settings API (PostgreSQL / JSON file / Environment Variables)
  if (parsedUrl.pathname === '/api/settings') {
    if (req.method === 'GET') {
      let saved = {};
      if (isPostgresReady && dbPool) {
        try {
          const dbRes = await dbPool.query("SELECT data FROM merach_settings WHERE id = 'default'");
          if (dbRes.rows.length > 0) {
            saved = dbRes.rows[0].data || {};
          }
        } catch (err) {
          console.warn('Erro ao ler settings no Postgres:', err.message);
          saved = readJsonFile(SETTINGS_FILE, {});
        }
      } else {
        saved = readJsonFile(SETTINGS_FILE, {});
      }

      // Allow overriding or defaulting via Unraid Docker Environment Variables
      const envSettings = {};
      if (process.env.HA_URL) envSettings.haUrl = process.env.HA_URL;
      if (process.env.HA_TOKEN) envSettings.haToken = process.env.HA_TOKEN;
      if (process.env.CF_CLIENT_ID) envSettings.cfClientId = process.env.CF_CLIENT_ID;
      if (process.env.CF_CLIENT_SECRET) envSettings.cfClientSecret = process.env.CF_CLIENT_SECRET;
      if (process.env.GOOGLE_MAPS_API_KEY) envSettings.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

      const merged = { 
        ...saved, 
        ...envSettings, 
        postgresConnected: isPostgresReady,
        postgresError: lastPostgresError
      };
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(merged));
    }

    if (req.method === 'POST') {
      try {
        const body = await readBody(req);
        let existing = {};
        if (isPostgresReady && dbPool) {
          try {
            const dbRes = await dbPool.query("SELECT data FROM merach_settings WHERE id = 'default'");
            if (dbRes.rows.length > 0) {
              existing = dbRes.rows[0].data || {};
            }
          } catch {
            existing = readJsonFile(SETTINGS_FILE, {});
          }
        } else {
          existing = readJsonFile(SETTINGS_FILE, {});
        }

        const updated = { ...existing, ...body };
        // Save to file backup
        writeJsonFile(SETTINGS_FILE, updated);

        // If postgresConfig was updated, dynamically connect
        if (body.postgresConfig) {
          await connectPostgres(body.postgresConfig);
        }

        // Save to PostgreSQL if connected
        if (isPostgresReady && dbPool) {
          try {
            await dbPool.query(`
              INSERT INTO merach_settings (id, data, updated_at)
              VALUES ('default', $1, NOW())
              ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
            `, [JSON.stringify(updated)]);
          } catch (err) {
            console.error('Erro ao guardar settings no PostgreSQL:', err.message);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ 
          success: true, 
          settings: updated, 
          postgresConnected: isPostgresReady,
          postgresError: lastPostgresError 
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    }
  }

  // 5. Centralized Workouts API (PostgreSQL / JSON storage)
  if (parsedUrl.pathname === '/api/workouts') {
    if (req.method === 'GET') {
      let workouts = [];

      if (isPostgresReady && dbPool) {
        try {
          const dbRes = await dbPool.query('SELECT raw_data FROM merach_workouts ORDER BY date DESC');
          workouts = dbRes.rows.map(r => r.raw_data);
        } catch (err) {
          console.warn('Erro ao ler treinos do PostgreSQL:', err.message);
          workouts = readJsonFile(WORKOUTS_FILE, []);
        }
      } else {
        workouts = readJsonFile(WORKOUTS_FILE, []);
      }

      // Purge any mock/test workouts
      if (Array.isArray(workouts)) {
        workouts = workouts.filter(w => w && !isMockWorkout(w.id));
      } else {
        workouts = [];
      }

      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(workouts));
    }

    if (req.method === 'POST') {
      try {
        const body = await readBody(req);
        const incoming = Array.isArray(body) ? body : (body && body.id ? [body] : []);
        const list = incoming.filter(w => w && !isMockWorkout(w.id));

        // Merge incoming workouts with existing list for backup file
        const currentList = readJsonFile(WORKOUTS_FILE, []).filter(w => w && !isMockWorkout(w.id));
        const mergedMap = new Map();
        for (const w of currentList) if (w && w.id) mergedMap.set(w.id, w);
        for (const w of list) if (w && w.id) mergedMap.set(w.id, w);
        const allWorkouts = Array.from(mergedMap.values()).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        // Save to file backup
        writeJsonFile(WORKOUTS_FILE, allWorkouts);

        // Save to PostgreSQL if available
        if (isPostgresReady && dbPool) {
          try {
            for (const w of list) {
              await upsertWorkoutToPostgres(w);
            }
            console.log(`✅ ${list.length} treino(s) guardado(s) com sucesso no PostgreSQL.`);
          } catch (err) {
            console.error('Erro ao guardar treinos no PostgreSQL:', err.message);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ success: true, count: list.length, postgresConnected: isPostgresReady }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    }

    if (req.method === 'DELETE') {
      try {
        const body = await readBody(req);
        const targetId = body?.id || parsedUrl.searchParams.get('id');
        if (targetId) {
          const currentList = readJsonFile(WORKOUTS_FILE, []).filter(w => w.id !== targetId);
          writeJsonFile(WORKOUTS_FILE, currentList);

          if (isPostgresReady && dbPool) {
            try {
              await dbPool.query('DELETE FROM merach_workouts WHERE id = $1', [targetId]);
              console.log(`🗑️ Treino ${targetId} removido do PostgreSQL.`);
            } catch (err) {
              console.error('Erro ao remover treino no PostgreSQL:', err.message);
            }
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    }
  }

  // 6. Centralized Custom Routes API
  if (parsedUrl.pathname === '/api/routes') {
    if (req.method === 'GET') {
      let routes = [];
      if (isPostgresReady && dbPool) {
        try {
          const dbRes = await dbPool.query('SELECT data FROM merach_routes ORDER BY created_at DESC');
          routes = dbRes.rows.map(r => r.data);
        } catch {
          routes = readJsonFile(ROUTES_FILE, []);
        }
      } else {
        routes = readJsonFile(ROUTES_FILE, []);
      }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(JSON.stringify(routes || []));
    }

    if (req.method === 'POST') {
      try {
        const body = await readBody(req);
        const incoming = Array.isArray(body) ? body : (body && body.id ? [body] : []);
        const list = incoming.filter(r => r && r.id);

        const currentList = readJsonFile(ROUTES_FILE, []);
        const mergedMap = new Map();
        for (const r of currentList) if (r && r.id) mergedMap.set(r.id, r);
        for (const r of list) if (r && r.id) mergedMap.set(r.id, r);
        const allRoutes = Array.from(mergedMap.values());

        writeJsonFile(ROUTES_FILE, allRoutes);

        if (isPostgresReady && dbPool) {
          try {
            for (const r of list) {
              await upsertRouteToPostgres(r);
            }
            console.log(`✅ ${list.length} percurso(s) guardado(s) com sucesso no PostgreSQL.`);
          } catch (err) {
            console.error('Erro ao guardar rotas no PostgreSQL:', err.message);
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ success: true, count: list.length, postgresConnected: isPostgresReady }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    }

    if (req.method === 'DELETE') {
      try {
        const body = await readBody(req);
        const targetId = body?.id || parsedUrl.searchParams.get('id');
        if (targetId) {
          const currentList = readJsonFile(ROUTES_FILE, []).filter(r => r.id !== targetId);
          writeJsonFile(ROUTES_FILE, currentList);

          if (isPostgresReady && dbPool) {
            try {
              await dbPool.query('DELETE FROM merach_routes WHERE id = $1', [targetId]);
              console.log(`🗑️ Rota ${targetId} removida do PostgreSQL.`);
            } catch (err) {
              console.error('Erro ao remover rota no PostgreSQL:', err.message);
            }
          }
        }
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
