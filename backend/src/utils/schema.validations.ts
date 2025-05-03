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
  profilePic: z.any(),
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
  lastLoginAt: z.date().optional(),
  resetPasswordToken: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  preferredCurrency: z.string().optional(),
  profilePic: z.any(),
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
  currency: z.string().min(3).max(3, 'Currency must be 3 characters long'),
});

export const userAccountSchema = z.object({
  userId: z.string().uuid(),
  accountId: z.string().uuid(),
});

export const transactionSchema = z.object({
  text: z
    .string()
    .min(3, 'text must be at least 3 character long')
    .max(255)
    .transform((value) => value.trim()),
  amount: z.number(),
  isIncome: z.boolean(),
  transfer: z.string().optional(),
  category: z.string().optional(),
  account: z.string().uuid(),
  recurring: z.boolean().optional(),
  recurrenceType: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
  recurrenceEndDate: z.string().optional().nullable(),
  currency: z.string().optional(),
  createdAt: z.string().optional().nullable(),
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
  duration: z.union([z.string(), z.number()]).optional(),
  percentage: z.number().optional(),
  frequency: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === '' ? undefined : Number(val))),
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
  updatedAt: z
    .string()
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), { message: 'Invalid date format' }),
});

export const budgetSchema = z.object({
  categoryId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number(),
  amount: z.number(),
});

export const savingGoalSchema = z.object({
  name: z.string(),
  targetAmount: z.number(),
  targetDate: z
    .string()
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), { message: 'Invalid date format' }),
});

export const investmentAccountSchema = z.object({
  name: z.string(),
  platform: z.string(),
  currency: z.string(),
});
export const investmentSchema = z.object({
  symbol: z.string(),
  shares: z.number(),
  purchasePrice: z.number(),
  purchaseDate: z
    .string()
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), { message: 'Invalid date format' }),
});

export const historicalPortfolioQuerySchema = z
  .object({
    period: z.enum(['7d', '30d', '90d', '1y']).default('30d').optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
  })
  .refine(
    (data) => {
      // If either startDate or endDate is provided, both must be provided
      if (data.startDate || data.endDate) {
        return data.startDate && data.endDate;
      }
      return true;
    },
    {
      message: 'Both startDate and endDate must be provided when using custom date range',
    },
  )
  .refine(
    (data) => {
      // If using custom dates, period should not be provided
      if (data.startDate && data.endDate) {
        return !data.period;
      }
      return true;
    },
    {
      message: 'Cannot specify both period and custom date range',
    },
  );

export const aiApiKeySchema = z.object({
  apiKey: z.string().nullable().describe('The AI API key, or null to remove it.'),
});
