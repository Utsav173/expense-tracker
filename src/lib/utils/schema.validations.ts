import * as z from 'zod';

export const interestSchema = z.object({
  amount: z.number().positive(),
  interestRate: z.number().min(0),
  termLength: z.number().int().positive(),
  termUnit: z.enum(['days', 'weeks', 'months', 'years']),
  interestType: z.enum(['simple', 'compound']),
  compoundingFrequency: z.number().int().positive().optional()
});

export const debtSchema = z.object({
  amount: z.number().positive('Amount must be positive.'),
  description: z.string().max(255).optional(),
  interestRate: z.number().min(0).default(0),
  interestType: z.enum(['simple', 'compound']),
  startDate: z.string().datetime().optional(),
  termLength: z.number().int().positive('Term length must be a positive integer.'),
  termUnit: z.enum(['days', 'weeks', 'months', 'years']),
  paymentFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  type: z.enum(['given', 'taken']),
  user: z.string().uuid('Involved user ID must be a valid UUID.'),
  account: z.string().uuid('Associated account ID must be a valid UUID.')
});

export type InterestFormSchema = z.infer<typeof interestSchema>;
export type DebtFormSchema = z.infer<typeof debtSchema>;

export const investmentHoldingUpdateSchema = z.object({
  shares: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Shares must be a positive number'
  }),
  purchasePrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Purchase price must be a non-negative number'
  }),
  purchaseDate: z.date({ required_error: 'Purchase date is required.' })
});

export const dividendUpdateSchema = z.object({
  dividend: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Dividend must be a non-negative number'
  })
});

export const inviteUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' })
});

export type InviteUserFormSchema = z.infer<typeof inviteUserSchema>;
