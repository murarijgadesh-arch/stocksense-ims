import { DatabaseSync } from 'node:sqlite';
import { ZodError } from 'zod';
import { 
  CreateProductSchema, 
  UpdateProductSchema, 
  CreateWarehouseSchema, 
  CreateReceiptSchema, 
  CreateDeliverySchema, 
  CreateTransferSchema, 
  CreateAdjustmentSchema,
  SignupSchema,
  LoginSchema,
  ForgotPasswordSchema,
  VerifyOtpSchema,
  ResetPasswordSchema
} from './validation/schemas';
import { 
  validateReceipt, 
  validateDelivery, 
  validateTransfer, 
  validateAdjustment, 
  runInTransaction, 
  AppError 
} from './services/stockService';
import { getNextReference } from './services/referenceService';
import { hashPassword, verifyPassword } from './api/auth';

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function errorResponse(code: string, message: string, status = 400, details?: any) {
  return jsonResponse({
    success: false,
    error: { code, message, details },
  }, status);
}

export async function handleApiRequest(request: Request, db: DatabaseSync): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (!pathname.startsWith('/api')) {
    return null;
  }

  try {
    // ----------------------------------------------------
    // PRODUCTS API
    // ----------------------------------------------------
    if (pathname === '/api/products' && method === 'GET') {
      const search = url.searchParams.get('search');
      const category = url.searchParams.get('category');
      const warehouseId = url.searchParams.get('warehouseId');
      const lowStock = url.searchParams.get('lowStock');

      let query = `
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

      if (category && category !== 'All' && category !== 'All categories') {
        conditions.push(`p.category = ?`);
        params.push(category);
      }

      if (search) {
        const term = `%${search}%`;
        conditions.push(`(p.name LIKE ? OR p.sku LIKE ? OR p.category LIKE ?)`);
        params.push(term, term, term);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY p.id ORDER BY p.name ASC';

      let products = db.prepare(query).all(...params) as any[];

      if (lowStock === 'true' || lowStock === '1') {
        products = products.filter(p => p.totalStock > 0 && p.totalStock <= p.lowStockThreshold);
      } else if (lowStock === 'out') {
        products = products.filter(p => p.totalStock === 0);
      }

      const enriched = products.map(p => ({
        ...p,
        status: p.totalStock === 0 ? 'Out of stock' : p.totalStock <= p.lowStockThreshold ? 'Low stock' : 'In stock',
      }));

      return jsonResponse({ success: true, data: enriched });
    }

    if (pathname.match(/^\/api\/products\/\d+$/) && method === 'GET') {
      const id = Number(pathname.split('/').pop());
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
      `).get(id) as any;

      if (!product) {
        return errorResponse('NOT_FOUND', `Product with ID ${id} not found`, 404);
      }

      const stockByWarehouse = db.prepare(`
        SELECT 
          w.id as warehouseId,
          w.name as warehouseName,
          w.code as warehouseCode,
          COALESCE(s.quantity, 0) as quantity,
          s.updated_at as updatedAt
        FROM warehouses w
        LEFT JOIN stock s ON w.id = s.warehouse_id AND s.product_id = ?
        ORDER BY w.name ASC
      `).all(id);

      return jsonResponse({
        success: true,
        data: {
          ...product,
          status: product.totalStock === 0 ? 'Out of stock' : product.totalStock <= product.lowStockThreshold ? 'Low stock' : 'In stock',
          stockByWarehouse,
        },
      });
    }

    if (pathname === '/api/products' && method === 'POST') {
      const body = await request.json();
      const validated = CreateProductSchema.parse(body);

      const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(validated.sku);
      if (existing) {
        return errorResponse('DUPLICATE_SKU', `A product with SKU "${validated.sku}" already exists`, 409);
      }

      db.prepare(`
        INSERT INTO products (sku, name, category, unit_of_measure, low_stock_threshold, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(validated.sku, validated.name, validated.category, validated.unitOfMeasure, validated.lowStockThreshold);

      const created = db.prepare('SELECT * FROM products WHERE sku = ?').get(validated.sku) as any;
      return jsonResponse({
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
          status: 'Out of stock',
        },
      }, 201);
    }

    // ----------------------------------------------------
    // WAREHOUSES API
    // ----------------------------------------------------
    if (pathname === '/api/warehouses' && method === 'GET') {
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
      return jsonResponse({ success: true, data: warehouses });
    }

    if (pathname === '/api/warehouses' && method === 'POST') {
      const body = await request.json();
      const validated = CreateWarehouseSchema.parse(body);

      const existing = db.prepare('SELECT id FROM warehouses WHERE code = ?').get(validated.code);
      if (existing) {
        return errorResponse('DUPLICATE_CODE', `Warehouse code "${validated.code}" already exists`, 409);
      }

      db.prepare(`
        INSERT INTO warehouses (name, code, location, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(validated.name, validated.code, validated.location || '');

      const created = db.prepare('SELECT * FROM warehouses WHERE code = ?').get(validated.code);
      return jsonResponse({ success: true, data: created }, 201);
    }

    // ----------------------------------------------------
    // STOCK API
    // ----------------------------------------------------
    if (pathname === '/api/stock' && method === 'GET') {
      const stock = db.prepare(`
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
        ORDER BY p.name ASC, w.name ASC
      `).all();
      return jsonResponse({ success: true, data: stock });
    }

    // ----------------------------------------------------
    // RECEIPTS API
    // ----------------------------------------------------
    if (pathname === '/api/receipts' && method === 'GET') {
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
      return jsonResponse({ success: true, data: receipts });
    }

    if (pathname === '/api/receipts' && method === 'POST') {
      const body = await request.json();
      const validated = CreateReceiptSchema.parse(body);

      const result = runInTransaction(db, () => {
        const reference = getNextReference(db, 'RCP');
        db.prepare(`
          INSERT INTO receipts (reference, supplier, warehouse_id, status, created_at)
          VALUES (?, ?, ?, 'PENDING', datetime('now'))
        `).run(reference, validated.supplier, validated.warehouseId);

        const created = db.prepare('SELECT * FROM receipts WHERE reference = ?').get(reference) as any;
        const insertItem = db.prepare('INSERT INTO receipt_items (receipt_id, product_id, quantity) VALUES (?, ?, ?)');
        for (const item of validated.items) {
          insertItem.run(created.id, item.productId, item.quantity);
        }
        return created;
      });

      return jsonResponse({ success: true, data: result }, 201);
    }

    if (pathname.match(/^\/api\/receipts\/\d+\/validate$/) && method === 'POST') {
      const parts = pathname.split('/');
      const id = Number(parts[parts.length - 2]);
      const result = validateReceipt(db, id);
      return jsonResponse({ success: true, data: result });
    }

    // ----------------------------------------------------
    // DELIVERIES API
    // ----------------------------------------------------
    if (pathname === '/api/deliveries' && method === 'GET') {
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
      return jsonResponse({ success: true, data: deliveries });
    }

    if (pathname === '/api/deliveries' && method === 'POST') {
      const body = await request.json();
      const validated = CreateDeliverySchema.parse(body);

      const result = runInTransaction(db, () => {
        const reference = getNextReference(db, 'DLV');
        db.prepare(`
          INSERT INTO deliveries (reference, customer, warehouse_id, status, created_at)
          VALUES (?, ?, ?, 'PENDING', datetime('now'))
        `).run(reference, validated.customer, validated.warehouseId);

        const created = db.prepare('SELECT * FROM deliveries WHERE reference = ?').get(reference) as any;
        const insertItem = db.prepare('INSERT INTO delivery_items (delivery_id, product_id, quantity) VALUES (?, ?, ?)');
        for (const item of validated.items) {
          insertItem.run(created.id, item.productId, item.quantity);
        }
        return created;
      });

      return jsonResponse({ success: true, data: result }, 201);
    }

    if (pathname.match(/^\/api\/deliveries\/\d+\/validate$/) && method === 'POST') {
      const parts = pathname.split('/');
      const id = Number(parts[parts.length - 2]);
      const result = validateDelivery(db, id);
      return jsonResponse({ success: true, data: result });
    }

    // ----------------------------------------------------
    // TRANSFERS API
    // ----------------------------------------------------
    if (pathname === '/api/transfers' && method === 'GET') {
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
      return jsonResponse({ success: true, data: transfers });
    }

    if (pathname === '/api/transfers' && method === 'POST') {
      const body = await request.json();
      const validated = CreateTransferSchema.parse(body);

      const result = runInTransaction(db, () => {
        const reference = getNextReference(db, 'TRF');
        db.prepare(`
          INSERT INTO transfers (reference, from_warehouse_id, to_warehouse_id, status, created_at)
          VALUES (?, ?, ?, 'PENDING', datetime('now'))
        `).run(reference, validated.fromWarehouseId, validated.toWarehouseId);

        const created = db.prepare('SELECT * FROM transfers WHERE reference = ?').get(reference) as any;
        const insertItem = db.prepare('INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES (?, ?, ?)');
        for (const item of validated.items) {
          insertItem.run(created.id, item.productId, item.quantity);
        }
        return created;
      });

      return jsonResponse({ success: true, data: result }, 201);
    }

    if (pathname.match(/^\/api\/transfers\/\d+\/validate$/) && method === 'POST') {
      const parts = pathname.split('/');
      const id = Number(parts[parts.length - 2]);
      const result = validateTransfer(db, id);
      return jsonResponse({ success: true, data: result });
    }

    // ----------------------------------------------------
    // ADJUSTMENTS API
    // ----------------------------------------------------
    if (pathname === '/api/adjustments' && method === 'GET') {
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
      return jsonResponse({ success: true, data: adjustments });
    }

    if (pathname === '/api/adjustments' && method === 'POST') {
      const body = await request.json();
      const validated = CreateAdjustmentSchema.parse(body);

      const result = runInTransaction(db, () => {
        const reference = getNextReference(db, 'ADJ');
        db.prepare(`
          INSERT INTO adjustments (reference, warehouse_id, reason, status, created_at)
          VALUES (?, ?, ?, 'PENDING', datetime('now'))
        `).run(reference, validated.warehouseId, validated.reason);

        const created = db.prepare('SELECT * FROM adjustments WHERE reference = ?').get(reference) as any;
        const insertItem = db.prepare('INSERT INTO adjustment_items (adjustment_id, product_id, quantity_change) VALUES (?, ?, ?)');
        for (const item of validated.items) {
          insertItem.run(created.id, item.productId, item.quantityChange);
        }
        return created;
      });

      return jsonResponse({ success: true, data: result }, 201);
    }

    if (pathname.match(/^\/api\/adjustments\/\d+\/validate$/) && method === 'POST') {
      const parts = pathname.split('/');
      const id = Number(parts[parts.length - 2]);
      const result = validateAdjustment(db, id);
      return jsonResponse({ success: true, data: result });
    }

    // ----------------------------------------------------
    // LEDGER API
    // ----------------------------------------------------
    if (pathname === '/api/ledger' && method === 'GET') {
      const ledger = db.prepare(`
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
        ORDER BY l.id DESC
        LIMIT 100
      `).all();
      return jsonResponse({ success: true, data: ledger });
    }

    // ----------------------------------------------------
    // DASHBOARD API
    // ----------------------------------------------------
    if (pathname === '/api/dashboard' && method === 'GET') {
      const prodRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
      const totalProducts = prodRow?.count || 0;

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
        if (p.totalStock === 0) outOfStockCount++;
        else if (p.totalStock <= p.low_stock_threshold) lowStockCount++;
      }

      const totalUnitsRow = db.prepare('SELECT COALESCE(SUM(quantity), 0) as total FROM stock').get() as { total: number };
      const totalStockUnits = totalUnitsRow?.total || 0;

      const pendingReceipts = (db.prepare("SELECT COUNT(*) as count FROM receipts WHERE status = 'PENDING'").get() as any)?.count || 0;
      const pendingDeliveries = (db.prepare("SELECT COUNT(*) as count FROM deliveries WHERE status = 'PENDING'").get() as any)?.count || 0;
      const pendingTransfers = (db.prepare("SELECT COUNT(*) as count FROM transfers WHERE status = 'PENDING'").get() as any)?.count || 0;
      const pendingAdjustments = (db.prepare("SELECT COUNT(*) as count FROM adjustments WHERE status = 'PENDING'").get() as any)?.count || 0;

      const recentReceipts = db.prepare(`
        SELECT 'Receipt' as type, r.reference, r.supplier as partner, w.name as warehouseName, r.status, r.created_at as createdAt, COALESCE(SUM(ri.quantity), 0) as totalUnits
        FROM receipts r JOIN warehouses w ON r.warehouse_id = w.id LEFT JOIN receipt_items ri ON r.id = ri.receipt_id GROUP BY r.id ORDER BY r.id DESC LIMIT 5
      `).all() as any[];

      const recentDeliveries = db.prepare(`
        SELECT 'Delivery' as type, d.reference, d.customer as partner, w.name as warehouseName, d.status, d.created_at as createdAt, COALESCE(SUM(di.quantity), 0) as totalUnits
        FROM deliveries d JOIN warehouses w ON d.warehouse_id = w.id LEFT JOIN delivery_items di ON d.id = di.delivery_id GROUP BY d.id ORDER BY d.id DESC LIMIT 5
      `).all() as any[];

      const recentTransfers = db.prepare(`
        SELECT 'Transfer' as type, t.reference, (fw.name || ' -> ' || tw.name) as partner, fw.name as warehouseName, t.status, t.created_at as createdAt, COALESCE(SUM(ti.quantity), 0) as totalUnits
        FROM transfers t JOIN warehouses fw ON t.from_warehouse_id = fw.id JOIN warehouses tw ON t.to_warehouse_id = tw.id LEFT JOIN transfer_items ti ON t.id = ti.transfer_id GROUP BY t.id ORDER BY t.id DESC LIMIT 5
      `).all() as any[];

      const recentAdjustments = db.prepare(`
        SELECT 'Adjustment' as type, a.reference, a.reason as partner, w.name as warehouseName, a.status, a.created_at as createdAt, COALESCE(SUM(ai.quantity_change), 0) as totalUnits
        FROM adjustments a JOIN warehouses w ON a.warehouse_id = w.id LEFT JOIN adjustment_items ai ON a.id = ai.adjustment_id GROUP BY a.id ORDER BY a.id DESC LIMIT 5
      `).all() as any[];

      const recentDocuments = [...recentReceipts, ...recentDeliveries, ...recentTransfers, ...recentAdjustments]
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
        .slice(0, 8);

      const recentLedger = db.prepare(`
        SELECT l.id, l.product_id as productId, p.sku as productSku, p.name as productName, w.name as warehouseName, l.transaction_type as transactionType, l.reference_id as referenceId, l.quantity_change as quantityChange, l.quantity_after as quantityAfter, l.created_at as createdAt
        FROM stock_ledger l JOIN products p ON l.product_id = p.id JOIN warehouses w ON l.warehouse_id = w.id ORDER BY l.id DESC LIMIT 10
      `).all();

      const stockByCategory = db.prepare(`
        SELECT p.category, COUNT(DISTINCT p.id) as productCount, COALESCE(SUM(s.quantity), 0) as totalUnits
        FROM products p LEFT JOIN stock s ON p.id = s.product_id GROUP BY p.category ORDER BY totalUnits DESC
      `).all();

      const stockByWarehouse = db.prepare(`
        SELECT w.id, w.name, w.code, COALESCE(SUM(s.quantity), 0) as totalUnits, COUNT(DISTINCT s.product_id) as productCount
        FROM warehouses w LEFT JOIN stock s ON w.id = s.warehouse_id GROUP BY w.id ORDER BY totalUnits DESC
      `).all();

      return jsonResponse({
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
          recentDocuments,
          recentLedger,
          stockByCategory,
          stockByWarehouse,
        },
      });
    }

    // ----------------------------------------------------
    // AUTH API
    // ----------------------------------------------------
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await request.json();
      const validated = LoginSchema.parse(body);

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(validated.email) as any;
      if (!user || !verifyPassword(validated.password, user.password_hash)) {
        return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      return jsonResponse({
        success: true,
        data: {
          user: { id: user.id, name: user.name, email: user.email, createdAt: user.created_at },
          token: `token-${user.id}-${Date.now()}`,
        },
      });
    }

    if (pathname === '/api/auth/signup' && method === 'POST') {
      const body = await request.json();
      const validated = SignupSchema.parse(body);

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(validated.email);
      if (existing) {
        return errorResponse('DUPLICATE_EMAIL', 'Email is already registered', 409);
      }

      const passwordHash = hashPassword(validated.password);
      db.prepare('INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, datetime(\'now\'))')
        .run(validated.name, validated.email, passwordHash);

      const created = db.prepare('SELECT id, name, email, created_at FROM users WHERE email = ?').get(validated.email) as any;
      return jsonResponse({
        success: true,
        data: {
          user: created,
          token: `token-${created.id}-${Date.now()}`,
        },
      }, 201);
    }

    return errorResponse('NOT_FOUND', `API endpoint ${pathname} not found`, 404);
  } catch (error: any) {
    if (error instanceof ZodError) {
      return errorResponse('VALIDATION_ERROR', error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '), 400, error.errors);
    }
    if (error instanceof AppError) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error('Unhandled API error:', error);
    return errorResponse('INTERNAL_SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
  }
}
