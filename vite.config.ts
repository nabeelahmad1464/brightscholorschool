import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const CLOUD_BINS = [
  'https://extendsclass.com/api/json-storage/bin/bbedaaf',
  'https://extendsclass.com/api/json-storage/bin/dbabccb'
];

function extractCleanJsonFromText(rawText: string): any | null {
  if (!rawText || typeof rawText !== 'string') return null;
  const trimmed = rawText.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    // Strip appended HTML/scripts by scanning balanced root JSON object
  }
  const start = trimmed.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(trimmed.slice(start, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}

function schoolDatabasePlugin(): Plugin {
  const dbFile = path.resolve(__dirname, 'server_database.json');
  const fallbackDbFile = path.resolve(__dirname, 'src/data/school_database.json');
  let lastCloudPullMs = 0;

  const ensureDbExists = () => {
    if (!fs.existsSync(dbFile)) {
      if (fs.existsSync(fallbackDbFile)) {
        try {
          fs.copyFileSync(fallbackDbFile, dbFile);
        } catch {
          // ignore
        }
      }
    }
  };

  const readLocalDb = (): any | null => {
    ensureDbExists();
    if (!fs.existsSync(dbFile)) return null;
    try {
      return JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
    } catch {
      return null;
    }
  };

  const writeLocalDb = (data: any) => {
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(dbFile, json, 'utf-8');
    try {
      fs.writeFileSync(fallbackDbFile, json, 'utf-8');
    } catch {
      // ignore
    }
  };

  const syncFromCloudIfNewer = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastCloudPullMs < 4000) return;
    lastCloudPullMs = now;
    const localDb = readLocalDb();
    const localTime = localDb?.updatedAt ? new Date(localDb.updatedAt).getTime() : 0;

    for (const binUrl of CLOUD_BINS) {
      try {
        const res = await fetch(`${binUrl}?t=${now}`, {
          headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) continue;
        const raw = await res.text();
        const remote = extractCleanJsonFromText(raw);
        if (remote && Array.isArray(remote.students)) {
          const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
          const localCount = Array.isArray(localDb?.students) ? localDb.students.length : 0;
          if (remoteTime > localTime || (localCount === 0 && remote.students.length > 0)) {
            writeLocalDb(remote);
            break;
          }
        }
      } catch {
        // continue to next bin
      }
    }
  };

  let pendingCloudBody: string | null = null;
  let isReplicatingToCloud = false;

  const flushCloudQueue = async () => {
    if (isReplicatingToCloud) return;
    isReplicatingToCloud = true;
    try {
      while (pendingCloudBody !== null) {
        const body = pendingCloudBody;
        pendingCloudBody = null;
        lastCloudPullMs = Date.now();
        await Promise.allSettled(
          CLOUD_BINS.map(binUrl =>
            fetch(binUrl, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body
            })
          )
        );
        lastCloudPullMs = Date.now();
      }
    } finally {
      isReplicatingToCloud = false;
    }
  };

  const replicateToCloudAsync = (data: any) => {
    pendingCloudBody = JSON.stringify(data);
    lastCloudPullMs = Date.now();
    flushCloudQueue().catch(() => {});
  };

  ensureDbExists();
  syncFromCloudIfNewer(true).catch(() => {});

  const handleApiRequest = async (req: any, res: any, next: any) => {
    if (req.url === '/api/school-data' || req.url?.startsWith('/api/school-data?')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

      if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
      }

      if (req.method === 'GET') {
        await syncFromCloudIfNewer(false);
        const current = readLocalDb();
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(
          JSON.stringify(
            current || { students: [], teachers: [], attendance: [], feeRecords: [] }
          )
        );
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (!parsed || !Array.isArray(parsed.students)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid database payload' }));
              return;
            }

            const existing = readLocalDb();
            const existingCount = Array.isArray(existing?.students) ? existing.students.length : 0;
            const isForceReset = parsed.forceReset === true;

            // Protect against accidental empty overwrite from uninitialized clients
            if (existingCount > 0 && parsed.students.length === 0 && !isForceReset) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  success: true,
                  preservedExisting: true,
                  updatedAt: existing?.updatedAt || new Date().toISOString(),
                  studentCount: existingCount
                })
              );
              return;
            }

            const cleanPayload = { ...parsed };
            delete cleanPayload.forceReset;
            cleanPayload.updatedAt = new Date().toISOString();

            writeLocalDb(cleanPayload);
            replicateToCloudAsync(cleanPayload);

            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                timestamp: Date.now(),
                updatedAt: cleanPayload.updatedAt,
                studentCount: cleanPayload.students.length
              })
            );
          } catch (e: any) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }
    }
    next();
  };

  return {
    name: 'school-database-api',
    configureServer(server) {
      server.middlewares.use(handleApiRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApiRequest);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), schoolDatabasePlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      ignored: ['**/server_database.json', '**/school_database.json', '**/*.json.bak']
    }
  },
});
