/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(express.json({ limit: '20mb' }));

// API: Get Database
app.get('/api/db', (_req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return res.json(JSON.parse(data));
    }
    return res.status(404).json({ error: 'No database file found yet' });
  } catch (error) {
    console.error('Error reading database:', error);
    return res.status(500).json({ error: 'Failed to read database' });
  }
});

// API: Save Database
app.post('/api/db', (req, res) => {
  try {
    const data = req.body;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error writing database:', error);
    return res.status(500).json({ error: 'Failed to save database' });
  }
});

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development: Vite middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static build from dist
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ModaGestión server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
