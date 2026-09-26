import { 
  Product, 
  Warehouse, 
  Receipt, 
  Delivery, 
  Transfer, 
  Adjustment, 
  StockLedgerEntry, 
  DashboardData,
  User 
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    const message = json.error?.message || `Request failed with status ${response.status}`;
    const code = json.error?.code || 'UNKNOWN_ERROR';
    const error: any = new Error(message);
    error.code = code;
    error.status = response.status;
    throw error;
  }

  return json.data;
}

export const api = {
  // Products
  getProducts: (params?: { search?: string; category?: string; warehouseId?: number; lowStock?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.warehouseId) searchParams.set('warehouseId', String(params.warehouseId));
    if (params?.lowStock) searchParams.set('lowStock', params.lowStock);
    const qs = searchParams.toString();
    return fetchJson<Product[]>(`/products${qs ? `?${qs}` : ''}`);
  },

  getProduct: (id: number) => fetchJson<Product>(`/products/${id}`),

  createProduct: (data: { sku: string; name: string; category: string; unitOfMeasure: string; lowStockThreshold: number }) =>
    fetchJson<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),

  updateProduct: (id: number, data: Partial<{ sku: string; name: string; category: string; unitOfMeasure: string; lowStockThreshold: number }>) =>
    fetchJson<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteProduct: (id: number) => fetchJson<{ id: number; message: string }>(`/products/${id}`, { method: 'DELETE' }),

  // Warehouses
  getWarehouses: () => fetchJson<Warehouse[]>('/warehouses'),
  createWarehouse: (data: { name: string; code: string; location?: string }) =>
    fetchJson<Warehouse>('/warehouses', { method: 'POST', body: JSON.stringify(data) }),

  // Receipts
  getReceipts: () => fetchJson<Receipt[]>('/receipts'),
  getReceipt: (id: number) => fetchJson<Receipt>(`/receipts/${id}`),
  createReceipt: (data: { supplier: string; warehouseId: number; items: { productId: number; quantity: number }[] }) =>
    fetchJson<Receipt>('/receipts', { method: 'POST', body: JSON.stringify(data) }),
  validateReceipt: (id: number) => fetchJson<{ receiptId: number; reference: string; status: string }>(`/receipts/${id}/validate`, { method: 'POST' }),

  // Deliveries
  getDeliveries: () => fetchJson<Delivery[]>('/deliveries'),
  getDelivery: (id: number) => fetchJson<Delivery>(`/deliveries/${id}`),
  createDelivery: (data: { customer: string; warehouseId: number; items: { productId: number; quantity: number }[] }) =>
    fetchJson<Delivery>('/deliveries', { method: 'POST', body: JSON.stringify(data) }),
  validateDelivery: (id: number) => fetchJson<{ deliveryId: number; reference: string; status: string }>(`/deliveries/${id}/validate`, { method: 'POST' }),

  // Transfers
  getTransfers: () => fetchJson<Transfer[]>('/transfers'),
  getTransfer: (id: number) => fetchJson<Transfer>(`/transfers/${id}`),
  createTransfer: (data: { fromWarehouseId: number; toWarehouseId: number; items: { productId: number; quantity: number }[] }) =>
    fetchJson<Transfer>('/transfers', { method: 'POST', body: JSON.stringify(data) }),
  validateTransfer: (id: number) => fetchJson<{ transferId: number; reference: string; status: string }>(`/transfers/${id}/validate`, { method: 'POST' }),

  // Adjustments
  getAdjustments: () => fetchJson<Adjustment[]>('/adjustments'),
  getAdjustment: (id: number) => fetchJson<Adjustment>(`/adjustments/${id}`),
  createAdjustment: (data: { warehouseId: number; reason: string; items: { productId: number; quantityChange: number }[] }) =>
    fetchJson<Adjustment>('/adjustments', { method: 'POST', body: JSON.stringify(data) }),
  validateAdjustment: (id: number) => fetchJson<{ adjustmentId: number; reference: string; status: string }>(`/adjustments/${id}/validate`, { method: 'POST' }),

  // Ledger
  getLedger: (params?: { productId?: number; warehouseId?: number; transactionType?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.productId) searchParams.set('productId', String(params.productId));
    if (params?.warehouseId) searchParams.set('warehouseId', String(params.warehouseId));
    if (params?.transactionType) searchParams.set('transactionType', params.transactionType);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return fetchJson<StockLedgerEntry[]>(`/ledger${qs ? `?${qs}` : ''}`);
  },

  // Dashboard
  getDashboard: () => fetchJson<DashboardData>('/dashboard'),

  // Auth
  login: (data: { email: string; password: string }) => fetchJson<{ user: User; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  signup: (data: { name: string; email: string; password: string }) => fetchJson<{ user: User; token: string }>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data: { email: string }) => fetchJson<{ message: string; email: string; devOtp?: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  verifyOtp: (data: { email: string; otp: string }) => fetchJson<{ valid: boolean; message: string }>('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) => fetchJson<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
};
