const STORAGE_KEYS = {
  products: 'stocksense_products',
  stock: 'stocksense_stock',
  receipts: 'stocksense_receipts',
  deliveries: 'stocksense_deliveries',
  ledger: 'stocksense_ledger',
};

const DEFAULT_PRODUCTS = [
  { id: 'steel-rod', name: 'Steel Rod', sku: 'ST-001' },
  { id: 'steel-sheet', name: 'Steel Sheet', sku: 'ST-002' },
];

const DEFAULT_STOCK = {
  'steel-rod': 0,
  'steel-sheet': 0,
};

const ensureLocalStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

const toProductId = (value = '') => {
  const normalized = String(value).trim().toLowerCase();

  if (!normalized) {
    return 'product';
  }

  return normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'product';
};

const buildId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const deepClone = (value) => JSON.parse(JSON.stringify(value));

export const readState = () => {
  const storage = ensureLocalStorage();

  if (!storage) {
    return {
      products: deepClone(DEFAULT_PRODUCTS),
      stock: deepClone(DEFAULT_STOCK),
      receipts: [],
      deliveries: [],
      ledger: [],
    };
  }

  try {
    const products = JSON.parse(storage.getItem(STORAGE_KEYS.products) || 'null');
    const stock = JSON.parse(storage.getItem(STORAGE_KEYS.stock) || 'null');
    const receipts = JSON.parse(storage.getItem(STORAGE_KEYS.receipts) || 'null');
    const deliveries = JSON.parse(storage.getItem(STORAGE_KEYS.deliveries) || 'null');
    const ledger = JSON.parse(storage.getItem(STORAGE_KEYS.ledger) || 'null');

    return {
      products: Array.isArray(products) && products.length ? products : deepClone(DEFAULT_PRODUCTS),
      stock: stock && typeof stock === 'object' ? stock : deepClone(DEFAULT_STOCK),
      receipts: Array.isArray(receipts) ? receipts : [],
      deliveries: Array.isArray(deliveries) ? deliveries : [],
      ledger: Array.isArray(ledger) ? ledger : [],
    };
  } catch (error) {
    console.error('Unable to read inventory state:', error);
    return {
      products: deepClone(DEFAULT_PRODUCTS),
      stock: deepClone(DEFAULT_STOCK),
      receipts: [],
      deliveries: [],
      ledger: [],
    };
  }
};

export const writeState = (state) => {
  const storage = ensureLocalStorage();

  if (!storage) {
    return state;
  }

  const normalizedState = {
    products: Array.isArray(state.products) ? state.products : deepClone(DEFAULT_PRODUCTS),
    stock: state.stock && typeof state.stock === 'object' ? state.stock : deepClone(DEFAULT_STOCK),
    receipts: Array.isArray(state.receipts) ? state.receipts : [],
    deliveries: Array.isArray(state.deliveries) ? state.deliveries : [],
    ledger: Array.isArray(state.ledger) ? state.ledger : [],
  };

  storage.setItem(STORAGE_KEYS.products, JSON.stringify(normalizedState.products));
  storage.setItem(STORAGE_KEYS.stock, JSON.stringify(normalizedState.stock));
  storage.setItem(STORAGE_KEYS.receipts, JSON.stringify(normalizedState.receipts));
  storage.setItem(STORAGE_KEYS.deliveries, JSON.stringify(normalizedState.deliveries));
  storage.setItem(STORAGE_KEYS.ledger, JSON.stringify(normalizedState.ledger));

  return normalizedState;
};

export const ensureSeedState = () => {
  const currentState = readState();

  if (!currentState.products.length) {
    currentState.products = deepClone(DEFAULT_PRODUCTS);
  }

  if (!currentState.stock || !Object.keys(currentState.stock).length) {
    currentState.stock = deepClone(DEFAULT_STOCK);
  }

  return writeState(currentState);
};

export const buildReceiptReference = (state) => {
  const nextNumber = (state.receipts || []).filter((document) => String(document.reference || '').startsWith('WH/IN/')).length + 1;
  return `WH/IN/${String(nextNumber).padStart(4, '0')}`;
};

export const buildDeliveryReference = (state) => {
  const nextNumber = (state.deliveries || []).filter((document) => String(document.reference || '').startsWith('WH/OUT/')).length + 1;
  return `WH/OUT/${String(nextNumber).padStart(4, '0')}`;
};

