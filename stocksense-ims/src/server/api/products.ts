import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { CreateProductSchema, UpdateProductSchema } from '../validation/schemas';
import { AppError } from '../services/stockService';

export function createProductsRouter(db: DatabaseSync): Router {
  const router = Router();

  // GET /api/products
  router.get('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, category, warehouseId, lowStock } = req.query;

      let baseQuery = `
        SELECT 
          p.id,
          p.sku,
          p.name,
          p.category,
          p.unit_of_measure as unitOfMeasure,
          p.low_stock_threshold as lowStockThreshold,
          p.created_at as createdAt,
          p.updated_at as updatedAt,
          COALESCE(SUM(s.quantity), 0) as totalStock
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id
      `;

      const conditions: string[] = [];
      const params: any[] = [];

      if (warehouseId) {
        conditions.push(`(s.warehouse_id = ? OR s.warehouse_id IS NULL)`);
        params.push(Number(warehouseId));
      }

      if (category && category !== 'All') {
        conditions.push(`p.category = ?`);
        params.push(String(category));
      }

      if (search) {
        const term = `%${search}%`;
        conditions.push(`(p.name LIKE ? OR p.sku LIKE ? OR p.category LIKE ?)`);
        params.push(term, term, term);
      }

      if (conditions.length > 0) {
        baseQuery += ` WHERE ` + conditions.join(' AND ');
      }

      baseQuery += ` GROUP BY p.id ORDER BY p.name ASC`;

      let products = db.prepare(baseQuery).all(...params) as any[];

      // Filter low stock if requested
      if (lowStock === 'true' || lowStock === '1') {
        products = products.filter(p => p.totalStock > 0 && p.totalStock <= p.lowStockThreshold);
      } else if (lowStock === 'out') {
        products = products.filter(p => p.totalStock === 0);
      }

      // Add status indicator
      const enrichedProducts = products.map(p => {
        let status = 'In Stock';
        if (p.totalStock === 0) {
          status = 'Out of Stock';
        } else if (p.totalStock <= p.lowStockThreshold) {
          status = 'Low Stock';
        }
        return {
          ...p,
          status,
        };
      });

      res.json({
        success: true,
        data: enrichedProducts,
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/products/:id
  router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = Number(req.params.id);
      const product = db.prepare(`
        SELECT 
          p.id,
          p.sku,
          p.name,
          p.category,
          p.unit_of_measure as unitOfMeasure,
          p.low_stock_threshold as lowStockThreshold,
          p.created_at as createdAt,
          p.updated_at as updatedAt,
          COALESCE(SUM(s.quantity), 0) as totalStock
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id
        WHERE p.id = ?
        GROUP BY p.id
      `).get(productId) as any;

      if (!product) {
        throw new AppError('NOT_FOUND', `Product with ID ${productId} not found`, 404);
      }

      // Get warehouse-level breakdown
      const stockBreakdown = db.prepare(`
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

      let status = 'In Stock';
      if (product.totalStock === 0) {
        status = 'Out of Stock';
      } else if (product.totalStock <= product.lowStockThreshold) {
        status = 'Low Stock';
      }

      res.json({
        success: true,
        data: {
          ...product,
          status,
          stockByWarehouse: stockBreakdown,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/products
  router.post('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = CreateProductSchema.parse(req.body);

      // Check unique SKU
      const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(validated.sku);
      if (existing) {
        throw new AppError('DUPLICATE_SKU', `A product with SKU "${validated.sku}" already exists`, 409);
      }

      const stmt = db.prepare(`
        INSERT INTO products (sku, name, category, unit_of_measure, low_stock_threshold, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      stmt.run(
        validated.sku,
        validated.name,
        validated.category,
        validated.unitOfMeasure,
        validated.lowStockThreshold
      );

      const created = db.prepare('SELECT * FROM products WHERE sku = ?').get(validated.sku) as any;

      res.status(201).json({
        success: true,
        data: {
          id: created.id,
          sku: created.sku,
          name: created.name,
          category: created.category,
          unitOfMeasure: created.unit_of_measure,
          lowStockThreshold: created.low_stock_threshold,
          createdAt: created.created_at,
          totalStock: 0,
          status: 'Out of Stock',
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // PUT /api/products/:id
  router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = Number(req.params.id);
      const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
      if (!existing) {
        throw new AppError('NOT_FOUND', `Product with ID ${productId} not found`, 404);
      }

      const validated = UpdateProductSchema.parse(req.body);

      if (validated.sku && validated.sku !== existing.sku) {
        const skuConflict = db.prepare('SELECT id FROM products WHERE sku = ? AND id != ?').get(validated.sku, productId);
        if (skuConflict) {
          throw new AppError('DUPLICATE_SKU', `SKU "${validated.sku}" is already in use`, 409);
        }
      }

      const sku = validated.sku ?? existing.sku;
      const name = validated.name ?? existing.name;
      const category = validated.category ?? existing.category;
      const unitOfMeasure = validated.unitOfMeasure ?? existing.unit_of_measure;
      const lowStockThreshold = validated.lowStockThreshold ?? existing.low_stock_threshold;

      db.prepare(`
        UPDATE products 
        SET sku = ?, name = ?, category = ?, unit_of_measure = ?, low_stock_threshold = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(sku, name, category, unitOfMeasure, lowStockThreshold, productId);

      const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;

      res.json({
        success: true,
        data: {
          id: updated.id,
          sku: updated.sku,
          name: updated.name,
          category: updated.category,
          unitOfMeasure: updated.unit_of_measure,
          lowStockThreshold: updated.low_stock_threshold,
          updatedAt: updated.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // DELETE /api/products/:id
  router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = Number(req.params.id);
      const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
      if (!existing) {
        throw new AppError('NOT_FOUND', `Product with ID ${productId} not found`, 404);
      }

      // Check if product has stock
      const stock = db.prepare('SELECT SUM(quantity) as total FROM stock WHERE product_id = ?').get(productId) as any;
      if (stock && stock.total > 0) {
        throw new AppError('HAS_STOCK', `Cannot delete product with existing stock (${stock.total} units). Adjust stock to 0 first.`, 400);
      }

      db.prepare('DELETE FROM products WHERE id = ?').run(productId);

      res.json({
        success: true,
        data: { id: productId, message: 'Product deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
