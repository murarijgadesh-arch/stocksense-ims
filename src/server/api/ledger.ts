import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';

export function createLedgerRouter(db: DatabaseSync): Router {
  const router = Router();

  // GET /api/ledger
  router.get('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId, warehouseId, transactionType, startDate, endDate, limit, offset } = req.query;

      let query = `
        SELECT 
          l.id,
          l.product_id as productId,
          p.sku as productSku,
          p.name as productName,
          l.warehouse_id as warehouseId,
          w.name as warehouseName,
          w.code as warehouseCode,
          l.transaction_type as transactionType,
          l.reference_id as referenceId,
          l.quantity_change as quantityChange,
          l.quantity_before as quantityBefore,
          l.quantity_after as quantityAfter,
          l.created_at as createdAt
        FROM stock_ledger l
        JOIN products p ON l.product_id = p.id
        JOIN warehouses w ON l.warehouse_id = w.id
      `;

      const conditions: string[] = [];
      const params: any[] = [];

      if (productId) {
        conditions.push('l.product_id = ?');
        params.push(Number(productId));
      }

      if (warehouseId) {
        conditions.push('l.warehouse_id = ?');
        params.push(Number(warehouseId));
      }

      if (transactionType) {
        conditions.push('l.transaction_type = ?');
        params.push(String(transactionType));
      }

      if (startDate) {
        conditions.push('l.created_at >= ?');
        params.push(String(startDate));
      }

      if (endDate) {
        conditions.push('l.created_at <= ?');
        params.push(String(endDate));
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY l.id DESC';

      if (limit) {
        query += ` LIMIT ${Number(limit)}`;
        if (offset) {
          query += ` OFFSET ${Number(offset)}`;
        }
      }

      const rows = db.prepare(query).all(...params);

      res.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
