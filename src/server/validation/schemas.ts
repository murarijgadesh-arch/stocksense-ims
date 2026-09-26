import { z } from 'zod';

export const CreateProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required').trim(),
  name: z.string().min(1, 'Product name is required').trim(),
  category: z.string().min(1, 'Category is required').trim(),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required').trim(),
  lowStockThreshold: z.number().int().min(0).default(10),
});

export const UpdateProductSchema = z.object({
  sku: z.string().min(1).trim().optional(),
  name: z.string().min(1).trim().optional(),
  category: z.string().min(1).trim().optional(),
  unitOfMeasure: z.string().min(1).trim().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export const CreateWarehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').trim(),
  code: z.string().min(1, 'Warehouse code is required').trim(),
  location: z.string().optional(),
});

export const CreateReceiptItemSchema = z.object({
  productId: z.number().int().positive('Product ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

export const CreateReceiptSchema = z.object({
  supplier: z.string().min(1, 'Supplier is required').trim(),
  warehouseId: z.number().int().positive('Warehouse ID must be a positive integer'),
  items: z.array(CreateReceiptItemSchema).min(1, 'At least one item is required'),
});

export const CreateDeliveryItemSchema = z.object({
  productId: z.number().int().positive('Product ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

export const CreateDeliverySchema = z.object({
  customer: z.string().min(1, 'Customer is required').trim(),
  warehouseId: z.number().int().positive('Warehouse ID must be a positive integer'),
  items: z.array(CreateDeliveryItemSchema).min(1, 'At least one item is required'),
});

export const CreateTransferItemSchema = z.object({
  productId: z.number().int().positive('Product ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

export const CreateTransferSchema = z.object({
  fromWarehouseId: z.number().int().positive('Source warehouse ID must be a positive integer'),
  toWarehouseId: z.number().int().positive('Destination warehouse ID must be a positive integer'),
  items: z.array(CreateTransferItemSchema).min(1, 'At least one item is required'),
}).refine(data => data.fromWarehouseId !== data.toWarehouseId, {
  message: 'Source and destination warehouses must be different',
  path: ['toWarehouseId'],
});

export const CreateAdjustmentItemSchema = z.object({
  productId: z.number().int().positive('Product ID must be a positive integer'),
  quantityChange: z.number().int().refine(val => val !== 0, {
    message: 'Quantity change cannot be zero',
  }),
});

export const CreateAdjustmentSchema = z.object({
  warehouseId: z.number().int().positive('Warehouse ID must be a positive integer'),
  reason: z.string().min(1, 'Reason is required').trim(),
  items: z.array(CreateAdjustmentItemSchema).min(1, 'At least one item is required'),
});

export const SignupSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  otp: z.string().min(4, 'OTP is required'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  otp: z.string().min(4, 'OTP is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
