# StockSense IMS — Warehouse & Inventory Management System

StockSense IMS is a fullstack warehouse inventory management system built with React, TypeScript, Express, and transactional SQLite.

## ✨ Features
- **Product & Stock Management**: Real-time multi-warehouse catalog with low-stock alerts.
- **Transactional Stock Engine**: Non-negative stock enforcement with atomic rollback guarantees.
- **Immutable Stock Ledger**: 100% append-only audit trail logging every receipt, delivery, transfer, and adjustment.
- **Operational Workflows**:
  - **Inbound Receipts** (`RCP-XXXX`): Goods intake & stock increments.
  - **Outbound Deliveries** (`DLV-XXXX`): Order fulfillment with stock sufficiency checks.
  - **Internal Transfers** (`TRF-XXXX`): Inter-warehouse movement (`TRANSFER_OUT` & `TRANSFER_IN`).
  - **Stock Adjustments** (`ADJ-XXXX`): Reconciliation & damage write-offs.
- **Dynamic KPI Dashboard**: Real-time aggregated metrics, warehouse distribution, and category breakdowns.
- **Authentication**: User management with `scrypt` password hashing and OTP verification.

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Seed Initial Database
```bash
npm run db:seed
```

### Run Fullstack Application
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
npm start
```

## 📖 API Documentation
Detailed API endpoints, schemas, and business rules are documented in [`docs/API.md`](./docs/API.md).