export const createEmptyReceipt = (state) => ({
  id: buildId(),
  reference: buildReceiptReference(state),
  supplier: '',
  destination: '',
  responsible: '',
  scheduledDate: new Date().toISOString().slice(0, 10),
  status: 'Draft',
  items: [{ id: buildId(), productName: '', quantity: 1 }],
});

export const createEmptyDelivery = (state) => ({
  id: buildId(),
  reference: buildDeliveryReference(state),
  customer: '',
  source: '',
  responsible: '',
  scheduledDate: new Date().toISOString().slice(0, 10),
  status: 'Draft',
  items: [{ id: buildId(), productName: '', quantity: 1 }],
});

const upsertProduct = (state, productName) => {
  const cleanedName = String(productName || '').trim();

  if (!cleanedName) {
    return { state, product: null };
  }

  const normalizedId = toProductId(cleanedName);
  const existingProduct = state.products.find((product) => product.id === normalizedId || product.name.toLowerCase() === cleanedName.toLowerCase());

  if (existingProduct) {
    return { state, product: existingProduct };
  }

  const nextProducts = [...state.products, { id: normalizedId, name: cleanedName, sku: normalizedId.toUpperCase() }];
  return {
    state: { ...state, products: nextProducts },
    product: nextProducts[nextProducts.length - 1],
  };
};

const normalizeItems = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item && (item.productName || item.productId))
    .map((item) => ({
      id: item.id || buildId(),
      productName: String(item.productName || item.productId || '').trim(),
      productId: item.productId || toProductId(item.productName || item.productId || ''),
      quantity: Number(item.quantity || 0),
    }));
};

export const saveReceipt = (state, payload) => {
  const nextState = { ...state, receipts: [...(state.receipts || [])] };
  const receiptItems = normalizeItems(payload.items);

  if (!receiptItems.length) {
    return { ok: false, message: 'Receipt cannot be saved without at least one product.', state: nextState };
  }

  const draft = {
    id: payload.id || buildId(),
    reference: payload.reference || buildReceiptReference(nextState),
    supplier: payload.supplier || '',
    destination: payload.destination || '',
    responsible: payload.responsible || '',
    scheduledDate: payload.scheduledDate || new Date().toISOString().slice(0, 10),
    status: payload.status || 'Draft',
    items: receiptItems,
    createdAt: payload.createdAt || new Date().toISOString(),
  };

  const existingIndex = nextState.receipts.findIndex((record) => record.id === draft.id);

  if (existingIndex >= 0) {
    nextState.receipts[existingIndex] = draft;
  } else {
    nextState.receipts.push(draft);
  }

  return { ok: true, message: 'Receipt saved successfully.', state: writeState(nextState) };
};

export const saveDelivery = (state, payload) => {
  const nextState = { ...state, deliveries: [...(state.deliveries || [])] };
  const deliveryItems = normalizeItems(payload.items);

  if (!deliveryItems.length) {
    return { ok: false, message: 'Delivery cannot be saved without at least one product.', state: nextState };
  }

  const draft = {
    id: payload.id || buildId(),
    reference: payload.reference || buildDeliveryReference(nextState),
    customer: payload.customer || '',
    source: payload.source || '',
    responsible: payload.responsible || '',
    scheduledDate: payload.scheduledDate || new Date().toISOString().slice(0, 10),
    status: payload.status || 'Draft',
    items: deliveryItems,
    createdAt: payload.createdAt || new Date().toISOString(),
  };

  const existingIndex = nextState.deliveries.findIndex((record) => record.id === draft.id);

  if (existingIndex >= 0) {
    nextState.deliveries[existingIndex] = draft;
  } else {
    nextState.deliveries.push(draft);
  }

  return { ok: true, message: 'Delivery saved successfully.', state: writeState(nextState) };
};

