import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { CreateReceiptSchema } from '../validation/schemas';
import { validateReceipt, runInTransaction, AppError } from '../services/stockService';
import { getNextReference } from '../services/referenceService';

export function createReceiptsRouter(db: DatabaseSync): Router {
  const router = Router();

  // GET /api/receipts
  router.get('/', (_req: Request, res: Response, next: NextFunction) => {
    try {
      const receipts = db.prepare(`
        SELECT 
          r.id,
          r.reference,
          r.supplier,
          r.warehouse_id as warehouseId,
          w.name as warehouseName,
          r.status,
          r.created_at as createdAt,
          r.validated_at as validatedAt,
          COUNT(ri.id) as totalItems,
          COALESCE(SUM(ri.quantity), 0) as totalUnits
        FROM receipts r
        JOIN warehouses w ON r.warehouse_id = w.id
        LEFT JOIN receipt_items ri ON r.id = ri.receipt_id
        GROUP BY r.id
        ORDER BY r.id DESC
      `).all();

      res.json({
        success: true,
        data: receipts,
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/receipts/:id
  router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const receiptId = Number(req.params.id);
      const receipt = db.prepare(`
        SELECT 
          r.id,
          r.reference,
          r.supplier,
          r.warehouse_id as warehouseId,
          w.name as warehouseName,
          r.status,
          r.created_at as createdAt,
          r.validated_at as validatedAt
        FROM receipts r
        JOIN warehouses w ON r.warehouse_id = w.id
        WHERE r.id = ?
      `).get(receiptId) as any;

      if (!receipt) {
        throw new AppError('NOT_FOUND', `Receipt with ID ${receiptId} not found`, 404);
      }

      const items = db.prepare(`
        SELECT 
          ri.id,
          ri.product_id as productId,
          p.sku as productSku,
          p.name as productName,
          p.unit_of_measure as unitOfMeasure,
          ri.quantity
        FROM receipt_items ri
        JOIN products p ON ri.product_id = p.id
        WHERE ri.receipt_id = ?
      `).all(receiptId);

      res.json({
        success: true,
        data: {
          ...receipt,
          items,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/receipts
  router.post('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateReceiptSchema.parse(req.body);

      // Verify warehouse exists
      const warehouse = db.prepare('SELECT id, name FROM warehouses WHERE id = ?').get(validated.warehouseId);
      if (!warehouse) {
        throw new AppError('NOT_FOUND', `Warehouse ID ${validated.warehouseId} not found`, 404);
      }

      // Verify all products exist
      for (const item of validated.items) {
        const product = db.prepare('SELECT id FROM products WHERE id = ?').get(item.productId);
        if (!product) {
          throw new AppError('NOT_FOUND', `Product ID ${item.productId} not found`, 404);
        }
      }

      const result = runInTransaction(db, () => {
        const reference = getNextReference(db, 'RCP');

        db.prepare(`
          INSERT INTO receipts (reference, supplier, warehouse_id, status, created_at)
          VALUES (?, ?, ?, 'PENDING', datetime('now'))
        `).run(reference, validated.supplier, validated.warehouseId);

        const created = db.prepare('SELECT * FROM receipts WHERE reference = ?').get(reference) as any;

        const insertItem = db.prepare(`
          INSERT INTO receipt_items (receipt_id, product_id, quantity)
          VALUES (?, ?, ?)
        `);

        for (const item of validated.items) {
          insertItem.run(created.id, item.productId, item.quantity);
        }

        return {
          id: created.id,
          reference: created.reference,
          supplier: created.supplier,
          warehouseId: created.warehouse_id,
          status: 'PENDING',
          createdAt: created.created_at,
          itemsCount: validated.items.length,
        };
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/receipts/:id/validate
  router.post('/:id/validate', (req: Request, res: Response, next: NextFunction) => {
    try {
      const receiptId = Number(req.params.id);
      const result = validateReceipt(db, receiptId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
