# StockSense IMS — API Contract & Architecture Specification

## Overview
StockSense IMS is a high-performance, transactional warehouse inventory management system.
All state changes that mutate stock quantities are executed within **atomic SQLite transactions** and produce corresponding immutable **Stock Ledger entries**.

Base URL: `http://localhost:3000/api`

---

## 1. Response Envelope

All endpoints return standard JSON responses:

### Success Format:
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Format:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for product SKU-10231 (Thermal Label Roll) in warehouse Central Depot. Current: 10, Requested change: -20"
  }
}
```

HTTP Status Codes:
- `200 OK`: Request succeeded.
- `201 Created`: Resource created.
- `400 Bad Request`: Validation failure or business logic error (e.g., negative stock, already validated).
- `401 Unauthorized`: Authentication error or invalid credentials.
- `404 Not Found`: Product, warehouse, or document ID not found.
- `409 Conflict`: Unique constraint violation (e.g. duplicate SKU, warehouse code, or email).
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. Core Business Rules

1. **Atomic Transaction Rule**: Every stock mutation, ledger entry creation, and document status change occurs in a single immediate SQLite transaction. If any item fails, all changes are rolled back.
2. **Non-Negative Stock Rule**: Stock quantity for any `(product_id, warehouse_id)` can NEVER drop below `0`.
3. **Immutable Ledger Rule**: Stock quantity must NEVER be changed without creating a corresponding `stock_ledger` record (`RECEIPT`, `DELIVERY`, `TRANSFER_IN`, `TRANSFER_OUT`, `ADJUSTMENT`).
4. **Single Validation Rule**: A completed document cannot be re-validated (`ALREADY_VALIDATED` error).
5. **Distinct Warehouse Transfer Rule**: Transfers between identical source and destination warehouses are forbidden.
6. **Unique SKU & Codes**: Products must have unique SKUs; Warehouses must have unique Codes.

---

## 3. Product Endpoints

### `GET /api/products`
Retrieves products with aggregate stock level across all warehouses or filtered by warehouse.

**Query Parameters:**
- `search` *(string, optional)*: Case-insensitive search on name, SKU, or category.
- `category` *(string, optional)*: Filter by exact category.
- `warehouseId` *(number, optional)*: Filter stock calculation to a specific warehouse.
- `lowStock` *(string, optional)*: `'true'` for items $\le \text{threshold}$, `'out'` for $0$ quantity.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sku": "SKU-10231",
      "name": "Thermal Label Roll 4x6",
      "category": "Packaging",
      "unitOfMeasure": "roll",
      "lowStockThreshold": 15,
      "createdAt": "2026-09-26 09:00:00",
      "updatedAt": "2026-09-26 09:00:00",
      "totalStock": 140,
      "status": "In Stock"
    }
  ]
}
```

### `GET /api/products/:id`
Retrieves product details along with warehouse-level distribution breakdown.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sku": "SKU-10231",
    "name": "Thermal Label Roll 4x6",
    "category": "Packaging",
    "unitOfMeasure": "roll",
    "lowStockThreshold": 15,
    "totalStock": 140,
    "status": "In Stock",
    "stockByWarehouse": [
      {
        "warehouseId": 1,
        "warehouseName": "Central Depot",
        "warehouseCode": "WH-CD",
        "quantity": 100,
        "updatedAt": "2026-09-26 09:00:00"
      },
      {
        "warehouseId": 2,
        "warehouseName": "North Hub",
        "warehouseCode": "WH-NH",
        "quantity": 40,
        "updatedAt": "2026-09-26 09:00:00"
      }
    ]
  }
}
```

### `POST /api/products`
Creates a new product catalog entry.

**Request Body:**
```json
{
  "sku": "SKU-20001",
  "name": "USB-C Dock Station",
  "category": "Electronics",
  "unitOfMeasure": "pcs",
  "lowStockThreshold": 10
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "sku": "SKU-20001",
    "name": "USB-C Dock Station",
    "category": "Electronics",
    "unitOfMeasure": "pcs",
    "lowStockThreshold": 10,
    "createdAt": "2026-09-26 09:15:00",
    "totalStock": 0,
    "status": "Out of Stock"
  }
}
```

### `PUT /api/products/:id`
Updates product metadata.

### `DELETE /api/products/:id`
Deletes product if total stock is 0.

---

## 4. Warehouse Endpoints

### `GET /api/warehouses`
Lists all warehouses with current total inventory units and distinct product counts.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Central Depot",
      "code": "WH-CD",
      "location": "Building A, Industrial Sector 4",
      "createdAt": "2026-09-26 09:00:00",
      "totalStockUnits": 525,
      "totalDistinctProducts": 6
    }
  ]
}
```

### `POST /api/warehouses`
Creates a new warehouse.

**Request Body:**
```json
{
  "name": "East Coast Hub",
  "code": "WH-EC",
  "location": "400 Atlantic Ave, Bay 4"
}
```

---

## 5. Stock Query Endpoints

### `GET /api/stock`
Lists all stock records joined with Product and Warehouse data.

### `GET /api/stock/:productId`
Returns stock quantity of a product across all warehouses.

### `GET /api/stock/:productId/:warehouseId`
Returns stock quantity of a product in a specific warehouse.

---

## 6. Receipts (Inbound Operations)

### `GET /api/receipts`
Lists all inbound receipts with status, warehouse, and item summaries.