export const applyReceiptValidation = (state, receiptId) => {
  const receipt = (state.receipts || []).find((record) => record.id === receiptId);

  if (!receipt) {
    return { ok: false, message: 'Receipt not found.', state };
  }

  if (receipt.status === 'Done') {
    return { ok: false, message: 'Receipt already validated. Duplicate validation is not allowed.', state };
  }

  if (!Array.isArray(receipt.items) || !receipt.items.length) {
    return { ok: false, message: 'Receipt cannot be validated without products.', state };
  }

  const invalidItem = receipt.items.find((item) => !item.productName || Number(item.quantity) <= 0);

  if (invalidItem) {
    return {
      ok: false,
      message: `Invalid quantity for ${invalidItem.productName || 'selected product'}. Quantity must be greater than 0.`,
      state,
    };
  }

  let nextState = {
    ...state,
    receipts: state.receipts.map((record) => (record.id === receiptId ? { ...record, status: 'Done', validatedAt: new Date().toISOString() } : record)),
    stock: { ...(state.stock || {}) },
    ledger: [...(state.ledger || [])],
    products: [...(state.products || [])],
  };

  let stockIncreaseTotal = 0;

  for (const item of receipt.items) {
    const productName = String(item.productName || '').trim();
    const productId = toProductId(productName);
    const currentStock = Number(nextState.stock[productId] || 0);
    const quantity = Number(item.quantity || 0);

    const productResult = upsertProduct(nextState, productName);
    nextState = productResult.state;

    nextState.stock[productId] = currentStock + quantity;
    stockIncreaseTotal += quantity;

    nextState.ledger.push({
      id: buildId(),
      reference: receipt.reference,
      type: 'RECEIPT',
      productId,
      productName: productName || productId,
      quantity,
      from: receipt.supplier || 'Supplier',
      to: receipt.destination || 'Warehouse',
      date: receipt.scheduledDate || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    });
  }

  nextState = writeState(nextState);

  return {
    ok: true,
    message: `Receipt validated successfully. Stock increased by ${stockIncreaseTotal} units.`,
    state: nextState,
  };
};

export const applyDeliveryValidation = (state, deliveryId) => {
  const delivery = (state.deliveries || []).find((record) => record.id === deliveryId);

  if (!delivery) {
    return { ok: false, message: 'Delivery not found.', state };
  }

  if (delivery.status === 'Done') {
    return { ok: false, message: 'Delivery already validated. Duplicate validation is not allowed.', state };
  }

  if (!Array.isArray(delivery.items) || !delivery.items.length) {
    return { ok: false, message: 'Delivery cannot be validated without products.', state };
  }

  const invalidItem = delivery.items.find((item) => !item.productName || Number(item.quantity) <= 0);

  if (invalidItem) {
    return {
      ok: false,
      message: `Invalid quantity for ${invalidItem.productName || 'selected product'}. Quantity must be greater than 0.`,
      state,
    };
  }

  const stockSnapshot = { ...(state.stock || {}) };
  const shortage = [];

  for (const item of delivery.items) {
    const productName = String(item.productName || '').trim();
    const productId = toProductId(productName);
    const available = Number(stockSnapshot[productId] || 0);
    const requested = Number(item.quantity || 0);

    if (requested > available) {
      shortage.push({ productName, available, requested });
    }
  }

  if (shortage.length) {
    const item = shortage[0];
    return {
      ok: false,
      message: `Delivery cannot be validated. Available stock: ${item.available}, requested: ${item.requested}.`,
      state,
    };
  }

  let nextState = {
    ...state,
    deliveries: state.deliveries.map((record) => (record.id === deliveryId ? { ...record, status: 'Done', validatedAt: new Date().toISOString() } : record)),
    stock: { ...(state.stock || {}) },
    ledger: [...(state.ledger || [])],
    products: [...(state.products || [])],
  };

  let stockDecreaseTotal = 0;

  for (const item of delivery.items) {
    const productName = String(item.productName || '').trim();
    const productId = toProductId(productName);
    const currentStock = Number(nextState.stock[productId] || 0);
    const quantity = Number(item.quantity || 0);

    const productResult = upsertProduct(nextState, productName);
    nextState = productResult.state;

    nextState.stock[productId] = currentStock - quantity;
    stockDecreaseTotal += quantity;

    nextState.ledger.push({
      id: buildId(),
      reference: delivery.reference,
      type: 'DELIVERY',
      productId,
      productName: productName || productId,
      quantity,
      from: delivery.source || 'Warehouse',
      to: delivery.customer || 'Customer',
      date: delivery.scheduledDate || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    });
  }

  nextState = writeState(nextState);

  return {
    ok: true,
    message: `Delivery validated successfully. Stock decreased by ${stockDecreaseTotal} units.`,
    state: nextState,
  };
};

export const getLedgerByReference = (state, reference) => {
  return (state.ledger || []).filter((entry) => entry.reference === reference);
};
