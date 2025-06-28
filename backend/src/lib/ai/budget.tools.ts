import { tool } from 'ai';
import { z } from 'zod';
import { budgetService } from '../../services/budget.service';
import { HTTPException } from 'hono/http-exception';
import { getYear, getMonth } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { Budget } from '../../database/schema';
import { db } from '../../database';
import { formatCurrency } from '../../utils/currency.utils';
import { createErrorResponse, createToolResponse, resolveCategoryId } from './shared';
import { parseNaturalLanguageDateRange } from '../../utils/nl_date.utils';

export function createBudgetTools(userId: string) {
  return {
    createBudget: tool({
      description:
        'Creates a monthly budget for a specific expense category. If month/year are omitted, defaults to the current month and year.',
      parameters: z.object({
        categoryIdentifier: z.string().min(1).describe('Category name or ID. Example: "Groceries" or "cat_abc123"'),
        amount: z.number().positive('Budget amount. Example: 500'),
        month: z
          .number()
          .int()
          .min(1)
          .max(12)
          .optional()
          .describe('Month number (1-12). Defaults to current month if omitted. Example: 7 for July'),
        year: z
          .number()
          .int()
          .min(1900)
          .max(2100)
          .optional()
          .describe('Full year (e.g., 2024). Defaults to current year if omitted. Example: 2024'),
      }),
      execute: async ({ categoryIdentifier, amount, month, year }) => {
        try {
          const categoryRes = await resolveCategoryId(userId, categoryIdentifier);
          if ('error' in categoryRes)
            return createToolResponse({ success: false, error: categoryRes.error });
          if ('clarificationNeeded' in categoryRes)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which category do you want to set a budget for?',
              options: categoryRes.options,
            });

          const targetMonth = month || getMonth(new Date()) + 1;
          const targetYear = year || getYear(new Date());

          const payload = {
            category: categoryRes.id,
            amount,
            month: targetMonth,
            year: targetYear,
          };
          const newBudget = await budgetService.createBudget(userId, payload as any);
          return createToolResponse({
            success: true,
            message: `Budget of ${formatCurrency(amount)} set for ${
              categoryRes.name || 'the selected category'
            } for ${targetMonth}/${targetYear}.`,
            data: newBudget,
          });
        } catch (error: any) {
          return createErrorResponse(error, 'Failed to create budget.');
        }
      },
    }),

    listBudgets: tool({
      description: 'Lists existing budgets, optionally filtering by month and year.',
      parameters: z.object({
        month: z.number().int().min(1).max(12).optional().describe('Filter by month (1-12). Example: 6 for June'),
        year: z.number().int().min(1900).max(2100).optional().describe('Filter by year. Example: 2023'),
      }),
      execute: async ({ month, year }) => {
        try {
          const result = await budgetService.getBudgets(userId, 1, 100, 'year', 'desc');
          let filteredData = result.data;
          if (month) filteredData = filteredData.filter((b) => b.month === month);
          if (year) filteredData = filteredData.filter((b) => b.year === year);

          const message =
            filteredData.length > 0 ? `Found ${filteredData.length} budgets.` : 'No budgets found.';
          return createToolResponse({ success: true, message: message, data: filteredData });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    getBudgetProgress: tool({
      description:
        'Retrieves spending progress against budget for a specific category in a given month/year (defaults to current).',
      parameters: z.object({
        categoryIdentifier: z.string().min(1).describe('Category name or ID. Example: "Utilities" or "cat_def456"'),
        month: z
          .number()
          .int()
          .min(1)
          .max(12)
          .optional()
          .describe('Month (1-12), defaults to current. Example: 8 for August'),
        year: z
          .number()
          .int()
          .min(1900)
          .max(2100)
          .optional()
          .describe('Year, defaults to current. Example: 2024'),
      }),
      execute: async ({ categoryIdentifier, month, year }) => {
        try {
          const targetMonth = month || getMonth(new Date()) + 1;
          const targetYear = year || getYear(new Date());

          const categoryRes = await resolveCategoryId(userId, categoryIdentifier);
          if ('error' in categoryRes)
            return createToolResponse({ success: false, error: categoryRes.error });
          if ('clarificationNeeded' in categoryRes)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which category?',
              options: categoryRes.options,
            });

          const budget = await db.query.Budget.findFirst({
            where: and(
              eq(Budget.userId, userId),
              eq(Budget.category, categoryRes.id),
              eq(Budget.month, targetMonth),
              eq(Budget.year, targetYear),
            ),
            columns: { id: true },
          });

          if (!budget)
            return createToolResponse({
              success: false,
              error: `No budget found for category "${categoryIdentifier}" in ${targetMonth}/${targetYear}.`,
            });

          const progressData = await budgetService.getBudgetProgress(budget.id, userId);
          return createToolResponse({ success: true, data: progressData });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    getBudgetSummary: tool({
      description:
        "Retrieves the budget summary (budgeted vs actual spending) for a specified period. Period can be natural language like 'this month', 'last month', or a specific month/year like 'August 2024'. Defaults to current month if unspecified.",
      parameters: z.object({
        periodDescription: z
          .string()
          .optional()
          .describe(
            "Period like 'this month', 'last month', '2024-08', 'August 2023'. Defaults to current month. Example: "last quarter" or "September 2024"",
          ),
      }),
      execute: async ({ periodDescription }) => {
        try {
          const effectivePeriodDesc = periodDescription || 'this month';
          const parsedDateRange = parseNaturalLanguageDateRange(effectivePeriodDesc);

          if (!parsedDateRange || !parsedDateRange.startDate || !parsedDateRange.endDate) {
            return createToolResponse({
              success: false,
              error: `Could not understand the period: "${effectivePeriodDesc}". Please try a common phrase or "Month YYYY".`,
            });
          }

          const queryParams = {
            duration: `${parsedDateRange.startDate.toISOString().split('T')[0]},${
              parsedDateRange.endDate.toISOString().split('T')[0]
            }`,
          };

          const summaryData = await budgetService.getBudgetSummary(userId, queryParams);
          const message =
            summaryData.length > 0
              ? `Budget summary for ${effectivePeriodDesc} loaded.`
              : `No budget data found for ${effectivePeriodDesc}.`;
          return createToolResponse({ success: true, message, data: summaryData });
        } catch (error: any) {
          return createErrorResponse(error, 'Failed to retrieve budget summary.');
        }
      },
    }),

    identifyBudgetForAction: tool({
      description:
        'Identifies a specific budget by category, month, and year for potential update or deletion. Requires confirmation.',
      parameters: z.object({
        categoryIdentifier: z.string().min(1).describe('Category name or ID. Example: "Rent" or "cat_ghi789"'),
        month: z.number().int().min(1).max(12).describe('Month (1-12). Example: 1 for January'),
        year: z.number().int().min(1900).max(2100).describe('Year (e.g., 2024). Example: 2023'),
      }),
      execute: async ({ categoryIdentifier, month, year }) => {
        try {
          const categoryRes = await resolveCategoryId(userId, categoryIdentifier);
          if ('error' in categoryRes)
            return createToolResponse({ success: false, error: categoryRes.error });
          if ('clarificationNeeded' in categoryRes)
            return createToolResponse({
              success: true,
              clarificationNeeded: true,
              message: 'Which category?',
              options: categoryRes.options,
            });

          const budget = await db.query.Budget.findFirst({
            where: and(
              eq(Budget.userId, userId),
              eq(Budget.category, categoryRes.id),
              eq(Budget.month, month),
              eq(Budget.year, year),
            ),
            columns: { id: true, amount: true },
            with: { category: { columns: { name: true } } },
          });

          if (!budget)
            return createToolResponse({
              success: false,
              error: `Budget not found for category "${
                categoryRes.name || categoryIdentifier
              }" in ${month}/${year}.`,
            });

          const details = `Budget for ${
            budget.category?.name ?? categoryIdentifier
          } (${month}/${year}), Amount: ${formatCurrency(budget.amount)}`;
          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: budget.id,
            details: details,
            message: `Found: ${details}. Please confirm the action (update amount or delete) by providing the ID: ${budget.id}.`,
          });
        } catch (error: any) {
          return createErrorResponse(error, 'Failed to identify budget.');
        }
      },
    }),

    executeConfirmedUpdateBudget: tool({
      description:
        'Updates the amount of a specific budget AFTER confirmation, using its unique ID.',
      parameters: z.object({
        budgetId: z.string().describe('Exact unique ID of the budget. Example: "bud_123xyz"'),
        newAmount: z.number().positive('New positive budget amount. Example: 750.00'),
      }),
      execute: async ({ budgetId, newAmount }) => {
        try {
          await budgetService.updateBudget(budgetId, userId, newAmount);
          return createToolResponse({
            success: true,
            message: `Budget (ID: ${budgetId}) amount updated to ${formatCurrency(newAmount)}.`,
          });
        } catch (error: any) {
          return createErrorResponse(error, 'Failed to update budget.');
        }
      },
    }),

    executeConfirmedDeleteBudget: tool({
      description: 'Deletes a specific budget AFTER confirmation, using its unique ID.',
      parameters: z.object({
        budgetId: z.string().describe('Exact unique ID of the budget to delete. Example: "bud_456abc"'),
      }),
      execute: async ({ budgetId }) => {
        try {
          const result = await budgetService.deleteBudget(budgetId, userId);
          return createToolResponse({ success: true, message: result.message });
        } catch (error: any) {
          return createErrorResponse(error, 'Failed to delete budget.');
        }
      },
    }),
  };
}
