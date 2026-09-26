# 📦 StockSense IMS — Warehouse & Inventory Management System

> **Enterprise-grade, real-time multi-warehouse inventory management system.**  
> Built for the **Odoo Hackathon GCET 2026**. Powered by **React 18**, **TypeScript**, **Express**, and **transactional SQLite** with dual-mode deployment support.

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/new)
[![Netlify Deployment](https://img.shields.io/badge/Deploy-Netlify-00C7B7?logo=netlify)](https://app.netlify.com/start)
[![Render Deployment](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)](https://render.com)
[![React 18](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Backend-Express_4-000000?logo=express)](https://expressjs.com)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite)](https://www.sqlite.org)

---

## ✨ Features & Odoo Architecture Parity

- **Double-Entry Ledger Integrity**: Every receipt, delivery, transfer, and adjustment writes an immutable, append-only ledger record tracking origin, destination, timestamps, and balance deltas.
- **Inbound Receipts (`RCP-XXXX`)**: Goods intake with supplier logging, line-item quantities, and atomic stock increment on validation.
- **Outbound Deliveries (`DLV-XXXX`)**: Order fulfillment with **real-time shortage prevention**; validation is strictly rejected if on-hand warehouse stock is insufficient.
- **Internal Facility Transfers (`TRF-XXXX`)**: Inter-warehouse inventory relocation (`TRANSFER_OUT` & `TRANSFER_IN`) that maintains global stock balance.
- **Stock Adjustments & Scrap (`ADJ-XXXX`)**: Physical inventory cycle count reconciliations and damage write-offs with audit justifications.
- **Dynamic KPI Dashboard**: Real-time aggregated inventory metrics, facility distribution bars, category breakdowns, and recent activity logs.
- **Multi-Warehouse Routing**: Built-in support for multiple facilities:
  - **Central Depot** (`WH-CD`)
  - **North Hub** (`WH-NH`)
  - **Port Annex** (`WH-PA`)
  - **Retail Backstore** (`WH-RB`)
- **Authentication**: User management with `scrypt` key derivation, demo credentials, and OTP verification flow.
- **Dual-Mode Deployability**: Runs as a **fullstack Node.js + SQLite Express service** or as an **autonomous static SPA** with seamless in-browser storage fallback on static CDNs (Vercel, Netlify, Cloudflare Pages, GitHub Pages).

---

## 🚀 Deployment Guide

### Option A: 1-Click Static Deployment (Vercel / Netlify / Cloudflare / GitHub Pages)
When deployed on static hosts, StockSense IMS automatically utilizes its built-in client engine (pre-seeded with realistic warehouse data) so all operations, validations, shortage checks, and dashboards work 100% out of the box with zero backend server setup required.

#### 1. Deploy on Vercel
1. Import `murarijgadesh-arch/stocksense-ims` into [Vercel](https://vercel.com/new).
2. Framework Preset will auto-detect **Vite**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Click **Deploy**. (Uses `vercel.json` for SPA rewrites).

#### 2. Deploy on Netlify
1. Connect repository on [Netlify](https://app.netlify.com/start).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Click **Deploy Site**. (Uses `netlify.toml` and `public/_redirects`).

#### 3. Deploy on GitHub Pages
A pre-configured CI/CD workflow is included at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
1. Go to repository **Settings** &rarr; **Pages**.
2. Under **Build and deployment** &rarr; **Source**, select **GitHub Actions**.
3. Push to `main` — GitHub Actions will test, compile, and publish the application automatically.

---

### Option B: Fullstack Deployment with SQLite (Render / Railway / Docker / VPS)
When deployed with a Node.js runtime, StockSense IMS runs the full Express server with transactional SQLite database (`data/stocksense.db`).

#### 1. Deploy on Render
1. Create a **Web Service** on [Render](https://dashboard.render.com).
2. Connect this repository.
3. Environment: **Node**
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Click **Create Web Service**. (Pre-configured `render.yaml` is provided).

#### 2. Deploy with Docker
```bash
docker build -t stocksense-ims .
docker run -p 3000:3000 stocksense-ims
```

---

## 🛠️ Local Development

### Prerequisites
- **Node.js** >= 20.0.0 (Node 22 recommended)
- **npm** >= 9.0.0

### Getting Started

```bash
# 1. Clone repository
git clone https://github.com/murarijgadesh-arch/stocksense-ims.git
cd stocksense-ims

# 2. Install dependencies
npm install

# 3. Seed initial SQLite database
npm run db:seed

# 4. Start fullstack dev server (Express backend on :3000 + Vite proxy on :5173)
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Running Backend Unit & API Tests

```bash
npm test
```
Runs 10 unit tests verifying transactional rollbacks, shortage checks, duplicate validation blocks, and HTTP REST integration tests.

### Typecheck & Production Build

```bash
# Check TypeScript definitions
npm run typecheck

# Build frontend production bundle
npm run build

# Start production server serving dist/
npm start
```

---

## 📁 Repository Structure

```
stocksense-ims/
├── .github/workflows/deploy.yml  # GitHub Pages automated CI/CD
├── public/
│   ├── favicon.svg               # SVG application icon
│   └── _redirects                # SPA redirect rules for Cloudflare/Netlify
├── src/
│   ├── api/
│   │   ├── client.ts             # API client with automatic offline fallback
│   │   └── mockStore.ts          # In-browser storage store for static deployments
│   ├── components/ims/
│   │   ├── AuthView.tsx          # Login, Sign Up, & OTP screens
│   │   ├── Dashboard.tsx         # Live metrics, warehouse stock, recent documents
│   │   ├── Operations.tsx        # Receipts, Deliveries, Transfers, Adjustments
│   │   ├── Products.tsx          # Catalog, SKU management, stock thresholds
│   │   ├── SettingsView.tsx      # Multi-facility management & preferences
│   │   └── Sidebar.tsx           # Enterprise navigation sidebar
│   ├── server/
│   │   ├── api/                  # Express REST route controllers
│   │   ├── db/                   # SQLite database connection & seed logic
│   │   ├── services/             # Transactional stock & reference generators
│   │   ├── tests/                # Unit tests & API integration test suite
│   │   ├── validation/           # Zod request validation schemas
│   │   ├── app.ts                # Express application factory
│   │   └── server.ts             # Production server entrypoint
│   ├── types/                    # Shared TypeScript interfaces
│   ├── App.tsx                   # Main React component
│   ├── index.css                 # Tailwind CSS directives
│   └── main.tsx                  # React entry point
├── Dockerfile                    # Container definition for cloud hosting
├── index.html                    # Root HTML document
├── netlify.toml                  # Netlify deployment configuration
├── package.json                  # Root dependencies & scripts
├── postcss.config.js             # PostCSS Tailwind processor
├── render.yaml                   # Render 1-click fullstack blueprint
├── tailwind.config.js            # Tailwind theme tokens
├── tsconfig.json                 # TypeScript compiler configuration
├── vercel.json                   # Vercel SPA routing configuration
├── vite.config.ts                # Vite build config with @ alias & proxy
└── docs/
    └── API.md                    # Detailed REST API specification
```

---

## 👥 Authors & Team
- **Murari J** ([@murarijgadesh-arch](https://github.com/murarijgadesh-arch))
- **Kavingowtham** ([@kavingowtham07-web](https://github.com/kavingowtham07-web))
- **Naresh** ([@Naresh-its](https://github.com/Naresh-its))
- **Loknath M** ([@LOKNATH-M](https://github.com/LOKNATH-M))
- **StockSense Team** — *Odoo Hackathon GCET 2026*
