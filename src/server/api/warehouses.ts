import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { CreateWarehouseSchema } from '../validation/schemas';
import { AppError } from '../services/stockService';

export function createWarehousesRouter(db: DatabaseSync): Router {
  const router = Router();

  // GET /api/warehouses
  router.get('/', (_req: Request, res: Response, next: NextFunction) => {
    try {
      const warehouses = db.prepare(`
        SELECT 
          w.id,
          w.name,
          w.code,
          w.location,
          w.created_at as createdAt,
          COALESCE(SUM(s.quantity), 0) as totalStockUnits,
          COUNT(DISTINCT s.product_id) as totalDistinctProducts
        FROM warehouses w
        LEFT JOIN stock s ON w.id = s.warehouse_id
        GROUP BY w.id
        ORDER BY w.name ASC
      `).all();

      res.json({
        success: true,
        data: warehouses,
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/warehouses
  router.post('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateWarehouseSchema.parse(req.body);

      const existing = db.prepare('SELECT id FROM warehouses WHERE code = ?').get(validated.code);
      if (existing) {
        throw new AppError('DUPLICATE_CODE', `Warehouse code "${validated.code}" already exists`, 409);
      }

      db.prepare(`
        INSERT INTO warehouses (name, code, location, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(validated.name, validated.code, validated.location || '');

      const created = db.prepare('SELECT * FROM warehouses WHERE code = ?').get(validated.code) as any;

      res.status(201).json({
        success: true,
        data: {
          id: created.id,
          name: created.name,
          code: created.code,
          location: created.location,
          createdAt: created.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
