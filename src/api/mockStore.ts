import {
  Product,
  Warehouse,
  Receipt,
  Delivery,
  Transfer,
  Adjustment,
  StockLedgerEntry,
  DashboardData,
  User,
} from '../types';

const STORAGE_KEY = 'stocksense_offline_db_v1';

interface DatabaseState {
  users: User[];
  warehouses: Warehouse[];
  products: Product[];
  receipts: Receipt[];
  deliveries: Delivery[];
  transfers: Transfer[];
  adjustments: Adjustment[];
  ledger: StockLedgerEntry[];
}

function getInitialState(): DatabaseState {
  const warehouses: Warehouse[] = [
    { id: 1, name: 'Central Depot', code: 'WH-CD', location: 'Building A, Industrial Sector 4', createdAt: '2026-09-20T10:00:00Z', totalStockUnits: 595, totalDistinctProducts: 6 },
    { id: 2, name: 'North Hub', code: 'WH-NH', location: 'North Logistics Park, Dock 2', createdAt: '2026-09-20T10:00:00Z', totalStockUnits: 140, totalDistinctProducts: 2 },
    { id: 3, name: 'Port Annex', code: 'WH-PA', location: 'Maritime Way, Bay 12', createdAt: '2026-09-20T10:00:00Z', totalStockUnits: 0, totalDistinctProducts: 0 },
    { id: 4, name: 'Retail Backstore', code: 'WH-RB', location: 'Metro Mall Unit B3', createdAt: '2026-09-20T10:00:00Z', totalStockUnits: 0, totalDistinctProducts: 0 },
  ];

  const products: Product[] = [
    {
      id: 1,
      sku: 'SKU-10231',
      name: 'Thermal Label Roll 4x6',
      category: 'Packaging',
      unitOfMeasure: 'roll',
      lowStockThreshold: 15,
      totalStock: 160,
      status: 'In Stock',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-26T12:00:00Z',
      stockByWarehouse: [
        { warehouseId: 1, warehouseName: 'Central Depot', warehouseCode: 'WH-CD', quantity: 120, updatedAt: '2026-09-26T12:00:00Z' },
        { warehouseId: 2, warehouseName: 'North Hub', warehouseCode: 'WH-NH', quantity: 40, updatedAt: '2026-09-26T12:00:00Z' },
      ],
    },
    {
      id: 2,
      sku: 'SKU-10388',
      name: 'USB-C Dock Station',
      category: 'Electronics',
      unitOfMeasure: 'pcs',
      lowStockThreshold: 10,
      totalStock: 50,
      status: 'In Stock',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-26T12:00:00Z',
      stockByWarehouse: [
        { warehouseId: 1, warehouseName: 'Central Depot', warehouseCode: 'WH-CD', quantity: 50, updatedAt: '2026-09-26T12:00:00Z' },
      ],
    },
    {
      id: 3,
      sku: 'SKU-10440',
      name: 'Stainless Bolt M8',
      category: 'Hardware',
      unitOfMeasure: 'box',
      lowStockThreshold: 20,
      totalStock: 300,
      status: 'In Stock',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-26T12:00:00Z',
      stockByWarehouse: [
        { warehouseId: 1, warehouseName: 'Central Depot', warehouseCode: 'WH-CD', quantity: 200, updatedAt: '2026-09-26T12:00:00Z' },
        { warehouseId: 2, warehouseName: 'North Hub', warehouseCode: 'WH-NH', quantity: 100, updatedAt: '2026-09-26T12:00:00Z' },
      ],
    },
    {
      id: 4,
      sku: 'SKU-10512',
      name: 'Aluminium Sheet 2mm',
      category: 'Raw Material',
      unitOfMeasure: 'sheet',
      lowStockThreshold: 5,
      totalStock: 30,
      status: 'In Stock',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-26T12:00:00Z',
      stockByWarehouse: [
        { warehouseId: 1, warehouseName: 'Central Depot', warehouseCode: 'WH-CD', quantity: 30, updatedAt: '2026-09-26T12:00:00Z' },
      ],
    },
    {
      id: 5,
      sku: 'SKU-10677',
      name: 'Barcode Scanner X2',
      category: 'Electronics',
      unitOfMeasure: 'pcs',
      lowStockThreshold: 8,
      totalStock: 40,
      status: 'In Stock',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-26T12:00:00Z',
      stockByWarehouse: [
        { warehouseId: 1, warehouseName: 'Central Depot', warehouseCode: 'WH-CD', quantity: 40, updatedAt: '2026-09-26T12:00:00Z' },
      ],
    },
    {
      id: 6,
      sku: 'SKU-10712',
      name: 'Pallet Wrap Heavy',
      category: 'Packaging',
      unitOfMeasure: 'roll',
      lowStockThreshold: 12,
      totalStock: 85,
      status: 'In Stock',
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-26T12:00:00Z',
      stockByWarehouse: [
        { warehouseId: 1, warehouseName: 'Central Depot', warehouseCode: 'WH-CD', quantity: 85, updatedAt: '2026-09-26T12:00:00Z' },
      ],
    },
  ];

  const receipts: Receipt[] = [
    {
      id: 1,
      reference: 'RCP-0001',
      supplier: 'Global Logistics Supply',
      warehouseId: 1,
      warehouseName: 'Central Depot',
      status: 'COMPLETED',
      createdAt: '2026-09-21T10:00:00Z',
      validatedAt: '2026-09-21T10:30:00Z',
      totalItems: 6,
      totalUnits: 525,
      items: [
        { id: 1, productId: 1, productSku: 'SKU-10231', productName: 'Thermal Label Roll 4x6', unitOfMeasure: 'roll', quantity: 120 },
        { id: 2, productId: 2, productSku: 'SKU-10388', productName: 'USB-C Dock Station', unitOfMeasure: 'pcs', quantity: 50 },
        { id: 3, productId: 3, productSku: 'SKU-10440', productName: 'Stainless Bolt M8', unitOfMeasure: 'box', quantity: 200 },
        { id: 4, productId: 4, productSku: 'SKU-10512', productName: 'Aluminium Sheet 2mm', unitOfMeasure: 'sheet', quantity: 30 },
        { id: 5, productId: 5, productSku: 'SKU-10677', productName: 'Barcode Scanner X2', unitOfMeasure: 'pcs', quantity: 40 },
        { id: 6, productId: 6, productSku: 'SKU-10712', productName: 'Pallet Wrap Heavy', unitOfMeasure: 'roll', quantity: 85 },
      ],
    },
    {
      id: 2,
      reference: 'RCP-0002',
      supplier: 'Apex Hardware Direct',
      warehouseId: 2,
      warehouseName: 'North Hub',
      status: 'COMPLETED',
      createdAt: '2026-09-23T14:00:00Z',
      validatedAt: '2026-09-23T14:20:00Z',
      totalItems: 2,
      totalUnits: 140,
      items: [
        { id: 7, productId: 1, productSku: 'SKU-10231', productName: 'Thermal Label Roll 4x6', unitOfMeasure: 'roll', quantity: 40 },
        { id: 8, productId: 3, productSku: 'SKU-10440', productName: 'Stainless Bolt M8', unitOfMeasure: 'box', quantity: 100 },
      ],
    },
    {
      id: 3,
      reference: 'RCP-0003',
      supplier: 'Nordic Tech Components',
      warehouseId: 3,
      warehouseName: 'Port Annex',
      status: 'PENDING',
      createdAt: '2026-09-26T11:00:00Z',
      totalItems: 2,
      totalUnits: 40,
      items: [
        { id: 9, productId: 2, productSku: 'SKU-10388', productName: 'USB-C Dock Station', unitOfMeasure: 'pcs', quantity: 25 },
        { id: 10, productId: 5, productSku: 'SKU-10677', productName: 'Barcode Scanner X2', unitOfMeasure: 'pcs', quantity: 15 },
      ],
    },
  ];

  const deliveries: Delivery[] = [
    {
      id: 1,
      reference: 'DLV-0001',
      customer: 'Metro Electronics Store',
      warehouseId: 1,
      warehouseName: 'Central Depot',
      status: 'PENDING',
      createdAt: '2026-09-26T09:30:00Z',
      totalItems: 2,
      totalUnits: 15,
      items: [
        { id: 1, productId: 2, productSku: 'SKU-10388', productName: 'USB-C Dock Station', unitOfMeasure: 'pcs', quantity: 10, availableStock: 50 },
        { id: 2, productId: 5, productSku: 'SKU-10677', productName: 'Barcode Scanner X2', unitOfMeasure: 'pcs', quantity: 5, availableStock: 40 },
      ],
    },
  ];

  const transfers: Transfer[] = [];
  const adjustments: Adjustment[] = [];

  const ledger: StockLedgerEntry[] = [
    {
      id: 1,
      productId: 1,
      productSku: 'SKU-10231',
      productName: 'Thermal Label Roll 4x6',
      warehouseId: 1,
      warehouseName: 'Central Depot',
      warehouseCode: 'WH-CD',
      transactionType: 'RECEIPT',
      referenceId: 'RCP-0001',
      quantityChange: 120,
      quantityBefore: 0,
      quantityAfter: 120,
      createdAt: '2026-09-21T10:30:00Z',
    },
    {
      id: 2,
      productId: 2,
      productSku: 'SKU-10388',
      productName: 'USB-C Dock Station',
      warehouseId: 1,
      warehouseName: 'Central Depot',
      warehouseCode: 'WH-CD',
      transactionType: 'RECEIPT',
      referenceId: 'RCP-0001',
      quantityChange: 50,
      quantityBefore: 0,
      quantityAfter: 50,
      createdAt: '2026-09-21T10:30:00Z',
    },
    {
      id: 3,
      productId: 3,
      productSku: 'SKU-10440',
      productName: 'Stainless Bolt M8',
      warehouseId: 1,
      warehouseName: 'Central Depot',
      warehouseCode: 'WH-CD',
      transactionType: 'RECEIPT',
      referenceId: 'RCP-0001',
      quantityChange: 200,
      quantityBefore: 0,
      quantityAfter: 200,
      createdAt: '2026-09-21T10:30:00Z',
    },
    {
      id: 4,
      productId: 1,
      productSku: 'SKU-10231',
      productName: 'Thermal Label Roll 4x6',
      warehouseId: 2,
      warehouseName: 'North Hub',
      warehouseCode: 'WH-NH',
      transactionType: 'RECEIPT',
      referenceId: 'RCP-0002',
      quantityChange: 40,
      quantityBefore: 0,
      quantityAfter: 40,
      createdAt: '2026-09-23T14:20:00Z',
    },
    {
      id: 5,
      productId: 3,
      productSku: 'SKU-10440',
      productName: 'Stainless Bolt M8',
      warehouseId: 2,
      warehouseName: 'North Hub',
      warehouseCode: 'WH-NH',
      transactionType: 'RECEIPT',
      referenceId: 'RCP-0002',
      quantityChange: 100,
      quantityBefore: 0,
      quantityAfter: 100,
      createdAt: '2026-09-23T14:20:00Z',
    },
  ];

  const users: User[] = [
    { id: 1, name: 'Demo Admin', email: 'admin@stocksense.io', createdAt: '2026-09-20T10:00:00Z' },
  ];

  return { users, warehouses, products, receipts, deliveries, transfers, adjustments, ledger };
}

