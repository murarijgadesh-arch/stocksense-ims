import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { CreateDeliverySchema } from '../validation/schemas';
import { validateDelivery, runInTransaction, AppError } from '../services/stockService';
import { getNextReference } from '../services/referenceService';

export function createDeliveriesRouter(db: DatabaseSync): Router {
  const router = Router();

  // GET /api/deliveries
  router.get('/', (_req: Request, res: Response, next: NextFunction) => {
    try {
      const deliveries = db.prepare(`
        SELECT 
          d.id,
          d.reference,
          d.customer,
          d.warehouse_id as warehouseId,
          w.name as warehouseName,
          d.status,
          d.created_at as createdAt,
          d.validated_at as validatedAt,
          COUNT(di.id) as totalItems,
          COALESCE(SUM(di.quantity), 0) as totalUnits
        FROM deliveries d
        JOIN warehouses w ON d.warehouse_id = w.id
        LEFT JOIN delivery_items di ON d.id = di.delivery_id
        GROUP BY d.id
        ORDER BY d.id DESC
      `).all();

      res.json({
        success: true,
        data: deliveries,
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/deliveries/:id
  router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const deliveryId = Number(req.params.id);
      const delivery = db.prepare(`
        SELECT 
          d.id,
          d.reference,
          d.customer,
          d.warehouse_id as warehouseId,
          w.name as warehouseName,
          d.status,
          d.created_at as createdAt,
          d.validated_at as validatedAt
        FROM deliveries d
        JOIN warehouses w ON d.warehouse_id = w.id
        WHERE d.id = ?
      `).get(deliveryId) as any;

      if (!delivery) {
        throw new AppError('NOT_FOUND', `Delivery with ID ${deliveryId} not found`, 404);
      }

      const items = db.prepare(`
        SELECT 
          di.id,
          di.product_id as productId,
          p.sku as productSku,
          p.name as productName,
          p.unit_of_measure as unitOfMeasure,
          di.quantity,
          COALESCE(s.quantity, 0) as availableStock
        FROM delivery_items di
        JOIN products p ON di.product_id = p.id
        LEFT JOIN stock s ON s.product_id = di.product_id AND s.warehouse_id = ?
        WHERE di.delivery_id = ?
      `).all(delivery.warehouseId, deliveryId);

      res.json({
        success: true,
        data: {
          ...delivery,
          items,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/deliveries
  router.post('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateDeliverySchema.parse(req.body);

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
        const reference = getNextReference(db, 'DLV');

        db.prepare(`
          INSERT INTO deliveries (reference, customer, warehouse_id, status, created_at)
          VALUES (?, ?, ?, 'PENDING', datetime('now'))
        `).run(reference, validated.customer, validated.warehouseId);

        const created = db.prepare('SELECT * FROM deliveries WHERE reference = ?').get(reference) as any;

        const insertItem = db.prepare(`
          INSERT INTO delivery_items (delivery_id, product_id, quantity)
          VALUES (?, ?, ?)
        `);

        for (const item of validated.items) {
          insertItem.run(created.id, item.productId, item.quantity);
        }

        return {
          id: created.id,
          reference: created.reference,
          customer: created.customer,
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

  // POST /api/deliveries/:id/validate
  router.post('/:id/validate', (req: Request, res: Response, next: NextFunction) => {
    try {
      const deliveryId = Number(req.params.id);
      const result = validateDelivery(db, deliveryId);

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
