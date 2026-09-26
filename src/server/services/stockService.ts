import { DatabaseSync } from 'node:sqlite';

export interface LedgerEntryInput {
  productId: number;
  warehouseId: number;
  transactionType: 'RECEIPT' | 'DELIVERY' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT';
  referenceId: string;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
}

export class AppError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Get current stock quantity for a product in a warehouse.
 * If no stock row exists, returns 0.
 */
export function getCurrentStock(db: DatabaseSync, productId: number, warehouseId: number): number {
  const row = db.prepare('SELECT quantity FROM stock WHERE product_id = ? AND warehouse_id = ?').get(productId, warehouseId) as { quantity: number } | undefined;
  return row ? row.quantity : 0;
}

/**
 * Upsert stock and record a ledger entry inside an active transaction.
 */
export function mutateStock(
  db: DatabaseSync,
  productId: number,
  warehouseId: number,
  quantityChange: number,
  transactionType: 'RECEIPT' | 'DELIVERY' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT',
  referenceId: string
): { before: number; after: number } {
  // Check product exists
  const product = db.prepare('SELECT id, sku, name FROM products WHERE id = ?').get(productId) as { id: number; sku: string; name: string } | undefined;
  if (!product) {
    throw new AppError('NOT_FOUND', `Product ID ${productId} does not exist`, 404);
  }

  // Check warehouse exists
  const warehouse = db.prepare('SELECT id, name FROM warehouses WHERE id = ?').get(warehouseId) as { id: number; name: string } | undefined;
  if (!warehouse) {
    throw new AppError('NOT_FOUND', `Warehouse ID ${warehouseId} does not exist`, 404);
  }

  const currentQuantity = getCurrentStock(db, productId, warehouseId);
  const newQuantity = currentQuantity + quantityChange;

  if (newQuantity < 0) {
    throw new AppError(
      'INSUFFICIENT_STOCK',
      `Insufficient stock for product ${product.sku} (${product.name}) in warehouse ${warehouse.name}. Current: ${currentQuantity}, Requested change: ${quantityChange}`,
      400
    );
  }

  // Update or insert stock
  const existing = db.prepare('SELECT id FROM stock WHERE product_id = ? AND warehouse_id = ?').get(productId, warehouseId);
  if (existing) {
    db.prepare('UPDATE stock SET quantity = ?, updated_at = datetime(\'now\') WHERE product_id = ? AND warehouse_id = ?')
      .run(newQuantity, productId, warehouseId);
  } else {
    db.prepare('INSERT INTO stock (product_id, warehouse_id, quantity, updated_at) VALUES (?, ?, ?, datetime(\'now\'))')
      .run(productId, warehouseId, newQuantity);
  }

  // Insert ledger entry
  db.prepare(`
    INSERT INTO stock_ledger (
      product_id, warehouse_id, transaction_type, reference_id, quantity_change, quantity_before, quantity_after, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(productId, warehouseId, transactionType, referenceId, quantityChange, currentQuantity, newQuantity);

  return { before: currentQuantity, after: newQuantity };
}

/**
 * Execute a callback within an immediate SQLite transaction.
 */
export function runInTransaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // Ignore rollback errors if transaction was already aborted
    }
    throw error;
  }
}

/**
 * Validate and process a Receipt.
 */
export function validateReceipt(db: DatabaseSync, receiptId: number) {
  return runInTransaction(db, () => {
    const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(receiptId) as any;
    if (!receipt) {
      throw new AppError('NOT_FOUND', `Receipt with ID ${receiptId} not found`, 404);
    }
    if (receipt.status === 'COMPLETED') {
      throw new AppError('ALREADY_VALIDATED', `Receipt ${receipt.reference} is already completed`, 400);
    }
    if (receipt.status === 'CANCELLED') {
      throw new AppError('INVALID_STATE', `Receipt ${receipt.reference} is cancelled`, 400);
    }

    const items = db.prepare('SELECT * FROM receipt_items WHERE receipt_id = ?').all(receiptId) as any[];
    if (items.length === 0) {
      throw new AppError('EMPTY_ITEMS', `Receipt ${receipt.reference} contains no items`, 400);
    }

    // Apply stock mutations
    for (const item of items) {
      mutateStock(
        db,
        item.product_id,
        receipt.warehouse_id,
        item.quantity,
        'RECEIPT',
        receipt.reference
      );
    }

    // Mark completed
    db.prepare('UPDATE receipts SET status = \'COMPLETED\', validated_at = datetime(\'now\') WHERE id = ?').run(receiptId);

    return {
      receiptId,
      reference: receipt.reference,
      status: 'COMPLETED',
      itemsCount: items.length,
    };
  });
}

/**
 * Validate and process a Delivery.
 */
export function validateDelivery(db: DatabaseSync, deliveryId: number) {
  return runInTransaction(db, () => {
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(deliveryId) as any;
    if (!delivery) {
      throw new AppError('NOT_FOUND', `Delivery with ID ${deliveryId} not found`, 404);
    }
    if (delivery.status === 'COMPLETED') {
      throw new AppError('ALREADY_VALIDATED', `Delivery ${delivery.reference} is already completed`, 400);
    }
    if (delivery.status === 'CANCELLED') {
      throw new AppError('INVALID_STATE', `Delivery ${delivery.reference} is cancelled`, 400);
    }

    const items = db.prepare('SELECT * FROM delivery_items WHERE delivery_id = ?').all(deliveryId) as any[];
    if (items.length === 0) {
      throw new AppError('EMPTY_ITEMS', `Delivery ${delivery.reference} contains no items`, 400);
    }

    // Mutate stock (will throw INSUFFICIENT_STOCK if stock < quantity)
    for (const item of items) {
      mutateStock(
        db,
        item.product_id,
        delivery.warehouse_id,
        -item.quantity,
        'DELIVERY',
        delivery.reference
      );
    }

    // Mark completed
    db.prepare('UPDATE deliveries SET status = \'COMPLETED\', validated_at = datetime(\'now\') WHERE id = ?').run(deliveryId);

    return {
      deliveryId,
      reference: delivery.reference,
      status: 'COMPLETED',
      itemsCount: items.length,
    };
  });
}

/**
 * Validate and process an Internal Transfer.
 */
export function validateTransfer(db: DatabaseSync, transferId: number) {
  return runInTransaction(db, () => {
    const transfer = db.prepare('SELECT * FROM transfers WHERE id = ?').get(transferId) as any;
    if (!transfer) {
      throw new AppError('NOT_FOUND', `Transfer with ID ${transferId} not found`, 404);
    }
    if (transfer.status === 'COMPLETED') {
      throw new AppError('ALREADY_VALIDATED', `Transfer ${transfer.reference} is already completed`, 400);
    }
    if (transfer.status === 'CANCELLED') {
      throw new AppError('INVALID_STATE', `Transfer ${transfer.reference} is cancelled`, 400);
    }
    if (transfer.from_warehouse_id === transfer.to_warehouse_id) {
      throw new AppError('INVALID_TRANSFER', 'Source and destination warehouses cannot be the same', 400);
    }

    const items = db.prepare('SELECT * FROM transfer_items WHERE transfer_id = ?').all(transferId) as any[];
    if (items.length === 0) {
      throw new AppError('EMPTY_ITEMS', `Transfer ${transfer.reference} contains no items`, 400);
    }

    // Mutate source (TRANSFER_OUT) and destination (TRANSFER_IN)
    for (const item of items) {
      mutateStock(
        db,
        item.product_id,
        transfer.from_warehouse_id,
        -item.quantity,
        'TRANSFER_OUT',
        transfer.reference
      );

      mutateStock(
        db,
        item.product_id,
        transfer.to_warehouse_id,
        item.quantity,
        'TRANSFER_IN',
        transfer.reference
      );
    }

    // Mark completed
    db.prepare('UPDATE transfers SET status = \'COMPLETED\', validated_at = datetime(\'now\') WHERE id = ?').run(transferId);

    return {
      transferId,
      reference: transfer.reference,
      status: 'COMPLETED',
      itemsCount: items.length,
    };
  });
}

/**
 * Validate and process a Stock Adjustment.
 */
export function validateAdjustment(db: DatabaseSync, adjustmentId: number) {
  return runInTransaction(db, () => {
    const adjustment = db.prepare('SELECT * FROM adjustments WHERE id = ?').get(adjustmentId) as any;
    if (!adjustment) {
      throw new AppError('NOT_FOUND', `Adjustment with ID ${adjustmentId} not found`, 404);
    }
    if (adjustment.status === 'COMPLETED') {
      throw new AppError('ALREADY_VALIDATED', `Adjustment ${adjustment.reference} is already completed`, 400);
    }
    if (adjustment.status === 'CANCELLED') {
      throw new AppError('INVALID_STATE', `Adjustment ${adjustment.reference} is cancelled`, 400);
    }

    const items = db.prepare('SELECT * FROM adjustment_items WHERE adjustment_id = ?').all(adjustmentId) as any[];
    if (items.length === 0) {
      throw new AppError('EMPTY_ITEMS', `Adjustment ${adjustment.reference} contains no items`, 400);
    }

    for (const item of items) {
      mutateStock(
        db,
        item.product_id,
        adjustment.warehouse_id,
        item.quantity_change,
        'ADJUSTMENT',
        adjustment.reference
      );
    }

    // Mark completed
    db.prepare('UPDATE adjustments SET status = \'COMPLETED\', validated_at = datetime(\'now\') WHERE id = ?').run(adjustmentId);

    return {
      adjustmentId,
      reference: adjustment.reference,
      status: 'COMPLETED',
      itemsCount: items.length,
    };
  });
}
