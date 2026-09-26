import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import { SignupSchema, LoginSchema, ForgotPasswordSchema, VerifyOtpSchema, ResetPasswordSchema } from '../validation/schemas';
import { AppError } from '../services/stockService';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, combined: string): boolean {
  const [salt, storedHash] = combined.split(':');
  if (!salt || !storedHash) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

export function createAuthRouter(db: DatabaseSync): Router {
  const router = Router();

  // POST /api/auth/signup
  router.post('/signup', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = SignupSchema.parse(req.body);

      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(validated.email);
      if (existing) {
        throw new AppError('DUPLICATE_EMAIL', 'An account with this email already exists', 409);
      }

      const passwordHash = hashPassword(validated.password);

      db.prepare(`
        INSERT INTO users (name, email, password_hash, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(validated.name, validated.email, passwordHash);

      const created = db.prepare('SELECT id, name, email, created_at FROM users WHERE email = ?').get(validated.email) as any;

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: created.id,
            name: created.name,
            email: created.email,
            createdAt: created.created_at,
          },
          token: `demo-token-${created.id}-${Date.now()}`,
          message: 'Account created successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/auth/login
  router.post('/login', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = LoginSchema.parse(req.body);

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(validated.email) as any;
      if (!user) {
        throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      const isValid = verifyPassword(validated.password, user.password_hash);
      if (!isValid) {
        throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.created_at,
          },
          token: `demo-token-${user.id}-${Date.now()}`,
          message: 'Logged in successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/auth/forgot-password
  router.post('/forgot-password', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = ForgotPasswordSchema.parse(req.body);

      const user = db.prepare('SELECT id FROM users WHERE email = ?').get(validated.email);
      if (!user) {
        // Return 404 or success for user feedback
        throw new AppError('NOT_FOUND', 'User with this email does not exist', 404);
      }

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

      db.prepare(`
        INSERT INTO otp_tokens (email, token, expires_at)
        VALUES (?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET token = excluded.token, expires_at = excluded.expires_at
      `).run(validated.email, otp, expiresAt);

      res.json({
        success: true,
        data: {
          message: 'OTP has been generated for password reset (development mode: OTP provided)',
          email: validated.email,
          devOtp: otp, // For convenient hackathon demo
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/auth/verify-otp
  router.post('/verify-otp', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = VerifyOtpSchema.parse(req.body);

      const record = db.prepare('SELECT * FROM otp_tokens WHERE email = ?').get(validated.email) as any;
      if (!record) {
        throw new AppError('INVALID_OTP', 'No OTP request found for this email', 400);
      }

      if (Date.now() > record.expires_at) {
        throw new AppError('OTP_EXPIRED', 'OTP has expired', 400);
      }

      if (record.token !== validated.otp) {
        throw new AppError('INVALID_OTP', 'Invalid OTP code', 400);
      }

      res.json({
        success: true,
        data: {
          valid: true,
          message: 'OTP verified successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/auth/reset-password
  router.post('/reset-password', (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = ResetPasswordSchema.parse(req.body);

      const record = db.prepare('SELECT * FROM otp_tokens WHERE email = ?').get(validated.email) as any;
      if (!record || record.token !== validated.otp || Date.now() > record.expires_at) {
        throw new AppError('INVALID_OTP', 'Invalid or expired OTP', 400);
      }

      const passwordHash = hashPassword(validated.newPassword);
      db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(passwordHash, validated.email);
      db.prepare('DELETE FROM otp_tokens WHERE email = ?').run(validated.email);

      res.json({
        success: true,
        data: {
          message: 'Password reset successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export { hashPassword, verifyPassword };
