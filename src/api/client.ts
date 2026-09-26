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
import { mockStore } from './mockStore';

const API_BASE = '/api';

// Tracks whether the backend server is active
let serverAvailable: boolean | null = null;

async function fetchJson<T>(url: string, options?: RequestInit, fallbackFn?: () => Promise<T>): Promise<T> {
  // If we already know the server is not available (e.g. on static hosting like Vercel/Netlify),
  // immediately use the fallback function if provided
  if (serverAvailable === false && fallbackFn) {
    return await fallbackFn();
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    // If server responded with 404 or not found, or non-JSON, fallback
    if (response.status === 404 || !response.headers.get('content-type')?.includes('application/json')) {
      if (serverAvailable === null) serverAvailable = false;
      if (fallbackFn) return await fallbackFn();
    }

    const json = await response.json();
    if (!response.ok || !json.success) {
      const message = json.error?.message || `Request failed with status ${response.status}`;
      const code = json.error?.code || 'UNKNOWN_ERROR';
      const error: any = new Error(message);
      error.code = code;
      error.status = response.status;
      throw error;
    }

    serverAvailable = true;
    return json.data;
  } catch (err: any) {
    // If it's a validation error or business logic error from the actual server, throw it!
    if (err.status && err.status !== 404 && err.status !== 502 && err.status !== 503) {
      throw err;
    }

    // Network error or 404: backend is not reachable (static hosting)
    serverAvailable = false;
    if (fallbackFn) {
      return await fallbackFn();
    }
    throw err;
  }
}

