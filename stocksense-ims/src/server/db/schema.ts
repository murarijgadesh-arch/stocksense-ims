export const CREATE_TABLES_SQL = `
-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  location TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_of_measure TEXT NOT NULL,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Stock table (Uniqueness on product_id + warehouse_id)
CREATE TABLE IF NOT EXISTS stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(product_id, warehouse_id)
);

-- Receipts table (Inbound)
CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  supplier TEXT NOT NULL,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  validated_at TEXT
);

-- Receipt items
CREATE TABLE IF NOT EXISTS receipt_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_id INTEGER NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL
);

-- Deliveries table (Outbound)
CREATE TABLE IF NOT EXISTS deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  customer TEXT NOT NULL,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  validated_at TEXT
);

-- Delivery items
CREATE TABLE IF NOT EXISTS delivery_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_id INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL
);

-- Internal Transfers table
CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  from_warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  to_warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  validated_at TEXT
);

-- Transfer items
CREATE TABLE IF NOT EXISTS transfer_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transfer_id INTEGER NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL
);

-- Stock Adjustments table
CREATE TABLE IF NOT EXISTS adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  validated_at TEXT
);

-- Adjustment items
CREATE TABLE IF NOT EXISTS adjustment_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  adjustment_id INTEGER NOT NULL REFERENCES adjustments(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity_change INTEGER NOT NULL
);

-- Stock Ledger table
CREATE TABLE IF NOT EXISTS stock_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  transaction_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- OTP Tokens table (for basic auth / recovery)
CREATE TABLE IF NOT EXISTS otp_tokens (
  email TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_warehouse ON stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_ledger_product ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_ledger_warehouse ON stock_ledger(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON stock_ledger(created_at);
`;
