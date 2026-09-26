import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';

export function createStockRouter(db: DatabaseSync): Router {
  const router = Router();

  // GET /api/stock
  router.get('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { warehouseId, productId } = req.query;

      let query = `
        SELECT 
          s.id,
          s.product_id as productId,
          s.warehouse_id as warehouseId,
          s.quantity,
          s.updated_at as updatedAt,
          p.sku as productSku,
          p.name as productName,
          p.category as productCategory,
          p.unit_of_measure as unitOfMeasure,
          p.low_stock_threshold as lowStockThreshold,
          w.name as warehouseName,
          w.code as warehouseCode
        FROM stock s
        JOIN products p ON s.product_id = p.id
        JOIN warehouses w ON s.warehouse_id = w.id
      `;

      const conditions: string[] = [];
      const params: any[] = [];

      if (warehouseId) {
        conditions.push('s.warehouse_id = ?');
        params.push(Number(warehouseId));
      }

      if (productId) {
        conditions.push('s.product_id = ?');
        params.push(Number(productId));
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY p.name ASC, w.name ASC';

      const stock = db.prepare(query).all(...params);

      res.json({
        success: true,
        data: stock,
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/stock/:productId
  router.get('/:productId', (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = Number(req.params.productId);

      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
      if (!product) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Product ID ${productId} not found` },
        });
      }

      const stock = db.prepare(`
        SELECT 
          w.id as warehouseId,
          w.name as warehouseName,
          w.code as warehouseCode,
          COALESCE(s.quantity, 0) as quantity,
          s.updated_at as updatedAt
        FROM warehouses w
        LEFT JOIN stock s ON w.id = s.warehouse_id AND s.product_id = ?
        ORDER BY w.name ASC
      `).all(productId);

      const totalStock = stock.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

      res.json({
        success: true,
        data: {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          totalStock,
          warehouses: stock,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/stock/:productId/:warehouseId
  router.get('/:productId/:warehouseId', (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = Number(req.params.productId);
      const warehouseId = Number(req.params.warehouseId);

      const row = db.prepare(`
        SELECT 
          s.id,
          s.product_id as productId,
          s.warehouse_id as warehouseId,
          s.quantity,
          s.updated_at as updatedAt,
          p.sku as productSku,
          p.name as productName,
          w.name as warehouseName,
          w.code as warehouseCode
        FROM stock s
        JOIN products p ON s.product_id = p.id
        JOIN warehouses w ON s.warehouse_id = w.id
        WHERE s.product_id = ? AND s.warehouse_id = ?
      `).get(productId, warehouseId);

      if (!row) {
        return res.json({
          success: true,
          data: {
            productId,
            warehouseId,
            quantity: 0,
          },
        });
      }

      res.json({
        success: true,
        data: row,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
