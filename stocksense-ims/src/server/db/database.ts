import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { CREATE_TABLES_SQL } from './schema';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(dbPath?: string): DatabaseSync {
  if (dbInstance && !dbPath) {
    return dbInstance;
  }

  const resolvedPath = dbPath || process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'stocksense.db');

  if (resolvedPath !== ':memory:') {
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(resolvedPath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  
  // Initialize schema
  db.exec(CREATE_TABLES_SQL);

  if (!dbPath) {
    dbInstance = db;
  }

  return db;
}

export function resetDatabase(dbPath?: string): DatabaseSync {
  const db = getDatabase(dbPath);
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec(`
    DROP TABLE IF EXISTS otp_tokens;
    DROP TABLE IF EXISTS stock_ledger;
    DROP TABLE IF EXISTS adjustment_items;
    DROP TABLE IF EXISTS adjustments;
    DROP TABLE IF EXISTS transfer_items;
    DROP TABLE IF EXISTS transfers;
    DROP TABLE IF EXISTS delivery_items;
    DROP TABLE IF EXISTS deliveries;
    DROP TABLE IF EXISTS receipt_items;
    DROP TABLE IF EXISTS receipts;
    DROP TABLE IF EXISTS stock;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS warehouses;
    DROP TABLE IF EXISTS users;
  `);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(CREATE_TABLES_SQL);
  return db;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
