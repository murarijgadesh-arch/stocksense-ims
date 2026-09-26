import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { CreateTransferSchema } from '../validation/schemas';
import { validateTransfer, runInTransaction, AppError } from '../services/stockService';
import { getNextReference } from '../services/referenceService';

export function createTransfersRouter(db: DatabaseSync): Router {
  const router = Router();

  // GET /api/transfers
  router.get('/', (_req: Request, res: Response, next: NextFunction) => {
    try {
      const transfers = db.prepare(`
        SELECT 
          t.id,
          t.reference,
          t.from_warehouse_id as fromWarehouseId,
          fw.name as fromWarehouseName,
          t.to_warehouse_id as toWarehouseId,
          tw.name as toWarehouseName,
          t.status,
          t.created_at as createdAt,
          t.validated_at as validatedAt,
          COUNT(ti.id) as totalItems,
          COALESCE(SUM(ti.quantity), 0) as totalUnits
        FROM transfers t
        JOIN warehouses fw ON t.from_warehouse_id = fw.id
        JOIN warehouses tw ON t.to_warehouse_id = tw.id
        LEFT JOIN transfer_items ti ON t.id = ti.transfer_id
        GROUP BY t.id
        ORDER BY t.id DESC
      `).all();

      res.json({
        success: true,
        data: transfers,
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/transfers/:id
  router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const transferId = Number(req.params.id);
      const transfer = db.prepare(`
        SELECT 
          t.id,
          t.reference,
          t.from_warehouse_id as fromWarehouseId,
          fw.name as fromWarehouseName,
          t.to_warehouse_id as toWarehouseId,
          tw.name as toWarehouseName,
          t.status,
          t.created_at as createdAt,
          t.validated_at as validatedAt
        FROM transfers t
        JOIN warehouses fw ON t.from_warehouse_id = fw.id
        JOIN warehouses tw ON t.to_warehouse_id = tw.id
        WHERE t.id = ?
      `).get(transferId) as any;

      if (!transfer) {
        throw new AppError('NOT_FOUND', `Transfer with ID ${transferId} not found`, 404);
      }

      const items = db.prepare(`
        SELECT 
          ti.id,
          ti.product_id as productId,
          p.sku as productSku,
          p.name as productName,
          p.unit_of_measure as unitOfMeasure,
          ti.quantity,
          COALESCE(s.quantity, 0) as fromWarehouseStock
        FROM transfer_items ti
        JOIN products p ON ti.product_id = p.id
        LEFT JOIN stock s ON s.product_id = ti.product_id AND s.warehouse_id = ?
        WHERE ti.transfer_id = ?
      `).all(transfer.fromWarehouseId, transferId);

      res.json({
        success: true,
        data: {
          ...transfer,
          items,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/transfers
  router.post('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateTransferSchema.parse(req.body);

      // Verify warehouses exist
      const fromWh = db.prepare('SELECT id, name FROM warehouses WHERE id = ?').get(validated.fromWarehouseId);
      if (!fromWh) {
        throw new AppError('NOT_FOUND', `Source warehouse ID ${validated.fromWarehouseId} not found`, 404);
      }
      const toWh = db.prepare('SELECT id, name FROM warehouses WHERE id = ?').get(validated.toWarehouseId);
      if (!toWh) {
        throw new AppError('NOT_FOUND', `Destination warehouse ID ${validated.toWarehouseId} not found`, 404);
      }

      // Verify all products exist
      for (const item of validated.items) {
        const product = db.prepare('SELECT id FROM products WHERE id = ?').get(item.productId);
        if (!product) {
          throw new AppError('NOT_FOUND', `Product ID ${item.productId} not found`, 404);
        }
      }

      const result = runInTransaction(db, () => {
        const reference = getNextReference(db, 'TRF');

        db.prepare(`
          INSERT INTO transfers (reference, from_warehouse_id, to_warehouse_id, status, created_at)
          VALUES (?, ?, ?, 'PENDING', datetime('now'))
        `).run(reference, validated.fromWarehouseId, validated.toWarehouseId);

        const created = db.prepare('SELECT * FROM transfers WHERE reference = ?').get(reference) as any;

        const insertItem = db.prepare(`
          INSERT INTO transfer_items (transfer_id, product_id, quantity)
          VALUES (?, ?, ?)
        `);

        for (const item of validated.items) {
          insertItem.run(created.id, item.productId, item.quantity);
        }

        return {
          id: created.id,
          reference: created.reference,
          fromWarehouseId: created.from_warehouse_id,
          toWarehouseId: created.to_warehouse_id,
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

  // POST /api/transfers/:id/validate
  router.post('/:id/validate', (req: Request, res: Response, next: NextFunction) => {
    try {
      const transferId = Number(req.params.id);
      const result = validateTransfer(db, transferId);

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
