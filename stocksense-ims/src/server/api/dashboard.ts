import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';

export function createDashboardRouter(db: DatabaseSync): Router {
  const router = Router();

  // GET /api/dashboard
  router.get('/', (_req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Total products
      const prodRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
      const totalProducts = prodRow?.count || 0;

      // 2. Product stock analysis for low stock & out of stock
      const productsWithStock = db.prepare(`
        SELECT 
          p.id,
          p.low_stock_threshold,
          COALESCE(SUM(s.quantity), 0) as totalStock
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id
        GROUP BY p.id
      `).all() as any[];

      let lowStockCount = 0;
      let outOfStockCount = 0;
      for (const p of productsWithStock) {
        if (p.totalStock === 0) {
          outOfStockCount++;
        } else if (p.totalStock <= p.low_stock_threshold) {
          lowStockCount++;
        }
      }

      // 3. Total stock units in system
      const totalUnitsRow = db.prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM stock').get() as { total: number };
      const totalStockUnits = totalUnitsRow?.total || 0;

      // 4. Pending operations counts
      const pendingReceiptsRow = db.prepare("SELECT COUNT(*) as count FROM receipts WHERE status = 'PENDING'").get() as { count: number };
      const pendingReceipts = pendingReceiptsRow?.count || 0;

      const pendingDeliveriesRow = db.prepare("SELECT COUNT(*) as count FROM deliveries WHERE status = 'PENDING'").get() as { count: number };
      const pendingDeliveries = pendingDeliveriesRow?.count || 0;

      const pendingTransfersRow = db.prepare("SELECT COUNT(*) as count FROM transfers WHERE status = 'PENDING'").get() as { count: number };
      const pendingTransfers = pendingTransfersRow?.count || 0;

      const pendingAdjustmentsRow = db.prepare("SELECT COUNT(*) as count FROM adjustments WHERE status = 'PENDING'").get() as { count: number };
      const pendingAdjustments = pendingAdjustmentsRow?.count || 0;

      // 5. Recent documents (Receipts, Deliveries, Transfers, Adjustments combined)
      const recentReceipts = db.prepare(`
        SELECT 
          'Receipt' as type,
          r.reference,
          r.supplier as partner,
          w.name as warehouseName,
          r.status,
          r.created_at as createdAt,
          COALESCE(SUM(ri.quantity), 0) as totalUnits
        FROM receipts r
        JOIN warehouses w ON r.warehouse_id = w.id
        LEFT JOIN receipt_items ri ON r.id = ri.receipt_id
        GROUP BY r.id
        ORDER BY r.id DESC
        LIMIT 5
      `).all() as any[];

      const recentDeliveries = db.prepare(`
        SELECT 
          'Delivery' as type,
          d.reference,
          d.customer as partner,
          w.name as warehouseName,
          d.status,
          d.created_at as createdAt,
          COALESCE(SUM(di.quantity), 0) as totalUnits
        FROM deliveries d
        JOIN warehouses w ON d.warehouse_id = w.id
        LEFT JOIN delivery_items di ON d.id = di.delivery_id
        GROUP BY d.id
        ORDER BY d.id DESC
        LIMIT 5
      `).all() as any[];

      const recentTransfers = db.prepare(`
        SELECT 
          'Transfer' as type,
          t.reference,
          (fw.name || ' -> ' || tw.name) as partner,
          fw.name as warehouseName,
          t.status,
          t.created_at as createdAt,
          COALESCE(SUM(ti.quantity), 0) as totalUnits
        FROM transfers t
        JOIN warehouses fw ON t.from_warehouse_id = fw.id
        JOIN warehouses tw ON t.to_warehouse_id = tw.id
        LEFT JOIN transfer_items ti ON t.id = ti.transfer_id
        GROUP BY t.id
        ORDER BY t.id DESC
        LIMIT 5
      `).all() as any[];

      const recentAdjustments = db.prepare(`
        SELECT 
          'Adjustment' as type,
          a.reference,
          a.reason as partner,
          w.name as warehouseName,
          a.status,
          a.created_at as createdAt,
          COALESCE(SUM(ai.quantity_change), 0) as totalUnits
        FROM adjustments a
        JOIN warehouses w ON a.warehouse_id = w.id
        LEFT JOIN adjustment_items ai ON a.id = ai.adjustment_id
        GROUP BY a.id
        ORDER BY a.id DESC
        LIMIT 5
      `).all() as any[];

      const combinedDocs = [...recentReceipts, ...recentDeliveries, ...recentTransfers, ...recentAdjustments]
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
        .slice(0, 8);

      // 6. Recent ledger entries
      const recentLedger = db.prepare(`
        SELECT 
          l.id,
          l.product_id as productId,
          p.sku as productSku,
          p.name as productName,
          w.name as warehouseName,
          l.transaction_type as transactionType,
          l.reference_id as referenceId,
          l.quantity_change as quantityChange,
          l.quantity_after as quantityAfter,
          l.created_at as createdAt
        FROM stock_ledger l
        JOIN products p ON l.product_id = p.id
        JOIN warehouses w ON l.warehouse_id = w.id
        ORDER BY l.id DESC
        LIMIT 10
      `).all();

      // 7. Stock by Category
      const stockByCategory = db.prepare(`
        SELECT 
          p.category,
          COUNT(DISTINCT p.id) as productCount,
          COALESCE(SUM(s.quantity), 0) as totalUnits
        FROM products p
        LEFT JOIN stock s ON p.id = s.product_id
        GROUP BY p.category
        ORDER BY totalUnits DESC
      `).all();

      // 8. Stock by Warehouse
      const stockByWarehouse = db.prepare(`
        SELECT 
          w.id,
          w.name,
          w.code,
          COALESCE(SUM(s.quantity), 0) as totalUnits,
          COUNT(DISTINCT s.product_id) as productCount
        FROM warehouses w
        LEFT JOIN stock s ON w.id = s.warehouse_id
        GROUP BY w.id
        ORDER BY totalUnits DESC
      `).all();

      res.json({
        success: true,
        data: {
          kpis: {
            totalProducts,
            lowStockCount,
            outOfStockCount,
            totalStockUnits,
            pendingReceipts,
            pendingDeliveries,
            pendingTransfers,
            pendingAdjustments,
          },
          recentDocuments: combinedDocs,
          recentLedger,
          stockByCategory,
          stockByWarehouse,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
