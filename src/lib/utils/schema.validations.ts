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
