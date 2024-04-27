import { z } from 'zod';

export const userSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .transform((value) => value.trim()),
  email: z.string().email(),
  password: z.string().min(8).max(255),
  token: z.string().optional(),
  isSocial: z.boolean().optional(),
  profilePic: z.string().url().optional(),
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
  lastLoginAt: z.date().optional(),
  resetPasswordToken: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(255),
});

export const accountSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .transform((value) => value.trim()),
  balance: z.number().min(0),
});

export const userAccountSchema = z.object({
  userId: z.string().uuid(),
  accountId: z.string().uuid(),
});

export const transactionSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(255)
    .transform((value) => value.trim()),
  amount: z.number(),
  isIncome: z.boolean(),
  transfer: z.string().optional(),
  category: z.string().optional(),
  account: z.string().uuid(),
});

export const interestSchema = z.object({
  amount: z.number(),
  percentage: z.number().min(0).max(9999),
  duration: z.any(),
  type: z.enum(['simple', 'compound']),
});

export const debtSchema = z.object({
  amount: z.number(),
  premiumAmount: z.number().optional(),
  description: z
    .string()
    .max(255)
    .transform((value) => value.trim()),
  duration: z.number().optional(),
  percentage: z.number().optional(),
  frequency: z.number().optional(),
  user: z.string().uuid(),
  type: z.enum(['given', 'taken']),
  interestType: z.enum(['simple', 'compound']),
  account: z.string().uuid(),
});

export const categorySchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .transform((value) => value.trim()),
});

export const importDataSchema = z.object({
  account: z.string().uuid(),
  user: z.string().uuid(),
  data: z.any(),
  updatedAt: z.date(),
});
