import * as z from 'zod';

export const interestSchema = z.object({
  debt: z.string(),
  amount: z.string().min(1, { message: 'Amount is required' }),
  type: z.enum(['simple', 'compound']),
  percentage: z.string().min(1, { message: 'Percentage is required' }),
  frequency: z.string().min(1, { message: 'Frequency is required' }),
  duration: z.enum(['day', 'week', 'month', 'year'])
});

export const debtSchema = z.object({
  user: z.string(),
  amount: z.string().min(1, { message: 'Amount is required' }),
  premiumAmount: z.string().optional(),
  description: z.string().min(1, { message: 'Description is required' }),
  dueDate: z.string().optional(),
  type: z.enum(['given', 'taken']),
  interestType: z.enum(['simple', 'compound']),
  account: z.string().min(1, { message: 'Account is required' }),
  percentage: z.string().optional(),
  frequency: z.string().optional()
});

export type InterestFormSchema = z.infer<typeof interestSchema>;
export type DebtFormSchema = z.infer<typeof debtSchema>;
