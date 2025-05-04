import { tool } from 'ai';
import { z } from 'zod';
import { budgetService } from '../../services/budget.service';
import { HTTPException } from 'hono/http-exception';
import { getYear, getMonth } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { Budget } from '../../database/schema';
import { db } from '../../database';
import { formatCurrency } from '../../utils/currency.utils';
import { createToolResponse, resolveCategoryId } from './shared';

export function createBudgetTools(userId: string) {
  return {
    createBudget: tool({
      description: 'Creates a monthly budget for a specific expense category.',
      parameters: z.object({
        categoryIdentifier: z.string().min(1).describe('Category name or ID.'),
        amount: z.number().positive('Budget amount.'),
        month: z.number().int().min(1).max(12).describe('Month number (1-12).'),
        year: z.number().int().min(1900).max(2100).describe('Full year (e.g., 2024).'),
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
              message: 'Which category?',
              options: categoryRes.options,
            });

          const payload = { category: categoryRes.id, amount, month, year };
          const newBudget = await budgetService.createBudget(userId, payload as any);
          return createToolResponse({
            success: true,
            message: `Budget set for ${month}/${year}.`,
            data: newBudget,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    listBudgets: tool({
      description: 'Lists existing budgets, optionally filtering by month and year.',
      parameters: z.object({
        month: z.number().int().min(1).max(12).optional().describe('Filter by month (1-12).'),
        year: z.number().int().min(1900).max(2100).optional().describe('Filter by year.'),
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
        categoryIdentifier: z.string().min(1).describe('Category name or ID.'),
        month: z
          .number()
          .int()
          .min(1)
          .max(12)
          .optional()
          .describe('Month (1-12), defaults to current.'),
        year: z
          .number()
          .int()
          .min(1900)
          .max(2100)
          .optional()
          .describe('Year, defaults to current.'),
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
        'Retrieves the budget summary (budgeted vs actual spending) for a specified period.',
      parameters: z.object({
        period: z
          .string()
          .optional()
          .describe(
            "Period like 'this month', 'last month', '2024-08'. Defaults to current month.",
          ),
      }),
      execute: async ({ period }) => {
        try {
          let queryParams: { month?: string; year?: string; duration?: string } = {
            duration: period || 'thisMonth',
          };
          const now = new Date();
          const currentMonth = getMonth(now) + 1;
          const currentYear = getYear(now);
          const yearMonthMatch = period?.match(/^(\d{4})-(\d{1,2})$/);

          if (yearMonthMatch) {
            queryParams = { year: yearMonthMatch[1], month: yearMonthMatch[2] };
          } else if (period === 'this month' || !period) {
            queryParams = { year: String(currentYear), month: String(currentMonth) };
          }

          const summaryData = await budgetService.getBudgetSummary(userId, queryParams);
          const message =
            summaryData.length > 0 ? `Budget summary loaded.` : `No budget data found.`;
          return createToolResponse({ success: true, message, data: summaryData });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    identifyBudgetForAction: tool({
      description:
        'Identifies a specific budget by category, month, and year for potential update or deletion. Requires confirmation.',
      parameters: z.object({
        categoryIdentifier: z.string().min(1).describe('Category name or ID.'),
        month: z.number().int().min(1).max(12).describe('Month (1-12).'),
        year: z.number().int().min(1900).max(2100).describe('Year (e.g., 2024).'),
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
              error: `Budget not found for ${categoryRes.id} in ${month}/${year}.`,
            });

          const details = `Budget for ${
            budget.category?.name ?? categoryIdentifier
          } (${month}/${year}), Amount: ${formatCurrency(budget.amount)}`;
          return createToolResponse({
            success: true,
            confirmationNeeded: true,
            id: budget.id,
            details: details,
            message: `Found ${details}. Confirm action (update amount or delete) and provide ID (${budget.id})?`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedUpdateBudget: tool({
      description:
        'Updates the amount of a specific budget AFTER confirmation, using its unique ID.',
      parameters: z.object({
        budgetId: z.string().describe('Exact unique ID of the budget.'),
        newAmount: z.number().positive('New positive budget amount.'),
      }),
      execute: async ({ budgetId, newAmount }) => {
        try {
          await budgetService.updateBudget(budgetId, userId, newAmount);
          return createToolResponse({
            success: true,
            message: `Budget (ID: ${budgetId}) updated.`,
          });
        } catch (error: any) {
          return createToolResponse({
            success: false,
            error: error instanceof HTTPException ? error.message : error.message,
          });
        }
      },
    }),

    executeConfirmedDeleteBudget: tool({
      description: 'Deletes a specific budget AFTER confirmation, using its unique ID.',
      parameters: z.object({
        budgetId: z.string().describe('Exact unique ID of the budget to delete.'),
      }),
      execute: async ({ budgetId }) => {
        try {
          const result = await budgetService.deleteBudget(budgetId, userId);
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
