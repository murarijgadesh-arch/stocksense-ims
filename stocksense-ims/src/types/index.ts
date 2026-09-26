export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  location?: string;
  createdAt: string;
  totalStockUnits?: number;
  totalDistinctProducts?: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  unitOfMeasure: string;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
  totalStock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stockByWarehouse?: Array<{
    warehouseId: number;
    warehouseName: string;
    warehouseCode: string;
    quantity: number;
    updatedAt: string;
  }>;
}

export interface ReceiptItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  unitOfMeasure: string;
  quantity: number;
}

export interface Receipt {
  id: number;
  reference: string;
  supplier: string;
  warehouseId: number;
  warehouseName: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  validatedAt?: string;
  totalItems: number;
  totalUnits: number;
  items?: ReceiptItem[];
}

export interface DeliveryItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  unitOfMeasure: string;
  quantity: number;
  availableStock?: number;
}

export interface Delivery {
  id: number;
  reference: string;
  customer: string;
  warehouseId: number;
  warehouseName: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  validatedAt?: string;
  totalItems: number;
  totalUnits: number;
  items?: DeliveryItem[];
}

export interface TransferItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  unitOfMeasure: string;
  quantity: number;
  fromWarehouseStock?: number;
}

export interface Transfer {
  id: number;
  reference: string;
  fromWarehouseId: number;
  fromWarehouseName: string;
  toWarehouseId: number;
  toWarehouseName: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  validatedAt?: string;
  totalItems: number;
  totalUnits: number;
  items?: TransferItem[];
}

export interface AdjustmentItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  unitOfMeasure: string;
  quantityChange: number;
  currentStock?: number;
}

export interface Adjustment {
  id: number;
  reference: string;
  warehouseId: number;
  warehouseName: string;
  reason: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  validatedAt?: string;
  totalItems: number;
  totalQuantityChange: number;
  items?: AdjustmentItem[];
}

export interface StockLedgerEntry {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  transactionType: 'RECEIPT' | 'DELIVERY' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT';
  referenceId: string;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  createdAt: string;
}

export interface DashboardData {
  kpis: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalStockUnits: number;
    pendingReceipts: number;
    pendingDeliveries: number;
    pendingTransfers: number;
    pendingAdjustments: number;
  };
  recentDocuments: Array<{
    type: string;
    reference: string;
    partner: string;
    warehouseName: string;
    status: string;
    createdAt: string;
    totalUnits: number;
  }>;
  recentLedger: StockLedgerEntry[];
  stockByCategory: Array<{
    category: string;
    productCount: number;
    totalUnits: number;
  }>;
  stockByWarehouse: Array<{
    id: number;
    name: string;
    code: string;
    totalUnits: number;
    productCount: number;
  }>;
}
