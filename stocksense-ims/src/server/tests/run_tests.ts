import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { resetDatabase } from '../db/database';
import {
  getCurrentStock,
  mutateStock,
  validateReceipt,
  validateDelivery,
  validateTransfer,
  validateAdjustment,
  runInTransaction,
  AppError
} from '../services/stockService';
import { getNextReference } from '../services/referenceService';
import { hashPassword, verifyPassword } from '../api/auth';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n========================================');
  console.log('  StockSense IMS Backend Test Suite');
  console.log('========================================\n');

  // Use an in-memory database for isolated, lightning fast testing
  const db = resetDatabase(':memory:');

  // Setup basic fixtures: 2 Warehouses
  db.exec(`
    INSERT INTO warehouses (name, code, location) VALUES ('Warehouse A', 'WH-A', 'Loc A');
    INSERT INTO warehouses (name, code, location) VALUES ('Warehouse B', 'WH-B', 'Loc B');
  `);

  const whA = 1;
  const whB = 2;

  // TEST 1: Create product -> product exists in DB
  test('TEST 1: Create product -> product exists in DB', () => {
    db.prepare(`
      INSERT INTO products (sku, name, category, unit_of_measure, low_stock_threshold)
      VALUES ('TEST-SKU-001', 'Test Product 1', 'Electronics', 'pcs', 10)
    `).run();

    const product = db.prepare('SELECT * FROM products WHERE sku = ?').get('TEST-SKU-001') as any;
    assert.ok(product, 'Product should be found in DB');
    assert.equal(product.sku, 'TEST-SKU-001');
    assert.equal(product.name, 'Test Product 1');
    assert.equal(product.low_stock_threshold, 10);
  });

  const prod1 = 1;

  // TEST 2: Receipt success
  // Initial stock = 50, Receive = 25, Expected stock = 75, Expected one RECEIPT ledger entry
  test('TEST 2: Receipt success (Initial 50 + Receive 25 = 75, creates ledger)', () => {
    // Set initial stock to 50
    mutateStock(db, prod1, whA, 50, 'RECEIPT', 'INIT-001');
    assert.equal(getCurrentStock(db, prod1, whA), 50);

    // Create receipt for 25
    const ref = getNextReference(db, 'RCP');
    db.prepare(`
      INSERT INTO receipts (reference, supplier, warehouse_id, status)
      VALUES (?, 'Supplier ABC', ?, 'PENDING')
    `).run(ref, whA);
    const receipt = db.prepare('SELECT id FROM receipts WHERE reference = ?').get(ref) as any;

    db.prepare(`
      INSERT INTO receipt_items (receipt_id, product_id, quantity)
      VALUES (?, ?, 25)
    `).run(receipt.id, prod1);

    // Validate receipt
    const result = validateReceipt(db, receipt.id);
    assert.equal(result.status, 'COMPLETED');
    assert.equal(getCurrentStock(db, prod1, whA), 75, 'Stock should be 75');

    // Verify ledger
    const ledger = db.prepare(`
      SELECT * FROM stock_ledger WHERE reference_id = ? AND transaction_type = 'RECEIPT'
    `).get(ref) as any;

    assert.ok(ledger, 'Ledger entry should exist');
    assert.equal(ledger.quantity_change, 25);
    assert.equal(ledger.quantity_before, 50);
    assert.equal(ledger.quantity_after, 75);
  });

  // TEST 3: Delivery success
  // Initial stock = 75, Deliver = 20, Expected stock = 55, Expected one DELIVERY ledger entry
  test('TEST 3: Delivery success (Initial 75 - Deliver 20 = 55, creates ledger)', () => {
    assert.equal(getCurrentStock(db, prod1, whA), 75);

    const ref = getNextReference(db, 'DLV');
    db.prepare(`
      INSERT INTO deliveries (reference, customer, warehouse_id, status)
      VALUES (?, 'Customer XYZ', ?, 'PENDING')
    `).run(ref, whA);
    const delivery = db.prepare('SELECT id FROM deliveries WHERE reference = ?').get(ref) as any;

    db.prepare(`
      INSERT INTO delivery_items (delivery_id, product_id, quantity)
      VALUES (?, ?, 20)
    `).run(delivery.id, prod1);

    const result = validateDelivery(db, delivery.id);
    assert.equal(result.status, 'COMPLETED');
    assert.equal(getCurrentStock(db, prod1, whA), 55, 'Stock should be 55');

    // Verify ledger
    const ledger = db.prepare(`
      SELECT * FROM stock_ledger WHERE reference_id = ? AND transaction_type = 'DELIVERY'
    `).get(ref) as any;

    assert.ok(ledger, 'Ledger entry should exist');
    assert.equal(ledger.quantity_change, -20);
    assert.equal(ledger.quantity_before, 75);
    assert.equal(ledger.quantity_after, 55);
  });

  // TEST 4: Delivery insufficient stock
  // Initial stock = 10, Attempt delivery = 20 -> request rejected, stock remains 10, no ledger entry, delivery remains pending
  test('TEST 4: Delivery insufficient stock (Initial 10, Deliver 20 -> Rejected & Unchanged)', () => {
    // Create product 2 with initial stock 10
    db.prepare(`
      INSERT INTO products (sku, name, category, unit_of_measure, low_stock_threshold)
      VALUES ('TEST-SKU-002', 'Product 2', 'Hardware', 'pcs', 5)
    `).run();
    const prod2 = (db.prepare('SELECT id FROM products WHERE sku = ?').get('TEST-SKU-002') as any).id;

    mutateStock(db, prod2, whA, 10, 'RECEIPT', 'INIT-002');
    assert.equal(getCurrentStock(db, prod2, whA), 10);

    const ref = getNextReference(db, 'DLV');
    db.prepare(`
      INSERT INTO deliveries (reference, customer, warehouse_id, status)
      VALUES (?, 'Customer Insufficient', ?, 'PENDING')
    `).run(ref, whA);
    const delivery = db.prepare('SELECT id FROM deliveries WHERE reference = ?').get(ref) as any;

    db.prepare(`
      INSERT INTO delivery_items (delivery_id, product_id, quantity)
      VALUES (?, ?, 20)
    `).run(delivery.id, prod2);

    // Validation should throw AppError INSUFFICIENT_STOCK
    assert.throws(
      () => validateDelivery(db, delivery.id),
      (err: any) => err instanceof AppError && err.code === 'INSUFFICIENT_STOCK'
    );

    // Verify stock remains 10
    assert.equal(getCurrentStock(db, prod2, whA), 10, 'Stock must remain 10');

    // Verify delivery remains PENDING
    const deliveryCheck = db.prepare('SELECT status FROM deliveries WHERE id = ?').get(delivery.id) as any;
    assert.equal(deliveryCheck.status, 'PENDING', 'Delivery must remain PENDING');

    // Verify no DELIVERY ledger entry was inserted
    const ledgerCheck = db.prepare('SELECT * FROM stock_ledger WHERE reference_id = ?').all(ref);
    assert.equal(ledgerCheck.length, 0, 'No ledger entry should be created on failure');
  });

  // TEST 5: Transfer success
  // Warehouse A = 100, Warehouse B = 20, Transfer 30 -> A = 70, B = 50, one TRANSFER_OUT ledger, one TRANSFER_IN ledger
  test('TEST 5: Transfer success (WH A 100 -> 70, WH B 20 -> 50, creates dual ledger)', () => {
    // Create product 3
    db.prepare(`
      INSERT INTO products (sku, name, category, unit_of_measure, low_stock_threshold)
      VALUES ('TEST-SKU-003', 'Product 3 Transfer', 'Raw', 'sheet', 5)
    `).run();
    const prod3 = (db.prepare('SELECT id FROM products WHERE sku = ?').get('TEST-SKU-003') as any).id;

    mutateStock(db, prod3, whA, 100, 'RECEIPT', 'INIT-003-A');
    mutateStock(db, prod3, whB, 20, 'RECEIPT', 'INIT-003-B');

    assert.equal(getCurrentStock(db, prod3, whA), 100);
    assert.equal(getCurrentStock(db, prod3, whB), 20);

    const ref = getNextReference(db, 'TRF');
    db.prepare(`
      INSERT INTO transfers (reference, from_warehouse_id, to_warehouse_id, status)
      VALUES (?, ?, ?, 'PENDING')
    `).run(ref, whA, whB);
    const transfer = db.prepare('SELECT id FROM transfers WHERE reference = ?').get(ref) as any;

    db.prepare(`
      INSERT INTO transfer_items (transfer_id, product_id, quantity)
      VALUES (?, ?, 30)
    `).run(transfer.id, prod3);

    const result = validateTransfer(db, transfer.id);
    assert.equal(result.status, 'COMPLETED');

    assert.equal(getCurrentStock(db, prod3, whA), 70, 'WH A stock must be 70');
    assert.equal(getCurrentStock(db, prod3, whB), 50, 'WH B stock must be 50');

    // Verify ledger entries
    const ledgerOut = db.prepare(`
      SELECT * FROM stock_ledger WHERE reference_id = ? AND transaction_type = 'TRANSFER_OUT'
    `).get(ref) as any;
    assert.ok(ledgerOut, 'TRANSFER_OUT ledger must exist');
    assert.equal(ledgerOut.warehouse_id, whA);
    assert.equal(ledgerOut.quantity_change, -30);
    assert.equal(ledgerOut.quantity_before, 100);
    assert.equal(ledgerOut.quantity_after, 70);

    const ledgerIn = db.prepare(`
      SELECT * FROM stock_ledger WHERE reference_id = ? AND transaction_type = 'TRANSFER_IN'
    `).get(ref) as any;
    assert.ok(ledgerIn, 'TRANSFER_IN ledger must exist');
    assert.equal(ledgerIn.warehouse_id, whB);
    assert.equal(ledgerIn.quantity_change, 30);
    assert.equal(ledgerIn.quantity_before, 20);
    assert.equal(ledgerIn.quantity_after, 50);
  });

  // TEST 6: Adjustment
  // Stock = 50, Adjustment = -5 -> Expected stock = 45, ledger created
  test('TEST 6: Stock Adjustment (Stock 50 + Adj -5 = 45, creates ADJUSTMENT ledger)', () => {
    db.prepare(`
      INSERT INTO products (sku, name, category, unit_of_measure, low_stock_threshold)
      VALUES ('TEST-SKU-004', 'Product 4 Adj', 'Packaging', 'box', 5)
    `).run();
    const prod4 = (db.prepare('SELECT id FROM products WHERE sku = ?').get('TEST-SKU-004') as any).id;

    mutateStock(db, prod4, whA, 50, 'RECEIPT', 'INIT-004');
    assert.equal(getCurrentStock(db, prod4, whA), 50);

    const ref = getNextReference(db, 'ADJ');
    db.prepare(`
      INSERT INTO adjustments (reference, warehouse_id, reason, status)
      VALUES (?, ?, 'Damaged during unloading', 'PENDING')
    `).run(ref, whA);
    const adjustment = db.prepare('SELECT id FROM adjustments WHERE reference = ?').get(ref) as any;

    db.prepare(`
      INSERT INTO adjustment_items (adjustment_id, product_id, quantity_change)
      VALUES (?, ?, -5)
    `).run(adjustment.id, prod4);

    const result = validateAdjustment(db, adjustment.id);
    assert.equal(result.status, 'COMPLETED');
    assert.equal(getCurrentStock(db, prod4, whA), 45, 'Stock should be 45');

    const ledger = db.prepare(`
      SELECT * FROM stock_ledger WHERE reference_id = ? AND transaction_type = 'ADJUSTMENT'
    `).get(ref) as any;
    assert.ok(ledger, 'ADJUSTMENT ledger must exist');
    assert.equal(ledger.quantity_change, -5);
    assert.equal(ledger.quantity_before, 50);
    assert.equal(ledger.quantity_after, 45);
  });

  // TEST 7: Duplicate validation
  // Validate same receipt twice -> second request rejected, stock changes only once
  test('TEST 7: Duplicate validation prevented (Receipt cannot be validated twice)', () => {
    const ref = getNextReference(db, 'RCP');
    db.prepare(`
      INSERT INTO receipts (reference, supplier, warehouse_id, status)
      VALUES (?, 'Supplier Double', ?, 'PENDING')
    `).run(ref, whA);
    const receipt = db.prepare('SELECT id FROM receipts WHERE reference = ?').get(ref) as any;

    db.prepare(`
      INSERT INTO receipt_items (receipt_id, product_id, quantity)
      VALUES (?, ?, 15)
    `).run(receipt.id, prod1);

    const stockBefore = getCurrentStock(db, prod1, whA);
    
    // First validation succeeds
    validateReceipt(db, receipt.id);
    assert.equal(getCurrentStock(db, prod1, whA), stockBefore + 15);

    // Second validation must fail
    assert.throws(
      () => validateReceipt(db, receipt.id),
      (err: any) => err instanceof AppError && err.code === 'ALREADY_VALIDATED'
    );

    // Stock must not change again
    assert.equal(getCurrentStock(db, prod1, whA), stockBefore + 15);
  });

  // TEST 8: Atomic rollback
  // Force a transaction failure -> stock and ledger remain unchanged
  test('TEST 8: Atomic rollback on failure (Stock and ledger unchanged on mid-transaction error)', () => {
    const stockBefore = getCurrentStock(db, prod1, whA);
    const ledgerCountBefore = (db.prepare('SELECT COUNT(*) as count FROM stock_ledger').get() as any).count;

    assert.throws(() => {
      runInTransaction(db, () => {
        // Step 1: mutates stock
        mutateStock(db, prod1, whA, 25, 'RECEIPT', 'TEST-FAIL-01');
        // Step 2: forced error
        throw new Error('Simulated mid-transaction failure');
      });
    });

    const stockAfter = getCurrentStock(db, prod1, whA);
    const ledgerCountAfter = (db.prepare('SELECT COUNT(*) as count FROM stock_ledger').get() as any).count;

    assert.equal(stockAfter, stockBefore, 'Stock must rollback to exact previous level');
    assert.equal(ledgerCountAfter, ledgerCountBefore, 'No ledger entry must remain after rollback');
  });

  // TEST 9: Auth password hashing and verification
  test('TEST 9: Auth password hashing and timing-safe verification', () => {
    const password = 'SuperSecretPassword!123';
    const hash = hashPassword(password);
    assert.notEqual(hash, password, 'Password must never be plain text');
    assert.ok(verifyPassword(password, hash), 'Correct password verifies');
    assert.ok(!verifyPassword('WrongPassword', hash), 'Wrong password fails');
  });

  // TEST 10: Reference generator format
  test('TEST 10: Reference formatting', () => {
    const rcp = getNextReference(db, 'RCP');
    assert.match(rcp, /^RCP-\d{4}$/);
    const dlv = getNextReference(db, 'DLV');
    assert.match(dlv, /^DLV-\d{4}$/);
  });

  console.log('\n========================================');
  console.log(`  Unit Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();

