import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function schoolDatabasePlugin(): Plugin {
  const dbFile = path.resolve(__dirname, 'server_database.json');
  const fallbackDbFile = path.resolve(__dirname, 'src/data/school_database.json');

  const ensureDbExists = () => {
    if (!fs.existsSync(dbFile)) {
      if (fs.existsSync(fallbackDbFile)) {
        try {
          fs.copyFileSync(fallbackDbFile, dbFile);
        } catch (e) {
          // fallback
        }
      }
    }
  };

  ensureDbExists();

  const handleApiRequest = (req: any, res: any, next: any) => {
    if (req.url === '/api/school-data' || req.url?.startsWith('/api/school-data?')) {
      if (req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        ensureDbExists();
        if (fs.existsSync(dbFile)) {
          const content = fs.readFileSync(dbFile, 'utf-8');
          res.statusCode = 200;
          res.end(content);
        } else {
          res.statusCode = 200;
          res.end(JSON.stringify({ students: [], teachers: [], attendance: [], feeRecords: [] }));
        }
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
            if (parsed && Array.isArray(parsed.students)) {
              parsed.updatedAt = new Date().toISOString();
              fs.writeFileSync(dbFile, JSON.stringify(parsed, null, 2), 'utf-8');
              try {
                fs.writeFileSync(fallbackDbFile, JSON.stringify(parsed, null, 2), 'utf-8');
              } catch (err) {
                // fallback
              }
            }
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            const count = Array.isArray(parsed.students) ? parsed.students.length : 0;
            res.end(JSON.stringify({ success: true, timestamp: Date.now(), updatedAt: parsed?.updatedAt || new Date().toISOString(), studentCount: count }));
          } catch (e: any) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.statusCode = 200;
        res.end();
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

