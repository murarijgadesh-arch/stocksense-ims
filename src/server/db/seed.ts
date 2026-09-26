import { DatabaseSync } from 'node:sqlite';
import { getDatabase, resetDatabase } from './database';
import { hashPassword } from '../api/auth';
import { mutateStock } from '../services/stockService';

export function seedDatabase(db: DatabaseSync) {
  console.log('Seeding StockSense IMS database...');

  // 1. Create demo user
  const adminHash = hashPassword('password123');
  db.prepare(`
    INSERT INTO users (name, email, password_hash, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run('Demo Admin', 'admin@stocksense.io', adminHash);

  // 2. Insert Warehouses
  const insertWh = db.prepare(`
    INSERT INTO warehouses (name, code, location, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `);

  insertWh.run('Central Depot', 'WH-CD', 'Building A, Industrial Sector 4');
  insertWh.run('North Hub', 'WH-NH', 'North Logistics Park, Dock 2');
  insertWh.run('Port Annex', 'WH-PA', 'Maritime Way, Bay 12');
  insertWh.run('Retail Backstore', 'WH-RB', 'Metro Mall Unit B3');

  const warehouses = db.prepare('SELECT id, name, code FROM warehouses').all() as any[];
  const whMap = new Map(warehouses.map(w => [w.code, w.id]));

  // 3. Insert Products
  const insertProd = db.prepare(`
    INSERT INTO products (sku, name, category, unit_of_measure, low_stock_threshold, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  insertProd.run('SKU-10231', 'Thermal Label Roll 4x6', 'Packaging', 'roll', 15);
  insertProd.run('SKU-10388', 'USB-C Dock Station', 'Electronics', 'pcs', 10);
  insertProd.run('SKU-10440', 'Stainless Bolt M8', 'Hardware', 'box', 20);
  insertProd.run('SKU-10512', 'Aluminium Sheet 2mm', 'Raw Material', 'sheet', 5);
  insertProd.run('SKU-10677', 'Barcode Scanner X2', 'Electronics', 'pcs', 8);
  insertProd.run('SKU-10712', 'Pallet Wrap Heavy', 'Packaging', 'roll', 12);

  const products = db.prepare('SELECT id, sku, name FROM products').all() as any[];
  const prodMap = new Map(products.map(p => [p.sku, p.id]));

  const cd = whMap.get('WH-CD')!;
  const nh = whMap.get('WH-NH')!;
  const pa = whMap.get('WH-PA')!;
  const rb = whMap.get('WH-RB')!;

  const p1 = prodMap.get('SKU-10231')!; // Thermal Label Roll
  const p2 = prodMap.get('SKU-10388')!; // USB-C Dock Station
  const p3 = prodMap.get('SKU-10440')!; // Stainless Bolt M8
  const p4 = prodMap.get('SKU-10512')!; // Aluminium Sheet 2mm
  const p5 = prodMap.get('SKU-10677')!; // Barcode Scanner X2
  const p6 = prodMap.get('SKU-10712')!; // Pallet Wrap Heavy

  // 4. Seed initial stock via Receipts & Ledger
  // Receipt 1 (Completed): Initial bulk stock at Central Depot
  db.prepare(`
    INSERT INTO receipts (reference, supplier, warehouse_id, status, created_at, validated_at)
    VALUES ('RCP-0001', 'Global Logistics Supply', ?, 'COMPLETED', datetime('now', '-5 days'), datetime('now', '-5 days'))
  `).run(cd);
  const r1 = db.prepare('SELECT id FROM receipts WHERE reference = ?').get('RCP-0001') as any;

  const insertReceiptItem = db.prepare('INSERT INTO receipt_items (receipt_id, product_id, quantity) VALUES (?, ?, ?)');
  insertReceiptItem.run(r1.id, p1, 120);
  insertReceiptItem.run(r1.id, p2, 50);
  insertReceiptItem.run(r1.id, p3, 200);
  insertReceiptItem.run(r1.id, p4, 30);
  insertReceiptItem.run(r1.id, p5, 40);
  insertReceiptItem.run(r1.id, p6, 85);

  mutateStock(db, p1, cd, 120, 'RECEIPT', 'RCP-0001');
  mutateStock(db, p2, cd, 50, 'RECEIPT', 'RCP-0001');
  mutateStock(db, p3, cd, 200, 'RECEIPT', 'RCP-0001');
  mutateStock(db, p4, cd, 30, 'RECEIPT', 'RCP-0001');
  mutateStock(db, p5, cd, 40, 'RECEIPT', 'RCP-0001');
  mutateStock(db, p6, cd, 85, 'RECEIPT', 'RCP-0001');

  // Receipt 2 (Completed): Stock at North Hub
  db.prepare(`
    INSERT INTO receipts (reference, supplier, warehouse_id, status, created_at, validated_at)
    VALUES ('RCP-0002', 'Apex Hardware Direct', ?, 'COMPLETED', datetime('now', '-3 days'), datetime('now', '-3 days'))
  `).run(nh);
  const r2 = db.prepare('SELECT id FROM receipts WHERE reference = ?').get('RCP-0002') as any;
  insertReceiptItem.run(r2.id, p1, 40);
  insertReceiptItem.run(r2.id, p3, 100);
  mutateStock(db, p1, nh, 40, 'RECEIPT', 'RCP-0002');
  mutateStock(db, p3, nh, 100, 'RECEIPT', 'RCP-0002');

  // Receipt 3 (Pending): Inbound shipment arriving soon
  db.prepare(`
    INSERT INTO receipts (reference, supplier, warehouse_id, status, created_at)
    VALUES ('RCP-0003', 'Nordic Tech Components', ?, 'PENDING', datetime('now', '-1 hour'))
  `).run(pa);
  const r3 = db.prepare('SELECT id FROM receipts WHERE reference = ?').get('RCP-0003') as any;
  insertReceiptItem.run(r3.id, p2, 25);
  insertReceiptItem.run(r3.id, p5, 15);

  // 5. Transfers
  // Transfer 1 (Completed): Central Depot -> Retail Backstore
  db.prepare(`
    INSERT INTO transfers (reference, from_warehouse_id, to_warehouse_id, status, created_at, validated_at)
    VALUES ('TRF-0001', ?, ?, 'COMPLETED', datetime('now', '-2 days'), datetime('now', '-2 days'))
  `).run(cd, rb);
  const t1 = db.prepare('SELECT id FROM transfers WHERE reference = ?').get('TRF-0001') as any;
  const insertTransferItem = db.prepare('INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES (?, ?, ?)');
  insertTransferItem.run(t1.id, p1, 20);
  insertTransferItem.run(t1.id, p2, 8);
  mutateStock(db, p1, cd, -20, 'TRANSFER_OUT', 'TRF-0001');
  mutateStock(db, p1, rb, 20, 'TRANSFER_IN', 'TRF-0001');
  mutateStock(db, p2, cd, -8, 'TRANSFER_OUT', 'TRF-0001');
  mutateStock(db, p2, rb, 8, 'TRANSFER_IN', 'TRF-0001');

  // Transfer 2 (Pending): Central Depot -> Port Annex
  db.prepare(`
    INSERT INTO transfers (reference, from_warehouse_id, to_warehouse_id, status, created_at)
    VALUES ('TRF-0002', ?, ?, 'PENDING', datetime('now', '-3 hours'))
  `).run(cd, pa);
  const t2 = db.prepare('SELECT id FROM transfers WHERE reference = ?').get('TRF-0002') as any;
  insertTransferItem.run(t2.id, p3, 50);

  // 6. Deliveries
  // Delivery 1 (Completed): To Bright Retail Co from Central Depot
  db.prepare(`
    INSERT INTO deliveries (reference, customer, warehouse_id, status, created_at, validated_at)
    VALUES ('DLV-0001', 'Bright Retail Co.', ?, 'COMPLETED', datetime('now', '-1 day'), datetime('now', '-1 day'))
  `).run(cd);
  const d1 = db.prepare('SELECT id FROM deliveries WHERE reference = ?').get('DLV-0001') as any;
  const insertDeliveryItem = db.prepare('INSERT INTO delivery_items (delivery_id, product_id, quantity) VALUES (?, ?, ?)');
  insertDeliveryItem.run(d1.id, p2, 12);
  insertDeliveryItem.run(d1.id, p5, 6);
  mutateStock(db, p2, cd, -12, 'DELIVERY', 'DLV-0001');
  mutateStock(db, p5, cd, -6, 'DELIVERY', 'DLV-0001');

  // Delivery 2 (Pending): To Quantum Manufacturing
  db.prepare(`
    INSERT INTO deliveries (reference, customer, warehouse_id, status, created_at)
    VALUES ('DLV-0002', 'Quantum Manufacturing', ?, 'PENDING', datetime('now', '-2 hours'))
  `).run(cd);
  const d2 = db.prepare('SELECT id FROM deliveries WHERE reference = ?').get('DLV-0002') as any;
  insertDeliveryItem.run(d2.id, p4, 10);
  insertDeliveryItem.run(d2.id, p3, 30);

  // 7. Adjustments
  // Adjustment 1 (Completed): Cycle Count & Damage write-off
  db.prepare(`
    INSERT INTO adjustments (reference, warehouse_id, reason, status, created_at, validated_at)
    VALUES ('ADJ-0001', ?, 'Damaged during forklift transit', 'COMPLETED', datetime('now', '-18 hours'), datetime('now', '-18 hours'))
  `).run(cd);
  const a1 = db.prepare('SELECT id FROM adjustments WHERE reference = ?').get('ADJ-0001') as any;
  const insertAdjItem = db.prepare('INSERT INTO adjustment_items (adjustment_id, product_id, quantity_change) VALUES (?, ?, ?)');
  insertAdjItem.run(a1.id, p6, -5);
  mutateStock(db, p6, cd, -5, 'ADJUSTMENT', 'ADJ-0001');

  // Adjustment 2 (Pending): Physical count discrepancy
  db.prepare(`
    INSERT INTO adjustments (reference, warehouse_id, reason, status, created_at)
    VALUES ('ADJ-0002', ?, 'Annual inventory reconciliation', 'PENDING', datetime('now', '-30 minutes'))
  `).run(nh);
  const a2 = db.prepare('SELECT id FROM adjustments WHERE reference = ?').get('ADJ-0002') as any;
  insertAdjItem.run(a2.id, p1, 5);

  console.log('Database seeded successfully!');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  const db = resetDatabase();
  seedDatabase(db);
}
