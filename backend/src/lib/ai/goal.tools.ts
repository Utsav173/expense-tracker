import { tool } from 'ai';
import { z } from 'zod';
import { goalService } from '../../services/goal.service';
import { HTTPException } from 'hono/http-exception';
import { startOfDay, parseISO, format, isBefore } from 'date-fns';
import { eq } from 'drizzle-orm';
import { SavingGoal } from '../../database/schema';
import { db } from '../../database';
import { formatCurrency } from '../../utils/currency.utils';
import { createToolResponse, resolveSavingGoalId, resolveSingleDate } from './shared';

type GoalApiPayload = {
  name?: string;
  targetAmount?: number;
  savedAmount?: number;
  targetDate?: string | null;
};

export function createGoalTools(userId: string) {
  return {
    createSavingGoal: tool({
      description: 'Creates a new saving goal.',
      parameters: z.object({
        goalName: z.string().min(1).describe("Name of the goal (e.g., 'Vacation Fund')."),
        targetAmount: z.number().positive('Target amount to save.'),
        targetDateDescription: z
          .string()
          .optional()
          .describe("Optional target date (e.g., 'end of year', '2025-12-31')."),
      }),
      execute: async ({ goalName, targetAmount, targetDateDescription }) => {
        try {
          const dateRes = await resolveSingleDate(targetDateDescription, false);
          if (dateRes.error) return createToolResponse({ success: false, error: dateRes.error });
          const targetDate = dateRes.singleDate;

          if (targetDate && isBefore(targetDate, startOfDay(new Date()))) {
            return createToolResponse({
              success: false,
              error: 'Target date cannot be in the past.',
            });
          }

          const payload = {
            name: goalName,
            targetAmount,
            targetDate: targetDate?.toISOString() || null,
          };
          const newGoal = await goalService.createGoal(userId, payload as any);
          return createToolResponse({
            success: true,
            message: `Saving goal "${newGoal.name}" created.`,
            data: newGoal,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    listSavingGoals: tool({
      description: 'Lists all current saving goals.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const result = await goalService.getGoals(userId, 1, 100, 'targetDate', 'asc');
          const message =
            result.data.length > 0 ? `Found ${result.data.length} goals.` : 'No goals found.';
          return createToolResponse({ success: true, message: message, data: result.data });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    findSavingGoal: tool({
      description:
        'Identifies a specific saving goal by name for potential action (update, delete, add/withdraw). Requires confirmation.',
      parameters: z.object({
        goalIdentifier: z.string().min(1).describe('Name or part of the name of the goal.'),
      }),
      execute: async ({ goalIdentifier }) => {
        try {
          const resolved = await resolveSavingGoalId(userId, goalIdentifier);
          if ('error' in resolved)
            return createToolResponse({ success: false, error: resolved.error });
          if ('clarificationNeeded' in resolved)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which saving goal?',
              options: resolved.options,
            });

          const goal = await db.query.SavingGoal.findFirst({
            where: eq(SavingGoal.id, resolved.id),
            columns: { name: true, targetAmount: true, savedAmount: true, targetDate: true },
          });
          const details = `Goal: ${goal?.name ?? goalIdentifier} (Target: ${formatCurrency(
            goal?.targetAmount ?? 0,
          )}, Saved: ${formatCurrency(goal?.savedAmount ?? 0)}, Due: ${
            goal?.targetDate ? format(parseISO(String(goal.targetDate)), 'yyyy-MM-dd') : 'N/A'
          })`;
          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: resolved.id,
            details: details,
            message: `Found ${details}. Confirm action (update, delete, add/withdraw amount) and provide ID (${resolved.id})?`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedUpdateGoal: tool({
      description:
        'Updates target amount or date of a saving goal AFTER confirmation, using its unique ID.',
      parameters: z.object({
        goalId: z.string().describe('Exact unique ID of the goal.'),
        newTargetAmount: z.number().positive().optional().describe('New target amount (optional).'),
        newTargetDateDescription: z
          .string()
          .optional()
          .describe(
            "New target date (e.g., '2026-01-01', 'end of next year') (optional). Use 'null' or empty string to remove date.",
          ),
      }),
      execute: async ({ goalId, newTargetAmount, newTargetDateDescription }) => {
        try {
          const payload: Partial<GoalApiPayload> = {};
          if (newTargetAmount !== undefined) payload.targetAmount = newTargetAmount;

          if (newTargetDateDescription !== undefined) {
            if (newTargetDateDescription === null || newTargetDateDescription.trim() === '') {
              payload.targetDate = null;
            } else {
              const dateRes = await resolveSingleDate(newTargetDateDescription, false);
              if (dateRes.error || !dateRes.singleDate)
                return createToolResponse({
                  success: false,
                  error: dateRes.error || 'Invalid target date for update.',
                });
              if (isBefore(dateRes.singleDate, startOfDay(new Date())))
                return createToolResponse({
                  success: false,
                  error: 'Target date cannot be in the past.',
                });
              payload.targetDate = String(dateRes.singleDate);
            }
          }

          if (Object.keys(payload).length === 0)
            return createToolResponse({
              success: false,
              error: 'No valid fields provided for update.',
            });

          await goalService.updateGoal(goalId, userId, payload as any);
          return createToolResponse({ success: true, message: `Goal (ID: ${goalId}) updated.` });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeAddAmountToGoalById: tool({
      description: 'Adds an amount to a specific saving goal using its unique ID.',
      parameters: z.object({
        goalId: z.string().describe('The exact unique ID of the saving goal.'),
        amountToAdd: z.number().positive('The amount to add.'),
      }),
      execute: async ({ goalId, amountToAdd }) => {
        try {
          await goalService.addAmountToGoal(goalId, userId, amountToAdd);
          return createToolResponse({
            success: true,
            message: `Amount added to goal (ID: ${goalId}).`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeWithdrawAmountFromGoalById: tool({
      description: 'Withdraws an amount from a specific saving goal using its unique ID.',
      parameters: z.object({
        goalId: z.string().describe('The exact unique ID of the saving goal.'),
        amountToWithdraw: z.number().positive('The amount to withdraw.'),
      }),
      execute: async ({ goalId, amountToWithdraw }) => {
        try {
          await goalService.withdrawAmountFromGoal(goalId, userId, amountToWithdraw);
          return createToolResponse({
            success: true,
            message: `Amount withdrawn from goal (ID: ${goalId}).`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedDeleteGoal: tool({
      description: 'Deletes a specific saving goal AFTER confirmation, using its unique ID.',
      parameters: z.object({
        goalId: z.string().describe('The exact unique ID of the goal to delete.'),
      }),
      execute: async ({ goalId }) => {
        try {
          const result = await goalService.deleteGoal(goalId, userId);
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