function loadState(): DatabaseState {
  if (typeof window === 'undefined') return getInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getInitialState();
      saveState(init);
      return init;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialState();
  }
}

function saveState(state: DatabaseState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save offline state to localStorage', e);
  }
}

export const mockStore = {
  // Products
  async getProducts(params?: { search?: string; category?: string; warehouseId?: number; lowStock?: string }): Promise<Product[]> {
    const state = loadState();
    let res = [...state.products];
    if (params?.search) {
      const q = params.search.toLowerCase();
      res = res.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (params?.category) {
      res = res.filter((p) => p.category === params.category);
    }
    if (params?.lowStock === 'true') {
      res = res.filter((p) => p.totalStock <= p.lowStockThreshold);
    }
    return res;
  },

  async getProduct(id: number): Promise<Product> {
    const state = loadState();
    const p = state.products.find((x) => x.id === id);
    if (!p) throw new Error('Product not found');
    return p;
  },

  async createProduct(data: { sku: string; name: string; category: string; unitOfMeasure: string; lowStockThreshold: number }): Promise<Product> {
    const state = loadState();
    const newP: Product = {
      id: Date.now(),
      sku: data.sku,
      name: data.name,
      category: data.category,
      unitOfMeasure: data.unitOfMeasure,
      lowStockThreshold: data.lowStockThreshold,
      totalStock: 0,
      status: 'Out of Stock',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stockByWarehouse: state.warehouses.map((w) => ({
        warehouseId: w.id,
        warehouseName: w.name,
        warehouseCode: w.code,
        quantity: 0,
        updatedAt: new Date().toISOString(),
      })),
    };
    state.products.push(newP);
    saveState(state);
    return newP;
  },

  async updateProduct(id: number, data: Partial<{ sku: string; name: string; category: string; unitOfMeasure: string; lowStockThreshold: number }>): Promise<Product> {
    const state = loadState();
    const idx = state.products.findIndex((x) => x.id === id);
    if (idx === -1) throw new Error('Product not found');
    state.products[idx] = { ...state.products[idx], ...data, updatedAt: new Date().toISOString() };
    saveState(state);
    return state.products[idx];
  },

  async deleteProduct(id: number): Promise<{ id: number; message: string }> {
    const state = loadState();
    state.products = state.products.filter((p) => p.id !== id);
    saveState(state);
    return { id, message: 'Product deleted' };
  },

  // Warehouses
  async getWarehouses(): Promise<Warehouse[]> {
    return loadState().warehouses;
  },

  async createWarehouse(data: { name: string; code: string; location?: string }): Promise<Warehouse> {
    const state = loadState();
    const newW: Warehouse = {
      id: Date.now(),
      name: data.name,
      code: data.code,
      location: data.location || '',
      createdAt: new Date().toISOString(),
      totalStockUnits: 0,
      totalDistinctProducts: 0,
    };
    state.warehouses.push(newW);
    saveState(state);
    return newW;
  },

  // Receipts
  async getReceipts(): Promise<Receipt[]> {
    return loadState().receipts;
  },

  async getReceipt(id: number): Promise<Receipt> {
    const r = loadState().receipts.find((x) => x.id === id);
    if (!r) throw new Error('Receipt not found');
    return r;
  },

  async createReceipt(data: { supplier: string; warehouseId: number; items: { productId: number; quantity: number }[] }): Promise<Receipt> {
    const state = loadState();
    const wh = state.warehouses.find((w) => w.id === data.warehouseId);
    const count = state.receipts.length + 1;
    const ref = `RCP-${String(count).padStart(4, '0')}`;

    const items = data.items.map((it, idx) => {
      const prod = state.products.find((p) => p.id === it.productId);
      return {
        id: Date.now() + idx,
        productId: it.productId,
        productSku: prod?.sku || 'SKU-UNKNOWN',
        productName: prod?.name || 'Unknown',
        unitOfMeasure: prod?.unitOfMeasure || 'units',
        quantity: it.quantity,
      };
    });

    const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);

    const newR: Receipt = {
      id: Date.now(),
      reference: ref,
      supplier: data.supplier,
      warehouseId: data.warehouseId,
      warehouseName: wh?.name || 'Warehouse',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      totalItems: items.length,
      totalUnits,
      items,
    };

    state.receipts.unshift(newR);
    saveState(state);
    return newR;
  },

  async validateReceipt(id: number): Promise<{ receiptId: number; reference: string; status: string }> {
    const state = loadState();
    const r = state.receipts.find((x) => x.id === id);
    if (!r) throw new Error('Receipt not found');
    if (r.status === 'COMPLETED') throw new Error('Receipt already completed');

    r.status = 'COMPLETED';
    r.validatedAt = new Date().toISOString();

    for (const item of r.items || []) {
      const prod = state.products.find((p) => p.id === item.productId);
      if (prod) {
        const before = prod.totalStock;
        prod.totalStock += item.quantity;
        prod.status = prod.totalStock <= prod.lowStockThreshold ? 'Low Stock' : 'In Stock';

        let whStock = prod.stockByWarehouse?.find((s) => s.warehouseId === r.warehouseId);
        if (whStock) {
          whStock.quantity += item.quantity;
        } else {
          prod.stockByWarehouse = prod.stockByWarehouse || [];
          prod.stockByWarehouse.push({
            warehouseId: r.warehouseId,
            warehouseName: r.warehouseName,
            warehouseCode: 'WH',
            quantity: item.quantity,
            updatedAt: new Date().toISOString(),
          });
        }

        state.ledger.unshift({
          id: Date.now() + Math.random(),
          productId: prod.id,
          productSku: prod.sku,
          productName: prod.name,
          warehouseId: r.warehouseId,
          warehouseName: r.warehouseName,
          warehouseCode: 'WH',
          transactionType: 'RECEIPT',
          referenceId: r.reference,
          quantityChange: item.quantity,
          quantityBefore: before,
          quantityAfter: prod.totalStock,
          createdAt: new Date().toISOString(),
        });
      }
    }

    saveState(state);
    return { receiptId: r.id, reference: r.reference, status: 'COMPLETED' };
  },

  // Deliveries
  async getDeliveries(): Promise<Delivery[]> {
    return loadState().deliveries;
  },

  async getDelivery(id: number): Promise<Delivery> {
    const d = loadState().deliveries.find((x) => x.id === id);
    if (!d) throw new Error('Delivery not found');
    return d;
  },

  async createDelivery(data: { customer: string; warehouseId: number; items: { productId: number; quantity: number }[] }): Promise<Delivery> {
    const state = loadState();
    const wh = state.warehouses.find((w) => w.id === data.warehouseId);
    const count = state.deliveries.length + 1;
    const ref = `DLV-${String(count).padStart(4, '0')}`;

    const items = data.items.map((it, idx) => {
      const prod = state.products.find((p) => p.id === it.productId);
      const whStock = prod?.stockByWarehouse?.find((s) => s.warehouseId === data.warehouseId)?.quantity || 0;
      return {
        id: Date.now() + idx,
        productId: it.productId,
        productSku: prod?.sku || 'SKU-UNKNOWN',
        productName: prod?.name || 'Unknown',
        unitOfMeasure: prod?.unitOfMeasure || 'units',
        quantity: it.quantity,
        availableStock: whStock,
      };
    });

    const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);

    const newD: Delivery = {
      id: Date.now(),
      reference: ref,
      customer: data.customer,
      warehouseId: data.warehouseId,
      warehouseName: wh?.name || 'Warehouse',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      totalItems: items.length,
      totalUnits,
      items,
    };

    state.deliveries.unshift(newD);
    saveState(state);
    return newD;
  },

  async validateDelivery(id: number): Promise<{ deliveryId: number; reference: string; status: string }> {
    const state = loadState();
    const d = state.deliveries.find((x) => x.id === id);
    if (!d) throw new Error('Delivery not found');
    if (d.status === 'COMPLETED') throw new Error('Delivery already dispatched');

    // Shortage check
    for (const item of d.items || []) {
      const prod = state.products.find((p) => p.id === item.productId);
      const whStock = prod?.stockByWarehouse?.find((s) => s.warehouseId === d.warehouseId)?.quantity || 0;
      if (item.quantity > whStock) {
        throw new Error(`Insufficient stock for "${prod?.name || 'Product'}". Available: ${whStock}, requested: ${item.quantity}`);
      }
    }

    d.status = 'COMPLETED';
    d.validatedAt = new Date().toISOString();

    for (const item of d.items || []) {
      const prod = state.products.find((p) => p.id === item.productId);
      if (prod) {
        const before = prod.totalStock;
        prod.totalStock -= item.quantity;
        prod.status = prod.totalStock === 0 ? 'Out of Stock' : prod.totalStock <= prod.lowStockThreshold ? 'Low Stock' : 'In Stock';

        const whStock = prod.stockByWarehouse?.find((s) => s.warehouseId === d.warehouseId);
        if (whStock) {
          whStock.quantity -= item.quantity;
        }

        state.ledger.unshift({
          id: Date.now() + Math.random(),
          productId: prod.id,
          productSku: prod.sku,
          productName: prod.name,
          warehouseId: d.warehouseId,
          warehouseName: d.warehouseName,
          warehouseCode: 'WH',
          transactionType: 'DELIVERY',
          referenceId: d.reference,
          quantityChange: -item.quantity,
          quantityBefore: before,
          quantityAfter: prod.totalStock,
          createdAt: new Date().toISOString(),
        });
      }
    }

    saveState(state);
    return { deliveryId: d.id, reference: d.reference, status: 'COMPLETED' };
  },

  // Transfers
  async getTransfers(): Promise<Transfer[]> {
    return loadState().transfers;
  },

  async getTransfer(id: number): Promise<Transfer> {
    const t = loadState().transfers.find((x) => x.id === id);
    if (!t) throw new Error('Transfer not found');
    return t;
  },

  async createTransfer(data: { fromWarehouseId: number; toWarehouseId: number; items: { productId: number; quantity: number }[] }): Promise<Transfer> {
    const state = loadState();
    const fromWh = state.warehouses.find((w) => w.id === data.fromWarehouseId);
    const toWh = state.warehouses.find((w) => w.id === data.toWarehouseId);
    const count = state.transfers.length + 1;
    const ref = `TRF-${String(count).padStart(4, '0')}`;

    const items = data.items.map((it, idx) => {
      const prod = state.products.find((p) => p.id === it.productId);
      const curStock = prod?.stockByWarehouse?.find((s) => s.warehouseId === data.fromWarehouseId)?.quantity || 0;
      return {
        id: Date.now() + idx,
        productId: it.productId,
        productSku: prod?.sku || 'SKU-UNKNOWN',
        productName: prod?.name || 'Unknown',
        unitOfMeasure: prod?.unitOfMeasure || 'units',
        quantity: it.quantity,
        fromWarehouseStock: curStock,
      };
    });

    const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);

    const newT: Transfer = {
      id: Date.now(),
      reference: ref,
      fromWarehouseId: data.fromWarehouseId,
      fromWarehouseName: fromWh?.name || 'Warehouse A',
      toWarehouseId: data.toWarehouseId,
      toWarehouseName: toWh?.name || 'Warehouse B',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      totalItems: items.length,
      totalUnits,
      items,
    };

    state.transfers.unshift(newT);
    saveState(state);
    return newT;
  },

  async validateTransfer(id: number): Promise<{ transferId: number; reference: string; status: string }> {
    const state = loadState();
    const t = state.transfers.find((x) => x.id === id);
    if (!t) throw new Error('Transfer not found');
    if (t.status === 'COMPLETED') throw new Error('Transfer already completed');

    for (const item of t.items || []) {
      const prod = state.products.find((p) => p.id === item.productId);
      const fromWhStock = prod?.stockByWarehouse?.find((s) => s.warehouseId === t.fromWarehouseId);
      if ((fromWhStock?.quantity || 0) < item.quantity) {
        throw new Error(`Insufficient stock in ${t.fromWarehouseName} for "${prod?.name}". Available: ${fromWhStock?.quantity || 0}`);
      }

      if (fromWhStock) fromWhStock.quantity -= item.quantity;
      let toWhStock = prod?.stockByWarehouse?.find((s) => s.warehouseId === t.toWarehouseId);
      if (toWhStock) {
        toWhStock.quantity += item.quantity;
      } else if (prod) {
        prod.stockByWarehouse = prod.stockByWarehouse || [];
        prod.stockByWarehouse.push({
          warehouseId: t.toWarehouseId,
          warehouseName: t.toWarehouseName,
          warehouseCode: 'WH',
          quantity: item.quantity,
          updatedAt: new Date().toISOString(),
        });
      }

      state.ledger.unshift({
        id: Date.now() + Math.random(),
        productId: item.productId,
        productSku: item.productSku,
        productName: item.productName,
        warehouseId: t.fromWarehouseId,
        warehouseName: t.fromWarehouseName,
        warehouseCode: 'WH',
        transactionType: 'TRANSFER_OUT',
        referenceId: t.reference,
        quantityChange: -item.quantity,
        quantityBefore: fromWhStock ? fromWhStock.quantity + item.quantity : 0,
        quantityAfter: fromWhStock ? fromWhStock.quantity : 0,
        createdAt: new Date().toISOString(),
      });
    }

    t.status = 'COMPLETED';
    t.validatedAt = new Date().toISOString();
    saveState(state);
    return { transferId: t.id, reference: t.reference, status: 'COMPLETED' };
  },

  // Adjustments
  async getAdjustments(): Promise<Adjustment[]> {
    return loadState().adjustments;
  },

  async getAdjustment(id: number): Promise<Adjustment> {
    const a = loadState().adjustments.find((x) => x.id === id);
    if (!a) throw new Error('Adjustment not found');
    return a;
  },

  async createAdjustment(data: { warehouseId: number; reason: string; items: { productId: number; quantityChange: number }[] }): Promise<Adjustment> {
    const state = loadState();
    const wh = state.warehouses.find((w) => w.id === data.warehouseId);
    const count = state.adjustments.length + 1;
    const ref = `ADJ-${String(count).padStart(4, '0')}`;

    const items = data.items.map((it, idx) => {
      const prod = state.products.find((p) => p.id === it.productId);
      const whStock = prod?.stockByWarehouse?.find((s) => s.warehouseId === data.warehouseId)?.quantity || 0;
      return {
        id: Date.now() + idx,
        productId: it.productId,
        productSku: prod?.sku || 'SKU-UNKNOWN',
        productName: prod?.name || 'Unknown',
        unitOfMeasure: prod?.unitOfMeasure || 'units',
        quantityChange: it.quantityChange,
        currentStock: whStock,
      };
    });

    const totalQuantityChange = items.reduce((sum, i) => sum + i.quantityChange, 0);

    const newA: Adjustment = {
      id: Date.now(),
      reference: ref,
      warehouseId: data.warehouseId,
      warehouseName: wh?.name || 'Warehouse',
      reason: data.reason,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      totalItems: items.length,
      totalQuantityChange,
      items,
    };

    state.adjustments.unshift(newA);
    saveState(state);
    return newA;
  },

  async validateAdjustment(id: number): Promise<{ adjustmentId: number; reference: string; status: string }> {
    const state = loadState();
    const a = state.adjustments.find((x) => x.id === id);
    if (!a) throw new Error('Adjustment not found');
    if (a.status === 'COMPLETED') throw new Error('Adjustment already completed');

    for (const item of a.items || []) {
      const prod = state.products.find((p) => p.id === item.productId);
      if (prod) {
        const before = prod.totalStock;
        const newTotal = before + item.quantityChange;
        if (newTotal < 0) throw new Error(`Stock cannot drop below 0 for "${prod.name}"`);

        prod.totalStock = newTotal;
        prod.status = prod.totalStock === 0 ? 'Out of Stock' : prod.totalStock <= prod.lowStockThreshold ? 'Low Stock' : 'In Stock';

        let whStock = prod.stockByWarehouse?.find((s) => s.warehouseId === a.warehouseId);
        if (whStock) {
          whStock.quantity += item.quantityChange;
        }

        state.ledger.unshift({
          id: Date.now() + Math.random(),
          productId: prod.id,
          productSku: prod.sku,
          productName: prod.name,
          warehouseId: a.warehouseId,
          warehouseName: a.warehouseName,
          warehouseCode: 'WH',
          transactionType: 'ADJUSTMENT',
          referenceId: a.reference,
          quantityChange: item.quantityChange,
          quantityBefore: before,
          quantityAfter: prod.totalStock,
          createdAt: new Date().toISOString(),
        });
      }
    }

    a.status = 'COMPLETED';
    a.validatedAt = new Date().toISOString();
    saveState(state);
    return { adjustmentId: a.id, reference: a.reference, status: 'COMPLETED' };
  },

  // Ledger
  async getLedger(params?: { productId?: number; warehouseId?: number; transactionType?: string; limit?: number }): Promise<StockLedgerEntry[]> {
    const state = loadState();
    let res = [...state.ledger];
    if (params?.productId) res = res.filter((l) => l.productId === params.productId);
    if (params?.warehouseId) res = res.filter((l) => l.warehouseId === params.warehouseId);
    if (params?.transactionType) res = res.filter((l) => l.transactionType === params.transactionType);
    if (params?.limit) res = res.slice(0, params.limit);
    return res;
  },

  // Dashboard
  async getDashboard(): Promise<DashboardData> {
    const state = loadState();
    const totalProducts = state.products.length;
    const lowStockCount = state.products.filter((p) => p.totalStock > 0 && p.totalStock <= p.lowStockThreshold).length;
    const outOfStockCount = state.products.filter((p) => p.totalStock === 0).length;
    const totalStockUnits = state.products.reduce((sum, p) => sum + p.totalStock, 0);

    const pendingReceipts = state.receipts.filter((r) => r.status === 'PENDING').length;
    const pendingDeliveries = state.deliveries.filter((d) => d.status === 'PENDING').length;
    const pendingTransfers = state.transfers.filter((t) => t.status === 'PENDING').length;
    const pendingAdjustments = state.adjustments.filter((a) => a.status === 'PENDING').length;

    const recentDocuments = [
      ...state.receipts.map((r) => ({
        type: 'RECEIPT',
        reference: r.reference,
        partner: r.supplier,
        warehouseName: r.warehouseName,
        status: r.status,
        createdAt: r.createdAt,
        totalUnits: r.totalUnits,
      })),
      ...state.deliveries.map((d) => ({
        type: 'DELIVERY',
        reference: d.reference,
        partner: d.customer,
        warehouseName: d.warehouseName,
        status: d.status,
        createdAt: d.createdAt,
        totalUnits: d.totalUnits,
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

    const categoriesMap = new Map<string, { productCount: number; totalUnits: number }>();
    for (const p of state.products) {
      const cur = categoriesMap.get(p.category) || { productCount: 0, totalUnits: 0 };
      cur.productCount++;
      cur.totalUnits += p.totalStock;
      categoriesMap.set(p.category, cur);
    }

    const stockByCategory = Array.from(categoriesMap.entries()).map(([category, val]) => ({
      category,
      productCount: val.productCount,
      totalUnits: val.totalUnits,
    }));

    const stockByWarehouse = state.warehouses.map((wh) => {
      let totalUnits = 0;
      let productCount = 0;
      for (const p of state.products) {
        const whStock = p.stockByWarehouse?.find((s) => s.warehouseId === wh.id)?.quantity || 0;
        if (whStock > 0) {
          productCount++;
          totalUnits += whStock;
        }
      }
      return {
        id: wh.id,
        name: wh.name,
        code: wh.code,
        totalUnits,
        productCount,
      };
    });

    return {
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
      recentLedger: state.ledger.slice(0, 10),
      stockByCategory,
      stockByWarehouse,
    };
  },

  // Auth
  async login(data: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const user: User = {
      id: 1,
      name: data.email.split('@')[0] || 'Demo Admin',
      email: data.email,
      createdAt: new Date().toISOString(),
    };
    return { user, token: 'mock-jwt-token-stocksense' };
  },

  async signup(data: { name: string; email: string; password: string }): Promise<{ user: User; token: string }> {
    const user: User = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      createdAt: new Date().toISOString(),
    };
    return { user, token: 'mock-jwt-token-stocksense' };
  },

  async forgotPassword(data: { email: string }): Promise<{ message: string; email: string; devOtp?: string }> {
    return { message: 'Password recovery OTP sent', email: data.email, devOtp: '849201' };
  },

  async verifyOtp(data: { email: string; otp: string }): Promise<{ valid: boolean; message: string }> {
    return { valid: true, message: 'OTP verified successfully' };
  },

  async resetPassword(data: { email: string; otp: string; newPassword: string }): Promise<{ message: string }> {
    return { message: 'Password updated successfully' };
  },
};