export const api = {
  get isServerAvailable(): boolean | null {
    return serverAvailable;
  },

  // Products
  getProducts: (params?: { search?: string; category?: string; warehouseId?: number; lowStock?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.warehouseId) searchParams.set('warehouseId', String(params.warehouseId));
    if (params?.lowStock) searchParams.set('lowStock', params.lowStock);
    const qs = searchParams.toString();
    return fetchJson<Product[]>(
      `/products${qs ? `?${qs}` : ''}`,
      undefined,
      () => mockStore.getProducts(params)
    );
  },

  getProduct: (id: number) => 
    fetchJson<Product>(`/products/${id}`, undefined, () => mockStore.getProduct(id)),

  createProduct: (data: { sku: string; name: string; category: string; unitOfMeasure: string; lowStockThreshold: number }) =>
    fetchJson<Product>('/products', { method: 'POST', body: JSON.stringify(data) }, () => mockStore.createProduct(data)),

  updateProduct: (id: number, data: Partial<{ sku: string; name: string; category: string; unitOfMeasure: string; lowStockThreshold: number }>) =>
    fetchJson<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }, () => mockStore.updateProduct(id, data)),

  deleteProduct: (id: number) => 
    fetchJson<{ id: number; message: string }>(`/products/${id}`, { method: 'DELETE' }, () => mockStore.deleteProduct(id)),

  // Warehouses
  getWarehouses: () => 
    fetchJson<Warehouse[]>('/warehouses', undefined, () => mockStore.getWarehouses()),
  
  createWarehouse: (data: { name: string; code: string; location?: string }) =>
    fetchJson<Warehouse>('/warehouses', { method: 'POST', body: JSON.stringify(data) }, () => mockStore.createWarehouse(data)),

  // Receipts
  getReceipts: () => 
    fetchJson<Receipt[]>('/receipts', undefined, () => mockStore.getReceipts()),
  
  getReceipt: (id: number) => 
    fetchJson<Receipt>(`/receipts/${id}`, undefined, () => mockStore.getReceipt(id)),
  
  createReceipt: (data: { supplier: string; warehouseId: number; items: { productId: number; quantity: number }[] }) =>
    fetchJson<Receipt>('/receipts', { method: 'POST', body: JSON.stringify(data) }, () => mockStore.createReceipt(data)),
  
  validateReceipt: (id: number) => 
    fetchJson<{ receiptId: number; reference: string; status: string }>(`/receipts/${id}/validate`, { method: 'POST' }, () => mockStore.validateReceipt(id)),

  // Deliveries
  getDeliveries: () => 
    fetchJson<Delivery[]>('/deliveries', undefined, () => mockStore.getDeliveries()),
  
  getDelivery: (id: number) => 
    fetchJson<Delivery>(`/deliveries/${id}`, undefined, () => mockStore.getDelivery(id)),
  
  createDelivery: (data: { customer: string; warehouseId: number; items: { productId: number; quantity: number }[] }) =>
    fetchJson<Delivery>('/deliveries', { method: 'POST', body: JSON.stringify(data) }, () => mockStore.createDelivery(data)),
  
  validateDelivery: (id: number) => 
    fetchJson<{ deliveryId: number; reference: string; status: string }>(`/deliveries/${id}/validate`, { method: 'POST' }, () => mockStore.validateDelivery(id)),

  // Transfers
  getTransfers: () => 
    fetchJson<Transfer[]>('/transfers', undefined, () => mockStore.getTransfers()),
  
  getTransfer: (id: number) => 
    fetchJson<Transfer>(`/transfers/${id}`, undefined, () => mockStore.getTransfer(id)),
  
  createTransfer: (data: { fromWarehouseId: number; toWarehouseId: number; items: { productId: number; quantity: number }[] }) =>
    fetchJson<Transfer>('/transfers', { method: 'POST', body: JSON.stringify(data) }, () => mockStore.createTransfer(data)),
  
  validateTransfer: (id: number) => 
    fetchJson<{ transferId: number; reference: string; status: string }>(`/transfers/${id}/validate`, { method: 'POST' }, () => mockStore.validateTransfer(id)),

  // Adjustments
  getAdjustments: () => 
    fetchJson<Adjustment[]>('/adjustments', undefined, () => mockStore.getAdjustments()),
  
  getAdjustment: (id: number) => 
    fetchJson<Adjustment>(`/adjustments/${id}`, undefined, () => mockStore.getAdjustment(id)),
  
  createAdjustment: (data: { warehouseId: number; reason: string; items: { productId: number; quantityChange: number }[] }) =>
    fetchJson<Adjustment>('/adjustments', { method: 'POST', body: JSON.stringify(data) }, () => mockStore.createAdjustment(data)),
  
  validateAdjustment: (id: number) => 
    fetchJson<{ adjustmentId: number; reference: string; status: string }>(`/adjustments/${id}/validate`, { method: 'POST' }, () => mockStore.validateAdjustment(id)),

  // Ledger
  getLedger: (params?: { productId?: number; warehouseId?: number; transactionType?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.productId) searchParams.set('productId', String(params.productId));
    if (params?.warehouseId) searchParams.set('warehouseId', String(params.warehouseId));
    if (params?.transactionType) searchParams.set('transactionType', params.transactionType);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return fetchJson<StockLedgerEntry[]>(
      `/ledger${qs ? `?${qs}` : ''}`,
      undefined,
      () => mockStore.getLedger(params)
    );
  },

  // Dashboard
  getDashboard: () => 
    fetchJson<DashboardData>('/dashboard', undefined, () => mockStore.getDashboard()),

  // Auth
  login: (data: { email: string; password: string }) => 
    fetchJson<{ user: User; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }, () => mockStore.login(data)),
  
  signup: (data: { name: string; email: string; password: string }) => 
    fetchJson<{ user: User; token: string }>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }, () => mockStore.signup(data)),
  
  forgotPassword: (data: { email: string }) => 
    fetchJson<{ message: string; email: string; devOtp?: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }, () => mockStore.forgotPassword(data)),
  
  verifyOtp: (data: { email: string; otp: string }) => 
    fetchJson<{ valid: boolean; message: string }>('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }, () => mockStore.verifyOtp(data)),
  
  resetPassword: (data: { email: string; otp: string; newPassword: string }) => 
    fetchJson<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }, () => mockStore.resetPassword(data)),
};
