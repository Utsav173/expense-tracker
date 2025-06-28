import { tool } from 'ai';
import { z } from 'zod';
import { debtService } from '../../services/debt.service';
import { HTTPException } from 'hono/http-exception';
import { format } from 'date-fns';
import { eq } from 'drizzle-orm';
import { Debts } from '../../database/schema';
import { db } from '../../database';
import {
  createToolResponse,
  resolveAccountId,
  resolveDateRangeForQuery,
  resolveDebtId,
  resolveUserId,
} from './shared';

type DebtUpdateApiPayload = {
  description?: string;
  duration?: string;
  frequency?: string;
};

export function createDebtTools(userId: string) {
  return {
    addDebt: tool({
      description: 'Records a new debt (money borrowed or lent). Requires associated account.',
      parameters: z.object({
        amount: z.number().positive('Principal amount. Example: 5000'),
        type: z
          .enum(['given', 'taken'])
          .describe("'given' (lent) or 'taken' (borrowed). Example: \"taken\""),
        involvedUserIdentifier: z
          .string()
          .min(1)
          .describe(
            'Name or email of the other person involved. Example: "John Doe" or "john.doe@example.com"',
          ),
        description: z
          .string()
          .optional()
          .describe('Brief description (optional). Example: "Loan for car repair"'),
        interestRate: z
          .number()
          .nonnegative()
          .optional()
          .default(0)
          .describe('Annual interest rate % (default 0). Example: 5.5'),
        interestType: z
          .enum(['simple', 'compound'])
          .default('simple')
          .describe('Interest type. Example: "compound"'),
        accountIdentifier: z
          .string()
          .min(1)
          .describe(
            'Name or ID of the associated account. Example: "My Bank Account" or "acc_123"',
          ),
        durationType: z
          .enum(['year', 'month', 'week', 'day', 'custom'])
          .describe('Duration type. Example: "month"'),
        frequency: z
          .number()
          .int()
          .positive()
          .optional()
          .describe(
            "Number of duration units (required if durationType is not 'custom'). Example: 12",
          ),
        customDateRangeDescription: z
          .string()
          .optional()
          .describe(
            "Specific date range 'YYYY-MM-DD,YYYY-MM-DD' (required if durationType is 'custom'). Example: \"2024-01-01,2024-12-31\"",
          ),
      }),
      execute: async (args) => {
        try {
          const {
            amount,
            type,
            involvedUserIdentifier,
            description,
            interestRate = 0,
            interestType = 'simple',
            accountIdentifier,
            durationType,
            frequency,
            customDateRangeDescription,
          } = args;

          const involvedUserRes = await resolveUserId(userId, involvedUserIdentifier);
          if ('error' in involvedUserRes)
            return createToolResponse({ success: false, error: involvedUserRes.error });
          if ('clarificationNeeded' in involvedUserRes)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which user?',
              options: involvedUserRes.options,
            });

          const accountRes = await resolveAccountId(userId, accountIdentifier);
          if ('error' in accountRes)
            return createToolResponse({ success: false, error: accountRes.error });
          if ('clarificationNeeded' in accountRes)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which account?',
              options: accountRes.options,
            });

          let apiDuration: string;
          let apiFrequency: string | undefined = undefined;

          if (durationType === 'custom') {
            if (!customDateRangeDescription)
              return createToolResponse({
                success: false,
                error: 'Custom date range description is required when duration type is custom.',
              });
            const dateRes = await resolveDateRangeForQuery(customDateRangeDescription);
            if (dateRes.error || !dateRes.startDate || !dateRes.endDate)
              return createToolResponse({
                success: false,
                error: dateRes.error || 'Invalid custom date range.',
              });
            apiDuration = `${format(dateRes.startDate, 'yyyy-MM-dd')},${format(
              dateRes.endDate,
              'yyyy-MM-dd',
            )}`;
          } else {
            if (!frequency)
              return createToolResponse({
                success: false,
                error: 'Frequency is required for non-custom duration types.',
              });
            apiDuration = durationType;
            apiFrequency = String(frequency);
          }

          const payload = {
            amount,
            type,
            user: involvedUserRes.id,
            description,
            interestType,
            percentage: interestRate,
            account: accountRes.id,
            duration: apiDuration,
            frequency: apiFrequency,
          };
          const newDebt = await debtService.createDebt(userId, payload as any);
          return createToolResponse({
            success: true,
            message: `Debt (${type}) recorded.`,
            data: newDebt,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    listDebts: tool({
      description: 'Lists debts (given or taken). Can filter by type.',
      parameters: z.object({
        type: z
          .enum(['given', 'taken'])
          .optional()
          .describe("Filter by 'given' or 'taken'. Example: \"given\""),
      }),
      execute: async ({ type }) => {
        try {
          const result = await debtService.getDebts(userId, { type }, 1, 100, 'dueDate', 'asc');
          const message =
            result.data.length > 0 ? `Found ${result.data.length} debts.` : 'No debts found.';
          return createToolResponse({ success: true, message: message, data: result.data });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    markDebtAsPaid: tool({
      description:
        'Identifies a debt by description/counterparty and asks for confirmation to mark it paid.',
      parameters: z.object({
        debtIdentifier: z
          .string()
          .min(1)
          .describe(
            'Information to identify the debt (e.g., \'loan from john\'). Example: "loan to Sarah" or "debt_abc123"',
          ),
      }),
      execute: async ({ debtIdentifier }) => {
        try {
          const resolved = await resolveDebtId(userId, debtIdentifier);
          if ('error' in resolved)
            return createToolResponse({ success: false, error: resolved.error });
          if ('clarificationNeeded' in resolved)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which debt do you want to mark as paid?',
              options: resolved.options,
            });

          const debt = await db.query.Debts.findFirst({
            where: eq(Debts.id, resolved.id),
            with: { involvedUser: { columns: { name: true } } },
          });
          const details = `Debt: ${debt?.description ?? debtIdentifier} involving ${
            debt?.involvedUser?.name ?? 'Unknown'
          }`;

          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: resolved.id,
            details: details,
            message: `Found ${details}. Mark this debt (ID: ${resolved.id}) as paid? Please confirm by providing the ID.`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedMarkDebtPaid: tool({
      description:
        'Marks a specific debt as paid AFTER user confirmation, using its exact unique ID.',
      parameters: z.object({
        debtId: z
          .string()
          .describe('The exact unique ID of the debt to mark paid. Example: "debt_abc123"'),
      }),
      execute: async ({ debtId }) => {
        try {
          const result = await debtService.markDebtAsPaid(debtId, userId);
          return createToolResponse({ success: true, message: result.message });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    identifyDebtForAction: tool({
      description:
        'Identifies a specific debt by description/counterparty for potential update or deletion. Requires confirmation.',
      parameters: z.object({
        debtIdentifier: z
          .string()
          .min(1)
          .describe(
            'Information to identify the debt (e.g., \'loan from john\'). Example: "loan from Jane" or "debt_def456"',
          ),
      }),
      execute: async ({ debtIdentifier }) => {
        try {
          const resolved = await resolveDebtId(userId, debtIdentifier);
          if ('error' in resolved)
            return createToolResponse({ success: false, error: resolved.error });
          if ('clarificationNeeded' in resolved)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which debt?',
              options: resolved.options,
            });

          const debt = await db.query.Debts.findFirst({
            where: eq(Debts.id, resolved.id),
            with: { involvedUser: { columns: { name: true } } },
          });
          const details = `Debt: ${debt?.description ?? debtIdentifier} (w/ ${
            debt?.involvedUser?.name ?? 'Unknown'
          }, Type: ${debt?.type}, Paid: ${debt?.isPaid})`;

          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: resolved.id,
            details: details,
            message: `Found ${details}. Confirm action (update description/duration or delete) and provide ID (${resolved.id})?`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedUpdateDebt: tool({
      description:
        'Updates description or duration/frequency of a debt AFTER confirmation, using its unique ID.',
      parameters: z.object({
        debtId: z.string().describe('Exact unique ID of the debt. Example: "debt_def456"'),
        newDescription: z
          .string()
          .optional()
          .describe('New description (optional). Example: "Updated loan description"'),
        newDurationType: z
          .enum(['year', 'month', 'week', 'day', 'custom'])
          .optional()
          .describe('New duration type (optional). Example: "month"'),
        newFrequency: z
          .number()
          .int()
          .positive()
          .optional()
          .describe(
            "New number of duration units (required if newDurationType is not 'custom'). Example: 6",
          ),
        newCustomDateRangeDescription: z
          .string()
          .optional()
          .describe(
            "New date range 'YYYY-MM-DD,YYYY-MM-DD' (required if newDurationType is 'custom'). Example: \"2025-01-01,2025-06-30\"",
          ),
      }),
      execute: async (args) => {
        const {
          debtId,
          newDescription,
          newDurationType,
          newFrequency,
          newCustomDateRangeDescription,
        } = args;
        try {
          const payload: Partial<DebtUpdateApiPayload> = {};
          if (newDescription) payload.description = newDescription;

          if (newDurationType) {
            if (newDurationType === 'custom') {
              if (!newCustomDateRangeDescription)
                return createToolResponse({
                  success: false,
                  error: "Custom date range description is required for 'custom' duration type.",
                });
              const dateRes = await resolveDateRangeForQuery(newCustomDateRangeDescription);
              if (dateRes.error || !dateRes.startDate || !dateRes.endDate)
                return createToolResponse({
                  success: false,
                  error: dateRes.error || 'Invalid custom date range for update.',
                });
              payload.duration = `${format(dateRes.startDate, 'yyyy-MM-dd')},${format(
                dateRes.endDate,
                'yyyy-MM-dd',
              )}`;
              payload.frequency = undefined;
            } else {
              if (!newFrequency)
                return createToolResponse({
                  success: false,
                  error: 'Frequency is required for non-custom duration types.',
                });
              payload.duration = newDurationType;
              payload.frequency = String(newFrequency);
            }
          } else if (newFrequency && !newDurationType) {
            const existingDebt = await db.query.Debts.findFirst({
              where: eq(Debts.id, debtId),
              columns: { duration: true },
            });
            if (existingDebt?.duration && !existingDebt.duration.includes(',')) {
              payload.frequency = String(newFrequency);
            } else {
              return createToolResponse({
                success: false,
                error:
                  "Duration type must be provided when updating frequency, or current type is 'custom'.",
              });
            }
          }

          if (Object.keys(payload).length === 0)
            return createToolResponse({
              success: false,
              error: 'No valid update fields provided.',
            });

          await debtService.updateDebt(debtId, userId, payload);
          return createToolResponse({ success: true, message: `Debt (ID: ${debtId}) updated.` });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedDeleteDebt: tool({
      description: 'Deletes a specific debt AFTER confirmation, using its unique ID.',
      parameters: z.object({
        debtId: z
          .string()
          .describe('Exact unique ID of the debt to delete. Example: "debt_ghi789"'),
      }),
      execute: async ({ debtId }) => {
        try {
          const result = await debtService.deleteDebt(debtId, userId);
          return createToolResponse({ success: true, message: result.message });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),
  };
}
