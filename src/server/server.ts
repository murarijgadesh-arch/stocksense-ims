import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { getDatabase } from './db/database';
import { seedDatabase } from './db/seed';
import { createApp } from './app';

const PORT = process.env.PORT || 3000;
const dbPath = process.env.DATABASE_PATH;

// Initialize database
const db = getDatabase(dbPath);

// If database is brand new (no warehouses), seed it
const whCount = (db.prepare('SELECT COUNT(*) as count FROM warehouses').get() as { count: number })?.count || 0;
if (whCount === 0) {
  console.log('Database empty, automatically seeding initial data...');
  seedDatabase(db);
}

const app = createApp(db);

// In production, serve frontend build
const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`StockSense IMS server running at http://localhost:${PORT}`);
});
