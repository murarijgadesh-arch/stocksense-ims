import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { DatabaseSync } from 'node:sqlite';
import { ZodError } from 'zod';
import { AppError } from './services/stockService';
import { createProductsRouter } from './api/products';
import { createWarehousesRouter } from './api/warehouses';
import { createStockRouter } from './api/stock';
import { createReceiptsRouter } from './api/receipts';
import { createDeliveriesRouter } from './api/deliveries';
import { createTransfersRouter } from './api/transfers';
import { createAdjustmentsRouter } from './api/adjustments';
import { createLedgerRouter } from './api/ledger';
import { createDashboardRouter } from './api/dashboard';
import { createAuthRouter } from './api/auth';

export function createApp(db: DatabaseSync): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Mount API routers
  app.use('/api/products', createProductsRouter(db));
  app.use('/api/warehouses', createWarehousesRouter(db));
  app.use('/api/stock', createStockRouter(db));
  app.use('/api/receipts', createReceiptsRouter(db));
  app.use('/api/deliveries', createDeliveriesRouter(db));
  app.use('/api/transfers', createTransfersRouter(db));
  app.use('/api/adjustments', createAdjustmentsRouter(db));
  app.use('/api/ledger', createLedgerRouter(db));
  app.use('/api/dashboard', createDashboardRouter(db));
  app.use('/api/auth', createAuthRouter(db));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          details: err.errors,
        },
      });
    }

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
        },
      });
    }

    console.error('Unhandled server error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred',
      },
    });
  });

  return app;
}
