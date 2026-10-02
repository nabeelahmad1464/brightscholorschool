import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function schoolDatabasePlugin(): Plugin {
  const dbFile = path.resolve(__dirname, 'src/data/school_database.json');

  const handleApiRequest = (req: any, res: any, next: any) => {
    if (req.url === '/api/school-data' || req.url?.startsWith('/api/school-data?')) {
      if (req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (fs.existsSync(dbFile)) {
          const content = fs.readFileSync(dbFile, 'utf-8');
          res.statusCode = 200;
          res.end(content);
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ exists: false }));
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
            parsed.updatedAt = new Date().toISOString();
            fs.writeFileSync(dbFile, JSON.stringify(parsed, null, 2), 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
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
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
  },
});

