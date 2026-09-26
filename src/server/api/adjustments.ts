import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { CreateAdjustmentSchema } from '../validation/schemas';
import { validateAdjustment, runInTransaction, AppError } from '../services/stockService';
import { getNextReference } from '../services/referenceService';

export function createAdjustmentsRouter(db: DatabaseSync): Router {
  const router = Router();

  // GET /api/adjustments
  router.get('/', (_req: Request, res: Response, next: NextFunction) => {
    try {
      const adjustments = db.prepare(`
        SELECT 
          a.id,
          a.reference,
          a.warehouse_id as warehouseId,
          w.name as warehouseName,
          a.reason,
          a.status,
          a.created_at as createdAt,
          a.validated_at as validatedAt,
          COUNT(ai.id) as totalItems,
          COALESCE(SUM(ai.quantity_change), 0) as totalQuantityChange
        FROM adjustments a
        JOIN warehouses w ON a.warehouse_id = w.id
        LEFT JOIN adjustment_items ai ON a.id = ai.adjustment_id
        GROUP BY a.id
        ORDER BY a.id DESC
      `).all();

      res.json({
        success: true,
        data: adjustments,
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/adjustments/:id
  router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const adjustmentId = Number(req.params.id);
      const adjustment = db.prepare(`
        SELECT 
          a.id,
          a.reference,
          a.warehouse_id as warehouseId,
          w.name as warehouseName,
          a.reason,
          a.status,
          a.created_at as createdAt,
          a.validated_at as validatedAt
        FROM adjustments a
        JOIN warehouses w ON a.warehouse_id = w.id
        WHERE a.id = ?
      `).get(adjustmentId) as any;

      if (!adjustment) {
        throw new AppError('NOT_FOUND', `Adjustment with ID ${adjustmentId} not found`, 404);
      }

      const items = db.prepare(`
        SELECT 
          ai.id,
          ai.product_id as productId,
          p.sku as productSku,
          p.name as productName,
          p.unit_of_measure as unitOfMeasure,
          ai.quantity_change as quantityChange,
          COALESCE(s.quantity, 0) as currentStock
        FROM adjustment_items ai
        JOIN products p ON ai.product_id = p.id
        LEFT JOIN stock s ON s.product_id = ai.product_id AND s.warehouse_id = ?
        WHERE ai.adjustment_id = ?
      `).all(adjustment.warehouseId, adjustmentId);

      res.json({
        success: true,
        data: {
          ...adjustment,
          items,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/adjustments
  router.post('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateAdjustmentSchema.parse(req.body);

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
        const reference = getNextReference(db, 'ADJ');

        db.prepare(`
          INSERT INTO adjustments (reference, warehouse_id, reason, status, created_at)
          VALUES (?, ?, ?, 'PENDING', datetime('now'))
        `).run(reference, validated.warehouseId, validated.reason);

        const created = db.prepare('SELECT * FROM adjustments WHERE reference = ?').get(reference) as any;

        const insertItem = db.prepare(`
          INSERT INTO adjustment_items (adjustment_id, product_id, quantity_change)
          VALUES (?, ?, ?)
        `);

        for (const item of validated.items) {
          insertItem.run(created.id, item.productId, item.quantityChange);
        }

        return {
          id: created.id,
          reference: created.reference,
          warehouseId: created.warehouse_id,
          reason: created.reason,
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

  // POST /api/adjustments/:id/validate
  router.post('/:id/validate', (req: Request, res: Response, next: NextFunction) => {
    try {
      const adjustmentId = Number(req.params.id);
      const result = validateAdjustment(db, adjustmentId);

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