### `GET /api/receipts/:id`
Returns single receipt with detailed item breakdown.

### `POST /api/receipts`
Creates a new `PENDING` receipt. Reference number is auto-generated (`RCP-0001`).

**Request Body:**
```json
{
  "supplier": "Northwind Supplies",
  "warehouseId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 100
    }
  ]
}
```

### `POST /api/receipts/:id/validate`
Validates receipt:
- Verifies receipt exists and status is `PENDING`.
- Increments stock for each item in the destination warehouse.
- Creates `RECEIPT` ledger entries with `quantity_before` and `quantity_after`.
- Sets receipt status to `COMPLETED` and records `validated_at`.
- Transactionally committed.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "receiptId": 1,
    "reference": "RCP-0001",
    "status": "COMPLETED",
    "itemsCount": 1
  }
}
```

---

## 7. Deliveries (Outbound Operations)

### `GET /api/deliveries`
Lists all delivery orders.

### `GET /api/deliveries/:id`
Returns single delivery order with item list and available warehouse stock.

### `POST /api/deliveries`
Creates a new `PENDING` delivery. Reference number is auto-generated (`DLV-0001`).

**Request Body:**
```json
{
  "customer": "Bright Retail Co.",
  "warehouseId": 1,
  "items": [
    {
      "productId": 2,
      "quantity": 10
    }
  ]
}
```

### `POST /api/deliveries/:id/validate`
Validates delivery:
- Verifies stock availability ($\text{stock} \ge \text{quantity}$).
- If insufficient, throws `INSUFFICIENT_STOCK` error and rolls back without modifying status or ledger.
- If sufficient, decreases stock, logs `DELIVERY` ledger entry, sets status to `COMPLETED`.

---

## 8. Internal Transfers

### `GET /api/transfers`
Lists all internal transfer orders.

### `POST /api/transfers`
Creates a new `PENDING` transfer (`TRF-0001`).

**Request Body:**
```json
{
  "fromWarehouseId": 1,
  "toWarehouseId": 2,
  "items": [
    {
      "productId": 1,
      "quantity": 20
    }
  ]
}
```

### `POST /api/transfers/:id/validate`
Validates transfer:
- Verifies source warehouse has $\ge 20$ units.
- Deducts 20 from source (`TRANSFER_OUT` ledger entry).
- Adds 20 to destination (`TRANSFER_IN` ledger entry).
- Sets status to `COMPLETED`.

---

## 9. Stock Adjustments

### `GET /api/adjustments`
Lists all adjustments.

### `POST /api/adjustments`
Creates a new `PENDING` adjustment (`ADJ-0001`).

**Request Body:**
```json
{
  "warehouseId": 1,
  "reason": "Damage write-off during transit",
  "items": [
    {
      "productId": 6,
      "quantityChange": -5
    }
  ]
}
```

### `POST /api/adjustments/:id/validate`
Validates adjustment:
- Mutates stock by `quantityChange` (positive or negative).
- Verifies new stock $\ge 0$.
- Logs `ADJUSTMENT` ledger entry.
- Sets status to `COMPLETED`.

---

## 10. Stock Ledger

### `GET /api/ledger`
Returns complete immutable audit trail of all warehouse transactions, newest first.

**Query Parameters:**
- `productId` *(number, optional)*
- `warehouseId` *(number, optional)*
- `transactionType` *(string, optional: RECEIPT, DELIVERY, TRANSFER_IN, TRANSFER_OUT, ADJUSTMENT)*
- `startDate` *(ISO timestamp, optional)*
- `endDate` *(ISO timestamp, optional)*
- `limit` *(number, optional, default: all)*
- `offset` *(number, optional)*

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 14,
      "productId": 6,
      "productSku": "SKU-10712",
      "productName": "Pallet Wrap Heavy",
      "warehouseId": 1,
      "warehouseName": "Central Depot",
      "warehouseCode": "WH-CD",
      "transactionType": "ADJUSTMENT",
      "referenceId": "ADJ-0001",
      "quantityChange": -5,
      "quantityBefore": 85,
      "quantityAfter": 80,
      "createdAt": "2026-09-26 09:10:00"
    }
  ]
}
```

---

## 11. Live Dashboard Analytics

### `GET /api/dashboard`
Returns live calculated KPIs and operational summaries directly aggregated from the database.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "totalProducts": 6,
      "lowStockCount": 1,
      "outOfStockCount": 0,
      "totalStockUnits": 665,
      "pendingReceipts": 1,
      "pendingDeliveries": 1,
      "pendingTransfers": 1,
      "pendingAdjustments": 1
    },
    "recentDocuments": [ ... ],
    "recentLedger": [ ... ],
    "stockByCategory": [ ... ],
    "stockByWarehouse": [ ... ]
  }
}
```

---

## 12. Authentication

### `POST /api/auth/login`
```json
{
  "email": "admin@stocksense.io",
  "password": "password123"
}
```

### `POST /api/auth/signup`
```json
{
  "name": "Jane Operator",
  "email": "jane@stocksense.io",
  "password": "securepassword123"
}
```

### `POST /api/auth/forgot-password`
Generates a 6-digit OTP code for password reset.

### `POST /api/auth/verify-otp`
Verifies OTP code.

### `POST /api/auth/reset-password`
```json
{
  "email": "admin@stocksense.io",
  "otp": "123456",
  "newPassword": "newPassword456"
}
```
